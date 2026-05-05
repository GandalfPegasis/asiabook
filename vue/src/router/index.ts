import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:id?',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('../views/FriendsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/messages/:id?',
      name: 'messages',
      component: () => import('../views/MessageView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/forums',
      name: 'forums',
      component: () => import('../views/ForumView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/clubs',
      name: 'clubs',
      component: () => import('../views/ClubView.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to, from) => {
  const { isAuthenticated, initAuth } = useAuth()
  
  initAuth()
  
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !isAuthenticated.value) {
    return '/login'
  } else if ((to.name === 'login' || to.name === 'signup') && isAuthenticated.value) {
    return '/home'
  }
})

export default router
