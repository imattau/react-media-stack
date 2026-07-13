import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('handles dynamically appending new items correctly', () => {
    const { rerender } = render(<MediaStack items={[testItems[0]]} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.queryByText('Test Image')).not.toBeInTheDocument();

    // Append new item to simulate page loading / infinite scroll append
    rerender(<MediaStack items={[testItems[0], testItems[1]]} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Image')).toBeInTheDocument();
  });
});
