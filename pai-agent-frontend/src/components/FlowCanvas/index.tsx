import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  type ReactFlowInstance,
  type Node,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type Edge,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { message } from 'antd';

import InputNode from '../../nodes/InputNode';
import LLMNode from '../../nodes/LLMNode';
import ToolNode from '../../nodes/ToolNode';
import OutputNode from '../../nodes/OutputNode';
import { useWorkflowStore } from '../../stores/workflowStore';

interface FlowCanvasProps {
  onSaveWorkflow: () => void;
  onRunWorkflow: () => void;
}

const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LLMNode,
  tool: ToolNode,
  output: OutputNode,
};

const FlowCanvas: React.FC<FlowCanvasProps> = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const store = useWorkflowStore();
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null);

  // 获取节点执行状态
  const nodeExecutionStatus = useWorkflowStore((state) => state.nodeExecutionStatus);

  // 将执行状态合并到节点数据中
  const nodesWithStatus = store.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      executionStatus: nodeExecutionStatus[node.id] || 'idle',
    },
  }));

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setRfInstance(instance);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, store.nodes);
      store.setNodes(newNodes);
    },
    [store.nodes, store.setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, store.edges);
      store.setEdges(newEdges);
    },
    [store.edges, store.setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        id: params.source + '-' + params.target,
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#1890ff', strokeWidth: 2 },
        markerEnd: 'arrowclosed',
      };
      store.addEdge(edge as any);
    },
    [store.addEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      store.setSelectedNode(node);
      store.setConfigDrawerOpen(true);
    },
    [store.setSelectedNode, store.setConfigDrawerOpen]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (window.confirm('确定要删除这条连线吗？')) {
        store.removeEdge(edge.id);
      }
    },
    [store.removeEdge]
  );

  const onPaneClick = useCallback(() => {
    store.setSelectedNode(null);
  }, [store.setSelectedNode]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const modelType = event.dataTransfer.getData('modelType');
      if (!type) return;

      if (!reactFlowWrapper.current || !rfInstance) {
        message.warning('画布未初始化，请稍后再试');
        return;
      }

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // 根据 modelType 确定节点标签和图标
      let label = type === 'input' ? '用户输入' : type === 'output' ? '输出' : '节点';
      let iconColor = '';

      if (modelType) {
        switch (modelType) {
          case 'deepseek-chat':
            label = 'DeepSeek';
            iconColor = '#eb4d4d';
            break;
          case 'qwen-max':
          case 'qwen-plus':
            label = '通义千问';
            iconColor = '#faad14';
            break;
          case 'ai-ping':
            label = 'AI Ping';
            iconColor = '#f5222d';
            break;
          case 'zhipu-chat':
            label = '智谱';
            iconColor = '#722ed1';
            break;
          case 'audio-synthesis':
            label = '超拟人音频合成';
            iconColor = '#fa8c16';
            break;
        }
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label,
          model: type === 'llm' ? modelType : undefined,
          toolType: type === 'tool' ? modelType : undefined,
          iconColor,
        },
      };

      store.addNode(newNode);
    },
    [rfInstance, store.addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodesWithStatus}
        edges={store.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        connectionMode={ConnectionMode.Loose}
        style={{ background: '#f5f5f5' }}
        nodesConnectable={true}
        nodesDraggable={true}
        nodesFocusable={false}
        edgesFocusable={true}
        edgesReconnectable={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#1890ff', strokeWidth: 2 },
          markerEnd: 'url(#arrowhead)',
        }}
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

export default FlowCanvas;
