import Toast from 'react-native-toast-message';

export const toast = {
  success: (text1: string, text2?: string) =>
    Toast.show({ type: 'success', text1, text2, position: 'bottom' }),
  error: (text1: string, text2?: string) =>
    Toast.show({ type: 'error', text1, text2, position: 'bottom' }),
  info: (text1: string, text2?: string) =>
    Toast.show({ type: 'info', text1, text2, position: 'bottom' }),
}; 