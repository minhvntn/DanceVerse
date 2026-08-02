const LOCAL_SERVER_ORIGIN = 'http://localhost:3001';

const browserOrigin = typeof window !== 'undefined'
  ? window.location.origin
  : LOCAL_SERVER_ORIGIN;

export const SERVER_ORIGIN = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.PROD ? browserOrigin : LOCAL_SERVER_ORIGIN);

export const API_BASE_URL = import.meta.env.VITE_API_URL || `${SERVER_ORIGIN}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || SERVER_ORIGIN;
export const ENABLE_FACEBOOK_LOGIN = import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN === 'true';

export const getOAuthUrl = (provider: 'google' | 'facebook'): string => {
  return `${SERVER_ORIGIN}/api/auth/oauth/${provider}?returnTo=/`;
};
