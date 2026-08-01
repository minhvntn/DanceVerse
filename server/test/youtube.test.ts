import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId } from '../src/game/youtube.utils';

describe('extractYouTubeVideoId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from short youtu.be URL with query params', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abcdef123')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('accepts raw 11-character video ID', () => {
    expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid strings', () => {
    expect(extractYouTubeVideoId('https://google.com')).toBeNull();
    expect(extractYouTubeVideoId('abc')).toBeNull();
  });
});
