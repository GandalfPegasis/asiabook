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

.reply-children { 
  margin-left: 48px; 
  margin-top: 12px; 
}
</style>

