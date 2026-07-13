import React, { useRef, useState, useEffect } from 'react';
import type { MediaStackProps } from './types';
import { MediaItem } from './MediaItem';
import './media-stack.css';

export const MediaStack: React.FC<MediaStackProps> = ({
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
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [globalMuted, setGlobalMuted] = useState(muted);

  // Sync initial mute prop change
  useEffect(() => {
    setGlobalMuted(muted);
  }, [muted]);

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
      if (onActiveIndexChange) {
        onActiveIndexChange(index);
      }
    }
  };

  const handleMuteToggle = () => {
    setGlobalMuted((prev) => !prev);
  };

  const scrollToIndex = (index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

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
    setActiveIndex(index);
  };

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
    <div className="media-stack-container">
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
            autoPlay={autoPlay}
            muted={globalMuted}
            loop={loop}
            onMuteToggle={handleMuteToggle}
            onItemClick={onItemClick}
            onLikeClick={onLikeClick}
            onShareClick={onShareClick}
            onCommentClick={onCommentClick}
            renderCustomOverlay={renderCustomOverlay}
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
