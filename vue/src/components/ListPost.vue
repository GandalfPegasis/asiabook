<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Define the props
defineProps<{
  posts: any[];
}>();

// 1. Assign defineEmits to a variable so we can use it inside functions
const emit = defineEmits<{
  (e: 'like', postId: number): void;
  (e: 'share', postId: number): void;
  (e: 'comment', postId: number): void;
  // Updated report event to include the reason
  (e: 'report', payload: { postId: number; reason: string }): void; 
}>();

// --- REPORT MODAL STATE & LOGIC ---
const isReportModalOpen = ref(false);
const reportingPostId = ref<number | null>(null);
const reportReason = ref('spam');
const isSubmittingReport = ref(false);

const openReportModal = (postId: number) => {
  reportingPostId.value = postId;
  reportReason.value = 'spam'; // Reset to default when opening
  isReportModalOpen.value = true;
};

const closeReportModal = () => {
  isReportModalOpen.value = false;
  setTimeout(() => {
    reportingPostId.value = null;
  }, 200); // Wait for transition to finish
};

const submitReport = () => {
  if (!reportingPostId.value) return;
  isSubmittingReport.value = true;

  // Emit the event with the specific reason attached
  emit('report', {
    postId: reportingPostId.value,
    reason: reportReason.value
  });

  // Simulate a tiny delay for UX, then close and notify
  setTimeout(() => {
    isSubmittingReport.value = false;
    closeReportModal();
  }, 400);
};
// ----------------------------------

// 2. Create a handler for the Share functionality
const handleShare = async (post: any) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Post by ${post.author}`,
        text: post.caption,
        url: window.location.href 
      });
    } catch (error) {
      console.log('Sharing was canceled or failed.', error);
    }
  } else {
    navigator.clipboard.writeText(`${window.location.href}`);
    alert("Link copied to clipboard!");
    emit('share', post.id); 
  }
};
const viewProfile = (userId: number) => {
  router.push(`/profile/${userId}`);
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
        <div class="author-avatar" @click="viewProfile(post.author_id)">
          <img v-if="post.author_avatar" :src="`http://localhost:3000${post.author_avatar}`" alt="Avatar" class="avatar-img" style="cursor: pointer;"/>
          <span v-else>{{ post.author?.charAt(0).toUpperCase() || 'U' }}</span>
        </div>
        <div class="author-meta">
          <div class="author-name-row">
            <span class="author-name" @click="viewProfile(post.author_id)" style="cursor: pointer;">{{ post.author }}</span>
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
        
        <button class="action-btn share-btn" @click="handleShare(post)">
          <Icon icon="mdi:share-variant-outline" class="action-icon" />
        </button>

        <button 
          class="action-btn report-btn" 
          @click="openReportModal(post.id)"
          title="Report this post"
          style="margin-left: auto; color: #ef4444;" 
        >
          <Icon icon="mdi:flag-outline" class="action-icon" />
        </button>
      </div>
    </article>

    <div v-if="isReportModalOpen" class="modal-overlay" @click.self="closeReportModal">
      <div class="modal-card">
        
        <div class="modal-header">
          <h3>Report Post</h3>
          <button class="close-btn" @click="closeReportModal">
            <Icon icon="mdi:close" class="action-icon" />
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">Why are you reporting this post?</p>
          
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="reportReason" value="spam" />
              <span>It's spam</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="reportReason" value="inappropriate" />
              <span>Inappropriate or offensive</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="reportReason" value="harassment" />
              <span>Harassment or bullying</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="reportReason" value="other" />
              <span>Other</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeReportModal">Cancel</button>
          <button class="btn-submit" @click="submitReport" :disabled="isSubmittingReport">
            <Icon v-if="isSubmittingReport" icon="mdi:loading" class="spin-icon-small" />
            <span>{{ isSubmittingReport ? 'Submitting...' : 'Submit Report' }}</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keep all your existing CSS here */
.posts-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }
.post-card { background: white; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04); padding: 1.5rem; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.post-card:hover { box-shadow: 0 20px 32px rgba(15, 23, 42, 0.06); }
.post-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.author-avatar { 
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.author-meta { display: flex; flex-direction: column; gap: 0.25rem; }
.author-name-row { display: flex; align-items: center; gap: 0.5rem; }
.author-name { font-weight: 600; font-size: 1.05rem; color: #0f172a; }
.author-role { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 999px; background: #e0e7ff; color: #4f46e5; font-weight: 600; }
.post-time { font-size: 0.85rem; color: #94a3b8; }
.post-caption { font-size: 1rem; line-height: 1.6; margin-bottom: 1.25rem; color: #334155; white-space: pre-wrap; }
.post-images { display: grid; gap: 0.5rem; margin-bottom: 1.25rem; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
.post-images[data-count="1"] { grid-template-columns: 1fr; }
.post-images[data-count="2"] { grid-template-columns: 1fr 1fr; }
.post-images[data-count="3"], .post-images[data-count="4"] { grid-template-columns: 1fr 1fr; }
.post-media { width: 100%; height: 280px; object-fit: cover; background-color: #f1f5f9; }
video.post-media { object-fit: contain; background-color: #0f172a; }
.image-fallback { display: flex; align-items: center; justify-content: center; position: relative; }
.image-fallback::after { content: 'Image not found'; position: absolute; color: #94a3b8; font-size: 0.9rem; }
.post-actions { display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
.action-btn { background: transparent; border: none; color: #64748b; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; font-weight: 600; padding: 0.6rem 0.85rem; border-radius: 12px; transition: all 0.2s ease; }
.action-btn:hover { background-color: #f1f5f9; color: #6366f1; }
.action-icon { width: 22px; height: 22px; }
.action-btn.is-liked { color: #ef4444; }
.action-btn.is-liked .action-icon { color: #ef4444; }
.action-btn.is-liked:hover { background-color: #fef2f2; }
.share-btn { margin-left: auto; }
@media (max-width: 720px) { .post-card { padding: 1.25rem; } }

/* --- NEW MODAL CSS --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.close-btn:hover { background: #f1f5f9; color: #0f172a; }

.modal-body {
  padding: 1.5rem;
}

.modal-subtitle {
  margin: 0 0 1rem 0;
  color: #475569;
  font-weight: 500;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.radio-label:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.radio-label input[type="radio"] {
  accent-color: #ef4444; /* Matches the red flag theme */
  width: 1.1rem;
  height: 1.1rem;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: transparent;
  border: none;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}
.btn-cancel:hover { color: #0f172a; }

.btn-submit {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}
.btn-submit:hover:not(:disabled) { background: #dc2626; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.spin-icon-small {
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>