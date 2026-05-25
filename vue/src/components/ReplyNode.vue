<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/api';

//defineOptions?.({ name: 'ReplyNode' });

const props = defineProps<{ reply: any; forumId: number }>();
const emit = defineEmits(['reply-to']);

const router = useRouter();

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

const onReply = () => {
  emit('reply-to', props.reply.id);
};

const gotoProfile = (id?: number) => {
  if (!id) return;
  router.push({ name: 'profile', params: { id: String(id) } });
};
</script>

<template>
  <div class="reply-item" :id="'reply-' + reply.id">
    <div class="reply-meta">
      <div class="avatar" @click.stop.prevent="gotoProfile(reply.post_by)">{{ reply.replier_name ? reply.replier_name.charAt(0) : '?' }}</div>
      <div class="name" @click.stop.prevent="gotoProfile(reply.post_by)">{{ reply.replier_name || 'Unknown' }}</div>
      <div class="votes">
        <button :class="{ active: reply.user_vote === 1 }" @click.prevent.stop="vote(1)">▲</button>
        <span>{{ reply.votes || 0 }}</span>
        <button :class="{ active: reply.user_vote === -1 }" @click.prevent.stop="vote(-1)">▼</button>
      </div>
    </div>
    <div class="reply-content">{{ reply.content }}</div>
    <div class="reply-actions">
      <button @click.prevent="onReply">Reply</button>
    </div>

    <div class="reply-children" v-if="reply.children && reply.children.length">
      <ReplyNode
        v-for="child in reply.children"
        :key="child.id"
        :reply="child"
        :forumId="forumId"
        @reply-to="$emit('reply-to', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.reply-item {
  border-left: 2px solid var(--border-color, rgba(0,0,0,0.06));
  padding-left: 12px;
  margin-bottom: 12px;
  background: transparent;
}
.reply-meta { display:flex; align-items:center; gap:8px; }
.avatar { width:28px; height:28px; border-radius:50%; background:var(--secondary-color, #eef2ff); display:flex;align-items:center;justify-content:center; font-weight:700; color:var(--text-color, #0f172a) }
.avatar { width:28px; height:28px; border-radius:50%; background:var(--secondary-color, #eef2ff); display:flex;align-items:center;justify-content:center; font-weight:700; color:var(--text-color, #0f172a); cursor: pointer }
.avatar:hover { transform: translateY(-2px); color: #2563eb }
.name { cursor: pointer }
.name:hover { color: #2563eb; text-decoration: none }
.votes { margin-left:auto; display:flex; align-items:center; gap:6px }
.votes button { border:1px solid var(--border-color, #e6eef4); background:transparent; padding:6px 8px; border-radius:6px; cursor:pointer; color:var(--muted, #64748b) }
.votes button.active { background:var(--primary-color, #6366f1); color:white; border-color:var(--primary-color, #6366f1) }
.votes button:hover { background:var(--primary-color, #6366f1); color:white; border-color:var(--primary-color, #6366f1) }
.reply-content { margin-top:6px; margin-bottom:6px; color:var(--text-color, #0f172a) }
.reply-actions { font-size:13px }
.reply-actions button { background:transparent; border:none; color:var(--primary-dark, #4f46e5); cursor:pointer }
.reply-children { margin-left:12px; margin-top:8px }
</style>
