<template>
  <main class="profile-container">
    
    <div v-if="isLoading" class="state-wrapper loading-state">
      <Icon icon="eos-icons:loading" class="spin-icon" />
      <p>Loading profile...</p>
    </div>

    <div v-else-if="error" class="state-wrapper error-state">
      <Icon icon="mdi:alert-circle-outline" class="error-icon" />
      <p>{{ error }}</p>
      <button @click="fetchProfile" class="button-primary">Try Again</button>
    </div>

    <div v-else-if="users" class="profile-content">
      
      <header class="profile-header-card">
        <div class="header-main">
          <div class="avatar">
            {{ users.name.charAt(0).toUpperCase() }}
          </div>
          <div class="header-info">
            <h1>{{ users.name }}</h1>
            <p class="role-badge">{{ users.role }} • {{ users.department }}</p>
            <a :href="`mailto:${users.email}`" class="email-link">
              <Icon icon="mdi:email-outline" /> {{ users.email }}
            </a>
          </div>
        </div>

        <div class="header-actions" v-if="!route.params.id">
          <button @click="goToEditProfile" class="button-secondary">
            <Icon icon="mdi:pencil-outline" class="btn-icon" />
            <span>Edit Profile</span>
          </button>
        </div>
      </header>

      <div class="profile-body">
        
        <aside class="left-column">
          <div class="details-section card-box">
            <h2>About Me</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="label">Nationality</span>
                <span v-if="users.nationality" class="value"> {{ users.nationality }}</span>
                <Icon v-else icon="mdi:ghost-outline" class="value"/>
              </div>
              <div class="detail-item">
                <span class="label">Language</span>
                <span v-if="users.language" class="value"> {{ users.language }}</span>
                <Icon v-else icon="mdi:ghost-outline" class="value"/>
              </div>
              <div class="detail-item">
                <span class="label">Birth Date</span>
                <span v-if="users.birth_date" class="value"> {{ formatDate(users.birth_date) }}</span>
                <Icon v-else icon="mdi:ghost-outline" class="value"/>
              </div>
              <div class="detail-item">
                <span class="label">Contact</span>
                <span v-if="users.contact_info" class="value"> {{ users.contact_info }}</span>
                <Icon v-else icon="mdi:ghost-outline" class="value"/>
              </div>
            </div>
          </div>

          <div class="clubs-section card-box">
            <h2>Joined Clubs</h2>
            <ul v-if="users.clubs && users.clubs.length > 0" class="clubs-list">
              <li v-for="club in users.clubs" :key="club.id">
                <RouterLink :to="{ name: 'club-detail', params: { id: club.id } }" class="club-item">
                  <div class="club-icon">
                    <Icon icon="mdi:account-group-outline" />
                  </div>
                  <span class="club-name">{{ club.title }}</span>
                </RouterLink>
              </li>
            </ul>
            <div v-else class="empty-state-small">
              <p>Not a member of any clubs yet.</p>
            </div>
          </div>

          <div class="friends-section card-box">
            <div class="friends-header">
              <h2>Friends</h2>
              <RouterLink v-if="friends.requestCount > 0" class="request-link" :to="{ name: 'friends' }">
                {{ friends.requestCount }} requests
              </RouterLink>
            </div>
            
            <div v-if="isLoadingFriends" class="friends-status">
              <Icon icon="eos-icons:loading" width="24" height="24" class="spin-icon" />
            </div>
            
            <div v-else-if="friendsError" class="friends-status error-text">
              {{ friendsError }}
            </div>

            <ul v-else-if="friends?.friends?.length > 0" class="friends-list">
              <li v-for="friend in friends.friends" :key="friend.id">
                <RouterLink 
                  :to="{ name: 'profile', params: { id: friend.id } }" 
                  class="friend-item"
                >
                  <div class="friend-avatar">
                    {{ friend.name.charAt(0).toUpperCase() }}
                  </div>
                  <span class="friend-name">{{ friend.name }}</span>
                </RouterLink>
              </li>
            </ul>
            <div v-else class="friends-status empty-state-small">
              <p>No friends added yet.</p>
            </div>
          </div>
        </aside>

        <div class="right-column">
            <section class="posts-section card-box">
                <div class="activity-header">
                  <h2>{{ route.params.id ? `${users.name.split(' ')[0]}'s Activity` : 'My Activity' }}</h2>
                  
                  <div class="tab-controls">
                    <button 
                      :class="{ active: activeTab === 'feed' }" 
                      @click="activeTab = 'feed'">
                      Feed Posts
                    </button>
                    <button 
                      :class="{ active: activeTab === 'forum' }" 
                      @click="activeTab = 'forum'">
                      Forum Posts
                    </button>
                  </div>
                </div>
                
                <div v-if="activeTab === 'feed'">
                  <CreatePostForm v-if="!route.params.id" @post-created="fetchProfile" />

                  <div v-if="formattedProfilePosts.length > 0">
                    <ListPost :posts="formattedProfilePosts" @like="handleLike" />
                  </div>
                  <div v-else class="empty-posts">
                      <Icon icon="mdi:text-box-remove-outline" class="empty-icon" />
                      <p>No feed posts yet.</p>
                  </div>
                </div>

                <div v-else-if="activeTab === 'forum'" class="forum-tab-content">
                  <div v-if="users.forum_posts && users.forum_posts.length > 0" class="forum-list">
                    
                    <RouterLink 
                      v-for="forumPost in users.forum_posts" 
                      :key="forumPost.id"
                      :to="{ name: 'thread', params: { id: forumPost.forum_id } }"
                      class="forum-post-card"
                    >
                      <div class="forum-post-meta">
                        <Icon icon="mdi:forum-outline" class="forum-icon" />
                        <span>Posted in <strong>{{ forumPost.thread_title }}</strong></span>
                      </div>
                      <p class="forum-post-content">"{{ forumPost.content }}"</p>
                      <span class="forum-post-time">{{ formatDate(forumPost.created_at) }}</span>
                    </RouterLink>

                  </div>
                  <div v-else class="empty-posts">
                      <Icon icon="mdi:forum-remove-outline" class="empty-icon" />
                      <p>No forum activity yet.</p>
                  </div>
                </div>

            </section>
        </div>

      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { Icon } from '@iconify/vue';
import { apiClient } from '@/api/api';
import CreatePostForm from '../components/CreatePostForm.vue';
import ListPost from '../components/ListPost.vue'; 
import { useAuth } from '@/composables/useAuth'; 

// --- EXPANDED INTERFACES ---
interface Post {
  post_id: number;
  location: string | null;
  caption: string;
  created_at?: string;
  likes?: number;
  images: string[],
  comment_count?: number;
}

interface ClubSummary {
  id: number;
  title: string;
}

interface ForumPostSummary {
  id: number;
  forum_id: number;
  thread_title: string;
  content: string;
  created_at: string;
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
  clubs?: ClubSummary[]; // NEW
  forum_posts?: ForumPostSummary[]; // NEW
}

interface FriendData {
  friends: {
    id: number,
    name: string
  }[];
  requestCount: number;
}

const route = useRoute();
const router = useRouter(); 
const { getUserId } = useAuth(); 

const users = ref<User | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const friends = ref<FriendData>({
  friends: [],
  requestCount: 0
});
const isLoadingFriends = ref(true);
const friendsError = ref<string | null>(null);

// NEW: Active Tab State
const activeTab = ref<'feed' | 'forum'>('feed');

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  return dateString.split('T')[0]; 
};

const goToEditProfile = () => {
  router.push({ name: 'profile-edit' }); 
};

const fetchProfile = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const currentId = route.params.id; 
    const endpoint = currentId ? `/profile/${currentId}` : '/profile';
    
    const response = await apiClient.get<User>(endpoint);
    users.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while loading the profile.';
  } finally {
    isLoading.value = false;
  }
};

const fetchFriends = async () => {
  isLoadingFriends.value = true;
  friendsError.value = null;
  try {
    const currentId = route.params.id;
    const endpoint = currentId ? `/profile/${currentId}/friends` : `/profile/friends`;
    
    const response = await apiClient.get<FriendData>(endpoint);
    friends.value = response.data;
  } catch (err) {
    console.error(err);
    friendsError.value = 'Failed to load friends list.';
  } finally {
    isLoadingFriends.value = false;
  }
};

const formattedProfilePosts = computed(() => {
    if (!users.value || !users.value.posts) return [];
    
    return users.value.posts.map(post => ({
        id: post.post_id,
        author: users.value!.name,
        role: users.value!.role || 'Member',
        caption: post.caption,
        images: post.images || [],
        timeAgo: formatDate(post.created_at) || 'Recently',
        likes: post.likes || 0,
        comments: post.comment_count || 0,
        hasLiked: false,
        isLiking: false
    }));
});

const handleLike = async (postId: number) => {
  try {
    await apiClient.post(`/posts/${postId}/like`);
    
    const targetPost = users.value?.posts.find(p => p.post_id === postId);
    if (targetPost) {
      targetPost.likes = (targetPost.likes || 0) + 1;
    }
  } catch (error) {
    console.error("Failed to like post", error);
  }
};

const handleRouteChange = () => {
  const currentUserId = getUserId();
  const routeIdParam = route.params.id;

  if (routeIdParam && parseInt(routeIdParam as string, 10) === currentUserId) {
    router.replace('/profile'); 
    return; 
  }

  fetchProfile();
  fetchFriends();
};

onMounted(() => {
  handleRouteChange();
});

watch(
  () => route.params.id, 
  () => {
    handleRouteChange();
  }
);
</script>

<style scoped>
/* =========================================
   1. Base Variables & Container (Kept exactly the same)
========================================= */
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 2rem;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
}

.card-box, .profile-header-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

h2 {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  color: #0f172a;
  font-weight: 700;
}

/* =========================================
   NEW: Clubs Section Styles
========================================= */
.clubs-section {
  padding: 1.5rem;
}

.clubs-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.club-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  transition: background-color 0.2s ease, border-color 0.2s;
  border: 1px solid transparent;
  text-decoration: none;
  color: inherit;
}

.club-item:hover {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.club-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fdf2f8; /* Soft pink bg */
  color: #ec4899; /* Pink icon */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.club-name {
  color: #0f172a;
  font-weight: 600;
  font-size: 0.95rem;
}

/* =========================================
   NEW: Post Tabs & Forum Activity Styles
========================================= */
.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.activity-header h2 {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.tab-controls {
  display: flex;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 12px;
}

.tab-controls button {
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.tab-controls button.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.forum-tab-content {
  padding: 1rem 0;
}

.forum-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.forum-post-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.forum-post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  border-color: #cbd5e1;
}

.forum-post-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;
}

.forum-icon {
  color: #6366f1;
  font-size: 1.1rem;
}

.forum-post-content {
  color: #0f172a;
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
}

.forum-post-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* =========================================
   (Keep the rest of your existing CSS below)
========================================= */

.state-wrapper {
  padding: 3rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  text-align: center;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  font-size: 1.05rem;
}

.spin-icon {
  font-size: 2.5rem;
  color: #6366f1;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
}

.button-primary,
.button-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.button-primary {
  border: none;
  background: #6366f1;
  color: white;
  margin-top: 0.5rem;
}

.button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.button-secondary {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.95rem;
}

.button-secondary:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.profile-header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2.5rem;
  margin-bottom: 2rem;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  flex-shrink: 0;
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.role-badge {
  display: inline-block;
  background-color: #e0e7ff;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4f46e5;
  margin: 0 0 0.75rem 0;
}

.email-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.email-link:hover {
  color: #6366f1;
}

.profile-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 860px) {
  .profile-body { grid-template-columns: 320px 1fr; }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-self: start;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-section {
  padding: 1.5rem;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
}

.friends-section {
  padding: 1.5rem;
}

.friends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
}

.friends-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.request-link {
  font-size: 0.85rem;
  color: #6366f1;
  background: #e0e7ff;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.request-link:hover {
  background: #c7d2fe;
}

.friends-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  transition: background-color 0.2s ease;
  border: 1px solid transparent;
  text-decoration: none;
}

.friend-item:hover {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.friend-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.friend-name {
  color: #0f172a;
  font-weight: 600;
  font-size: 0.95rem;
}

.empty-state-small {
  color: #64748b;
  font-size: 0.95rem;
  text-align: center;
  padding: 1rem 0;
}

.posts-section {
  padding: 1.5rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.posts-section :deep(.create-post-card) {
  border: none;
  box-shadow: none;
  padding: 1.5rem 1rem;
  background: transparent;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 0;
}

.posts-section :deep(.posts-wrapper) {
  gap: 0; 
}

.posts-section :deep(.post-card) {
  border: none;
  box-shadow: none;
  padding: 1.5rem 1rem;
  background: transparent;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 0;
}

.posts-section :deep(.post-card:last-child) {
  border-bottom: none;
}

.empty-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #94a3b8;
  gap: 1rem;
}

.empty-posts .empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
}

@media (max-width: 720px) {
  .profile-container {
    padding: 1rem;
  }
  
  .profile-header-card {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
    gap: 1.5rem;
  }

  .header-main {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .email-link {
    justify-content: center;
  }

  .posts-section {
    padding: 1rem;
  }

  /* Stack tabs vertically on very small screens if needed */
  .activity-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>