import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ScrollView,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../contexts/AlertContext';
import {Colors, Spacing, FontSizes} from '../config';
import { Logo } from '../asserts/logo';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const {login} = useAuth();
  const {showInfo, showError} = useAlert();
  const isDark = useColorScheme() === 'dark';

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showInfo('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      // 登录成功后，AuthContext 会自动处理导航
    } catch (error: any) {
      showError(error.message || '请检查用户名和密码', '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const cardColor = isDark ? Colors.cardDark : Colors.card;
  const textColor = isDark ? Colors.textDark : Colors.text;
  const textSecondary = isDark ? Colors.textSecondaryDark : Colors.textSecondary;
  const borderColor = isDark ? Colors.borderDark : Colors.border;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Logo 区域 */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Logo />
            </View>
            <Text style={[styles.subtitle, {color: textSecondary}]}>
              Intelligent Knowledge Retrieval & Generation
            </Text>
          </View>

          {!showLoginForm ? (
            /* 初始欢迎界面 - 只显示 Next 按钮 */
            <View style={styles.welcomeContainer}>
              <View style={styles.termsContainer}>
                <Text style={[styles.termsText, {color: textSecondary}]}>
                  By logging in or signing up, you agree to our{' '}
                  <Text style={[styles.termsLink, {color: Colors.primary}]}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={[styles.termsLink, {color: Colors.primary}]}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.nextButton, {backgroundColor: Colors.primary}]}
                  onPress={() => setShowLoginForm(true)}>
                  <Text style={styles.nextButtonText}>Log In</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity style={styles.linkButton}>
                  <Text style={[styles.linkText, {color: Colors.primary}]}>
                    Network Diagnosis
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton}>
                  <Text style={[styles.deviceIdText, {color: textSecondary}]}>
                    Device ID: {'{device_id}'}
                  </Text>
                </TouchableOpacity> */}
              </View>
            </View>
          ) : (
            /* 登录表单 */
            <View style={[styles.formContainer, {backgroundColor: cardColor}]}>
              <Text style={[styles.formTitle, {color: textColor}]}>Sign In</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: textSecondary}]}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                      color: textColor,
                      borderColor,
                    },
                  ]}
                  placeholder="Enter your username"
                  placeholderTextColor={textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: textSecondary}]}>Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                      color: textColor,
                      borderColor,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  {backgroundColor: Colors.primary},
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Logging in...' : 'Next'}
                </Text>
              </TouchableOpacity>

              {/* 测试账号提示 */}
              {/* <View style={styles.hintContainer}>
                <Text style={[styles.hintTitle, {color: textSecondary}]}>
                  Test Account:
                </Text>
                <Text style={[styles.hintText, {color: textSecondary}]}>
                  admin / admin123
                </Text>
                <Text style={[styles.hintText, {color: textSecondary}]}>
                  user1 / password123
                </Text>
                <Text style={[styles.hintText, {color: textSecondary}]}>
                  test / test123
                </Text>
              </View> */}

              {/* 返回按钮 */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowLoginForm(false)}>
                <Text style={[styles.backButtonText, {color: textSecondary}]}>
                  ← Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    marginRight: Spacing.xl,
  },
  logoText: {
    color: '#fff',
    fontSize: FontSizes.xxlarge,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.small,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  termsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  termsText: {
    fontSize: FontSizes.small,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
  },
  nextButton: {
    width: '100%',
    paddingVertical: Spacing.base,
    borderRadius: 4,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  linkText: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
  },
  deviceIdText: {
    fontSize: FontSizes.small,
    marginTop: Spacing.xs,
  },
  formContainer: {
    borderRadius: 12,
    padding: Spacing.lg,
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
  },
  formTitle: {
    fontSize: FontSizes.xlarge,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.medium,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.medium,
    borderWidth: 1,
  },
  loginButton: {
    paddingVertical: Spacing.base,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: FontSizes.large,
    fontWeight: '600',
  },
  hintContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hintTitle: {
    fontSize: FontSizes.small,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  hintText: {
    fontSize: FontSizes.small,
    marginTop: 2,
  },
  backButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
  },
});
