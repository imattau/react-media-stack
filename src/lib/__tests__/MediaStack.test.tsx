import { describe, it, expect, vi } from 'vitest';
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

    render(
      <MediaStack
        items={testItems}
        onLikeClick={handleLike}
        onCommentClick={handleComment}
        onShareClick={handleShare}
      />
    );

    // Get the like buttons and trigger clicks using standard testing library queries.
    const likeBtn = screen.getAllByRole('button', { name: 'Like' })[0];
    fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalledWith(testItems[0]);

    const replyBtn = screen.getAllByRole('button', { name: 'Reply' })[0];
    fireEvent.click(replyBtn);
    expect(handleComment).toHaveBeenCalledWith(testItems[0]);

    const shareBtn = screen.getAllByRole('button', { name: 'Share' })[0];
    fireEvent.click(shareBtn);
    expect(handleShare).toHaveBeenCalledWith(testItems[0]);
  });

  it('custom overlay function works if supplied', () => {
    render(
      <MediaStack
        items={testItems}
        renderCustomOverlay={(item) => (
          <div data-testid="custom-overlay">Custom: {item.title}</div>
        )}
      />
    );

    expect(screen.getByText('Custom: Test Video')).toBeInTheDocument();
    expect(screen.getByText('Custom: Test Image')).toBeInTheDocument();
    expect(screen.queryByText('Like')).not.toBeInTheDocument();
  });
});
