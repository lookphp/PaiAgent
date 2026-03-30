import React from 'react';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import DebugDrawer from './components/DebugDrawer';
import NodeConfigPanel from './components/NodeConfig';
import Header from './components/Header';
import { useWorkflowStore } from './stores/workflowStore';
import './App.css';

function App() {
  const { nodes, edges, currentWorkflow, setCurrentWorkflow, setNodes, setEdges } = useWorkflowStore();

  const handleDragStart = (event: React.DragEvent, nodeType: string, modelType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('modelType', modelType || '');
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setCurrentWorkflow(null);
  };

  const handleLoadWorkflow = () => {
    // TODO: 实现加载工作流
  };

  const handleSaveWorkflow = () => {
    // TODO: 实现保存工作流
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
        onSaveWorkflow={handleSaveWorkflow}
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
            onSaveWorkflow={handleSaveWorkflow}
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
    </div>
  );
}

export default App;
