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
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';

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
  status: 'pending' | 'running' | 'success' | 'error';
  nodeType?: string;
  nodeLabel?: string;
  durationMs?: number;
  output?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

const RunWorkflowModal: React.FC<RunWorkflowModalProps> = ({ open, onClose }) => {
  const { currentWorkflow, nodes, edges } = useWorkflowStore();
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'running' | 'result'>('input');
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

  // 重置状态
  useEffect(() => {
    if (open) {
      setInput('');
      setIsRunning(false);
      setCurrentStep('input');
      setLogs([]);
      setProgress(0);
      setResult(null);
    }
  }, [open]);

  // 模拟执行进度
  const simulateExecution = () => {
    const nodeExecutionOrder = nodes
      .filter((n) => n.type !== 'output')
      .map((n, index) => ({
        id: `${n.id}-${index}`,
        nodeId: n.id,
        nodeType: n.type,
        nodeLabel: String(n.data?.label || n.type),
        status: 'pending' as const,
      }));

    // 初始状态：全部待执行
    const initialLogs: ExecutionLog[] = nodeExecutionOrder.map((node) => ({
      id: node.id,
      message: `等待执行 ${node.nodeLabel}`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'pending',
      nodeType: node.nodeType,
      nodeLabel: node.nodeLabel,
    }));

    setLogs(initialLogs);

    // 模拟每个节点执行
    let currentIndex = 0;
    const totalNodes = nodeExecutionOrder.length;

    const executeNext = () => {
      if (currentIndex >= totalNodes) {
        setProgress(100);
        return;
      }

      const node = nodeExecutionOrder[currentIndex];
      const progressPercent = Math.round(((currentIndex + 1) / totalNodes) * 100);

      // 更新当前节点为执行中
      setLogs((prev) =>
        prev.map((log, idx) =>
          idx === currentIndex
            ? {
                ...log,
                message: `正在执行 ${node.nodeLabel}...`,
                status: 'running',
                timestamp: new Date().toLocaleTimeString(),
              }
            : log
        )
      );
      setProgress(progressPercent);

      // 模拟执行时间
      setTimeout(() => {
        // 更新为成功
        setLogs((prev) =>
          prev.map((log, idx) =>
            idx === currentIndex
              ? {
                  ...log,
                  message: `${node.nodeLabel} 执行完成`,
                  status: 'success',
                  timestamp: new Date().toLocaleTimeString(),
                  durationMs: Math.floor(Math.random() * 2000) + 500,
                }
              : log
          )
        );

        currentIndex++;
        executeNext();
      }, 1500 + Math.random() * 1000);
    };

    executeNext();
  };

  const handleRun = async () => {
    if (!input.trim()) return;

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

    // 开始模拟进度
    simulateExecution();

    try {
      let response;
      if (currentWorkflow?.id) {
        response = await workflowApi.execute({
          workflowId: Number(currentWorkflow.id),
          input: input,
        });
      } else {
        response = await workflowApi.execute({
          workflowId: 0,
          input: input,
          parameters: {
            nodes: JSON.stringify(nodes),
            edges: JSON.stringify(edges),
          },
        });
      }

      // 使用真实返回的日志
      if (response.logs && response.logs.length > 0) {
        const realLogs: ExecutionLog[] = response.logs.map((log: any, index: number) => ({
          id: `log-${index}`,
          message: log.message,
          timestamp: new Date().toLocaleTimeString(),
          status: log.nodeType ? 'success' : 'running',
          nodeType: log.nodeType,
          nodeLabel: log.nodeLabel,
          durationMs: log.durationMs,
          output: log.output,
          inputTokens: log.inputTokens,
          outputTokens: log.outputTokens,
          totalTokens: log.totalTokens,
        }));
        setLogs(realLogs);
      }

      setCurrentStep('result');
      setProgress(100);

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
          totalDuration: response.totalDuration,
          totalTokens: response.totalTokens,
        });
      }
    } catch (error: any) {
      setCurrentStep('result');
      setProgress(100);
      setResult({
        success: false,
        error: error.message || '执行失败',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    if (!isRunning) {
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
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={800}
      footer={null}
      closable={!isRunning}
      maskClosable={!isRunning}
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
            <Timeline mode="left">
              {/* 开始节点 */}
              <Timeline.Item
                dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              >
                <div>
                  <Text strong>开始执行</Text>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    输入内容: {input.slice(0, 50)}{input.length > 50 ? '...' : ''}
                  </div>
                </div>
              </Timeline.Item>

              {/* 各节点执行 */}
              {logs.map((log, index) => (
                <Timeline.Item
                  key={log.id}
                  dot={
                    log.status === 'running' ? (
                      <LoadingOutlined spin style={{ color: '#1890ff' }} />
                    ) : log.status === 'success' ? (
                      <CheckOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: '#999' }} />
                    )
                  }
                  color={
                    log.status === 'success'
                      ? 'green'
                      : log.status === 'running'
                      ? 'blue'
                      : 'gray'
                  }
                >
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
                      <div style={{ fontWeight: 500 }}>{log.nodeLabel}</div>
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
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </div>
      )}

      {/* 结果阶段 */}
      {currentStep === 'result' && result && (
        <div style={{ padding: '16px 0' }}>
          {result.success ? (
            <>
              <Alert
                message="执行成功"
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
                  <Divider type="vertical" style={{ height: 40 }} />
                  <div style={{ flex: 1, textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>总耗时</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      {result.totalDuration ? `${result.totalDuration}ms` : `${logs.reduce((sum, log) => sum + (log.durationMs || 0), 0)}ms`}
                    </div>
                  </div>
                  <Divider type="vertical" style={{ height: 40 }} />
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

              {/* 文本输出 */}
              {result.output && (
                <Card
                  title={<span><FileTextOutlined /> 文本输出</span>}
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
                  <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 6 }}>
                    <audio
                      controls
                      src={result.audioUrl}
                      style={{ width: '100%' }}
                    />
                  </div>
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
                  }}
                >
                  再次运行
                </Button>
              </Space>
            </>
          ) : (
            <>
              <Alert
                message="执行失败"
                description={result.error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space>
                <Button onClick={handleClose}>关闭</Button>
                <Button
                  onClick={() => {
                    setCurrentStep('input');
                    setLogs([]);
                    setProgress(0);
                    setResult(null);
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
