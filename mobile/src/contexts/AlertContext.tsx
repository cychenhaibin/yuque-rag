import React, {createContext, useContext, useState, useCallback} from 'react';
import {CustomAlert, AlertOptions, AlertButton} from '../components/CustomAlert';

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({...prev, visible: false}));
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      visible: true,
      title: options.title,
      message: options.message,
      buttons: options.buttons,
    });
  }, []);

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
    ) => {
      showAlert({
        title,
        message,
        buttons: [
          {
            text: '取消',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: '确定',
            style: 'default',
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert],
  );

  const showError = useCallback(
    (message: string, title: string = '错误') => {
      showAlert({
        title,
        message,
        buttons: [{text: '确定', style: 'default'}],
      });
    },
    [showAlert],
  );

  const showSuccess = useCallback(
    (message: string, title: string = '成功') => {
      showAlert({
        title,
        message,
        buttons: [{text: '确定', style: 'default'}],
      });
    },
    [showAlert],
  );

  const showInfo = useCallback(
    (message: string, title: string = '提示') => {
      showAlert({
        title,
        message,
        buttons: [{text: '确定', style: 'default'}],
      });
    },
    [showAlert],
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showConfirm,
        showError,
        showSuccess,
        showInfo,
      }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};


