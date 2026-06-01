<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
// Reusing your auth composable to handle logging out of the admin panel
const { logout, user } = useAuth()

// Define your admin routes here (ensure the routeName matches your router/index.ts)
const navItems = [
  { name: 'Dashboard', routeName: 'admin-dashboard', icon: 'heroicons:home-solid' },
  { name: 'User Management', routeName: 'admin-users', icon: 'heroicons:identification-solid' },
  { name: 'Forum Oversight', routeName: 'admin-forum', icon: 'heroicons:building-library-solid' },
  { name: 'Club Oversight', routeName: 'admin-club', icon: 'heroicons:building-library-solid' },
  { name: 'Moderation Feed', routeName: 'admin-moderation', icon: 'heroicons:shield-check-solid' },
  // { name: 'System Settings', routeName: 'admin-system-settings', icon: 'heroicons:cog-8-tooth-solid' },
]

const handleLogout = () => {
  logout();
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="admin-layout">
    
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <Icon icon="mdi:shield-crown" />
        </div>
        <span>Admin Console</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.name" 
          :to="{ name: item.routeName }" 
          class="nav-link"
          active-class="active"
        >
          <Icon :icon="item.icon" class="nav-icon" />
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="exit-btn" @click="handleLogout">
          <Icon icon="mdi:arrow-left-box" class="nav-icon" />
          <span>Log out</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      
      <!-- <header class="admin-topbar">
        <div class="topbar-left">
          </div>
        
        <div class="topbar-right">
          <button class="icon-btn">
            <Icon icon="heroicons:bell" />
            <span class="notification-dot"></span>
          </button>
          
          <div class="admin-profile">
            <div class="admin-avatar">
              {{ user?.name?.charAt(0).toUpperCase() || 'A' }}
            </div>
            <div class="admin-info">
              <p class="admin-name">{{ user?.name || 'System Admin' }}</p>
              <p class="admin-role">Superuser</p>
            </div>
          </div>
        </div>
      </header> -->

      <div class="page-container">
        <RouterView />
      </div>

    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* SIDEBAR STYLES */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 3rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: #0f172a;
}

.logo-icon {
  background: #6366f1;
  color: white;
  padding: 0.5rem;
  border-radius: 12px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-grow: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  text-decoration: none;
  color: #64748b;
  border-radius: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #6366f1;
}

/* Vue Router will automatically apply this class when the route matches */
.nav-link.active {
  background: #e0e7ff;
  color: #6366f1;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.25rem;
}

.sidebar-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  margin-top: auto;
}

.exit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.2s;
}

.exit-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* MAIN CONTENT STYLES */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevents flexbox overflow issues */
}

/* ADMIN TOPBAR */
.admin-topbar {
  height: 70px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  position: relative;
  transition: all 0.2s;
}

.icon-btn:hover {
  color: #6366f1;
  border-color: #c7d2fe;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-left: 1px solid #e2e8f0;
  padding-left: 1.5rem;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.admin-info p { margin: 0; }
.admin-name { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
.admin-role { font-size: 0.75rem; color: #64748b; font-weight: 500; }

/* PAGE CONTAINER */
.page-container {
  padding: 3rem;
  flex-grow: 1;
}

@media (max-width: 1024px) {
  .sidebar { width: 80px; padding: 2rem 1rem; }
  .sidebar span, .admin-info { display: none; }
  .admin-topbar { padding: 0 1.5rem; }
  .page-container { padding: 1.5rem; }
}
</style>