<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient } from '../api/api'; 

const feedPosts = ref<any[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref('');
const currentPage = ref(1);
const hasMorePosts = ref(true);

// State for the composition area
const newPostContent = ref('');
const isPosting = ref(false);

// Helper function to format the created_at date into a "Time Ago" string
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return 'Just now';
};

// Fetch posts using Axios (Now supports Pagination)
const fetchPosts = async (isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
    currentPage.value = 1;
    feedPosts.value = [];
  }
  
  try {
    // Assuming your new backend route is /feed and accepts a page query
    const response = await apiClient.get(`/posts/?page=${currentPage.value}`);
    const data = response.data;
    
    // If fewer than 10 posts return, we've hit the end of the database
    if (data.length < 10) {
      hasMorePosts.value = false;
    }
    
    const formattedPosts = data.map((post: any) => ({
      id: post.post_id,                 // Mapped from new SQL
      author: post.author_name,         // Mapped from new SQL
      role: post.role || 'Member',      // Fallback in case role isn't selected in SQL
      caption: post.caption,
      images: post.images || [],        // Assumes backend splits the string into an array
      timeAgo: formatTimeAgo(post.created_at), // Process the timestamp
      likes: post.likes || 0,
      comments: post.comment_count || 0, // Mapped from new SQL
      hasLiked: false, 
      isLiking: false 
    }));

    if (isLoadMore) {
      feedPosts.value = [...feedPosts.value, ...formattedPosts];
    } else {
      feedPosts.value = formattedPosts;
    }

  } catch (error: any) {
    console.error('Error fetching posts:', error);
    errorMessage.value = error.response?.data?.message || error.message || 'Failed to load posts';
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

const loadNextPage = () => {
  if (!isLoadingMore.value && hasMorePosts.value) {
    currentPage.value++;
    fetchPosts(true);
  }
};

// Handle submitting a new post using Axios
const submitPost = async () => {
  if (!newPostContent.value.trim()) return;
  isPosting.value = true;
  
  try {
    await apiClient.post('/posts/', {
      caption: newPostContent.value,
      images: [] 
    });

    newPostContent.value = '';
    // Refresh feed to show the new post at the top
    await fetchPosts(false);

  } catch (error) {
    console.error('Error creating post:', error);
    alert('Could not post your message. Please try again.');
  } finally {
    isPosting.value = false;
  }
};

// Updated Like function with API integration and Optimistic UI
const likePost = async (postId: number) => {
  const post = feedPosts.value.find((p: any) => p.id === postId);
  
  if (!post || post.isLiking) return;

  const isUnliking = post.hasLiked;
  post.hasLiked = !isUnliking;
  post.likes += isUnliking ? -1 : 1;
  post.isLiking = true;

  try {
    if (isUnliking) {
       await apiClient.delete(`/posts/${postId}/like`);
    } else {
       await apiClient.post(`/posts/${postId}/like`);
    }
  } catch (error) {
    console.error('Error liking post:', error);
    post.hasLiked = isUnliking;
    post.likes += isUnliking ? 1 : -1;
    alert('Failed to update like status.');
  } finally {
    post.isLiking = false;
  }
};

onMounted(() => {
  fetchPosts();
});
</script>

<template>
  <div class="feed-container">
    
    <header class="feed-header">
      <h1>Community Feed</h1>
      <p>See what your clubs are talking about.</p>
    </header>

    <div class="feed-list">
      
      <div v-if="isLoading" class="status-message loading-state">
        <Icon icon="mdi:loading" class="spin-icon" />
        <p>Loading community posts...</p>
      </div>

      <div v-else-if="errorMessage" class="status-message error-state">
        <Icon icon="mdi:alert-circle-outline" class="error-icon" />
        <p>{{ errorMessage }}</p>
        <button @click="() => fetchPosts(false)" class="btn-primary">Retry</button>
      </div>

      <template v-else>
        <article v-for="post in feedPosts" :key="post.id" class="post-card">
          
          <div class="post-header">
            <div class="author-avatar">
              {{ post.author.charAt(0).toUpperCase() }}
            </div>
            <div class="author-meta">
              <div class="author-name-row">
                <span class="author-name">{{ post.author }}</span>
                <span class="author-role">{{ post.role }}</span>
              </div>
              <span class="post-time">{{ post.timeAgo }}</span>
            </div>
          </div>

          <p class="post-caption">{{ post.caption }}</p>
          
          <div v-if="post.images.length > 0" class="post-images" :data-count="post.images.length">
            <img 
              v-for="(imgUrl, index) in post.images" 
              :key="index" 
              :src="imgUrl" 
              alt="Post attachment" 
              class="post-image"
              @error="(e) => (e.target as HTMLElement).classList.add('image-fallback')"
            />
          </div>

          <div class="post-actions">
            <button 
              class="action-btn"
              :class="{ 'is-liked': post.hasLiked }"
              @click="likePost(post.id)"
              :disabled="post.isLiking"
            >
              <Icon 
                :icon="post.hasLiked ? 'mdi:heart' : 'mdi:heart-outline'" 
                class="action-icon" 
              />
              <span>{{ post.likes }}</span>
            </button>
            
            <button class="action-btn">
              <Icon icon="mdi:comment-outline" class="action-icon" />
              <span>{{ post.comments }}</span>
            </button>
            
            <button class="action-btn share-btn">
              <Icon icon="mdi:share-variant-outline" class="action-icon" />
            </button>
          </div>
        </article>

        <div class="load-more-container" v-if="feedPosts.length > 0">
          <button 
            v-if="hasMorePosts" 
            class="btn-secondary" 
            @click="loadNextPage" 
            :disabled="isLoadingMore"
          >
            <Icon v-if="isLoadingMore" icon="mdi:loading" class="spin-icon-small" />
            <span>{{ isLoadingMore ? 'Loading...' : 'Load More Posts' }}</span>
          </button>
          <p v-else class="end-of-feed">You've reached the end of the feed.</p>
        </div>
      </template>
      
    </div>
  </div>
</template>

<style scoped>
/* Same styles as before, just adding the new load-more classes below */

/* Base Layout & Typography */
.feed-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 2rem;
  box-sizing: border-box;
}

h1, p { margin: 0; }

.feed-header {
  max-width: 680px;
  margin: 0 auto 1.5rem auto;
}

.feed-header h1 {
  font-size: 2rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  margin-bottom: 0.5rem;
}

.feed-header p {
  color: #475569;
  font-size: 1rem;
}

.status-message {
  text-align: center;
  padding: 2.5rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spin-icon {
  font-size: 2.5rem;
  color: #6366f1;
  animation: spin 1s linear infinite;
}

.spin-icon-small {
  font-size: 1.25rem;
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.error-icon {
  font-size: 3rem;
  color: #ef4444; 
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  border: none;
  background: #6366f1;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.feed-list {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  box-shadow: 0 20px 32px rgba(15, 23, 42, 0.06);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.author-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #0f172a;
}

.author-role {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #e0e7ff;
  color: #4f46e5;
  font-weight: 600;
}

.post-time {
  font-size: 0.85rem;
  color: #94a3b8;
}

.post-caption {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
  color: #334155;
  white-space: pre-wrap;
}

.post-images {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.post-images[data-count="1"] { grid-template-columns: 1fr; }
.post-images[data-count="2"] { grid-template-columns: 1fr 1fr; }
.post-images[data-count="3"], 
.post-images[data-count="4"] { grid-template-columns: 1fr 1fr; }

.post-image {
  width: 100%;
  height: 280px;
  object-fit: cover;
  background-color: #f1f5f9;
}

.image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-fallback::after {
  content: 'Image not found';
  position: absolute;
  color: #94a3b8;
  font-size: 0.9rem;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}

.action-btn {
  background: transparent;
  border: none;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 0.85rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f1f5f9;
  color: #6366f1;
}

.action-icon {
  width: 22px;
  height: 22px;
}

.action-btn.is-liked {
  color: #ef4444; 
}

.action-btn.is-liked .action-icon {
  color: #ef4444;
}

.action-btn.is-liked:hover {
  background-color: #fef2f2;
}

.share-btn {
  margin-left: auto;
}

/* NEW: Load More Section Styles */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0 2rem 0;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.end-of-feed {
  color: #94a3b8;
  font-size: 0.95rem;
}

@media (max-width: 720px) {
  .feed-container {
    padding: 1.5rem 1rem;
  }
  
  .post-card {
    padding: 1.25rem;
  }
}
</style>