export type MediaType = 'image' | 'video';

export interface MediaItemData {
  id: string | number;
  type: MediaType;
  src: string;
  poster?: string;
  title?: string;
  description?: string;
  badge?: string;
  fit?: 'cover' | 'contain';
  // Optional custom data
  customData?: Record<string, any>;
}

export interface MediaStackProps {
  items: MediaItemData[];
  direction?: 'vertical' | 'horizontal';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  hideScrollbar?: boolean;
  onActiveIndexChange?: (index: number) => void;
  onItemClick?: (item: MediaItemData, index: number) => void;
  onLikeClick?: (item: MediaItemData) => void;
  onShareClick?: (item: MediaItemData) => void;
  onCommentClick?: (item: MediaItemData) => void;
  renderCustomOverlay?: (item: MediaItemData, index: number, isActive: boolean) => React.ReactNode;
  showNavArrows?: boolean;
  showProgressBar?: boolean;
  showMuteButton?: boolean;
  showSidebarActions?: boolean;
  showMetaInfo?: boolean;
}
