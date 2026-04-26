<template>
  <main class="profile-container">
    
    <div v-if="isLoading" class="state-wrapper loading">
      <Icon icon="eos-icons:loading" width="48" height="48" class="spin-icon" />
      <p>Loading profile...</p>
    </div>

    <div v-else-if="error" class="state-wrapper error">
      <Icon icon="carbon:warning-filled" width="48" height="48" />
      <p>{{ error }}</p>
      <button @click="fetchProfile" class="retry-btn">Try Again</button>
    </div>

    <div v-else-if="users" class="profile-content">
      
      <header class="profile-header-card">
        <div class="avatar">
          {{ users.name.charAt(0).toUpperCase() }}
        </div>
        <div class="header-info">
          <h1>{{ users.name }}</h1>
          <p class="role-badge">{{ users.role }} • {{ users.department }}</p>
          <a :href="`mailto:${users.email}`" class="email-link">{{ users.email }}</a>
        </div>
      </header>

      <div class="profile-body">
        
        <aside class="left-column">
          <div class="details-section">
            <h2>About Me</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="label">Nationality</span>
                <span class="value"> {{ users.nationality }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Language</span>
                <span class="value"> {{ users.language }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Birth Date</span>
                <span class="value"> {{ formatDate(users.birth_date) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Contact</span>
                <span class="value"> {{ users.contact_info }}</span>
              </div>
            </div>
          </div>

          <div class="friends-section">
            <div class="friends-header">
              <h2>Friends</h2>
              <RouterLink v-if="friends.requestCount > 0" class="" :to="{ name: 'friends' }">{{ friends.requestCount }} requests</RouterLink>
              <!-- <p v-if="friends.requestCount > 0">{{ friends.requestCount }} requests</p> -->
            </div>
            
            <div v-if="isLoadingFriends" class="friends-status">
              <Icon icon="eos-icons:loading" width="24" height="24" class="spin-icon" />
            </div>
            
            <div v-else-if="friendsError" class="friends-status error-text">
              {{ friendsError }}
            </div>

            <ul v-else-if="friends?.friends?.length > 0" class="friends-list">
              <li v-for="friend in friends.friends" :key="friend.id" class="friend-item">
                <div class="friend-avatar">
                  {{ friend.name.charAt(0).toUpperCase() }}
                </div>
                <span class="friend-name">{{ friend.name }}</span>
              </li>
            </ul>

            <div v-else class="friends-status">
              <p>No friends added yet.</p>
            </div>
          </div>
        </aside>

        <section class="posts-section">
          <h2>My Posts</h2>
          
          <div v-if="users.posts && users.posts.length > 0" class="posts-list">
            <PostItem v-for="post in users.posts" :key="post.post_id">
              <template #icon>
                <Icon icon="ph:user-circle-bold" width="24" height="24" class="post-icon" />
              </template>
              
              <template #heading>
                <span class="post-caption">{{ post.caption }}</span>
              </template>
              
              <template #images>
                <div class="post-image-grid">
                  <img v-if="post.location" :src="'http://localhost:3000/img/' + post.location" alt="Post Image">
                  <img v-if="post.location" :src="'http://localhost:3000/img/' + post.location" alt="Post Image">
                  <img v-if="post.location" :src="'http://localhost:3000/img/' + post.location" alt="Post Image">
                </div>
              </template>
            </PostItem>
          </div>
          
          <div v-else class="empty-posts">
            <Icon icon="ph:images-square-light" width="48" height="48" />
            <p>No posts.</p>
          </div>
        </section>

      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient } from '@/api/api';
import PostItem from '../components/PostItem.vue';

interface Post {
  post_id: number;
  location: string | null;
  caption: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  birth_date: string;
  nationality: string;
  role: string;
  department: string;
  language: string;
  contact_info: string;
  posts: Post[];
}

// NEW: Friend Interface
interface FriendData {
  friends: {
    id: number,
    name: string
  }[];
  requestCount: number;
}

// User Profile State
const users = ref<User | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const friends = ref<FriendData>({
  friends: [],
  requestCount: 0
});
const isLoadingFriends = ref(true);
const friendsError = ref<string | null>(null);

// Date formatting helper
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  return dateString.split('T')[0]; 
};

// Fetch Main Profile
const fetchProfile = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get<User>('/profile');
    users.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while loading the profile.';
  } finally {
    isLoading.value = false;
  }
};

// NEW: Fetch Friends
const fetchFriends = async () => {
  isLoadingFriends.value = true;
  friendsError.value = null;
  try {
    const response = await apiClient.get<FriendData>('/friends');
    friends.value = response.data;
  } catch (err) {
    console.error(err);
    friendsError.value = 'Failed to load friends list.';
  } finally {
    isLoadingFriends.value = false;
  }
};

onMounted(() => {
  fetchProfile();
  fetchFriends(); // Call the new fetch function when the component mounts
});
</script>

<style scoped>
/* =========================================
   1. Base Variables & Container (Dark Mode)
========================================= */
.profile-container {
  --card-bg: #1f2937;
  --text-main: #f9fafb;
  --text-muted: #9ca3af;
  --border-color: #374151;
  --badge-bg: #374151;
  --badge-text: #d1d5db;
  --icon-color: #6b7280;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);

  /* max-width: 1000px;
  margin: 0 auto; */
  /* padding: 2rem 1rem; */
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--text-main);
  /* min-height: 100vh; */
}

/* =========================================
   2. Component Styles
========================================= */

.state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* min-height: 50vh; */
  text-align: center;
  color: var(--text-muted);
}
.spin-icon { color: #3b82f6; }
.state-wrapper .spin-icon { margin-bottom: 1rem; }
.error { color: #ef4444; }
.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* Top Header Card */
.profile-header-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  flex-shrink: 0;
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: var(--text-main);
}

.role-badge {
  display: inline-block;
  background-color: var(--badge-bg);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  color: var(--badge-text);
  margin: 0 0 0.5rem 0;
}

.detail-item {
  display: flex;
  justify-content: space-between; /* Pushes label left, value right */
  align-items: center; /* Keeps them vertically aligned */
}

.email-link {
  display: block;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.95rem;
}

/* Profile Body Layout */
.profile-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .profile-body { grid-template-columns: 1fr 2fr; }
}

/* Left Column Group */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-self: start;
}

/* Common Card Styles for Sections */
.details-section, .friends-section, .posts-section {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: var(--shadow);
}

h2 {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
  color: var(--text-main);
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}
.value {
  font-size: 1rem;
  color: var(--text-main);
  font-weight: 500;
}

/* === NEW: Friends List Styles === */
.friends-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.friends-header {
  display: flex;
  justify-content: space-between; /* Pushes the title left and requests right */
  align-items: center; /* Vertically aligns them in the middle */
  
  /* Moving the bottom border/margin from the h2 to the header container */
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}
/* Remove the default margins/borders from the h2 since the header wrapper now handles it */
.friends-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

/* Optional: Make the request text look a bit like a notification/link */
.friends-header p {
  margin: 0;
  font-size: 0.875rem;
  color: #3b82f6; /* A nice blue color */
  font-weight: 500;
  cursor: pointer;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.friend-item:hover {
  background-color: var(--border-color);
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4b5563; /* Subtle gray background for friend avatars */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.friend-name {
  color: var(--text-main);
  font-weight: 500;
}

.friends-status {
  padding: 1rem 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}
.error-text { color: #ef4444; }

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.post-caption {
  color: var(--text-main);
}
.post-icon {
  color: var(--icon-color);
}

.post-image-grid {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.post-image-grid img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.empty-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: var(--text-muted);
}
</style>