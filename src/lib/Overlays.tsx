import React from 'react';
import { cn } from './utils';
import type { MediaItemData } from './types';

// Raw containers for absolute positioning slots
export const TopHeaderContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('rvf:absolute rvf:top-0 rvf:left-0 rvf:right-0 rvf:z-10 rvf:flex rvf:justify-between rvf:items-start rvf:p-4 rvf:pointer-events-none', className)}
    {...props}
  >
    {children}
  </div>
);

export const RightStackContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('rvf:absolute rvf:right-4 rvf:bottom-20 rvf:z-10 rvf:flex rvf:flex-col rvf:gap-4 rvf:items-center rvf:pointer-events-none', className)}
    {...props}
  >
    {children}
  </div>
);

export const BottomMetaContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('rvf:absolute rvf:left-0 rvf:right-16 rvf:bottom-0 rvf:z-10 rvf:p-4 rvf:flex rvf:flex-col rvf:gap-2 rvf:pointer-events-none', className)}
    {...props}
  >
    {children}
  </div>
);

// 1. Playback Status Centre Fading Icon
interface FadingStatusIconProps {
  status: 'play' | 'pause' | null;
}
export const FadingStatusIcon: React.FC<FadingStatusIconProps> = ({ status }) => {
  if (!status) return null;
  return (
    <div className="rvf:absolute rvf:top-1/2 rvf:left-1/2 rvf:transform rvf:-translate-x-1/2 rvf:-translate-y-1/2 rvf:z-20 rvf:w-16 rvf:h-16 rvf:rounded-full rvf:bg-black/60 rvf:flex rvf:items-center rvf:justify-center rvf:text-white rvf:pointer-events-none rvf:animate-ping">
      {status === 'play' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      )}
    </div>
  );
};

// 2. Expandable Caption Box ("Show More")
interface ExpandableCaptionProps {
  item: MediaItemData;
  title?: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  authorName?: string;
  authorAvatarUrl?: string;
  authorVerified?: boolean;
  renderAuthor?: (item: MediaItemData) => React.ReactNode;
  onAuthorClick?: (item: MediaItemData) => void;
}
export const ExpandableCaption: React.FC<ExpandableCaptionProps> = ({
  item,
  title,
  description,
  expanded,
  onToggle,
  authorName,
  authorAvatarUrl,
  authorVerified,
  renderAuthor,
  onAuthorClick,
}) => {
  if (!title && !description && !authorName) return null;

  const handleAuthorClick = () => {
    onAuthorClick?.(item);
  };

  return (
    <div className="rvf:pointer-events-auto rvf:flex rvf:flex-col rvf:gap-1 rvf:text-white rvf:max-w-md rvf:bg-black/30 rvf:p-3 rvf:rounded-lg rvf:backdrop-blur-sm">
      {renderAuthor ? (
        renderAuthor(item)
      ) : (authorName || authorAvatarUrl) && (
        <button
          type="button"
          onClick={handleAuthorClick}
          className="rvf:flex rvf:items-center rvf:gap-2 rvf:mb-1.5 rvf:cursor-pointer rvf:text-left rvf:bg-transparent rvf:border-none rvf:p-0 rvf:w-full"
        >
          {authorAvatarUrl && (
            <img
              src={authorAvatarUrl}
              alt={authorName || 'Author avatar'}
              className="rvf:w-7 rvf:h-7 rvf:rounded-full rvf:border rvf:border-white/10 rvf:object-cover rvf:shrink-0"
            />
          )}
          <div className="rvf:flex rvf:items-center rvf:gap-1 rvf:min-w-0">
            <span className="rvf:text-xs rvf:font-bold rvf:text-white rvf:truncate">{authorName || 'Anonymous'}</span>
            {authorVerified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="rvf:text-blue-400 rvf:shrink-0">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
              </svg>
            )}
          </div>
        </button>
      )}
      {title && <h3 className="rvf:m-0 rvf:font-bold rvf:text-sm">{title}</h3>}
      {description && (
        <p className={cn(
          'rvf:m-0 rvf:text-xs rvf:opacity-90 rvf:transition-all rvf:duration-300 rvf:line-clamp-2',
          expanded && 'rvf:line-clamp-none'
        )}>
          {description}
        </p>
      )}
      {description && description.length > 80 && (
        <button
          type="button"
          onClick={onToggle}
          className="rvf:text-left rvf:text-[11px] rvf:text-purple-400 rvf:font-semibold rvf:bg-transparent rvf:border-none rvf:p-0 rvf:cursor-pointer rvf:mt-1"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};

// 3. Auto-scrolling horizontal marquee for background music
interface MusicMarqueeProps {
  trackName: string;
}
export const MusicMarquee: React.FC<MusicMarqueeProps> = ({ trackName }) => {
  return (
    <div className="rvf:pointer-events-auto rvf:flex rvf:items-center rvf:gap-2 rvf:text-xs rvf:text-gray-300 rvf:bg-black/30 rvf:px-3 rvf:py-1.5 rvf:rounded-full rvf:w-max rvf:max-w-[180px] rvf:overflow-hidden rvf:backdrop-blur-sm">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rvf:animate-spin">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="16" cy="16" r="3"></circle>
      </svg>
      <div className="rvf:relative rvf:w-full rvf:overflow-hidden rvf:h-4">
        <div className="rvf:absolute rvf:whitespace-nowrap rvf:animate-marquee rvf:flex rvf:gap-4">
          <span>{trackName}</span>
        </div>
      </div>
    </div>
  );
};

// 4. Developer HUD Overlay for Live FPS, Buffer, Index details
interface DevHudProps {
  activeIndex: number;
  bufferHealth: number;
  fps: number;
  isCached: boolean;
}
export const DevHud: React.FC<DevHudProps> = ({
  activeIndex,
  bufferHealth,
  fps,
  isCached,
}) => {
  return (
    <div className="rvf:absolute rvf:top-4 rvf:left-4 rvf:z-30 rvf:bg-black/85 rvf:border rvf:border-gray-800 rvf:p-3 rvf:rounded-md rvf:font-mono rvf:text-[10px] rvf:text-green-400 rvf:flex rvf:flex-col rvf:gap-1 rvf:pointer-events-none shadow-lg">
      <div className="rvf:flex rvf:justify-between rvf:gap-4">
        <span>FPS:</span>
        <span className={fps < 30 ? 'rvf:text-red-400' : 'rvf:text-green-400'}>{fps}</span>
      </div>
      <div className="rvf:flex rvf:justify-between rvf:gap-4">
        <span>Active Index:</span>
        <span>{activeIndex}</span>
      </div>
      <div className="rvf:flex rvf:justify-between rvf:gap-4">
        <span>Buffer Health:</span>
        <span>{bufferHealth.toFixed(1)}s</span>
      </div>
      <div className="rvf:flex rvf:justify-between rvf:gap-4">
        <span>Cache Source:</span>
        <span className={isCached ? 'rvf:text-cyan-400' : 'rvf:text-amber-400'}>
          {isCached ? 'Blob ObjectURL' : 'Network Stream'}
        </span>
      </div>
    </div>
  );
};
