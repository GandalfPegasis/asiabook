<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const router = useRouter();

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

const gotoClub = (clubId: number) => {
  router.push({ name: 'club-detail', params: { id: String(clubId) } });
};
</script>

<template>
  <div class="page-container">
    
    <header class="page-header">
      <h1>Discover Clubs</h1>
      <p>Find your community. Join a club to participate in specialized forums and discussions.</p>
    </header>

    <div class="clubs-grid">
      <div v-for="club in clubs" :key="club.id" class="club-card" @click="gotoClub(club.id)">
        <div class="club-icon-wrapper">
          <Icon :icon="club.icon" class="club-icon" />
        </div>
        <div class="club-content">
          <h2 class="club-title">{{ club.title }}</h2>
          <p class="club-description">{{ club.description }}</p>
        </div>
        <button class="join-btn">
          <span>View Club</span>
          <Icon icon="mdi:arrow-right" class="btn-icon" />
        </button>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
/* Base Layout & Typography */
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 3rem 2rem;
  box-sizing: border-box;
}

h1, h2, p {
  margin: 0;
}

/* Header */
.page-header {
  max-width: 1200px;
  margin: 0 auto 3rem auto;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  color: #475569;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Grid Layout */
.clubs-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
}

.club-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 32px rgba(15, 23, 42, 0.08);
  border-color: #c7d2fe;
}

/* Icons */
.club-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}

.club-card:hover .club-icon-wrapper {
  transform: scale(1.05);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.club-icon {
  width: 32px;
  height: 32px;
}

/* Card Content */
.club-content {
  flex-grow: 1;
  margin-bottom: 2rem;
}

.club-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.club-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #64748b;
}

/* Action Button */
.join-btn {
  width: 100%;
  justify-content: center;
  background: transparent;
  border: 2px solid #e0e7ff;
  color: #6366f1;
  padding: 0.85rem 1.5rem;
  border-radius: 16px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.join-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.15);
}

.btn-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.join-btn:hover .btn-icon {
  transform: translateX(4px);
}

/* Mobile Adjustments */
@media (max-width: 720px) {
  .page-container {
    padding: 2rem 1rem;
  }
  
  .club-card {
    padding: 2rem 1.5rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
}
</style>