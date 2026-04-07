import api from './api';
import type { Workflow, ExecutionRequest, ExecutionResponse, ExecutionHistory, ResumeRequest, ExecutionEvent } from '../types/workflow';

const API_BASE_URL = 'http://localhost:8080/api';

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

  // ========== SSE 实时执行 ==========

  /**
   * SSE 实时执行工作流
   * @param request 执行请求
   * @param onEvent 事件回调函数
   * @param onError 错误回调函数
   * @returns 返回关闭连接的函数
   */
  executeStream: (
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void,
    onError?: (error: Error) => void
  ): (() => void) => {
    // 使用 fetch API 发送 POST 请求，然后读取 SSE 流
    const controller = new AbortController();
    const signal = controller.signal;

    // 构建请求 body
    const body: any = {
      workflowId: request.workflowId || 0,
      input: request.input,
      suspendOnNodeTypes: request.suspendOnNodeTypes,
      suspendOnNodeIds: request.suspendOnNodeIds,
      resumeFromNodeId: request.resumeFromNodeId,
      initialVariables: request.initialVariables,
    };

    // 如果没有 workflowId，使用 parameters 中的 nodes 和 edges
    if (!request.workflowId || request.workflowId === 0) {
      body.parameters = request.parameters;
    }

    // 启动 SSE 连接
    fetch(`${API_BASE_URL}/execution/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is null');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[SSE] Stream done');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          console.log('[SSE] Received buffer:', buffer.length, 'bytes');

          // 解析 SSE 事件 - 按双换行符分割完整事件
          const events = buffer.split('\n\n');
          // 保留最后一个可能不完整的事件
          buffer = events.pop() || '';

          for (const eventStr of events) {
            if (eventStr.trim()) {
              // 解析事件内容
              const lines = eventStr.split('\n');
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const data = line.slice(5).trim();
                  if (data) {
                    try {
                      const event: ExecutionEvent = JSON.parse(data);
                      console.log('[SSE] Parsed event:', event.eventType);
                      onEvent(event);
                    } catch (e) {
                      console.error('[SSE] Failed to parse:', data, e);
                    }
                  }
                }
              }
            }
          }
        }

        // 处理剩余的 buffer
        if (buffer.trim()) {
          console.log('[SSE] Processing remaining buffer');
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              if (data) {
                try {
                  const event: ExecutionEvent = JSON.parse(data);
                  console.log('[SSE] Parsed event (final):', event.eventType);
                  onEvent(event);
                } catch (e) {
                  console.error('[SSE] Failed to parse:', data, e);
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && onError) {
          onError(error);
        }
      });

    // 返回关闭连接的函数
    return () => {
      controller.abort();
    };
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