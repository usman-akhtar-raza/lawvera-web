export enum UserRole {
  CLIENT = 'client',
  LAWYER = 'lawyer',
  ADMIN = 'admin',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LawyerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LawyerProfile {
  _id: string;
  user: User;
  specialization: string;
  experienceYears: number;
  city: string;
  consultationFee: number;
  availability: AvailabilitySlot[];
  education?: string;
  description?: string;
  status: LawyerStatus;
  ratingAverage: number;
  ratingCount: number;
  reviews: Review[];
  profilePhotoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilitySlot {
  day: string;
  slots: string[];
}

export interface Review {
  _id?: string;
  client: string | User;
  rating: number;
  comment?: string;
  createdAt: Date | string;
}

export interface Booking {
  _id: string;
  client: string | User;
  lawyer: string | LawyerProfile;
  slotDate: string;
  slotTime: string;
  status: BookingStatus;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  user: string | User;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  lastMessagePreview: string;
  updatedAt: string;
  messageCount?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  lawyerProfile?: LawyerProfile;
  profileStatus?: LawyerStatus;
}

export interface SearchLawyersParams {
  page?: number;
  limit?: number;
  specialization?: string;
  city?: string;
  minFee?: number;
  maxFee?: number;
  minExperience?: number;
  minRating?: number;
  availability?: 'today' | 'tomorrow';
  search?: string; // For frontend filtering only
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SearchLawyersParams {
  page?: number;
  limit?: number;
  specialization?: string;
  city?: string;
  minFee?: number;
  maxFee?: number;
  minExperience?: number;
  minRating?: number;
  availability?: 'today' | 'tomorrow';
  search?: string; // For frontend filtering only
}

