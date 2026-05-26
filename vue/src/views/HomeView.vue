<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient } from '../api/api'; 

const feedPosts = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// State for the composition area
const newPostContent = ref('');
const isPosting = ref(false);

// Fetch posts using Axios
const fetchPosts = async () => {
  try {
    const response = await apiClient.get('/posts/');
    const data = response.data;
    
    feedPosts.value = data.map((post: any) => ({
      id: post.id,
      author: post.author,
      role: post.role,
      caption: post.caption,
      images: post.images || [],
      timeAgo: 'Recently', 
      likes: post.likes || 0,
      comments: post.comments || 0,
      hasLiked: false, 
      isLiking: false 
    }));

  } catch (error: any) {
    console.error('Error fetching posts:', error);
    errorMessage.value = error.response?.data?.message || error.message || 'Failed to load posts';
  } finally {
    isLoading.value = false;
  }
};

// Handle submitting a new post using Axios
const submitPost = async () => {
  if (!newPostContent.value.trim()) return;
  isPosting.value = true;
  
  try {
    await apiClient.post('/posts/', {
      author: 'Current User',
      role: 'Member',
      caption: newPostContent.value,
      images: [] 
    });

    newPostContent.value = '';
    await fetchPosts();

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
        <button @click="fetchPosts" class="btn-primary">Retry</button>
      </div>

      <article v-else v-for="post in feedPosts" :key="post.id" class="post-card">
        
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
            @error="(e) => e.target.classList.add('image-fallback')"
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
      
    </div>
  </div>
</template>

<style scoped>
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

/* Header */
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

/* Status Messages (Loading/Error) */
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

@keyframes spin { 100% { transform: rotate(360deg); } }

.error-icon {
  font-size: 3rem;
  color: #ef4444; 
}

/* Primary Button (Matches btn-send from Messenger) */
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

/* Feed List & Cards */
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

/* Post Header */
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

/* Post Caption */
.post-caption {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
  color: #334155;
  white-space: pre-wrap;
}

/* Post Media Grid */
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

/* Post Actions */
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

/* Active Like Button Styles */
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

/* Mobile Responsiveness */
@media (max-width: 720px) {
  .feed-container {
    padding: 1.5rem 1rem;
  }
  
  .post-card {
    padding: 1.25rem;
  }
}
</style>