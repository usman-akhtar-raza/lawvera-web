export enum UserRole {
  CLIENT = 'client',
  LAWYER = 'lawyer',
  ADMIN = 'admin',
}

export enum BookingStatus {
  AWAITING_PAYMENT = 'awaiting_payment',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
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
  consultationFee: number;
  slotDate: string;
  slotTime: string;
  status: BookingStatus;
  reason?: string;
  notes?: string;
  payment: {
    provider: string;
    status: PaymentStatus;
    amountMinor: number;
    currency: string;
    txnRefNo: string;
    responseCode?: string;
    responseMessage?: string;
    paidAt?: string;
    failedAt?: string;
    expiresAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCheckoutSession {
  bookingId: string;
  redirectUrl: string;
  expiresAt: string;
}

export interface FinanceCounterparty {
  id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
}

export interface FinanceTransaction {
  id: string;
  bookingId: string;
  direction: 'paid' | 'received';
  counterparty: FinanceCounterparty;
  lawyerSpecialization: string | null;
  amountMinor: number;
  currency: string;
  provider: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  txnRefNo: string;
  receiptNumber?: string;
  paidAt: string | null;
  initiatedAt?: string | null;
  failedAt?: string | null;
  appointmentDate: string;
  slotTime: string;
  reason: string | null;
  responseMessage?: string | null;
}

export interface FinanceSummary {
  totalTransactions: number;
  totalAmountMinor: number;
  currency: string;
  succeededTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  cancelledTransactions: number;
  expiredTransactions: number;
}

export interface FinanceResponse {
  role: 'client' | 'lawyer';
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export interface AdminFinanceParticipant extends FinanceCounterparty {
  specialization?: string | null;
}

export interface AdminFinanceTransaction {
  id: string;
  bookingId: string;
  client: FinanceCounterparty;
  lawyer: AdminFinanceParticipant;
  amountMinor: number;
  currency: string;
  provider: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  txnRefNo: string;
  receiptNumber: string;
  paidAt: string | null;
  initiatedAt: string | null;
  failedAt: string | null;
  appointmentDate: string | null;
  slotTime: string;
  reason: string | null;
  responseMessage: string | null;
}

export interface AdminFinanceResponse {
  role: 'admin';
  summary: FinanceSummary;
  transactions: AdminFinanceTransaction[];
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  user: string | User;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatCitation {
  sourceTitle: string;
  sourceId: string;
  chunkId: string;
  metadata?: Record<string, unknown>;
}

export interface ChatRetrievedPreview {
  sourceTitle: string;
  metadata?: Record<string, unknown>;
  snippet: string;
}

export interface ChatAskResponse {
  sessionId: string;
  answer: string;
  citations: ChatCitation[];
  retrievedPreview: ChatRetrievedPreview[];
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  lastMessagePreview: string;
  updatedAt: string;
  messageCount?: number;
}

export interface CaseCommunicationMessage {
  _id: string;
  threadId: string;
  caseId: string;
  sender: string | User;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface CaseCommunicationPayload {
  threadId: string | null;
  caseId: string;
  participants: User[];
  unreadCount: number;
  messages: CaseCommunicationMessage[];
}

export interface CaseCommunicationThreadSummary {
  threadId: string;
  caseId: string;
  caseTitle: string;
  caseStatus: CaseStatus;
  participants: User[];
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
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

export interface OtpRequiredResponse {
  message: string;
  email: string;
  requiresVerification: true;
}

export type RegisterResponse = AuthResponse | OtpRequiredResponse;
export type LoginResponse = AuthResponse | OtpRequiredResponse;

export enum CaseStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum CaseRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum CaseCategory {
  CRIMINAL = 'criminal',
  FAMILY = 'family',
  PROPERTY = 'property',
  CORPORATE = 'corporate',
  IMMIGRATION = 'immigration',
  TAX = 'tax',
  CIVIL = 'civil',
  LABOUR = 'labour',
  CONSUMER = 'consumer',
  OTHER = 'other',
}

export interface CaseActivityLog {
  action: string;
  actor: string | User;
  note?: string;
  createdAt: string;
}

export interface CaseLawyerRequest {
  lawyer: string | LawyerProfile;
  message?: string;
  status: CaseRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface LegalCase {
  _id: string;
  title: string;
  description: string;
  category: CaseCategory;
  status: CaseStatus;
  client: string | User;
  lawyer?: string | LawyerProfile;
  lawyerRequests?: CaseLawyerRequest[];
  resolutionSummary?: string;
  resolvedAt?: string;
  closedAt?: string;
  activityLog: CaseActivityLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseAnalytics {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
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

export interface SearchCaseFeedParams {
  search?: string;
  category?: CaseCategory;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
