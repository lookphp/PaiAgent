import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography, Tag } from 'antd';
import { SoundOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

// 工具类型显示名称映射
const toolTypeMap: Record<string, string> = {
  'audio-synthesis': '音频合成',
};

// 工具类型图标映射
const toolIconMap: Record<string, React.ReactNode> = {
  'audio-synthesis': <SoundOutlined />,
};

// 状态配置
const statusConfig: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
  idle: { icon: null, color: '', text: '' },
  running: { icon: <LoadingOutlined spin />, color: 'processing', text: '执行中' },
  completed: { icon: <CheckCircleOutlined />, color: 'success', text: '完成' },
  error: { icon: <ExclamationCircleOutlined />, color: 'error', text: '失败' },
};

const ToolNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;
  const executionStatus = data?.executionStatus || 'idle';

  const toolType = data?.toolType || '';
  const toolName = toolTypeMap[toolType] || toolType || '工具';
  const toolIcon = toolIconMap[toolType] || <SoundOutlined />;
  const status = statusConfig[executionStatus];

  return (
    <div className={`flow-node tool-node ${selected ? 'selected' : ''} node-${executionStatus}`}>
      {/* 节点头部：图标 + 标题 */}
      <div className="node-header">
        <div className={`node-icon tool ${executionStatus === 'running' ? 'icon-pulse' : ''}`}>
          {executionStatus === 'running' ? <LoadingOutlined spin /> : toolIcon}
        </div>
        <div className="node-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong>{data?.label || '工具节点'}</Text>
            {status.text && (
              <Tag color={status.color} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
                {status.text}
              </Tag>
            )}
          </div>
          <Text type="secondary" className="node-subtitle">{toolName}</Text>
        </div>
      </div>

      {/* 标签区域 */}
      <div className="node-tags">
        {toolType && (
          <Tag className="node-tag">{toolType}</Tag>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="node-status">
        {status.icon && (
          <div className={`node-status-badge ${executionStatus}`}>
            {status.icon}
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

export default memo(ToolNode);
