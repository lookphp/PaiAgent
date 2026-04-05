import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const InputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;

  return (
    <div className={`flow-node input-node ${selected ? 'selected' : ''}`}>
      {/* 节点头部：图标 + 标题 */}
      <div className="node-header">
        <div className="node-icon input">
          <UserOutlined />
        </div>
        <div className="node-title">
          <Text strong>{data?.label || '用户输入'}</Text>
          <Text type="secondary" className="node-subtitle">起始节点</Text>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="node-status">
        <div className="node-status-badge idle" />
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
