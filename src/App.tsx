import { useState } from 'react';
import { MediaStack } from './lib/MediaStack';
import type { MediaItemData } from './lib/types';
import './App.css';

interface LogMessage {
  time: string;
  text: string;
}

const SAMPLE_MEDIA: MediaItemData[] = [
  {
    id: 1,
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    title: 'Neon Horizon',
    description: 'Explore the high-speed cybernetic grid. Shot on ultra HD phantom camera.',
    badge: 'TRENDING',
    fit: 'cover',
  },
  {
    id: 2,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    title: 'Iridescent Shapes',
    description: 'Abstract CGI rendering capturing colorful wave light waves and materials.',
    badge: 'DIGITAL ART',
    fit: 'cover',
  },
  {
    id: 3,
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    title: 'Wild Wilderness',
    description: 'Breathtaking aerial capture of active valleys and natural rivers.',
    badge: 'NATURE',
    fit: 'cover',
  },
  {
    id: 4,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    title: 'Vivid Gradients',
    description: 'Sleek dark-mode aesthetic with ambient purple and cyan background styling.',
    badge: 'AMBIENT',
    fit: 'cover',
  },
  {
    id: 5,
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    title: 'Urban Playground',
    description: 'High energy skate sequences under ambient metropolitan lighting.',
    badge: 'SPORTS',
    fit: 'cover',
  },
];

function App() {
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [autoPlay, setAutoPlay] = useState(true);
  const [muted, setMuted] = useState(true);
  const [loop, setLoop] = useState(true);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const [hideScrollbar, setHideScrollbar] = useState(true);
  const [showNavArrows, setShowNavArrows] = useState(true);
  const [autoRotateLandscape, setAutoRotateLandscape] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [logs, setLogs] = useState<LogMessage[]>([
    { time: new Date().toLocaleTimeString(), text: 'MediaStack workspace initialized.' },
  ]);

  const addLog = (text: string) => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), text },
      ...prev.slice(0, 15),
    ]);
  };

  const handleActiveIndexChange = (index: number) => {
    setActiveIndex(index);
    addLog(`Switched to slide ${index + 1}: ${SAMPLE_MEDIA[index].title}`);
  };

  const handleLike = (item: MediaItemData) => {
    addLog(`Liked item: "${item.title}"`);
  };

  const handleComment = (item: MediaItemData) => {
    addLog(`Clicked comments on: "${item.title}"`);
  };

  const handleShare = (item: MediaItemData) => {
    addLog(`Clicked share on: "${item.title}"`);
  };

  const handleItemClick = (item: MediaItemData, idx: number) => {
    addLog(`Clicked item "${item.title}" at index ${idx}`);
  };

  // Dynamically update fit style for items
  const mediaItems = SAMPLE_MEDIA.map((item) => ({
    ...item,
    fit,
  }));

  return (
    <div className="demo-app">
      {/* Header */}
      <header className="demo-header">
        <div className="demo-logo">
          <div className="logo-icon">M</div>
          <h1>MediaStack</h1>
          <span className="badge-version">v1.0.0-beta</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Docs & Code
        </a>
      </header>

      {/* Main Workspace */}
      <div className="demo-workspace">
        {/* Device Container */}
        <div className="preview-container">
          <div className={`preview-device ${direction === 'horizontal' ? 'horizontal-preview' : ''}`}>
            <MediaStack
              items={mediaItems}
              direction={direction}
              autoPlay={autoPlay}
              muted={muted}
              loop={loop}
              hideScrollbar={hideScrollbar}
              showNavArrows={showNavArrows}
              onActiveIndexChange={handleActiveIndexChange}
              onItemClick={handleItemClick}
              onLikeClick={handleLike}
              onShareClick={handleShare}
              onCommentClick={handleComment}
              autoRotateLandscape={autoRotateLandscape}
            />
          </div>
        </div>

        {/* Dashboard Control Panel */}
        <div className="dashboard-panel">
          {/* Settings panel */}
          <div className="panel-card">
            <h2>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Layout & Settings
              <span className="badge-version" style={{ marginLeft: 'auto', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', borderColor: 'rgba(0, 210, 255, 0.3)' }}>
                Slide {activeIndex + 1} / {SAMPLE_MEDIA.length}
              </span>
            </h2>
            <div className="config-options">
              {/* Scroll Direction */}
              <div className="config-row">
                <span className="config-label">Scroll Direction</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${direction === 'vertical' ? 'active' : ''}`}
                    onClick={() => {
                      setDirection('vertical');
                      addLog('Changed scrolling direction to vertical.');
                    }}
                  >
                    Vertical
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${direction === 'horizontal' ? 'active' : ''}`}
                    onClick={() => {
                      setDirection('horizontal');
                      addLog('Changed scrolling direction to horizontal.');
                    }}
                  >
                    Horizontal
                  </button>
                </div>
              </div>

              {/* Autoplay */}
              <div className="config-row">
                <span className="config-label">AutoPlay Video</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${autoPlay ? 'active' : ''}`}
                    onClick={() => {
                      setAutoPlay(true);
                      addLog('Autoplay enabled.');
                    }}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${!autoPlay ? 'active' : ''}`}
                    onClick={() => {
                      setAutoPlay(false);
                      addLog('Autoplay disabled.');
                    }}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Mute */}
              <div className="config-row">
                <span className="config-label">Default Mute</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${muted ? 'active' : ''}`}
                    onClick={() => {
                      setMuted(true);
                      addLog('Default mute enabled.');
                    }}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${!muted ? 'active' : ''}`}
                    onClick={() => {
                      setMuted(false);
                      addLog('Default mute disabled.');
                    }}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Loop */}
              <div className="config-row">
                <span className="config-label">Loop Playback</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${loop ? 'active' : ''}`}
                    onClick={() => setLoop(true)}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${!loop ? 'active' : ''}`}
                    onClick={() => setLoop(false)}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Fit Mode */}
              <div className="config-row">
                <span className="config-label">Image/Video Scaling</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${fit === 'cover' ? 'active' : ''}`}
                    onClick={() => setFit('cover')}
                  >
                    Cover
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${fit === 'contain' ? 'active' : ''}`}
                    onClick={() => setFit('contain')}
                  >
                    Contain
                  </button>
                </div>
              </div>

              {/* Hide Scrollbars */}
              <div className="config-row">
                <span className="config-label">Hide Scrollbar</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${hideScrollbar ? 'active' : ''}`}
                    onClick={() => setHideScrollbar(true)}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${!hideScrollbar ? 'active' : ''}`}
                    onClick={() => setHideScrollbar(false)}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Nav Arrows */}
              <div className="config-row">
                <span className="config-label">Nav Arrows (Desktop)</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${showNavArrows ? 'active' : ''}`}
                    onClick={() => setShowNavArrows(true)}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${!showNavArrows ? 'active' : ''}`}
                    onClick={() => setShowNavArrows(false)}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Auto Rotate Landscape */}
              <div className="config-row">
                <span className="config-label">Auto-Rotate Landscape</span>
                <div className="btn-toggle-group">
                  <button
                    type="button"
                    className={`btn-toggle ${autoRotateLandscape ? 'active' : ''}`}
                    onClick={() => {
                      setAutoRotateLandscape(true);
                      addLog('Enabled auto-rotation for landscape media.');
                    }}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${!autoRotateLandscape ? 'active' : ''}`}
                    onClick={() => {
                      setAutoRotateLandscape(false);
                      addLog('Disabled auto-rotation for landscape media.');
                    }}
                  >
                    OFF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className="panel-card">
            <h2>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Interactive Event Logs
            </h2>
            <div className="log-stream">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="time">[{log.time}]</span>
                  <span className="event">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Library features card */}
          <div className="panel-card">
            <h2>Features Highlight</h2>
            <div className="feature-tags">
              <span className="tag">Scroll Snapping</span>
              <span className="tag">Auto Play/Pause</span>
              <span className="tag">Unified Audio Control</span>
              <span className="tag">Timeline Progress Scrubber</span>
              <span className="tag">Overlay Customization</span>
              <span className="tag">Lazy Load States</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
