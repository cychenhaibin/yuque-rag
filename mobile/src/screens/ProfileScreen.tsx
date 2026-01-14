import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../contexts/AuthContext';
import {Colors, Spacing, FontSizes} from '../config';
import {Storage} from '../utils/storage';

export const ProfileScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isDark = useColorScheme() === 'dark';

  /**
   * 处理登出
   */
  const handleLogout = () => {
    Alert.alert('确认登出', '确定要退出登录吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '登出',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (error) {
            Alert.alert('错误', '登出失败，请重试');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  /**
   * 清空聊天历史
   */
  const handleClearHistory = () => {
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
   * 关于应用
   */
  const handleAbout = () => {
    Alert.alert(
      '关于应用',
      'QuickQue 问答系统\n版本: 1.0.0\n\n基于检索增强生成技术，为您提供智能问答服务。',
    );
  };

  const cardColor = isDark ? Colors.cardDark : Colors.card;
  const textColor = isDark ? Colors.textDark : Colors.text;
  const textSecondary = isDark
    ? Colors.textSecondaryDark
    : Colors.textSecondary;
  const borderColor = isDark ? Colors.borderDark : Colors.border;

  const MenuItem = ({
    icon,
    title,
    onPress,
    danger = false,
  }: {
    icon: string;
    title: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, {borderBottomColor: borderColor}]}
      onPress={onPress}>
      <Icon
        name={icon}
        size={24}
        color={danger ? Colors.error : Colors.primary}
        style={styles.menuIcon}
      />
      <Text
        style={[
          styles.menuTitle,
          {color: danger ? Colors.error : textColor},
        ]}>
        {title}
      </Text>
      <Icon name="chevron-right" size={24} color={textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息卡片 */}
      <View style={[styles.userCard, {backgroundColor: cardColor}]}>
        <View style={[styles.avatar, {backgroundColor: Colors.primary}]}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.username, {color: textColor}]}>
          {user?.username || '未知用户'}
        </Text>
        <Text style={[styles.userRole, {color: textSecondary}]}>
          普通用户
        </Text>
      </View>

      {/* 功能菜单 */}
      <View style={[styles.menuSection, {backgroundColor: cardColor}]}>
        <Text style={[styles.sectionTitle, {color: textSecondary}]}>
          数据管理
        </Text>
        <MenuItem
          icon="history"
          title="清空聊天历史"
          onPress={handleClearHistory}
        />
      </View>

      <View style={[styles.menuSection, {backgroundColor: cardColor}]}>
        <Text style={[styles.sectionTitle, {color: textSecondary}]}>
          关于
        </Text>
        <MenuItem icon="info-outline" title="关于应用" onPress={handleAbout} />
      </View>

      {/* 登出按钮 */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {backgroundColor: Colors.primary},
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}>
          <Icon name="logout" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? '登出中...' : '退出登录'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 版本信息 */}
      <Text style={[styles.version, {color: textSecondary}]}>
        Version 1.0.0
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: FontSizes.xlarge,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  userRole: {
    fontSize: FontSizes.medium,
  },
  menuSection: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: FontSizes.medium,
  },
  logoutContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutIcon: {
    marginRight: Spacing.sm,
  },
  logoutText: {
    color: '#fff',
    fontSize: FontSizes.large,
    fontWeight: '600',
  },
  version: {
    fontSize: FontSizes.small,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});


