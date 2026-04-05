import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { Workflow, ExecutionResponse } from '../types/workflow';

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
  executionLogs: { timestamp: string; message: string; durationMs?: number; nodeType?: string; nodeId?: string; nodeLabel?: string; output?: string; type?: string }[];
  executionResult: ExecutionResponse | null;

  // 调试抽屉状态
  debugDrawerOpen: boolean;
  debugInput: string;

  // 节点配置面板状态
  configDrawerOpen: boolean;
  selectedNode: Node | null;

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
  addExecutionLog: (log: { message: string; durationMs?: number; nodeType?: string; nodeId?: string; nodeLabel?: string; output?: string; type?: string }) => void;
  setExecutionResult: (result: ExecutionResponse | null) => void;

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
  debugDrawerOpen: false,
  debugInput: '',
  configDrawerOpen: false,
  selectedNode: null,

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

  // 调试抽屉管理
  setDebugDrawerOpen: (open) => set({ debugDrawerOpen: open }),
  setDebugInput: (input) => set({ debugInput: input }),

  // 配置面板管理
  setConfigDrawerOpen: (open) => set({ configDrawerOpen: open }),
  setSelectedNode: (node) => set({ selectedNode: node }),
}));
