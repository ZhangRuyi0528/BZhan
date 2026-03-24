import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  darkMode: boolean;
  trafficSaving: boolean;
  setDarkMode: (v: boolean) => Promise<void>;
  setTrafficSaving: (v: boolean) => Promise<void>;
  restore: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  darkMode: false,
  trafficSaving: false,

  setDarkMode: async (v) => {
    await AsyncStorage.setItem('DARK_MODE', v ? '1' : '0');
    set({ darkMode: v });
  },

  setTrafficSaving: async (v) => {
    await AsyncStorage.setItem('TRAFFIC_SAVING', v ? '1' : '0');
    set({ trafficSaving: v });
  },

  restore: async () => {
    const [dm, ts] = await Promise.all([
      AsyncStorage.getItem('DARK_MODE'),
      AsyncStorage.getItem('TRAFFIC_SAVING'),
    ]);
    set({
      darkMode: dm === '1',
      trafficSaving: ts === '1',
    });
  },
}));
