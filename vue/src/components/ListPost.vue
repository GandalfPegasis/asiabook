<script setup lang="ts">
import { Icon } from '@iconify/vue';

// Define the props to receive the posts data from the parent
defineProps<{
  posts: any[];
}>();

// Define the events this component can emit back to the parent
defineEmits<{
  (e: 'like', postId: number): void;
}>();
</script>

<template>
  <div class="posts-wrapper">
    <article v-for="post in posts" :key="post.id" class="post-card">
      
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
      
      <div v-if="post.images && post.images.length > 0" class="post-images" :data-count="post.images.length">
        <img 
          v-for="(imgUrl, index) in post.images" 
          :key="index" 
          :src="`http://localhost:3000/img/${imgUrl}`" 
          alt="Post attachment" 
          class="post-image"
          @error="(e) => (e.target as HTMLElement).classList.add('image-fallback')"
        />
      </div>

      <div class="post-actions">
        <button 
          class="action-btn"
          :class="{ 'is-liked': post.hasLiked }"
          @click="$emit('like', post.id)"
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