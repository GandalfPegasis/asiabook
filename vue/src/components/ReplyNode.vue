<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/api';

const props = defineProps<{ reply: any; forumId: number }>();
const emit = defineEmits(['reply-posted']);

const router = useRouter();
const showReplyComposer = ref(false);
const replyContent = ref('');
const isSubmittingReply = ref(false);
const replyError = ref<string | null>(null);

const vote = async (delta: number) => {
  try {
    if (!props.reply) return;
    const res = await api.voteReply(props.forumId, props.reply.id, delta);
    props.reply.votes = res.votes;
    props.reply.user_vote = res.user_vote || 0;
  } catch (err) {
    console.error(err);
  }
};

const toggleReplyComposer = () => {
  showReplyComposer.value = !showReplyComposer.value;
  if (!showReplyComposer.value) {
    replyContent.value = '';
    replyError.value = null;
  }
};

const submitNestedReply = async () => {
  if (!replyContent.value.trim()) return;
  replyError.value = null;
  isSubmittingReply.value = true;
  
  try {
    await api.createReply(props.forumId, replyContent.value.trim(), props.reply.id);
    replyContent.value = '';
    showReplyComposer.value = false;
    emit('reply-posted');
  } catch (err) {
    console.error(err);
    replyError.value = 'Could not post your reply. Please try again.';
  } finally {
    isSubmittingReply.value = false;
  }
};

const gotoProfile = (id?: number) => {
  if (!id) return;
  router.push({ name: 'profile', params: { id: String(id) } });
};
</script>

<template>
  <div class="reply-item" :id="'reply-' + reply.id">
    <div class="reply-meta">
      <div class="avatar" @click.stop.prevent="gotoProfile(reply.post_by)">
        <img v-if="reply.replier_avatar" :src="`http://localhost:3000${reply.replier_avatar}`" alt="Avatar" class="avatar-img" />
        <span v-else>{{ reply.author_name?.charAt(0).toUpperCase() || 'U' }}</span>
      </div>
      <div class="name" @click.stop.prevent="gotoProfile(reply.post_by)">{{ reply.replier_name || 'Unknown' }}</div>
      <div class="votes">
        <button :class="{ active: reply.user_vote === 1 }" @click.prevent.stop="vote(1)">▲</button>
        <span>{{ reply.votes || 0 }}</span>
        <button :class="{ active: reply.user_vote === -1 }" @click.prevent.stop="vote(-1)">▼</button>
      </div>
    </div>
    <div class="reply-content">{{ reply.content }}</div>
    <div class="reply-actions">
      <button type="button" @click="toggleReplyComposer">
        {{ showReplyComposer ? 'Cancel' : 'Reply' }}
      </button>
    </div>

    <!-- Nested Reply Composer -->
    <div v-if="showReplyComposer" class="nested-reply-composer">
      <textarea
        v-model="replyContent"
        placeholder="Write a reply to this comment..."
        :disabled="isSubmittingReply"
      ></textarea>
      <div class="composer-actions">
        <button 
          type="button"
          @click="submitNestedReply" 
          :disabled="isSubmittingReply || !replyContent.trim()"
          class="btn-submit"
        >
          {{ isSubmittingReply ? 'Posting...' : 'Post Reply' }}
        </button>
      </div>
      <p v-if="replyError" class="error-text">{{ replyError }}</p>
    </div>

    <!-- Nested Children -->
    <div v-if="reply.children && reply.children.length" class="reply-children">
      <ReplyNode
        v-for="child in reply.children"
        :key="child.id"
        :reply="child"
        :forumId="forumId"
        @reply-posted="$emit('reply-posted')"
      />
    </div>
  </div>
</template>

<style scoped>
.reply-item {
  padding: 16px 20px; 
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 8px;
}

.reply-meta { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 12px; 
  width: 100%;
}

.avatar { 
  width: 36px; 
  height: 36px; 
  min-width: 36px; 
  border-radius: 50%; 
  background: #4f46e5; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 700; 
  color: white; 
  cursor: pointer; 
  flex-shrink: 0; 
  font-size: 0.9rem;
}

.name { 
  font-weight: 600; 
  color: #111827; 
  cursor: pointer; 
  font-size: 0.95rem; 
}

.votes { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  flex-shrink: 0; 
  margin-left: auto; 
  background: #f3f4f6; 
  padding: 4px 8px;
  border-radius: 20px; 
}

.votes button { 
  border: none; 
  background: transparent; 
  padding: 0;
  cursor: pointer; 
  color: #6b7280; 
  font-weight: 600; 
  transition: all 0.15s ease; 
  width: 24px; 
  height: 24px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 0.85rem;
}

.votes button:hover {
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.1);
  border-radius: 50%;
}

.votes button.active { 
  color: #4f46e5; 
}

.votes span { 
  font-weight: 700; 
  color: #374151; 
  font-size: 0.85rem; 
  min-width: 16px; 
  text-align: center; 
}

.reply-content { 
  margin-left: 48px; 
  margin-top: 0;
  margin-bottom: 8px; 
  color: #374151; 
  font-size: 0.95rem; 
  line-height: 1.5; 
  word-break: break-word;
}

.reply-actions { 
  margin-left: 48px; 
  font-size: 13px; 
}

.reply-actions button { 
  background: transparent; 
  border: none; 
  color: #6b7280; 
  cursor: pointer; 
  font-weight: 600; 
  padding: 0;
  transition: all 0.15s ease; 
}

.reply-actions button:hover { 
  color: #4f46e5; 
  text-decoration: underline; 
}

/* Nested Reply Composer */
.nested-reply-composer {
  margin-left: 48px;
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.nested-reply-composer textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s ease;
}

.nested-reply-composer textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.nested-reply-composer textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.composer-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-submit {
  padding: 6px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  margin-top: 8px;
  color: #ef4444;
  font-size: 0.85rem;
}

/* Nested Children Container */
.reply-children { 
  margin-left: 48px; 
  margin-top: 12px;
}

/* Indentation for deeply nested replies */
.reply-children .reply-item {
  margin-left: 0;
}

.reply-children .reply-item .reply-meta,
.reply-children .reply-item .reply-content,
.reply-children .reply-item .reply-actions {
  margin-left: 0 !important;
}

.reply-children .reply-item .reply-meta {
  padding-left: 0;
}
</style>

