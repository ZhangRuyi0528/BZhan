import { useState, useCallback, useRef } from 'react';
import { searchVideos } from '../services/bilibili';
import type { VideoItem } from '../services/types';

export function useSearch() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<VideoItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const search = useCallback(async (kw: string, reset = false) => {
    if (!kw.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const items = await searchVideos(kw, currentPage);
      if (reset) {
        setResults(items);
        setPage(2);
      } else {
        setResults(prev => [...prev, ...items]);
        setPage(p => p + 1);
      }
      setHasMore(items.length >= 20);
    } catch {
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page]);

  const loadMore = useCallback(() => {
    if (!keyword.trim() || loadingRef.current || !hasMore) return;
    search(keyword, false);
  }, [keyword, hasMore, search]);

  return { keyword, setKeyword, results, loading, hasMore, search, loadMore };
}
