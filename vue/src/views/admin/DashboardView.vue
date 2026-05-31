<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { apiClient } from '@/api/api';

interface KPIDataInterface {
  total_club: number | 0,
  total_post: number | 0,
  total_user: number | 0,
  total_forum: number | 0
}

const KPIData = ref<KPIDataInterface>();
const KPILoading = ref(true);

const fetchKPIData = async () => {
  try {
    
    const data = await apiClient.get("/admin/dashboard")
    
    KPIData.value = data.data?.data;
  } catch (e) {
    console.log(e);
  } finally {
    KPILoading.value = false;
  }
}

type StatItem = {
  label: string;
  key: keyof KPIDataInterface; // <-- This is the magic part
  icon: string;
  color: string;
};

const stats = ref<StatItem[]>([
  { label: 'Total Users', key: "total_user", icon: 'heroicons:users-solid', color: '#6366f1' },
  { label: 'Total Posts', key: "total_post", icon: 'heroicons:chat-bubble-left-right-solid', color: '#8b5cf6' },
  { label: 'Active Clubs', key: "total_club", icon: 'heroicons:user-group-solid', color: '#ec4899' },
  { label: 'Total Forums', key: "total_forum", icon: 'heroicons:chat-bubble-left-right-solid', color: '#f59e0b' },
]);

// Mock Recent Users from the `profile` table
const recentUsers = ref([
  { id: 1, name: 'John Chen', email: 'j.chen@school.edu', role: 'student', dept: 'CS', status: 'Active' },
  { id: 2, name: 'Prof. Lin', email: 'lin_w@faculty.com', role: 'teacher', dept: 'EE', status: 'Active' },
  { id: 3, name: 'Sarah Tan', email: 'stan8@mail.com', role: 'student', dept: 'Business', status: 'Pending' },
  { id: 4, name: 'Mike Ross', email: 'm.ross@law.edu', role: 'teacher', dept: 'Law', status: 'Active' },
]);

onMounted(() => {
  fetchKPIData();
})
</script>

<template>
  <div class="admin-container">
    <main class="main-content">
      <header class="content-header">
        <div class="header-titles">
          <h1>Command Center</h1>
          <p>Welcome back, Admin. Here is what's happening today.</p>
        </div>
        <div class="header-actions">
          <button class="icon-btn"><Icon icon="heroicons:bell" /></button>
          <button class="primary-btn">Generate Report</button>
        </div>
      </header>

      <div class="kpi-loading" v-if="KPILoading">
        loading
      </div>
      <section class="stats-grid" v-else>
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
            <Icon :icon="stat.icon" />
          </div>
          <div class="stat-info">
            <h3>{{ KPIData?.[stat.key] ?? "0" }}</h3>
            <p>{{ stat.label }}</p>
          </div>
        </div>
      </section>

      <section class="data-section">
        <div class="data-card">
          <div class="card-header">
            <h2>Recent User Registrations</h2>
            <button class="text-btn">View All</button>
          </div>
          
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in recentUsers" :key="user.id">
                <td>
                  <div class="user-cell">
                    <span class="user-initials">{{ user.name.charAt(0) }}</span>
                    <div>
                      <p class="u-name">{{ user.name }}</p>
                      <p class="u-email">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="capitalize">{{ user.role }}</td>
                <td>{{ user.dept }}</td>
                <td>
                  <span :class="['status-pill', user.status.toLowerCase()]">
                    {{ user.status }}
                  </span>
                </td>
                <td>
                  <button class="action-icon"><Icon icon="heroicons:ellipsis-horizontal" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="data-card side-info">
          <h2>System Health</h2>
          <div class="health-item">
            <div class="health-meta">
              <span>Database (MySQL)</span>
              <span class="online">Online</span>
            </div>
            <div class="health-bar"><div class="bar-fill" style="width: 100%"></div></div>
          </div>
          <div class="health-item">
            <div class="health-meta">
              <span>Express API Latency</span>
              <span>24ms</span>
            </div>
            <div class="health-bar"><div class="bar-fill" style="width: 15%; background: #10b981"></div></div>
          </div>
          <p class="health-note">All systems operational. Cascading deletes enabled for forum nodes.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Color Variables matching your Discovery page */
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --bg: #f8fafc;
  --sidebar-bg: #ffffff;
  --text-dark: #0f172a;
  --text-light: #64748b;
  --border: #e2e8f0;
}

.admin-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
  font-size: 1rem;
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

.nav-link.active {
  background: #e0e7ff;
  color: #6366f1;
}

.nav-icon {
  font-size: 1.25rem;
}

/* MAIN CONTENT STYLES */
.main-content {
  flex-grow: 1;
  padding: 3rem;
  max-width: 1400px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.header-titles h1 {
  font-size: 2.25rem;
  color: #0f172a;
  margin: 0;
}

.header-titles p {
  color: #64748b;
  margin-top: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* KPI CARDS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-info h3 {
  font-size: 1.5rem;
  margin: 0;
  color: #0f172a;
}

.stat-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

/* DATA CARD & TABLES */
.data-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.data-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  padding: 1rem;
  color: #64748b;
  font-size: 0.875rem;
  border-bottom: 1px solid #f1f5f9;
}

.admin-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #f8fafc;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-initials {
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #6366f1;
}

.u-name { font-weight: 600; color: #0f172a; margin: 0;}
.u-email { font-size: 0.75rem; color: #94a3b8; margin: 0;}

.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.pending { background: #fef9c3; color: #854d0e; }

/* UTILS */
.primary-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
}

.capitalize { text-transform: capitalize; }

@media (max-width: 1024px) {
  .data-section { grid-template-columns: 1fr; }
  .sidebar { width: 80px; padding: 2rem 1rem; }
  .sidebar span, .admin-info { display: none; }
}
</style>