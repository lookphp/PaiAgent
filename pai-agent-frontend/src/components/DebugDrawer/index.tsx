import React from 'react';
import { Drawer, Input, Button, Divider, Typography, Spin } from 'antd';
import {
  PlayCircleOutlined,
  BugOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface DebugDrawerProps {}

const DebugDrawer: React.FC<DebugDrawerProps> = () => {
  const {
    debugDrawerOpen,
    debugInput,
    isExecuting,
    executionLogs,
    executionResult,
    setDebugDrawerOpen,
    setDebugInput,
    setIsExecuting,
    addExecutionLog,
    setExecutionResult,
    currentWorkflow,
    nodes,
    edges,
  } = useWorkflowStore();

  const handleRun = async () => {
    if (!debugInput.trim()) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    // 清空之前的日志
    addExecutionLog({ message: '开始执行工作流...' });
    addExecutionLog({ message: `输入内容：${debugInput}` });

    try {
      // 如果有保存的工作流，使用工作流 ID 执行
      // 否则使用快速执行模式，传递当前画布的节点和边
      let response;
      if (currentWorkflow?.id) {
        response = await workflowApi.execute({
          workflowId: Number(currentWorkflow.id),
          input: debugInput,
        });
      } else {
        // 快速执行模式 - 使用当前画布的节点和边
        response = await workflowApi.execute({
          workflowId: 0,
          input: debugInput,
          parameters: {
            nodes: JSON.stringify(nodes),
            edges: JSON.stringify(edges),
          },
        });
      }

      if (response.success) {
        // 处理日志，每条日志可能包含 durationMs 和 nodeType
        response.logs?.forEach((log: any) => {
          if (typeof log === 'string') {
            addExecutionLog({ message: log });
          } else {
            addExecutionLog({
              message: log.message,
              durationMs: log.durationMs,
              nodeType: log.nodeType,
            });
          }
        });
        addExecutionLog({ message: '执行完成！' });
        setExecutionResult({
          success: true,
          output: response.output,
          audioUrl: response.audioUrl,
          logs: response.logs,
        });
      } else {
        addExecutionLog({ message: `执行失败：${response.error}` });
        setExecutionResult({
          success: false,
          error: response.error,
        });
      }
    } catch (error: any) {
      addExecutionLog({ message: `执行错误：${error.message || '未知错误'}` });
      setExecutionResult({
        success: false,
        error: error.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearLogs = () => {
    setExecutionResult(null);
  };

  return (
    <Drawer
      title={
        <span>
          <BugOutlined /> 调试面板
        </span>
      }
      placement="right"
      size="large"
      open={debugDrawerOpen}
      onClose={() => setDebugDrawerOpen(false)}
      footer={null}
      styles={{
        body: { padding: '20px' },
        header: { borderBottom: '1px solid #e8e8e8' },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <Title level={5} style={{ marginBottom: 12, color: '#1e40af' }}>输入测试文本</Title>
          <TextArea
            rows={4}
            value={debugInput}
            onChange={(e) => setDebugInput(e.target.value)}
            placeholder="请输入要测试的文本内容..."
            disabled={isExecuting}
            style={{ borderRadius: 8 }}
          />
        </div>

        <Button
          type="primary"
          icon={isExecuting ? <LoadingOutlined spin /> : <PlayCircleOutlined />}
          onClick={handleRun}
          disabled={!debugInput.trim() || isExecuting}
          block
          size="large"
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          {isExecuting ? '执行中...' : '运行工作流'}
        </Button>

        <Divider style={{ margin: '8px 0 16px' }} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, color: '#1e40af' }}>执行日志</Title>
            <Button size="small" onClick={handleClearLogs} style={{ borderRadius: 4 }}>
              清空
            </Button>
          </div>
          <div
            style={{
              height: 300,
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              backgroundColor: '#f9fafb',
              fontFamily: 'monospace',
              fontSize: 12,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            {executionLogs.length === 0 ? (
              <Text type="secondary" style={{ color: '#9ca3af' }}>暂无日志</Text>
            ) : (
              executionLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderBottom: index < executionLogs.length - 1 ? '1px dashed #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <Text code style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: 'none',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                  }}>{`[${log.timestamp}]`}</Text>

                  {log.durationMs && log.durationMs > 0 && (
                    <Text code style={{
                      backgroundColor: log.nodeType === 'llm' ? '#fef3c7' :
                                      log.nodeType === 'tool' ? '#fce7f3' :
                                      log.nodeType === 'input' ? '#dcfce7' :
                                      log.nodeType === 'output' ? '#dbeafe' : '#f3f4f6',
                      color: log.nodeType === 'llm' ? '#d97706' :
                            log.nodeType === 'tool' ? '#db2777' :
                            log.nodeType === 'input' ? '#16a34a' :
                            log.nodeType === 'output' ? '#2563eb' : '#6b7280',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                    }}>{`${log.durationMs}ms`}</Text>
                  )}

                  <span style={{ color: '#374151', fontSize: 12, lineHeight: 1.5 }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            {isExecuting && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Spin size="small" />
              </div>
            )}
          </div>
        </div>

        {executionResult?.audioUrl && (
          <div>
            <Title level={5} style={{ marginBottom: 12, color: '#1e40af' }}>音频输出</Title>
            <audio
              controls
              src={executionResult.audioUrl}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
        )}

        {executionResult?.success && executionResult?.output && (
          <div>
            <Title level={5} style={{ marginBottom: 12, color: '#1e40af' }}>执行结果</Title>
            <div
              style={{
                padding: 16,
                border: '1px solid #86efac',
                borderRadius: 8,
                backgroundColor: '#f0fdf4',
                fontFamily: 'monospace',
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              {executionResult.output}
            </div>
          </div>
        )}

        {executionResult?.error && (
          <div>
            <Title level={5} style={{ marginBottom: 12, color: '#dc2626' }}>错误信息</Title>
            <div
              style={{
                padding: 16,
                border: '1px solid #fca5a5',
                borderRadius: 8,
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontFamily: 'monospace',
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              {executionResult.error}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default DebugDrawer;
