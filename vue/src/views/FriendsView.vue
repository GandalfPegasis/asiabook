<script setup lang="ts">
import { ref } from 'vue'

// --- Interfaces ---
interface Friend {
  id: number
  name: string
  username: string
  status: 'online' | 'offline' | 'away'
  avatar: string
}

interface FriendRequest {
  id: number
  name: string
  username: string
  avatar: string
  mutualFriends: number
}

// --- Mock Data ---
const friendRequests = ref<FriendRequest[]>([
  {
    id: 101,
    name: 'Emma Wilson',
    username: '@emma_w',
    avatar: 'https://i.pravatar.cc/150?img=9',
    mutualFriends: 12
  },
  {
    id: 102,
    name: 'James Taylor',
    username: '@jtaylor',
    avatar: 'https://i.pravatar.cc/150?img=12',
    mutualFriends: 3
  }
])

const friends = ref<Friend[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    username: '@alicej',
    status: 'online',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    name: 'Michael Chen',
    username: '@mike_c',
    status: 'offline',
    avatar: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 3,
    name: 'Sarah Williams',
    username: '@sarahw',
    status: 'away',
    avatar: 'https://i.pravatar.cc/150?img=5'
  },
  {
    id: 4,
    name: 'David Smith',
    username: '@dsmith99',
    status: 'online',
    avatar: 'https://i.pravatar.cc/150?img=8'
  }
])

// --- Mock Actions ---
const acceptRequest = (id: number) => {
  // In a real app, you would make an API call here.
  // For now, we just remove it from the UI.
  friendRequests.value = friendRequests.value.filter(req => req.id !== id)
}

const declineRequest = (id: number) => {
  friendRequests.value = friendRequests.value.filter(req => req.id !== id)
}
</script>

<template>
  <div class="friends-container">
    
    <section v-if="friendRequests.length > 0" class="content-section">
      <header class="section-header">
        <h2>Friend Requests</h2>
        <span class="badge">{{ friendRequests.length }} New</span>
      </header>

      <div class="requests-list">
        <div v-for="request in friendRequests" :key="request.id" class="request-card">
          <img :src="request.avatar" :alt="request.name" class="request-avatar" />
          
          <div class="request-info">
            <h3 class="name">{{ request.name }}</h3>
            <span class="meta-text">{{ request.mutualFriends }} mutual friends</span>
          </div>

          <div class="request-actions">
            <button @click="acceptRequest(request.id)" class="btn primary">Accept</button>
            <button @click="declineRequest(request.id)" class="btn danger">Decline</button>
          </div>
        </div>
      </div>
    </section>

    <section class="content-section">
      <header class="section-header">
        <h2>My Friends</h2>
        <span class="meta-text">{{ friends.length }} Friends</span>
      </header>

      <div class="friends-grid">
        <div v-for="friend in friends" :key="friend.id" class="friend-card">
          
          <div class="avatar-wrapper">
            <img :src="friend.avatar" :alt="friend.name" class="avatar" />
            <span :class="['status-indicator', friend.status]"></span>
          </div>

          <div class="friend-info">
            <h3 class="name">{{ friend.name }}</h3>
            <span class="meta-text">{{ friend.username }}</span>
          </div>

          <div class="actions">
            <button class="btn primary">Message</button>
            <button class="btn secondary">Profile</button>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>

.content-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding-bottom: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text, #1e293b);
}

.meta-text {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.badge {
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: bold;
}

/* --- Friend Requests List --- */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  display: flex;
  align-items: center;
  background: var(--color-background-soft, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  transition: box-shadow 0.2s ease;
}

.request-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.request-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1.5rem;
}

.request-info {
  flex-grow: 1;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .request-card {
    flex-direction: column;
    text-align: center;
  }
  .request-avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  .request-actions {
    margin-top: 1rem;
    width: 100%;
  }
  .request-actions .btn {
    flex: 1;
  }
}

/* --- Friends Grid --- */
.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.friend-card {
  background: var(--color-background-soft, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* .friend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
} */

/* Avatar & Status */
.avatar-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.status-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.online { background-color: #22c55e; }
.offline { background-color: #94a3b8; }
.away { background-color: #f59e0b; }

/* Text Info */
.friend-info {
  margin-bottom: 1.5rem;
}

.name {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: var(--color-text, #1e293b);
}

/* --- Buttons --- */
.actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.actions .btn {
  flex: 1;
}

.btn.primary {
  background-color: #3b82f6;
  color: white;
}

.btn.primary:hover {
  background-color: #2563eb;
}

.btn.secondary {
  background-color: #f1f5f9;
  color: #475569;
}

.btn.secondary:hover {
  background-color: #e2e8f0;
}

.btn.danger {
  background-color: #fee2e2;
  color: #ef4444;
}

.btn.danger:hover {
  background-color: #fecaca;
}
</style>