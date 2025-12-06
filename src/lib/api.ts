import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  User,
  LawyerProfile,
  Booking,
  PaginatedResponse,
  ChatMessage,
  ChatSessionSummary,
  SearchLawyersParams,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4848/api';

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
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });
              const { tokens } = response.data;
              localStorage.setItem('accessToken', tokens.accessToken);
              localStorage.setItem('refreshToken', tokens.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
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
  }): Promise<AuthResponse> {
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
  }): Promise<AuthResponse> {
    const response = await this.client.post('/auth/register/lawyer', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
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
  }): Promise<Booking> {
    const response = await this.client.post('/bookings', data);
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

  // Chat
  async askQuestion(
    message: string,
    sessionId?: string,
  ): Promise<{ sessionId: string; answer: string }> {
    const response = await this.client.post('/chat/ask', {
      message,
      sessionId,
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
}

export const api = new ApiClient();

