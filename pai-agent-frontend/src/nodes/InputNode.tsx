import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography, Tag } from 'antd';
import { UserOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

// 状态配置
const statusConfig: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
  idle: { icon: null, color: '', text: '' },
  running: { icon: <LoadingOutlined spin />, color: 'processing', text: '执行中' },
  completed: { icon: <CheckCircleOutlined />, color: 'success', text: '完成' },
  error: { icon: <ExclamationCircleOutlined />, color: 'error', text: '失败' },
};

const InputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;
  const executionStatus = data?.executionStatus || 'idle';
  const status = statusConfig[executionStatus];

  return (
    <div className={`flow-node input-node ${selected ? 'selected' : ''} node-${executionStatus}`}>
      {/* 节点头部：图标 + 标题 */}
      <div className="node-header">
        <div className={`node-icon input ${executionStatus === 'running' ? 'icon-pulse' : ''}`}>
          {executionStatus === 'running' ? <LoadingOutlined spin /> : <UserOutlined />}
        </div>
        <div className="node-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong>{data?.label || '用户输入'}</Text>
            {status.text && (
              <Tag color={status.color} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
                {status.text}
              </Tag>
            )}
          </div>
          <Text type="secondary" className="node-subtitle">起始节点</Text>
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

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
      />
    </div>
  );
};

export default memo(InputNode);
