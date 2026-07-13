import React, { useRef, useState, useEffect } from 'react';
import type { MediaItemData } from './types';

interface MediaItemProps {
  item: MediaItemData;
  index: number;
  isActive: boolean;
  autoPlay: boolean;
  muted: boolean;
  loop: boolean;
  onMuteToggle: () => void;
  onItemClick?: (item: MediaItemData, index: number) => void;
  onLikeClick?: (item: MediaItemData) => void;
  onShareClick?: (item: MediaItemData) => void;
  onCommentClick?: (item: MediaItemData) => void;
  renderCustomOverlay?: (item: MediaItemData, index: number, isActive: boolean) => React.ReactNode;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  item,
  index,
  isActive,
  autoPlay,
  muted,
  loop,
  onMuteToggle,
  onItemClick,
  onLikeClick,
  onShareClick,
  onCommentClick,
  renderCustomOverlay,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<'play' | 'pause' | null>(null);
  const feedbackTimeout = useRef<number | null>(null);

  // Playback coordination
  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== 'video') return;

    if (isActive && autoPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log('Autoplay prevented or interrupted:', err);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, autoPlay, item.type]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(isNaN(pct) ? 0 : pct);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onItemClick) {
      onItemClick(item, index);
    }

    const video = videoRef.current;
    if (!video || item.type !== 'video') return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      triggerFeedback('pause');
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        triggerFeedback('play');
      });
    }
  };

  const triggerFeedback = (type: 'play' | 'pause') => {
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
    }
    setFeedback(type);
    feedbackTimeout.current = window.setTimeout(() => {
      setFeedback(null);
    }, 500);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || item.type !== 'video') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * video.duration;
    video.currentTime = seekTime;
  };

  // Render SVG icons for UI controls
  const renderMuteIcon = () => {
    if (muted) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z"></path>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    );
  };

  return (
    <div className="media-stack-item-wrapper">
      <div className="media-stack-media-container" onClick={handleVideoClick}>
        {item.type === 'video' ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={item.poster}
            className={`media-stack-media ${item.fit || 'contain'}`}
            loop={loop}
            preload="auto"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadStart={() => setIsLoading(true)}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => {
              setIsLoading(false);
              setIsPlaying(true);
            }}
            onCanPlay={() => setIsLoading(false)}
          />
        ) : (
          <img
            src={item.src}
            alt={item.title || 'Media content'}
            className={`media-stack-media ${item.fit || 'contain'}`}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="media-stack-loading">
            <div className="media-stack-spinner" />
          </div>
        )}

        {/* Center Feedback (Play/Pause indicator) */}
        <div className={`media-stack-center-feedback ${feedback ? 'active' : ''}`}>
          {feedback === 'play' ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          )}
        </div>

        {/* Overlays */}
        {renderCustomOverlay ? (
          renderCustomOverlay(item, index, isActive)
        ) : (
          <div className="media-stack-overlay">
            {/* Top Row: Info badge & Mute button */}
            <div className="media-stack-header">
              <div>
                {item.badge && <span className="media-stack-badge">{item.badge}</span>}
              </div>
              {item.type === 'video' && (
                <button
                  type="button"
                  className="media-stack-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMuteToggle();
                  }}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {renderMuteIcon()}
                </button>
              )}
            </div>

            {/* Bottom Row: Metadata (Title/Desc) and Action sidebar (TikTok-style) */}
            <div className="media-stack-content-bottom">
              <div className="media-stack-meta">
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </div>

              <div className="media-stack-actions-sidebar">
                {onLikeClick && (
                  <div className="media-stack-action-item">
                    <button
                      type="button"
                      className="media-stack-icon-btn"
                      aria-label="Like"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLikeClick(item);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                    <span className="media-stack-action-count">Like</span>
                  </div>
                )}

                {onCommentClick && (
                  <div className="media-stack-action-item">
                    <button
                      type="button"
                      className="media-stack-icon-btn"
                      aria-label="Reply"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCommentClick(item);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                    <span className="media-stack-action-count">Reply</span>
                  </div>
                )}

                {onShareClick && (
                  <div className="media-stack-action-item">
                    <button
                      type="button"
                      className="media-stack-icon-btn"
                      aria-label="Share"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareClick(item);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                    </button>
                    <span className="media-stack-action-count">Share</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Timeline Progress bar */}
        {item.type === 'video' && !renderCustomOverlay && (
          <div className="media-stack-progress-container" onClick={handleProgressBarClick}>
            <div className="media-stack-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};
