import React, { useRef, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DanmakuItem } from '../services/types';
import { danmakuColorToCss } from '../utils/danmaku';

interface Props {
  danmakus: DanmakuItem[];
  currentTime: number;
  visible: boolean;
  onToggle: () => void;
}

export default function DanmakuList({ danmakus, currentTime, visible, onToggle }: Props) {
  const flatListRef = useRef<FlatList>(null);

  const visibleItems = useMemo(
    () => danmakus.filter(d => d.time <= currentTime),
    [danmakus, currentTime]
  );

  useEffect(() => {
    if (visible && visibleItems.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [visibleItems.length, visible]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <Ionicons
          name={visible ? 'chatbubbles' : 'chatbubbles-outline'}
          size={16}
          color="#00AEEC"
        />
        <Text style={styles.headerText}>
          弹幕 {danmakus.length > 0 ? `(${danmakus.length})` : ''}
        </Text>
        <Ionicons
          name={visible ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#999"
        />
      </TouchableOpacity>

      {visible && (
        <FlatList
          ref={flatListRef}
          data={visibleItems}
          keyExtractor={(item, i) => `${item.time}_${item.text}_${i}`}
          style={styles.list}
          renderItem={({ item }) => (
            <Text
              style={[styles.item, { color: danmakuColorToCss(item.color) }]}
              numberOfLines={1}
            >
              {item.text}
            </Text>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>暂无弹幕</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
  },
  list: {
    height: 180,
    paddingHorizontal: 12,
  },
  item: {
    fontSize: 13,
    paddingVertical: 3,
    lineHeight: 18,
  },
  empty: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
