import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
  Text,
  Animated,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Voice from '@react-native-voice/voice';
import { Colors, Spacing, FontSizes } from '../config';

// 错误类型枚举
enum ErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_PERMANENTLY_DENIED = 'PERMISSION_PERMANENTLY_DENIED',
  RECOGNITION_SERVICE_UNAVAILABLE = 'RECOGNITION_SERVICE_UNAVAILABLE',
  RECOGNITION_FAILED = 'RECOGNITION_FAILED',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  MODULE_NOT_LINKED = 'MODULE_NOT_LINKED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  START_FAILED = 'START_FAILED',
  LANGUAGE_NOT_SUPPORTED = 'LANGUAGE_NOT_SUPPORTED',
}

// 统一的错误处理函数
const showErrorAlert = (type: ErrorType, errorMessage?: string) => {
  const messages: Record<ErrorType, { title: string; message: string; showSettings?: boolean }> = {
    [ErrorType.PERMISSION_DENIED]: {
      title: '权限被拒绝',
      message: '需要录音权限才能使用语音输入功能。',
      showSettings: true,
    },
    [ErrorType.PERMISSION_PERMANENTLY_DENIED]: {
      title: '权限被永久拒绝',
      message: '需要在设置中手动授予录音权限。是否前往设置？',
      showSettings: true,
    },
    [ErrorType.RECOGNITION_SERVICE_UNAVAILABLE]: {
      title: '语音识别服务不可用',
      message: '设备上没有安装语音识别引擎。\n\n解决方案：\n1. 安装 Google 语音识别引擎\n   - 打开 Google Play 商店\n   - 搜索 "Google" 或 "语音识别"\n   - 安装 Google 应用\n\n2. 或者使用其他语音识别应用\n\n3. 确保设备已连接网络',
    },
    [ErrorType.RECOGNITION_FAILED]: {
      title: '识别失败',
      message: '未能识别到有效语音，请重试。\n\n提示：\n- 请确保在安静环境中说话\n- 说话清晰，音量适中\n- 确保网络连接正常',
    },
    [ErrorType.MODULE_NOT_FOUND]: {
      title: '模块未找到',
      message: 'Voice 模块未正确导入。请检查:\n1. @react-native-voice/voice 是否已安装\n2. 是否已重新构建应用',
    },
    [ErrorType.MODULE_NOT_LINKED]: {
      title: '模块未链接',
      message: 'Voice 模块的原生方法未正确链接。\n\n请执行:\n1. cd android && ./gradlew clean\n2. cd .. && npm run android\n3. 完全卸载并重新安装应用',
    },
    [ErrorType.INITIALIZATION_FAILED]: {
      title: '初始化失败',
      message: errorMessage 
        ? `语音识别模块未正确链接。\n\n解决方案：\n1. 完全关闭应用并重新打开\n2. 重新构建应用\n3. 如果问题持续，请检查 @react-native-voice/voice 是否正确安装\n\n错误详情: ${errorMessage}`
        : '语音识别功能无法使用，请检查应用权限设置',
    },
    [ErrorType.START_FAILED]: {
      title: '启动失败',
      message: errorMessage 
        ? `无法启动语音识别\n\n错误: ${errorMessage}`
        : '无法启动语音识别，请重试',
    },
    [ErrorType.LANGUAGE_NOT_SUPPORTED]: {
      title: '提示',
      message: '设备可能不支持中文语音识别，已切换到英文识别模式。\n\n请使用英文说话。',
    },
  };

  const config = messages[type];
  if (!config) return;

  const buttons = config.showSettings
    ? [
        { text: '取消', style: 'cancel' as const },
        {
          text: '去设置',
          onPress: () => Linking.openSettings(),
        },
      ]
    : [{ text: '确定' }];

  Alert.alert(config.title, config.message, buttons);
};

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Ask QuickQue anything...',
}) => {
  const [message, setMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [speechVolume, setSpeechVolume] = useState<string>('');
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  
  // 手势相关（用于上滑取消）
  const startY = useRef(0);
  const cancelThreshold = 50; // 上滑取消的阈值（像素）
  
  // 录音动画
  const recordingScale = useRef(new Animated.Value(1)).current;
  
  // TextInput 引用，用于焦点管理
  const textInputRef = useRef<TextInput>(null);

  // 检查 Voice 模块是否真正可用（检查原生桥接）
  const checkVoiceModuleAvailable = (): boolean => {
    try {
      if (!Voice) {
        console.error('[Voice] 模块未导入');
        return false;
      }

      // 检查基本方法是否存在
      if (typeof Voice.start !== 'function' || typeof Voice.stop !== 'function') {
        console.error('[Voice] 方法不可用:', {
          hasStart: typeof Voice.start,
          hasStop: typeof Voice.stop,
          VoiceKeys: Object.keys(Voice || {}),
        });
        return false;
      }

      console.log('[Voice] 模块检查通过:', {
        hasStart: typeof Voice.start === 'function',
        hasStop: typeof Voice.stop === 'function',
        hasCancel: typeof Voice.cancel === 'function',
        hasIsAvailable: typeof Voice.isAvailable === 'function',
        hasIsRecognizing: typeof Voice.isRecognizing === 'function',
        hasDestroy: typeof Voice.destroy === 'function',
        hasRemoveAllListeners: typeof Voice.removeAllListeners === 'function',
      });
      return true;
    } catch (error) {
      console.error('[Voice] 检查模块时出错:', error);
      return false;
    }
  };

  // 检查语音识别服务是否可用（使用官方 API）
  const checkSpeechRecognitionAvailable = async (): Promise<boolean> => {
    try {
      // 使用官方 API 检查服务是否可用
      if (Voice && typeof Voice.isAvailable === 'function') {
        const isAvailable = await Voice.isAvailable();
        console.log('[Voice] 语音识别服务可用性:', isAvailable);
        
        if (!isAvailable) {
          return false;
        }

        // Android 上还可以检查可用的识别引擎
        if (Platform.OS === 'android' && typeof Voice.getSpeechRecognitionServices === 'function') {
          try {
            const services = await Voice.getSpeechRecognitionServices();
            console.log('[Voice] 可用的语音识别引擎:', services);
            if (!services || services.length === 0) {
              console.warn('[Voice] ⚠️ 语音识别引擎列表为空');
              console.warn('[Voice] 这通常意味着设备上未安装语音识别引擎');
              console.warn('[Voice] 请安装 Google 应用或其他语音识别引擎');
            }
            return services && services.length > 0;
          } catch (err) {
            console.warn('[Voice] 获取识别引擎列表失败:', err);
            // 即使获取失败，如果 isAvailable 为 true，仍然返回 true
            return true;
          }
        }
        
        return true;
      }
      
      // 如果 isAvailable 方法不存在，回退到原来的检查方式
      return true;
    } catch (error) {
      console.error('[Voice] 检查语音识别服务失败:', error);
      return false;
    }
  };

  // 开始录音（按住开始）- 长按时调用 Voice.start()，这会触发 onSpeechStart
  const handlePressIn = async (evt: any) => {
    if (!isVoiceMode || disabled || isRecording) return;
    
    console.log('[Voice] 按下按钮，准备启动语音识别');
    
    // 记录按下时的 Y 坐标，用于检测上滑取消
    if (evt?.nativeEvent?.pageY) {
      startY.current = evt.nativeEvent.pageY;
    }
    
    // 检查 Voice 模块是否可用
    if (!checkVoiceModuleAvailable()) {
      return;
    }
    
    // 检查语音识别服务是否可用
    const isServiceAvailable = await checkSpeechRecognitionAvailable();
    console.log('[Voice] 语音识别服务可用性:', isServiceAvailable);
    
    // 打印可用的语音识别服务列表
    if (Platform.OS === 'android' && Voice && typeof Voice.getSpeechRecognitionServices === 'function') {
      try {
        const services = await Voice.getSpeechRecognitionServices();
        console.log('[Voice] 可用的语音识别服务列表:', services);
        if (services && services.length > 0) {
          console.log('[Voice] 服务数量:', services.length);
          services.forEach((service: string, index: number) => {
            console.log(`[Voice] 服务 ${index + 1}: ${service}`);
          });
        } else {
          console.warn('[Voice] ⚠️ 未找到可用的语音识别服务');
          console.warn('[Voice] 可能的原因:');
          console.warn('[Voice] 1. 设备上未安装语音识别引擎（如 Google 语音识别引擎）');
          console.warn('[Voice] 2. 权限问题：请检查应用是否有录音权限');
          console.warn('[Voice] 3. Android 系统版本或定制系统不支持');
          console.warn('[Voice] 解决方案:');
          console.warn('[Voice] - 在 Google Play 商店安装 "Google" 应用（包含语音识别引擎）');
          console.warn('[Voice] - 或安装其他语音识别应用');
          console.warn('[Voice] - 确保应用已获得录音权限');
        }
      } catch (err) {
        console.error('[Voice] ❌ 获取语音识别服务列表失败:', err);
        console.error('[Voice] 错误详情:', JSON.stringify(err, null, 2));
      }
    } else if (Platform.OS === 'android') {
      console.warn('[Voice] ⚠️ getSpeechRecognitionServices 方法不可用');
      console.warn('[Voice] Voice 对象:', Voice ? Object.keys(Voice) : 'null');
    }
    
    if (!isServiceAvailable) {
      showErrorAlert(ErrorType.RECOGNITION_SERVICE_UNAVAILABLE);
      return;
    }
    
    // 再次检查并请求权限（Android 需要）
    let hasPermission = true;
    if (Platform.OS === 'android') {
      hasPermission = await checkAudioPermission();
      if (!hasPermission) {
        // 如果没有权限，尝试请求
        hasPermission = await requestAudioPermission();
      }
    }
    
    if (hasPermission) {
      try {
        // 尝试使用中文识别，如果设备不支持，会自动降级到英文
        // 语言代码优先级：zh-CN (简体中文) > zh-Hans-CN > zh-TW (繁体中文) > en-US (英文)
        const languageCodes = ['zh-CN', 'zh-Hans-CN', 'zh-TW', 'cmn-Hans-CN'];
        const fallbackLanguage = 'en-US';
        let startSuccess = false;
        let usedLanguage = '';
        
        // 先尝试中文语言代码
        for (const langCode of languageCodes) {
          try {
            console.log(`[Voice] 尝试使用中文语言: ${langCode}`);
            await Voice.start(langCode);
            console.log(`[Voice] Voice.start("${langCode}") 调用成功，等待 onSpeechStart 事件`);
            usedLanguage = langCode;
            startSuccess = true;
            break;
          } catch (error: any) {
            console.warn(`[Voice] 语言 ${langCode} 启动失败:`, error?.message || error);
            // 如果错误不是语言不支持，直接抛出
            if (error?.code !== '12' && !error?.message?.includes("Didn't understand")) {
              throw error;
            }
            // 继续尝试下一个语言代码
          }
        }
        
        // 如果所有中文语言都失败，尝试英文作为备选
        if (!startSuccess) {
          console.log(`[Voice] 中文识别不可用，尝试使用英文: ${fallbackLanguage}`);
          try {
            await Voice.start(fallbackLanguage);
            console.log(`[Voice] Voice.start("${fallbackLanguage}") 调用成功，等待 onSpeechStart 事件`);
            usedLanguage = fallbackLanguage;
            startSuccess = true;
            // 提示用户使用英文
            showErrorAlert(ErrorType.LANGUAGE_NOT_SUPPORTED);
          } catch (error: any) {
            console.error(`[Voice] 英文识别也失败:`, error);
            throw error;
          }
        }
        
        if (!startSuccess) {
          throw new Error('所有语言代码都启动失败');
        }
        
        console.log(`[Voice] 最终使用的语言: ${usedLanguage}`);
        // iOS 权限会在首次调用 Voice.start() 时自动请求
      } catch (error: any) {
        console.error('[Voice] 启动语音识别失败:', {
          error,
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
          errorType: typeof error,
          errorString: String(error),
        });
        
        const errorMessage = error?.message || String(error);
        const errorCode = error?.code;
        
        // 检查是否是权限错误（错误代码 9 表示权限不足）
        // 注意：错误代码 7 = ERROR_NO_MATCH（无匹配），不是权限错误
        if (errorCode === '9' || errorMessage?.includes('permission') || errorMessage?.includes('Permission') || errorMessage?.includes('Insufficient permissions')) {
          showErrorAlert(ErrorType.PERMISSION_DENIED);
        } else if (errorCode === '7') {
          // 错误代码 7 = ERROR_NO_MATCH（无匹配）- 未识别到有效语音
          // 静默处理，不显示错误，让用户可以重试
          console.log('[Voice] 未识别到有效语音（错误代码 7）');
        } else if (errorCode === '12' || errorMessage?.includes("Didn't understand")) {
          // 错误代码 12: 无法理解输入
          showErrorAlert(ErrorType.RECOGNITION_FAILED);
        } else if (errorCode === '5' || errorMessage?.includes('No recognition service')) {
          // 错误代码 5: 没有可用的语音识别服务
          showErrorAlert(ErrorType.RECOGNITION_SERVICE_UNAVAILABLE);
        } else if (
          errorMessage?.includes('startSpeech') || 
          errorMessage?.includes('null') || 
          errorMessage?.includes('Cannot read') ||
          errorMessage?.includes('undefined') ||
          errorMessage?.includes('not a function') ||
          errorMessage?.includes('Native module')
        ) {
          // 这是已知的 issue #568: 原生模块未正确初始化
          console.error('[Voice] 原生模块链接失败，详细信息:', {
            errorMessage,
            errorCode,
            VoiceAvailable: !!Voice,
            VoiceStartType: typeof Voice?.start,
          });
          showErrorAlert(ErrorType.INITIALIZATION_FAILED, errorMessage);
        } else {
          showErrorAlert(ErrorType.START_FAILED, `${errorMessage}\n代码: ${errorCode || 'N/A'}`);
        }
      }
    } else {
      // Android 权限被拒绝，提示用户
      showErrorAlert(ErrorType.PERMISSION_DENIED);
    }
  };

  // 停止录音（松开按钮）- 根据是否取消选择 stop 或 cancel
  const handlePressOut = async () => {
    console.log('[Voice] 松开按钮，准备停止语音识别', { isRecording, isCancelling });
    
    // 如果正在录音，根据是否取消选择不同的方法
    if (isRecording) {
      try {
        if (isCancelling) {
          // 用户上滑取消，使用 cancel() 方法
          if (Voice && Voice.cancel) {
            console.log('[Voice] 用户取消，调用 Voice.cancel()');
            await Voice.cancel();
            console.log('[Voice] Voice.cancel() 调用成功');
          }
        } else {
          // 正常停止，使用 stop() 方法，这会触发 onSpeechEnd 事件
          if (Voice && Voice.stop) {
            console.log('[Voice] 正常停止，调用 Voice.stop()，等待 onSpeechEnd 事件触发');
            await Voice.stop();
            console.log('[Voice] Voice.stop() 调用成功，等待 onSpeechEnd 事件');
          }
        }
      } catch (error) {
        console.error('[Voice] 停止/取消语音识别失败:', error);
        // 如果失败，手动清理状态
        setIsRecording(false);
        setIsCancelling(false);
        recordingScale.stopAnimation();
        recordingScale.setValue(1);
      }
    } else {
      // 如果没有在录音，直接清理取消状态
      setIsCancelling(false);
    }
  };

  // 处理触摸移动（检测上滑取消）
  const handleTouchMove = (evt: any) => {
    if (!isRecording) return;
    
    const currentY = evt.nativeEvent.pageY;
    const deltaY = startY.current - currentY; // 向上滑动为正值
    
    if (deltaY > cancelThreshold) {
      setIsCancelling(true);
    } else {
      setIsCancelling(false);
    }
  };

  // 检查录音权限状态
  const checkAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return result;
      } catch (err) {
        console.warn('检查录音权限失败:', err);
        return false;
      }
    }
    // iOS 权限检查通过尝试启动语音识别来触发
    // 如果权限未授予，会在启动时自动弹出系统权限请求
    return true;
  };

  // 请求录音权限
  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // 先检查是否已有权限
        const hasPermission = await checkAudioPermission();
        if (hasPermission) {
          console.log('已有录音权限');
          return true;
        }
        
        console.log('开始请求录音权限...');
        // 请求权限 - 这会触发系统权限弹窗（如果是第一次）
        // 注意：即使之前拒绝过，request() 也会再次弹出弹窗（除非选择了"不再询问"）
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '录音权限',
            message: '应用需要访问您的麦克风以进行语音输入',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        
        console.log('权限请求结果:', granted);
        
        // 处理权限结果
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('权限已授予');
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          // 用户选择了"不再询问"，需要引导用户去设置
          console.log('权限被永久拒绝');
          showErrorAlert(ErrorType.PERMISSION_PERMANENTLY_DENIED);
          return false;
        } else {
          // 用户拒绝了权限（但可以再次请求）
          console.log('权限被拒绝，但可以再次请求');
          return false;
        }
      } catch (err) {
        console.error('请求录音权限失败:', err);
        return false;
      }
    }
    // iOS: 权限请求会在首次调用 Voice.start() 时自动触发
    // 这里返回 true，让后续的 Voice.start() 来触发权限请求
    return true;
  };

  // 初始化语音识别
  useEffect(() => {
    // 组件挂载时检查 Voice 模块
    const initVoiceModule = async () => {
      console.log('[Voice] 组件初始化，检查 Voice 模块:', {
        VoiceExists: !!Voice,
        VoiceType: typeof Voice,
        VoiceKeys: Voice ? Object.keys(Voice) : [],
        hasStart: typeof Voice?.start,
        hasStop: typeof Voice?.stop,
        hasIsAvailable: typeof Voice?.isAvailable,
        Platform: Platform.OS,
      });
      
      // 检查 Voice 模块是否可用
      if (!Voice) {
        console.error('[Voice] 模块未初始化');
        showErrorAlert(ErrorType.MODULE_NOT_FOUND);
        return;
      }
      
      // 验证关键方法是否存在
      if (typeof Voice.start !== 'function') {
        console.error('[Voice] start 方法不存在');
        showErrorAlert(ErrorType.MODULE_NOT_LINKED);
        return;
      }

      // 检查语音识别服务是否可用（异步检查，不阻塞初始化）
      if (typeof Voice.isAvailable === 'function') {
        try {
          const isAvailable = await Voice.isAvailable();
          console.log('[Voice] 语音识别服务可用性:', isAvailable);
          
          if (Platform.OS === 'android' && typeof Voice.getSpeechRecognitionServices === 'function') {
            try {
              const services = await Voice.getSpeechRecognitionServices();
              console.log('[Voice] 可用的语音识别引擎:', services);
            } catch (err) {
              console.warn('[Voice] 获取识别引擎列表失败:', err);
            }
          }
        } catch (error) {
          console.warn('[Voice] 检查服务可用性失败:', error);
        }
      }
    };

    initVoiceModule();

    try {
      // 参考官方示例，设置所有事件监听器
      
      // 语音识别开始 - 在长按按钮调用 Voice.start() 后自动触发
      Voice.onSpeechStart = () => {
        console.log('[Voice] onSpeechStart 事件触发 - 语音识别已开始');
        setIsRecording(true);
        setIsCancelling(false);
        setRecognizedText('');
        setPartialResults([]);
        setSpeechVolume('');
        // 开始录音动画
        Animated.loop(
          Animated.sequence([
            Animated.timing(recordingScale, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(recordingScale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      
      // 语音识别已识别（部分识别）
      Voice.onSpeechRecognized = (e: any) => {
        console.log('[Voice] onSpeechRecognized:', e);
        // 可以在这里处理部分识别结果
      };
      
      // 语音识别结束 - 在松开按钮调用 Voice.stop() 后自动触发
      Voice.onSpeechEnd = () => {
        console.log('[Voice] onSpeechEnd 事件触发 - 语音识别已结束');
        
        // 使用 isRecognizing() 确认状态（如果可用）
        if (typeof Voice.isRecognizing === 'function') {
          Voice.isRecognizing().then((isRecognizing: 0 | 1) => {
            console.log('[Voice] 当前识别状态:', isRecognizing === 1);
          }).catch((err: any) => {
            console.warn('[Voice] 检查识别状态失败:', err);
          });
        }
        
        setIsRecording(false);
        setIsCancelling(false);
        // 停止录音动画
        recordingScale.stopAnimation();
        recordingScale.setValue(1);
      };
      
      // 语音识别结果（最终结果）
      Voice.onSpeechResults = (e: any) => {
        console.log('[Voice] onSpeechResults:', e);
        if (e.value && e.value.length > 0) {
          const text = e.value[0];
          setRecognizedText(text);
          if (!isCancelling && text.trim().length > 0) {
            // 自动发送识别到的文本
            onSend(text.trim());
            setRecognizedText('');
            setPartialResults([]);
          }
        }
      };
      
      // 语音识别部分结果（实时结果）
      Voice.onSpeechPartialResults = (e: any) => {
        console.log('[Voice] onSpeechPartialResults:', e);
        if (e.value && e.value.length > 0) {
          setPartialResults(e.value);
          // 显示第一个部分结果作为实时反馈
          setRecognizedText(e.value[0]);
        }
      };
      
      // 语音音量变化
      Voice.onSpeechVolumeChanged = (e: any) => {
        console.log('[Voice] onSpeechVolumeChanged:', e);
        if (e.value !== undefined) {
          setSpeechVolume(e.value.toFixed(2));
        }
      };
      
      // 语音识别错误
      Voice.onSpeechError = (e: any) => {
        console.error('[Voice] onSpeechError:', e);
        setIsRecording(false);
        setIsCancelling(false);
        
        const errorCode = e.error?.code;
        const errorMessage = e.error?.message || '请重试';
        
        // 错误代码说明：
        // 5 = 没有语音识别服务
        // 7 = 无匹配（No match）- 未识别到有效语音
        // 9 = 权限不足
        // 12 = 无法理解，请重试
        // 其他 = 其他错误
        
        if (errorCode === '7') {
          // 错误代码 7 = ERROR_NO_MATCH（无匹配）
          // 可能原因：没有检测到语音、语音太模糊、背景噪音太大、语言不匹配
          // 静默处理，不显示错误提示，让用户可以重试
          console.log('[Voice] 未识别到有效语音（错误代码 7）');
          console.log('[Voice] 提示：请确保在安静环境中清晰说话');
          return;
        } else if (errorCode === '9') {
          // 权限不足
          showErrorAlert(ErrorType.PERMISSION_DENIED);
        } else if (errorCode === '12' || errorMessage?.includes("Didn't understand")) {
          // 无法理解输入 - 可能是语言不支持或识别失败，静默处理
          return;
        } else if (errorCode === '5' || errorMessage?.includes('No recognition service')) {
          // 错误代码 5: 没有可用的语音识别服务
          showErrorAlert(ErrorType.RECOGNITION_SERVICE_UNAVAILABLE);
        } else {
          // 其他错误
          showErrorAlert(ErrorType.START_FAILED, errorMessage);
        }
      };
    } catch (error) {
      console.error('[Voice] 设置语音识别监听器失败:', error);
      showErrorAlert(ErrorType.INITIALIZATION_FAILED);
    }

    // 清理函数：参考官方示例，在组件卸载时清理
    return () => {
      try {
        if (Voice && Voice.destroy) {
          Voice.destroy()
            .then(() => {
              if (Voice && Voice.removeAllListeners) {
                Voice.removeAllListeners();
              }
              console.log('[Voice] 语音识别已清理');
            })
            .catch((err) => {
              console.warn('[Voice] 清理语音识别失败:', err);
            });
        }
      } catch (error) {
        console.warn('[Voice] 清理语音识别时出错:', error);
      }
      recordingScale.stopAnimation();
      recordingScale.setValue(1);
    };
  }, [isCancelling, onSend, recordingScale]);


  // 切换语音模式
  const toggleVoiceMode = async () => {
    const newVoiceMode = !isVoiceMode;
    
    // 如果切换到文本模式，自动聚焦输入框
    if (!newVoiceMode && textInputRef.current) {
      // 延迟一下确保组件已更新
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
    
    if (newVoiceMode) {
      // 切换到语音模式时，立即检查并请求权限
      if (Platform.OS === 'android') {
        console.log('切换到语音模式，开始请求权限...');
        // Android: 直接请求权限（这会触发系统权限弹窗）
        const hasPermission = await requestAudioPermission();
        console.log('权限请求完成，结果:', hasPermission);
        
        if (!hasPermission) {
          // Android 权限被拒绝，不切换模式
          // 注意：如果用户只是点击了"拒绝"（不是"不再询问"），
          // 下次点击麦克风按钮时还会再次弹出权限请求弹窗
          showErrorAlert(ErrorType.PERMISSION_DENIED);
          return;
        }
      } else {
        // iOS: 通过尝试启动语音识别来触发系统权限弹窗
        // 这是 iOS 触发权限请求的唯一方式
        // 先检查 Voice 模块是否可用
        if (!checkVoiceModuleAvailable()) {
          showErrorAlert(ErrorType.INITIALIZATION_FAILED);
          return;
        }

        try {
          // 尝试启动语音识别，这会触发系统权限弹窗（如果是第一次）
          // 预启动时也尝试中文，如果失败则使用英文
          try {
            await Voice.start('zh-CN');
          } catch (error: any) {
            // 如果中文失败，尝试英文
            console.log('[Voice] 中文识别不可用，预启动使用英文');
            await Voice.start('en-US');
          }
          // 立即停止，因为我们只是想触发权限请求
          setTimeout(async () => {
            try {
              if (Voice && Voice.stop) {
                await Voice.stop();
              }
            } catch (e) {
              // 忽略停止时的错误
            }
          }, 100);
        } catch (error: any) {
          // 如果是权限错误，系统已经弹出权限请求弹窗了
          // 其他错误可以忽略，因为用户还没有真正开始录音
          const errorMessage = error?.message || String(error);
          if (
            errorMessage?.includes('startSpeech') || 
            errorMessage?.includes('null') || 
            errorMessage?.includes('Cannot read') ||
            errorMessage?.includes('undefined')
          ) {
            showErrorAlert(ErrorType.INITIALIZATION_FAILED, errorMessage);
            return;
          } else if (error.code !== '7' && !errorMessage?.includes('permission')) {
            console.log('预启动语音识别:', errorMessage);
          }
        }
      }
    }
    
    setIsVoiceMode(newVoiceMode);
    setMessage('');
    setRecognizedText('');
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  const textColor = isDark ? Colors.textDark : Colors.text;
  const borderColor = isDark ? Colors.borderDark : Colors.border;
  const placeholderColor = isDark
    ? Colors.textSecondaryDark
    : Colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
    >
      {/* 左侧加号按钮 */}
      <TouchableOpacity style={[styles.addButton, 
        { backgroundColor: isDark ? Colors.inputBackgroundDark : Colors.inputBackground, borderColor },
        { borderWidth: isDark ? 0.5 : 0 },
      ]}>
        <Icon
          name="add"
          size={30}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {/* 输入框容器 */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? Colors.inputBackgroundDark : Colors.inputBackground, borderColor },
          { borderWidth: isDark ? 0.5 : 0 },
          { alignItems: isVoiceMode ? 'center' : 'flex-end' },
        ]}
      >
        {isVoiceMode ? (
          // 语音模式：显示按住说话按钮
          <>
            <View 
              style={styles.voiceModeContainer}
              onTouchMove={handleTouchMove}
            >
              <TouchableOpacity
                style={styles.voiceButtonContainer}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onLongPress={() => {
                  // 长按作为备用触发方式
                  if (!isRecording && isVoiceMode) {
                    handlePressIn({ nativeEvent: { pageY: 0 } });
                  }
                }}
                delayLongPress={200}
                activeOpacity={0.7}
                disabled={disabled}
              >
                <Animated.View
                  style={[
                    styles.voiceButton,
                    isRecording && {
                      transform: [{ scale: recordingScale }],
                    },
                  ]}
                >
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <Animated.View
                        style={[
                          styles.recordingDot,
                          {
                            backgroundColor: isCancelling ? Colors.error : Colors.primary,
                          },
                        ]}
                      />
                    </View>
                  )}
                </Animated.View>
                <Text
                  style={[
                    styles.voiceHint,
                    { color: isCancelling ? Colors.error : textColor },
                  ]}
                >
                  {isRecording
                    ? isCancelling
                      ? '松开 取消'
                      : '正在 录音...'
                    : '按住 说话'}
                </Text>
              </TouchableOpacity>
            </View>
            {/* 切换回文本模式按钮 */}
            <View style={styles.iconButtonContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleVoiceMode}
              >
                <Icon
                  name="keyboard"
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // 文本输入模式
          <>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder={placeholder}
              placeholderTextColor={placeholderColor}
              value={message}
              onChangeText={setMessage}
              multiline
              scrollEnabled={true}
              editable={!disabled}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              contextMenuHidden={true}
              selectTextOnFocus={false}
            />
            {/* 右侧按钮组 */}
            <View style={styles.iconButtonContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleVoiceMode}
              >
                <Icon
                  name="mic"
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconButton, styles.audioButton]}
                onPress={canSend ? handleSend : undefined}
              >
                <Icon
                  name={canSend ? 'send' : 'graphic-eq'}
                  size={canSend ? 18 : 24}
                  color={
                    isDark
                      ? Colors.text
                      : Colors.textDark
                  }
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.base,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android 阴影
    elevation: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    // Android 阴影
    elevation: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 24,
    paddingHorizontal: Spacing.xs + 2,
    paddingLeft: Spacing.base,
    paddingVertical: Spacing.xs,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 0,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    // Android 阴影
    elevation: 12,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.medium,
    maxHeight: 80,
    minHeight: 36,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  audioButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
  },
  iconButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 4 : 2,
  },
  voiceModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    position: 'relative',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  voiceHint: {
    fontSize: FontSizes.medium,
    textAlign: 'center',
    fontWeight: '500',
  },
});
