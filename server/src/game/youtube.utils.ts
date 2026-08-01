const VALID_HOSTNAMES = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
]);

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a valid 11-character YouTube video ID from supported URL schemes:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 *
 * @param inputUrl - The raw YouTube URL string
 * @returns The 11-character video ID or null if invalid
 */
export function extractYouTubeVideoId(inputUrl: string): string | null {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return null;
  }

  const trimmed = inputUrl.trim();
  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!VALID_HOSTNAMES.has(hostname)) {
    return null;
  }

  let videoId: string | null = null;

  if (hostname === 'youtu.be') {
    // e.g. https://youtu.be/VIDEO_ID
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      videoId = pathParts[0];
    }
  } else {
    // youtube.com variants
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v');
    } else if (parsed.pathname.startsWith('/shorts/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // ['shorts', 'VIDEO_ID']
      if (parts[0] === 'shorts' && parts.length > 1) {
        videoId = parts[1];
      }
    } else if (parsed.pathname.startsWith('/live/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // ['live', 'VIDEO_ID']
      if (parts[0] === 'live' && parts.length > 1) {
        videoId = parts[1];
      }
    } else if (parsed.pathname.startsWith('/embed/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' && parts.length > 1) {
        videoId = parts[1];
      }
    }
  }

  if (!videoId || !VIDEO_ID_REGEX.test(videoId)) {
    return null;
  }

  return videoId;
}
