import { useState } from 'react';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlert({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (title: string, message: string) => showAlert(title, message, 'success');
  const showError = (title: string, message: string) => showAlert(title, message, 'error');
  const showWarning = (title: string, message: string) => showAlert(title, message, 'warning');
  const showInfo = (title: string, message: string) => showAlert(title, message, 'info');

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};