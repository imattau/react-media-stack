import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { MediaItemData } from './types';
import { useVideoCache } from './VideoCacheContext';
import * as Overlays from './Overlays';
import Hls from 'hls.js';

interface MediaItemProps {
  item: MediaItemData;
  stateKey?: string | number;
  index: number;
  isActive: boolean;
  shouldLoad: boolean;
  autoPlay: boolean;
  muted: boolean;
  loop: boolean;
  onMuteToggle: () => void;
  onItemClick?: (item: MediaItemData, index: number) => void;
  onAuthorClick?: (item: MediaItemData) => void;
  onLikeClick?: (item: MediaItemData) => void;
  onShareClick?: (item: MediaItemData) => void;
  onCommentClick?: (item: MediaItemData) => void;
  renderCustomOverlay?: (item: MediaItemData, index: number, isActive: boolean) => React.ReactNode;
  showProgressBar?: boolean;
  showMuteButton?: boolean;
  showSidebarActions?: boolean;
  showMetaInfo?: boolean;
  autoRotateLandscape?: boolean;
  renderLikeButton?: (isActive: boolean, onClick: () => void) => React.ReactNode;
  renderCommentButton?: (onClick: () => void) => React.ReactNode;
  renderShareButton?: (onClick: () => void) => React.ReactNode;
  renderExtraActions?: (item: MediaItemData, index: number) => React.ReactNode;
  renderAuthor?: (item: MediaItemData) => React.ReactNode;
  showDevHud?: boolean;
  onVideoEnded?: (item: MediaItemData, index: number) => void;
  areOverlaysHidden?: boolean;
  onOverlaysHiddenToggle?: () => void;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  areOverlaysHidden: areOverlaysHiddenProp,
  onOverlaysHiddenToggle,
  item,
  stateKey = item.id,
  index,
  isActive,
  shouldLoad,
  autoPlay,
  muted,
  loop,
  onMuteToggle,
  onItemClick,
  onAuthorClick,
  onLikeClick,
  onShareClick,
  onCommentClick,
  renderCustomOverlay,
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
  showDevHud = false,
  onVideoEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<'play' | 'pause' | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const feedbackTimeout = useRef<number | null>(null);

  // Dev HUD States
  const [fps, setFps] = useState(60);
  const [bufferHealth, setBufferHealth] = useState(0);

  const hlsRef = useRef<Hls | null>(null);
  const hlsSrcRef = useRef<string | null>(null);
  const loadedSrcRef = useRef<string | null>(null);
  const playbackRequestRef = useRef(0);

  const {
    getPlaybackState,
    savePlaybackState,
    getMediaUrl,
    markInUse,
    markNotInUse,
    requestExclusivePlayback,
    releaseExclusivePlayback,
    cacheVersion,
  } = useVideoCache();

  // Tier 1 Restore Playback Micro-state on mount
  const cachedState = getPlaybackState(stateKey);
  const [captionExpanded, setCaptionExpanded] = useState(cachedState?.captionExpanded ?? false);

  const captionExpandedRef = useRef(captionExpanded);
  useEffect(() => {
    captionExpandedRef.current = captionExpanded;
  }, [captionExpanded]);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node;
    } else {
      const video = videoRef.current;
      if (video) {
        savePlaybackState(stateKey, {
          currentTime: video.currentTime,
          captionExpanded: captionExpandedRef.current,
        });
        video.pause();
        releaseExclusivePlayback(video);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        video.removeAttribute('src');
        try {
          video.load();
        } catch {
          // ignore
        }
      }
      videoRef.current = null;
      loadedSrcRef.current = null;
    }
  }, [item.id, savePlaybackState, releaseExclusivePlayback]);

  // Long Press to Hide Overlays States & Refs
  const [localAreOverlaysHidden, setLocalAreOverlaysHidden] = useState(false);
  const areOverlaysHidden = areOverlaysHiddenProp !== undefined ? areOverlaysHiddenProp : localAreOverlaysHidden;
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef(false);

  // NSFW Blur State
  const [isNsfwBlurred, setIsNsfwBlurred] = useState(item.nsfw ?? false);

  // Reset overlay visibility and NSFW blur when item becomes inactive
  useEffect(() => {
    if (!isActive) {
      setLocalAreOverlaysHidden(false);
      setIsNsfwBlurred(item.nsfw ?? false);
    }
  }, [isActive, item.nsfw]);

  // Clean up timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (feedbackTimeout.current) {
        window.clearTimeout(feedbackTimeout.current);
      }
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Destroy HLS instance on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Playback coordination and Tier 2 object URL binding
  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== 'video') return;

    const isHls = item.src.endsWith('.m3u8') || item.src.includes('.m3u8');

    if (shouldLoad) {
      if (isHls) {
        if (Hls.isSupported()) {
          // Re-initialize if src changed
          if (hlsRef.current && hlsSrcRef.current !== item.src) {
            hlsRef.current.destroy();
            hlsRef.current = null;
            hlsSrcRef.current = null;
          }
          if (!hlsRef.current) {
            const hls = new Hls({
              maxMaxBufferLength: 10,
            });
            hlsRef.current = hls;
            hlsSrcRef.current = item.src;
            hls.loadSource(item.src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              const cached = getPlaybackState(stateKey);
              if (cached && cached.currentTime > 0) {
                video.currentTime = cached.currentTime;
              }
            });
          }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Apple Safari HLS support
          if (video.src !== item.src) {
            video.src = item.src;
            video.load();
            const cached = getPlaybackState(stateKey);
            if (cached && cached.currentTime > 0) {
              video.currentTime = cached.currentTime;
            }
          }
        }
      } else {
        // Standard video source (pre-fetched blobs or network URLs)
        const resolvedSrc = getMediaUrl(item.src);
        const isAlreadyPlayingCurrent = loadedSrcRef.current === resolvedSrc;

        if (!isAlreadyPlayingCurrent) {
          setLoadError(null);
          setIsLoading(true);
          video.src = resolvedSrc;
          video.load();
          loadedSrcRef.current = resolvedSrc;

          // Restore cached playtime index
          const cached = getPlaybackState(stateKey);
          if (cached && cached.currentTime > 0) {
            video.currentTime = cached.currentTime;
          }
        }
      }

      // Mark source as in-use to protect from cache eviction
      markInUse(item.src);

      // Ensure muted state is applied before playing (belt-and-suspenders with the muted HTML attribute)
      if (video.muted !== muted) {
        video.muted = muted;
      }

      if (!isActive || isNsfwBlurred) {
        savePlaybackState(stateKey, {
          currentTime: video.currentTime,
          captionExpanded,
        });
        video.pause();
        releaseExclusivePlayback(video);
        setIsPlaying(false);
      } else if (autoPlay) {
        const requestId = ++playbackRequestRef.current;
        requestExclusivePlayback(video);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (requestId === playbackRequestRef.current && videoRef.current === video && isActive) {
                setIsPlaying(true);
              } else {
                // Scrolled away, superseded, or unmounted while play() was resolving —
                // the browser started playback before we could cancel it, so stop it now.
                video.pause();
                releaseExclusivePlayback(video);
              }
            })
            .catch((err) => {
              console.log('Autoplay prevented or interrupted:', err);
              if (requestId === playbackRequestRef.current) {
                releaseExclusivePlayback(video);
                setIsPlaying(false);
              }
            });
        }
      } else {
        // autoPlay explicitly set to false — don't auto-play
        video.pause();
        releaseExclusivePlayback(video);
        setIsPlaying(false);
      }
    } else {
      // Save state immediately before unloading element source
      savePlaybackState(stateKey, {
        currentTime: video.currentTime,
        captionExpanded,
      });

      // Release resources
      video.pause();
      releaseExclusivePlayback(video);
      setIsPlaying(false);
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      video.removeAttribute('src');
      video.load();
    }

    return () => {
      if (video) {
        markNotInUse(item.src);
        video.pause();
        releaseExclusivePlayback(video);
        if (!shouldLoad || !isMountedRef.current) {
          video.removeAttribute('src');
          try {
            video.load();
          } catch {
            // ignore
          }
          loadedSrcRef.current = null;
        }
      }
      if ((!shouldLoad || !isMountedRef.current) && hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isActive, shouldLoad, autoPlay, muted, item.type, item.src, stateKey, getMediaUrl, getPlaybackState, savePlaybackState, markInUse, markNotInUse, captionExpanded, isNsfwBlurred, requestExclusivePlayback, releaseExclusivePlayback, cacheVersion]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Calculate FPS (Developer HUD helper)
  useEffect(() => {
    if (!isActive || !showDevHud) return;
    let lastTime = performance.now();
    let frames = 0;
    let frameId: number;

    const tick = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isActive, showDevHud]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      // Update progress bar
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(isNaN(pct) ? 0 : pct);

      // Update buffer health metrics
      const current = video.currentTime;
      const buffered = video.buffered;
      let health = 0;
      for (let i = 0; i < buffered.length; i++) {
        const start = buffered.start(i);
        const end = buffered.end(i);
        if (current >= start && current <= end) {
          health = end - current;
          break;
        }
      }
      setBufferHealth(health);
    }
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
    if (isNsfwBlurred) return;

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    isLongPressActiveRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      if (onOverlaysHiddenToggle) {
        onOverlaysHiddenToggle();
      } else {
        setLocalAreOverlaysHidden(prev => !prev);
      }
      isLongPressActiveRef.current = true;
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (isLongPressActiveRef.current) {
      setTimeout(() => {
        isLongPressActiveRef.current = false;
      }, 0);
    }
  };

  const handlePressMove = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNsfwBlurred) return;
    
    // Ignore click action if long press was active
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }

    if (onItemClick) {
      onItemClick(item, index);
    }

    const video = videoRef.current;
    if (!video || item.type !== 'video') return;
    const requestId = ++playbackRequestRef.current;

    if (isPlaying) {
      video.pause();
      releaseExclusivePlayback(video);
      setIsPlaying(false);
      triggerFeedback('pause');
    } else {
      requestExclusivePlayback(video);
      video.play()
        .then(() => {
          if (requestId === playbackRequestRef.current && videoRef.current === video) {
            setIsPlaying(true);
            triggerFeedback('play');
          } else {
            video.pause();
            releaseExclusivePlayback(video);
          }
        })
        .catch((err) => {
          console.log('Playback prevented or interrupted:', err);
          if (requestId === playbackRequestRef.current) {
            releaseExclusivePlayback(video);
            setIsPlaying(false);
          }
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
    if (!Number.isFinite(video.duration) || width <= 0) return;
    video.currentTime = Math.max(0, Math.min(video.duration, (clickX / width) * video.duration));
  };

  const renderMuteIcon = () => {
    if (muted) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z"></path>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    );
  };

  // Check if current source matches cache Blob Object URL
  const resolvedMediaSrc = getMediaUrl(item.src);
  const isCached = resolvedMediaSrc.startsWith('blob:');

  return (
    <div className="media-stack-item-wrapper rvf:relative rvf:w-full rvf:h-full">
      {shouldLoad ? (
        <div
          className="media-stack-media-container rvf:relative rvf:w-full rvf:h-full"
          onClick={handleVideoClick}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onMouseMove={handlePressMove}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchMove={handlePressMove}
          onTouchCancel={handlePressEnd}
        >
          {item.type === 'video' ? (
            <video
              ref={setVideoRef}
              data-media-src={item.src}
              poster={item.poster}
              className={`media-stack-media ${item.fit || 'contain'} ${autoRotateLandscape && isLandscape ? 'rotated' : ''}`}
              style={isNsfwBlurred ? { filter: 'blur(30px)', transform: 'scale(1.05)', transition: 'filter 0.5s ease, transform 0.5s ease' } : { transition: 'filter 0.5s ease, transform 0.5s ease' }}
              loop={loop}
              muted={muted}
              preload="auto"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={(e) => {
                const vid = e.currentTarget;
                setIsLandscape(vid.videoWidth > vid.videoHeight);
              }}
              onLoadStart={() => { setLoadError(null); setIsLoading(true); }}
              onWaiting={() => setIsLoading(true)}
              onError={() => {
                setIsLoading(false);
                setLoadError('Unable to load this media.');
                playbackRequestRef.current += 1;
                releaseExclusivePlayback(videoRef.current!);
                setIsPlaying(false);
              }}
              onPlay={(e) => {
                const vid = e.currentTarget;
                requestExclusivePlayback(vid);
                if (!isActive) {
                  vid.pause();
                }
              }}
              onPause={(e) => {
                const vid = e.currentTarget;
                releaseExclusivePlayback(vid);
                if (isMountedRef.current && videoRef.current === vid) {
                  setIsPlaying(false);
                }
              }}
              onPlaying={(e) => {
                const vid = e.currentTarget;
                if (!isActive) {
                  vid.pause();
                  setIsPlaying(false);
                } else {
                  setIsLoading(false);
                  setIsPlaying(true);
                }
              }}
              onCanPlay={() => setIsLoading(false)}
              onEnded={() => onVideoEnded?.(item, index)}
            />
          ) : (
            <img
              src={item.src}
              alt={item.title || 'Media content'}
              className={`media-stack-media ${item.fit || 'contain'} ${autoRotateLandscape && isLandscape ? 'rotated' : ''}`}
              style={isNsfwBlurred ? { filter: 'blur(30px)', transform: 'scale(1.05)', transition: 'filter 0.5s ease, transform 0.5s ease' } : { transition: 'filter 0.5s ease, transform 0.5s ease' }}
              onLoad={(e) => {
                setIsLoading(false);
                setLoadError(null);
                const img = e.currentTarget;
                setIsLandscape(img.naturalWidth > img.naturalHeight);
              }}
              onError={() => {
                setIsLoading(false);
                setLoadError('Unable to load this media.');
              }}
            />
          )}

          {loadError && (
            <div role="alert" className="media-stack-loading rvf:absolute rvf:inset-0 rvf:flex rvf:items-center rvf:justify-center rvf:text-white rvf:z-20">
              {loadError}
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && (
            <div className="media-stack-loading rvf:absolute rvf:top-1/2 rvf:left-1/2 rvf:transform rvf:-translate-x-1/2 rvf:-translate-y-1/2 rvf:flex rvf:flex-col rvf:items-center rvf:gap-2 rvf:text-white rvf:pointer-events-none rvf:z-20">
              <div className="media-stack-spinner rvf:w-10 rvf:h-10 rvf:border-2 rvf:border-white/20 rvf:border-t-purple-500 rvf:rounded-full rvf:animate-spin" />
            </div>
          )}

          {/* Fading Playback Center status icon */}
          <Overlays.FadingStatusIcon status={feedback} />

          {/* Developer HUD display */}
          {showDevHud && (
            <div className={`rvf:transition-opacity rvf:duration-300 ${areOverlaysHidden ? 'rvf:opacity-0' : 'rvf:opacity-100'}`}>
              <Overlays.DevHud
                activeIndex={index}
                bufferHealth={bufferHealth}
                fps={fps}
                isCached={isCached}
              />
            </div>
          )}

          {/* Custom or default Slots Layer */}
          {renderCustomOverlay ? (
            <div className={`rvf:absolute rvf:inset-0 rvf:pointer-events-none rvf:z-10 rvf:transition-opacity rvf:duration-300 ${areOverlaysHidden ? 'rvf:opacity-0' : 'rvf:opacity-100'}`}>
              {renderCustomOverlay(item, index, isActive)}
            </div>
          ) : (
            <div className={`rvf:transition-opacity rvf:duration-300 ${areOverlaysHidden ? 'rvf:opacity-0' : 'rvf:opacity-100'}`}>
              {/* Top Header Slot */}
              <Overlays.TopHeaderContainer>
                <div className="rvf:pointer-events-auto">
                  {item.badge && <span className="media-stack-badge">{item.badge}</span>}
                </div>
                {item.type === 'video' && showMuteButton && (
                  <button
                    type="button"
                    className="media-stack-icon-btn rvf:pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMuteToggle();
                    }}
                    title={muted ? 'Unmute' : 'Mute'}
                  >
                    {renderMuteIcon()}
                  </button>
                )}
              </Overlays.TopHeaderContainer>

              {/* Bottom Meta & Caption Layer */}
              <Overlays.BottomMetaContainer>
                {showMetaInfo && (
                  <Overlays.ExpandableCaption
                    item={item}
                    title={item.title}
                    description={item.description}
                    expanded={captionExpanded}
                    onToggle={() => setCaptionExpanded(!captionExpanded)}
                    authorName={item.authorName}
                    authorAvatarUrl={item.authorAvatarUrl}
                    authorVerified={item.authorVerified}
                    renderAuthor={renderAuthor}
                    onAuthorClick={onAuthorClick}
                  />
                )}
                {/* Horizontal rotating music marquee placeholder */}
                {showMetaInfo && item.title && (
                  <Overlays.MusicMarquee trackName={`${item.title} Original Audio`} />
                )}
              </Overlays.BottomMetaContainer>

              {/* Sidebar Action Menu Layer (The Slots Pattern override checks) */}
              {showSidebarActions && (
                <Overlays.RightStackContainer>
                  {onLikeClick && (
                    <div className="media-stack-action-item">
                      {renderLikeButton ? (
                        renderLikeButton(isActive, () => onLikeClick(item))
                      ) : (
                        <button
                          type="button"
                          className="media-stack-icon-btn rvf:pointer-events-auto"
                          aria-label="Like"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLikeClick(item);
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </button>
                      )}
                      <span className="media-stack-action-count">Like</span>
                    </div>
                  )}

                  {onCommentClick && (
                    <div className="media-stack-action-item">
                      {renderCommentButton ? (
                        renderCommentButton(() => onCommentClick(item))
                      ) : (
                        <button
                          type="button"
                          className="media-stack-icon-btn rvf:pointer-events-auto"
                          aria-label="Reply"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCommentClick(item);
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                      )}
                      <span className="media-stack-action-count">Reply</span>
                    </div>
                  )}

                  {onShareClick && (
                    <div className="media-stack-action-item">
                      {renderShareButton ? (
                        renderShareButton(() => onShareClick(item))
                      ) : (
                        <button
                          type="button"
                          className="media-stack-icon-btn rvf:pointer-events-auto"
                          aria-label="Share"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareClick(item);
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                          </svg>
                        </button>
                      )}
                      <span className="media-stack-action-count">Share</span>
                    </div>
                  )}

                  {renderExtraActions && renderExtraActions(item, index)}
                </Overlays.RightStackContainer>
              )}
            </div>
          )}

          {/* Timeline Loader progress bar */}
          {item.type === 'video' && !renderCustomOverlay && showProgressBar && (
            <div className={`media-stack-progress-container rvf:pointer-events-auto rvf:transition-opacity rvf:duration-300 ${areOverlaysHidden ? 'rvf:opacity-0' : 'rvf:opacity-100'}`} onClick={handleProgressBarClick}>
              <div className="media-stack-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* NSFW Blur Overlay */}
          {isNsfwBlurred && (
            <div className="rvf:absolute rvf:inset-0 rvf:z-30 rvf:bg-black/80 rvf:backdrop-blur-lg rvf:flex rvf:flex-col rvf:items-center rvf:justify-center rvf:p-6 rvf:text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rvf:text-red-500 rvf:mb-3">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <h4 className="rvf:text-white rvf:font-bold rvf:text-sm rvf:mb-1">Sensitive Content</h4>
              <p className="rvf:text-gray-300 rvf:text-[11px] rvf:max-w-[240px] rvf:mb-5 rvf:leading-relaxed">This post contains sensitive content which some people may find offensive or disturbing.</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNsfwBlurred(false);
                  const video = videoRef.current;
                  if (video && item.type === 'video' && isActive) {
                    const requestId = ++playbackRequestRef.current;
                    requestExclusivePlayback(video);
                    video.play()
                      .then(() => {
                        if (requestId === playbackRequestRef.current && videoRef.current === video && isActive) {
                          setIsPlaying(true);
                        } else {
                          video.pause();
                          releaseExclusivePlayback(video);
                        }
                      })
                      .catch((err) => {
                        console.log('Playback prevented or interrupted:', err);
                        if (requestId === playbackRequestRef.current) {
                          releaseExclusivePlayback(video);
                          setIsPlaying(false);
                        }
                      });
                  }
                }}
                className="rvf:bg-white rvf:text-black rvf:text-[10px] rvf:font-bold rvf:px-4 rvf:py-2 rvf:rounded-full rvf:hover:bg-gray-200 rvf:transition-colors rvf:cursor-pointer shadow-md"
              >
                Show Content
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Virtualized Placeholder Shell: unmounts heavy nodes, keeps snap bounds active */
        <div className="media-stack-media-container rvf:relative rvf:w-full rvf:h-full" style={{ background: '#0a0a0e' }}>
          {item.poster && (
            <img
              src={item.poster}
              className="media-stack-media cover"
              alt=""
              loading="lazy"
              decoding="async"
              style={{ opacity: 0.15, filter: 'blur(10px)' }}
            />
          )}
        </div>
      )}
    </div>
  );
};
