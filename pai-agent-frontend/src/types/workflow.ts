// 节点类型定义
export type NodeType = 'input' | 'llm' | 'tool' | 'output';

// 节点数据接口
export interface NodeData {
  label: string;
  type?: string; // 模型类型或服务类型
  config?: Record<string, any>; // 节点配置
  output?: string; // 执行输出结果
}

// 边数据接口
export interface EdgeData {
  label?: string;
}

// 工作流接口
export interface Workflow {
  id?: number;
  name: string;
  description?: string;
  nodes: any[]; // React Flow nodes
  edges: any[]; // React Flow edges
  createdAt?: string;
  updatedAt?: string;
}

// 执行请求接口
export interface ExecutionRequest {
  workflowId: number;
  input: string;
  parameters?: Record<string, any>;
}

// 执行响应接口
export interface ExecutionResponse {
  success: boolean;
  output?: string;
  audioUrl?: string;
  logs?: ExecutionLog[];
  error?: string;
  totalDuration?: number;
  totalTokens?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
}

// 执行日志接口
export interface ExecutionLog {
  message: string;
  timestamp?: string;
  durationMs?: number;
  nodeType?: string;
  nodeId?: string;
  nodeLabel?: string;
  output?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}
