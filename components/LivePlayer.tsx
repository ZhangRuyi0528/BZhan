import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  hlsUrl: string;
  isLive: boolean;
  qualities?: { qn: number; desc: string }[];
  currentQn?: number;
  onQualityChange?: (qn: number) => void;
}

const HIDE_DELAY = 3000;

const HEADERS = {
  Referer: 'https://live.bilibili.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export function LivePlayer({ hlsUrl, isLive, qualities = [], currentQn = 0, onQualityChange }: Props) {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const VIDEO_H = SCREEN_W * 0.5625;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: SCREEN_W, height: VIDEO_H }]}>
        <Text style={styles.webHint}>请在手机端观看直播</Text>
      </View>
    );
  }

  if (!isLive || !hlsUrl) {
    return (
      <View style={[styles.container, { width: SCREEN_W, height: VIDEO_H }]}>
        <Ionicons name="tv-outline" size={40} color="#555" />
        <Text style={styles.offlineText}>暂未开播</Text>
      </View>
    );
  }

  return (
    <NativeLivePlayer
      hlsUrl={hlsUrl}
      screenW={SCREEN_W}
      screenH={SCREEN_H}
      videoH={VIDEO_H}
      qualities={qualities}
      currentQn={currentQn}
      onQualityChange={onQualityChange}
    />
  );
}

function NativeLivePlayer({
  hlsUrl,
  screenW,
  screenH,
  videoH,
  qualities,
  currentQn,
  onQualityChange,
}: {
  hlsUrl: string;
  screenW: number;
  screenH: number;
  videoH: number;
  qualities: { qn: number; desc: string }[];
  currentQn: number;
  onQualityChange?: (qn: number) => void;
}) {
  const Video = require('react-native-video').default;

  const [showControls, setShowControls] = useState(true);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  // Lock/unlock orientation on fullscreen toggle
  useEffect(() => {
    (async () => {
      try {
        const ScreenOrientation = require('expo-screen-orientation');
        if (isFullscreen) {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
          );
        } else {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          );
        }
      } catch { /* graceful degradation in Expo Go */ }
    })();
  }, [isFullscreen]);

  // Restore portrait on unmount
  useEffect(() => {
    return () => {
      (async () => {
        try {
          const ScreenOrientation = require('expo-screen-orientation');
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          );
        } catch { /* ignore */ }
      })();
    };
  }, []);

  const handleTap = useCallback(() => {
    setShowControls(prev => {
      if (!prev) { resetHideTimer(); return true; }
      if (hideTimer.current) clearTimeout(hideTimer.current);
      return false;
    });
  }, [resetHideTimer]);

  const containerStyle = isFullscreen
    ? { width: screenH, height: screenW }
    : { width: screenW, height: videoH };

  const currentQnDesc = qualities.find(q => q.qn === currentQn)?.desc ?? '';

  const videoContent = (
    <View style={[styles.container, containerStyle]}>
      <Video
        key={hlsUrl}
        source={{ uri: hlsUrl, headers: HEADERS }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        controls={false}
        paused={paused}
        onBuffer={({ isBuffering }: { isBuffering: boolean }) => setBuffering(isBuffering)}
        onLoad={() => setBuffering(false)}
      />

      {buffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <Text style={styles.bufferingText}>缓冲中...</Text>
        </View>
      )}

      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {showControls && (
        <>
          {/* LIVE badge top-left */}
          <View style={styles.liveBadge} pointerEvents="none">
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>live</Text>
          </View>

          {/* Center play/pause */}
          <TouchableOpacity
            style={styles.centerBtn}
            onPress={() => { setPaused(p => !p); resetHideTimer(); }}
          >
            <View style={styles.centerBtnBg}>
              <Ionicons name={paused ? 'play' : 'pause'} size={28} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Bottom controls */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => { setPaused(p => !p); resetHideTimer(); }}
            >
              <Ionicons name={paused ? 'play' : 'pause'} size={16} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {qualities.length > 0 && (
              <TouchableOpacity
                style={styles.qualityBtn}
                onPress={() => { setShowQualityPanel(true); resetHideTimer(); }}
              >
                <Text style={styles.qualityText}>{currentQnDesc || '清晰度'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => { setIsFullscreen(fs => !fs); resetHideTimer(); }}
            >
              <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Quality selector panel */}
      {showQualityPanel && (
        <TouchableWithoutFeedback onPress={() => setShowQualityPanel(false)}>
          <View style={styles.qualityOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.qualityPanel}>
                <Text style={styles.qualityPanelTitle}>清晰度</Text>
                {qualities.map(q => (
                  <TouchableOpacity
                    key={q.qn}
                    style={[styles.qualityItem, currentQn === q.qn && styles.qualityItemActive]}
                    onPress={() => {
                      onQualityChange?.(q.qn);
                      setShowQualityPanel(false);
                    }}
                  >
                    <Text style={[styles.qualityItemText, currentQn === q.qn && styles.qualityItemTextActive]}>
                      {q.desc}
                    </Text>
                    {currentQn === q.qn && (
                      <Ionicons name="checkmark" size={14} color="#00AEEC" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );

  if (isFullscreen) {
    return (
      <Modal visible transparent animationType="fade" supportedOrientations={['landscape']}>
        <View style={styles.fsModal}>{videoContent}</View>
      </Modal>
    );
  }

  return videoContent;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webHint: { color: '#fff', fontSize: 15 },
  offlineText: { color: '#999', fontSize: 14, marginTop: 10 },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferingText: { color: '#fff', fontSize: 13, opacity: 0.8 },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f00',
    marginRight: 5,
  },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  centerBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
  },
  centerBtnBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  ctrlBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  qualityBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    marginRight: 4,
  },
  qualityText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  qualityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  qualityPanel: {
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 16,
  },
  qualityPanelTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  qualityItemActive: { backgroundColor: 'rgba(0,174,236,0.15)' },
  qualityItemText: { color: '#ccc', fontSize: 14 },
  qualityItemTextActive: { color: '#00AEEC', fontWeight: '600' },
  fsModal: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
