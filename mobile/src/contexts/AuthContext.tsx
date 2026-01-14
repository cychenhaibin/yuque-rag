import React, {createContext, useState, useContext, useEffect, ReactNode} from 'react';
import {AuthService} from '../services/authService';
import {User} from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, []);

  /**
   * 检查登录状态
   */
  const checkLoginStatus = async () => {
    try {
      setIsLoading(true);
      const isLoggedIn = await AuthService.isLoggedIn();
      
      if (isLoggedIn) {
        // 尝试获取用户信息
        try {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token 可能过期，从本地存储获取用户名
          const username = await AuthService.getStoredUsername();
          if (username) {
            setUser({username});
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 登录
   */
  const login = async (username: string, password: string) => {
    try {
      const response = await AuthService.login(username, password);
      setUser({username: response.username});
    } catch (error) {
      throw error;
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
      // 即使失败也清除用户状态
      setUser(null);
    }
  };

  /**
   * 刷新用户信息
   */
  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 使用认证上下文的 Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


