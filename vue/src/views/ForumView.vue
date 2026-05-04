<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

// 1. Club Categories
const clubCategories = ref([
  { id: 1, name: 'General Tech', icon: 'mdi:code-brackets' }, 
  { id: 2, name: 'Riders Club', icon: 'mdi:motorcycle' },     
  { id: 3, name: 'Investors', icon: 'carbon:chart-candlestick' }, 
  { id: 4, name: 'Expat Life', icon: 'tabler:building-community' } 
]);

// 2. Mock Forum Data 
const recentPosts = ref([
  {
    id: 1,
    title: 'JavaFX vs Web for Desktop SaaS',
    author: 'Alice Smith',
    role: 'student',
    description: 'I am building a management system. Is JavaFX still a good choice for the desktop client, or should I just wrap a Node.js/Express web app?',
    replies: 12,
    timeAgo: '2 hours ago'
  },
  {
    id: 2,
    title: 'Best route for Huandao in Autumn?',
    author: 'Chen Wei',
    role: 'student',
    description: 'Planning to loop the island on my scooter this October or November. Anyone have recommendations for the east coast segments?',
    replies: 34,
    timeAgo: '5 hours ago'
  },
  {
    id: 3,
    title: 'IDX Algorithmic Trading with Python',
    author: 'Budi Santoso',
    role: 'student',
    description: 'Looking for resources on implementing MACD and RSI trading bots for the Indonesian Stock Exchange. Any library recommendations?',
    replies: 8,
    timeAgo: '1 day ago'
  },
  {
    id: 4,
    title: 'Mandarin phrases for banking in Taiwan',
    author: 'Chloe Dubois',
    role: 'student',
    description: 'I need to open a bank account next week. What are the essential local phrases I should know so I can navigate the process smoothly?',
    replies: 21,
    timeAgo: '2 days ago'
  }
]);
</script>

<template>
  <div class="forum-container">
    
    <header class="forum-header">
      <h1>
        <Icon icon="mdi:forum" class="header-icon" />
        Community Forums
      </h1>
      <p>Join a club and start discussing.</p>
    </header>

    <section class="forum-section">
      <h2>Browse Clubs</h2>
      <div class="club-grid">
        <div 
          v-for="club in clubCategories" 
          :key="club.id"
          class="club-card"
        >
          <Icon :icon="club.icon" class="club-icon" />
          <span class="club-name">{{ club.name }}</span>
        </div>
      </div>
    </section>

    <section class="forum-section">
      <h2>Recent Discussions</h2>
      <div class="post-list-container">
        
        <div 
          v-for="(post, index) in recentPosts" 
          :key="post.id"
          class="post-card"
          :class="{ 'border-bottom': index !== recentPosts.length - 1 }"
        >
          <div class="post-header">
            <h3 class="post-title">{{ post.title }}</h3>
            <span class="post-time">
              <Icon icon="mdi:clock-outline" /> {{ post.timeAgo }}
            </span>
          </div>
          
          <p class="post-description">{{ post.description }}</p>
          
          <div class="post-footer">
            <div class="author-info">
              <div class="author-avatar">
                {{ post.author.charAt(0) }}
              </div>
              <span class="author-name">{{ post.author }}</span>
              <span class="author-role">{{ post.role }}</span>
            </div>
            
            <div class="post-replies">
              <Icon icon="mdi:message-reply-text" />
              <span>{{ post.replies }} replies</span>
            </div>
          </div>
        </div>
        
      </div>
    </section>
    
  </div>
</template>

<style scoped>
.forum-container {
  /* Derived colors for subtle depths and borders */
  --card-bg: rgba(28, 114, 142, 0.08);
  --hover-bg: rgba(76, 191, 228, 0.12);
  --border-color: rgba(28, 114, 142, 0.4);

  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
  box-sizing: border-box;
}

h1, h2, h3, p {
  margin: 0;
}

/* Header */
.forum-header {
  margin-bottom: 32px;
}

.forum-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: var(--accent-color);
}

.forum-header p {
  color: var(--text-color);
  opacity: 0.8;
  margin-top: 8px;
}

/* Sections */
.forum-section {
  margin-bottom: 40px;
}

.forum-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
}

/* Club Grid */
.club-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .club-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.club-card {
  background-color: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.club-card:hover {
  background-color: var(--hover-bg);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.club-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: var(--primary-color);
}

.club-name {
  font-weight: 500;
  color: var(--text-color);
}

/* Posts List */
.post-list-container {
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.post-card {
  padding: 24px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.post-card:hover {
  background-color: var(--hover-bg);
}

.border-bottom {
  border-bottom: 1px solid var(--border-color);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
  transition: color 0.2s;
}

.post-card:hover .post-title {
  color: var(--accent-color);
}

.post-time {
  font-size: 14px;
  color: var(--text-color);
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  margin-left: 16px;
}

.post-description {
  color: var(--text-color);
  opacity: 0.85;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-color);
}

.author-name {
  font-weight: 500;
  color: var(--text-color);
}

.author-role {
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: rgba(28, 114, 142, 0.3);
  border: 1px solid var(--secondary-color);
  color: var(--accent-color);
  font-size: 12px;
}

.post-replies {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-color);
}
</style>