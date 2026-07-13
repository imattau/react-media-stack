import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock HTMLVideoElement methods that are not implemented in JSDOM
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  value: vi.fn().mockImplementation(() => Promise.resolve()),
  writable: true,
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  value: vi.fn().mockImplementation(() => {}),
  writable: true,
});

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  value: vi.fn().mockImplementation(() => {}),
  writable: true,
});
