import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, useColorScheme, ViewStyle, TouchableOpacity, Alert, Platform} from 'react-native';
import Markdown, {MarkdownIt, RenderRules, ASTNode} from 'react-native-markdown-display';
// @ts-ignore - markdown-it-math 没有类型定义
import MarkdownItMath from 'markdown-it-math';
import MathJax from 'react-native-mathjax-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Message} from '../types';
import {Colors, Spacing, FontSizes} from '../config';

// 安全导入 Clipboard
let Clipboard: any;
try {
  // @ts-ignore
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  // 如果导入失败，使用备用实现
  Clipboard = {
    setString: async (text: string) => {
      // 备用实现：使用 React Native 的 Clipboard API（如果可用）
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const {Clipboard: RNClipboard} = require('react-native');
        if (RNClipboard && RNClipboard.setString) {
          return RNClipboard.setString(text);
        }
      }
      throw new Error('Clipboard not available');
    },
  };
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({message}) => {
  const isDark = useColorScheme() === 'dark';
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const bubbleColor = isUser
    ? Colors.userBubble
    : isDark
    ? Colors.aiBubbleDark
    : Colors.aiBubble;

  const textColor = isUser ? '#fff' : isDark ? Colors.textDark : Colors.text;

  // 复制消息内容到剪贴板
  const handleCopy = async () => {
    try {
      await Clipboard.setString(message.content);
      setCopied(true);
      // 2秒后恢复图标状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      Alert.alert('复制失败', '无法复制到剪贴板');
    }
  };

  // 创建支持数学公式的 markdown-it 实例
  const markdownItInstance = useMemo(() => {
    const md = new MarkdownIt({typographer: true});
    // 使用 markdown-it-math 支持 $...$ 和 $$...$$
    md.use(MarkdownItMath, {
      inlineOpen: '$',
      inlineClose: '$',
      blockOpen: '$$',
      blockClose: '$$',
    });
    // 再次使用以支持 \(...\) 和 \[...\]
    md.use(MarkdownItMath, {
      inlineOpen: '\\(',
      inlineClose: '\\)',
      blockOpen: '\\[',
      blockClose: '\\]',
    });
    return md;
  }, []);

  // 定义渲染规则
  const rules: RenderRules = useMemo(
    () => {
      // 渲染数学公式
      const renderEquation = (node: ASTNode) => {
        const equationStyle: ViewStyle =
          node.type === 'math_block'
            ? {...styles.equation, ...styles.equationBlock}
            : styles.equation;

        // 获取公式内容
        const mathContent =
          typeof node.content === 'string'
            ? node.content
            : node.children
            ? node.children.map((child: any) => child.content || '').join('')
            : '';

        if (!mathContent) {
          return null;
        }

        // 根据主题设置公式颜色
        const formulaColor = isDark ? Colors.textDark : Colors.text;

        return (
          <View key={node.key} style={equationStyle}>
            <MathJax color={formulaColor}>{mathContent}</MathJax>
          </View>
        );
      };

      return {
        math_inline: renderEquation,
        math_block: renderEquation,
        textgroup: (node: ASTNode, children: React.ReactNode) => (
          <Text key={node.key} selectable={true}>
            {children}
          </Text>
        ),
      };
    },
    [isDark],
  );

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, {backgroundColor: bubbleColor}]}>
        {isUser ? (
          <Text style={[styles.messageText, {color: textColor}]}>
            {message.content}
          </Text>
        ) : (
          <Markdown
            markdownit={markdownItInstance}
            rules={rules}
            style={getMarkdownStyles(isDark)}
            mergeStyle={false}>
            {message.content}
          </Markdown>
        )}
        {message.isStreaming && (
          <View style={styles.streamingIndicator}>
            <Text style={[styles.streamingText, {color: textColor}]}>●</Text>
          </View>
        )}
        {/* AI回答的操作按钮 */}
        {!isUser && (
          <View style={[
            styles.actionButtons,
            {
              backgroundColor: isDark ? Colors.primaryBrightDark : Colors.primaryBright,
            },
          ]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopy}
              activeOpacity={0.7}>
              <Icon
                name={copied ? 'check' : 'content-copy'}
                size={12}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.timestamp,
          {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary},
          isUser && styles.timestampUser,
        ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  messageText: {
    fontSize: FontSizes.medium,
    lineHeight: 20,
  },
  streamingIndicator: {
    marginTop: Spacing.xs,
  },
  streamingText: {
    fontSize: FontSizes.small,
    opacity: 0.7,
  },
  timestamp: {
    fontSize: FontSizes.small - 1,
    marginTop: Spacing.xs / 2,
    marginHorizontal: Spacing.xs,
  },
  timestampUser: {
    textAlign: 'right',
  },
  equation: {
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  equationBlock: {
    width: '100%',
    marginVertical: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButton: {
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const getMarkdownStyles = (isDark: boolean) =>
  StyleSheet.create({
    body: {
      fontSize: FontSizes.medium,
      lineHeight: 20,
      color: isDark ? Colors.textDark : Colors.text,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: Spacing.xs,
    },
    // 标题样式 - 控制字体大小不要太大
    heading1: {
      fontSize: FontSizes.large,
      fontWeight: '700',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      color: isDark ? Colors.textDark : Colors.text,
    },
    heading2: {
      fontSize: FontSizes.large,
      fontWeight: '700',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      color: isDark ? Colors.textDark : Colors.text,
    },
    heading3: {
      fontSize: FontSizes.medium,
      fontWeight: '600',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      color: isDark ? Colors.textDark : Colors.text,
    },
    heading4: {
      fontSize: FontSizes.medium,
      fontWeight: '600',
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs / 2,
      color: isDark ? Colors.textDark : Colors.text,
    },
    heading5: {
      fontSize: FontSizes.medium,
      fontWeight: '600',
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs / 2,
      color: isDark ? Colors.textDark : Colors.text,
    },
    heading6: {
      fontSize: FontSizes.medium,
      fontWeight: '600',
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs / 2,
      color: isDark ? Colors.textDark : Colors.text,
    },
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
    code_inline: {
      fontFamily: 'Menlo',
      backgroundColor: isDark ? Colors.cardDark : '#f5f5f5',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      color: isDark ? Colors.textDark : Colors.text,
    },
    code_block: {
      fontFamily: 'Menlo',
      backgroundColor: isDark ? Colors.cardDark : '#f5f5f5',
      padding: Spacing.sm,
      borderRadius: 8,
      color: isDark ? Colors.textDark : Colors.text,
    },
    // fenced code block（``` 包裹的多行代码）
    fence: {
      fontFamily: 'Menlo',
      backgroundColor: isDark ? Colors.cardDark : '#f5f5f5',
      padding: Spacing.sm,
      borderRadius: 8,
      color: isDark ? Colors.textDark : Colors.text,
    },
    bullet_list: {
      marginBottom: Spacing.xs,
    },
    ordered_list: {
      marginBottom: Spacing.xs,
    },
    list_item: {
      flexDirection: 'row',
    },
    link: {
      color: Colors.primary,
      textDecorationLine: 'underline',
    },
  });


