import { useState } from 'react';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirm = () => {
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({
        isOpen: true,
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        type: options?.type || 'warning',
        onConfirm: () => {
          onConfirm();
          setConfirm(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirm(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const hideConfirm = () => {
    setConfirm(prev => ({ ...prev, isOpen: false }));
  };

  return {
    confirm,
    showConfirm,
    hideConfirm
  };
};