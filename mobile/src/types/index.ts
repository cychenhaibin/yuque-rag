// 用户类型
export interface User {
  username: string;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
  device_info?: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
  expires_in: number;
}

// 消息类型
export type MessageRole = 'user' | 'assistant';

// 来源类型
export interface Source {
  type: 'knowledge_base' | 'web_search';
  title: string;
  url?: string;
  repo?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  sources?: Source[];
}

// 聊天会话
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 问答请求
export interface ChatRequest {
  question: string;
  use_web_search?: boolean;
  use_hybrid?: boolean;
}

// 问答响应
export interface ChatResponse {
  answer: string;
  sources?: Source[];
}

// SSE 数据
export interface SSEData {
  content?: string;
  done?: boolean;
  error?: string;
  sources?: Source[];
}

// API 错误
export interface APIError {
  detail: string;
  status?: number;
}
