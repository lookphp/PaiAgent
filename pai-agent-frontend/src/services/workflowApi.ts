import api from './api';
import type { Workflow, ExecutionRequest, ExecutionResponse, ExecutionHistory, ResumeRequest } from '../types/workflow';

/**
 * 工作流 API 服务
 */
export const workflowApi = {
  // 获取所有工作流
  list: async (): Promise<Workflow[]> => {
    const response = await api.get<Workflow[]>('/workflows');
    return response.data;
  },

  // 获取单个工作流
  get: async (id: string): Promise<Workflow> => {
    const response = await api.get<Workflow>(`/workflows/${id}`);
    return response.data;
  },

  // 创建工作流
  create: async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> => {
    const response = await api.post<Workflow>('/workflows', workflow);
    return response.data;
  },

  // 更新工作流
  update: async (id: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put<Workflow>(`/workflows/${id}`, workflow);
    return response.data;
  },

  // 删除工作流
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  // ========== 执行相关接口 ==========

  // 开始执行（支持暂停点配置）
  startExecution: async (request: ExecutionRequest): Promise<ExecutionResponse> => {
    const response = await api.post<ExecutionResponse>('/execution/start', request);
    return response.data;
  },

  // 获取执行状态
  getExecutionStatus: async (executionId: number): Promise<ExecutionResponse> => {
    const response = await api.get<ExecutionResponse>(`/execution/${executionId}/status`);
    return response.data;
  },

  // 恢复执行
  resumeExecution: async (executionId: number, request: ResumeRequest): Promise<ExecutionResponse> => {
    const response = await api.post<ExecutionResponse>(`/execution/${executionId}/resume`, request);
    return response.data;
  },

  // 取消执行
  cancelExecution: async (executionId: number): Promise<ExecutionResponse> => {
    const response = await api.post<ExecutionResponse>(`/execution/${executionId}/cancel`);
    return response.data;
  },

  // 执行工作流（兼容旧接口）
  execute: async (request: ExecutionRequest): Promise<ExecutionResponse> => {
    // 如果有暂停配置，使用 startExecution
    if (request.suspendOnNodeTypes || request.suspendOnNodeIds) {
      return workflowApi.startExecution(request);
    }

    // 如果有 workflowId 且不是 0，使用标准执行端点
    if (request.workflowId && request.workflowId !== 0) {
      const response = await api.post<ExecutionResponse>('/execution', {
        workflowId: request.workflowId,
        input: request.input,
      });
      return response.data;
    }
    // 否则使用快速执行端点，传递节点和边
    const response = await api.post<ExecutionResponse>('/execution/quick', {
      workflowId: 0,
      input: request.input,
      parameters: request.parameters,
    });
    return response.data;
  },

  // ========== 执行历史相关接口 ==========

  // 获取所有执行历史
  getExecutionHistory: async (): Promise<ExecutionHistory[]> => {
    const response = await api.get<ExecutionHistory[]>('/execution-history');
    return response.data;
  },

  // 根据ID获取执行历史
  getExecutionHistoryById: async (id: number): Promise<ExecutionHistory> => {
    const response = await api.get<ExecutionHistory>(`/execution-history/${id}`);
    return response.data;
  },

  // 根据工作流ID获取执行历史
  getExecutionHistoryByWorkflowId: async (workflowId: number): Promise<ExecutionHistory[]> => {
    const response = await api.get<ExecutionHistory[]>(`/execution-history/workflow/${workflowId}`);
    return response.data;
  },

  // 删除执行历史
  deleteExecutionHistory: async (id: number): Promise<void> => {
    await api.delete(`/execution-history/${id}`);
  },
};

export default workflowApi;