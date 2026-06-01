<script setup lang="ts">
import { Icon } from '@iconify/vue';

// Define the props
defineProps<{
  posts: any[];
}>();

// 1. Assign defineEmits to a variable so we can use it inside functions
const emit = defineEmits<{
  (e: 'like', postId: number): void;
  (e: 'share', postId: number): void;
  (e: 'report', postId: number): void;
  (e: 'comment', postId: number): void; // <-- Add this new event
}>();

// 2. Create a handler for the Share functionality
const handleShare = async (post: any) => {
  // Check if the browser supports the native Web Share API (Great for mobile!)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Post by ${post.author}`,
        text: post.caption,
        // You can change this to a specific post URL if your app has dedicated post pages
        url: window.location.hre 
      });
    } catch (error) {
      console.log('Sharing was canceled or failed.', error);
    }
  } else {
    // Fallback for older browsers: copy to clipboard and emit event to parent
    navigator.clipboard.writeText(`${window.location.href}`);
    alert("Link copied to clipboard!");
    emit('share', post.id); 
  }
};

const isVideo = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.endsWith(ext));
};
</script>

<template>
  <div class="posts-wrapper">
    <article v-for="post in posts" :key="post.id" class="post-card">
      
      <div class="post-header">
        <div class="author-avatar">
          {{ post.author?.charAt(0).toUpperCase() }}
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
      
      <div v-if="post.images && post.images.length > 0" class="post-images" :data-count="post.images.length">
        <template v-for="(mediaUrl, index) in post.images" :key="index">
          
          <video 
            v-if="isVideo(mediaUrl)"
            :src="`http://localhost:3000${mediaUrl}`"
            class="post-media"
            controls
            preload="metadata"
          ></video>
          
          <img 
            v-else
            :src="`http://localhost:3000${mediaUrl}`" 
            alt="Post attachment" 
            class="post-media"
            @error="(e) => (e.target as HTMLElement).classList.add('image-fallback')"
          />
          
        </template>
      </div>

      <div class="post-actions">
        <button 
          class="action-btn"
          :class="{ 'is-liked': post.hasLiked }"
          @click="$emit('like', post.id)"
          :disabled="post.isLiking"
        >
          <Icon :icon="post.hasLiked ? 'mdi:heart' : 'mdi:heart-outline'" class="action-icon" />
          <span>{{ post.likes }}</span>
        </button>
        
        <button class="action-btn" @click="$emit('comment', post.id)">
          <Icon icon="mdi:comment-outline" class="action-icon" />
          <span>{{ post.comments }}</span>
        </button>
        
        <button class="action-btn" @click="handleShare(post)">
          <Icon icon="mdi:share-variant-outline" class="action-icon" />
        </button>

        <button 
          class="action-btn report-btn" 
          @click="$emit('report', post.id)"
          title="Report this post"
          style="margin-left: auto; color: #ef4444;" 
        >
          <Icon icon="mdi:flag-outline" class="action-icon" />
        </button>
      </div>

    </article>
  </div>
</template>

<style scoped>
.posts-wrapper {
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

.post-media {
  width: 100%;
  height: 280px;
  object-fit: cover;
  background-color: #f1f5f9;
}
video.post-media {
  /* This ensures videos don't stretch weirdly, keeping their aspect ratio inside the grid */
  object-fit: contain; 
  background-color: #0f172a; /* Dark background looks better for letterboxed videos */
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

.action-btn.is-liked { color: #ef4444; }
.action-btn.is-liked .action-icon { color: #ef4444; }
.action-btn.is-liked:hover { background-color: #fef2f2; }

.share-btn { margin-left: auto; }

@media (max-width: 720px) {
  .post-card {
    padding: 1.25rem;
  }
}
</style>