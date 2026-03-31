import React, { useEffect, useState } from 'react';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import DebugDrawer from './components/DebugDrawer';
import NodeConfigPanel from './components/NodeConfig';
import Header from './components/Header';
import WorkflowModal from './components/WorkflowModal';
import { useWorkflowStore } from './stores/workflowStore';
import { workflowApi } from './services/workflowApi';
import type { Workflow } from './types/workflow';
import './App.css';

function App() {
  const { nodes, edges, currentWorkflow, setCurrentWorkflow, setNodes, setEdges } = useWorkflowStore();
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowModalMode, setWorkflowModalMode] = useState<'load' | 'save'>('load');

  // 页面加载时从 URL 读取工作流 ID 并加载
  useEffect(() => {
    const loadWorkflowFromURL = async () => {
      const params = new URLSearchParams(window.location.search);
      const workflowId = params.get('workflow');

      if (workflowId) {
        try {
          const workflow = await workflowApi.get(workflowId);
          // setCurrentWorkflow 会自动解析并设置 nodes 和 edges
          setCurrentWorkflow(workflow);
        } catch (error) {
          console.error('加载工作流失败:', error);
          alert('加载工作流失败：' + (error as any).message);
        }
      }
    };

    loadWorkflowFromURL();
  }, []);

  const handleDragStart = (event: React.DragEvent, nodeType: string, modelType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('modelType', modelType || '');
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNewWorkflow = () => {
    setNodes([
      {
        id: 'input-default',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { label: '用户输入' },
      },
      {
        id: 'output-default',
        type: 'output',
        position: { x: 100, y: 400 },
        data: { label: '输出', outputFormat: 'audio' },
      },
    ]);
    setEdges([]);
    setCurrentWorkflow(null);
    // 清除 URL 中的 workflow 参数
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleLoadWorkflow = () => {
    setWorkflowModalMode('load');
    setWorkflowModalOpen(true);
  };

  const handleSaveWorkflow = () => {
    setWorkflowModalMode('save');
    setWorkflowModalOpen(true);
  };

  const handleModalLoadWorkflow = async (workflow: Workflow) => {
    try {
      if (workflow.id) {
        // 加载现有工作流
        const fullWorkflow = await workflowApi.get(String(workflow.id));
        setCurrentWorkflow(fullWorkflow);
        const parsedNodes = typeof fullWorkflow.nodes === 'string' ? JSON.parse(fullWorkflow.nodes) : fullWorkflow.nodes;
        const parsedEdges = typeof fullWorkflow.edges === 'string' ? JSON.parse(fullWorkflow.edges) : fullWorkflow.edges;
        setNodes(parsedNodes || []);
        setEdges(parsedEdges || []);
        window.history.pushState({}, '', `?workflow=${fullWorkflow.id}`);
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
    }
  };

  const handleSaveWorkflowClick = () => {
    setWorkflowModalMode('save');
    setWorkflowModalOpen(true);
  };

  const handleModalSaveWorkflow = async (workflow: Workflow) => {
    try {
      const name = workflow.name || '未命名工作流';

      if (currentWorkflow) {
        // 更新现有工作流
        const updatedData: any = {
          name: currentWorkflow.name,
          description: currentWorkflow.description,
          nodes: JSON.stringify(nodes || []),
          edges: JSON.stringify(edges || []),
        };
        await workflowApi.update(String(currentWorkflow.id), updatedData);

        setCurrentWorkflow({
          ...currentWorkflow,
          nodes,
          edges,
          updatedAt: new Date().toISOString(),
        });
        alert('工作流已更新！');
      } else {
        // 创建新工作流
        const newWorkflow = await workflowApi.create({
          name,
          description: workflow.description || '',
          nodes: JSON.stringify(nodes || []),
          edges: JSON.stringify(edges || []),
        } as any);

        const parsedNodes = typeof newWorkflow.nodes === 'string' ? JSON.parse(newWorkflow.nodes) : newWorkflow.nodes;
        const parsedEdges = typeof newWorkflow.edges === 'string' ? JSON.parse(newWorkflow.edges) : newWorkflow.edges;

        setCurrentWorkflow({
          ...newWorkflow,
          nodes: parsedNodes || [],
          edges: parsedEdges || [],
        });

        window.history.pushState({}, '', `?workflow=${newWorkflow.id}`);
        alert(`工作流已创建！ID: ${newWorkflow.id}`);
      }
    } catch (error) {
      console.error('保存工作流失败:', error);
      alert('保存工作流失败：' + (error as any).message);
    }
  };

  const handleRunWorkflow = () => {
    // TODO: 实现运行工作流
  };

  return (
    <div className="app-container">
      {/* 顶部导航栏 */}
      <Header
        onNewWorkflow={handleNewWorkflow}
        onLoadWorkflow={handleLoadWorkflow}
        onSaveWorkflow={handleSaveWorkflowClick}
      />

      {/* 主体内容区域 */}
      <div className="app-body">
        {/* 左侧节点面板 */}
        <div className="sidebar">
          <NodePalette onDragStart={handleDragStart} />
        </div>

        {/* 中间画布区域 */}
        <div className="main-content">
          <FlowCanvas
            onSaveWorkflow={handleSaveWorkflowClick}
            onRunWorkflow={handleRunWorkflow}
          />
        </div>

        {/* 右侧配置面板 */}
        <div className="config-panel">
          <NodeConfigPanel />
        </div>
      </div>

      {/* 调试抽屉 */}
      <DebugDrawer />

      {/* 工作流弹窗 */}
      <WorkflowModal
        open={workflowModalOpen}
        mode={workflowModalMode}
        onClose={() => setWorkflowModalOpen(false)}
        onLoadWorkflow={
          workflowModalMode === 'load' ? handleModalLoadWorkflow : handleModalSaveWorkflow
        }
        currentWorkflowName={currentWorkflow?.name}
        nodes={nodes}
        edges={edges}
      />
    </div>
  );
}

export default App;
