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

  // 执行状态
  isExecuting: boolean;
  executionLogs: string[];
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

  // Actions - React Flow
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: any) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;

  // Actions - 执行
  setIsExecuting: (executing: boolean) => void;
  addExecutionLog: (log: string) => void;
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
  nodes: [],
  edges: [],
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

  setCurrentWorkflow: (workflow) => {
    set({ currentWorkflow: workflow });
    if (workflow) {
      set({ nodes: workflow.nodes || [], edges: workflow.edges || [] });
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
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    }));
  },

  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge] }));
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    }));
  },

  // 执行状态管理
  setIsExecuting: (executing) => set({ isExecuting: executing }),

  addExecutionLog: (log) => {
    set((state) => ({
      executionLogs: [...state.executionLogs, log],
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
