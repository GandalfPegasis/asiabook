<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { api } from '../api/api';
import ReplyNode from '../components/ReplyNode.vue';

const clubs = ref<any[]>([]);
const selectedClub = ref<any | null>(null);
const clubMembers = ref<any[]>([]);
const selectedClubFilter = ref<number | null>(null);
const forums = ref<any[]>([]);
const selectedForum = ref<any | null>(null);
const replies = ref<any[]>([]);
const isLoading = ref(false);
const sortMode = ref<'new' | 'top'>('new');

const newPostTitle = ref('');
const newPostDescription = ref('');
const creatingPost = ref(false);
const newReplyContent = ref('');
const replyingToId = ref<number | null>(null);

const filterLabel = computed(() => selectedClub.value ? selectedClub.value.title : 'All Clubs');

const router = useRouter();

const fetchClubs = async () => {
  try {
    clubs.value = await api.getClubs();
  } catch (err) {
    console.error(err);
  }
};

const fetchForums = async () => {
  isLoading.value = true;
  try {
    const params: any = {};
    if (selectedClubFilter.value) params.clubId = selectedClubFilter.value;
    forums.value = await api.getForums(Object.keys(params).length ? params : undefined);
    if (sortMode.value === 'top') {
      forums.value.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      forums.value.sort((a, b) => b.id - a.id);
    }
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const loadClub = async (id: number) => {
  try {
    selectedClub.value = await api.getClubById(id);
    clubMembers.value = await api.getClubMembers(id);
    selectedClubFilter.value = id;
    await fetchForums();
  } catch (err) {
    console.error(err);
  }
};

const clearClubFilter = async () => {
  selectedClub.value = null;
  selectedClubFilter.value = null;
  await fetchForums();
};

const joinClub = async (id: number) => {
  try {
    await api.joinClub(id);
    clubMembers.value = await api.getClubMembers(id);
  } catch (err) {
    console.error(err);
  }
};

const gotoProfile = (profileId?: number) => {
  if (!profileId) return;
  router.push({ name: 'profile', params: { id: String(profileId) } });
};

const gotoThread = (id: number, focusReply = false) => {
  const query: any = {};
  if (focusReply) query.focusReply = '1';
  router.push({ name: 'thread', params: { id: String(id) }, query });
};

const createPost = async () => {
  if (!newPostTitle.value.trim()) return;
  creatingPost.value = true;
  try {
    await api.createForum(
      newPostTitle.value.trim(),
      newPostDescription.value.trim() || undefined,
      selectedClubFilter.value || undefined,
    );
    newPostTitle.value = '';
    newPostDescription.value = '';
    await fetchForums();
  } catch (err) {
    console.error(err);
  } finally {
    creatingPost.value = false;
  }
};

const createReply = async (forumId: number) => {
  if (!newReplyContent.value.trim()) return;
  try {
    await api.createReply(forumId, newReplyContent.value.trim(), replyingToId.value || undefined);
    newReplyContent.value = '';
    replyingToId.value = null;
    replies.value = await api.getReplies(forumId);
  } catch (err) {
    console.error(err);
  }
};

const voteForum = async (forumId: number, delta = 1) => {
  try {
    const res = await api.voteForum(forumId, delta);
    const item = forums.value.find((x) => x.id === forumId) || selectedForum.value;
    if (item) {
      item.votes = res.votes;
      item.user_vote = res.user_vote || 0;
    }
  } catch (err) {
    console.error(err);
  }
};

const voteReply = async (forumId: number, replyId: number, delta = 1) => {
  try {
    const res = await api.voteReply(forumId, replyId, delta);
    const update = (arr: any[]) => {
      const r = arr.find((x) => x.id === replyId);
      if (r) {
        r.votes = res.votes;
        r.user_vote = res.user_vote || 0;
      }
      arr.forEach((c) => c.children && update(c.children));
    };
    update(replies.value);
  } catch (err) {
    console.error(err);
  }
};

const replyTree = computed(() => {
  const map = new Map<number, any>();
  const roots: any[] = [];
  replies.value.forEach((reply) => {
    reply.children = [];
    map.set(reply.id, reply);
  });
  replies.value.forEach((reply) => {
    if (reply.reply_of && map.has(reply.reply_of)) {
      map.get(reply.reply_of).children.push(reply);
    } else {
      roots.push(reply);
    }
  });
  return roots;
});

onMounted(() => {
  fetchClubs();
  fetchForums();
});
</script>

<template>
  <div class="forum-shell">
    <header class="forum-header">
      <div>
        <h1><Icon icon="mdi:forum" class="header-icon" /> Community Forums</h1>
        <p>Explore club discussions, vote on posts, and reply in threaded conversations.</p>
      </div>
      <div class="forum-stats">
        <span>{{ clubs.length }} clubs</span>
        <span>{{ forums.length }} threads</span>
      </div>
    </header>

    <div class="forum-layout">
      <aside class="forum-sidebar">
        <div class="panel new-post">
          <h3>New discussion</h3>
          <label>Title</label>
          <input v-model="newPostTitle" placeholder="Start a thread title" />
          <label>Club</label>
          <select v-model="selectedClubFilter">
            <option :value="null">All clubs</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.title }}</option>
          </select>
          <label>Description</label>
          <textarea v-model="newPostDescription" placeholder="Write some context for your thread"></textarea>
          <div class="create-actions">
            <button class="button-primary" @click="createPost" :disabled="creatingPost">{{ creatingPost ? 'Posting...' : 'Post Thread' }}</button>
          </div>
        </div>

        <div class="panel clubs-panel">
          <div class="panel-title-row">
            <h3>Clubs</h3>
            <button class="button-secondary" @click="clearClubFilter" v-if="selectedClub">Clear</button>
          </div>
          <div class="club-list">
            <div
              class="club-card"
              v-for="club in clubs"
              :key="club.id"
              :class="{ active: selectedClubFilter === club.id }"
              @click="loadClub(club.id)"
            >
              <div class="club-icon"><Icon icon="mdi:account-group" /></div>
              <div>
                <div class="club-name">{{ club.title }}</div>
                <div class="club-meta">{{ club.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="forum-main">
        <div class="panel discussion-panel">
          <div class="sort-row">
            <div class="filter-pill">
              <Icon icon="mdi:tag-outline" /> {{ filterLabel }}
            </div>
            <select v-model="sortMode">
              <option value="new">Newest</option>
              <option value="top">Top</option>
            </select>
          </div>

          <div class="thread-list">
            <div v-if="isLoading" class="status-card">
              <Icon icon="mdi:loading" class="spin-icon" /> Loading threads...
            </div>
            <div v-else-if="forums.length === 0" class="status-card">
              <div>
                <h3>No threads yet</h3>
                <p>Create the first discussion for this club.</p>
              </div>
            </div>
            <div
              v-else
              v-for="post in forums"
              :key="post.id"
              class="thread-item"
              @click="gotoThread(post.id)"
            >
              <div class="thread-vote">
                <button :class="{ active: post.user_vote === 1 }" @click.stop.prevent="voteForum(post.id, 1)">▲</button>
                <span>{{ post.votes || 0 }}</span>
                <button :class="{ active: post.user_vote === -1 }" @click.stop.prevent="voteForum(post.id, -1)">▼</button>
              </div>
              <div class="thread-content">
                <div class="thread-title">{{ post.title }}</div>
                <p class="thread-description">{{ post.description || 'No description yet.' }}</p>
                <div class="thread-meta">
                  <span class="author-link" @click.stop="gotoProfile(post.author_id || post.post_by)"><Icon icon="mdi:account-circle-outline" /> {{ post.author_name || 'Anonymous' }}</span>
                  <span class="reply-open" @click.stop.prevent="gotoThread(post.id, true)"><Icon icon="mdi:chat-outline" /> {{ post.reply_count || 0 }} replies</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="forum-right">
        <div class="panel thread-detail" v-if="selectedForum" ref="threadDetailRef">
          <div class="thread-heading">
            <div>
              <h2>{{ selectedForum.title }}</h2>
              <div class="thread-tags">
                <span class="thread-tag">{{ selectedClub?.title || 'General' }}</span>
              </div>
            </div>
            <div class="thread-actions">
              <button :class="{ active: selectedForum.user_vote === 1 }" @click="voteForum(selectedForum.id, 1)">▲</button>
              <span>{{ selectedForum.votes || 0 }}</span>
              <button :class="{ active: selectedForum.user_vote === -1 }" @click="voteForum(selectedForum.id, -1)">▼</button>
            </div>
          </div>
          <p>{{ selectedForum.description || 'No thread description.' }}</p>
          <div class="reply-panel">
            <h3>Replies</h3>
            <div v-if="replyTree.length === 0" class="status-card">Be the first to reply.</div>
            <div v-for="reply in replyTree" :key="reply.id" class="reply-root">
              <ReplyNode :reply="reply" :forumId="selectedForum.id" @reply-to="replyingToId = $event" />
            </div>
            <div class="reply-form">
              <textarea v-model="newReplyContent" placeholder="Write a reply..."></textarea>
              <div class="reply-actions">
                <button class="button-primary" @click="createReply(selectedForum.id)">Post Reply</button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel community-panel">
          <h3>Community Notes</h3>
          <div class="small-card">
            <h4>How to use Forums</h4>
            <p>Click a thread to open it, vote on the best posts, and reply with threaded comments. Select a club to filter conversations.</p>
          </div>
          <div class="small-card">
            <h4>Quick actions</h4>
            <ul>
              <li>Post to the selected club</li>
              <li>Use the club sidebar to jump between interests</li>
              <li>Vote and reply to keep discussions active</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.forum-shell {
  padding: 24px 24px 40px;
  min-height: calc(100vh - 72px);
  background: #f8fafc;
}

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto 24px;
}

.forum-header h1 {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  font-size: 2.4rem;
  color: #111827;
}

.header-icon {
  font-size: 2rem;
  color: #6366f1;
}

.forum-header p {
  margin: 6px 0 0;
  color: #6b7280;
  max-width: 640px;
}

.forum-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #4b5563;
  font-size: 0.95rem;
}

.forum-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr) minmax(280px, 320px);
  gap: 24px;
}

.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  padding: 22px;
}

.new-post {
  position: sticky;
  top: 24px;
}

.new-post h3,
.clubs-panel h3,
.thread-detail h2,
.community-panel h3 {
  margin: 0 0 16px;
  color: #111827;
}

.new-post label {
  display: block;
  margin-top: 12px;
  margin-bottom: 8px;
  color: #4b5563;
  font-size: 0.88rem;
}

.new-post input,
.new-post textarea,
.new-post select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
  padding: 14px 16px;
  font-size: 0.95rem;
  color: #111827;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.new-post textarea {
  min-height: 120px;
  resize: vertical;
}

.new-post input:focus,
.new-post textarea:focus,
.new-post select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.14);
}

.create-actions {
  margin-top: 18px;
}

.post-list-container {
  margin-top: 20px;
}

.post-card {
  border-radius: 18px;
  background: #f8fbff;
  padding: 18px;
  border: 1px solid transparent;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  border-color: #dbeafe;
  transform: translateY(-1px);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.post-meta {
  display: grid;
  gap: 10px;
}

.post-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.post-description {
  color: #4b5563;
  line-height: 1.7;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.post-replies {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.95rem;
}

.post-votes {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.post-votes button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #c7d2fe;
  background: white;
  color: #111827;
  cursor: pointer;
  transition: all 0.18s ease;
}

.post-votes button:hover {
  background: #4f46e5;
  color: white;
  border-color: transparent;
}

.empty-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 1.05rem;
}

.button-primary,
.button-secondary,
.thread-actions button,
.reply-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.button-primary {
  width: 100%;
  padding: 14px 16px;
  font-weight: 700;
  background: #4f46e5;
  color: white;
}

.button-primary:hover {
  transform: translateY(-1px);
  background: #4338ca;
}

.button-secondary {
  padding: 10px 14px;
  background: #f8fafc;
  color: #111827;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.club-grid,
.club-list {
  display: grid;
  gap: 12px;
}

.club-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fbff;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  border: 1px solid transparent;
}

.club-card:hover,
.club-card.active {
  border-color: rgba(99, 102, 241, 0.32);
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.1);
}

.club-icon {
  width: 44px;
  height: 44px;
  border-radius: 18px;
  background: rgba(99, 102, 241, 0.12);
  display: grid;
  place-items: center;
  color: #4f46e5;
  font-size: 1.2rem;
}

.club-name {
  font-weight: 700;
  color: #111827;
}

.club-meta {
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.5;
}

.author-link:hover {
  color: #2563eb;
  cursor: pointer;
}

.reply-open:hover {
  color: #2563eb;
  cursor: pointer;
}

.thread-item { cursor: pointer; }

.forum-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sort-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1d4ed8;
  font-weight: 700;
}

.sort-row select {
  min-width: 140px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
  padding: 12px 14px;
  color: #111827;
}

.thread-list {
  display: grid;
  gap: 16px;
}

.thread-item {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid transparent;
  box-shadow: inset 0 0 0 1px transparent;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.thread-item:hover {
  transform: translateY(-1px);
  border-color: #dbeafe;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.thread-vote {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  color: #6b7280;
}

.thread-vote button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #c7d2fe;
  background: white;
  color: #111827;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.thread-vote button.active,
.thread-vote button:hover {
  background: #4f46e5;
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
}

.thread-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thread-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.thread-description {
  margin: 0;
  color: #4b5563;
  line-height: 1.75;
}

.thread-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #6b7280;
  font-size: 0.9rem;
}

.thread-meta span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.thread-detail {
  position: sticky;
  top: 24px;
}

.thread-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.thread-detail h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #111827;
}

.thread-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.thread-tag {
  background: #eef2ff;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.thread-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thread-actions button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #dbeafe;
  background: white;
  color: #111827;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.thread-actions button.active,
.thread-actions button:hover {
  background: #4f46e5;
  color: white;
  transform: translateY(-1px);
}

.thread-detail p {
  margin: 0;
  color: #4b5563;
  line-height: 1.8;
}

.reply-panel {
  margin-top: 24px;
}

.reply-panel h3 {
  margin: 0 0 14px;
  font-size: 1.05rem;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px;
  border-radius: 18px;
  background: #f8fbff;
  color: #4b5563;
  font-weight: 600;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.reply-form textarea {
  width: 100%;
  min-height: 130px;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  padding: 16px;
  font-size: 0.95rem;
  color: #111827;
}

.reply-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.reply-actions button {
  padding: 12px 18px;
  border-radius: 14px;
  background: #4f46e5;
  color: white;
}

.community-panel {
  display: grid;
  gap: 16px;
}

.small-card {
  background: #f8fbff;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  padding: 18px;
}

.small-card h4 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.small-card p,
.small-card ul {
  margin: 0;
  color: #4b5563;
  line-height: 1.7;
}

.small-card ul { padding-left: 18px; }

.reply-root { margin-bottom: 18px; }

.highlight {
  animation: highlightFlash 2s ease-in-out;
}

@keyframes highlightFlash {
  0% { background: rgba(99,102,241,0.12); border-radius: 12px; }
  50% { background: rgba(99,102,241,0.18); }
  100% { background: transparent; }
}

@media (max-width: 1180px) {
  .forum-layout { grid-template-columns: 1fr; }
  .new-post,
  .thread-detail { position: static; }
}

@media (max-width: 720px) {
  .forum-shell { padding: 18px 16px 28px; }
  .forum-header { flex-direction: column; }
  .forum-layout { gap: 18px; }
}
</style>
