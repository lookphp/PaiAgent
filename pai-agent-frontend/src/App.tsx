import React, { useEffect } from 'react';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import DebugDrawer from './components/DebugDrawer';
import NodeConfigPanel from './components/NodeConfig';
import Header from './components/Header';
import { useWorkflowStore } from './stores/workflowStore';
import { workflowApi } from './services/workflowApi';
import './App.css';

function App() {
  const { nodes, edges, currentWorkflow, setCurrentWorkflow, setNodes, setEdges, workflows, setWorkflows } = useWorkflowStore();

  // 页面加载时从 URL 读取工作流 ID 并加载
  useEffect(() => {
    const loadWorkflowFromURL = async () => {
      const params = new URLSearchParams(window.location.search);
      const workflowId = params.get('workflow');

      if (workflowId) {
        try {
          const workflow = await workflowApi.get(workflowId);
          setCurrentWorkflow(workflow);
          // 解析 JSON 字符串为数组
          const parsedNodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
          const parsedEdges = typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges;
          setNodes(parsedNodes || []);
          setEdges(parsedEdges || []);
        } catch (error) {
          console.error('加载工作流失败:', error);
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

  const handleLoadWorkflow = async () => {
    try {
      const list = await workflowApi.list();
      setWorkflows(list);

      // 显示选择对话框
      const selectedId = window.prompt(
        '请输入要加载的工作流 ID，或输入列表编号：\n' +
        list.map((w, i) => `${i + 1}. ${w.name} (ID: ${w.id})`).join('\n')
      );

      if (!selectedId) return;

      // 如果输入的是数字，选择对应编号的工作流
      const index = parseInt(selectedId) - 1;
      let workflowId: string;

      if (index >= 0 && index < list.length) {
        workflowId = String(list[index].id);
      } else {
        workflowId = selectedId;
      }

      const workflow = await workflowApi.get(workflowId);
      setCurrentWorkflow(workflow);
      // 解析 JSON 字符串为数组
      const parsedNodes = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
      const parsedEdges = typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges;
      setNodes(parsedNodes || []);
      setEdges(parsedEdges || []);

      // 更新 URL
      window.history.pushState({}, '', `?workflow=${workflowId}`);

      alert(`已加载工作流：${workflow.name}`);
    } catch (error) {
      console.error('加载工作流失败:', error);
      alert('加载工作流失败，请重试');
    }
  };

  const handleSaveWorkflow = async () => {
    try {
      if (currentWorkflow) {
        // 更新现有工作流 - 直接发送对象，让 nodes 和 edges 保持为数组
        const updatedData: any = {
          name: currentWorkflow.name,
          description: currentWorkflow.description,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
        };
        await workflowApi.update(String(currentWorkflow.id), updatedData);

        // 更新本地状态
        setCurrentWorkflow({
          ...currentWorkflow,
          nodes,
          edges,
          updatedAt: new Date().toISOString(),
        });
        alert('工作流已更新！');
      } else {
        // 创建新工作流
        const name = window.prompt('请输入工作流名称：') || '未命名工作流';
        const newWorkflow = await workflowApi.create({
          name,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
        } as any);

        // 解析返回的 JSON 字符串为数组
        const parsedNodes = typeof newWorkflow.nodes === 'string' ? JSON.parse(newWorkflow.nodes) : newWorkflow.nodes;
        const parsedEdges = typeof newWorkflow.edges === 'string' ? JSON.parse(newWorkflow.edges) : newWorkflow.edges;

        // 更新本地状态
        setCurrentWorkflow({
          ...newWorkflow,
          nodes: parsedNodes || [],
          edges: parsedEdges || [],
        });

        // 更新 URL
        window.history.pushState({}, '', `?workflow=${newWorkflow.id}`);
        alert(`工作流已创建！ID: ${newWorkflow.id}`);
      }
    } catch (error) {
      console.error('保存工作流失败:', error);
      alert('保存工作流失败，请重试');
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
