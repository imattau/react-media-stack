import React, { createContext, useContext, useRef, useCallback } from 'react';

export interface PlaybackState {
  currentTime: number;
  isMuted: boolean;
  captionExpanded: boolean;
}

interface VideoCacheContextType {
  // Tier 1 Methods
  savePlaybackState: (id: string | number, state: Partial<PlaybackState>) => void;
  getPlaybackState: (id: string | number) => PlaybackState | undefined;
  
  // Tier 2 Methods
  getMediaUrl: (src: string) => string;
  preloadIndices: (
    items: { id: string | number; src: string; type: 'video' | 'image' }[],
    activeIndex: number,
    options: { preFetchAhead: number; preFetchBehind: number; cacheLimit: number }
  ) => void;
  markInUse: (src: string) => void;
  markNotInUse: (src: string) => void;
  clearCache: () => void;
}

const VideoCacheContext = createContext<VideoCacheContextType | null>(null);

export const useVideoCache = () => {
  const context = useContext(VideoCacheContext);
  if (!context) {
    throw new Error('useVideoCache must be used within a VideoCacheProvider');
  }
  return context;
};

interface VideoCacheProviderProps {
  children: React.ReactNode;
  preFetchAhead?: number;
  preFetchBehind?: number;
  cacheLimit?: number;
}

export const VideoCacheProvider: React.FC<VideoCacheProviderProps> = ({
  children,
  preFetchAhead = 2,
  preFetchBehind = 1,
  cacheLimit = 8,
}) => {
  // Tier 1 Store: Playback and UI states
  const playbackStateStore = useRef<Map<string | number, PlaybackState>>(new Map());

  // Tier 2 Store: Object URLs and timestamps
  const objectUrlMap = useRef<Map<string, { objectUrl: string; timestamp: number }>>(new Map());

  // Track which src keys are currently loaded by visible media items
  const inUseSrcs = useRef<Set<string>>(new Set());

  const savePlaybackState = useCallback((id: string | number, state: Partial<PlaybackState>) => {
    const existing = playbackStateStore.current.get(id) || {
      currentTime: 0,
      isMuted: true,
      captionExpanded: false,
    };
    playbackStateStore.current.set(id, { ...existing, ...state });
  }, []);

  const getPlaybackState = useCallback((id: string | number) => {
    return playbackStateStore.current.get(id);
  }, []);

  const markInUse = useCallback((src: string) => {
    inUseSrcs.current.add(src);
  }, []);

  const markNotInUse = useCallback((src: string) => {
    inUseSrcs.current.delete(src);
  }, []);

  const getMediaUrl = useCallback((src: string) => {
    const cached = objectUrlMap.current.get(src);
    if (cached) {
      // Update access timestamp for LRU eviction
      cached.timestamp = Date.now();
      return cached.objectUrl;
    }
    return src;
  }, []);

  // Evict items from the cache using Least Recently Used (LRU) policy
  const enforceLRULimit = useCallback((limit: number) => {
    if (objectUrlMap.current.size <= limit) return;

    // Sort entries by timestamp ascending (oldest first), excluding in-use sources
    const entries = Array.from(objectUrlMap.current.entries())
      .filter(([src]) => !inUseSrcs.current.has(src));
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const excessCount = Math.min(objectUrlMap.current.size - limit, entries.length);
    for (let i = 0; i < excessCount; i++) {
      const [src, data] = entries[i];
      // Revoke the object URL to release the browser's video stream memory
      URL.revokeObjectURL(data.objectUrl);
      objectUrlMap.current.delete(src);
      console.log(`[MediaCache] Evicted off-screen asset to free memory: ${src}`);
    }
  }, []);

  const preloadIndices = useCallback(
    (
      items: { id: string | number; src: string; type: 'video' | 'image' }[],
      activeIndex: number,
      options: { preFetchAhead: number; preFetchBehind: number; cacheLimit: number }
    ) => {
      const config = {
        ahead: options.preFetchAhead ?? preFetchAhead,
        behind: options.preFetchBehind ?? preFetchBehind,
        limit: options.cacheLimit ?? cacheLimit,
      };

      const start = Math.max(0, activeIndex - config.behind);
      const end = Math.min(items.length - 1, activeIndex + config.ahead);

      for (let i = start; i <= end; i++) {
        const item = items[i];
        if (item.type !== 'video' || objectUrlMap.current.has(item.src) || item.src.includes('.m3u8')) {
          continue;
        }

        const src = item.src;
        // Asynchronously pre-fetch video files and store them in memory as Object URLs
        fetch(src)
          .then((res) => {
            if (!res.ok) throw new Error('Fetch failed');
            return res.blob();
          })
          .then((blob) => {
            if (objectUrlMap.current.has(src)) return; // Prevent race conditions
            
            const objectUrl = URL.createObjectURL(blob);
            objectUrlMap.current.set(src, {
              objectUrl,
              timestamp: Date.now(),
            });
            console.log(`[MediaCache] Pre-fetched video blob: ${src}`);
            
            // Re-enforce size boundaries
            enforceLRULimit(config.limit);
          })
          .catch((err) => {
            console.log(`[MediaCache] Cache pre-fetch bypassed (will stream directly): ${src}`, err);
          });
      }
    },
    [preFetchAhead, preFetchBehind, cacheLimit, enforceLRULimit]
  );

  const clearCache = useCallback(() => {
    objectUrlMap.current.forEach((data) => {
      URL.revokeObjectURL(data.objectUrl);
    });
    objectUrlMap.current.clear();
    playbackStateStore.current.clear();
  }, []);

  return (
    <VideoCacheContext.Provider
      value={{
        savePlaybackState,
        getPlaybackState,
        getMediaUrl,
        preloadIndices,
        markInUse,
        markNotInUse,
        clearCache,
      }}
    >
      {children}
    </VideoCacheContext.Provider>
  );
};
