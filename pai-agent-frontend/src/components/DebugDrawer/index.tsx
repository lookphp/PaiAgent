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
  } = useWorkflowStore();

  const handleRun = async () => {
    if (!debugInput.trim()) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    // 清空之前的日志
    addExecutionLog(`开始执行工作流...`);
    addExecutionLog(`输入内容：${debugInput}`);

    try {
      // 如果有保存的工作流，使用工作流 ID 执行
      // 否则使用当前画布上的节点和边执行
      let response;
      if (currentWorkflow?.id) {
        response = await workflowApi.execute({
          workflowId: Number(currentWorkflow.id),
          input: debugInput,
        });
      } else {
        // 快速执行模式
        response = await workflowApi.execute({
          workflowId: 0,
          input: debugInput,
        });
      }

      if (response.success) {
        response.logs?.forEach((log: string) => addExecutionLog(log));
        addExecutionLog('执行完成！');
        setExecutionResult({
          success: true,
          output: response.output,
          audioUrl: response.audioUrl,
          logs: response.logs,
        });
      } else {
        addExecutionLog(`执行失败：${response.error}`);
        setExecutionResult({
          success: false,
          error: response.error,
        });
      }
    } catch (error: any) {
      addExecutionLog(`执行错误：${error.message || '未知错误'}`);
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
      width={400}
      open={debugDrawerOpen}
      onClose={() => setDebugDrawerOpen(false)}
      footer={null}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Title level={5}>输入测试文本</Title>
          <TextArea
            rows={4}
            value={debugInput}
            onChange={(e) => setDebugInput(e.target.value)}
            placeholder="请输入要测试的文本内容..."
            disabled={isExecuting}
          />
        </div>

        <Button
          type="primary"
          icon={isExecuting ? <LoadingOutlined spin /> : <PlayCircleOutlined />}
          onClick={handleRun}
          disabled={!debugInput.trim() || isExecuting}
          block
          size="large"
        >
          {isExecuting ? '执行中...' : '运行工作流'}
        </Button>

        <Divider />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0 }}>执行日志</Title>
            <Button size="small" onClick={handleClearLogs}>
              清空
            </Button>
          </div>
          <div
            style={{
              height: 300,
              overflow: 'auto',
              border: '1px solid #e8e8e8',
              borderRadius: 6,
              padding: 12,
              backgroundColor: '#fafafa',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {executionLogs.length === 0 ? (
              <Text type="secondary">暂无日志</Text>
            ) : (
              executionLogs.map((log, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  <Text code>{`[${new Date().toLocaleTimeString()}]`}</Text>{' '}
                  {log}
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
            <Title level={5}>音频输出</Title>
            <audio
              controls
              src={executionResult.audioUrl}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default DebugDrawer;
