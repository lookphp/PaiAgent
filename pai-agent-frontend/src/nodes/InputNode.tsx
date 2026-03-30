import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

const InputNode: React.FC<NodeProps> = (props) => {
  const data: any = props.data;
  const selected = props.selected;

  return (
    <Card
      size="small"
      style={{
        width: 200,
        borderColor: selected ? '#1890ff' : '#d9d9d9',
        boxShadow: selected ? '0 0 0 2px rgba(24, 144, 255, 0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <UserOutlined style={{ fontSize: 16, color: '#52c41a', marginRight: 8 }} />
        <Text strong>{data?.label || '用户输入'}</Text>
      </div>
      {data?.value && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {data.value}
        </Text>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#52c41a' }}
      />
    </Card>
  );
};

export default memo(InputNode);
