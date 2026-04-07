import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography, Tag } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

// 输出格式显示名称
const outputFormatMap: Record<string, string> = {
  'audio': '音频输出',
  'text': '文本输出',
};

// 状态配置
const statusConfig: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
  idle: { icon: null, color: '', text: '' },
  running: { icon: <LoadingOutlined spin />, color: 'processing', text: '执行中' },
  completed: { icon: <CheckCircleOutlined />, color: 'success', text: '完成' },
  error: { icon: <ExclamationCircleOutlined />, color: 'error', text: '失败' },
};

const OutputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;
  const executionStatus = data?.executionStatus || 'idle';

  const outputFormat = data?.outputFormat || 'text';
  const formatLabel = outputFormatMap[outputFormat] || '输出';
  const status = statusConfig[executionStatus];

  return (
    <div className={`flow-node output-node ${selected ? 'selected' : ''} node-${executionStatus}`}>
      {/* 节点头部：图标 + 标题 */}
      <div className="node-header">
        <div className={`node-icon output ${executionStatus === 'running' ? 'icon-pulse' : ''}`}>
          {executionStatus === 'running' ? <LoadingOutlined spin /> : <CheckCircleOutlined />}
        </div>
        <div className="node-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong>{data?.label || '输出'}</Text>
            {status.text && (
              <Tag color={status.color} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
                {status.text}
              </Tag>
            )}
          </div>
          <Text type="secondary" className="node-subtitle">{formatLabel}</Text>
        </div>
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
    </div>
  );
};

export default memo(OutputNode);
