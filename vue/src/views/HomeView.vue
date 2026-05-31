<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient } from '../api/api'; 
import CreatePostForm from '../components/CreatePostForm.vue';
import ListPost from '../components/ListPost.vue'; 

const feedPosts = ref<any[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref('');
const currentPage = ref(1);
const hasMorePosts = ref(true);

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

const fetchPosts = async (isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
    currentPage.value = 1;
    feedPosts.value = [];
  }
  
  try {
    const response = await apiClient.get(`/posts/?page=${currentPage.value}`);
    const data = response.data;
    
    if (data.length < 10) {
      hasMorePosts.value = false;
    }
    
    const formattedPosts = data.map((post: any) => ({
      id: post.post_id,
      author: post.author_name,
      role: post.role || 'Member',
      caption: post.caption,
      images: post.images || [],
      timeAgo: formatTimeAgo(post.created_at),
      likes: post.likes || 0,
      comments: post.comment_count || 0,
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
// Parent component script
const handleReport = (postId: number) => {
  if (confirm("Are you sure you want to report this post to the admins?")) {
    // Call your API: apiClient.post(`/posts/${postId}/report`)
    console.log(`Reporting post ${postId}`);
  }
}
onMounted(() => {
  fetchPosts();
});
</script>

<template>
  <div class="feed-container">
    
    <header class="feed-header">
      <h1>Community Feed</h1>
    </header>

    <div class="feed-list">
      
      <CreatePostForm @post-created="() => fetchPosts(false)" />
      
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

        <ListPost :posts="feedPosts" @like="likePost" @report="handleReport"/>

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
/* Only keeping the classes needed for the main layout and loading states */
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
}
</style>