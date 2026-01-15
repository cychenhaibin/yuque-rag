import React from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useColorScheme, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Animated} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { Logo } from '../asserts/logo';
import {useAuth} from '../contexts/AuthContext';
import {useHeaderContext, HeaderProvider} from '../contexts/HeaderContext';
import {LoginScreen} from '../screens/LoginScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {LoadingIndicator} from '../components/LoadingIndicator';
import {DrawerScreen} from '../components/CustomDrawer';
import {Colors} from '../config';

// 定义导航参数类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Chat: undefined;
  History: undefined;
  Profile: undefined;
  Drawer: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

/**
 * 自定义聊天页面头部
 */
const ChatHeader = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const {headerOpacity} = useHeaderContext();
  
  const handleMenuPress = () => {
    (navigation as any).navigate('Drawer');
  };

  const borderColor = isDark ? Colors.borderDark : Colors.border;
  return (
    <Animated.View
      style={[
        headerStyles.container,
        {
          paddingTop: insets.top + 12,
          opacity: headerOpacity,
        },
      ]}>
      <TouchableOpacity
        style={[
          headerStyles.menuButton,
          {
            backgroundColor: isDark
              ? Colors.inputBackgroundDark
              : Colors.inputBackground,
            borderColor,
          },
          {borderWidth: isDark ? 0.5 : 0},
        ]}
        onPress={handleMenuPress}>
        <Icon name="menu" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* <View style={headerStyles.rightButtons}>
        <Logo width={100} height={40} />
      </View> */}
    </Animated.View>
  );
};

/**
 * 认证栈导航
 */
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * 主应用导航
 */
const MainNavigator = () => {
  const isDark = useColorScheme() === 'dark';

  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: isDark ? Colors.textDark : Colors.text,
      }}>
      <MainStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          header: () => <ChatHeader />,
        }}
      />
      <MainStack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: '历史记录',
          headerShown: true,
        }}
      />
      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '个人中心',
          headerShown: true,
        }}
      />
      <MainStack.Screen
        name="Drawer"
        component={DrawerScreen}
        options={({ navigation }) => ({
          headerShown: false,
          presentation: 'transparentModal',
          cardOverlayEnabled: true,
          cardStyle: {
            backgroundColor: 'transparent',
          },
          cardStyleInterpolator: ({ current, layouts }) => {
            const translateX = current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-layouts.screen.width, 0],
            });

            const overlayOpacity = current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            return {
              cardStyle: {
                transform: [{ translateX }],
              },
              overlayStyle: {
                opacity: overlayOpacity,
              },
            };
          },
          cardOverlay: ({ style }) => (
            <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(0,0,0,0.5)' }
                ]}
              />
            </TouchableWithoutFeedback>
          ),
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 260 },
            },
            close: {
              animation: 'timing',
              config: { duration: 220 },
            },
          },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        })}
      />
    </MainStack.Navigator>
  );
};

/**
 * 根导航
 */
export const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();
  const isDark = useColorScheme() === 'dark';

  if (isLoading) {
    return <LoadingIndicator text="加载中..." />;
  }

  return (
    <HeaderProvider>
      <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: Colors.primary,
          background: 'transparent',
          card: isDark ? Colors.cardDark : Colors.card,
          text: isDark ? Colors.textDark : Colors.text,
          border: isDark ? Colors.borderDark : Colors.border,
          notification: Colors.primary,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '600',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '700',
          },
        },
      }}>
        <RootStack.Navigator screenOptions={{headerShown: false}}>
          {isAuthenticated ? (
            <RootStack.Screen name="Main" component={MainNavigator} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </HeaderProvider>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
    
  },
  menuButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android 阴影
    elevation: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rightButtons: {
    backgroundColor: Colors.white,
    paddingRight: 10,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
