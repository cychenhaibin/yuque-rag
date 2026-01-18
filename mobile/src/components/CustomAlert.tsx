import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  TouchableWithoutFeedback,
} from 'react-native';
import {Colors, Spacing, FontSizes} from '../config';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [],
  onClose,
}) => {
  const isDark = useColorScheme() === 'dark';
  const cardColor = isDark ? Colors.cardDark : Colors.card;
  const textColor = isDark ? Colors.textDark : Colors.text;
  const textSecondary = isDark
    ? Colors.textSecondaryDark
    : Colors.textSecondary;
  const borderColor = isDark ? Colors.borderDark : Colors.border;

  // 如果没有按钮，默认添加一个确定按钮
  const alertButtons =
    buttons.length > 0
      ? buttons
      : [{text: '确定', onPress: onClose, style: 'default' as const}];

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getButtonStyle = (style?: string) => {
    if (style === 'destructive') {
      return {
        color: Colors.error,
        fontWeight: '600' as const,
      };
    }
    if (style === 'cancel') {
      return {
        color: textSecondary,
        fontWeight: '400' as const,
      };
    }
    return {
      color: Colors.primary,
      fontWeight: '600' as const,
    };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.alertContainer,
                {
                  backgroundColor: cardColor,
                  borderColor: borderColor,
                },
              ]}>
              {/* 标题 */}
              <Text style={[styles.title, {color: textColor}]}>{title}</Text>

              {/* 消息内容 */}
              {message && (
                <Text style={[styles.message, {color: textSecondary}]}>
                  {message}
                </Text>
              )}

              {/* 按钮组 */}
              <View style={[styles.buttonContainer, {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor}]}>
                {alertButtons.map((button, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        index < alertButtons.length - 1 && {
                          borderRightWidth: StyleSheet.hairlineWidth,
                          borderRightColor: borderColor,
                        },
                      ]}
                      onPress={() => handleButtonPress(button)}>
                      <Text style={[styles.buttonText, getButtonStyle(button.style)]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.medium,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    // borderTopWidth: StyleSheet.hairlin,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FontSizes.medium,
  },
});

