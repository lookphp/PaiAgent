import React from 'react';
import {
  Input,
  Button,
  Typography,
  Tag,
  Space,
  Alert,
} from 'antd';
import {
  PlayCircleOutlined,
  CloseOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface SuspendedEditorProps {}

const SuspendedEditor: React.FC<SuspendedEditorProps> = () => {
  const {
    executionSessionId,
    suspendedData,
    editedOutput,
    isExecuting,
    setEditedOutput,
    setExecutionStatus,
    setExecutionResult,
    setIsExecuting,
    addExecutionLog,
    resetExecution,
  } = useWorkflowStore();

  const handleResume = async () => {
    if (!executionSessionId || !editedOutput.trim()) return;

    setIsExecuting(true);
    addExecutionLog({ message: '继续执行工作流...', type: 'system' });

    try {
      const response = await workflowApi.resumeExecution(executionSessionId, {
        modifiedOutput: editedOutput,
      });

      if (response.success) {
        if (response.status?.toLowerCase() === 'suspended') {
          // 再次暂停（可能配置了多个暂停点）
          setExecutionStatus('suspended');
          if (response.suspendedNodeId && response.suspendedNodeType && response.suspendedOutput) {
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
          response.logs?.forEach((log: any) => {
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

  const handleCancel = async () => {
    if (!executionSessionId) return;

    try {
      await workflowApi.cancelExecution(executionSessionId);
      addExecutionLog({ message: '已取消执行', type: 'system' });
      resetExecution();
    } catch (error: any) {
      addExecutionLog({ message: `取消失败: ${error.message}`, type: 'error' });
    }
  };

  if (!suspendedData) return null;

  return (
    <div style={{ padding: 16 }}>
      <Alert
        type="info"
        showIcon
        message="工作流已暂停"
        description={`节点 "${suspendedData.nodeType}" 执行完成，您可以编辑输出内容后继续执行`}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 12 }}>
        <Space>
          <Tag color="purple" icon={<EditOutlined />}>
            {suspendedData.nodeType}
          </Tag>
          <Text type="secondary">节点ID: {suspendedData.nodeId}</Text>
        </Space>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text strong>输出内容（可编辑）</Text>
      </div>

      <TextArea
        rows={8}
        value={editedOutput}
        onChange={(e) => setEditedOutput(e.target.value)}
        placeholder="编辑节点输出内容..."
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button
          icon={<CloseOutlined />}
          onClick={handleCancel}
          disabled={isExecuting}
        >
          取消执行
        </Button>
        <Button
          type="primary"
          icon={isExecuting ? <></> : <PlayCircleOutlined />}
          onClick={handleResume}
          disabled={!editedOutput.trim() || isExecuting}
          loading={isExecuting}
        >
          {isExecuting ? '执行中...' : '继续执行'}
        </Button>
      </Space>
    </div>
  );
};

export default SuspendedEditor;