<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

// Mocking the data you would fetch from: GET /clubs
const clubs = ref([
  { 
    id: 1, 
    title: 'Software Engineering Hub', 
    description: 'Discussions on full-stack development, JavaFX, Node.js, and building SaaS platforms.',
    icon: 'mdi:code-brackets'
  },
  { 
    id: 2, 
    title: 'Taiwan Riders', 
    description: 'Planning island-loop (Huandao) trips, scooter maintenance, and sharing mountain routes.',
    icon: 'mdi:motorcycle'
  },
  { 
    id: 3, 
    title: 'IDX Quant Trading', 
    description: 'Algorithmic trading on the Indonesian Stock Exchange, technical analysis, and corporate actions.',
    icon: 'carbon:chart-candlestick'
  },
  { 
    id: 4, 
    title: 'Expat Network', 
    description: 'Navigating life overseas, from banking and language learning to finding local opportunities.',
    icon: 'tabler:building-community'
  },
  { 
    id: 5, 
    title: 'Skincare & Wellness', 
    description: 'Sharing routines, non-comedogenic product recommendations, and general wellness tips.',
    icon: 'mdi:bottle-tonic-outline'
  },
  { 
    id: 6, 
    title: 'Cloud Builders', 
    description: 'Practical discussions on cloud infrastructure, Docker, and deployment pipelines.',
    icon: 'mdi:cloud-outline'
  }
]);
</script>

<template>
  <div class="page-container">
    
    <header class="page-header">
      <h1>Discover Clubs</h1>
      <p>Find your community. Join a club to participate in specialized forums and discussions.</p>
    </header>

    <div class="clubs-grid">
      <div v-for="club in clubs" :key="club.id" class="club-card">
        <div class="club-icon-wrapper">
          <Icon :icon="club.icon" class="club-icon" />
        </div>
        <div class="club-content">
          <h2 class="club-title">{{ club.title }}</h2>
          <p class="club-description">{{ club.description }}</p>
        </div>
        <button class="join-btn">
          <span>Join Club</span>
          <Icon icon="mdi:arrow-right" class="btn-icon" />
        </button>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.page-container {
  
  /* Layout & Functional Colors */
  --card-bg: rgba(28, 114, 142, 0.08);
  --card-hover: rgba(76, 191, 228, 0.12);
  --border-color: rgba(28, 114, 142, 0.4);

  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 40px 24px;
  box-sizing: border-box;
}

h1, h2, p {
  margin: 0;
}

/* Header */
.page-header {
  max-width: 1200px;
  margin: 0 auto 40px auto;
  text-align: center;
}

.page-header h1 {
  font-size: 36px;
  color: var(--primary-color);
  margin-bottom: 12px;
  font-weight: 700;
}

.page-header p {
  font-size: 16px;
  color: var(--text-color);
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Grid Layout */
.clubs-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .clubs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .clubs-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Card Styling */
.club-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}

.club-card:hover {
  transform: translateY(-4px);
  background-color: var(--card-hover);
  border-color: var(--accent-color);
}

.club-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(139, 204, 226, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.club-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.club-content {
  flex-grow: 1;
  margin-bottom: 24px;
}

.club-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.club-description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
  opacity: 0.85;
}

/* Button */
.join-btn {
  background: transparent;
  border: 1px solid var(--secondary-color);
  color: var(--accent-color);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.join-btn:hover {
  background-color: var(--secondary-color);
  color: var(--text-color);
}

.btn-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.join-btn:hover .btn-icon {
  transform: translateX(4px);
}
</style>