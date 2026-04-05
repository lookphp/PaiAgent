import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

// 输出格式显示名称
const outputFormatMap: Record<string, string> = {
  'audio': '音频输出',
  'text': '文本输出',
};

const OutputNode: React.FC<NodeProps> = (props) => {
  const data = props.data as any;
  const selected = props.selected;

  const outputFormat = data?.outputFormat || 'text';
  const formatLabel = outputFormatMap[outputFormat] || '输出';

  return (
    <div className={`flow-node output-node ${selected ? 'selected' : ''}`}>
      {/* 节点头部：图标 + 标题 */}
      <div className="node-header">
        <div className="node-icon output">
          <CheckCircleOutlined />
        </div>
        <div className="node-title">
          <Text strong>{data?.label || '输出'}</Text>
          <Text type="secondary" className="node-subtitle">{formatLabel}</Text>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="node-status">
        <div className="node-status-badge idle" />
      </div>

      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
      />
    </div>
  );
};

export default memo(OutputNode);
