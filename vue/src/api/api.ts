import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';

// ==========================================
// 1. TypeScript Interfaces
// ==========================================
export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Friend {
    id: number;
    name: string;
}

export interface FriendRequest {
    request_id: number;
    sender_name: string;
    sender_id: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

// ==========================================
// 2. Axios Instance Setup
// ==========================================
// Exporting the client allows for direct use in stores (Pinia/Vuex) 
// or for making one-off dynamic requests outside the repository pattern.
export const apiClient: AxiosInstance = axios.create({
    // Use Vite's environment variables for the base URL, or fallback to a string
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/',
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ==========================================
// 3. Request & Response Interceptors
// ==========================================

// Request Interceptor: Runs before every request is sent
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach a JWT token from local storage
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Add export for standalone token access if needed
export function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

// Response Interceptor: Runs before the `.then()` or `.catch()` in your components
apiClient.interceptors.response.use(
    (response) => {
        // Modify the response here if needed before it reaches the component
        return response;
    },
    (error: AxiosError) => {
        // Global error handling (e.g., redirect to login on 401)
        if (error.response?.status === 401) {
            console.warn('Unauthorized! Logging out...');
            // Add your logout logic/router redirect here
            // e.g., router.push('/login');
        }
        return Promise.reject(error);
    }
);

// ==========================================
// 4. API Repository Methods (Endpoints)
// ==========================================
// Exporting this object enforces the Repository Pattern for cleaner components
export const api = {
    // GET request example
    async getUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    // GET request with dynamic parameter
    async getUserById(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    // POST request example (Notice we omit 'id' since the server generates it)
    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        const response = await apiClient.post<User>('/users', userData);
        return response.data;
    },
    
    // PUT request example for updating a resource
    async updateUser(id: number, userData: Partial<User>): Promise<User> {
        const response = await apiClient.put<User>(`/users/${id}`, userData);
        return response.data;
    },

    // DELETE request example
    async deleteUser(id: number): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    },

    // Friends API
    async getFriends(): Promise<Friend[]> {
        const response = await apiClient.get<Friend[]>('/friends');
        return response.data;
    },

    async getFriendRequests(): Promise<FriendRequest[]> {
        const response = await apiClient.get<FriendRequest[]>('/friends/request');
        return response.data;
    },

    async searchUsers(query: string): Promise<User[]> {
        const response = await apiClient.get<User[]>('/friends/search', {
            params: { q: query }
        });
        return response.data;
    },

    async acceptFriendRequest(requestId: number): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>(`/friends/request/${requestId}/accept`);
        return response.data;
    },

    async declineFriendRequest(requestId: number): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>(`/friends/request/${requestId}/decline`);
        return response.data;
    },

    async getFriendSuggestions(): Promise<Friend[]> {
        const response = await apiClient.get<Friend[]>('/friends/suggestions');
        return response.data;
    },

    async sendFriendRequest(receiverId: number): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>('/friends/request', { receiverId });
        return response.data;
    },

    // Messenger API
    async getConversations(): Promise<{
        id: number;
        name: string;
        last_message: string;
        last_at: string;
        unreadCount: number;
    }[]> {
        const response = await apiClient.get('/messages/conversations');
        return response.data;
    },

    async getConversation(contactId: number): Promise<any> {
        const response = await apiClient.get(`/messages/conversations/${contactId}`);
        return response.data;
    },

    async sendMessage(contactId: number, content: string): Promise<any> {
        const response = await apiClient.post(`/messages/conversations/${contactId}`, { content });

        return response.data;
    },

    // Forum API
    async getForums(params?: { clubId?: number }): Promise<any[]> {
        const response = await apiClient.get('/forum', { params });
        return response.data;
    },

    // Clubs
    async getClubs(): Promise<any[]> {
        const response = await apiClient.get('/clubs');
        return response.data;
    },

    async getClubById(id: number): Promise<any> {
        const response = await apiClient.get(`/clubs/${id}`);
        return response.data;
    },

    async getClubMembers(clubId: number): Promise<any[]> {
        const response = await apiClient.get(`/clubs/${clubId}/members`);
        return response.data;
    },

    async joinClub(clubId: number): Promise<any> {
        const response = await apiClient.post(`/clubs/${clubId}/join`);
        return response.data;
    },

    async getForumById(id: number): Promise<any> {
        const response = await apiClient.get(`/forum/${id}`);
        return response.data;
    },

    async getReplies(forumId: number): Promise<any[]> {
        const response = await apiClient.get(`/forum/${forumId}/replies`);
        return response.data;
    },

    async createForum(title: string, description?: string, club_id?: number): Promise<any> {
        const response = await apiClient.post('/forum', { title, description, club_id });
        return response.data;
    },

    async createReply(forumId: number, content: string, reply_of?: number): Promise<any> {
        const response = await apiClient.post(`/forum/${forumId}/replies`, { content, reply_of });
        return response.data;
    },

    async voteForum(forumId: number, delta = 1): Promise<{ votes: number; user_vote: number }> {
        const response = await apiClient.post(`/forum/${forumId}/vote`, { delta });
        return response.data;
    },

    async voteReply(forumId: number, replyId: number, delta = 1): Promise<{ votes: number; user_vote: number }> {
        const response = await apiClient.post(`/forum/${forumId}/replies/${replyId}/vote`, { delta });
        return response.data;
    },

    // Profile API
    async getProfile(): Promise<any> {
        const response = await apiClient.get('/profile');
        return response.data;
    },

    async getProfileById(id: number): Promise<any> {
        const response = await apiClient.get(`/profile/${id}`);
        return response.data;
    },

    async getProfileFriends(): Promise<any> {
        const response = await apiClient.get('/profile/friends');
        return response.data;
    },

    async getProfileFriendsById(id: number): Promise<any> {
        const response = await apiClient.get(`/profile/${id}/friends`);
        return response.data;
    },
};