# MediaStack 🎬

`media_stack` is a high-performance React library for media (video and image) scroll feeds, supporting both **vertical** and **horizontal** snapping layouts. Engineered specifically for mobile-first scrolling applications (like TikTok feeds, Reels, and carousels), it provides built-in DOM virtualization, smart memory reclamation, and automatic video rotation capabilities.

## Key Features

- 🏎️ **DOM Virtualization**: Only mounts media items (videos/images) currently within or adjacent to the viewport, keeping the DOM extremely light.
- ⚡ **Auto-Reclaiming Memory**: Offscreen video elements are dynamically paused and their source streams wiped to release browser video hardware decoders and media caches.
- 🔄 **Auto-Rotation**: Detects landscape media elements and rotates them by 90 degrees to fit a vertical 9:16 portrait viewport.
- 🎛️ **Granular UI Controls**: Toggle default headers, mute buttons, meta description cards, sidebar widgets, and timelines easily.
- 🖌️ **Fully Customizable Overlays**: Completely override the overlay UI using custom render functions.
- 🔊 **Global Audio Sync**: Toggling mute on any video synchronizes volume state across all videos in the stack.

---

## Installation

```bash
npm install media_stack
```

Ensure you import the CSS stylesheet in your project root (e.g. `main.tsx` or `App.tsx`):
```typescript
import 'media_stack/dist/assets/index.css';
```

---

## API Reference

### `<MediaStack />`

The main scrolling viewport wrapper.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `MediaItemData[]` | *Required* | Array of media elements to scroll. |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Scroll layout snap alignment. |
| `autoPlay` | `boolean` | `true` | Auto-play active video elements. |
| `muted` | `boolean` | `true` | Initialize active videos as muted. |
| `loop` | `boolean` | `true` | Loop video playback. |
| `hideScrollbar` | `boolean` | `true` | Hide viewport scrollbars. |
| `showNavArrows` | `boolean` | `true` | Show desktop left/right arrow controls. |
| `showProgressBar` | `boolean` | `true` | Show timeline progress indicators. |
| `showMuteButton` | `boolean` | `true` | Show default sound-mute control button. |
| `showSidebarActions` | `boolean` | `true` | Show default like/reply/share sidebar. |
| `showMetaInfo` | `boolean` | `true` | Show title and description info metadata. |
| `autoRotateLandscape` | `boolean` | `false` | Rotate landscape media 90 degrees inside vertical layouts. |
| `onActiveIndexChange` | `(index: number) => void` | `undefined` | Callback fired when user snaps to a different media index. |
| `onItemClick` | `(item: MediaItemData, index: number) => void` | `undefined` | Callback fired when the media background is tapped. |
| `onLikeClick` | `(item: MediaItemData) => void` | `undefined` | Callback for the Like button. |
| `onShareClick` | `(item: MediaItemData) => void` | `undefined` | Callback for the Share button. |
| `onCommentClick` | `(item: MediaItemData) => void` | `undefined` | Callback for the Reply/Comment button. |
| `renderCustomOverlay` | `(item, index, isActive) => ReactNode` | `undefined` | Overrides the default layout overlays with custom code components. |

---

### `MediaItemData` Schema

Individual items passed into the `items` array follow this structure:

```typescript
export interface MediaItemData {
  id: string | number;           // Unique element identifier
  type: 'image' | 'video';       // Media type
  src: string;                  // Direct media URL
  poster?: string;              // Image URL to show while video is loading/virtualized
  title?: string;               // Display title
  description?: string;         // Display description
  badge?: string;               // Display category badge (e.g. "TRENDING")
  fit?: 'cover' | 'contain';    // Visual scaling behavior (default: 'cover')
  customData?: Record<string, any>; // Optional container for extra data fields
}
```

---

## Code Examples

### Basic Usage (Vertical Reels Feed)

```tsx
import { MediaStack, MediaItemData } from 'media_stack';

const FEEDS: MediaItemData[] = [
  {
    id: 1,
    type: 'video',
    src: 'https://example.com/video1.mp4',
    poster: 'https://example.com/poster1.jpg',
    title: 'Neon Skaters',
    description: 'Cruising through the retro streets.',
    badge: 'SPORTS',
  },
  {
    id: 2,
    type: 'image',
    src: 'https://example.com/art.jpg',
    title: 'Vaporwave Sunset',
    description: 'Chilled ambient design project.',
  }
];

export default function App() {
  return (
    <div style={{ width: '380px', height: '680px' }}>
      <MediaStack
        items={FEEDS}
        autoRotateLandscape={true}
        onLikeClick={(item) => console.log('Liked:', item.title)}
      />
    </div>
  );
}
```

### Advanced (Custom Overlays)

```tsx
import { MediaStack } from 'media_stack';

export default function CustomApp() {
  return (
    <MediaStack
      items={FEEDS}
      renderCustomOverlay={(item, index, isActive) => (
        <div style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>
          <h4>Custom Display: {item.title}</h4>
          {isActive && <p>Currently Active Slide</p>}
        </div>
      )}
    />
  );
}
```

---

## Development & Verification

### Running the Sandbox Demo
Start the interactive Vite dashboard panel:
```bash
npm run dev
```

### Running Test Suites
- **Unit & Component Testing (Vitest)**:
  ```bash
  npm run test
  ```
- **End-to-End Testing (Playwright)**:
  ```bash
  npm run test:e2e
  ```
