import type { Booking, LawyerProfile, User } from '@/types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUser = (value: unknown): value is User =>
  isObject(value) &&
  typeof value._id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.email === 'string' &&
  typeof value.role === 'string';

export function asUser(value: unknown): User | null {
  return isUser(value) ? value : null;
}

const isLawyerProfile = (value: unknown): value is LawyerProfile =>
  isObject(value) &&
  typeof value._id === 'string' &&
  typeof value.specialization === 'string' &&
  typeof value.city === 'string' &&
  typeof value.experienceYears === 'number' &&
  typeof value.consultationFee === 'number';

export function asLawyerProfile(value: Booking['lawyer']): LawyerProfile | null {
  return isLawyerProfile(value) ? value : null;
}
