import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { MediaItemData, MediaStackProps } from './types';
import { MediaItem } from './MediaItem';
import { VideoCacheProvider, useVideoCache } from './VideoCacheContext';
import './media-stack.css';
import './tailwind-styles.css';

const MediaStackInner: React.FC<MediaStackProps> = ({
  items,
  direction = 'vertical',
  autoPlay = true,
  muted = true,
  loop = true,
  hideScrollbar = true,
  onActiveIndexChange,
  onItemClick,
  onLikeClick,
  onShareClick,
  onCommentClick,
  renderCustomOverlay,
  showNavArrows = true,
  showProgressBar = true,
  showMuteButton = true,
  showSidebarActions = true,
  showMetaInfo = true,
  autoRotateLandscape = false,
  renderLikeButton,
  renderCommentButton,
  renderShareButton,
  renderExtraActions,
  renderAuthor,
  preFetchAhead = 2,
  preFetchBehind = 1,
  cacheLimit = 8,
  showDevHud = false,
  autoScroll = false,
  autoScrollInterval = 5000,
  onVideoEnded,
  onAuthorClick,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [globalMuted, setGlobalMuted] = useState(muted);
  const [areOverlaysHidden, setAreOverlaysHidden] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'forward' | 'backward'>('forward');
  const lastIndexRef = useRef(0);
  const isFirstRender = useRef(true);

  const { preloadIndices } = useVideoCache();

  // Sync onActiveIndexChange callback on activeIndex updates
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onActiveIndexChange) {
      onActiveIndexChange(activeIndex);
    }
  }, [activeIndex, onActiveIndexChange]);

  const scrollToIndex = useCallback((index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (typeof viewport.scrollTo === 'function') {
      if (direction === 'vertical') {
        const height = viewport.clientHeight;
        viewport.scrollTo({
          top: index * height,
          behavior: 'smooth',
        });
      } else {
        const width = viewport.clientWidth;
        viewport.scrollTo({
          left: index * width,
          behavior: 'smooth',
        });
      }
    }
    setActiveIndex(index);
  }, [direction]);

  // Sync initial mute prop change
  useEffect(() => {
    setGlobalMuted(muted);
  }, [muted]);

  // Track user scroll direction based on index changes
  useEffect(() => {
    if (activeIndex !== lastIndexRef.current) {
      if (activeIndex > lastIndexRef.current) {
        setScrollDirection('forward');
      } else if (activeIndex < lastIndexRef.current) {
        setScrollDirection('backward');
      }
      lastIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  // Auto-scroll loop
  useEffect(() => {
    if (!autoScroll || items.length <= 1) return;

    const timer = setInterval(() => {
      if (scrollDirection === 'forward') {
        if (activeIndex < items.length - 1) {
          const next = activeIndex + 1;
          setActiveIndex(next);
          scrollToIndex(next);
        }
      } else {
        if (activeIndex > 0) {
          const next = activeIndex - 1;
          setActiveIndex(next);
          scrollToIndex(next);
        }
      }
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [autoScroll, autoScrollInterval, scrollDirection, activeIndex, items.length]);

  // Trigger background pre-fetching when active slide index changes
  useEffect(() => {
    // Maps standard schema to preload compatible types
    const preloadItems = items.map((item) => ({
      id: item.id,
      src: item.src,
      type: item.type,
    }));
    preloadIndices(preloadItems, activeIndex, { preFetchAhead, preFetchBehind, cacheLimit });
  }, [activeIndex, items, preloadIndices, preFetchAhead, preFetchBehind, cacheLimit]);

  // Handle scroll events to detect active item
  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let index = 0;
    if (direction === 'vertical') {
      const scrollTop = viewport.scrollTop;
      const height = viewport.clientHeight;
      index = Math.round(scrollTop / (height || 1));
    } else {
      const scrollLeft = viewport.scrollLeft;
      const width = viewport.clientWidth;
      index = Math.round(scrollLeft / (width || 1));
    }

    if (index >= 0 && index < items.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleMuteToggle = () => {
    setGlobalMuted((prev) => !prev);
  };

  const handleOverlaysHiddenToggle = () => {
    setAreOverlaysHidden((prev) => !prev);
  };

  const handleVideoEnded = useCallback((_item: MediaItemData, index: number) => {
    // Fire consumer callback if provided
    if (onVideoEnded) {
      onVideoEnded(_item, index);
      return;
    }
    // Default: auto-advance to next/prev based on scroll direction
    if (scrollDirection === 'forward') {
      if (index < items.length - 1) {
        scrollToIndex(index + 1);
      }
    } else {
      if (index > 0) {
        scrollToIndex(index - 1);
      }
    }
  }, [onVideoEnded, scrollDirection, items.length, scrollToIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < items.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  return (
    <div className="media-stack-container rvf:relative">
      {/* Scroll Viewport */}
      <div
        ref={viewportRef}
        className={`media-stack-viewport ${direction} ${hideScrollbar ? 'hide-scrollbar' : ''}`}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <MediaItem
            key={item.id}
            item={item}
            index={index}
            isActive={index === activeIndex}
            shouldLoad={Math.abs(index - activeIndex) <= 1}
            autoPlay={autoPlay}
            muted={globalMuted}
            loop={loop}
            onMuteToggle={handleMuteToggle}
            areOverlaysHidden={areOverlaysHidden}
            onOverlaysHiddenToggle={handleOverlaysHiddenToggle}
            onItemClick={onItemClick}
            onAuthorClick={onAuthorClick}
            onLikeClick={onLikeClick}
            onShareClick={onShareClick}
            onCommentClick={onCommentClick}
            renderCustomOverlay={renderCustomOverlay}
            showProgressBar={showProgressBar}
            showMuteButton={showMuteButton}
            showSidebarActions={showSidebarActions}
            showMetaInfo={showMetaInfo}
            autoRotateLandscape={autoRotateLandscape}
            renderLikeButton={renderLikeButton}
            renderCommentButton={renderCommentButton}
            renderShareButton={renderShareButton}
            renderExtraActions={renderExtraActions}
            renderAuthor={renderAuthor}
            showDevHud={showDevHud}
            onVideoEnded={handleVideoEnded}
          />
        ))}
      </div>

      {/* Optional navigation arrows for horizontal desktop slider, or even vertical if desired */}
      {showNavArrows && items.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              type="button"
              className="media-stack-nav-arrow left"
              onClick={handlePrev}
              aria-label="Previous Media"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button
              type="button"
              className="media-stack-nav-arrow right"
              onClick={handleNext}
              aria-label="Next Media"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
};

// Exports high-level wrapper wrapped with zero-config context engine
export const MediaStack: React.FC<MediaStackProps> = (props) => {
  return (
    <VideoCacheProvider
      preFetchAhead={props.preFetchAhead}
      preFetchBehind={props.preFetchBehind}
      cacheLimit={props.cacheLimit}
    >
      <MediaStackInner {...props} />
    </VideoCacheProvider>
  );
};
