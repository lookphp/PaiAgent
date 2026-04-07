import React from 'react';
import {
  Input,
  Button,
  Typography,
  Tag,
  Space,
  Alert,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  CloseOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';
import type { ExecutionEvent } from '../../types/workflow';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface SuspendedEditorProps {}

const SuspendedEditor: React.FC<SuspendedEditorProps> = () => {
  const {
    executionSessionId,
    suspendedData,
    editedOutput,
    isExecuting,
    currentWorkflow,
    nodes,
    edges,
    suspendConfig,
    setEditedOutput,
    setExecutionStatus,
    setExecutionResult,
    setIsExecuting,
    addExecutionLog,
    resetExecution,
    clearAllNodeExecutionStatus,
    handleExecutionEvent,
    setCloseSSEConnection,
  } = useWorkflowStore();

  // SSE 模式：没有 executionSessionId，使用重新执行的方式
  const isSSEMode = !executionSessionId;

  const handleResumeSSE = async () => {
    if (!editedOutput.trim() || isExecuting || !suspendedData) return;

    // SSE 模式下，使用修改后的输出作为 lastOutput，从暂停节点的下一个节点继续执行
    setIsExecuting(true);
    setExecutionStatus('running');
    clearAllNodeExecutionStatus();
    addExecutionLog({ message: '继续执行后续节点...', type: 'system' });

    const request = {
      workflowId: currentWorkflow?.id ? Number(currentWorkflow.id) : 0,
      input: editedOutput,
      parameters: currentWorkflow?.id ? undefined : {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      },
      suspendOnNodeTypes: suspendConfig.nodeTypes?.length > 0 ? suspendConfig.nodeTypes : undefined,
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
        handleExecutionEvent(event);
      },
      (error: Error) => {
        setExecutionStatus('error');
        setIsExecuting(false);
        addExecutionLog({ message: `错误: ${error.message}`, type: 'error' });
        setExecutionResult({ success: false, error: error.message });
      }
    );

    setCloseSSEConnection(() => closeConnection);
  };

  // 传统模式：使用 resumeExecution API
  const handleResumeTraditional = async () => {
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

  const handleResume = isSSEMode ? handleResumeSSE : handleResumeTraditional;

  const handleCancel = async () => {
    if (isSSEMode) {
      // SSE 模式：直接取消并重置
      addExecutionLog({ message: '已取消执行', type: 'system' });
      resetExecution();
    } else if (executionSessionId) {
      // 传统模式：调用取消 API
      try {
        await workflowApi.cancelExecution(executionSessionId);
        addExecutionLog({ message: '已取消执行', type: 'system' });
        resetExecution();
      } catch (error: any) {
        addExecutionLog({ message: `取消失败: ${error.message}`, type: 'error' });
      }
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

      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>输出内容（可编辑）</Text>
        <Tag style={{ fontSize: 11 }}>{editedOutput?.length || 0} 字符</Tag>
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
          icon={<PlayCircleOutlined />}
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