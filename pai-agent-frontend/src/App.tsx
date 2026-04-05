import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Button, Tag, Space, Typography } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import DebugDrawer from './components/DebugDrawer';
import NodeConfigPanel from './components/NodeConfig';
import Header from './components/Header';
import WorkflowModal from './components/WorkflowModal';
import RunWorkflowModal from './components/RunWorkflowModal';
import { useWorkflowStore } from './stores/workflowStore';
import { workflowApi } from './services/workflowApi';
import type { Workflow } from './types/workflow';
import './App.css';

const { Text } = Typography;

function App() {
  const {
    nodes,
    edges,
    currentWorkflow,
    setCurrentWorkflow,
    setNodes,
    setEdges,
    debugDrawerOpen,
    markAsSaved,
    markAsUnsaved,
  } = useWorkflowStore();
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowModalMode, setWorkflowModalMode] = useState<'load' | 'save'>('load');
  const [runWorkflowModalOpen, setRunWorkflowModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftData, setDraftData] = useState<{
    nodes: any[];
    edges: any[];
    currentWorkflow: any;
    timestamp: string;
  } | null>(null);

  // 页面加载时从 URL 读取工作流 ID 并加载
  useEffect(() => {
    const loadWorkflowFromURL = async () => {
      const params = new URLSearchParams(window.location.search);
      const workflowId = params.get('workflow');

      if (workflowId) {
        try {
          const workflow = await workflowApi.get(workflowId);
          setCurrentWorkflow(workflow);
          markAsSaved();
          // 加载成功后清除草稿
          localStorage.removeItem('workflow_draft');
        } catch (error) {
          console.error('加载工作流失败:', error);
          message.error('加载工作流失败：' + (error as any).message);
        }
      }
    };

    loadWorkflowFromURL();
  }, []);

  // 自动保存草稿到 localStorage（只在有未保存修改时）
  useEffect(() => {
    const saveDraft = () => {
      const state = useWorkflowStore.getState();
      const { hasUnsavedChanges, nodes, edges, currentWorkflow } = state;
      // 只有在有未保存修改时才保存草稿
      if (hasUnsavedChanges && nodes.length > 0) {
        const draft = {
          nodes,
          edges,
          currentWorkflow,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('workflow_draft', JSON.stringify(draft));
      }
    };

    const interval = setInterval(saveDraft, 30000); // 每 30 秒检查一次
    return () => clearInterval(interval);
  }, []);

  // 页面可见性变化时保存（用户切换标签页时）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const state = useWorkflowStore.getState();
        const { hasUnsavedChanges, nodes, edges, currentWorkflow } = state;
        if (hasUnsavedChanges && nodes.length > 0) {
          const draft = {
            nodes,
            edges,
            currentWorkflow,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('workflow_draft', JSON.stringify(draft));
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 恢复草稿
  useEffect(() => {
    const draft = localStorage.getItem('workflow_draft');
    if (draft && !currentWorkflow) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.nodes && parsed.nodes.length > 0) {
          // 有草稿时显示恢复弹窗
          setDraftData(parsed);
          setDraftModalOpen(true);
        }
      } catch (e) {
        console.error('恢复草稿失败:', e);
      }
    }
  }, []);

  // 处理恢复草稿
  const handleRestoreDraft = () => {
    if (draftData) {
      setNodes(draftData.nodes);
      setEdges(draftData.edges);
      if (draftData.currentWorkflow) {
        setCurrentWorkflow(draftData.currentWorkflow);
      }
      markAsUnsaved();
      message.success('已恢复草稿');
    }
    setDraftModalOpen(false);
  };

  // 处理忽略草稿
  const handleIgnoreDraft = () => {
    localStorage.removeItem('workflow_draft');
    setDraftModalOpen(false);
    setDraftData(null);
  };

  // 离开页面提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { hasUnsavedChanges } = useWorkflowStore.getState();
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
    markAsSaved(); // 新建工作流时标记为已保存
    // 清除草稿和 URL 中的 workflow 参数
    localStorage.removeItem('workflow_draft');
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
        markAsSaved(); // 加载工作流时标记为已保存
        // 加载成功后清除草稿
        localStorage.removeItem('workflow_draft');
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
      message.error('加载工作流失败');
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
        markAsSaved();
        localStorage.removeItem('workflow_draft'); // 保存成功后清除草稿
        message.success('工作流已更新！');
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
        markAsSaved();
        localStorage.removeItem('workflow_draft'); // 保存成功后清除草稿
        message.success(`工作流已创建！ID: ${newWorkflow.id}`);
      }
    } catch (error) {
      console.error('保存工作流失败:', error);
      message.error('保存工作流失败：' + (error as any).message);
    }
  };

  const handleRunWorkflow = () => {
    // 打开运行工作流弹窗
    setRunWorkflowModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* 顶部导航栏 */}
      <Header
        onNewWorkflow={handleNewWorkflow}
        onLoadWorkflow={handleLoadWorkflow}
        onSaveWorkflow={handleSaveWorkflowClick}
        onRunWorkflow={handleRunWorkflow}
      />

      {/* 主体内容区域 */}
      <div
        className="app-body"
        style={{
          marginBottom: debugDrawerOpen ? '360px' : '48px',
          transition: 'margin-bottom 0.2s ease',
        }}
      >
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

      {/* 运行工作流弹窗 */}
      <RunWorkflowModal
        open={runWorkflowModalOpen}
        onClose={() => setRunWorkflowModalOpen(false)}
      />

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

      {/* 草稿恢复弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#faad14' }} />
            <span>检测到未保存的工作流草稿</span>
          </div>
        }
        open={draftModalOpen}
        onCancel={handleIgnoreDraft}
        footer={[
          <Button key="ignore" onClick={handleIgnoreDraft}>
            忽略
          </Button>,
          <Button key="restore" type="primary" onClick={handleRestoreDraft}>
            恢复草稿
          </Button>,
        ]}
        width={480}
      >
        {draftData && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">上次编辑时间：</Text>
                  <Tag color="default">
                    {new Date(draftData.timestamp).toLocaleString('zh-CN')}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProjectOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">工作流名称：</Text>
                  <Tag color="blue">
                    {draftData.currentWorkflow?.name || '未命名工作流'}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <NodeIndexOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">内容统计：</Text>
                  <Space>
                    <Tag color="success">{draftData.nodes.length} 个节点</Tag>
                    <Tag color="processing">{draftData.edges.length} 条连接</Tag>
                  </Space>
                </div>
              </Space>
            </div>
            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                padding: 12,
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: '#52c41a' }}>
                💡 提示：恢复草稿将加载上次编辑的内容，忽略则丢弃草稿。
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;
