import api from './api';
import { useAuthStore, User } from '../stores/authStore';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  userId: number;
  message: string;
}

export const authApi = {
  /**
   * 用户登录
   */
  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', request);
    return response.data;
  },

  /**
   * 用户注册
   */
  register: async (request: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', request);
    return response.data;
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * 用户登出
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};