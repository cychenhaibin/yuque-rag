import AsyncStorage from '@react-native-async-storage/async-storage';
import {Config} from '../config';
import {ChatSession} from '../types';

/**
 * Storage 工具类 - 封装 AsyncStorage 操作
 */
export class Storage {
  /**
   * 保存 Token
   */
  static async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(Config.TOKEN_KEY, token);
    } catch (error) {
      console.error('保存 Token 失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Token
   */
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(Config.TOKEN_KEY);
    } catch (error) {
      console.error('获取 Token 失败:', error);
      return null;
    }
  }

  /**
   * 删除 Token
   */
  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(Config.TOKEN_KEY);
    } catch (error) {
      console.error('删除 Token 失败:', error);
      throw error;
    }
  }

  /**
   * 保存用户名
   */
  static async saveUsername(username: string): Promise<void> {
    try {
      await AsyncStorage.setItem(Config.USERNAME_KEY, username);
    } catch (error) {
      console.error('保存用户名失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户名
   */
  static async getUsername(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(Config.USERNAME_KEY);
    } catch (error) {
      console.error('获取用户名失败:', error);
      return null;
    }
  }

  /**
   * 删除用户名
   */
  static async removeUsername(): Promise<void> {
    try {
      await AsyncStorage.removeItem(Config.USERNAME_KEY);
    } catch (error) {
      console.error('删除用户名失败:', error);
      throw error;
    }
  }

  /**
   * 保存聊天历史
   */
  static async saveChatHistory(sessions: ChatSession[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(sessions);
      await AsyncStorage.setItem(Config.CHAT_HISTORY_KEY, jsonValue);
    } catch (error) {
      console.error('保存聊天历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取聊天历史
   */
  static async getChatHistory(): Promise<ChatSession[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(Config.CHAT_HISTORY_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      return [];
    }
  }

  /**
   * 清空聊天历史
   */
  static async clearChatHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(Config.CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('清空聊天历史失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有数据
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('清空所有数据失败:', error);
      throw error;
    }
  }
}


