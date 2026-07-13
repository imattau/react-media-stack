import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MediaStack } from '../MediaStack';
import type { MediaItemData } from '../types';

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

  it('applies blur and renders warning overlay when nsfw is true, and unblurs on click', () => {
    const nsfwItem: MediaItemData = {
      ...testItems[0],
      nsfw: true,
    };
    render(<MediaStack items={[nsfwItem]} />);
    
    expect(screen.getByText('Sensitive Content')).toBeInTheDocument();
    const showBtn = screen.getByRole('button', { name: 'Show Content' });
    expect(showBtn).toBeInTheDocument();

    fireEvent.click(showBtn);
    expect(screen.queryByText('Sensitive Content')).not.toBeInTheDocument();
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
});
