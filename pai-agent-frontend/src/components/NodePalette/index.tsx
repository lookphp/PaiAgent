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
    padding: '12px 14px',
    marginBottom: 8,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
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
        e.currentTarget.style.backgroundColor = '#eff6ff';
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.15)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          ...iconStyle,
          color: node.color,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${node.color}15`,
          borderRadius: 6,
        }}
      >
        {node.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#1f2937' }}>{node.label}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{node.description}</div>
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
        e.currentTarget.style.backgroundColor = '#eff6ff';
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.15)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          ...iconStyle,
          color: node.color,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${node.color}15`,
          borderRadius: 6,
        }}
      >
        {node.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#1f2937' }}>{node.label}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{node.description}</div>
      </div>
    </div>
  );

  return (
    <div className="node-palette" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>节点库</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* 大模型节点分类 */}
        <div style={{ marginBottom: 20 }}>
          <Divider style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px 0', fontWeight: 500 }}>
            🤖 大模型节点
          </Divider>
          {llmNodes.map(renderLlmNodeItem)}
        </div>

        {/* 工具节点分类 */}
        <div>
          <Divider style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px 0', fontWeight: 500 }}>
            🔧 工具节点
          </Divider>
          {toolNodes.map(renderToolNodeItem)}
        </div>

        {/* 底部提示 */}
        <div
          style={{
            marginTop: 24,
            padding: '14px 16px',
            backgroundColor: '#eff6ff',
            borderRadius: 8,
            border: '1px dashed #3b82f6',
          }}
        >
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            💡 拖拽节点到画布中使用
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePalette;
