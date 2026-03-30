import React, { useState } from 'react';
import { Card, Typography, Divider, Collapse } from 'antd';
import {
  ApiOutlined,
  ToolOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  BookOutlined,
  SoundOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, modelType?: string) => void;
}

interface NodeItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  modelType?: string;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const draggableItemStyle: React.CSSProperties = {
    padding: '10px 12px',
    marginBottom: 6,
    border: '1px solid #e8e8e8',
    borderRadius: 6,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fafafa',
    transition: 'all 0.2s',
    userSelect: 'none',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 18,
    flexShrink: 0,
  };

  // 大模型节点列表
  const llmNodes: NodeItem[] = [
    {
      key: 'deepseek',
      label: 'DeepSeek',
      description: '深度求索大模型',
      icon: <CrownOutlined />,
      color: '#eb4d4d',
      modelType: 'deepseek-chat',
    },
    {
      key: 'qwen',
      label: '通义千问',
      description: '阿里云大模型',
      icon: <StarOutlined />,
      color: '#faad14',
      modelType: 'qwen-max',
    },
    {
      key: 'aiping',
      label: 'AI Ping',
      description: '智能对话助手',
      icon: <RocketOutlined />,
      color: '#f5222d',
      modelType: 'ai-ping',
    },
    {
      key: 'zhipu',
      label: '智谱',
      description: '清华智谱 AI',
      icon: <BookOutlined />,
      color: '#722ed1',
      modelType: 'zhipu-chat',
    },
  ];

  // 工具节点列表
  const toolNodes: NodeItem[] = [
    {
      key: 'audio-synthesis',
      label: '超拟人音频合成',
      description: '文本转语音',
      icon: <SoundOutlined />,
      color: '#fa8c16',
      modelType: 'audio-synthesis',
    },
  ];

  const renderLlmNodeItem = (node: NodeItem) => (
    <div
      key={node.key}
      draggable
      onDragStart={(e) => onDragStart(e, 'llm', node.modelType)}
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
      <div style={{ ...iconStyle, color: node.color }}>{node.icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{node.label}</div>
        <div style={{ fontSize: 11, color: '#999' }}>{node.description}</div>
      </div>
    </div>
  );

  const renderToolNodeItem = (node: NodeItem) => (
    <div
      key={node.key}
      draggable
      onDragStart={(e) => onDragStart(e, 'tool', node.modelType)}
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
      <div style={{ ...iconStyle, color: node.color }}>{node.icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{node.label}</div>
        <div style={{ fontSize: 11, color: '#999' }}>{node.description}</div>
      </div>
    </div>
  );

  return (
    <div className="node-palette" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>节点库</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {/* 大模型节点分类 */}
        <div style={{ marginBottom: 16 }}>
          <Divider style={{ fontSize: 13, color: '#999', margin: '0 0 12px 0' }}>
            🤖 大模型节点
          </Divider>
          {llmNodes.map(renderLlmNodeItem)}
        </div>

        {/* 工具节点分类 */}
        <div>
          <Divider style={{ fontSize: 13, color: '#999', margin: '12px 0' }}>
            🔧 工具节点
          </Divider>
          {toolNodes.map(renderToolNodeItem)}
        </div>

        {/* 底部提示 */}
        <div
          style={{
            marginTop: 24,
            padding: '12px',
            backgroundColor: '#e6f7ff',
            borderRadius: 6,
            border: '1px dashed #1890ff',
          }}
        >
          <div style={{ fontSize: 12, color: '#666' }}>
            💡 拖拽节点到画布中使用
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePalette;
