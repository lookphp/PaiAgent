import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const OutputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
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
        <CheckCircleOutlined style={{ fontSize: 16, color: '#1890ff', marginRight: 8 }} />
        <Text strong>{data?.label || '输出'}</Text>
      </div>
      {data?.output && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          {data.output}
        </Text>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#1890ff' }}
      />
    </Card>
  );
};

export default memo(OutputNode);
