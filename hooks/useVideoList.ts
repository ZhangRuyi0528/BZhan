import { useState, useCallback, useRef, useMemo } from 'react';
import { getRecommendFeed, getLiveList } from '../services/bilibili';
import type { VideoItem, LiveRoom } from '../services/types';

export function useVideoList() {
  const [pages, setPages] = useState<VideoItem[][]>([]);
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use refs to avoid stale closures — load() has stable identity
  const loadingRef = useRef(false);
  const freshIdxRef = useRef(0);

  const load = useCallback(async (reset = false) => {
    if (loadingRef.current) {
      if (reset) setRefreshing(false);
      return;
    }
    loadingRef.current = true;
    const idx = freshIdxRef.current;
    setLoading(true);
    try {
      const promises: [Promise<VideoItem[]>, Promise<LiveRoom[]>] = [
        getRecommendFeed(idx),
        (reset || idx === 0)
          ? getLiveList(1, 0).catch(() => [] as LiveRoom[])
          : Promise.resolve([] as LiveRoom[]),
      ];
      const [data, live] = await Promise.all(promises);
      setPages(prev => reset ? [data] : [...prev, data]);
      if (reset || idx === 0) {
        // Take top 2 by online count
        const sorted = [...live].sort((a, b) => b.online - a.online).slice(0, 10);
        setLiveRooms(sorted);
      }
      freshIdxRef.current = idx + 1;
    } catch (e) {
      console.error('Failed to load videos', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // stable — no stale closure risk

  const refresh = useCallback(() => {
    console.log('Refreshing video list');
    setRefreshing(true);
    load(true);
  }, [load]);

  const videos = useMemo(() => pages.flat(), [pages]);
  return { videos, pages, liveRooms, loading, refreshing, load, refresh };
}
