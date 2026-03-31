import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography, Tag } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const ToolNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;

  return (
    <div className={`flow-node tool-node ${selected ? 'selected' : ''}`}>
      <div className="node-icon gradient-orange">
        <ToolOutlined />
      </div>
      <div className="node-content">
        <Text strong>{data?.label || '工具节点'}</Text>
        {data?.toolType && (
          <Tag className="node-tag">{data.toolType}</Tag>
        )}
        {data?.config && Object.keys(data.config).length > 0 && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {Object.keys(data.config).join(', ')}
          </Text>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="node-handle" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
};

export default memo(ToolNode);
