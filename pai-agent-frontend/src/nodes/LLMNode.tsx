import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography, Tag } from 'antd';
import { RobotOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

// 模型显示名称映射
const modelNameMap: Record<string, string> = {
  'deepseek-chat': 'DeepSeek',
  'qwen-max': '通义千问-Max',
  'qwen-plus': '通义千问-Plus',
  'qwen-turbo': '通义千问-Turbo',
  'ai-ping': 'AI Ping',
  'zhipu-chat': '智谱 AI',
};

// 状态图标映射
const statusIconMap: Record<string, React.ReactNode> = {
  idle: null,
  running: <LoadingOutlined spin />,
  completed: <CheckCircleOutlined />,
  error: <ExclamationCircleOutlined />,
};

const LLMNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;
  const executionStatus = data?.executionStatus || 'idle';

  const modelName = modelNameMap[data?.model] || data?.model || '大模型';
  const temperature = data?.temperature;

  return (
    <div className={`flow-node llm-node ${selected ? 'selected' : ''} node-${executionStatus}`}>
      {/* 节点头部：图标 + 标题 */}
      <div className="node-header">
        <div className="node-icon llm">
          <RobotOutlined />
        </div>
        <div className="node-title">
          <Text strong>{data?.label || '大模型'}</Text>
          <Text type="secondary" className="node-subtitle">{modelName}</Text>
        </div>
      </div>

      {/* 标签区域 */}
      <div className="node-tags">
        {temperature !== undefined && (
          <Tag className="node-tag">T={temperature}</Tag>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="node-status">
        {statusIconMap[executionStatus] && (
          <div className={`node-status-badge ${executionStatus}`}>
            {statusIconMap[executionStatus]}
          </div>
        )}
      </div>

      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
      />

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
      />
    </div>
  );
};

export default memo(LLMNode);
