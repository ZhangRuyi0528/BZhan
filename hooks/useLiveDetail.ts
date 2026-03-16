import { useState, useEffect, useCallback } from 'react';
import { getLiveRoomDetail, getLiveAnchorInfo, getLiveStreamUrl } from '../services/bilibili';
import type { LiveRoomDetail, LiveAnchorInfo, LiveStreamInfo } from '../services/types';

interface LiveDetailState {
  room: LiveRoomDetail | null;
  anchor: LiveAnchorInfo | null;
  stream: LiveStreamInfo | null;
  loading: boolean;
  error: string | null;
}

export function useLiveDetail(roomId: number) {
  const [state, setState] = useState<LiveDetailState>({
    room: null,
    anchor: null,
    stream: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    setState({ room: null, anchor: null, stream: null, loading: true, error: null });

    async function fetch() {
      try {
        const [room, anchor] = await Promise.all([
          getLiveRoomDetail(roomId),
          getLiveAnchorInfo(roomId),
        ]);
        if (cancelled) return;

        let stream: LiveStreamInfo = { hlsUrl: '', flvUrl: '', qn: 0, qualities: [] };
        if (room.live_status === 1) {
          stream = await getLiveStreamUrl(roomId);
        }
        if (cancelled) return;

        setState({ room, anchor, stream, loading: false, error: null });
      } catch (e: any) {
        if (cancelled) return;
        setState(prev => ({ ...prev, loading: false, error: e?.message ?? '加载失败' }));
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [roomId]);

  const changeQuality = useCallback(async (qn: number) => {
    try {
      const stream = await getLiveStreamUrl(roomId, qn);
      setState(prev => ({ ...prev, stream }));
    } catch { /* ignore */ }
  }, [roomId]);

  return { ...state, changeQuality };
}
