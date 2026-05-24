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
      <button type="button" class="button-secondary" @click="back">Back</button>
      <div>
        <h1>{{ forum?.title || 'Thread' }}</h1>
        <p class="page-subtitle">Read the full discussion and leave a reply below.</p>
      </div>
    </div>

    <div v-if="loading" class="status-card status-loading">
      <Icon icon="mdi:loading" class="spin-icon" />
      Loading thread...
    </div>

    <div v-else-if="!forum" class="status-card">
      Unable to load this thread. Please go back and try again.
    </div>

    <div v-else>
      <section class="thread-card">
        <div class="thread-card-main">
          <div>
            <h2>{{ forum.title }}</h2>
            <p class="thread-description">{{ forum.description || 'No description yet.' }}</p>
          </div>
          <div class="thread-vote-buttons">
            <button type="button" :class="{ active: forum.user_vote === 1 }" @click="voteForum(1)">▲</button>
            <span>{{ forum.votes || 0 }}</span>
            <button type="button" :class="{ active: forum.user_vote === -1 }" @click="voteForum(-1)">▼</button>
          </div>
        </div>
      </section>

      <section class="replies-section">
        <div class="section-header">
          <h3>Replies</h3>
          <span class="reply-count">{{ replies.length }} responses</span>
        </div>

        <div v-if="replies.length === 0" class="status-card">No replies yet — be the first.</div>
        <div v-else class="reply-list">
          <div v-for="reply in replies" :key="reply.id" class="reply-root">
            <ReplyNode :reply="reply" :forumId="forum.id" />
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
              {{ isSubmittingReply ? 'Posting...' : 'Post Reply' }}
            </button>
          </div>
          <p v-if="replyError" class="error-text">{{ replyError }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.thread-page {
  min-height: calc(100vh - 72px);
  padding: 24px;
  max-width: 1040px;
  margin: 0 auto;
  background: #f8fafc;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.button-primary,
.button-secondary {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.button-primary {
  background: #4f46e5;
  color: white;
}

.button-primary:hover:not(:disabled) {
  background: #4338ca;
}

.button-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.button-secondary {
  background: #eef2ff;
  color: #1e293b;
}

.button-secondary:hover {
  background: #dbeafe;
}

.thread-card,
.reply-form-card,
.section-header,
.reply-root {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
}

.thread-card {
  padding: 24px;
  margin-bottom: 22px;
}

.thread-card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.thread-card h2 {
  margin: 0;
  font-size: 1.45rem;
  color: #111827;
}

.thread-description {
  margin: 12px 0 0;
  color: #4b5563;
  line-height: 1.8;
}

.thread-vote-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 88px;
}

.thread-vote-buttons button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #dbeafe;
  background: white;
  color: #111827;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.thread-vote-buttons button.active,
.thread-vote-buttons button:hover {
  background: #4f46e5;
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
}

.thread-vote-buttons span {
  font-weight: 700;
  color: #111827;
}

.replies-section {
  display: grid;
  gap: 18px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #111827;
}

.reply-count {
  color: #6b7280;
  font-size: 0.95rem;
}

.reply-list {
  display: grid;
  gap: 16px;
}

.reply-form-card {
  padding: 22px;
}

.reply-form-card h4 {
  margin: 0 0 14px;
  color: #111827;
}

.reply-form-card textarea {
  width: 100%;
  min-height: 140px;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  padding: 18px;
  font-size: 0.97rem;
  color: #111827;
  resize: vertical;
  background: #f8fbff;
}

.reply-form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.error-text {
  margin-top: 12px;
  color: #dc2626;
  font-size: 0.95rem;
}

.status-card {
  padding: 18px;
  border-radius: 18px;
  background: #f8fbff;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.status-loading .spin-icon {
  animation: spin 1s linear infinite;
}

.highlight {
  animation: highlightFlash 2s ease-in-out;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes highlightFlash {
  0% { background: rgba(99,102,241,0.12); border-radius: 12px; }
  50% { background: rgba(99,102,241,0.18); }
  100% { background: transparent; }
}

@media (max-width: 720px) {
  .thread-card-main {
    flex-direction: column;
  }

  .page-header {
    align-items: flex-start;
  }
}
</style>
