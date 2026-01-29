import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Text,
  Keyboard,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import {MessageBubble} from '../components/MessageBubble';
import {ChatInput} from '../components/ChatInput';
import {Message, Source} from '../types';
import {ChatService} from '../services/chatService';
import {Colors, Spacing} from '../config';
import {Storage} from '../utils/storage';
import {useHeaderContext} from '../contexts/HeaderContext';
import {MainStackParamList} from '../navigation/AppNavigator';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isDark = useColorScheme() === 'dark';
  const currentStreamingMessageId = useRef<string | null>(null);
  const isLoadingRef = useRef(false); // 使用 ref 来避免闭包问题
  const currentSessionId = useRef<string | null>(null); // 当前会话ID
  const hasHandledCreateNew = useRef(false); // 标记是否已处理过 createNew
  const insets = useSafeAreaInsets();
  
  // 滚动相关状态
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentHeightRef = useRef<number>(0); // 存储内容高度
  const layoutHeightRef = useRef<number>(0); // 存储布局高度
  const {headerOpacity} = useHeaderContext();
  const inputTranslateY = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // 滚动到底部的辅助函数
  const scrollToEnd = useCallback((delay: number = 100) => {
    setTimeout(() => {
      const contentHeight = contentHeightRef.current;
      const layoutHeight = layoutHeightRef.current;
      const extraOffset = 100; // 在底部基础上再向下滚动的距离
      
      if (contentHeight > 0 && layoutHeight > 0) {
        // 计算目标偏移量：内容高度 - 布局高度 + 额外偏移量
        // 这样可以让内容超出可视区域底部 100px
        const targetOffset = contentHeight - layoutHeight + extraOffset;
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, targetOffset),
          animated: true,
        });
      } else {
        // 如果高度未知，先滚动到底部
        flatListRef.current?.scrollToEnd({animated: true});
      }
    }, delay);
  }, []);

  /**
   * 加载聊天历史
   */
  const loadHistory = useCallback(async (createNew: boolean = false, sessionId?: string) => {
    try {
      if (createNew) {
        // 新建对话，清空消息
        setMessages([]);
        currentSessionId.current = null;
        return;
      }

      const sessions = await Storage.getChatHistory();
      
      // 如果指定了 sessionId，加载该会话
      if (sessionId) {
        const targetSession = sessions.find(s => s.id === sessionId);
        if (targetSession) {
          setMessages(targetSession.messages);
          currentSessionId.current = targetSession.id;
          // 加载完成后滚动到底部
          setTimeout(() => {
            scrollToEnd(200);
          }, 300);
          return;
        }
        // 如果找不到指定的会话，则清空消息
        setMessages([]);
        currentSessionId.current = null;
        return;
      }
      
      // 未指定 sessionId，加载最新的会话
      if (sessions.length > 0) {
        const latestSession = sessions[sessions.length - 1];
        setMessages(latestSession.messages);
        currentSessionId.current = latestSession.id;
        // 加载完成后滚动到底部
        setTimeout(() => {
          scrollToEnd(200);
        }, 300);
      } else {
        currentSessionId.current = null;
      }
    } catch (error) {
      console.error('加载历史失败:', error);
    }
  }, [scrollToEnd]);

  // 监听路由参数，处理新建对话或加载特定会话
  useEffect(() => {
    const createNew = route.params?.createNew ?? false;
    const sessionId = route.params?.sessionId;

    if (createNew) {
      // 新建对话，清空消息，创建新会话ID
      // 无论 hasHandledCreateNew 的状态如何，都要执行新建
      const newSessionId = `session_${Date.now()}`;
      setMessages([]);
      currentSessionId.current = newSessionId;
      hasHandledCreateNew.current = true;
    } else if (sessionId && currentSessionId.current !== sessionId) {
      // 加载指定的会话
      loadHistory(false, sessionId);
      hasHandledCreateNew.current = false; // 加载会话时重置标志
    } else if (!createNew && !sessionId) {
      // 既不是新建也不是加载特定会话，重置标志
      hasHandledCreateNew.current = false;
    }
  }, [route.params?.createNew, route.params?.sessionId, loadHistory]);

  // 首次加载时加载历史
  useFocusEffect(
    useCallback(() => {
      // 仅在消息为空且不是新建对话且没有指定 sessionId 时加载最新历史
      const sessionId = route.params?.sessionId;
      const createNew = route.params?.createNew ?? false;
      if (messages.length === 0 && !currentSessionId.current && !createNew && !sessionId) {
        loadHistory(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.sessionId, route.params?.createNew])
  );

  // 当消息加载完成后，自动滚动到底部（用于初始化）
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      // 延迟滚动，确保 FlatList 已完全渲染
      const timer = setTimeout(() => {
        scrollToEnd(300);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isLoading, scrollToEnd]);

  // 监听键盘事件
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardWillShowListener = Keyboard.addListener(
      showEvent,
      (e) => {
        setIsKeyboardVisible(true);
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        // 键盘弹起时确保输入框位置重置为 0，避免闪烁
        Animated.timing(inputTranslateY, {
          toValue: 0,
          duration: 0, // 立即重置，避免动画
          useNativeDriver: true,
        }).start();
        // 键盘弹起时，将输入框上移
        // 输入框原本 bottom: 24，键盘高度为 height
        // 为了让输入框在键盘上方，需要上移 (键盘高度 - 24)
        // 但考虑到输入框内部已有 paddingBottom: insets.bottom，实际只需要上移 (height - 24)
        const offset = -(height - 24);
        Animated.timing(keyboardOffset, {
          toValue: offset,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 100,
          useNativeDriver: true,
        }).start();
        // 键盘弹起时滚动到底部
        scrollToEnd(100);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      hideEvent,
      (e) => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        // 键盘隐藏时，恢复输入框位置
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 100,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [scrollToEnd]);

  // 清理滚动定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 自动滚动到底部（当消息数量变化时）
  useEffect(() => {
    if (messages.length > 0) {
      // 延迟滚动，确保内容已渲染完成
      scrollToEnd(300);
    }
  }, [messages.length, scrollToEnd]);

  /**
   * 保存聊天历史
   */
  const saveHistory = useCallback(async (updatedMessages: Message[]) => {
    try {
      const sessions = await Storage.getChatHistory();
      const now = Date.now();
      
      // 如果有当前会话ID，尝试更新该会话
      if (currentSessionId.current) {
        const existingSessionIndex = sessions.findIndex(
          s => s.id === currentSessionId.current
        );
        
        if (existingSessionIndex !== -1) {
          // 更新现有会话
          const session = sessions[existingSessionIndex];
          session.messages = updatedMessages;
          session.updatedAt = now;
          // 更新标题（使用第一条用户消息）
          const firstUserMessage = updatedMessages.find(m => m.role === 'user');
          if (firstUserMessage) {
            session.title = firstUserMessage.content.substring(0, 30) || '新对话';
          }
          await Storage.saveChatHistory(sessions);
          return;
        }
      }
      
      // 没有当前会话或找不到现有会话，创建新会话
      // 如果已有会话ID（新建对话时创建），则使用它，否则生成新的
      const newSessionId = currentSessionId.current || `session_${now}`;
      const firstUserMessage = updatedMessages.find(m => m.role === 'user');
      const newSession = {
        id: newSessionId,
        title: firstUserMessage?.content.substring(0, 30) || '新对话',
        messages: updatedMessages,
        createdAt: now,
        updatedAt: now,
      };
      
      sessions.push(newSession);
      currentSessionId.current = newSessionId;
      await Storage.saveChatHistory(sessions);
    } catch (error) {
      console.error('保存历史失败:', error);
    }
  }, []);

  /**
   * 发送消息
   */
  const handleSend = useCallback(async (content: string) => {
    // 使用 ref 来检查加载状态，避免闭包问题
    if (isLoadingRef.current) {
      console.log('正在加载中，忽略重复请求');
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    // 添加用户消息
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    // 创建 AI 消息占位符
    const aiMessageId = `ai_${Date.now()}`;
    currentStreamingMessageId.current = aiMessageId;
    
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, aiMessage]);

    // 流式接收回复
    try {
      await ChatService.chatStream(
        content,
        // onChunk - 接收到内容片段
        (chunk: string) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id === aiMessageId) {
              lastMessage.content += chunk;
            }
            return updated;
          });
        },
        // onComplete - 完成
        (sources?: Source[]) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id === aiMessageId) {
              lastMessage.isStreaming = false;
              // 保存来源信息
              if (sources && sources.length > 0) {
                lastMessage.sources = sources;
              }
              // 保存历史
              saveHistory(updated);
            }
            return updated;
          });
          isLoadingRef.current = false;
          setIsLoading(false);
          currentStreamingMessageId.current = null;
          // 回答完成后自动滚动到底部，确保内容完全可见
          scrollToEnd(200);
        },
        // onError - 错误
        (error: string) => {
          setMessages(prev => {
            const updated = prev.filter(m => m.id !== aiMessageId);
            // 添加错误消息
            updated.push({
              id: `error_${Date.now()}`,
              role: 'assistant',
              content: `抱歉，发生错误：${error}`,
              timestamp: Date.now(),
            });
            return updated;
          });
          isLoadingRef.current = false;
          setIsLoading(false);
          currentStreamingMessageId.current = null;
        },
      );
    } catch (error: any) {
      console.error('发送消息失败:', error);
      // 确保错误时也重置状态
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== aiMessageId);
        return updated;
      });
      isLoadingRef.current = false;
      setIsLoading(false);
      currentStreamingMessageId.current = null;
    }
  }, [saveHistory]);

  // 处理滚动事件
  const handleScroll = Animated.event(
    [{nativeEvent: {contentOffset: {y: scrollY}}}],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const deltaY = currentScrollY - lastScrollY.current;
        const scrollThreshold = 10; // 滚动阈值，避免小幅度滚动触发
        
        // 更新内容高度和布局高度（如果可用）
        const {contentSize, layoutMeasurement} = event.nativeEvent;
        if (contentSize?.height) {
          contentHeightRef.current = contentSize.height;
        }
        if (layoutMeasurement?.height) {
          layoutHeightRef.current = layoutMeasurement.height;
        }

        // 清除之前的定时器
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // 如果滚动停止，显示两者（仅在键盘未显示时重置输入框位置）
        scrollTimeoutRef.current = setTimeout(() => {
          scrollDirection.current = null;
          const animations = [
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ];
          // 只有在键盘未显示时才重置输入框位置
          if (!isKeyboardVisible) {
            animations.push(
              Animated.timing(inputTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              })
            );
          }
          Animated.parallel(animations).start();
        }, 150);

        if (Math.abs(deltaY) > scrollThreshold) {
          if (deltaY > 0 && currentScrollY > 30) {
            // 向下滚动 - 隐藏顶部header
            if (scrollDirection.current !== 'down') {
              scrollDirection.current = 'down';
              Animated.timing(headerOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          } else if (deltaY < 0) {
            // 向上滚动 - 隐藏底部输入框（仅在键盘未显示时）
            if (scrollDirection.current !== 'up' && !isKeyboardVisible) {
              scrollDirection.current = 'up';
              Animated.timing(inputTranslateY, {
                toValue: 150,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }
        }

        // 接近顶部时显示两者（仅在键盘未显示时重置输入框位置）
        if (currentScrollY < 20) {
          const animations = [
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ];
          // 只有在键盘未显示时才重置输入框位置
          if (!isKeyboardVisible) {
            animations.push(
              Animated.timing(inputTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              })
            );
          }
          Animated.parallel(animations).start();
          scrollDirection.current = null;
        }

        lastScrollY.current = currentScrollY;
      },
    },
  );

  // 计算 header 高度（包含安全区域）
  const headerHeight = insets.top + 60; // 安全区域 + header 内容高度

  const containerStyle = [
    styles.container,
    {backgroundColor: isDark ? Colors.backgroundDark : Colors.background},
    Platform.OS === 'android' && keyboardHeight > 0 && {
      paddingBottom: insets.bottom,
    },
  ];

  const content = (
    <>
      {messages.length === 0 ? (
        <View style={[
          styles.emptyContainer, 
          {
            paddingTop: headerHeight,
            backgroundColor: isDark ? Colors.backgroundDark : Colors.background,
          }
        ]}>
          <Text style={[styles.emptyText, {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary}]}>
            👋 Hello! I am QuickQue assistant
          </Text>
          <Text style={[styles.emptySubtext, {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary}]}>
            What can I help you with?
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => <MessageBubble message={item} />}
          contentContainerStyle={[
            styles.messageList,
            {
              paddingTop: headerHeight,
              paddingBottom: insets.bottom + 100,
            },
          ]}
          // style={{backgroundColor: isDark ? Colors.backgroundDark : Colors.background}}
          style={{paddingBottom: insets.bottom + 100}}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={(contentWidth, contentHeight) => {
            // 更新内容高度
            contentHeightRef.current = contentHeight;
            // 当内容大小变化时自动滚动到底部
            scrollToEnd(150);
          }}
          onLayout={(event) => {
            // 更新布局高度
            layoutHeightRef.current = event.nativeEvent.layout.height;
            // 当布局变化时也滚动到底部，确保内容可见
            if (messages.length > 0) {
              scrollToEnd(200);
            }
          }}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <Animated.View
        style={{
          transform: [
            {translateY: Animated.add(inputTranslateY, keyboardOffset)},
          ],
        }}>
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder={isLoading ? 'AI is thinking...' : 'Ask QuickQue anything...'}
        />
      </Animated.View>
    </>
  );

  // 统一使用 KeyboardAvoidingView，虽然 ChatInput 是绝对定位，但可以保持一致性
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={containerStyle}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      enabled={Platform.OS === 'ios'}>
      {content}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingVertical: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
