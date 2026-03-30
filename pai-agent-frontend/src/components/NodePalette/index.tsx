import React from 'react';
import { Card, Typography, Divider } from 'antd';
import {
  ApiOutlined,
  ToolOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const draggableItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    marginBottom: 8,
    border: '1px solid #e8e8e8',
    borderRadius: 6,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fafafa',
    transition: 'all 0.2s',
    userSelect: 'none',
    position: 'relative',
    zIndex: 1,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 20,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Card
      title="节点库"
      size="small"
      style={{
        height: '100%',
        borderRadius: 0,
        borderRight: '1px solid #f0f0f0',
        backgroundColor: 'transparent',
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <Divider orientationMargin={0} style={{ margin: '0 0 12px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          大模型节点
        </Text>
      </Divider>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'llm')}
        style={draggableItemStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f5ff';
          e.currentTarget.style.borderColor = '#1890ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fafafa';
          e.currentTarget.style.borderColor = '#e8e8e8';
        }}
      >
        <ApiOutlined style={{ ...iconStyle, color: '#722ed1' }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500 }}>通义千问</div>
          <div style={{ fontSize: 12, color: '#999' }}>阿里云大模型</div>
        </div>
      </div>

      <Divider orientationMargin={0} style={{ margin: '12px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          工具节点
        </Text>
      </Divider>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'tool')}
        style={draggableItemStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f5ff';
          e.currentTarget.style.borderColor = '#1890ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fafafa';
          e.currentTarget.style.borderColor = '#e8e8e8';
        }}
      >
        <ToolOutlined style={{ ...iconStyle, color: '#fa8c16' }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500 }}>超拟人音频合成</div>
          <div style={{ fontSize: 12, color: '#999' }}>文本转语音</div>
        </div>
      </div>
    </Card>
  );
};

export default NodePalette;
