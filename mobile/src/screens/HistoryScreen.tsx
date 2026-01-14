import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ChatSession} from '../types';
import {Storage} from '../utils/storage';
import {Colors, Spacing, FontSizes} from '../config';

export const HistoryScreen: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useColorScheme() === 'dark';

  // 页面聚焦时加载历史
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  /**
   * 加载历史记录
   */
  const loadHistory = async () => {
    try {
      const data = await Storage.getChatHistory();
      // 按时间倒序排列
      setSessions(data.reverse());
    } catch (error) {
      console.error('加载历史失败:', error);
    }
  };

  /**
   * 下拉刷新
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  /**
   * 清空所有历史
   */
  const handleClearAll = () => {
    Alert.alert(
      '确认清空',
      '确定要清空所有聊天历史吗？此操作不可恢复。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            try {
              await Storage.clearChatHistory();
              setSessions([]);
              Alert.alert('成功', '已清空所有历史记录');
            } catch (error) {
              Alert.alert('错误', '清空失败，请重试');
            }
          },
        },
      ],
    );
  };

  /**
   * 删除单个会话
   */
  const handleDeleteSession = (sessionId: string) => {
    Alert.alert('确认删除', '确定要删除这个对话吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = sessions.filter(s => s.id !== sessionId);
            await Storage.saveChatHistory(updated.reverse());
            setSessions(updated);
          } catch (error) {
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  /**
   * 格式化时间
   */
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}-${day}`;
    }
  };

  /**
   * 渲染会话项
   */
  const renderSessionItem = ({item}: {item: ChatSession}) => {
    const messageCount = item.messages.length;
    const lastMessage = item.messages[item.messages.length - 1];

    return (
      <View
        style={[
          styles.sessionItem,
          {
            backgroundColor: isDark ? Colors.cardDark : Colors.card,
            borderBottomColor: isDark ? Colors.borderDark : Colors.border,
          },
        ]}>
        <View style={styles.sessionContent}>
          <View style={styles.sessionHeader}>
            <Text
              style={[
                styles.sessionTitle,
                {color: isDark ? Colors.textDark : Colors.text},
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              style={[
                styles.sessionDate,
                {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary},
              ]}>
              {formatDate(item.updatedAt)}
            </Text>
          </View>
          {lastMessage && (
            <Text
              style={[
                styles.sessionPreview,
                {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary},
              ]}
              numberOfLines={2}>
              {lastMessage.content}
            </Text>
          )}
          <Text
            style={[
              styles.sessionMeta,
              {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary},
            ]}>
            {messageCount} 条消息
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSession(item.id)}>
          <Icon
            name="delete-outline"
            size={24}
            color={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const textColor = isDark ? Colors.textDark : Colors.text;
  const textSecondary = isDark
    ? Colors.textSecondaryDark
    : Colors.textSecondary;

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? Colors.cardDark : Colors.card,
            borderBottomColor: isDark ? Colors.borderDark : Colors.border,
          },
        ]}>
        <Text style={[styles.headerTitle, {color: textColor}]}>聊天历史</Text>
        {sessions.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}>
            <Text style={[styles.clearButtonText, {color: Colors.primary}]}>
              清空全部
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 历史列表 */}
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chat-bubble-outline" size={64} color={textSecondary} />
          <Text style={[styles.emptyText, {color: textSecondary}]}>
            暂无聊天历史
          </Text>
          <Text style={[styles.emptySubtext, {color: textSecondary}]}>
            开始一段新对话吧
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={renderSessionItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FontSizes.xlarge,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
  },
  sessionItem: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sessionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  sessionDate: {
    fontSize: FontSizes.small,
  },
  sessionPreview: {
    fontSize: FontSizes.medium,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  sessionMeta: {
    fontSize: FontSizes.small,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSizes.medium,
    marginTop: Spacing.xs,
  },
});


