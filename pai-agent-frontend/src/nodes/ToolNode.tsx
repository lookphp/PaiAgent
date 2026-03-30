import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, Typography, Tag } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ToolNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
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
        <ToolOutlined style={{ fontSize: 16, color: '#fa8c16', marginRight: 8 }} />
        <Text strong>{data?.label || '工具节点'}</Text>
      </div>
      {data?.toolType && (
        <Tag color="orange" style={{ marginBottom: 4 }}>
          {data.toolType}
        </Tag>
      )}
      {data?.config && Object.keys(data.config).length > 0 && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          {Object.keys(data.config).join(', ')}
        </Text>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#fa8c16' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#fa8c16' }}
      />
    </Card>
  );
};

export default memo(ToolNode);
