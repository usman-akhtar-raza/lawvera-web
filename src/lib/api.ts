import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  User,
  LawyerProfile,
  Booking,
  BookingStatus,
  BookingCheckoutSession,
  FinanceResponse,
  PaginatedResponse,
  ChatMessage,
  ChatSessionSummary,
  ChatAskResponse,
  CaseCommunicationMessage,
  CaseCommunicationPayload,
  CaseCommunicationThreadSummary,
  SearchLawyersParams,
  RegisterResponse,
  LoginResponse,
  LegalCase,
  CaseCategory,
  CaseStatus,
  CaseAnalytics,
  SearchCaseFeedParams,
} from '@/types';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/token-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4848/api';

export type LawSourceStatus = 'active' | 'disabled';

export type LawSourceRecord = {
  id: string;
  title: string;
  edition: string | null;
  jurisdiction: string | null;
  language: string | null;
  status: LawSourceStatus;
  ingestionStatus: string;
  warningText: string | null;
  createdAt: string;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (!originalRequest) {
          return Promise.reject(error);
        }

        if (
          error.response?.status === 401 &&
          typeof originalRequest.url === 'string' &&
          originalRequest.url.includes('/auth/refresh')
        ) {
          clearTokens();
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });
              const { tokens } = response.data as { tokens: { accessToken: string; refreshToken: string } };
              setTokens(tokens);
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              }
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }

          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Auth
  async registerClient(data: {
    name: string;
    email: string;
    password: string;
    city?: string;
    phone?: string;
  }): Promise<RegisterResponse> {
    const response = await this.client.post('/auth/register/client', data);
    return response.data;
  }

  async registerLawyer(data: {
    name: string;
    email: string;
    password: string;
    specialization: string;
    experienceYears: number;
    city: string;
    consultationFee: number;
    education?: string;
    description?: string;
    profilePhotoUrl?: string;
    availability: Array<{ day: string; slots: string[] }>;
  }): Promise<RegisterResponse> {
    const response = await this.client.post('/auth/register/lawyer', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async sendOtp(email: string): Promise<{ message: string; email: string }> {
    const response = await this.client.post('/auth/send-otp', { email });
    return response.data;
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/verify-otp', { email, otp });
    return response.data;
  }

  async applyAsLawyer(data: {
    specialization: string;
    experienceYears: number;
    city: string;
    consultationFee: number;
    education?: string;
    description?: string;
    profilePhotoUrl?: string;
    availability: Array<{ day: string; slots: string[] }>;
  }): Promise<AuthResponse> {
    // Step 1: create the lawyer profile and upgrade the user's role in the DB
    const applyRes = await this.client.post('/lawyers/apply', data);
    const { lawyerProfile } = applyRes.data as { user: unknown; lawyerProfile: LawyerProfile };

    // Step 2: refresh tokens so the JWT carries the new "lawyer" role
    const refreshToken = getRefreshToken();
    const refreshRes = await this.client.post('/auth/refresh', { refreshToken });
    const { user, tokens } = refreshRes.data as AuthResponse;

    return { user, tokens, lawyerProfile };
  }

  async revertToClient(): Promise<AuthResponse> {
    // Step 1: revert role in DB (LawyerProfile kept intact)
    await this.client.post('/lawyers/revert-to-client');
    // Step 2: refresh tokens so JWT carries the new "client" role
    const refreshToken = getRefreshToken();
    const refreshRes = await this.client.post('/auth/refresh', { refreshToken });
    return refreshRes.data as AuthResponse;
  }

  async getProfile(): Promise<User & { lawyerProfile?: LawyerProfile }> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Lawyers
  async searchLawyers(
    params: SearchLawyersParams,
  ): Promise<PaginatedResponse<LawyerProfile>> {
    const response = await this.client.get('/lawyers', { params });
    return response.data;
  }

  async getLawyerById(id: string): Promise<LawyerProfile> {
    const response = await this.client.get(`/lawyers/${id}`);
    return response.data;
  }

  async getLawyerProfile(): Promise<LawyerProfile> {
    const response = await this.client.get('/lawyers/me/profile');
    return response.data;
  }

  async updateLawyerProfile(
    id: string,
    data: Partial<LawyerProfile>,
  ): Promise<LawyerProfile> {
    const response = await this.client.patch(`/lawyers/${id}`, data);
    return response.data;
  }

  async updateAvailability(
    availability: Array<{ day: string; slots: string[] }>,
  ): Promise<LawyerProfile> {
    const response = await this.client.patch('/lawyers/me/availability', {
      availability,
    });
    return response.data;
  }

  async getSpecializations(): Promise<Array<{ _id: string; name: string }>> {
    const response = await this.client.get('/lawyers/specializations/list');
    return response.data;
  }

  async addReview(
    lawyerId: string,
    data: { rating: number; comment?: string },
  ): Promise<LawyerProfile> {
    const response = await this.client.post(`/lawyers/${lawyerId}/reviews`, data);
    return response.data;
  }

  async getLawyerDashboard(): Promise<{
    profile: LawyerProfile;
    stats: { pending: number; upcoming: number; completed: number };
    pending: Booking[];
    upcoming: Booking[];
  }> {
    const response = await this.client.get('/lawyers/me/dashboard');
    return response.data;
  }

  // Bookings
  async createBooking(data: {
    lawyerId: string;
    slotDate: string;
    slotTime: string;
    reason?: string;
    notes?: string;
  }): Promise<BookingCheckoutSession> {
    const response = await this.client.post('/bookings', data);
    return response.data;
  }

  async getBookingPaymentStatus(bookingId: string): Promise<Booking> {
    const response = await this.client.get(`/bookings/${bookingId}/payment-status`);
    return response.data;
  }

  async getClientBookings(): Promise<Booking[]> {
    const response = await this.client.get('/bookings/client/me');
    return response.data;
  }

  async getLawyerBookings(): Promise<Booking[]> {
    const response = await this.client.get('/bookings/lawyer/me');
    return response.data;
  }

  async updateBookingStatus(
    bookingId: string,
    data: { status: BookingStatus; notes?: string },
  ): Promise<Booking> {
    const response = await this.client.patch(`/bookings/${bookingId}/status`, data);
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    const response = await this.client.patch(`/bookings/${bookingId}/cancel`);
    return response.data;
  }

  async getMyFinances(): Promise<FinanceResponse> {
    const response = await this.client.get('/bookings/finances/me');
    return response.data;
  }

  // Chat
  async askQuestion(
    payload: {
      message: string;
      sessionId?: string;
      mode?: 'user' | 'lawyer';
      jurisdiction?: string;
      sourceIds?: string[];
    },
  ): Promise<ChatAskResponse> {
    const response = await this.client.post('/chat/ask', {
      message: payload.message,
      sessionId: payload.sessionId,
      mode: payload.mode,
      jurisdiction: payload.jurisdiction,
      sourceIds: payload.sourceIds,
    });
    return response.data;
  }

  async getChatSessions(): Promise<ChatSessionSummary[]> {
    const response = await this.client.get('/chat/sessions');
    return response.data;
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.client.get(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  async deleteChatSession(
    sessionId: string,
  ): Promise<{ sessionId: string; deleted: number }> {
    const response = await this.client.delete(`/chat/sessions/${sessionId}`);
    return response.data;
  }

  // Communication Chat (Client <-> Lawyer)
  async getCommunicationThreads(): Promise<CaseCommunicationThreadSummary[]> {
    const response = await this.client.get('/communication/threads');
    return response.data;
  }

  async getCaseCommunication(caseId: string): Promise<CaseCommunicationPayload> {
    const response = await this.client.get(`/communication/cases/${caseId}/messages`);
    return response.data;
  }

  async sendCaseMessage(
    caseId: string,
    payload: { content: string },
  ): Promise<CaseCommunicationMessage> {
    const response = await this.client.post(
      `/communication/cases/${caseId}/messages`,
      payload,
    );
    return response.data;
  }

  async markCaseMessagesRead(
    caseId: string,
  ): Promise<{ marked: number; unreadCount: number }> {
    const response = await this.client.post(`/communication/cases/${caseId}/read`);
    return response.data;
  }

  // Admin
  async getAdminOverview(): Promise<{
    pending: LawyerProfile[];
    metrics: { total: number; approved: number; pending: number };
  }> {
    const response = await this.client.get('/lawyers/admin/overview');
    return response.data;
  }

  async approveLawyer(lawyerId: string): Promise<LawyerProfile> {
    const response = await this.client.patch(`/lawyers/${lawyerId}/approve`);
    return response.data;
  }

  async rejectLawyer(lawyerId: string): Promise<LawyerProfile> {
    const response = await this.client.patch(`/lawyers/${lawyerId}/reject`);
    return response.data;
  }

  async getAllBookings(): Promise<Booking[]> {
    const response = await this.client.get('/bookings/admin/all');
    return response.data;
  }

  async getAnalytics(): Promise<{
    total: number;
    confirmed: number;
    today: number;
  }> {
    const response = await this.client.get('/bookings/admin/analytics');
    return response.data;
  }

  async listLawSources(): Promise<LawSourceRecord[]> {
    const response = await this.client.get('/law-sources');
    return response.data;
  }

  async uploadLawSource(file: File, payload: {
    title?: string;
    edition?: string;
    jurisdiction?: string;
    language?: string;
  }): Promise<LawSourceRecord> {
    const formData = new FormData();
    formData.append('file', file);
    if (payload.title) formData.append('title', payload.title);
    if (payload.edition) formData.append('edition', payload.edition);
    if (payload.jurisdiction) formData.append('jurisdiction', payload.jurisdiction);
    if (payload.language) formData.append('language', payload.language);

    const response = await this.client.post('/law-sources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateLawSourceStatus(
    id: string,
    status: LawSourceStatus,
  ): Promise<LawSourceRecord> {
    const response = await this.client.patch(`/law-sources/${id}`, { status });
    return response.data;
  }

  async deleteLawSource(id: string): Promise<{ success: true }> {
    const response = await this.client.delete(`/law-sources/${id}`);
    return response.data;
  }

  // Cases
  async createCase(data: {
    title: string;
    description: string;
    category: CaseCategory;
  }): Promise<LegalCase> {
    const response = await this.client.post('/cases', data);
    return response.data;
  }

  async getClientCases(): Promise<LegalCase[]> {
    const response = await this.client.get('/cases/client/me');
    return response.data;
  }

  async getLawyerCases(): Promise<LegalCase[]> {
    const response = await this.client.get('/cases/lawyer/me');
    return response.data;
  }

  async getLawyerCaseFeed(
    params: SearchCaseFeedParams = {},
  ): Promise<LegalCase[]> {
    const response = await this.client.get('/cases/lawyer/feed', { params });
    return response.data;
  }

  async getCaseById(id: string): Promise<LegalCase> {
    const response = await this.client.get(`/cases/${id}`);
    return response.data;
  }

  async assignLawyerToCase(
    caseId: string,
    lawyerId: string,
  ): Promise<LegalCase> {
    const response = await this.client.patch(`/cases/${caseId}/assign`, {
      lawyerId,
    });
    return response.data;
  }

  async requestCase(
    caseId: string,
    data: { message?: string } = {},
  ): Promise<LegalCase> {
    const response = await this.client.post(`/cases/${caseId}/requests`, data);
    return response.data;
  }

  async acceptCaseRequest(
    caseId: string,
    lawyerId: string,
  ): Promise<LegalCase> {
    const response = await this.client.patch(
      `/cases/${caseId}/requests/${lawyerId}/accept`,
    );
    return response.data;
  }

  async updateCaseStatus(
    caseId: string,
    data: { status: CaseStatus; note?: string },
  ): Promise<LegalCase> {
    const response = await this.client.patch(`/cases/${caseId}/status`, data);
    return response.data;
  }

  async getAllCases(): Promise<LegalCase[]> {
    const response = await this.client.get('/cases/admin/all');
    return response.data;
  }

  async getCaseAnalytics(): Promise<CaseAnalytics> {
    const response = await this.client.get('/cases/admin/analytics');
    return response.data;
  }
}

export const api = new ApiClient();
