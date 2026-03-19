import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { DownloadTask } from '../store/downloadStore';
import { startLanServer, stopLanServer, buildVideoUrl } from '../utils/lanServer';

interface Props {
  visible: boolean;
  task: DownloadTask | null;
  onClose: () => void;
}

export function LanShareModal({ visible, task, onClose }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [qrImageLoaded, setQrImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const slideY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      slideY.setValue(400);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !task) return;
    setVideoUrl(null);
    setQrImageLoaded(false);
    setLoading(true);
    console.log(123123,'baseUrlbaseUrl')
    startLanServer()
    .then((baseUrl) => {
        console.log(baseUrl,'baseUrl')
        setVideoUrl(buildVideoUrl(baseUrl, task.bvid, task.qn));
      })
      .catch(() => setVideoUrl(null))
      .finally(() => setLoading(false));

    return () => {
      stopLanServer();
    };
  }, [visible, task?.bvid, task?.qn]);

  async function handleCopy() {
    if (!videoUrl) return;
    await Clipboard.setStringAsync(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    stopLanServer();
    onClose();
  }

  const qrSrc = videoUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(videoUrl)}&size=400x400`
    : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay} pointerEvents="box-none" />
      <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: slideY }] }]}>
        <View style={styles.sheet}>
          <Text style={styles.title}>局域网分享</Text>

          {task && (
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}  ·  {task.qdesc}
            </Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#00AEEC" style={styles.loader} />
          ) : qrSrc ? (
            <>
              <View style={styles.qrWrapper}>
                <Image
                  source={{ uri: qrSrc }}
                  style={styles.qr}
                  onLoad={() => setQrImageLoaded(true)}
                />
                {!qrImageLoaded && (
                  <View style={styles.qrLoader}>
                    <ActivityIndicator size="large" color="#00AEEC" />
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.urlRow} onPress={handleCopy} activeOpacity={0.7}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.urlScroll}>
                  <Text style={styles.urlText}>{videoUrl}</Text>
                </ScrollView>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copied ? '#4caf50' : '#00AEEC'}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              <Text style={styles.hint}>同一 WiFi 下，用浏览器扫码或输入链接即可播放</Text>
            </>
          ) : (
            <Text style={styles.hint}>启动服务器失败，请确认已连接 WiFi12312</Text>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeTxt}>关闭</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  taskTitle: { fontSize: 13, color: '#666', marginBottom: 16, textAlign: 'center' },
  loader: { marginVertical: 40 },
  qrWrapper: { width: 200, height: 200, marginBottom: 16 },
  qr: { width: 200, height: 200 },
  qrLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f4',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    maxWidth: '100%',
  },
  urlScroll: { maxWidth: 260 },
  urlText: { fontSize: 12, color: '#333', fontFamily: 'monospace' },
  hint: { fontSize: 12, color: '#999', marginBottom: 20, textAlign: 'center' },
  closeBtn: { padding: 12 },
  closeTxt: { fontSize: 14, color: '#00AEEC' },
});
