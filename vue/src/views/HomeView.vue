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
      // Add frontend tracking state
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
  
  // Prevent duplicate requests while one is pending
  if (!post || post.isLiking) return;

  // 1. Optimistic Update (update UI instantly)
  const isUnliking = post.hasLiked;
  post.hasLiked = !isUnliking;
  post.likes += isUnliking ? -1 : 1;
  post.isLiking = true;

  try {
    // 2. Send request to backend
    // (Adjust the URL endpoint to match your Express router)
    if (isUnliking) {
       await apiClient.delete(`/posts/${postId}/like`);
    } else {
       await apiClient.post(`/posts/${postId}/like`);
    }
  } catch (error) {
    console.error('Error liking post:', error);
    
    // 3. Revert the UI if the API call fails
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
      
      <div v-if="isLoading" class="status-message">
        <Icon icon="mdi:loading" class="spin-icon" />
        <p>Loading community posts...</p>
      </div>

      <div v-else-if="errorMessage" class="status-message error">
        <Icon icon="mdi:alert-circle-outline" class="error-icon" />
        <p>{{ errorMessage }}</p>
        <button @click="fetchPosts" class="retry-btn">Retry</button>
      </div>

      <article v-else v-for="post in feedPosts" :key="post.id" class="post-card">
        
        <div class="post-header">
          <div class="author-avatar">
            {{ post.author.charAt(0) }}
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
          <!-- Updated Like Button -->
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
/* Active Like Button Styles */
.action-btn.is-liked {
  color: #ef4444; /* Red color for liked state */
  opacity: 1;
}

.action-btn.is-liked .action-icon {
  color: #ef4444;
}
.feed-container {
  /* Exact Color Palette */
  --bg-color: #131313;
  --text-color: #ddedf2;
  --primary-color: #8bcce2;
  --secondary-color: #1c728e;
  --accent-color: #4cbfe4;
  
  /* Layout Colors */
  --card-bg: rgba(28, 114, 142, 0.08);
  --border-color: rgba(28, 114, 142, 0.4);
  --hover-bg: rgba(76, 191, 228, 0.12);

  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 40px 24px;
  box-sizing: border-box;
}

h1, p { margin: 0; }

/* Header */
.feed-header {
  max-width: 680px;
  margin: 0 auto 32px auto;
}

.feed-header h1 {
  font-size: 28px;
  color: var(--primary-color);
  margin-bottom: 8px;
  font-weight: 700;
}

.feed-header p {
  color: var(--text-color);
  opacity: 0.8;
}

/* Status Messages (Loading/Error) */
.status-message {
  text-align: center;
  padding: 40px;
  background-color: var(--card-bg);
  border: 1px dashed var(--border-color);
  border-radius: 16px;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spin-icon {
  font-size: 32px;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.error-icon {
  font-size: 32px;
  color: #ef4444; /* Standard error red */
}

.retry-btn {
  margin-top: 12px;
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background-color: var(--primary-color);
  color: var(--bg-color);
}

/* Feed List & Cards */
.feed-list {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.post-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

/* Post Header */
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--secondary-color);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.author-meta {
  display: flex;
  flex-direction: column;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--primary-color);
}

.author-role {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: rgba(28, 114, 142, 0.3);
  color: var(--accent-color);
  border: 1px solid var(--secondary-color);
}

.post-time {
  font-size: 13px;
  color: var(--text-color);
  opacity: 0.6;
  margin-top: 2px;
}

/* Post Caption */
.post-caption {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 16px;
  color: var(--text-color);
  opacity: 0.9;
  white-space: pre-wrap;
}

/* Post Media Grid */
.post-images {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.post-images[data-count="1"] { grid-template-columns: 1fr; }
.post-images[data-count="2"] { grid-template-columns: 1fr 1fr; }
.post-images[data-count="3"], 
.post-images[data-count="4"] { grid-template-columns: 1fr 1fr; }

.post-image {
  width: 100%;
  height: 280px;
  object-fit: cover;
  background-color: var(--secondary-color);
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
  color: var(--text-color);
  opacity: 0.7;
  font-size: 14px;
}

/* Post Actions */
.post-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-color);
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--hover-bg);
  color: var(--accent-color);
  opacity: 1;
}

.action-icon {
  width: 20px;
  height: 20px;
}

.share-btn {
  margin-left: auto;
}
</style>