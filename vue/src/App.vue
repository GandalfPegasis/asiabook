<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Icon } from '@iconify/vue'

const router = useRouter()
const { isAuthenticated, user, logout } = useAuth()
const showProfileMenu = ref(false)

const handleLogout = () => {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <header v-if="isAuthenticated" class="app-header">
      <div class="header-content">
        <nav class="navbar">
          <RouterLink :to="{ name: 'home' }" class="nav-item">
            <Icon icon="mdi:home" class="nav-icon" /> 
            <span>Home</span>
          </RouterLink>

          <RouterLink :to="{ name: 'friends' }" class="nav-item">
            <Icon icon="mdi:account-group" class="nav-icon" /> 
            <span>Friends</span>
          </RouterLink>

          <RouterLink :to="{ name: 'messages' }" class="nav-item">
            <Icon icon="mdi:message" class="nav-icon" /> 
            <span>Messages</span>
          </RouterLink>

          <RouterLink :to="{ name: 'forums' }" class="nav-item">
            <Icon icon="mdi:forum" class="nav-icon" /> 
            <span>Forums</span>
          </RouterLink>

          <RouterLink :to="{ name: 'clubs' }" class="nav-item">
            <Icon icon="fluent:building-people-20-filled" class="nav-icon" />
            <span>Clubs</span>
          </RouterLink>
        </nav>

        <div class="profile-section">
          <div class="profile-dropdown">
            <button 
              class="profile-button"
              @click="showProfileMenu = !showProfileMenu"
              :aria-expanded="showProfileMenu">
              <div class="profile-avatar">
                {{ user?.name?.charAt(0).toUpperCase() }}
              </div>
            </button>

            <transition name="dropdown">
              <div v-if="showProfileMenu" class="dropdown-menu">
                <div class="dropdown-header">
                  <div class="header-avatar">{{ user?.name?.charAt(0).toUpperCase() }}</div>
                  <div>
                    <div class="header-name">{{ user?.name }}</div>
                    <div class="header-email">{{ user?.email }}</div>
                  </div>
                </div>

                <router-link 
                  :to="{ name: 'profile' }" 
                  class="dropdown-item"
                  @click="showProfileMenu = false">
                  <Icon icon="mdi:account" />
                  <span>My Profile</span>
                </router-link>

                <button 
                  class="dropdown-item logout"
                  @click="handleLogout">
                  <Icon icon="mdi:logout" />
                  <span>Sign Out</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </header>

    <main :class="{ 'with-header': isAuthenticated }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.navbar {
  display: flex;
  align-items: center;
  gap: 0;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  position: relative;
}

.nav-item:hover {
  color: #1e293b;
}

.nav-item.router-link-active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

.nav-icon {
  font-size: 1.3rem;
}

.profile-section {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.profile-dropdown {
  position: relative;
}

.profile-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.profile-button:hover {
  transform: scale(1.05);
}

.profile-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  min-width: 260px;
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.header-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.header-email {
  color: #64748b;
  font-size: 0.85rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  color: #1e293b;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #6366f1;
}

.dropdown-item.logout {
  color: #dc2626;
  border-top: 1px solid #e2e8f0;
}

.dropdown-item.logout:hover {
  background-color: #fef2f2;
}

main {
  flex: 1;
  width: 100%;
}

main.with-header {
  margin-top: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }

  .nav-item {
    padding: 0.75rem 0.85rem;
    font-size: 0.9rem;
  }

  .nav-item span {
    display: none;
  }

  .profile-avatar,
  .header-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
