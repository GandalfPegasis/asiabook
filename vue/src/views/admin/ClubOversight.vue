<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api';

export interface ClubAdmin {
  id: number;
  name: string;
  email: string;
}

export interface Club {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'reviewing' | 'suspended';
  member_count: number;
  admin_list: ClubAdmin[];
}

export interface ClubRequest {
  id: number;
  title: string;
  description: string;
  requester_name: string;
  created_at: string;
}

const clubs = ref<Club[]>([]);
const clubsLoading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('all');

const pendingRequests = ref<ClubRequest[]>([]);
const isProcessingRequest = ref(false);

// --- MODAL STATES ---
// 1. Create Modal
const showCreateModal = ref(false);
const isCreating = ref(false);
const createError = ref('');
const newClubForm = ref({ title: '', description: '' });

// 2. Delete Modal
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const deleteError = ref('');
const clubToDelete = ref<{ id: number, title: string } | null>(null);

// 3. Suspend Modal
const showSuspendModal = ref(false);
const isSuspending = ref(false);
const suspendError = ref('');
const clubToSuspend = ref<Club | null>(null);

// 4. Request Modal (Approve & Reject)
const showRequestModal = ref(false);
const requestModalMode = ref<'approve' | 'reject' | null>(null);
const requestError = ref('');
const selectedRequest = ref<{ id: number, title: string } | null>(null);

// 5. Generic Error Modal (Replaces standard alerts)
const showErrorModal = ref(false);
const errorMessage = ref('');


// --- DATA FETCHING ---
const fetchClubData = async () => {
  try {
    clubsLoading.value = true;
    const res = await apiClient.get("/admin/club", {
      params: {
        search: searchQuery.value || undefined,
        status: statusFilter.value === 'all' ? undefined : statusFilter.value
      }
    });
    clubs.value = res.data;
  } catch (e) {
    console.error("Error fetching clubs:", e);
  } finally {
    clubsLoading.value = false;
  }
};

const fetchPendingRequests = async () => {
  try {
    const res = await apiClient.get("/admin/club/club-requests");
    pendingRequests.value = res.data;
  } catch (e) {
    console.error("Error fetching pending requests:", e);
  }
};

let searchTimeout: any;
watch([searchQuery, statusFilter], () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchClubData();
  }, 300);
});

onMounted(() => {
  fetchClubData();
  fetchPendingRequests();
});


// --- ADMIN ACTIONS ---

const triggerErrorModal = (msg: string) => {
  errorMessage.value = msg;
  showErrorModal.value = true;
};

const handleCreateClub = async () => {
  createError.value = '';
  isCreating.value = true;
  
  try {
    await apiClient.post('/admin/club', {
      title: newClubForm.value.title,
      description: newClubForm.value.description,
      status: 'active'
    });
    
    showCreateModal.value = false;
    newClubForm.value = { title: '', description: '' };
    fetchClubData();
  } catch (e: any) {
    createError.value = e.response?.data?.error || 'Failed to create official club.';
  } finally {
    isCreating.value = false;
  }
};

const promptDeleteClub = (clubId: number, clubTitle: string) => {
  clubToDelete.value = { id: clubId, title: clubTitle };
  deleteError.value = '';
  showDeleteModal.value = true;
};

const confirmDeleteClub = async () => {
  if (!clubToDelete.value) return;

  isDeleting.value = true;
  deleteError.value = '';

  try {
    await apiClient.delete(`/admin/club/${clubToDelete.value.id}`);
    clubs.value = clubs.value.filter(c => c.id !== clubToDelete.value!.id);
    
    showDeleteModal.value = false;
    clubToDelete.value = null;
  } catch (e: any) {
    deleteError.value = e.response?.data?.error || "Failed to delete club.";
  } finally {
    isDeleting.value = false;
  }
};

const toggleClubStatus = async (club: Club) => {
  try {
    if (club.status === 'reviewing') {
      await apiClient.put(`/admin/club/${club.id}/approve`);
      club.status = 'active';
    } else if (club.status === 'active') {
      clubToSuspend.value = club;
      suspendError.value = '';
      showSuspendModal.value = true;
    } else {
      await apiClient.put(`/admin/club/${club.id}/restore`);
      club.status = 'active';
    }
  } catch (e: any) {
    triggerErrorModal(e.response?.data?.error || "Failed to change club status.");
  }
};

const confirmSuspendClub = async () => {
  if (!clubToSuspend.value) return;

  isSuspending.value = true;
  suspendError.value = '';

  try {
    await apiClient.put(`/admin/club/${clubToSuspend.value.id}/suspend`);
    const target = clubs.value.find(c => c.id === clubToSuspend.value!.id);
    if (target) target.status = 'suspended';
    
    showSuspendModal.value = false;
    clubToSuspend.value = null;
  } catch (e: any) {
    suspendError.value = e.response?.data?.error || "Failed to suspend club.";
  } finally {
    isSuspending.value = false;
  }
};

// --- REQUEST MODERATION ACTIONS ---

const promptApproveRequest = (requestId: number, title: string) => {
  selectedRequest.value = { id: requestId, title };
  requestModalMode.value = 'approve';
  requestError.value = '';
  showRequestModal.value = true;
};

const promptRejectRequest = (requestId: number, title: string) => {
  selectedRequest.value = { id: requestId, title };
  requestModalMode.value = 'reject';
  requestError.value = '';
  showRequestModal.value = true;
};

const confirmRequestAction = async () => {
  if (!selectedRequest.value || !requestModalMode.value) return;

  isProcessingRequest.value = true;
  requestError.value = '';

  try {
    if (requestModalMode.value === 'approve') {
      await apiClient.post(`/admin/club/club-requests/${selectedRequest.value.id}/approve`);
      fetchClubData(); 
    } else {
      // Fixed URL typo here (clu -> club)
      await apiClient.post(`/admin/club/club-requests/${selectedRequest.value.id}/reject`);
    }
    
    fetchPendingRequests();
    showRequestModal.value = false;
    selectedRequest.value = null;
    requestModalMode.value = null;

  } catch (e: any) {
    requestError.value = e.response?.data?.error || `Failed to ${requestModalMode.value} request.`;
  } finally {
    isProcessingRequest.value = false;
  }
};

</script>

<template>
  <div class="club-oversight">
    
    <header class="page-header">
      <div class="title-section">
        <h1>Club Directory & Oversight</h1>
        <p>Monitor campus organizations, approve requested clubs, and manage community hubs.</p>
      </div>
      
      <button class="primary-btn" @click="showCreateModal = true">
        <Icon icon="heroicons:plus-circle" class="btn-icon" />
        <span>Create Official Club</span>
      </button>
    </header>

    <div v-if="pendingRequests.length > 0" class="requests-queue">
        <div class="queue-header">
          <div class="queue-title">
            <Icon icon="heroicons:inbox-arrow-down" class="queue-icon" />
            <h2>Action Required: Pending Requests</h2>
            <span class="request-count">{{ pendingRequests.length }}</span>
          </div>
        </div>

        <div class="requests-grid">
          <div v-for="req in pendingRequests" :key="req.id" class="request-card">
            <div class="req-content">
              <h3>{{ req.title }}</h3>
              <p>{{ req.description }}</p>
              <span class="req-meta">Requested by <strong>{{ req.requester_name }}</strong></span>
            </div>
            
            <div class="req-actions">
              <button class="btn-reject" @click="promptRejectRequest(req.id, req.title)" :disabled="isProcessingRequest">
                <Icon icon="heroicons:x-mark" />
                <span>Reject</span>
              </button>
              <button class="btn-approve" @click="promptApproveRequest(req.id, req.title)" :disabled="isProcessingRequest">
                <Icon icon="heroicons:check" />
                <span>Approve & Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
          <option value="reviewing">Pending Approval</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <div v-if="clubsLoading && clubs.length === 0" class="loading-state">
         <Icon icon="eos-icons:loading" class="spin-icon-large" />
         <p>Loading directory...</p>
      </div>

      <table class="admin-table" v-else>
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
                <span v-if="!club.admin_list || club.admin_list.length === 0" class="no-leaders">No Admins</span>
              </div>
            </td>

            <td>
              <span :class="['status-pill', club.status]">
                {{ club.status === 'reviewing' ? 'Pending' : club.status }}
              </span>
            </td>

            <td class="actions-cell">
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

              <button class="action-btn delete" @click="promptDeleteClub(club.id, club.title)" title="Delete Club">
                <Icon icon="heroicons:trash" />
              </button>
            </td>

          </tr>
          
          <tr v-if="clubs.length === 0 && !clubsLoading">
            <td colspan="5" class="empty-state">
              <Icon icon="heroicons:building-office-2" class="empty-icon" />
              <p>No clubs found matching your criteria.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Create Official Club</h2>
          <p>Establish a new, pre-approved community hub.</p>
        </div>
        <form @submit.prevent="handleCreateClub" class="modal-form">
          <div class="form-group">
            <label>Club Title *</label>
            <input v-model="newClubForm.title" type="text" placeholder="e.g. Debate Team" required />
          </div>
          <div class="form-group">
            <label>Description *</label>
            <textarea v-model="newClubForm.description" rows="3" placeholder="What is this official club about?" required></textarea>
          </div>
          <div v-if="createError" class="alert error">
            <Icon icon="mdi:alert-circle" />
            <span>{{ createError }}</span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showCreateModal = false" :disabled="isCreating">Cancel</button>
            <button type="submit" class="primary-btn flex-fill" :disabled="isCreating">
              <Icon v-if="isCreating" icon="eos-icons:loading" class="spin-icon" />
              <span>{{ isCreating ? 'Creating...' : 'Create Club' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-card delete-modal">
        <div class="modal-header text-danger">
          <Icon icon="heroicons:exclamation-triangle" width="36" />
          <h2>Delete Club?</h2>
        </div>
        <p class="modal-body">
          Are you absolutely sure you want to delete <strong>"{{ clubToDelete?.title }}"</strong>? 
          This action will cascade and permanently wipe all associated forums, replies, and member data. 
          This <strong>cannot be undone</strong>.
        </p>
        <div v-if="deleteError" class="alert error mb-4">
          <Icon icon="mdi:alert-circle" />
          <span>{{ deleteError }}</span>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteModal = false" :disabled="isDeleting">Cancel</button>
          <button class="btn-danger flex-fill" @click="confirmDeleteClub" :disabled="isDeleting">
            <Icon v-if="isDeleting" icon="eos-icons:loading" class="spin-icon" />
            <span>{{ isDeleting ? 'Deleting...' : 'Yes, Delete Club' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSuspendModal" class="modal-overlay" @click.self="showSuspendModal = false">
      <div class="modal-card warning-modal">
        <div class="modal-header text-warning">
          <Icon icon="heroicons:pause-circle" width="36" />
          <h2>Suspend Club?</h2>
        </div>
        <p class="modal-body">
          Are you sure you want to suspend <strong>"{{ clubToSuspend?.title }}"</strong>? 
          Members will no longer be able to post in this club's forums or interact with its events until it is restored.
        </p>
        <div v-if="suspendError" class="alert error mb-4">
          <Icon icon="mdi:alert-circle" />
          <span>{{ suspendError }}</span>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showSuspendModal = false" :disabled="isSuspending">Cancel</button>
          <button class="btn-warning flex-fill" @click="confirmSuspendClub" :disabled="isSuspending">
            <Icon v-if="isSuspending" icon="eos-icons:loading" class="spin-icon" />
            <span>{{ isSuspending ? 'Suspending...' : 'Yes, Suspend Club' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRequestModal" class="modal-overlay" @click.self="showRequestModal = false">
      <div class="modal-card">
        <div class="modal-header" :class="requestModalMode === 'reject' ? 'text-danger' : 'text-success'">
          <Icon :icon="requestModalMode === 'reject' ? 'heroicons:x-circle' : 'heroicons:check-circle'" width="36" />
          <h2>{{ requestModalMode === 'reject' ? 'Reject Request?' : 'Approve Request?' }}</h2>
        </div>
        <p class="modal-body">
          Are you sure you want to {{ requestModalMode }} the request for <strong>"{{ selectedRequest?.title }}"</strong>?
          <template v-if="requestModalMode === 'approve'"><br/>This will immediately create the official club and notify the requester.</template>
        </p>
        <div v-if="requestError" class="alert error mb-4">
          <Icon icon="mdi:alert-circle" />
          <span>{{ requestError }}</span>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showRequestModal = false" :disabled="isProcessingRequest">Cancel</button>
          <button 
            :class="['flex-fill', requestModalMode === 'reject' ? 'btn-danger' : 'btn-approve-modal']" 
            @click="confirmRequestAction" 
            :disabled="isProcessingRequest"
          >
            <Icon v-if="isProcessingRequest" icon="eos-icons:loading" class="spin-icon" />
            <span>{{ isProcessingRequest ? 'Processing...' : (requestModalMode === 'reject' ? 'Yes, Reject' : 'Yes, Approve') }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showErrorModal" class="modal-overlay" @click.self="showErrorModal = false">
      <div class="modal-card">
        <div class="modal-header text-danger">
          <Icon icon="heroicons:exclamation-circle" width="36" />
          <h2>Action Failed</h2>
        </div>
        <p class="modal-body">
          {{ errorMessage }}
        </p>
        <div class="modal-actions">
          <button class="btn-cancel flex-fill" @click="showErrorModal = false">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Keeping your existing styles */
.club-oversight { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.title-section h1 { font-size: 2rem; color: #0f172a; margin: 0 0 0.5rem 0; }
.title-section p { color: #64748b; margin: 0; }

.primary-btn {
  background: #6366f1; color: white; border: none; padding: 0.85rem 1.5rem;
  border-radius: 14px; font-weight: 600; display: flex; align-items: center;
  gap: 0.5rem; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); justify-content: center;
}
.primary-btn:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); }
.primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }

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
.search-input:focus, .status-select:focus { border-color: #6366f1; background: white; }

.table-card {
  background: white; border-radius: 20px; border: 1px solid #e2e8f0;
  overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.loading-state { padding: 4rem; text-align: center; color: #64748b; }
.spin-icon-large { font-size: 3rem; color: #6366f1; animation: spin 1s linear infinite; margin-bottom: 1rem; }

.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background: #f8fafc; text-align: left; padding: 1.25rem 1.5rem; color: #64748b; font-size: 0.85rem; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
.admin-table td { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

.info-cell { display: flex; align-items: flex-start; gap: 1.25rem; max-width: 400px; }
.club-icon-wrapper { flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.club-details { display: flex; flex-direction: column; gap: 0.35rem; }
.c-title { margin: 0; font-weight: 600; color: #0f172a; font-size: 1rem; }
.c-desc { margin: 0; color: #64748b; font-size: 0.85rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.metric-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 0.85rem; border-radius: 10px; color: #334155; font-weight: 600; font-size: 0.9rem; }
.metric-icon { color: #6366f1; font-size: 1.1rem; }

.leaders-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.leader-chip { background: white; border: 1px solid #cbd5e1; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #475569; }
.no-leaders { font-size: 0.8rem; color: #94a3b8; font-style: italic; }

.status-pill { padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.status-pill.active { background: #dcfce7; color: #15803d; }
.status-pill.reviewing { background: #fef9c3; color: #a16207; }
.status-pill.suspended { background: #fee2e2; color: #b91c1c; }

.text-right { text-align: right; }
.actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }
.action-btn { background: white; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
.action-btn.edit:hover { color: #6366f1; border-color: #c7d2fe; background: #eef2ff; }
.action-btn.approve { color: #10b981; border-color: #a7f3d0; background: #ecfdf5; }
.action-btn.approve:hover { transform: scale(1.05); }
.action-btn.suspend:hover { color: #f59e0b; border-color: #fde68a; background: #fffbeb; }
.action-btn.restore:hover { color: #6366f1; border-color: #c7d2fe; background: #eef2ff; }
.action-btn.delete:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }

.empty-state { text-align: center; padding: 4rem 2rem !important; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }

/* Modal Base Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-card { background: white; width: 90%; max-width: 500px; border-radius: 24px; padding: 2.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-header { margin-bottom: 2rem; text-align: center; }
.modal-header h2 { font-size: 1.75rem; color: #0f172a; margin-bottom: 0.5rem; }
.modal-header p { color: #64748b; }

.modal-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.88rem; font-weight: 600; color: #475569; }
.form-group input, .form-group textarea { padding: 0.85rem 1rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.95rem; font-family: inherit; outline: none; transition: border-color 0.2s; background: #f8fafc; }
.form-group input:focus, .form-group textarea:focus { background: white; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
.form-group textarea { resize: vertical; }

.modal-actions { display: flex; gap: 1rem; margin-top: 1rem; }
.btn-cancel { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 0.85rem 1.25rem; border-radius: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; flex: 1; }
.btn-cancel:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }
.flex-fill { flex: 1; }

.alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; }
.alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Requests Queue Styles */
.requests-queue { background: #fffbeb; border: 1px solid #fde68a; border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.05); }
.queue-header { margin-bottom: 1.25rem; }
.queue-title { display: flex; align-items: center; gap: 0.75rem; color: #b45309; }
.queue-icon { font-size: 1.5rem; }
.queue-title h2 { font-size: 1.25rem; margin: 0; font-weight: 700; }
.request-count { background: #f59e0b; color: white; padding: 0.15rem 0.6rem; border-radius: 99px; font-size: 0.85rem; font-weight: 700; }
.requests-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 860px) { .requests-grid { grid-template-columns: repeat(2, 1fr); } }

.request-card { background: white; border: 1px solid #fde68a; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; }
.req-content h3 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.1rem; }
.req-content p { margin: 0 0 1rem 0; color: #475569; font-size: 0.9rem; line-height: 1.5; }
.req-meta { font-size: 0.8rem; color: #94a3b8; }
.req-meta strong { color: #475569; }

.req-actions { display: flex; gap: 0.5rem; margin-top: auto; }
.req-actions button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }

.btn-reject { background: white; color: #dc2626; border: 1px solid #fecaca; }
.btn-reject:hover:not(:disabled) { background: #fef2f2; }
.btn-approve { background: #10b981; color: white; border: none; }
.btn-approve:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }

/* Custom Modal State Styles */
.text-danger { color: #dc2626 !important; }
.modal-header.text-danger h2 { color: #dc2626; }
.btn-danger { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #dc2626; color: white; border: none; padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

.text-warning { color: #d97706 !important; }
.modal-header.text-warning h2 { color: #d97706; }
.btn-warning { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #f59e0b; color: white; border: none; padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-warning:hover:not(:disabled) { background: #d97706; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); }
.btn-warning:disabled { opacity: 0.7; cursor: not-allowed; }

.text-success { color: #10b981 !important; }
.modal-header.text-success h2 { color: #10b981; }
.btn-approve-modal { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #10b981; color: white; border: none; padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-approve-modal:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-approve-modal:disabled { opacity: 0.7; cursor: not-allowed; }

.modal-body { text-align: center; color: #475569; line-height: 1.6; margin-bottom: 1.5rem; }
.modal-body strong { color: #0f172a; }
.mb-4 { margin-bottom: 1rem; }

.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes modal-pop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
</style>