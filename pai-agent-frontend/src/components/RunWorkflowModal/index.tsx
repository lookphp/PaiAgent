import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  Button,
  Spin,
  Card,
  Typography,
  Alert,
  Divider,
  Space,
  Timeline,
  Tag,
  Progress,
  message,
  Checkbox,
  Empty,
} from 'antd';
import {
  PlayCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SoundOutlined,
  FileTextOutlined,
  RobotOutlined,
  ToolOutlined,
  UserOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EditOutlined,
  CloseOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';
import type { ExecutionEvent } from '../../types/workflow';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface RunWorkflowModalProps {
  open: boolean;
  onClose: () => void;
}

interface ExecutionLog {
  id: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'suspended';
  nodeType?: string;
  nodeLabel?: string;
  durationMs?: number;
  output?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

interface SuspendedData {
  executionId: number;
  nodeId: string;
  nodeType: string;
  output: string;
}

const RunWorkflowModal: React.FC<RunWorkflowModalProps> = ({ open, onClose }) => {
  const { currentWorkflow, nodes, edges, setNodeExecutionStatus, clearAllNodeExecutionStatus } = useWorkflowStore();
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'running' | 'suspended' | 'result'>('input');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    output?: string;
    audioUrl?: string;
    error?: string;
    totalDuration?: number;
    totalTokens?: number;
    totalInputTokens?: number;
    totalOutputTokens?: number;
  } | null>(null);

  // 暂停相关状态
  const [suspendConfig, setSuspendConfig] = useState<string[]>([]);
  const [suspendedData, setSuspendedData] = useState<SuspendedData | null>(null);
  const [editedOutput, setEditedOutput] = useState('');

  // SSE 关闭函数
  const [closeSSE, setCloseSSE] = useState<(() => void) | null>(null);

  // 重置状态
  useEffect(() => {
    if (open) {
      setInput('');
      setIsRunning(false);
      setCurrentStep('input');
      setLogs([]);
      setProgress(0);
      setResult(null);
      setSuspendConfig([]);
      setSuspendedData(null);
      setEditedOutput('');
      clearAllNodeExecutionStatus();
    }
  }, [open, clearAllNodeExecutionStatus]);

  const handleRun = async () => {
    if (!input.trim() || isRunning) return;

    // 校验 1: 检查是否有连线
    if (edges.length === 0) {
      message.warning('请先连接节点，再执行工作流');
      return;
    }

    // 校验 2: 检查 LLM 节点是否配置了 API Key
    const llmNodes = nodes.filter((n) => n.type === 'llm');
    const llmWithoutApiKey = llmNodes.filter((n) => !n.data?.apiKey);
    if (llmWithoutApiKey.length > 0) {
      message.error(
        `LLM 节点 "${llmWithoutApiKey[0].data?.label || '未命名'}" 未配置 API Key，请先配置`
      );
      return;
    }

    // 校验 3: 检查工具节点是否配置了 API Key
    const toolNodes = nodes.filter((n) => n.type === 'tool');
    const toolWithoutApiKey = toolNodes.filter((n) => !n.data?.apiKey);
    if (toolWithoutApiKey.length > 0) {
      message.error(
        `工具节点 "${toolWithoutApiKey[0].data?.label || '未命名'}" 未配置 API Key，请先配置`
      );
      return;
    }

    setIsRunning(true);
    setCurrentStep('running');
    setResult(null);
    setSuspendedData(null);
    setProgress(5);
    clearAllNodeExecutionStatus();

    // 使用 SSE 实时执行
    const request = {
      workflowId: currentWorkflow?.id ? Number(currentWorkflow.id) : 0,
      input: input,
      parameters: currentWorkflow?.id ? undefined : {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      },
      suspendOnNodeTypes: suspendConfig.length > 0 ? suspendConfig : undefined,
    };

    const closeConnection = workflowApi.executeStream(
      request,
      (event: ExecutionEvent) => {
        const { eventType, nodeId, nodeType, nodeLabel, status, output, durationMs, inputTokens, outputTokens, totalTokens, error, finalOutput, audioUrl, totalDuration } = event;

        if (eventType === 'node_start' && nodeId) {
          // 节点开始执行
          setNodeExecutionStatus(nodeId, 'running');
          setProgress((prev) => Math.min(90, prev + 15));
        } else if (eventType === 'node_complete' && nodeId) {
          // 节点执行完成
          setNodeExecutionStatus(nodeId, 'completed');
          setLogs((prev) => [...prev, {
            id: `log-${nodeId}-${Date.now()}`,
            message: `${nodeLabel} 执行完成`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'success',
            nodeType: nodeType,
            nodeLabel: nodeLabel,
            durationMs: durationMs,
            output: output,
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            totalTokens: totalTokens,
          }]);
          setProgress((prev) => Math.min(90, prev + 20));
        } else if (eventType === 'workflow_suspended' && nodeId) {
          // 工作流暂停（SSE 模式）
          setIsRunning(false);
          setCurrentStep('suspended');
          setSuspendedData({
            executionId: 0, // SSE 模式下没有真正的 executionId
            nodeId: nodeId,
            nodeType: nodeType || '',
            output: output || '',
          });
          setEditedOutput(output || '');
          // 记录暂停节点的日志
          setLogs((prev) => [...prev, {
            id: `log-${nodeId}-${Date.now()}`,
            message: `${nodeLabel} 执行完成（已暂停）`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'suspended',
            nodeType: nodeType,
            nodeLabel: nodeLabel,
            durationMs: durationMs,
            output: output,
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            totalTokens: totalTokens,
          }]);
        } else if (eventType === 'workflow_complete') {
          // 工作流完成
          console.log('[WorkflowModal] workflow_complete event:', { finalOutput, audioUrl, totalDuration });
          setProgress(100);
          setIsRunning(false);
          setCurrentStep('result');
          setResult({
            success: true,
            output: finalOutput,
            audioUrl: audioUrl,
            totalDuration: totalDuration,
            totalTokens: totalTokens,
            totalInputTokens: inputTokens,
            totalOutputTokens: outputTokens,
          });
        } else if (eventType === 'workflow_error') {
          // 工作流出错
          setProgress(100);
          setIsRunning(false);
          setCurrentStep('result');
          if (nodeId) {
            setNodeExecutionStatus(nodeId, 'error');
          }
          setResult({
            success: false,
            error: error,
          });
        }
      },
      (error: Error) => {
        setProgress(100);
        setIsRunning(false);
        setCurrentStep('result');
        setResult({
          success: false,
          error: error.message || '执行失败',
        });
      }
    );

    setCloseSSE(() => closeConnection);
  };

  // 继续执行（恢复）
  const handleResume = async () => {
    if (!suspendedData || !editedOutput.trim() || isRunning) return;

    // SSE 模式：executionId 为 0，从暂停节点之后继续执行
    if (suspendedData.executionId === 0) {
      setIsRunning(true);
      setCurrentStep('running');
      setProgress(50);
      clearAllNodeExecutionStatus();

      const request = {
        workflowId: currentWorkflow?.id ? Number(currentWorkflow.id) : 0,
        input: editedOutput,
        parameters: currentWorkflow?.id ? undefined : {
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
        },
        suspendOnNodeTypes: suspendConfig.length > 0 ? suspendConfig : undefined,
        // 从暂停节点之后继续执行
        resumeFromNodeId: suspendedData.nodeId,
        // 传递修改后的输出作为 lastOutput
        initialVariables: {
          lastOutput: editedOutput,
          [`node_output_${suspendedData.nodeId}`]: editedOutput,
        },
      };

      const closeConnection = workflowApi.executeStream(
        request,
        (event: ExecutionEvent) => {
          // 事件处理逻辑同 handleRun
          const { eventType, nodeId, nodeType, nodeLabel, status, output, durationMs, inputTokens, outputTokens, totalTokens, error, finalOutput, audioUrl, totalDuration } = event;

          if (eventType === 'node_start' && nodeId) {
            setNodeExecutionStatus(nodeId, 'running');
            setProgress((prev) => Math.min(90, prev + 15));
          } else if (eventType === 'node_complete' && nodeId) {
            setNodeExecutionStatus(nodeId, 'completed');
            setLogs((prev) => [...prev, {
              id: `log-${nodeId}-${Date.now()}`,
              message: `${nodeLabel} 执行完成`,
              timestamp: new Date().toLocaleTimeString(),
              status: 'success',
              nodeType: nodeType,
              nodeLabel: nodeLabel,
              durationMs: durationMs,
              output: output,
              inputTokens: inputTokens,
              outputTokens: outputTokens,
              totalTokens: totalTokens,
            }]);
            setProgress((prev) => Math.min(90, prev + 20));
          } else if (eventType === 'workflow_suspended' && nodeId) {
            setIsRunning(false);
            setCurrentStep('suspended');
            setSuspendedData({
              executionId: 0,
              nodeId: nodeId,
              nodeType: nodeType || '',
              output: output || '',
            });
            setEditedOutput(output || '');
            setLogs((prev) => [...prev, {
              id: `log-${nodeId}-${Date.now()}`,
              message: `${nodeLabel} 执行完成（已暂停）`,
              timestamp: new Date().toLocaleTimeString(),
              status: 'suspended',
              nodeType: nodeType,
              nodeLabel: nodeLabel,
              durationMs: durationMs,
              output: output,
              inputTokens: inputTokens,
              outputTokens: outputTokens,
              totalTokens: totalTokens,
            }]);
          } else if (eventType === 'workflow_complete') {
            setProgress(100);
            setIsRunning(false);
            setCurrentStep('result');
            setResult({
              success: true,
              output: finalOutput,
              audioUrl: audioUrl,
              totalDuration: totalDuration,
              totalTokens: totalTokens,
              totalInputTokens: inputTokens,
              totalOutputTokens: outputTokens,
            });
          } else if (eventType === 'workflow_error') {
            setProgress(100);
            setIsRunning(false);
            setCurrentStep('result');
            if (nodeId) {
              setNodeExecutionStatus(nodeId, 'error');
            }
            setResult({
              success: false,
              error: error,
            });
          }
        },
        (error: Error) => {
          setProgress(100);
          setIsRunning(false);
          setCurrentStep('result');
          setResult({
            success: false,
            error: error.message || '执行失败',
          });
        }
      );

      setCloseSSE(() => closeConnection);
      return;
    }

    // 传统模式：使用 resumeExecution API
    setIsRunning(true);
    setCurrentStep('running');

    try {
      const response = await workflowApi.resumeExecution(suspendedData.executionId, {
        modifiedOutput: editedOutput,
      });

      // 使用真实返回的日志，只保留节点执行完成的日志
      if (response.logs && response.logs.length > 0) {
        const nodeLogs = response.logs.filter((log: any) => log.nodeType);
        const realLogs: ExecutionLog[] = nodeLogs.map((log: any, index: number) => ({
          id: `log-${index}`,
          message: log.message,
          timestamp: new Date().toLocaleTimeString(),
          status: 'success',
          nodeType: log.nodeType,
          nodeLabel: log.nodeLabel,
          durationMs: log.durationMs,
          output: log.output,
          inputTokens: log.inputTokens,
          outputTokens: log.outputTokens,
          totalTokens: log.totalTokens,
        }));
        setLogs(realLogs);
        setProgress(75);
      }

      // 处理再次暂停
      if (response.status?.toLowerCase() === 'suspended' && response.executionId) {
        setSuspendedData({
          executionId: response.executionId,
          nodeId: response.suspendedNodeId || '',
          nodeType: response.suspendedNodeType || '',
          output: response.suspendedOutput || '',
        });
        setEditedOutput(response.suspendedOutput || '');
        setCurrentStep('suspended');
        setIsRunning(false);
        return;
      }

      setProgress(100);
      setCurrentStep('result');

      if (response.success) {
        setResult({
          success: true,
          output: response.output,
          audioUrl: response.audioUrl,
          totalDuration: response.totalDuration,
          totalTokens: response.totalTokens,
          totalInputTokens: response.totalInputTokens,
          totalOutputTokens: response.totalOutputTokens,
        });
      } else {
        setResult({
          success: false,
          error: response.error,
        });
      }
    } catch (error: any) {
      setCurrentStep('result');
      setResult({
        success: false,
        error: error.message || '恢复执行失败',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 取消执行
  const handleCancelExecution = async () => {
    if (!suspendedData) return;

    try {
      await workflowApi.cancelExecution(suspendedData.executionId);
      setCurrentStep('input');
      setLogs([]);
      setProgress(0);
      setSuspendedData(null);
    } catch (error: any) {
      message.error('取消失败: ' + error.message);
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      // 关闭 SSE 连接
      if (closeSSE) {
        closeSSE();
      }
      onClose();
    }
  };

  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'input':
        return <UserOutlined />;
      case 'llm':
        return <RobotOutlined />;
      case 'tool':
        return <ToolOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  const getNodeColor = (type?: string) => {
    switch (type) {
      case 'input':
        return '#52c41a';
      case 'llm':
        return '#722ed1';
      case 'tool':
        return '#fa8c16';
      default:
        return '#1890ff';
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlayCircleOutlined style={{ color: '#10b981' }} />
          <span>运行工作流</span>
          {currentStep === 'running' && (
            <Tag color="processing" icon={<LoadingOutlined spin />}>
              执行中
            </Tag>
          )}
          {currentStep === 'suspended' && (
            <Tag color="orange" icon={<EditOutlined />}>
              暂停编辑
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={800}
      footer={null}
      closable={!isRunning && currentStep !== 'suspended'}
      mask={{ closable: !isRunning && currentStep !== 'suspended' }}
    >
      {/* 输入阶段 */}
      {currentStep === 'input' && (
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              请输入要处理的内容，工作流将对内容进行 AI 处理并生成音频。
            </Text>
          </div>
          <TextArea
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要处理的内容..."
            style={{ marginBottom: 16 }}
          />

          {/* 暂停配置 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>执行选项</Text>
            </div>
            <Space orientation="vertical">
              <Checkbox
                checked={suspendConfig.includes('llm')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSuspendConfig(['llm']);
                  } else {
                    setSuspendConfig([]);
                  }
                }}
              >
                <Space>
                  <Tag color="purple" style={{ fontSize: 11 }}>LLM</Tag>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    LLM 输出后暂停，允许编辑
                  </Text>
                </Space>
              </Checkbox>
            </Space>
          </Card>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Card size="small" style={{ flex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#667eea' }}>
                  {nodes.length}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>节点</div>
              </div>
            </Card>
            <Card size="small" style={{ flex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                  {edges.length}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>连接</div>
              </div>
            </Card>
            <Card size="small" style={{ flex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                  {nodes.filter((n) => n.type === 'llm').length}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>大模型</div>
              </div>
            </Card>
          </div>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRun}
            disabled={!input.trim()}
            block
            size="large"
            style={{
              background: '#10b981',
              borderColor: '#10b981',
            }}
          >
            开始执行
          </Button>
        </div>
      )}

      {/* 执行中阶段 */}
      {currentStep === 'running' && (
        <div style={{ padding: '16px 0' }}>
          {/* 总体进度 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>总体进度</Text>
              <Text style={{ float: 'right' }}>{progress}%</Text>
            </div>
            <Progress percent={progress} status="active" strokeColor="#10b981" />
            <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              正在依次执行各节点，请稍候...
            </div>
          </Card>

          {/* 执行日志时间线 */}
          <Card
            title={<span>执行详情</span>}
            size="small"
            style={{ maxHeight: 350, overflow: 'auto' }}
          >
            <Timeline
              mode="start"
              items={[
                {
                  key: 'start',
                  icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                  content: (
                    <div>
                      <Text strong>开始执行</Text>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        输入内容: {input.slice(0, 50)}{input.length > 50 ? '...' : ''}
                      </div>
                    </div>
                  ),
                },
                ...logs.map((log) => ({
                  key: log.id,
                  icon:
                    log.status === 'running' ? (
                      <LoadingOutlined spin style={{ color: '#1890ff' }} />
                    ) : log.status === 'success' ? (
                      <CheckOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: '#999' }} />
                    ),
                  color:
                    log.status === 'success'
                      ? 'green'
                      : log.status === 'running'
                      ? 'blue'
                      : 'gray',
                  content: (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 0',
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          background: getNodeColor(log.nodeType),
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        {getNodeIcon(log.nodeType)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>
                          {log.nodeLabel}
                          {log.timestamp && (
                            <span style={{ fontSize: 11, color: '#999', marginLeft: 8, fontWeight: 400 }}>
                              {log.timestamp}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {log.status === 'pending' && '等待执行'}
                          {log.status === 'running' && '执行中...'}
                          {log.status === 'success' && (
                            <span>
                              执行完成 {log.durationMs ? `(${log.durationMs}ms)` : ''}
                              {log.totalTokens && log.totalTokens > 0 && (
                                <span style={{ color: '#1677ff', marginLeft: 8 }}>
                                  Token: {log.totalTokens.toLocaleString()}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <Tag
                        color={
                          log.status === 'success'
                            ? 'success'
                            : log.status === 'running'
                            ? 'processing'
                            : 'default'
                        }
                      >
                        {log.status === 'pending' && '等待'}
                        {log.status === 'running' && '执行中'}
                        {log.status === 'success' && '完成'}
                      </Tag>
                    </div>
                  ),
                })),
              ]}
            />
          </Card>
        </div>
      )}

      {/* 暂停编辑阶段 */}
      {currentStep === 'suspended' && suspendedData && (
        <div style={{ padding: '16px 0' }}>
          <Alert
            type="info"
            showIcon
            title="工作流已暂停"
            description={`节点 "${suspendedData.nodeType}" 执行完成，您可以编辑输出内容后继续执行`}
            style={{ marginBottom: 16 }}
          />

          {/* 执行日志 */}
          <Card
            title={<span>执行详情</span>}
            size="small"
            style={{ maxHeight: 200, overflow: 'auto', marginBottom: 16 }}
          >
            <Timeline
              mode="start"
              items={logs.map((log) => ({
                key: log.id,
                icon: <CheckOutlined style={{ color: '#52c41a' }} />,
                color: 'green',
                content: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: getNodeColor(log.nodeType),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                      }}
                    >
                      {getNodeIcon(log.nodeType)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{log.nodeLabel}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        执行完成 {log.durationMs ? `(${log.durationMs}ms)` : ''}
                      </div>
                    </div>
                    <Tag color="success">完成</Tag>
                  </div>
                ),
              }))}
            />
          </Card>

          {/* 编辑区域 */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <EditOutlined style={{ marginRight: 8 }} />
                  编辑输出内容
                </span>
                <Tag style={{ fontSize: 11 }}>{editedOutput?.length || 0} 字符</Tag>
              </div>
            }
            size="small"
          >
            <TextArea
              rows={6}
              value={editedOutput}
              onChange={(e) => setEditedOutput(e.target.value)}
              placeholder="编辑节点输出内容..."
              style={{ marginBottom: 16, fontFamily: 'monospace' }}
            />
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancelExecution}
              >
                取消执行
              </Button>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleResume}
                disabled={!editedOutput.trim()}
              >
                继续执行
              </Button>
            </Space>
          </Card>
        </div>
      )}

      {/* 结果阶段 */}
      {currentStep === 'result' && result && (
        <div style={{ padding: '16px 0' }}>
          {result.success ? (
            <>
              <Alert
                title="执行成功"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* 执行统计 */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>执行节点</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{nodes.length}</div>
                  </div>
                  <Divider orientation="vertical" style={{ height: 40 }} />
                  <div style={{ flex: 1, textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>总耗时</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      {result.totalDuration ? `${result.totalDuration}ms` : `${logs.reduce((sum, log) => sum + (log.durationMs || 0), 0)}ms`}
                    </div>
                  </div>
                  <Divider orientation="vertical" style={{ height: 40 }} />
                  <div style={{ flex: 1, textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>Token 使用</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                      {result.totalTokens?.toLocaleString() || 0}
                    </div>
                    {result.totalTokens && result.totalTokens > 0 && (
                      <div style={{ fontSize: 11, color: '#999' }}>
                        输入 {result.totalInputTokens?.toLocaleString() || 0} / 输出 {result.totalOutputTokens?.toLocaleString() || 0}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* 执行详情（时间线） */}
              <Card
                title={<span><ClockCircleOutlined /> 执行详情</span>}
                size="small"
                style={{ marginBottom: 16, maxHeight: 300, overflow: 'auto' }}
              >
                <Timeline
                  mode="start"
                  items={[
                    {
                      key: 'start',
                      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                      content: (
                        <div>
                          <Text strong>开始执行</Text>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            输入内容: {input.slice(0, 50)}{input.length > 50 ? '...' : ''}
                          </div>
                        </div>
                      ),
                    },
                    ...logs.map((log) => ({
                      key: log.id,
                      icon:
                        log.status === 'running' ? (
                          <LoadingOutlined spin style={{ color: '#1890ff' }} />
                        ) : log.status === 'success' ? (
                          <CheckOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <ClockCircleOutlined style={{ color: '#999' }} />
                        ),
                      color:
                        log.status === 'success'
                          ? 'green'
                          : log.status === 'running'
                          ? 'blue'
                          : 'gray',
                      content: (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 0',
                          }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              background: getNodeColor(log.nodeType),
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                            }}
                          >
                            {getNodeIcon(log.nodeType)}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>
                              {log.nodeLabel}
                              {log.timestamp && (
                                <span style={{ fontSize: 11, color: '#999', marginLeft: 8, fontWeight: 400 }}>
                                  {log.timestamp}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {log.status === 'pending' && '等待执行'}
                              {log.status === 'running' && '执行中...'}
                              {log.status === 'success' && (
                                <span>
                                  执行完成 {log.durationMs ? `(${log.durationMs}ms)` : ''}
                                  {log.totalTokens && log.totalTokens > 0 && (
                                    <span style={{ color: '#1677ff', marginLeft: 8 }}>
                                      Token: {log.totalTokens.toLocaleString()}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <Tag
                            color={
                              log.status === 'success'
                                ? 'success'
                                : log.status === 'running'
                                ? 'processing'
                                : 'default'
                            }
                          >
                            {log.status === 'pending' && '等待'}
                            {log.status === 'running' && '执行中'}
                            {log.status === 'success' && '完成'}
                          </Tag>
                        </div>
                      ),
                    })),
                  ]}
                />
              </Card>

              {/* 文本输出 */}
              {result.output && (
                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><FileTextOutlined /> 文本输出</span>
                      <Space>
                        <Tag style={{ fontSize: 11 }}>{result.output.length} 字符</Tag>
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(result.output || '');
                            message.success('已复制到剪贴板');
                          }}
                        >
                          复制
                        </Button>
                      </Space>
                    </div>
                  }
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  <div
                    style={{
                      padding: 12,
                      background: '#f6ffed',
                      borderRadius: 6,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {result.output}
                    </Text>
                  </div>
                </Card>
              )}

              {/* 音频输出 */}
              {result.audioUrl && (
                <Card
                  title={<span><SoundOutlined /> 音频输出</span>}
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  <AudioPlayer
                    src={result.audioUrl}
                    layout="horizontal-reverse"
                    showJumpControls={false}
                    customVolumeControls={[]}
                    customAdditionalControls={[]}
                  />
                </Card>
              )}

              <Divider />

              <Space>
                <Button onClick={handleClose}>关闭</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setCurrentStep('input');
                    setLogs([]);
                    setProgress(0);
                    setResult(null);
                    setInput('');
                    clearAllNodeExecutionStatus();
                  }}
                >
                  再次运行
                </Button>
              </Space>
            </>
          ) : (
            <>
              <Alert
                title="执行失败"
                description={result.error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* 执行详情（失败时显示） */}
              {logs.length > 0 && (
                <Card
                  title={<span><ClockCircleOutlined /> 执行详情</span>}
                  size="small"
                  style={{ marginBottom: 16, maxHeight: 250, overflow: 'auto' }}
                >
                  <Timeline
                    mode="start"
                    items={logs.map((log) => ({
                      key: log.id,
                      icon: <CheckOutlined style={{ color: '#52c41a' }} />,
                      color: 'green',
                      content: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              background: getNodeColor(log.nodeType),
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                            }}
                          >
                            {getNodeIcon(log.nodeType)}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{log.nodeLabel}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              执行完成 {log.durationMs ? `(${log.durationMs}ms)` : ''}
                            </div>
                          </div>
                          <Tag color="success">完成</Tag>
                        </div>
                      ),
                    }))}
                  />
                </Card>
              )}

              <Space>
                <Button onClick={handleClose}>关闭</Button>
                <Button
                  onClick={() => {
                    setCurrentStep('input');
                    setLogs([]);
                    setProgress(0);
                    setResult(null);
                    clearAllNodeExecutionStatus();
                  }}
                >
                  重试
                </Button>
              </Space>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default RunWorkflowModal;
