import React from 'react';
import {
  Input,
  Button,
  Typography,
  Spin,
  Tag,
  Timeline,
  Collapse,
  Empty,
  Tooltip,
  Checkbox,
  Space,
  Alert,
} from 'antd';
import {
  PlayCircleOutlined,
  BugOutlined,
  LoadingOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';
import SuspendedEditor from '../SuspendedEditor';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;

interface DebugDrawerProps {}

const DebugDrawer: React.FC<DebugDrawerProps> = () => {
  const {
    debugDrawerOpen,
    debugInput,
    isExecuting,
    executionLogs,
    executionResult,
    executionStatus,
    suspendedData,
    suspendConfig,
    currentWorkflow,
    nodes,
    edges,
    setDebugDrawerOpen,
    setDebugInput,
    setIsExecuting,
    addExecutionLog,
    setExecutionResult,
    setExecutionSessionId,
    setExecutionStatus,
    setSuspendedData,
    setSuspendConfig,
    resetExecution,
  } = useWorkflowStore();

  const handleRun = async () => {
    if (!debugInput.trim() || isExecuting) return;

    // 先重置状态，再设置执行中
    resetExecution();
    setIsExecuting(true);
    addExecutionLog({ message: '开始执行工作流...', type: 'system' });
    addExecutionLog({ message: `输入: ${debugInput}`, type: 'input' });

    try {
      let response;
      const suspendOnNodeTypes = suspendConfig.nodeTypes.length > 0 ? suspendConfig.nodeTypes : undefined;

      if (currentWorkflow?.id) {
        response = await workflowApi.startExecution({
          workflowId: Number(currentWorkflow.id),
          input: debugInput,
          suspendOnNodeTypes,
        });
      } else {
        response = await workflowApi.startExecution({
          workflowId: 0,
          input: debugInput,
          parameters: {
            nodes: JSON.stringify(nodes),
            edges: JSON.stringify(edges),
          },
          suspendOnNodeTypes,
        });
      }

      // 设置执行会话ID
      if (response.executionId) {
        setExecutionSessionId(response.executionId);
      }

      if (response.success) {
        if (response.status?.toLowerCase() === 'suspended') {
          // 暂停状态
          setExecutionStatus('suspended');

          // 只添加节点执行完成的日志（有 nodeType 的）
          response.logs?.filter((log: any) => log.nodeType).forEach((log: any) => {
            addExecutionLog({
              message: log.message,
              durationMs: log.durationMs,
              nodeType: log.nodeType,
              nodeId: log.nodeId,
              nodeLabel: log.nodeLabel,
              output: log.output,
              type: log.nodeType || 'system',
              inputTokens: log.inputTokens,
              outputTokens: log.outputTokens,
              totalTokens: log.totalTokens,
            });
          });

          // 最后添加暂停提示日志
          if (response.suspendedNodeId && response.suspendedNodeType && response.suspendedOutput) {
            setSuspendedData({
              nodeId: response.suspendedNodeId,
              nodeType: response.suspendedNodeType,
              output: response.suspendedOutput,
            });
            addExecutionLog({
              message: `节点 ${response.suspendedNodeType} 执行完成，等待编辑`,
              nodeType: response.suspendedNodeType,
              nodeId: response.suspendedNodeId,
              output: response.suspendedOutput,
              type: 'suspended',
            });
          }
        } else {
          // 完成
          setExecutionStatus('completed');
          // 只添加节点执行完成的日志（有 nodeType 的）
          response.logs?.filter((log: any) => log.nodeType).forEach((log: any) => {
            addExecutionLog({
              message: log.message,
              durationMs: log.durationMs,
              nodeType: log.nodeType,
              nodeId: log.nodeId,
              nodeLabel: log.nodeLabel,
              output: log.output,
              type: log.nodeType || 'system',
              inputTokens: log.inputTokens,
              outputTokens: log.outputTokens,
              totalTokens: log.totalTokens,
            });
          });
          addExecutionLog({ message: '执行完成', type: 'success' });
          setExecutionResult({
            success: true,
            output: response.output,
            audioUrl: response.audioUrl,
            totalDuration: response.totalDuration,
            totalTokens: response.totalTokens,
            totalInputTokens: response.totalInputTokens,
            totalOutputTokens: response.totalOutputTokens,
          });
        }
      } else {
        setExecutionStatus('error');
        addExecutionLog({ message: `执行失败: ${response.error}`, type: 'error' });
        setExecutionResult({ success: false, error: response.error });
      }
    } catch (error: any) {
      setExecutionStatus('error');
      addExecutionLog({ message: `错误: ${error.message}`, type: 'error' });
      setExecutionResult({ success: false, error: error.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    resetExecution();
  };

  // 处理暂停配置变更
  const handleSuspendConfigChange = (checkedValues: string[]) => {
    setSuspendConfig({ nodeTypes: checkedValues });
  };

  // 节点类型对应的图标和颜色
  const getNodeTypeConfig = (type: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      input: { icon: <ClockCircleOutlined />, color: '#22c55e' },
      llm: { icon: <BugOutlined />, color: '#8b5cf6' },
      tool: { icon: <BugOutlined />, color: '#f59e0b' },
      output: { icon: <CheckCircleOutlined />, color: '#3b82f6' },
      system: { icon: <ClockCircleOutlined />, color: '#6b7280' },
      success: { icon: <CheckCircleOutlined />, color: '#10b981' },
      error: { icon: <ExclamationCircleOutlined />, color: '#ef4444' },
      suspended: { icon: <EditOutlined />, color: '#f97316' },
    };
    return configs[type] || configs.system;
  };

  return (
    <div className={`debug-panel ${debugDrawerOpen ? 'open' : 'collapsed'}`}>
      {/* 面板头部 */}
      <div className="debug-panel-header">
        <div className="debug-panel-title">
          <BugOutlined style={{ fontSize: 16, color: '#6b7280' }} />
          <span style={{ fontWeight: 500 }}>调试面板</span>
          {executionLogs.length > 0 && (
            <Tag style={{ marginLeft: 8 }}>
              {executionLogs.length}
            </Tag>
          )}
          {executionStatus === 'suspended' && (
            <Tag color="orange" icon={<EditOutlined />} style={{ marginLeft: 4 }}>
              暂停
            </Tag>
          )}
        </div>
        <div className="debug-panel-actions">
          {debugDrawerOpen && (
            <Button
              size="small"
              type="text"
              onClick={handleClear}
              disabled={executionLogs.length === 0 || isExecuting}
            >
              清空
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={debugDrawerOpen ? <DownOutlined /> : <UpOutlined />}
            onClick={() => setDebugDrawerOpen(!debugDrawerOpen)}
          />
        </div>
      </div>

      {/* 面板内容 */}
      {debugDrawerOpen && (
        <div className="debug-panel-content">
          {/* 第一栏：输入区域 */}
          <div className="debug-input-section">
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>测试输入</Text>
            </div>
            <TextArea
              rows={4}
              value={debugInput}
              onChange={(e) => setDebugInput(e.target.value)}
              placeholder="输入测试内容..."
              style={{ marginBottom: 12, resize: 'none' }}
            />

            {/* 暂停配置 */}
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                执行选项
              </Text>
              <Checkbox.Group
                value={suspendConfig.nodeTypes}
                onChange={handleSuspendConfigChange}
                style={{ width: '100%' }}
              >
                <Space direction="vertical">
                  <Checkbox value="llm">
                    <Space>
                      <Tag color="purple" style={{ fontSize: 11 }}>LLM</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        LLM 输出后暂停，允许编辑
                      </Text>
                    </Space>
                  </Checkbox>
                  <Checkbox value="tool">
                    <Space>
                      <Tag color="orange" style={{ fontSize: 11 }}>Tool</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Tool 执行后暂停
                      </Text>
                    </Space>
                  </Checkbox>
                </Space>
              </Checkbox.Group>
            </div>

            <Button
              type="primary"
              icon={isExecuting ? <LoadingOutlined spin /> : <PlayCircleOutlined />}
              onClick={handleRun}
              disabled={!debugInput.trim() || isExecuting || executionStatus === 'suspended'}
              block
              size="middle"
            >
              {isExecuting ? '执行中...' : '运行'}
            </Button>
          </div>

          {/* 第二栏：执行结果 */}
          <div className="debug-result-section">
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>执行结果</Text>
            </div>

            {/* 暂停编辑界面 */}
            {executionStatus === 'suspended' && suspendedData && (
              <SuspendedEditor />
            )}

            {!executionResult && !isExecuting && executionStatus !== 'suspended' && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="点击运行查看结果"
                style={{ marginTop: 40 }}
              />
            )}

            {isExecuting && executionStatus !== 'suspended' && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                  执行中...
                </Text>
              </div>
            )}

            {executionResult?.success && executionStatus === 'completed' && (
              <div className="debug-result-content">
                {/* Token 统计 */}
                {executionResult.totalTokens !== undefined && executionResult.totalTokens > 0 && (
                  <div
                    style={{
                      padding: 12,
                      background: '#f0f5ff',
                      border: '1px solid #91caff',
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#666' }}>Token 使用</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                          {executionResult.totalTokens?.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#666' }}>输入</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {executionResult.totalInputTokens?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#666' }}>输出</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {executionResult.totalOutputTokens?.toLocaleString() || 0}
                        </div>
                      </div>
                      {executionResult.totalDuration !== undefined && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: '#666' }}>总耗时</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>
                            {executionResult.totalDuration}ms
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {executionResult.output && (
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        padding: 12,
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 8,
                        maxHeight: 180,
                        overflow: 'auto',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {executionResult.output}
                      </Text>
                    </div>
                  </div>
                )}

                {executionResult.audioUrl && (
                  <div
                    style={{
                      padding: 12,
                      background: '#eff6ff',
                      border: '1px solid #93c5fd',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="blue" style={{ fontSize: 11 }}>音频输出</Tag>
                    </div>
                    <audio
                      controls
                      src={executionResult.audioUrl}
                      style={{ width: '100%', height: 36 }}
                    />
                  </div>
                )}
              </div>
            )}

            {executionResult?.error && executionStatus === 'error' && (
              <div
                style={{
                  padding: 12,
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: 8,
                  color: '#dc2626',
                  fontSize: 13,
                }}
              >
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                {executionResult.error}
              </div>
            )}
          </div>

          {/* 第三栏：执行日志 */}
          <div className="debug-logs-section">
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>执行日志</Text>
            </div>
            {executionLogs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无日志" />
            ) : (
              <Timeline style={{ paddingLeft: 0 }}>
                {executionLogs.map((log, index) => {
                  const config = getNodeTypeConfig(log.type || 'system');
                  return (
                    <Timeline.Item
                      key={index}
                      dot={
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: config.color,
                          }}
                        />
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 4 }}>
                            <Text style={{ fontSize: 13 }}>{log.message}</Text>
                            {log.timestamp && (
                              <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>
                                {log.timestamp}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {log.nodeLabel && (
                              <Tag
                                style={{
                                  background: `${config.color}20`,
                                  borderColor: config.color,
                                  color: config.color,
                                  fontSize: 11,
                                }}
                              >
                                {log.nodeLabel}
                              </Tag>
                            )}
                            {log.durationMs && log.durationMs > 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#6b7280',
                                  background: '#f3f4f6',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {log.durationMs}ms
                              </span>
                            )}
                            {log.totalTokens && log.totalTokens > 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#1677ff',
                                  background: '#e6f4ff',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {log.totalTokens.toLocaleString()} tokens
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {log.output && (
                        <Collapse ghost style={{ marginTop: 8 }}>
                          <Panel
                            header={
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                查看输出
                              </Text>
                            }
                            key="1"
                          >
                            <div
                              style={{
                                padding: 8,
                                background: '#f9fafb',
                                borderRadius: 4,
                                fontSize: 12,
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: 200,
                                overflow: 'auto',
                              }}
                            >
                              {log.output}
                            </div>
                          </Panel>
                        </Collapse>
                      )}
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugDrawer;