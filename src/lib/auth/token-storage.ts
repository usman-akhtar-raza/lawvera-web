import type { AuthTokens } from '@/types';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from './constants';

const isBrowser = () => typeof window !== 'undefined';

const decodeAccessTokenExpiry = (token: string): number | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(window.atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

// Cookie lives for 7 days (matches refresh token lifetime).
// Access token expiry is enforced by the API (401 → interceptor refreshes).
// Using the short JWT expiry here caused the cookie to vanish mid-session,
// which made the middleware redirect to login even though a valid refresh
// token was still available in localStorage.
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const setAccessTokenCookie = (accessToken: string) => {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
};

export const setTokens = (tokens: AuthTokens) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  setAccessTokenCookie(tokens.accessToken);
};

export const clearTokens = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const getAccessToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};
