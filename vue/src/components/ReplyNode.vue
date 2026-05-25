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
  border-left: 2px solid #e5e7eb;
  padding-left: 16px;
  margin-bottom: 16px;
  background: transparent;
}
.reply-meta { display:flex; align-items:center; gap:10px; margin-bottom:10px }
.avatar { width:36px; height:36px; min-width:36px; border-radius:50%; background:#4f46e5; display:flex; align-items:center; justify-content:center; font-weight:700; color:white; cursor:pointer; flex-shrink:0; transition:all 0.18s ease; font-size:0.95rem }
.avatar:hover { transform:translateY(-2px); background:#4338ca }
.name { font-weight:600; color:#111827; cursor:pointer; transition:all 0.18s ease; font-size:0.97rem }
.name:hover { color:#4f46e5 }
.votes { display:flex; align-items:center; gap:4px; flex-shrink:0; margin-left:auto }
.votes button { border:none; background:#dbeafe; padding:4px 5px; border-radius:5px; cursor:pointer; color:#4f46e5; font-weight:600; transition:all 0.18s ease; font-size:0.9rem; width:28px; height:28px; display:flex; align-items:center; justify-content:center }
.votes button.active { background:#4f46e5; color:white; border-color:#4f46e5 }
.votes button:hover { background:#4f46e5; color:white }
.votes span { font-weight:600; color:#4f46e5; font-size:0.9rem; min-width:20px; text-align:center }
.reply-content { margin-top:8px; margin-bottom:8px; color:#111827; font-size:0.98rem; line-height:1.5 }
.reply-actions { font-size:13px; margin-top:6px }
.reply-actions button { background:transparent; border:none; color:#4f46e5; cursor:pointer; font-weight:600; text-decoration:none; transition:all 0.18s ease }
.reply-actions button:hover { color:#4338ca; text-decoration:underline }
.reply-children { margin-left:12px; margin-top:8px }
</style>
