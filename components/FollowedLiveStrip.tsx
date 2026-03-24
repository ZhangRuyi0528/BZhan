import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { getFollowedLiveRooms } from "../services/bilibili";
import { LivePulse } from "./LivePulse";
import { proxyImageUrl } from "../utils/imageUrl";
import { useTheme } from "../utils/theme";
import type { LiveRoom } from "../services/types";

export function FollowedLiveStrip() {
  const { sessdata } = useAuthStore();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (!sessdata) return;
    getFollowedLiveRooms()
      .then(setRooms)
      .catch(() => {});
  }, [sessdata]);

  if (!sessdata || rooms.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {rooms.map((room, index) => (
          <TouchableOpacity
            key={`followed-${room.roomid ?? index}`}
            style={styles.item}
            onPress={() => router.push(`/live/${room.roomid}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.pulseRow}>
              <LivePulse />
              <Text style={{ color: "#fff", fontSize: 9,marginLeft:2 }}>直播</Text>
            </View>
            <Image
              source={{ uri: proxyImageUrl(room.face) }}
              style={[styles.avatar, { backgroundColor: theme.card }]}
            />
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {room.uname.length > 5 ? room.uname.slice(0, 5) : room.uname}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 3,
    paddingVertical: 8,
  },
  scrollContent: {
    gap: 12,
    alignItems: "center",
  },
  item: {
    alignItems: "center",
    width: 56,
    position: "relative",
  },
  pulseRow: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.6)",
    bottom: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    zIndex: 100,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 11,
    color: "#333",
    marginTop: 4,
    textAlign: "center",
    width: 56,
  },
});
