import { useSettingsStore } from '../store/settingsStore';

export type ThemeColors = {
  bg: string;       // 页面/列表背景
  card: string;     // 卡片/section 背景
  text: string;     // 主文字
  textSub: string;  // 次要文字
  border: string;   // 分割线
  inputBg: string;  // 输入框背景
};

const light: ThemeColors = {
  bg: '#f4f4f4',
  card: '#fff',
  text: '#212121',
  textSub: '#999',
  border: '#eee',
  inputBg: '#f0f0f0',
};

const dark: ThemeColors = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  text: '#e0e0e0',
  textSub: '#666',
  border: '#2a2a2a',
  inputBg: '#2a2a2a',
};

export function useTheme(): ThemeColors {
  const darkMode = useSettingsStore(s => s.darkMode);
  return darkMode ? dark : light;
}
