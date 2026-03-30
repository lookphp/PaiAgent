import api from './api';
import type { Workflow, ExecutionRequest, ExecutionResponse } from '../types/workflow';

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

  // 执行工作流
  execute: async (request: ExecutionRequest): Promise<ExecutionResponse> => {
    const response = await api.post<ExecutionResponse>('/execution', request);
    return response.data;
  },
};

export default workflowApi;
