<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

// Define props with default values (defaults to a standard 404)
const props = defineProps({
  code: {
    type: String,
    default: '404'
  },
  title: {
    type: String,
    default: 'Page Not Found'
  },
  message: {
    type: String,
    default: "We looked everywhere, but we couldn't find the page you're looking for."
  }
})

// Dynamically choose an icon based on the error code
const errorIcon = computed(() => {
  if (props.code === '403') return 'heroicons:shield-exclamation'
  if (props.code === '500') return 'heroicons:server-crash'
  return 'heroicons:map' // Default 404 icon
})

const goBack = () => {
  // If they have history, go back. Otherwise, go to home.
  if (window.history.length > 2) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="error-page">
    <div class="error-card">
      
      <div class="error-graphic">
        <div class="icon-wrapper" :class="`theme-${code}`">
          <Icon :icon="errorIcon" class="main-icon" />
        </div>
        <h1 class="error-code">{{ code }}</h1>
      </div>

      <div class="error-content">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
      </div>

      <div class="action-buttons">
        <button class="primary-btn" @click="router.push({ name: 'home' })">
          <Icon icon="heroicons:home" class="btn-icon" />
          <span>Return to Feed</span>
        </button>
        <button class="secondary-btn" @click="goBack">
          <span>Go Back</span>
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  padding: 2rem;
  font-family: 'Inter', -apple-system, sans-serif;
}

.error-card {
  background: white;
  border-radius: 24px;
  padding: 4rem 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.05);
}

/* Graphic Area */
.error-graphic {
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
}

.icon-wrapper {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
}

/* Thematic Colors based on error code */
.theme-404 { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; }
.theme-403 { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; }
.theme-500 { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }

.main-icon {
  font-size: 3rem;
}

.error-code {
  font-size: 8rem;
  font-weight: 800;
  color: #f1f5f9;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  margin: 0;
  letter-spacing: -0.05em;
  user-select: none;
}

/* Content Area */
.error-content h2 {
  font-size: 1.75rem;
  color: #0f172a;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.error-content p {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
}

/* Actions */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.primary-btn, .secondary-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.primary-btn {
  background: #6366f1;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.primary-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

.secondary-btn {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.secondary-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}
</style>