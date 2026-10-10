import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** Panel açık kalırken arama klavyesinin bağımsız olarak kapatılmasını sağlar. */
export function useGifPickerKeyboard(visible: boolean, onClose: () => void) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKeyboardVisible(Keyboard.isVisible());
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, [visible]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    setKeyboardVisible(false);
  }, []);
  const close = useCallback(() => { dismiss(); onClose(); }, [dismiss, onClose]);
  const pressBackdrop = useCallback(() => {
    if (keyboardVisible || Keyboard.isVisible()) dismiss();
    else close();
  }, [close, dismiss, keyboardVisible]);

  return { keyboardVisible: visible && keyboardVisible, dismiss, close, pressBackdrop };
}
