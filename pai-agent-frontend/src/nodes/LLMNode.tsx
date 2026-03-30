import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, Typography, Tag } from 'antd';
import { ApiOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LLMNode: React.FC<NodeProps> = (props) => {
  const data: any = props.data;
  const selected = props.selected;

  return (
    <Card
      size="small"
      style={{
        width: 220,
        borderColor: selected ? '#1890ff' : '#d9d9d9',
        boxShadow: selected ? '0 0 0 2px rgba(24, 144, 255, 0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <ApiOutlined style={{ fontSize: 16, color: '#722ed1', marginRight: 8 }} />
        <Text strong>{data?.label || '大模型'}</Text>
      </div>
      {data?.model && (
        <Tag color="purple" style={{ marginBottom: 4 }}>
          {data.model}
        </Tag>
      )}
      {data?.prompt && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          {data.prompt.substring(0, 50)}{data.prompt.length > 50 ? '...' : ''}
        </Text>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#722ed1' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#722ed1' }}
      />
    </Card>
  );
};

export default memo(LLMNode);
