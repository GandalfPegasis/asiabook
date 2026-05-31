<script setup lang="ts">
import { ref, watch, onMounted } from 'vue' // <-- added watch
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api';

// 1. Interface for the admin objects inside the array
export interface ClubAdmin {
  id: number;
  name: string;
  email: string;
}

// 2. Interface for the main club object
export interface Club {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'reviewing' | 'suspended'; // Using a union type here makes it super strict!
  member_count: number;
  admin_list: ClubAdmin[]; // Array of the ClubAdmin interface
}

const clubs = ref<Club[]>([]);
const clubsLoading = ref(false);

const searchQuery = ref('')
const statusFilter = ref('all')

const fetchClubData = async () => {
  try {
    clubsLoading.value = true;
    
    // Pass the search and status to the server as query parameters
    const res = await apiClient.get("/admin/club", {
      params: {
        search: searchQuery.value || undefined, // Sends undefined if empty (ignores it)
        status: statusFilter.value === 'all' ? undefined : statusFilter.value
      }
    });

    clubs.value = res.data;
  } catch (e) {
    console.log(e);
  } finally {
    clubsLoading.value = false;
  }
};

// Watch for changes in the inputs and re-fetch automatically
let searchTimeout: any;
watch([searchQuery, statusFilter], () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchClubData();
  }, 300); // Waits 300ms after the user stops typing before fetching
});

onMounted(() => {
  fetchClubData();
})

// Moderation Actions
const toggleClubStatus = (club: any) => {
  if (club.status === 'reviewing') {
    club.status = 'active'
    // Call: PUT /api/admin/clubs/:id/approve
  } else if (club.status === 'active') {
    if (confirm(`Suspend "${club.title}"? Members won't be able to post in this club's forums.`)) {
      club.status = 'suspended'
      // Call: PUT /api/admin/clubs/:id/suspend
    }
  } else {
    club.status = 'active'
  }
}

const deleteClub = (clubId: number, clubTitle: string) => {
  if (confirm(`CRITICAL: Permanently delete "${clubTitle}"? This cascades and deletes all forums, replies, and member associations for this club.`)) {
    clubs.value = clubs.value.filter(c => c.id !== clubId)
    // Call: DELETE /api/admin/clubs/:id
  }
}
</script>

<template>
  <div class="club-oversight">
    
    <header class="page-header">
      <div class="title-section">
        <h1>Club Directory & Oversight</h1>
        <p>Monitor campus organizations, assign club leaders, and manage community hubs.</p>
      </div>
      
      <button class="primary-btn">
        <Icon icon="heroicons:plus-circle" class="btn-icon" />
        <span>Create Official Club</span>
      </button>
    </header>

    <div class="controls-card">
      <div class="search-wrapper">
        <Icon icon="heroicons:magnifying-glass" class="search-icon" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search clubs by name or description..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-wrapper">
        <Icon icon="heroicons:funnel" class="filter-icon" />
        <select v-model="statusFilter" class="status-select">
          <option value="all">All Statuses</option>
          <option value="active">Active Clubs</option>
          <option value="reviewing">Pending Review</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Club Information</th>
            <th>Community Size</th>
            <th>Club Leaders</th>
            <th>Status</th>
            <th class="text-right">Manage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="club in clubs" :key="club.id">
            <td class="info-cell">
              <div class="club-icon-wrapper">
                <Icon icon="heroicons:building-library" class="club-icon" />
              </div>
              <div class="club-details">
                <h3 class="c-title">{{ club.title }}</h3>
                <p class="c-desc">{{ club.description }}</p>
              </div>
            </td>

            <td>
              <div class="metric-badge">
                <Icon icon="heroicons:users" class="metric-icon" />
                <span>{{ club.member_count }}</span>
              </div>
            </td>

            <td>
              <div class="leaders-list">
                <span v-for="admin in club.admin_list" :key="admin.id" class="leader-chip">
                  {{ admin.name }}
                </span>
                <span v-if="club.admin_list.length === 0" class="no-leaders">No Admins Assigned</span>
              </div>
            </td>

            <td>
              <span :class="['status-pill', club.status]">
                {{ club.status === 'reviewing' ? 'Pending Review' : club.status }}
              </span>
            </td>

            <td class="actions-cell">
              <button class="action-btn edit" title="Edit Club Details">
                <Icon icon="heroicons:pencil-square" />
              </button>
              
              <button 
                class="action-btn" 
                :class="{
                  'approve': club.status === 'reviewing',
                  'suspend': club.status === 'active',
                  'restore': club.status === 'suspended'
                }"
                @click="toggleClubStatus(club)"
                :title="club.status === 'reviewing' ? 'Approve Club' : (club.status === 'active' ? 'Suspend Club' : 'Restore Club')"
              >
                <Icon :icon="club.status === 'reviewing' ? 'heroicons:check-circle' : (club.status === 'active' ? 'heroicons:pause-circle' : 'heroicons:play-circle')" />
              </button>

              <button class="action-btn delete" @click="deleteClub(club.id, club.title)" title="Delete Club">
                <Icon icon="heroicons:trash" />
              </button>
            </td>

          </tr>
          
          <tr v-if="clubs.length === 0">
            <td colspan="5" class="empty-state">
              <Icon icon="heroicons:building-office-2" class="empty-icon" />
              <p>No clubs found matching your criteria.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.club-oversight {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title-section h1 { font-size: 2rem; color: #0f172a; margin: 0 0 0.5rem 0; }
.title-section p { color: #64748b; margin: 0; }

.primary-btn {
  background: #6366f1; color: white; border: none; padding: 0.85rem 1.5rem;
  border-radius: 14px; font-weight: 600; display: flex; align-items: center;
  gap: 0.5rem; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}
.primary-btn:hover { background: #4f46e5; transform: translateY(-2px); }

/* Controls */
.controls-card {
  background: white; padding: 1.25rem; border-radius: 20px;
  border: 1px solid #e2e8f0; margin-bottom: 1.5rem; display: flex; gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.search-wrapper, .filter-wrapper { position: relative; display: flex; align-items: center; }
.search-wrapper { flex-grow: 1; }
.search-icon, .filter-icon { position: absolute; left: 1rem; color: #94a3b8; z-index: 1; }
.search-input, .status-select {
  width: 100%; padding: 0.85rem 1rem 0.85rem 2.8rem; border: 1px solid #e2e8f0;
  border-radius: 12px; font-size: 0.95rem; outline: none; background: #f8fafc;
}
.search-input:focus, .status-select:focus { border-color: #6366f1; }

/* Table */
.table-card {
  background: white; border-radius: 20px; border: 1px solid #e2e8f0;
  overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th {
  background: #f8fafc; text-align: left; padding: 1.25rem 1.5rem;
  color: #64748b; font-size: 0.85rem; font-weight: 600; border-bottom: 1px solid #e2e8f0;
}
.admin-table td {
  padding: 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}

/* Club Info Cell */
.info-cell { display: flex; align-items: flex-start; gap: 1.25rem; max-width: 400px; }
.club-icon-wrapper {
  flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
  color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.club-details { display: flex; flex-direction: column; gap: 0.35rem; }
.c-title { margin: 0; font-weight: 600; color: #0f172a; font-size: 1rem; }
.c-desc { margin: 0; color: #64748b; font-size: 0.85rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Size Cell */
.metric-badge {
  display: inline-flex; align-items: center; gap: 0.5rem; background: #f1f5f9;
  padding: 0.5rem 0.85rem; border-radius: 10px; color: #334155; font-weight: 600; font-size: 0.9rem;
}
.metric-icon { color: #6366f1; font-size: 1.1rem; }

/* Leaders Cell */
.leaders-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.leader-chip {
  background: white; border: 1px solid #cbd5e1; padding: 0.25rem 0.75rem;
  border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #475569;
}
.no-leaders { font-size: 0.8rem; color: #94a3b8; font-style: italic; }

/* Status Pills */
.status-pill {
  padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.75rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
}
.status-pill.active { background: #dcfce7; color: #15803d; }
.status-pill.reviewing { background: #fef9c3; color: #a16207; }
.status-pill.suspended { background: #fee2e2; color: #b91c1c; }

/* Actions */
.text-right { text-align: right; }
.actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }
.action-btn {
  background: white; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s;
}
.action-btn.edit:hover { color: #6366f1; border-color: #c7d2fe; background: #eef2ff; }
.action-btn.approve:hover { color: #10b981; border-color: #a7f3d0; background: #ecfdf5; }
.action-btn.suspend:hover { color: #f59e0b; border-color: #fde68a; background: #fffbeb; }
.action-btn.restore:hover { color: #6366f1; border-color: #c7d2fe; background: #eef2ff; }
.action-btn.delete:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }

/* Empty State */
.empty-state { text-align: center; padding: 4rem 2rem !important; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
</style>