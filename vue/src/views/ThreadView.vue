<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { api } from '../api/api';
import ReplyNode from '../components/ReplyNode.vue';

const route = useRoute();
const router = useRouter();

const forum = ref<any | null>(null);
const replies = ref<any[]>([]);
const loading = ref(true);
const newReplyContent = ref('');
const newReplyRef = ref<HTMLTextAreaElement | null>(null);
const replyError = ref<string | null>(null);
const isSubmittingReply = ref(false);

const load = async (id: number) => {
  loading.value = true;
  replyError.value = null;
  try {
    forum.value = await api.getForumById(id);
    replies.value = await api.getReplies(id);
  } catch (err) {
    console.error(err);
    replyError.value = 'Unable to load this thread. Please try again.';
  } finally {
    loading.value = false;
  }
};

const back = () => router.push({ name: 'forums' });

const voteForum = async (delta = 1) => {
  if (!forum.value) return;
  try {
    const res = await api.voteForum(forum.value.id, delta);
    forum.value.votes = res.votes;
    forum.value.user_vote = res.user_vote || 0;
  } catch (err) {
    console.error(err);
  }
};

const createReply = async () => {
  if (!forum.value || !newReplyContent.value.trim()) return;
  replyError.value = null;
  isSubmittingReply.value = true;
  try {
    await api.createReply(forum.value.id, newReplyContent.value.trim());
    newReplyContent.value = '';
    await load(forum.value.id);
    await nextTick();
    newReplyRef.value?.focus();
  } catch (err) {
    console.error(err);
    replyError.value = 'Could not post your reply. Please try again.';
  } finally {
    isSubmittingReply.value = false;
  }
};

const onReplyPosted = async () => {
  if (!forum.value) return;
  await load(forum.value.id);
};

const scrollToReplyFromHash = async () => {
  await nextTick();
  if (route.hash && route.hash.startsWith('#reply-')) {
    const id = route.hash.replace('#reply-', '');
    const el = document.getElementById('reply-' + id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 2200);
    }
  }
};

const focusReplyIfRequested = async () => {
  await nextTick();
  if (route.query.focusReply) {
    const el = newReplyRef.value as HTMLTextAreaElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  }
};

onMounted(async () => {
  const id = Number(route.params.id);
  if (isNaN(id)) return back();
  await load(id);
  await scrollToReplyFromHash();
  await focusReplyIfRequested();
});
</script>

<template>
  <div class="thread-page">
    <div class="page-header">
      <button type="button" class="button-back" @click="back" title="Back">
        <Icon icon="mdi:arrow-left" width="24" height="24" />
      </button>
      <div>
        <h1>{{ forum?.title || 'Thread' }}</h1>
        <p class="page-subtitle">Read the full discussion and leave a reply below.</p>
      </div>
    </div>

    <div v-if="loading" class="status-card status-loading">
      <Icon icon="mdi:loading" class="spin-icon" />
      <p>Loading thread...</p>
    </div>

    <div v-else-if="!forum" class="status-card error-state">
      <Icon icon="mdi:alert-circle-outline" class="error-icon" />
      <p>Unable to load this thread. Please go back and try again.</p>
    </div>

    <div v-else>
      <section class="thread-card">
        <div class="thread-card-main">
          <div class="thread-content">
            <h2>{{ forum.title }}</h2>
            <p class="thread-description">{{ forum.description || 'No description yet.' }}</p>
          </div>
          <div class="thread-vote-buttons">
            <button type="button" :class="{ active: forum.user_vote === 1 }" @click="voteForum(1)">
              <Icon icon="mdi:chevron-up" width="28" height="28" />
            </button>
            <span>{{ forum.votes || 0 }}</span>
            <button type="button" :class="{ active: forum.user_vote === -1 }" @click="voteForum(-1)">
              <Icon icon="mdi:chevron-down" width="28" height="28" />
            </button>
          </div>
        </div>
      </section>

      <section class="replies-section">
        <div class="section-header">
          <h3>Replies</h3>
          <span class="reply-count">{{ replies.length }} responses</span>
        </div>

        <div v-if="replies.length === 0" class="status-card empty-state">
          <Icon icon="mdi:comment-text-outline" class="empty-icon" />
          <p>No replies yet — be the first to share your thoughts.</p>
        </div>
        
        <div v-else class="reply-list">
          <div v-for="reply in replies" :key="reply.id" class="reply-root">
            <ReplyNode :reply="reply" :forumId="forum.id" @reply-posted="onReplyPosted" />
          </div>
        </div>

        <div class="reply-form-card">
          <h4>Write a reply</h4>
          <textarea
            ref="newReplyRef"
            v-model="newReplyContent"
            placeholder="Share your thoughts..."
          ></textarea>
          <div class="reply-form-actions">
            <button type="button" class="button-primary" @click="createReply" :disabled="isSubmittingReply">
              <Icon v-if="!isSubmittingReply" icon="mdi:send" class="btn-icon" />
              <Icon v-else icon="mdi:loading" class="btn-icon spin-icon" />
              <span>{{ isSubmittingReply ? 'Posting...' : 'Post Reply' }}</span>
            </button>
          </div>
          <p v-if="replyError" class="error-text">
            <Icon icon="mdi:alert-circle" /> {{ replyError }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Base Layout & Typography */
.thread-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 2rem;
  max-width: 1040px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1.25rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  color: #475569;
  font-size: 1rem;
}

/* Buttons */
.button-primary {
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
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.button-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-back {
  background: white;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(15, 23, 42, 0.02);
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.button-back:hover {
  background: #f8fafc;
  color: #6366f1;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

/* Common Card Styles */
.thread-card,
.reply-form-card,
.section-header,
.reply-root {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

/* Thread Card */
.thread-card {
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.thread-card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
}

.thread-content {
  flex: 1;
}

.thread-card h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #0f172a;
  line-height: 1.3;
}

.thread-description {
  margin: 1rem 0 0;
  color: #334155;
  line-height: 1.7;
  font-size: 1.05rem;
  white-space: pre-wrap;
}

/* Voting System */
.thread-vote-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
}

.thread-vote-buttons button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.thread-vote-buttons button:hover {
  background: #e0e7ff;
  color: #6366f1;
}

.thread-vote-buttons button.active {
  background: #6366f1;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.thread-vote-buttons span {
  font-weight: 700;
  color: #0f172a;
  font-size: 1.1rem;
}

/* Replies Section */
.replies-section {
  display: grid;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.reply-count {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.reply-list {
  display: grid;
  gap: 1rem;
}

/* Reply Composer */
.reply-form-card {
  padding: 2rem;
}

.reply-form-card h4 {
  margin: 0 0 1rem;
  color: #0f172a;
  font-size: 1.1rem;
}

.reply-form-card textarea {
  width: 100%;
  min-height: 120px;
  border-radius: 18px;
  border: 1px solid #cbd5e1;
  padding: 1rem;
  font-size: 1rem;
  color: #0f172a;
  font-family: inherit;
  resize: vertical;
  background: white;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.reply-form-card textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.reply-form-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.error-text {
  margin-top: 1rem;
  color: #ef4444;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Status Cards (Loading, Empty, Error) */
.status-card {
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

.empty-icon {
  font-size: 3rem;
  color: #94a3b8;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
}

/* Highlight Animation for scroll-to-reply */
.highlight {
  animation: highlightFlash 2.5s ease-in-out;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes highlightFlash {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); border-color: #e2e8f0; }
  15% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2); border-color: #6366f1; background: #f5f8ff; }
  85% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2); border-color: #6366f1; background: #f5f8ff; }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); border-color: #e2e8f0; background: white; }
}

/* Mobile Adjustments */
@media (max-width: 720px) {
  .thread-page {
    padding: 1.5rem 1rem;
  }

  .thread-card-main {
    flex-direction: column-reverse;
    gap: 1.5rem;
  }

  .thread-vote-buttons {
    flex-direction: row;
    width: 100%;
    justify-content: center;
    padding: 0.5rem 1rem;
  }

  .thread-card, 
  .reply-form-card {
    padding: 1.5rem;
  }
}
</style>