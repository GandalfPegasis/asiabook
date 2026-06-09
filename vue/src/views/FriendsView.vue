<script setup lang="ts">
import { api } from '@/api/api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

// --- Interfaces ---
interface Friend {
  id: number
  name: string
}

interface FriendRequest {
  request_id: number
  sender_name: string
  sender_id: number
}

// NEW: Interface for sent requests
interface SentFriendRequest {
  request_id: number
  receiver_name: string
  receiver_id: number
}

interface User {
  id: number
  name: string
  email: string
}

const router = useRouter();

// Received Requests
const friendRequests = ref<FriendRequest[]>([]);
const isLoadingFriendRequest = ref(true);
const friendRequestError = ref<string | null>(null);

// NEW: Sent Requests
const sentRequests = ref<SentFriendRequest[]>([]);
const isLoadingSentRequests = ref(true);
const sentRequestsError = ref<string | null>(null);

// Friends List
const friends = ref<Friend[]>([]);
const isLoadingFriends = ref(true);
const friendsError = ref<string | null>(null);

// Search functionality
const searchQuery = ref('');
const searchResults = ref<User[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);

// Friend suggestions
const suggestions = ref<Friend[]>([]);
const isLoadingSuggestions = ref(true);
const suggestionsError = ref<string | null>(null);

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null;

const fetchFriends = async () => {
  isLoadingFriends.value = true;
  friendsError.value = null;
  try {
    friends.value = await api.getFriends();
  } catch (err) {
    console.error(err);
    friendsError.value = 'Failed to load friends list.';
  } finally {
    isLoadingFriends.value = false;
  }
};

const fetchFriendRequest = async () => {
  isLoadingFriendRequest.value = true;
  friendRequestError.value = null;
  try {
    friendRequests.value = await api.getFriendRequests();
  } catch (err) {
    console.error(err);
    friendRequestError.value = 'Failed to load friend requests.';
  } finally {
    isLoadingFriendRequest.value = false;
  }
};

// NEW: Fetch sent requests
const fetchSentRequests = async () => {
  isLoadingSentRequests.value = true;
  sentRequestsError.value = null;
  try {
    // Make sure to add this to your api/api.ts file!
    sentRequests.value = await api.getSentFriendRequests();
  } catch (err) {
    console.error(err);
    sentRequestsError.value = 'Failed to load sent friend requests.';
  } finally {
    isLoadingSentRequests.value = false;
  }
};

const fetchSuggestions = async () => {
  isLoadingSuggestions.value = true;
  suggestionsError.value = null;
  try {
    suggestions.value = await api.getFriendSuggestions();
  } catch (err) {
    console.error(err);
    suggestionsError.value = 'Failed to load friend suggestions.';
  } finally {
    isLoadingSuggestions.value = false;
  }
};

const performSearch = async (query: string) => {
  if (query.trim().length < 2) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  searchError.value = null;
  try {
    searchResults.value = await api.searchUsers(query.trim());
  } catch (err) {
    console.error(err);
    searchError.value = 'Failed to search users.';
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const onSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch(searchQuery.value);
  }, 300);
};

const acceptRequest = async (requestId: number) => {
  try {
    await api.acceptFriendRequest(requestId);
    friendRequests.value = friendRequests.value.filter(req => req.request_id !== requestId);
    await fetchFriends();
    await fetchSuggestions(); 
  } catch (err) {
    console.error('Failed to accept friend request:', err);
  }
};

const declineRequest = async (requestId: number) => {
  try {
    await api.declineFriendRequest(requestId);
    friendRequests.value = friendRequests.value.filter(req => req.request_id !== requestId);
  } catch (err) {
    console.error('Failed to decline friend request:', err);
  }
};

// NEW: Cancel a request you sent
const cancelSentRequest = async (requestId: number) => {
  try {
    // Make sure to add this to your api/api.ts file!
    await api.cancelFriendRequest(requestId);
    sentRequests.value = sentRequests.value.filter(req => req.request_id !== requestId);
  } catch (err) {
    console.error('Failed to cancel sent request:', err);
  }
};

const sendFriendRequest = async (userId: number) => {
  try {
    await api.sendFriendRequest(userId);
    // Remove from search results and suggestions
    searchResults.value = searchResults.value.filter(user => user.id !== userId);
    suggestions.value = suggestions.value.filter(suggestion => suggestion.id !== userId);
    
    // Refresh the sent requests list so it shows up immediately
    await fetchSentRequests();
  } catch (err) {
    console.error('Failed to send friend request:', err);
  }
};

// Navigation functions
const viewProfile = (userId: number) => {
  router.push(`/profile/${userId}`);
};

const sendMessage = (userId: number, name?: string) => {
  router.push({ name: 'messages', params: { id: userId } });
};

onMounted(() => {
  fetchFriends();
  fetchFriendRequest();
  fetchSentRequests(); // NEW: Call it on mount
  fetchSuggestions();
});
</script>

<template>
  <div class="friends-page">
    <div class="page-header">
      <div class="header-content">
        <Icon icon="mdi:account-group" class="header-icon" />
        <div>
          <h1 class="page-title">Friends</h1>
          <p class="page-subtitle">Connect with people and manage your social circle</p>
        </div>
      </div>
    </div>

    <div class="friends-container">
      <aside class="search-sidebar">
        <div class="search-card">
          <div class="card-header">
            <Icon icon="mdi:magnify" class="card-icon" />
            <h3>Find Friends</h3>
          </div>

          <div class="search-input-wrapper">
            <Icon icon="mdi:magnify" class="search-icon" />
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              type="text"
              placeholder="Search by name or email..."
              class="search-input"
            />
            <div v-if="isSearching" class="search-spinner">
              <Icon icon="mdi:loading" class="spinner-icon" />
            </div>
          </div>

          <div v-if="searchError" class="error-message">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            {{ searchError }}
          </div>

          <div v-if="searchResults.length > 0" class="search-results-grid">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="search-result-card"
            >
              <div class="search-card-top">
                <div class="user-avatar">
                  <div class="avatar-placeholder">{{ user.name.charAt(0).toUpperCase() }}</div>
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email" :title="user.email">{{ user.email }}</div>
                </div>
              </div>
              
              <div class="search-card-actions">
                <div class="secondary-actions">
                  <button @click="sendMessage(user.id, user.name)" class="action-icon-btn" title="Message">
                    <Icon icon="mdi:message-outline" />
                  </button>
                  <button @click="viewProfile(user.id)" class="action-icon-btn" title="View Profile">
                    <Icon icon="mdi:account-outline" />
                  </button>
                </div>
                <button @click="sendFriendRequest(user.id)" class="btn-add-full">
                  <Icon icon="mdi:account-plus" />
                  <span>Add Friend</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="searchQuery.length >= 2 && !isSearching" class="no-results">
            <Icon icon="mdi:account-search" class="no-results-icon" />
            <p>No users found matching "{{ searchQuery }}"</p>
          </div>

          <div v-else-if="searchQuery.length === 0" class="search-placeholder">
            <Icon icon="mdi:account-search" class="placeholder-icon" />
            <p>Start typing to search for friends</p>
          </div>
        </div>
      </aside>

      <main class="main-content">
        
        <section v-if="friendRequests.length > 0" class="content-section">
          <div class="section-header">
            <div class="header-info">
              <Icon icon="mdi:bell-ring" class="section-icon" />
              <div>
                <h2>Friend Requests</h2>
                <span class="section-meta">{{ friendRequests.length }} pending</span>
              </div>
            </div>
            <div class="request-badge">{{ friendRequests.length }}</div>
          </div>
          <div class="requests-grid">
            <div v-for="request in friendRequests" :key="request.sender_id" class="request-card" @click="viewProfile(request.sender_id)" style="cursor: pointer;">
              <div class="request-avatar">
                <div class="avatar-placeholder">
                  <img v-if="request.avatar" :src="`http://localhost:3000${request.avatar}`" alt="Avatar" class="avatar-img" />
                  <span v-else>{{ request.sender_name.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <div class="request-content">
                <h3 class="request-name">{{ request.sender_name }}</h3>
                <p class="request-meta">wants to be your friend</p>
              </div>
              <div class="request-actions">
                <button @click="acceptRequest(request.request_id)" class="btn-accept">
                  <Icon icon="mdi:check" />
                  <span>Accept</span>
                </button>
                <button @click="declineRequest(request.request_id)" class="btn-decline">
                  <Icon icon="mdi:close" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="sentRequests.length > 0" class="content-section">
          <div class="section-header">
            <div class="header-info">
              <Icon icon="mdi:account-arrow-right" class="section-icon" />
              <div>
                <h2>Sent Requests</h2>
                <span class="section-meta">{{ sentRequests.length }} waiting for response</span>
              </div>
            </div>
          </div>

          <div class="requests-grid">
            <div v-for="request in sentRequests" :key="request.requested_to" class="request-card" @click="viewProfile(request.requested_to)" style="cursor: pointer;">
              <div class="request-avatar">
                <div class="avatar-placeholder" style="background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%);">
                  {{ request.receiver_name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="request-content">
                <h3 class="request-name">{{ request.receiver_name }}</h3>
                <p class="request-meta">Request sent</p>
              </div>
              <div class="request-actions">
                <button @click="cancelSentRequest(request.request_id)" class="btn-decline">
                  <Icon icon="mdi:close" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="content-section">
          <div class="section-header">
            <div class="header-info">
              <Icon icon="mdi:account-heart" class="section-icon" />
              <div>
                <h2>My Friends</h2>
                <span class="section-meta">{{ friends.length }} friends connected</span>
              </div>
            </div>
          </div>

          <div v-if="isLoadingFriends" class="loading-state">
            <Icon icon="mdi:loading" class="loading-icon" />
            <p>Loading your friends...</p>
          </div>

          <div v-else-if="friendsError" class="error-state">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            <p>{{ friendsError }}</p>
            <button @click="fetchFriends" class="btn-retry">Try Again</button>
          </div>

          <div v-else-if="friends.length === 0" class="empty-state">
            <Icon icon="mdi:account-group-outline" class="empty-icon" />
            <h3>No friends yet</h3>
            <p>Start connecting with people to build your network!</p>
          </div>

          <div v-else class="friends-grid">
            <div v-for="friend in friends" :key="friend.id" class="friend-card">
              <div class="friend-card-main">
                <div class="friend-avatar">
                  <div class="avatar-placeholder">
                    <img v-if="friend.avatar" :src="`http://localhost:3000${friend.avatar}`" alt="Avatar" class="avatar-img" />
                    <span v-else>{{ friend.name.charAt(0).toUpperCase() }}</span>
                  </div>
                </div>
                <div class="friend-info">
                  <h3 class="friend-name">{{ friend.name }}</h3>
                </div>
              </div>
              <div class="friend-actions">
                <button @click="sendMessage(friend.id, friend.name)" class="btn-message">
                  <Icon icon="mdi:message" />
                  <span>Message</span>
                </button>
                <button @click="viewProfile(friend.id)" class="btn-profile">
                  <Icon icon="mdi:account" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="content-section">
          <div class="section-header">
            <div class="header-info">
              <Icon icon="mdi:lightbulb-on" class="section-icon" />
              <div>
                <h2>People You May Know</h2>
                <span class="section-meta">Suggested connections</span>
              </div>
            </div>
          </div>

          <div v-if="isLoadingSuggestions" class="loading-state">
            <Icon icon="mdi:loading" class="loading-icon" />
            <p>Finding suggestions...</p>
          </div>

          <div v-else-if="suggestionsError" class="error-state">
            <Icon icon="mdi:alert-circle" class="error-icon" />
            <p>{{ suggestionsError }}</p>
            <button @click="fetchSuggestions" class="btn-retry">Try Again</button>
          </div>

          <div v-else-if="suggestions.length === 0" class="empty-state">
            <Icon icon="mdi:account-multiple-plus" class="empty-icon" />
            <h3>No suggestions available</h3>
            <p>Check back later for new connection suggestions!</p>
          </div>

          <div v-else class="suggestions-grid">
            <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-card">
              <div class="suggestion-avatar">
                <div class="avatar-placeholder">
                  <img v-if="suggestion.avatar" :src="`http://localhost:3000${suggestion.avatar}`" alt="Avatar" class="avatar-img" />
                  <span v-else>{{ suggestion.name.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <div class="suggestion-info">
                <h3 class="suggestion-name">{{ suggestion.name }}</h3>
                <p class="suggestion-meta">Suggested for you</p>
              </div>
              <div class="suggestion-actions">
                <button @click="sendMessage(suggestion.id, suggestion.name)" class="btn-message-small">
                  <Icon icon="mdi:message" />
                  <span>Message</span>
                </button>
                <button @click="viewProfile(suggestion.id)" class="btn-view-profile">
                  <Icon icon="mdi:account" />
                  <span>View</span>
                </button>
                <button @click="sendFriendRequest(suggestion.id)" class="btn-add-friend">
                  <Icon icon="mdi:account-plus" />
                  <span>Add Friend</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
<style scoped>
/* ===== CSS Variables ===== */
.friends-page {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #a5b4fc;
  --secondary-color: #f8fafc;
  --accent-color: #06b6d4;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-accent: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-pending: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%);
  --border-radius: 12px;
  --border-radius-lg: 16px;
}

/* ===== Page Layout ===== */
.friends-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0;
}

.page-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.friends-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: start;
}

/* ===== Search Sidebar ===== */
.search-sidebar {
  position: sticky;
  top: 2rem;
}

.search-card {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.search-input-wrapper {
  position: relative;
  margin: 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: var(--text-muted);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-spinner {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner-icon {
  font-size: 1.25rem;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== New Search Results Layout ===== */
.search-results-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  max-height: 450px;
  overflow-y: auto;
  background: var(--secondary-color);
  border-top: 1px solid var(--border-color);
}

.search-result-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1rem;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.search-result-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.search-card-top {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;
}

.search-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-top: 1px dashed var(--border-color);
  padding-top: 0.75rem;
}

.secondary-actions {
  display: flex;
  gap: 0.4rem;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--secondary-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}

.action-icon-btn:hover {
  background: white;
  color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.btn-add-full {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-full:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.search-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-message-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem;
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  color: var(--primary-color);
}

.btn-message-small:hover {
  background: var(--primary-color);
  color: white;
}

.btn-profile-small {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  color: var(--text-secondary);
}

.btn-profile-small:hover {
  background: var(--text-secondary);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.user-email {
  color: var(--text-secondary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-add:active {
  transform: translateY(0);
}

.no-results,
.search-placeholder {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-muted);
}

.no-results-icon,
.placeholder-icon {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-results p,
.search-placeholder p {
  margin: 0;
  font-size: 0.9rem;
}

/* ===== Main Content ===== */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-section {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.section-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-meta {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.request-badge {
  background: var(--gradient-accent);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

/* ===== Friend Requests ===== */
.requests-grid {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

.request-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}

.request-avatar {
  flex-shrink: 0;
}

.request-content {
  flex: 1;
  min-width: 0;
}

.request-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.request-meta {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-accept,
.btn-decline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-accept {
  background: var(--success-color);
  color: white;
}

.btn-accept:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-decline {
  background: var(--danger-color);
  color: white;
}

.btn-decline:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* ===== Friends Grid ===== */
.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  padding: 1.75rem;
}

.friend-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}

.friend-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.friend-card-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-status {
  margin: 0;
  color: var(--success-color);
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: var(--success-color);
  border-radius: 50%;
  display: inline-block;
}

.friend-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.btn-message, .btn-profile {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.btn-message {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn-message:hover {
  background: var(--primary-dark);
}

.btn-profile:hover {
  background: #f1f5f9;
  color: var(--text-primary);
}
/* ===== Suggestions ===== */
.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.suggestion-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}

.suggestion-avatar {
  margin-bottom: 1rem;
}

.suggestion-info {
  margin-bottom: 1.25rem;
  flex: 1;
}

.suggestion-actions {
  width: 100%;
}

.suggestion-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.suggestion-meta {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.btn-add-friend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-add-friend:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-add-friend:active {
  transform: translateY(0);
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.btn-view-profile {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  color: var(--text-secondary);
}

.btn-view-profile:hover {
  background: var(--text-secondary);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* ===== States ===== */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-secondary);
}

.loading-icon {
  font-size: 2rem;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-state {
  color: var(--danger-color);
}

.error-icon {
  font-size: 2rem;
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* ===== Error Messages ===== */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #fef2f2;
  color: var(--danger-color);
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  margin: 0 1.5rem 1.5rem 1.5rem;
  font-size: 0.85rem;
}

.error-message .error-icon {
  font-size: 1rem;
  margin: 0;
}

/* ===== Avatar Placeholders ===== */
.avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
}

/* ===== Sent Requests Specifics ===== */
.sent-requests-avatar {
    background: var(--gradient-pending) !important; /* Forces the inline style we set in the template to be consistent if needed */
}

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .friends-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .search-sidebar {
    position: static;
  }

  .search-card {
    order: -1;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 0;
    margin-bottom: 1.5rem;
  }

  .header-content {
    padding: 0 1rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .friends-container {
    padding: 0 1rem;
    gap: 1rem;
  }

  .section-header {
    padding: 1rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }

  .friends-grid,
  .suggestions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .requests-grid {
    padding: 1rem;
  }

  .friend-card,
  .request-card {
    padding: 1rem;
  }

  .suggestion-card {
    padding: 1.25rem;
  }

  .avatar-placeholder {
    width: 45px;
    height: 45px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .friends-container {
    padding: 0 0.5rem;
  }

  .header-content {
    padding: 0 0.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .request-badge {
    align-self: flex-end;
  }

  .request-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-accept,
  .btn-decline {
    flex: 1;
    justify-content: center;
  }

  .friend-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-message,
  .btn-profile {
    flex: 1;
    justify-content: center;
  }
}
</style>