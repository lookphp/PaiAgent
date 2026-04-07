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

// 执行状态枚举
export type ExecutionStatus = 'idle' | 'running' | 'suspended' | 'completed' | 'error' | 'cancelled';

// 执行请求接口
export interface ExecutionRequest {
  workflowId: number;
  input: string;
  parameters?: Record<string, any>;
  /** 在哪些节点类型后暂停（如 ["llm"]） */
  suspendOnNodeTypes?: string[];
  /** 在哪些节点ID后暂停 */
  suspendOnNodeIds?: string[];
  /** 从哪个节点开始执行（用于恢复） */
  resumeFromNodeId?: string;
  /** 初始变量（用于恢复时传递已完成的变量） */
  initialVariables?: Record<string, any>;
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
  /** 执行会话ID */
  executionId?: number;
  /** 执行状态 */
  status?: ExecutionStatus;
  /** 暂停节点ID */
  suspendedNodeId?: string;
  /** 暂停节点类型 */
  suspendedNodeType?: string;
  /** 暂停节点的输出（供编辑） */
  suspendedOutput?: string;
}

// 恢复执行请求接口
export interface ResumeRequest {
  /** 修改后的输出内容 */
  modifiedOutput: string;
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

// 执行历史记录接口
export interface ExecutionHistory {
  id: number;
  workflowId?: number;
  workflowName?: string;
  inputText: string;
  outputText?: string;
  audioUrl?: string;
  executionLogs?: string; // JSON字符串
  totalDuration?: number;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  status: 'success' | 'error';
  errorMessage?: string;
  nodeCount?: number;
  executedAt: string;
}

// 暂停数据接口
export interface SuspendedData {
  nodeId: string;
  nodeType: string;
  output: string;
}

// 暂停配置接口
export interface SuspendConfig {
  nodeTypes: string[];
}

// SSE 执行事件接口
export interface ExecutionEvent {
  /** 事件类型: node_start, node_complete, workflow_complete, workflow_error */
  eventType: string;
  /** 节点 ID */
  nodeId?: string;
  /** 节点类型 (input, llm, tool, output) */
  nodeType?: string;
  /** 节点名称 */
  nodeLabel?: string;
  /** 执行状态 (running, completed, error) */
  status: string;
  /** 输出内容 */
  output?: string;
  /** 错误信息 */
  error?: string;
  /** 执行耗时 (毫秒) */
  durationMs?: number;
  /** 输入 token 数量 */
  inputTokens?: number;
  /** 输出 token 数量 */
  outputTokens?: number;
  /** 总 token 数量 */
  totalTokens?: number;
  /** 音频 URL */
  audioUrl?: string;
  /** 最终输出内容 */
  finalOutput?: string;
  /** 总执行耗时 */
  totalDuration?: number;
  /** 事件时间戳 */
  timestamp?: number;
}