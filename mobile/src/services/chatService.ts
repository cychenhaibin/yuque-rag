import {apiClient, APIClient} from './api';
import {ChatRequest, ChatResponse, SSEData} from '../types';
import {SSEParser} from '../utils/sseParser';

/**
 * 聊天服务
 */
export class ChatService {
  /**
   * 发送问题（一次性返回）
   */
  static async chat(question: string): Promise<string> {
    try {
      const request: ChatRequest = {question};
      const response = await apiClient.post<ChatResponse>('/chat', request);
      return response.data.answer;
    } catch (error) {
      throw new Error(APIClient.handleError(error));
    }
  }

  /**
   * 发送问题（流式返回）
   * @param question 用户问题
   * @param onChunk 接收到数据块时的回调
   * @param onComplete 完成时的回调
   * @param onError 错误时的回调
   */
  static async chatStream(
    question: string,
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
  ): Promise<void> {
    try {
      // React Native 环境下对 ReadableStream 支持有限，
      // 这里简化为一次性请求，然后通过 onChunk/onComplete 回调给前端，
      // 这样可以复用已有的非流式接口，并避免“无法读取响应流”的错误。
      const answer = await this.chat(question);
      if (answer) {
        onChunk(answer);
      }
      onComplete();
    } catch (error: any) {
      onError(error.message || '发送消息失败');
    }
  }

  /**
   * 获取认证头
   */
  private static async getAuthHeader(): Promise<Record<string, string>> {
    const Storage = (await import('../utils/storage')).Storage;
    const token = await Storage.getToken();
    
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    
    return {};
  }
}


