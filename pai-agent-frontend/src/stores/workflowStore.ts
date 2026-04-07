import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { Workflow, ExecutionResponse, ExecutionStatus, SuspendedData, SuspendConfig, ExecutionEvent } from '../types/workflow';

interface WorkflowState {
  // 工作流列表
  workflows: Workflow[];
  currentWorkflow: Workflow | null;

  // React Flow 状态
  nodes: Node[];
  edges: Edge[];

  // 保存状态
  hasUnsavedChanges: boolean;

  // 执行状态
  isExecuting: boolean;
  executionLogs: { timestamp: string; message: string; durationMs?: number; nodeType?: string; nodeId?: string; nodeLabel?: string; output?: string; type?: string; inputTokens?: number; outputTokens?: number; totalTokens?: number }[];
  executionResult: ExecutionResponse | null;

  // 节点执行状态 (用于在画布上显示节点状态)
  nodeExecutionStatus: Record<string, 'idle' | 'running' | 'completed' | 'error'>;

  // 增量执行状态
  executionSessionId: number | null;
  executionStatus: ExecutionStatus;
  suspendedData: SuspendedData | null;
  suspendConfig: SuspendConfig;
  editedOutput: string;

  // 调试抽屉状态
  debugDrawerOpen: boolean;
  debugInput: string;

  // 节点配置面板状态
  configDrawerOpen: boolean;
  selectedNode: Node | null;

  // SSE 连接关闭函数
  closeSSEConnection: (() => void) | null;

  // Actions - 工作流管理
  addWorkflow: (workflow: Workflow) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  saveCurrentWorkflow: () => void;
  setWorkflows: (workflows: Workflow[]) => void;

  // Actions - React Flow
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: any) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;

  // Actions - 保存状态
  markAsSaved: () => void;
  markAsUnsaved: () => void;

  // Actions - 执行
  setIsExecuting: (executing: boolean) => void;
  addExecutionLog: (log: { message: string; durationMs?: number; nodeType?: string; nodeId?: string; nodeLabel?: string; output?: string; type?: string; inputTokens?: number; outputTokens?: number; totalTokens?: number }) => void;
  setExecutionResult: (result: ExecutionResponse | null) => void;

  // Actions - 节点执行状态
  setNodeExecutionStatus: (nodeId: string, status: 'idle' | 'running' | 'completed' | 'error') => void;
  clearAllNodeExecutionStatus: () => void;
  handleExecutionEvent: (event: ExecutionEvent) => void;

  // Actions - SSE 连接
  setCloseSSEConnection: (closeFunc: (() => void) | null) => void;

  // Actions - 增量执行
  setExecutionSessionId: (id: number | null) => void;
  setExecutionStatus: (status: ExecutionStatus) => void;
  setSuspendedData: (data: SuspendedData | null) => void;
  setSuspendConfig: (config: SuspendConfig) => void;
  setEditedOutput: (output: string) => void;
  resetExecution: () => void;

  // Actions - 调试抽屉
  setDebugDrawerOpen: (open: boolean) => void;
  setDebugInput: (input: string) => void;

  // Actions - 配置面板
  setConfigDrawerOpen: (open: boolean) => void;
  setSelectedNode: (node: Node | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // 初始状态
  workflows: [],
  currentWorkflow: null,
  nodes: [
    // 默认的输入节点
    {
      id: 'input-default',
      type: 'input',
      position: { x: 100, y: 100 },
      data: { label: '用户输入' },
    },
    // 默认的输出节点
    {
      id: 'output-default',
      type: 'output',
      position: { x: 100, y: 400 },
      data: { label: '输出', outputFormat: 'audio' },
    },
  ] as Node[],
  edges: [],
  hasUnsavedChanges: false,
  isExecuting: false,
  executionLogs: [],
  executionResult: null,
  nodeExecutionStatus: {},
  executionSessionId: null,
  executionStatus: 'idle',
  suspendedData: null,
  suspendConfig: { nodeTypes: [] },
  editedOutput: '',
  debugDrawerOpen: false,
  debugInput: '',
  configDrawerOpen: false,
  selectedNode: null,
  closeSSEConnection: null,

  // 工作流管理
  addWorkflow: (workflow) => {
    set((state) => ({
      workflows: [...state.workflows, workflow],
    }));
  },

  setWorkflows: (workflows) => {
    set({ workflows });
  },

  setCurrentWorkflow: (workflow) => {
    set({ currentWorkflow: workflow });
    if (workflow) {
      // 处理 nodes - 可能是 JSON 字符串或数组
      let parsedNodes: Node[] = [];
      if (workflow.nodes) {
        if (typeof workflow.nodes === 'string') {
          try {
            parsedNodes = JSON.parse(workflow.nodes);
          } catch (e) {
            parsedNodes = [];
          }
        } else {
          parsedNodes = workflow.nodes as Node[];
        }
      }

      // 为没有 position 的节点添加默认位置
      parsedNodes = parsedNodes.map((node, index) => ({
        ...node,
        position: node.position || { x: 100 + index * 50, y: 100 + index * 50 },
      }));

      // 处理 edges - 可能是 JSON 字符串或数组
      let parsedEdges: Edge[] = [];
      if (workflow.edges) {
        if (typeof workflow.edges === 'string') {
          try {
            parsedEdges = JSON.parse(workflow.edges);
          } catch (e) {
            parsedEdges = [];
          }
        } else {
          parsedEdges = workflow.edges as Edge[];
        }
      }

      // 为没有 id 的边添加 id
      parsedEdges = parsedEdges.map((edge) => ({
        ...edge,
        id: edge.id || `${edge.source}-${edge.target}`,
        type: edge.type || 'smoothstep',
      }));

      set({ nodes: parsedNodes, edges: parsedEdges });
    }
  },

  saveCurrentWorkflow: () => {
    const { currentWorkflow, nodes, edges } = get();
    if (currentWorkflow) {
      const updatedWorkflow = {
        ...currentWorkflow,
        nodes,
        edges,
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === currentWorkflow.id ? updatedWorkflow : w
        ),
        currentWorkflow: updatedWorkflow,
      }));
    }
  },

  // React Flow 管理
  setNodes: (nodes) => set({ nodes, hasUnsavedChanges: true }),
  setEdges: (edges) => set({ edges, hasUnsavedChanges: true }),

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node], hasUnsavedChanges: true }));
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
      hasUnsavedChanges: true,
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      hasUnsavedChanges: true,
    }));
  },

  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge], hasUnsavedChanges: true }));
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      hasUnsavedChanges: true,
    }));
  },

  // 保存状态管理
  markAsSaved: () => set({ hasUnsavedChanges: false }),
  markAsUnsaved: () => set({ hasUnsavedChanges: true }),

  // 执行状态管理
  setIsExecuting: (executing) => set({ isExecuting: executing }),

  addExecutionLog: (log) => {
    set((state) => ({
      executionLogs: [...state.executionLogs, {
        timestamp: new Date().toLocaleTimeString(),
        message: log.message,
        durationMs: log.durationMs,
        nodeType: log.nodeType,
        nodeId: log.nodeId,
        nodeLabel: log.nodeLabel,
        output: log.output,
        type: log.type || 'system',
      }],
    }));
  },

  setExecutionResult: (result) => set({ executionResult: result }),

  // 节点执行状态管理
  setNodeExecutionStatus: (nodeId, status) => set((state) => ({
    nodeExecutionStatus: { ...state.nodeExecutionStatus, [nodeId]: status },
  })),

  clearAllNodeExecutionStatus: () => set({ nodeExecutionStatus: {} }),

  handleExecutionEvent: (event) => {
    const { eventType, nodeId, nodeType, nodeLabel, status, output, durationMs, inputTokens, outputTokens, totalTokens, error, finalOutput, audioUrl, totalDuration } = event;

    // 根据事件类型处理
    if (eventType === 'node_start') {
      // 节点开始执行
      set((state) => ({
        nodeExecutionStatus: { ...state.nodeExecutionStatus, [nodeId!]: 'running' },
      }));
      get().addExecutionLog({
        message: `${nodeLabel} 开始执行`,
        nodeType: nodeType!,
        nodeId: nodeId!,
        nodeLabel: nodeLabel!,
        type: nodeType!,
      });
    } else if (eventType === 'node_complete') {
      // 节点执行完成
      set((state) => ({
        nodeExecutionStatus: { ...state.nodeExecutionStatus, [nodeId!]: 'completed' },
      }));
      get().addExecutionLog({
        message: `${nodeLabel} 执行完成`,
        durationMs: durationMs!,
        nodeType: nodeType!,
        nodeId: nodeId!,
        nodeLabel: nodeLabel!,
        output: output,
        type: nodeType!,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: totalTokens,
      });
    } else if (eventType === 'workflow_complete') {
      // 工作流完成
      set({
        executionStatus: 'completed',
        isExecuting: false,
        executionResult: {
          success: true,
          output: finalOutput,
          audioUrl: audioUrl,
          totalDuration: totalDuration,
          totalTokens: totalTokens,
          totalInputTokens: inputTokens,
          totalOutputTokens: outputTokens,
        },
      });
      get().addExecutionLog({ message: '执行完成', type: 'success' });
    } else if (eventType === 'workflow_error') {
      // 工作流出错
      set({
        executionStatus: 'error',
        isExecuting: false,
        nodeExecutionStatus: nodeId ? { ...get().nodeExecutionStatus, [nodeId]: 'error' } : get().nodeExecutionStatus,
        executionResult: { success: false, error: error },
      });
      get().addExecutionLog({ message: `执行失败: ${error}`, type: 'error' });
    }
  },

  // SSE 连接管理
  setCloseSSEConnection: (closeFunc) => set({ closeSSEConnection: closeFunc }),

  // 增量执行状态管理
  setExecutionSessionId: (id) => set({ executionSessionId: id }),
  setExecutionStatus: (status) => set({ executionStatus: status }),
  setSuspendedData: (data) => {
    set({ suspendedData: data });
    if (data) {
      set({ editedOutput: data.output });
    }
  },
  setSuspendConfig: (config) => set({ suspendConfig: config }),
  setEditedOutput: (output) => set({ editedOutput: output }),
  resetExecution: () => {
    // 关闭 SSE 连接（如果存在）
    const { closeSSEConnection } = get();
    if (closeSSEConnection) {
      closeSSEConnection();
    }
    set({
      executionSessionId: null,
      executionStatus: 'idle',
      suspendedData: null,
      editedOutput: '',
      executionLogs: [],
      executionResult: null,
      isExecuting: false,
      nodeExecutionStatus: {},
      closeSSEConnection: null,
    });
  },

  // 调试抽屉管理
  setDebugDrawerOpen: (open) => set({ debugDrawerOpen: open }),
  setDebugInput: (input) => set({ debugInput: input }),

  // 配置面板管理
  setConfigDrawerOpen: (open) => set({ configDrawerOpen: open }),
  setSelectedNode: (node) => set({ selectedNode: node }),
}));