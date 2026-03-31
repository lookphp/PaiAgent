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
      <div className="node-icon gradient-green">
        <UserOutlined />
      </div>
      <div className="node-content">
        <Text strong>{data?.label || '用户输入'}</Text>
        <Text type="secondary">起始节点</Text>
      </div>
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
};

export default memo(InputNode);
