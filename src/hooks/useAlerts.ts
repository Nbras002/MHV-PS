import { useTranslation } from 'react-i18next';

export const useAlerts = () => {
  const { t } = useTranslation();

  const showAlert = (messageKey: string, variables?: any) => {
    const message = t(messageKey, variables);
    alert(message);
  };

  const showConfirm = (messageKey: string, variables?: any): boolean => {
    const message = t(messageKey, variables);
    return confirm(message);
  };

  const showSuccess = (messageKey: string, variables?: any) => {
    const message = t(messageKey, variables);
    alert(message);
  };

  const showError = (messageKey: string, variables?: any) => {
    const message = t(messageKey, variables);
    alert(message);
  };

  return {
    showAlert,
    showConfirm,
    showSuccess,
    showError
  };
};