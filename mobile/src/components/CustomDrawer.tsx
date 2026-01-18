import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  useColorScheme,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, Spacing, FontSizes} from '../config';
import {useAuth} from '../contexts/AuthContext';
import {Storage} from '../utils/storage';
import {ChatSession} from '../types';
import {MainStackParamList} from '../navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAWER_WIDTH = 300;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

type DrawerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Drawer'>;

export const DrawerScreen: React.FC = () => {
  const navigation = useNavigation<DrawerScreenNavigationProp>();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const widthAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const sessions = await Storage.getChatHistory();
      setChatSessions(sessions.slice(-5).reverse());
    } catch (error) {
      console.error('加载历史失败:', error);
    }
  };

  const handleSearchExpand = () => {
    setIsSearchExpanded(true);
    Animated.timing(widthAnim, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchCollapse = () => {
    // 让输入框失焦
    searchInputRef.current?.blur();
    Keyboard.dismiss();
    
    setIsSearchExpanded(false);
    setSearchQuery('');
    Animated.timing(widthAnim, {
      toValue: DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    navigation.goBack();
    setIsSearchExpanded(false);
    setSearchQuery('');
    widthAnim.setValue(DRAWER_WIDTH);
  };

  const handleNewChat = () => {
    handleClose();
    // 延迟导航，确保 drawer 关闭动画完成后再导航
    setTimeout(() => {
      navigation.navigate('Chat', {createNew: true});
    }, 100);
  };

  const handleSessionClick = (sessionId: string) => {
    handleClose();
    // 延迟导航，确保 drawer 关闭动画完成后再导航
    setTimeout(() => {
      navigation.navigate('Chat', {sessionId});
    }, 100);
  };

  const handleNavigate = (screen: keyof MainStackParamList) => {
    handleClose();
    // 延迟导航，确保 drawer 关闭动画完成
    setTimeout(() => {
      navigation.navigate(screen);
    }, 100);
  };

  const backgroundColor = isDark ? Colors.backgroundDark : Colors.inputBackground;
  const cardColor = isDark ? Colors.cardDark : Colors.card;
  const textColor = isDark ? Colors.textDark : Colors.text;
  const textSecondary = isDark ? Colors.textSecondaryDark : Colors.textSecondary;
  const borderColor = isDark ? Colors.borderDark : Colors.border;

  return (
    <View style={[styles.container]}>
      {/* 抽屉内容 */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            backgroundColor: cardColor,
            width: widthAnim,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}>
          {/* 搜索框 */}
          <View style={[styles.searchContainer, {backgroundColor}]}>
            <TouchableOpacity
              onPress={isSearchExpanded ? handleSearchCollapse : handleSearchExpand}
              style={styles.searchIconButton}>
              <Icon
                name={isSearchExpanded ? 'arrow-back' : 'search'}
                size={25}
                color={textSecondary}
              />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, {color: textColor}]}
              placeholder="搜索"
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchExpand}
            />
          </View>

          <ScrollView style={styles.scrollView}>
            {isSearchExpanded ? (
              /* 搜索结果区域 */
              <View style={styles.searchResults}>
                {searchQuery ? (
                  chatSessions
                    .filter((session) =>
                      session.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((session) => (
                      <TouchableOpacity
                        key={session.id}
                        style={[
                          styles.searchResultItem,
                          {borderBottomColor: borderColor},
                        ]}
                        onPress={() => handleSessionClick(session.id)}>
                        <Icon name="history" size={20} color={textSecondary} />
                        <Text
                          style={[styles.searchResultText, {color: textColor}]}
                          numberOfLines={1}>
                          {session.title}
                        </Text>
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={[styles.emptyText, {color: textSecondary}]}>
                    输入关键词搜索历史对话
                  </Text>
                )}
              </View>
            ) : (
              <>
              {/* 主要功能菜单 */}
              <View style={styles.menuSection}>
              <TouchableOpacity
                style={[styles.menuItem, {backgroundColor: cardColor}]}
                onPress={handleNewChat}>
                <Icon name="edit" size={22} color={textColor} />
                <Text style={[styles.menuItemText, {color: textColor}]}>
                  新聊天
                </Text>
              </TouchableOpacity>
            </View>

            {/* 历史记录 */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={[styles.menuItem, {backgroundColor: cardColor}]}
                onPress={() => handleNavigate('History')}>
                <Icon name="history" size={22} color={textColor} />
                <Text style={[styles.menuItemText, {color: textColor}]}>
                  历史
                </Text>
              </TouchableOpacity>
            </View>

            {/* 最近对话 */}
            {chatSessions.length > 0 && (
              <View style={styles.historySection}>
                {chatSessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.historyItem,
                      {borderBottomColor: borderColor},
                    ]}
                    onPress={() => handleSessionClick(session.id)}>
                    <Text
                      style={[styles.historyTitle, {color: textColor}]}
                      numberOfLines={1}>
                      {session.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
              </>
            )}
          </ScrollView>

          {/* 底部用户信息 */}
          <TouchableOpacity
            style={styles.userSection}
            onPress={() => handleNavigate('Profile')}>
            <View style={[styles.userAvatar, {backgroundColor: Colors.primary}]}>
              <Text style={styles.userAvatarText}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, {color: textColor}]}>
                {user?.username || 'User'}
              </Text>
              <Icon name="arrow-drop-down" size={20} color={textSecondary} />
            </View>
          </TouchableOpacity>
        </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContainer: {
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 24,
    gap: Spacing.sm,
  },
  searchIconButton: {
    // padding: 4,
    // backgroundColor: 'red',
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.large,
    paddingVertical: Spacing.xs,
  },
  searchResults: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  searchResultText: {
    flex: 1,
    fontSize: FontSizes.medium,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FontSizes.medium,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  menuSection: {
    // marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontSize: FontSizes.large,
    fontWeight: '500',
  },
  historySection: {
    paddingHorizontal: Spacing.md,
  },
  historyItem: {
    paddingVertical: Spacing.md,
    // borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: FontSizes.large,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    // justifyContent: 'space-between',
  },
  userName: {
    fontSize: FontSizes.large,
    fontWeight: '600',
  },
});

