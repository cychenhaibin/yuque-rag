import axios, {AxiosInstance, AxiosError} from 'axios';
import {Config} from '../config';
import {Storage} from '../utils/storage';
import {APIError} from '../types';

/**
 * API 客户端配置
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: Config.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加 Token
    this.client.interceptors.request.use(
      async config => {
        const token = await Storage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器 - 错误处理
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError<APIError>) => {
        if (error.response?.status === 401) {
          // Token 过期或无效，清除本地存储
          await Storage.removeToken();
          await Storage.removeUsername();
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * 获取 Axios 实例
   */
  getInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * 处理 API 错误
   */
  static handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      
      if (axiosError.response) {
        // 服务器返回错误
        return axiosError.response.data?.detail || '服务器错误';
      } else if (axiosError.request) {
        // 请求已发送但没有收到响应
        return '网络连接失败，请检查网络';
      }
    }
    
    // 其他错误
    return error.message || '未知错误';
  }
}

// 导出单例
export const apiClient = new APIClient().getInstance();
export {APIClient};
