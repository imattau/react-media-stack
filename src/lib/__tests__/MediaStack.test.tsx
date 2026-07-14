import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MediaStack } from '../MediaStack';
import type { MediaItemData, MediaStackRef } from '../types';

const testItems: MediaItemData[] = [
  {
    id: '1',
    type: 'video',
    src: 'https://example.com/test-video.mp4',
    title: 'Test Video',
    description: 'This is a test video',
    badge: 'NEW',
  },
  {
    id: '2',
    type: 'image',
    src: 'https://example.com/test-image.jpg',
    title: 'Test Image',
    description: 'This is a test image',
    badge: 'IMAGE',
  },
];

describe('MediaStack Component', () => {
  beforeEach(() => {
    // Mock global fetch to return a valid dummy blob response immediately
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['video-content'], { type: 'video/mp4' })),
      } as Response)
    );
  });

  it('renders all media items in the viewport', () => {
    render(<MediaStack items={testItems} />);
    
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Image')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText('IMAGE')).toBeInTheDocument();
  });

  it('triggers item and overlay clicks correctly', () => {
    const handleLike = vi.fn();
    const handleComment = vi.fn();
    const handleShare = vi.fn();

    // Render with only 1 item to prevent click coordinates index confusion in JSDOM
    render(
      <MediaStack
        items={[testItems[0]]}
        onLikeClick={handleLike}
        onCommentClick={handleComment}
        onShareClick={handleShare}
      />
    );

    const likeBtn = screen.getByRole('button', { name: 'Like' });
    fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalledWith(testItems[0]);

    const replyBtn = screen.getByRole('button', { name: 'Reply' });
    fireEvent.click(replyBtn);
    expect(handleComment).toHaveBeenCalledWith(testItems[0]);

    const shareBtn = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(shareBtn);
    expect(handleShare).toHaveBeenCalledWith(testItems[0]);
  });

  it('custom overlay function works if supplied', () => {
    render(
      <MediaStack
        items={[testItems[0]]}
        renderCustomOverlay={(item) => (
          <div data-testid="custom-overlay">Custom: {item.title}</div>
        )}
      />
    );

    expect(screen.getByText('Custom: Test Video')).toBeInTheDocument();
    expect(screen.queryByText('Like')).not.toBeInTheDocument();
  });

  it('renders developer HUD if showDevHud is true', () => {
    render(<MediaStack items={[testItems[0]]} showDevHud={true} />);
    
    // Developer HUD renders active index & cache source labels
    expect(screen.getByText('Active Index:')).toBeInTheDocument();
    expect(screen.getByText('Cache Source:')).toBeInTheDocument();
  });

  it('custom slot buttons (renderLikeButton, renderCommentButton) replace default controls', () => {
    render(
      <MediaStack
        items={[testItems[0]]}
        onLikeClick={() => {}}
        onCommentClick={() => {}}
        renderLikeButton={() => <div data-testid="custom-like-slot">Custom Like Icon</div>}
        renderCommentButton={() => <div data-testid="custom-comment-slot">Custom Comment Icon</div>}
      />
    );

    // Verify slots replaced standard default buttons
    expect(screen.getByText('Custom Like Icon')).toBeInTheDocument();
    expect(screen.getByText('Custom Comment Icon')).toBeInTheDocument();
  });

  it('supports renderExtraActions slot to append custom buttons to the sidebar', () => {
    render(
      <MediaStack
        items={[testItems[0]]}
        renderExtraActions={(_, index) => (
          <button data-testid="extra-bookmark-btn">Bookmark {index}</button>
        )}
      />
    );
    expect(screen.getByTestId('extra-bookmark-btn')).toHaveTextContent('Bookmark 0');
  });

  it('handles dynamically appending new items correctly', () => {
    const { rerender } = render(<MediaStack items={[testItems[0]]} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.queryByText('Test Image')).not.toBeInTheDocument();

    // Append new item to simulate page loading / infinite scroll append
    rerender(<MediaStack items={[testItems[0], testItems[1]]} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Image')).toBeInTheDocument();
  });

  it('handles rendering empty items array gracefully', () => {
    const { container } = render(<MediaStack items={[]} />);
    // Verify container renders but has no media items
    expect(container.querySelector('.media-stack-container')).toBeInTheDocument();
    expect(container.querySelectorAll('.media-stack-item-wrapper')).toHaveLength(0);
  });

  it('applies layout direction classes correctly', () => {
    const { container, rerender } = render(<MediaStack items={[testItems[0]]} direction="vertical" />);
    expect(container.querySelector('.media-stack-viewport')).toHaveClass('vertical');

    rerender(<MediaStack items={[testItems[0]]} direction="horizontal" />);
    expect(container.querySelector('.media-stack-viewport')).toHaveClass('horizontal');
  });

  it('toggles overlays visibility on subsequent long presses', () => {
    vi.useFakeTimers();
    const { container } = render(<MediaStack items={[testItems[0]]} />);
    const mediaContainer = container.querySelector('.media-stack-media-container');
    expect(mediaContainer).toBeInTheDocument();

    const overlayWrapper = container.querySelector('.rvf\\:opacity-100');
    expect(overlayWrapper).toBeInTheDocument();

    // 1st Long press: Trigger hold to hide
    fireEvent.mouseDown(mediaContainer!);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(overlayWrapper).toHaveClass('rvf:opacity-0');

    // Release mouse up: should STAY hidden (toggle action)
    fireEvent.mouseUp(mediaContainer!);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(overlayWrapper).toHaveClass('rvf:opacity-0');

    // 2nd Long press: Trigger hold again to restore
    fireEvent.mouseDown(mediaContainer!);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(overlayWrapper).toHaveClass('rvf:opacity-100');

    // Release: should STAY visible
    fireEvent.mouseUp(mediaContainer!);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(overlayWrapper).toHaveClass('rvf:opacity-100');
    vi.useRealTimers();
  });

  it('renders publisher profile name and avatar correctly when supplied', () => {
    const authorItem: MediaItemData = {
      ...testItems[0],
      authorName: 'Alex Rivera',
      authorAvatarUrl: 'https://example.com/avatar.jpg',
      authorVerified: true,
    };
    render(<MediaStack items={[authorItem]} />);
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    const avatar = screen.getByAltText('Alex Rivera');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('applies blur and renders warning overlay when nsfw is true, and unblurs/plays on click even if autoPlay is false', () => {
    const playSpy = vi.fn().mockReturnValue(Promise.resolve());
    const pauseSpy = vi.fn();
    HTMLVideoElement.prototype.play = playSpy;
    HTMLVideoElement.prototype.pause = pauseSpy;

    const nsfwItem: MediaItemData = {
      ...testItems[0],
      nsfw: true,
    };
    render(<MediaStack items={[nsfwItem]} autoPlay={false} />);
    
    expect(screen.getByText('Sensitive Content')).toBeInTheDocument();
    expect(pauseSpy).toHaveBeenCalled();
    
    const showBtn = screen.getByRole('button', { name: 'Show Content' });
    expect(showBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(showBtn);
    });
    
    expect(screen.queryByText('Sensitive Content')).not.toBeInTheDocument();
    expect(playSpy).toHaveBeenCalled();
  });

  it('supports renderAuthor slot to custom-render publisher details', () => {
    const authorItem: MediaItemData = {
      ...testItems[0],
      authorName: 'Alex Rivera',
    };
    render(
      <MediaStack
        items={[authorItem]}
        renderAuthor={(item) => (
          <div data-testid="custom-author-profile">Custom Creator: {item.authorName}</div>
        )}
      />
    );
    expect(screen.getByTestId('custom-author-profile')).toHaveTextContent('Custom Creator: Alex Rivera');
  });

  it('handles autoScroll trigger cycles', () => {
    vi.useFakeTimers();
    const mockActiveIndexChange = vi.fn();
    render(
      <MediaStack 
        items={[testItems[0], testItems[1]]} 
        autoScroll={true} 
        autoScrollInterval={2000}
        onActiveIndexChange={mockActiveIndexChange}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(mockActiveIndexChange).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it('persists overlay hidden state across video changes', () => {
    vi.useFakeTimers();
    const { container } = render(
      <MediaStack 
        items={[testItems[0], testItems[1]]} 
        autoScroll={true} 
        autoScrollInterval={2000}
      />
    );
    const mediaContainer = container.querySelector('.media-stack-media-container');
    expect(mediaContainer).toBeInTheDocument();

    expect(container.querySelector('.rvf\\:opacity-100')).toBeInTheDocument();

    // 1st Long press: Trigger hold to hide
    fireEvent.mouseDown(mediaContainer!);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.mouseUp(mediaContainer!);

    expect(container.querySelector('.rvf\\:opacity-0')).toBeInTheDocument();

    // Advance time to auto-scroll to the second video (after 2000ms total)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(container.querySelector('.rvf\\:opacity-0')).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('exposes a ref with a scrollTo helper that correctly navigates programmatically', () => {
    const ref = React.createRef<MediaStackRef>();
    const mockActiveIndexChange = vi.fn();
    render(
      <MediaStack 
        ref={ref}
        items={[testItems[0], testItems[1], { ...testItems[0], id: '3' }]} 
        onActiveIndexChange={mockActiveIndexChange}
      />
    );

    expect(ref.current).toBeDefined();
    
    // Scroll to next (default direction is 'forward', so goes to index 1)
    act(() => {
      ref.current?.scrollTo('next');
    });
    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(1);

    // Scroll to end (index 2). 2 > 1 => scrollDirection is 'forward'
    act(() => {
      ref.current?.scrollTo('end');
    });
    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(2);

    // Scroll to next (direction is 'forward', but capped at 2)
    act(() => {
      ref.current?.scrollTo('next');
    });
    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(2);

    // Scroll to start (index 0). 0 < 2 => scrollDirection becomes 'backward'
    act(() => {
      ref.current?.scrollTo('start');
    });
    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(0);

    // Scroll to next (direction is now 'backward', so index decreases. Capped at 0)
    act(() => {
      ref.current?.scrollTo('next');
    });
    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('stabilizes activeIndex and prevents video reset when items are prepended in the background', () => {
    const mockActiveIndexChange = vi.fn();
    const { rerender } = render(
      <MediaStack 
        items={[testItems[0], testItems[1]]} 
        onActiveIndexChange={mockActiveIndexChange}
      />
    );

    const prependedItem: MediaItemData = {
      id: '0',
      type: 'video',
      src: 'https://example.com/prepended-video.mp4',
      title: 'Prepended Video',
    };
    
    act(() => {
      rerender(
        <MediaStack 
          items={[prependedItem, testItems[0], testItems[1]]} 
          onActiveIndexChange={mockActiveIndexChange}
        />
      );
    });

    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(1);
  });

  it('ensures at most one video is playing at any time', () => {
    const playSpy = vi.fn().mockImplementation(function(this: any) {
      this._testIsPlaying = true;
      return Promise.resolve();
    });
    const pauseSpy = vi.fn().mockImplementation(function(this: any) {
      this._testIsPlaying = false;
    });
    HTMLVideoElement.prototype.play = playSpy;
    HTMLVideoElement.prototype.pause = pauseSpy;

    const { container } = render(
      <MediaStack 
        items={[
          { id: 'v1', type: 'video', src: 'https://example.com/v1.mp4' },
          { id: 'v2', type: 'video', src: 'https://example.com/v2.mp4' },
          { id: 'v3', type: 'video', src: 'https://example.com/v3.mp4' }
        ]} 
        autoPlay={true}
      />
    );

    const videos = Array.from(container.querySelectorAll('video')) as any[];
    expect(videos.length).toBeGreaterThan(0);

    const playingVideos = videos.filter(v => v._testIsPlaying);
    expect(playingVideos).toHaveLength(1);
    expect(videos[0]._testIsPlaying).toBe(true);
    if (videos[1]) {
      expect(videos[1]._testIsPlaying).not.toBe(true);
    }
  });

  it('ensures only the correct active video plays when items are prepended in the background', () => {
    const playSpy = vi.fn().mockImplementation(function(this: any) {
      this._testIsPlaying = true;
      return Promise.resolve();
    });
    const pauseSpy = vi.fn().mockImplementation(function(this: any) {
      this._testIsPlaying = false;
    });
    HTMLVideoElement.prototype.play = playSpy;
    HTMLVideoElement.prototype.pause = pauseSpy;

    const initialItems: MediaItemData[] = [
      { id: 'v1', type: 'video', src: 'https://example.com/v1.mp4' },
      { id: 'v2', type: 'video', src: 'https://example.com/v2.mp4' }
    ];

    const { container, rerender } = render(
      <MediaStack items={initialItems} autoPlay={true} />
    );

    let videos = Array.from(container.querySelectorAll('video')) as any[];
    expect(videos.length).toBeGreaterThan(0);
    
    expect(videos[0]._testIsPlaying).toBe(true);
    if (videos[1]) {
      expect(videos[1]._testIsPlaying).not.toBe(true);
    }

    const prependedItem: MediaItemData = {
      id: 'v0',
      type: 'video',
      src: 'https://example.com/v0.mp4',
    };

    act(() => {
      rerender(
        <MediaStack items={[prependedItem, ...initialItems]} autoPlay={true} />
      );
    });

    videos = Array.from(container.querySelectorAll('video')) as any[];
    const playingVideos = videos.filter(v => v._testIsPlaying);
    expect(playingVideos).toHaveLength(1);
    
    const v1Element = videos.find(v => v.src.includes('v1.mp4'));
    const v0Element = videos.find(v => v.src.includes('v0.mp4'));
    
    expect(v1Element?._testIsPlaying).toBe(true);
    if (v0Element) {
      expect(v0Element._testIsPlaying).not.toBe(true);
    }
  });

  it('adjusts activeIndex to nearest fallback index when the active item is filtered out', () => {
    const ref = React.createRef<MediaStackRef>();
    const mockActiveIndexChange = vi.fn();
    const itemsList: MediaItemData[] = [
      { id: 'v1', type: 'video', src: 'https://example.com/v1.mp4' },
      { id: 'v2', type: 'video', src: 'https://example.com/v2.mp4' },
      { id: 'v3', type: 'video', src: 'https://example.com/v3.mp4' }
    ];

    const { rerender } = render(
      <MediaStack 
        ref={ref}
        items={itemsList} 
        onActiveIndexChange={mockActiveIndexChange}
      />
    );

    // Scroll to index 2 (end)
    act(() => {
      ref.current?.scrollTo('end');
    });

    expect(mockActiveIndexChange).toHaveBeenLastCalledWith(2);
    mockActiveIndexChange.mockClear();

    // Now rerender with v3 filtered out. Expect fallback index to clamp to 1 (which now points to v2)
    act(() => {
      rerender(
        <MediaStack 
          ref={ref}
          items={[
            { id: 'v1', type: 'video', src: 'https://example.com/v1.mp4' },
            { id: 'v2', type: 'video', src: 'https://example.com/v2.mp4' }
          ]} 
          onActiveIndexChange={mockActiveIndexChange}
        />
      );
    });

    // Fallback index should be 1 (index of v2) since index 2 is out of bounds
    expect(mockActiveIndexChange).toHaveBeenCalledWith(1);
  });
});
