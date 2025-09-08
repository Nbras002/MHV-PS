import { useEffect } from 'react';

/**
 * Prevents background scrolling when a modal is open by setting document.body.style.position to 'fixed'.
 * Resets the position when the modal is closed.
 * @param isOpen - Whether the modal is open
 */
export function usePreventBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.position = 'fixed';
    } else {
      document.body.style.position = '';
    }
    return () => {
      document.body.style.position = '';
    };
  }, [isOpen]);
}
