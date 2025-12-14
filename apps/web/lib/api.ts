import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
    private client: AxiosInstance;
    private refreshTokenPromise: Promise<string> | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor - attach token
        this.client.interceptors.request.use(
            (config) => {
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<any>) => {
                const originalRequest = error.config as any;

                // If error is 401 and we haven't retried yet
                if (
                    error.response?.status === 401 &&
                    error.response?.data?.code === 'TOKEN_EXPIRED' &&
                    !originalRequest._retry
                ) {
                    originalRequest._retry = true;

                    try {
                        // Refresh token
                        const newToken = await this.refreshAccessToken();

                        // Update authorization header
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        }

                        // Retry original request
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed - redirect to login
                        if (typeof window !== 'undefined') {
                            localStorage.clear();
                            window.location.href = '/auth/login';
                        }
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private async refreshAccessToken(): Promise<string> {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshTokenPromise) {
            return this.refreshTokenPromise;
        }

        this.refreshTokenPromise = (async () => {
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } =
                response.data.data.tokens;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            this.refreshTokenPromise = null;

            return accessToken;
        })();

        return this.refreshTokenPromise;
    }

    // Auth endpoints
    async register(data: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        organizationName: string;
    }) {
        const response = await this.client.post('/auth/register', data);
        return response.data;
    }

    async login(email: string, password: string) {
        const response = await this.client.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    }

    async logout() {
        const response = await this.client.post('/auth/logout');
        return response.data;
    }

    async getCurrentUser() {
        const response = await this.client.get('/auth/me');
        return response.data;
    }

    // Projects endpoints  
    async getProjects(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }) {
        const response = await this.client.get('/api/projects', { params });
        return response.data;
    }

    async getProject(id: string) {
        const response = await this.client.get(`/api/projects/${id}`);
        return response.data;
    }

    async createProject(data: any) {
        const response = await this.client.post('/api/projects', data);
        return response.data;
    }

    async updateProject(id: string, data: any) {
        const response = await this.client.put(`/api/projects/${id}`, data);
        return response.data;
    }

    async deleteProject(id: string) {
        const response = await this.client.delete(`/api/projects/${id}`);
        return response.data;
    }

    // Leads endpoints
    async getLeads(params?: {
        page?: number;
        limit?: number;
        stage?: string;
        project_id?: string;
        search?: string;
    }) {
        const response = await this.client.get('/api/leads', { params });
        return response.data;
    }

    async getLead(id: string) {
        const response = await this.client.get(`/api/leads/${id}`);
        return response.data;
    }

    async createLead(data: any) {
        const response = await this.client.post('/api/leads', data);
        return response.data;
    }

    async updateLead(id: string, data: any) {
        const response = await this.client.put(`/api/leads/${id}`, data);
        return response.data;
    }

    async deleteLead(id: string) {
        const response = await this.client.delete(`/api/leads/${id}`);
        return response.data;
    }

    async updateLeadStage(id: string, stage: string) {
        const response = await this.client.put(`/api/leads/${id}/stage`, { stage });
        return response.data;
    }
}

export const apiClient = new ApiClient();
