import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import MainLayout from '@/layouts/MainLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import ErrorView from '@/views/ErrorView.vue';

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
            component: MainLayout,
            children: [
                {
                    path: '',
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
                    path: '/profile/edit',
                    name: 'profile-edit',
                    component: () => import('../views/EditProfileView.vue'),
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
                    path: '/forums/:id',
                    name: 'thread',
                    component: () => import('../views/ThreadView.vue'),
                    props: true,
                    meta: { requiresAuth: true }
                },
                {
                    path: '/clubs',
                    name: 'clubs',
                    component: () => import('../views/ClubView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/clubs/:id',
                    name: 'club-detail',
                    component: () => import('../views/ClubDetailView.vue'),
                    props: true,
                    meta: { requiresAuth: true }
                },
            ]
        },
        {
            path: '/admin',
            component: AdminLayout,
            children: [
                {
                    path: 'dashboard',
                    name: 'admin-dashboard',
                    component: () => import('../views/admin/DashboardView.vue'),
                    meta: { requiresAuth: true, isAdmin: true }
                },
                {
                    path: 'user',
                    name: 'admin-users',
                    component: () => import('../views/admin/UserManagement.vue'),
                    meta: { requiresAuth: true, isAdmin: true }
                },
                {
                    path: 'forum',
                    name: 'admin-forum',
                    component: () => import('../views/admin/ForumOversight.vue'),
                    meta: { requiresAuth: true, isAdmin: true }
                },
                {
                    path: 'club',
                    name: 'admin-club',
                    component: () => import('../views/admin/ClubOversight.vue'),
                    meta: { requiresAuth: true, isAdmin: true }
                },
                {
                    path: 'moderation',
                    name: 'admin-moderation',
                    component: () => import('../views/admin/ModerationFeed.vue'),
                    meta: { requiresAuth: true, isAdmin: true }
                },
                {
                    path: 'system-settings',
                    name: 'admin-system-settings',
                    component: () => import('../views/admin/SystemSettings.vue'),
                    meta: { requiresAuth: true, isAdmin: true }
                }
            ]
        },
        {
            path: '/forbidden',
            name: 'forbidden',
            component: ErrorView,
            props: { 
                code: '403', 
                title: 'Access Denied', 
                message: 'You do not have the necessary administrator permissions to view this command center.' 
            }
        },
        // The 404 Route
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: ErrorView,
            // No props needed here, it uses the default 404 values we set in the component
        }
    ],
})

router.beforeEach((to, from) => {
    const { isAuthenticated, initAuth } = useAuth()
    
    initAuth()
    
    const requiresAuth = to.meta.requiresAuth !== false

    const requireAdmin = to.meta.isAdmin !== false
    
    if (requiresAuth && !isAuthenticated.value) {
        return '/login'
    } else if ((to.name === 'login' || to.name === 'signup') && isAuthenticated.value) {
        return '/home'
    }
})

export default router
