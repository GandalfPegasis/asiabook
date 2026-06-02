import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import router from '@/router'; // <-- ADDED: Import your Vue Router
import { useAuth } from '@/composables/useAuth'; // <-- ADDED: Import your Auth composable

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

export interface SentFriendRequest {
  request_id: number
  receiver_name: string
  receiver_id: number
}

// ==========================================
// 2. Axios Instance Setup
// ==========================================
export const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/',
    timeout: 10000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ==========================================
// 3. Request & Response Interceptors
// ==========================================

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
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

export function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

// --- UPDATED RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response?.status === 403) {
            const responseData = error.response.data as { error?: string, suspended?: boolean};
            // Keep the original casing of the error message for display purposes
            const errorMessage = responseData?.error || 'Your account has been suspended.';
            const isSuspended = responseData?.suspended || false;

            const { logout } = useAuth();

            if (isSuspended) {
                // 1. Clear credentials
                logout();
                
                // 2. Route to the forbidden page and pass the dynamic text via query params
                router.push({ 
                    name: 'forbidden', 
                    query: { 
                        title: 'Account Suspended',
                        message: errorMessage 
                    } 
                }); 
            } else {
                logout();
                router.push({ name: 'login', query: { redirect: 'session_expired' } });
            }
        }
        return Promise.reject(error);
    }
);
// ==========================================
// 4. API Repository Methods (Endpoints)
// ==========================================
export const api = {
    async getUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    async getUserById(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        const response = await apiClient.post<User>('/users', userData);
        return response.data;
    },
    
    async updateUser(id: number, userData: Partial<User>): Promise<User> {
        const response = await apiClient.put<User>(`/users/${id}`, userData);
        return response.data;
    },

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

    async getSentFriendRequests(): Promise<SentFriendRequest[]> {
        const response = await apiClient.get<SentFriendRequest[]>('/friends/requests/sent');
        return response.data;
    },

    async cancelFriendRequest(requestId: number): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{ success: boolean; message: string }>(`/friends/requests/${requestId}`);
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

    async updateClub(id: number, data: { title: string; description: string }): Promise<any> {
        const response = await apiClient.put(`/clubs/${id}`, data);
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

    async requestJoinClub(clubId: number): Promise<any> {
        const response = await apiClient.post(`/clubs/${clubId}/request-join`);
        return response.data;
    },

    async getClubRequestStatus(clubId: number): Promise<{ requested: boolean }> {
        const response = await apiClient.get(`/clubs/${clubId}/request-status`);
        return response.data;
    },

    async getClubJoinRequests(clubId: number): Promise<any[]> {
        const response = await apiClient.get(`/clubs/${clubId}/requests`);
        return response.data;
    },

    async approveJoinRequest(clubId: number, requestId: number): Promise<any> {
        const response = await apiClient.post(`/clubs/${clubId}/requests/${requestId}/approve`);
        return response.data;
    },

    async declineJoinRequest(clubId: number, requestId: number): Promise<any> {
        const response = await apiClient.post(`/clubs/${clubId}/requests/${requestId}/decline`);
        return response.data;
    },

    async removeClubMember(clubId: number, memberId: number): Promise<any> {
        const response = await apiClient.delete(`/clubs/${clubId}/members/${memberId}`);
        return response.data;
    },

    async changeClubMemberRole(clubId: number, memberId: number, role: 'admin' | 'member'): Promise<any> {
        const response = await apiClient.patch(`/clubs/${clubId}/members/${memberId}/role`, { role });
        return response.data;
    },

    async getClubEvents(clubId: number): Promise<any[]> {
        const response = await apiClient.get(`/clubs/${clubId}/events`);
        return response.data;
    },

    async createClubEvent(clubId: number, event: { title: string; description?: string; event_date: string; location?: string }): Promise<any> {
        const response = await apiClient.post(`/clubs/${clubId}/events`, event);
        return response.data;
    },

    async updateClubEvent(clubId: number, eventId: number, event: { title: string; description?: string; event_date: string; location?: string }): Promise<any> {
        const response = await apiClient.put(`/clubs/${clubId}/events/${eventId}`, event);
        return response.data;
    },

    async deleteClubEvent(clubId: number, eventId: number): Promise<any> {
        const response = await apiClient.delete(`/clubs/${clubId}/events/${eventId}`);
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

    async markAsRead(contactId: number): Promise<any> {
        try {
            const response = await apiClient.post(`/messages/read/${contactId}`);
            return response.data;
        } catch (error) {
            console.error("Error marking messages as read:", error);
            throw error;
        }
    },
};