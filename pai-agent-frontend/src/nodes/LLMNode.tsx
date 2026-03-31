import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography, Tag } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const LLMNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;

  return (
    <div className={`flow-node llm-node ${selected ? 'selected' : ''}`}>
      <div className="node-icon gradient-purple">
        <ApiOutlined />
      </div>
      <div className="node-content">
        <Text strong>{data?.label || '大模型'}</Text>
        {data?.model && (
          <Tag className="node-tag" style={{ marginTop: 4 }}>{data.model}</Tag>
        )}
        {data?.temperature && (
          <Tag className="node-tag" color="orange" style={{ marginTop: 4 }}>
            T={data.temperature}
          </Tag>
        )}
        {data?.prompt && (
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 4,
              display: 'block',
            }}
          >
            {data.prompt.substring(0, 30)}{data.prompt.length > 30 ? '...' : ''}
          </Text>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="node-handle" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
};

export default memo(LLMNode);
