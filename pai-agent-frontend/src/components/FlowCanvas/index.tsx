import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  type ReactFlowInstance,
  type Node,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Space, message } from 'antd';
import {
  SaveOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  BugOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';

import InputNode from '../../nodes/InputNode';
import LLMNode from '../../nodes/LLMNode';
import ToolNode from '../../nodes/ToolNode';
import OutputNode from '../../nodes/OutputNode';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflowApi } from '../../services/workflowApi';

interface FlowCanvasProps {
  debugButton?: {
    type: 'primary' | 'default';
    onClick: () => void;
  };
}

const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LLMNode,
  tool: ToolNode,
  output: OutputNode,
};

const FlowCanvasContent: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, setNodes, setEdges, addNode, setSelectedNode, setConfigDrawerOpen } = useWorkflowStore();
  const [rfInstance] = React.useState<ReactFlowInstance | null>(null);

  const onNodesChange = useCallback(
    (changes: any[]) => {
      setNodes(changes);
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any[]) => {
      setEdges(changes);
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      addNode({
        id: params.source + '-' + params.target,
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#1890ff', strokeWidth: 2 },
      } as any);
    },
    [addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setConfigDrawerOpen(true);
    },
    [setSelectedNode, setConfigDrawerOpen]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      if (!reactFlowWrapper.current || !rfInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type === 'llm' ? '通义千问' : type === 'tool' ? '超拟人音频合成' : type === 'input' ? '用户输入' : '输出',
          model: type === 'llm' ? 'qwen-max' : undefined,
          toolType: type === 'tool' ? 'audio-synthesis' : undefined,
        },
      };

      addNode(newNode);
    },
    [rfInstance, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        onNodesDelete={() => {
          message.success('节点已删除');
        }}
        style={{ background: '#f5f5f5' }}
      >
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'llm') return '#722ed1';
            if (n.type === 'tool') return '#fa8c16';
            if (n.type === 'input') return '#52c41a';
            if (n.type === 'output') return '#1890ff';
            return '#888';
          }}
          nodeColor={(n) => {
            if (n.type === 'llm') return '#f9f0ff';
            if (n.type === 'tool') return '#fff7e6';
            if (n.type === 'input') return '#f6ffed';
            if (n.type === 'output') return '#e6f7ff';
            return '#fff';
          }}
          style={{ margin: 10 }}
        />
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
      </ReactFlow>
    </div>
  );
};

const FlowCanvas: React.FC<FlowCanvasProps> = ({ debugButton }) => {
  const { nodes, edges, setNodes, setEdges, currentWorkflow, setCurrentWorkflow, setDebugDrawerOpen } = useWorkflowStore();

  const handleSave = async () => {
    try {
      const workflowData = {
        name: currentWorkflow?.name || `工作流_${new Date().getTime()}`,
        description: currentWorkflow?.description || '',
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        config: '{}',
      };

      if (currentWorkflow?.id) {
        await workflowApi.update(String(currentWorkflow.id), workflowData as any);
        message.success('工作流已更新');
      } else {
        const saved = await workflowApi.create(workflowData as any);
        setCurrentWorkflow({ ...saved, nodes, edges } as any);
        message.success('工作流已创建');
      }
    } catch (error: any) {
      message.error('保存失败：' + (error.message || '未知错误'));
    }
  };

  const handleRun = () => {
    if (nodes.length === 0) {
      message.warning('请先添加节点');
      return;
    }
    // 打开调试抽屉，让用户输入测试文本
    setDebugDrawerOpen(true);
    message.info('请在调试面板中输入测试文本');
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    message.success('画布已清空');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 工具栏 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>流程画布</div>
        <Space>
          <Button icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRun}
          >
            运行
          </Button>
          <Button
            type={debugButton?.type}
            icon={<BugOutlined />}
            onClick={debugButton?.onClick}
          >
            调试
          </Button>
          <Button icon={<FolderOpenOutlined />}>
            加载
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClear}
          >
            清空
          </Button>
        </Space>
      </div>
      {/* 画布区域 */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ReactFlowProvider>
          <FlowCanvasContent />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default FlowCanvas;
