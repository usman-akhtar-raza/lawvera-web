import axios from 'axios';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (isRecord(payload)) {
      const message = payload.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
      if (Array.isArray(message)) {
        const joined = message.filter((item): item is string => typeof item === 'string').join(', ');
        if (joined.length > 0) {
          return joined;
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
