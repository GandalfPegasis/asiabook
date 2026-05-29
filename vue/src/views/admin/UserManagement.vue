<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// Mocking the data from: GET /api/admin/users (Maps to your `profile` table)
const users = ref([
  { id: 1, name: 'John Chen', email: 'j.chen@school.edu', role: 'student', department: 'Computer Science', status: 'active', joinDate: '2025-09-01' },
  { id: 2, name: 'Prof. Lin', email: 'lin_w@faculty.com', role: 'teacher', department: 'Information Engineering', status: 'active', joinDate: '2023-02-15' },
  { id: 3, name: 'Sarah Tan', email: 'stan8@mail.com', role: 'student', department: 'Business Admin', status: 'pending', joinDate: '2026-05-28' },
  { id: 4, name: 'Mike Ross', email: 'm.ross@law.edu', role: 'teacher', department: 'Law & Ethics', status: 'active', joinDate: '2021-08-20' },
  { id: 5, name: 'Alex Wu', email: 'awu.design@school.edu', role: 'student', department: 'Graphic Design', status: 'suspended', joinDate: '2024-11-10' },
])

// Filter & Search State
const searchQuery = ref('')
const roleFilter = ref('all') // 'all', 'student', or 'teacher'

// Computed property to handle the search and filter logic automatically
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value
    return matchesSearch && matchesRole
  })
})

// Mock Actions
const toggleUserStatus = (user: any) => {
  if (user.status === 'suspended') {
    user.status = 'active'
  } else if (confirm(`Are you sure you want to suspend ${user.name}? They will not be able to log in.`)) {
    user.status = 'suspended'
    // Here you would call: PUT /api/admin/users/:id/suspend
  }
}

const deleteUser = (userId: number, userName: string) => {
  if (confirm(`CRITICAL: Delete ${userName} entirely? This cascades and deletes all their posts and clubs.`)) {
    users.value = users.value.filter(u => u.id !== userId)
    // Here you would call: DELETE /api/admin/users/:id
  }
}
</script>

<template>
  <div class="user-management">
    
    <header class="page-header">
      <div class="title-section">
        <h1>User Directory</h1>
        <p>Manage profiles, enforce community standards, and audit accounts.</p>
      </div>
      <button class="primary-btn">
        <Icon icon="heroicons:plus" class="btn-icon" />
        <span>Manually Add User</span>
      </button>
    </header>

    <div class="controls-card">
      <div class="search-wrapper">
        <Icon icon="heroicons:magnifying-glass" class="search-icon" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by name or email..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-wrapper">
        <Icon icon="heroicons:funnel" class="filter-icon" />
        <select v-model="roleFilter" class="role-select">
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Role & Dept</th>
            <th>Joined</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            
            <td>
              <div class="user-cell">
                <div class="avatar" :class="user.role">
                  {{ user.name.charAt(0) }}
                </div>
                <div class="user-info">
                  <p class="u-name">{{ user.name }}</p>
                  <p class="u-email">{{ user.email }}</p>
                </div>
              </div>
            </td>

            <td>
              <div class="role-cell">
                <p class="u-role">{{ user.role }}</p>
                <p class="u-dept">{{ user.department }}</p>
              </div>
            </td>

            <td>
              <p class="u-date">{{ new Date(user.joinDate).toLocaleDateString() }}</p>
            </td>

            <td>
              <span :class="['status-pill', user.status]">
                {{ user.status }}
              </span>
            </td>

            <td class="actions-cell">
              <button class="action-btn edit" title="Edit User">
                <Icon icon="heroicons:pencil-square" />
              </button>
              <button 
                class="action-btn" 
                :class="user.status === 'suspended' ? 'restore' : 'suspend'"
                @click="toggleUserStatus(user)"
                :title="user.status === 'suspended' ? 'Restore User' : 'Suspend User'"
              >
                <Icon :icon="user.status === 'suspended' ? 'heroicons:arrow-path' : 'heroicons:no-symbol'" />
              </button>
              <button class="action-btn delete" @click="deleteUser(user.id, user.name)" title="Force Delete">
                <Icon icon="heroicons:trash" />
              </button>
            </td>

          </tr>
          
          <tr v-if="filteredUsers.length === 0">
            <td colspan="5" class="empty-state">
              <Icon icon="heroicons:users" class="empty-icon" />
              <p>No users found matching your search.</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination-footer">
        <p class="page-info">Showing <strong>1</strong> to <strong>{{ filteredUsers.length }}</strong> of <strong>{{ users.length }}</strong> users</p>
        <div class="page-controls">
          <button class="page-btn" disabled>Previous</button>
          <button class="page-btn">Next</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.user-management {
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

.title-section h1 {
  font-size: 2rem;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.title-section p {
  color: #64748b;
  margin: 0;
}

.primary-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.primary-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

/* Controls (Search & Filter) */
.controls-card {
  background: white;
  padding: 1.25rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.search-wrapper {
  flex-grow: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  font-size: 1.2rem;
}

.search-input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.filter-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 200px;
}

.filter-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  z-index: 1;
}

.role-select {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #334155;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.role-select:focus { border-color: #6366f1; }

/* Data Table */
.table-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  background: #f8fafc;
  text-align: left;
  padding: 1.25rem 1.5rem;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.admin-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

/* Table Cells */
.user-cell { display: flex; align-items: center; gap: 1rem; }
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
}
.avatar.student { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
.avatar.teacher { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }

.u-name { margin: 0; font-weight: 600; color: #0f172a; font-size: 0.95rem; }
.u-email { margin: 0; color: #64748b; font-size: 0.85rem; }

.u-role { margin: 0; font-weight: 600; color: #334155; text-transform: capitalize; font-size: 0.9rem;}
.u-dept { margin: 0; color: #94a3b8; font-size: 0.85rem; }

.u-date { margin: 0; color: #475569; font-size: 0.9rem; font-weight: 500;}

/* Status Pills */
.status-pill {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status-pill.active { background: #dcfce7; color: #15803d; }
.status-pill.pending { background: #fef9c3; color: #a16207; }
.status-pill.suspended { background: #fee2e2; color: #b91c1c; }

/* Actions */
.text-right { text-align: right; }
.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.action-btn {
  background: white;
  border: 1px solid #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.action-btn.edit:hover { color: #6366f1; border-color: #c7d2fe; background: #eef2ff; }
.action-btn.suspend:hover { color: #f59e0b; border-color: #fde68a; background: #fffbeb; }
.action-btn.restore:hover { color: #10b981; border-color: #a7f3d0; background: #ecfdf5; }
.action-btn.delete:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }

/* Empty State */
.empty-state { text-align: center; padding: 4rem 2rem !important; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }

/* Pagination */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: white;
}
.page-info { margin: 0; color: #64748b; font-size: 0.9rem; }
.page-controls { display: flex; gap: 0.5rem; }
.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  font-size: 0.9rem;
}
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-btn:not(:disabled):hover { background: #f8fafc; }
</style>