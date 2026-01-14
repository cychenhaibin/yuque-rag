import {SSEData} from '../types';

/**
 * SSE (Server-Sent Events) 解析器
 */
export class SSEParser {
  /**
   * 解析 SSE 数据流
   * @param line SSE 数据行
   * @returns 解析后的数据对象，如果不是有效的数据行则返回 null
   */
  static parseLine(line: string): SSEData | null {
    // 移除首尾空格
    const trimmed = line.trim();
    
    // 跳过空行
    if (!trimmed) {
      return null;
    }
    
    // 检查是否是 data: 开头
    if (!trimmed.startsWith('data: ')) {
      return null;
    }
    
    try {
      // 提取 data: 后面的 JSON 字符串
      const jsonStr = trimmed.substring(6); // 'data: '.length = 6
      const data = JSON.parse(jsonStr);
      return data;
    } catch (error) {
      console.error('解析 SSE 数据失败:', error, '原始数据:', line);
      return null;
    }
  }

  /**
   * 解析多行 SSE 数据
   * @param chunk 包含多行的 SSE 数据块
   * @returns 解析后的数据对象数组
   */
  static parseChunk(chunk: string): SSEData[] {
    const lines = chunk.split('\n');
    const results: SSEData[] = [];
    
    for (const line of lines) {
      const data = this.parseLine(line);
      if (data) {
        results.push(data);
      }
    }
    
    return results;
  }
}


