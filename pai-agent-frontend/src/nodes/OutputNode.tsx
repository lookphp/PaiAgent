import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const OutputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;

  return (
    <div className={`flow-node output-node ${selected ? 'selected' : ''}`}>
      <div className="node-icon gradient-blue">
        <CheckCircleOutlined />
      </div>
      <div className="node-content">
        <Text strong>{data?.label || '输出'}</Text>
        <Text type="secondary">
          {data?.outputFormat === 'audio' ? 'AI 播客' : '文本输出'}
        </Text>
      </div>
      <Handle type="target" position={Position.Top} className="node-handle" />
    </div>
  );
};

export default memo(OutputNode);
