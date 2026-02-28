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

const setAccessTokenCookie = (accessToken: string) => {
  if (!isBrowser()) {
    return;
  }

  const expiresAt = decodeAccessTokenExpiry(accessToken);
  const maxAge =
    expiresAt && expiresAt * 1000 > Date.now()
      ? Math.floor(expiresAt - Date.now() / 1000)
      : undefined;

  const maxAgeSegment =
    typeof maxAge === 'number' && maxAge > 0 ? `; Max-Age=${maxAge}` : '';
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax${maxAgeSegment}`;
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
