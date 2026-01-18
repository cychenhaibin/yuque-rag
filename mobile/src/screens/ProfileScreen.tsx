import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import {Colors, Spacing, FontSizes} from '../config';
import {Storage} from '../utils/storage';

export const ProfileScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const {showConfirm, showError, showSuccess, showInfo} = useAlert();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isDark = useColorScheme() === 'dark';

  /**
   * 处理登出
   */
  const handleLogout = () => {
    showConfirm(
      '确认登出',
      '确定要退出登录吗？',
      async () => {
        setIsLoggingOut(true);
        try {
          await logout();
        } catch (error) {
          showError('登出失败，请重试');
        } finally {
          setIsLoggingOut(false);
        }
      },
    );
  };

  /**
   * 清空聊天历史
   */
  const handleClearHistory = () => {
    showConfirm(
      '确认清空',
      '确定要清空所有聊天历史吗？此操作不可恢复。',
      async () => {
        try {
          await Storage.clearChatHistory();
          showSuccess('已清空所有历史记录');
        } catch (error) {
          showError('清空失败，请重试');
        }
      },
    );
  };

  /**
   * 关于应用
   */
  const handleAbout = () => {
    showInfo(
      'QuickQue 问答系统\n版本: 1.0.0\n\n基于检索增强生成技术，为您提供智能问答服务。',
      '关于应用',
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
      <View style={styles.userCard}>
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
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, {color: textSecondary}]}>
          数据管理
        </Text>
        <MenuItem
          icon="schedule"
          title="清空聊天历史"
          onPress={handleClearHistory}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, {color: textSecondary}]}>
          关于
        </Text>
        <MenuItem icon="info" title="关于应用" onPress={handleAbout} />
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
    color: Colors.white,
    fontSize: FontSizes.xxlarge,
  },
  username: {
    fontSize: FontSizes.xxlarge,
    // fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  userRole: {
    fontSize: FontSizes.small,
  },
  menuSection: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '500',
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


