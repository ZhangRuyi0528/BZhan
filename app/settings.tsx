import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../utils/theme';
import { useCheckUpdate } from '../hooks/useCheckUpdate';

export default function SettingsScreen() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuthStore();
  const { darkMode, setDarkMode, trafficSaving, setTrafficSaving } = useSettingsStore();
  const theme = useTheme();
  const { currentVersion, isChecking, downloadProgress, checkUpdate } = useCheckUpdate();

  const handleLogout = async () => {
    await logout();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.text }]}>设置</Text>
        <View style={styles.spacer} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSub }]}>版本信息</Text>
        <View style={styles.versionRow}>
          <Text style={[styles.versionLabel, { color: theme.text }]}>当前版本</Text>
          <Text style={[styles.versionValue, { color: theme.textSub }]}>v{currentVersion}</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSub }]}>更新</Text>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={checkUpdate}
          activeOpacity={0.7}
          disabled={isChecking || downloadProgress !== null}
        >
          {isChecking ? (
            <>
              <ActivityIndicator size="small" color="#00AEEC" style={{ marginRight: 8 }} />
              <Text style={styles.updateBtnText}>检查中...</Text>
            </>
          ) : downloadProgress !== null ? (
            <Text style={styles.updateBtnText}>下载中 {downloadProgress}%</Text>
          ) : (
            <Text style={styles.updateBtnText}>检查更新</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSub }]}>外观</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.option, !darkMode && styles.optionActive]}
            onPress={() => setDarkMode(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, !darkMode && styles.optionTextActive]}>浅色</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, darkMode && styles.optionActive]}
            onPress={() => setDarkMode(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, darkMode && styles.optionTextActive]}>深色</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSub }]}>流量</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.option, !trafficSaving && styles.optionActive]}
            onPress={() => setTrafficSaving(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, !trafficSaving && styles.optionTextActive]}>标准</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, trafficSaving && styles.optionActive]}
            onPress={() => setTrafficSaving(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, trafficSaving && styles.optionTextActive]}>节流</Text>
          </TouchableOpacity>
        </View>
        {trafficSaving && (
          <Text style={[styles.hint, { color: theme.textSub }]}>
            封面低画质 · 首页视频不自动播放 · 视频默认 360p
          </Text>
        )}
      </View>

      {isLoggedIn && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, width: 32 },
  spacer: { width: 32 },
  topTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: { fontSize: 13, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 10 },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'transparent',
  },
  optionActive: { borderColor: '#00AEEC', backgroundColor: '#e8f7fd' },
  optionText: { fontSize: 14, color: '#666' },
  optionTextActive: { color: '#00AEEC', fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 8 },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionLabel: { fontSize: 14 },
  versionValue: { fontSize: 14 },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  updateBtnText: { fontSize: 14, color: '#00AEEC', fontWeight: '600' },
  logoutBtn: {
    margin: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4757',
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, color: '#ff4757', fontWeight: '600' },
});
