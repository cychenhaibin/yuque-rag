import {apiClient, APIClient} from './api';
import {LoginRequest, LoginResponse, User} from '../types';
import {Storage} from '../utils/storage';
import {Config} from '../config';

/**
 * 认证服务
 */
export class AuthService {
  /**
   * 用户登录
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const request: LoginRequest = {
        username,
        password,
        device_info: Config.DEVICE_INFO,
      };

      const response = await apiClient.post<LoginResponse>('/auth/login', request);
      const data = response.data;

      // 保存 Token 和用户名
      await Storage.saveToken(data.access_token);
      await Storage.saveUsername(data.username);

      return data;
    } catch (error) {
      throw new Error(APIClient.handleError(error));
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('登出 API 调用失败:', error);
      // 即使 API 调用失败，也继续清除本地数据
    } finally {
      // 清除本地存储
      await Storage.removeToken();
      await Storage.removeUsername();
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(APIClient.handleError(error));
    }
  }

  /**
   * 检查是否已登录
   */
  static async isLoggedIn(): Promise<boolean> {
    const token = await Storage.getToken();
    return token !== null;
  }

  /**
   * 获取存储的用户名
   */
  static async getStoredUsername(): Promise<string | null> {
    return await Storage.getUsername();
  }
}


