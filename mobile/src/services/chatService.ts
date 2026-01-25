import {apiClient, APIClient} from './api';
import {ChatRequest, ChatResponse, SSEData, Source} from '../types';
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
   * 使用 XMLHttpRequest 来处理流式响应，因为 React Native 的 fetch API 对 ReadableStream 支持有限
   * @param question 用户问题
   * @param onChunk 接收到数据块时的回调
   * @param onComplete 完成时的回调，接收 sources 参数
   * @param onError 错误时的回调
   */
  static async chatStream(
    question: string,
    onChunk: (content: string) => void,
    onComplete: (sources?: Source[]) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      (async () => {
        try {
          console.log('[ChatStream] 开始流式请求, 问题:', question);
          
          const {Config} = await import('../config');
          const {Storage} = await import('../utils/storage');
          
          const token = await Storage.getToken();
          const url = `${Config.API_BASE_URL}/chat/stream`;
          
          
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          } else {
            console.warn( '[ChatStream] 未找到认证 token');
          }
          
          let buffer = '';
          let lastProcessedLength = 0;
          
          // 使用 onreadystatechange 来处理流式数据
          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
              // 获取新的数据部分
              const currentText = xhr.responseText;
              const newData = currentText.substring(lastProcessedLength);
              
              if (newData) {
                buffer += newData;
                lastProcessedLength = currentText.length;
                
                // 按行处理新数据
                const lines = buffer.split('\n');
                // 保留最后一个不完整的行
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                  if (line.trim()) {
                    const sseData = SSEParser.parseLine(line);
                    if (sseData) {
                      
                      // 处理内容块
                      if (sseData.content !== undefined) {
                        onChunk(sseData.content);
                      }
                      
                      // 处理完成标记
                      if (sseData.done) {
                        if (sseData.error) {
                          console.error('[ChatStream] 错误:', sseData.error);
                          onError(sseData.error);
                          reject(new Error(sseData.error));
                        } else {
                          onComplete(sseData.sources);
                          resolve();
                        }
                        return;
                      }
                      
                      // 处理错误
                      if (sseData.error) {
                        console.error('[ChatStream] SSE 数据中包含错误:', sseData.error);
                        onError(sseData.error);
                        reject(new Error(sseData.error));
                        return;
                      }
                    }
                  }
                }
              }
            }
            
            if (xhr.readyState === XMLHttpRequest.DONE) {
              console.log('[ChatStream] 请求完成, 状态码:', xhr.status);
              
              if (xhr.status === 200) {
                // 处理缓冲区中剩余的数据
                if (buffer.trim()) {
                  console.log('[ChatStream] 处理缓冲区剩余数据:', buffer);
                  const sseData = SSEParser.parseLine(buffer);
                  if (sseData) {
                    if (sseData.content !== undefined) {
                      onChunk(sseData.content);
                    }
                    if (sseData.done) {
                      if (sseData.error) {
                        onError(sseData.error);
                        reject(new Error(sseData.error));
                      } else {
                        onComplete(sseData.sources);
                        resolve();
                      }
                      return;
                    }
                  }
                }
                // 如果没有收到 done 标记，也调用完成
                onComplete();
                resolve();
              } else {
                const errorMsg = `HTTP ${xhr.status}: ${xhr.statusText}`;
                console.error('[ChatStream] 请求失败:', errorMsg);
                onError(errorMsg);
                reject(new Error(errorMsg));
              }
            }
          };
          
          xhr.onerror = () => {
            const errorMsg = '网络请求失败';
            console.error('[ChatStream] 网络错误');
            onError(errorMsg);
            reject(new Error(errorMsg));
          };
          
          xhr.ontimeout = () => {
            const errorMsg = '请求超时';
            console.error('[ChatStream] 请求超时');
            onError(errorMsg);
            reject(new Error(errorMsg));
          };
          
          console.log('[ChatStream] 发送 POST 请求...');
          xhr.send(JSON.stringify({question} as ChatRequest));
        } catch (error: any) {
          console.error('[ChatStream] 初始化失败:', error);
          onError(APIClient.handleError(error));
          reject(error);
        }
      })();
    });
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
