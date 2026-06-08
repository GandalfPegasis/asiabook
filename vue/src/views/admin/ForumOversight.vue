<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api'

// Define the shape of our data
interface Reply {
  id: number;
  author: string;
  content: string;
  votes: number;
  flagged: boolean;
}

interface Forum {
  id: number;
  title: string;
  club: string;
  author: string;
  votes: number;
  status: 'active' | 'locked' | 'flagged';
  createdAt: string;
  replies: Reply[];
}

const forums = ref<Forum[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const clubFilter = ref('all')
const expandedThreadId = ref<number | null>(null)
const flaggedCount = ref(0)

// --- MODAL STATE ---
const showModal = ref(false)
const modalMode = ref<'deleteThread' | 'deleteReply' | 'error' | null>(null)
const modalPayload = ref<any>(null)
const isProcessing = ref(false)
const modalError = ref('') // Used to display errors inside the modal

// 1. FETCH FORUMS
const fetchForums = async () => {
  try {
    isLoading.value = true;
    
    // Pass search and filter to your backend
    const res = await apiClient.get('/admin/forums', {
      params: {
        search: searchQuery.value || undefined,
        club: clubFilter.value === 'all' ? undefined : clubFilter.value
      }
    });

    forums.value = res.data.data || res.data;
    
    // Update the KPI badge dynamically
    flaggedCount.value = forums.value.filter(f => f.status === 'flagged').length;
    
  } catch (e) {
    console.error("Failed to fetch forums:", e);
  } finally {
    isLoading.value = false;
  }
}

interface ClubOption {
  id: number;
  title: string;
}
const availableClubs = ref<ClubOption[]>([]);

const fetchAvailableClubs = async () => {
  try {
    // We can reuse the admin club route you built earlier!
    const res = await apiClient.get('/admin/club');
    // Assuming the backend returns an array of clubs with {id, title, ...}
    availableClubs.value = res.data; 
  } catch (e) {
    console.error("Failed to fetch clubs list for filter:", e);
  }
}

// Watchers for Server-Side Filtering (with 300ms debounce)
let searchTimeout: any;
watch([searchQuery, clubFilter], () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchForums();
  }, 300);
});

onMounted(() => {
  fetchForums();
  fetchAvailableClubs();
})

// Toggle the thread row to see the replies inside
const toggleThread = (id: number) => {
  expandedThreadId.value = expandedThreadId.value === id ? null : id
}

// --- MODAL PROMPTS ---
const promptDeleteThread = (threadId: number) => {
  modalMode.value = 'deleteThread';
  modalPayload.value = threadId;
  modalError.value = '';
  showModal.value = true;
}

const promptDeleteReply = (threadId: number, replyId: number) => {
  modalMode.value = 'deleteReply';
  modalPayload.value = { threadId, replyId };
  modalError.value = '';
  showModal.value = true;
}

const showErrorModal = (message: string) => {
  modalMode.value = 'error';
  modalError.value = message;
  showModal.value = true;
}

// 2. MODERATION ACTIONS
const toggleThreadLock = async (forum: Forum) => {
  const originalStatus = forum.status;
  const newStatus = forum.status === 'locked' ? 'active' : 'locked';

  try {
    // Optimistic UI Update
    forum.status = newStatus;

    if (newStatus === 'locked') {
      await apiClient.put(`/admin/forums/${forum.id}/lock`);
    } else {
      await apiClient.put(`/admin/forums/${forum.id}/unlock`);
    }
  } catch (error) {
    console.error(error);
    // Revert if API fails
    forum.status = originalStatus;
    showErrorModal("Failed to update thread lock status. Please try again.");
  }
}

// Execute the action confirmed inside the modal
const executeModalAction = async () => {
  if (modalMode.value === 'error') {
    showModal.value = false;
    return;
  }

  isProcessing.value = true;
  modalError.value = '';

  try {
    if (modalMode.value === 'deleteThread') {
      const threadId = modalPayload.value;
      await apiClient.delete(`/admin/forums/${threadId}`);
      
      forums.value = forums.value.filter(f => f.id !== threadId);
      flaggedCount.value = forums.value.filter(f => f.status === 'flagged').length;
    } 
    else if (modalMode.value === 'deleteReply') {
      const { threadId, replyId } = modalPayload.value;
      await apiClient.delete(`/admin/replies/${replyId}`);
      
      const thread = forums.value.find(f => f.id === threadId);
      if (thread) {
        thread.replies = thread.replies.filter(r => r.id !== replyId);
      }
    }
    
    showModal.value = false;
    modalPayload.value = null;

  } catch (error: any) {
    console.error(error);
    modalError.value = error.response?.data?.error || "Failed to complete the action.";
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="forum-oversight">
    
    <header class="page-header">
      <div class="title-section">
        <h1>Forum & Club Oversight</h1>
        <p>Moderate campus discussions, manage club threads, and review flagged content.</p>
      </div>
      
      <div class="kpi-badge">
        <Icon icon="heroicons:shield-exclamation-solid" class="kpi-icon" />
        <div class="kpi-text">
          <span class="kpi-number">{{ flaggedCount }}</span>
          <span class="kpi-label">Flagged Threads</span>
        </div>
      </div>
    </header>

    <div class="controls-card">
      <div class="search-wrapper">
        <Icon icon="heroicons:magnifying-glass" class="search-icon" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search thread titles..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-wrapper">
        <Icon icon="heroicons:funnel" class="filter-icon" />
        <select v-model="clubFilter" class="club-select">
          <option value="all">All Clubs & Groups</option>
          
          <option 
            v-for="club in availableClubs" 
            :key="club.id" 
            :value="club.title"
          >
            {{ club.title }}
          </option>

          <option value="General (No Club)">General (No Club)</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Thread Title</th>
            <th>Club / Group</th>
            <th>Stats</th>
            <th>Status</th>
            <th class="text-right">Manage</th>
          </tr>
        </thead>

        <tbody v-for="forum in forums" :key="forum.id">
          <tr :class="{ 'expanded-row': expandedThreadId === forum.id }">
            <td class="title-cell">
              <button class="expand-btn" @click="toggleThread(forum.id)">
                <Icon :icon="expandedThreadId === forum.id ? 'heroicons:chevron-down' : 'heroicons:chevron-right'" />
              </button>
              <div>
                <p class="f-title">{{ forum.title }}</p>
                <p class="f-author">Posted by {{ forum.author }}</p>
              </div>
            </td>
            <td>
              <span class="club-badge">{{ forum.club }}</span>
            </td>
            <td>
              <div class="stats-cell">
                <span :class="['vote-count', forum.votes < 0 ? 'negative' : 'positive']">
                  <Icon :icon="forum.votes < 0 ? 'heroicons:arrow-trending-down' : 'heroicons:arrow-trending-up'" />
                  {{ forum.votes }}
                </span>
                <span class="reply-count">
                  <Icon icon="heroicons:chat-bubble-left-ellipsis" />
                  {{ forum.replies.length }}
                </span>
              </div>
            </td>
            <td>
              <span :class="['status-pill', forum.status]">
                {{ forum.status }}
              </span>
            </td>
            <td class="actions-cell">
              <button 
                class="action-btn" 
                :class="forum.status === 'locked' ? 'restore' : 'suspend'"
                @click="toggleThreadLock(forum)"
                :title="forum.status === 'locked' ? 'Unlock Thread' : 'Lock Thread'"
              >
                <Icon :icon="forum.status === 'locked' ? 'heroicons:lock-open' : 'heroicons:lock-closed'" />
              </button>
              <button class="action-btn delete" @click="promptDeleteThread(forum.id)" title="Delete Thread">
                <Icon icon="heroicons:trash" />
              </button>
            </td>
          </tr>

          <tr v-if="expandedThreadId === forum.id" class="drawer-row">
            <td colspan="5" class="drawer-cell">
              <div class="replies-container">
                <h4 class="drawer-title">Thread Audit & Replies</h4>
                
                <div v-if="forum.replies.length === 0" class="empty-replies">
                  No replies on this thread yet.
                </div>

                <div v-else class="reply-list">
                  <div 
                    v-for="reply in forum.replies" 
                    :key="reply.id" 
                    :class="['reply-item', { 'is-flagged': reply.flagged }]"
                  >
                    <div class="reply-header">
                      <span class="reply-author">{{ reply.author }}</span>
                      <span class="reply-votes">Votes: {{ reply.votes }}</span>
                    </div>
                    <div class="reply-body">
                      <p class="reply-content">{{ reply.content }}</p>
                      <button class="small-delete-btn" @click="promptDeleteReply(forum.id, reply.id)">
                        <Icon icon="heroicons:x-mark" /> Delete Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        
        <tr v-if="forums.length === 0 && !isLoading">
          <td colspan="5" class="empty-state-card">
            <Icon icon="heroicons:check-badge" class="empty-icon" />
            <h2>All caught up!</h2>
            <p>No threads found matching your criteria.</p>
          </td>
        </tr>

      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        
        <div class="modal-header text-danger">
          <Icon 
            :icon="modalMode === 'error' ? 'heroicons:exclamation-triangle' : 'heroicons:trash'" 
            width="36" 
          />
          <h2>
            <template v-if="modalMode === 'deleteThread'">Delete Thread?</template>
            <template v-else-if="modalMode === 'deleteReply'">Delete Reply?</template>
            <template v-else>Action Failed</template>
          </h2>
        </div>

        <p class="modal-body" v-if="modalMode !== 'error'">
          <template v-if="modalMode === 'deleteThread'">
            Are you sure you want to permanently delete this thread? This will cascade and permanently wipe all nested replies. This <strong>cannot be undone</strong>.
          </template>
          <template v-else-if="modalMode === 'deleteReply'">
            Are you sure you want to delete this specific reply? This <strong>cannot be undone</strong>.
          </template>
        </p>

        <div v-if="modalError" class="alert error mb-4">
          <Icon icon="mdi:alert-circle" />
          <span>{{ modalError }}</span>
        </div>

        <div class="modal-actions">
          <button v-if="modalMode !== 'error'" class="btn-cancel" @click="showModal = false" :disabled="isProcessing">
            Cancel
          </button>
          <button 
            :class="['flex-fill', modalMode === 'error' ? 'btn-cancel' : 'btn-danger']" 
            @click="executeModalAction" 
            :disabled="isProcessing"
          >
            <Icon v-if="isProcessing" icon="eos-icons:loading" class="spin-icon" />
            <span v-if="modalMode === 'error'">Dismiss</span>
            <span v-else>{{ isProcessing ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.forum-oversight {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header & KPIs */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title-section h1 { font-size: 2rem; color: #0f172a; margin: 0 0 0.5rem 0; }
.title-section p { color: #64748b; margin: 0; }

.kpi-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1rem 1.5rem;
  border-radius: 16px;
}

.kpi-icon { font-size: 2rem; color: #ef4444; }
.kpi-text { display: flex; flex-direction: column; }
.kpi-number { font-size: 1.25rem; font-weight: 700; color: #b91c1c; line-height: 1; }
.kpi-label { font-size: 0.85rem; font-weight: 600; color: #dc2626; text-transform: uppercase; margin-top: 0.25rem;}

/* Controls */
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

.search-wrapper, .filter-wrapper { position: relative; display: flex; align-items: center; }
.search-wrapper { flex-grow: 1; }
.search-icon, .filter-icon { position: absolute; left: 1rem; color: #94a3b8; z-index: 1; }
.search-input, .club-select {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  background: #f8fafc;
}
.search-input:focus, .club-select:focus { border-color: #6366f1; background: white; }

/* Table */
.table-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.admin-table { width: 100%; border-collapse: collapse; }
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

/* Thread Row Styling */
.expanded-row td { border-bottom: none; background-color: #f8fafc; }

.title-cell { display: flex; align-items: center; gap: 1rem; }
.expand-btn {
  background: white; border: 1px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b;
}
.expand-btn:hover { color: #6366f1; border-color: #c7d2fe; }

.f-title { margin: 0; font-weight: 600; color: #0f172a; font-size: 0.95rem; }
.f-author { margin: 0; color: #64748b; font-size: 0.85rem; margin-top: 0.25rem; }

.club-badge {
  background: #eef2ff; color: #4f46e5; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
}

.stats-cell { display: flex; gap: 1rem; font-size: 0.9rem; font-weight: 600; }
.vote-count { display: flex; align-items: center; gap: 0.25rem; }
.vote-count.positive { color: #10b981; }
.vote-count.negative { color: #ef4444; }
.reply-count { display: flex; align-items: center; gap: 0.25rem; color: #64748b; }

.status-pill { padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;}
.status-pill.active { background: #dcfce7; color: #15803d; }
.status-pill.locked { background: #ffedd5; color: #c2410c; }
.status-pill.flagged { background: #fee2e2; color: #b91c1c; }

/* Empty State */
.empty-state-card {
  text-align: center;
  padding: 5rem 2rem !important;
  background-color: #f8fafc;
}
.empty-icon { 
  font-size: 4rem; 
  color: #10b981;
  margin-bottom: 1rem; 
  opacity: 0.5;
}
.empty-state-card h2 { 
  margin: 0 0 0.5rem 0; 
  color: #0f172a; 
  font-size: 1.5rem;
}
.empty-state-card p { margin: 0; color: #64748b; }

/* Actions */
.text-right { text-align: right; }
.actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }
.action-btn { background: white; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s;}
.action-btn.suspend:hover { color: #f59e0b; border-color: #fde68a; background: #fffbeb; }
.action-btn.restore:hover { color: #10b981; border-color: #a7f3d0; background: #ecfdf5; }
.action-btn.delete:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }

/* Nested Replies Drawer */
.drawer-row td { padding: 0; border-bottom: 1px solid #e2e8f0; }
.replies-container { background: #f8fafc; padding: 2rem 4rem; box-shadow: inset 0 4px 6px -4px rgba(0,0,0,0.05); }
.drawer-title { margin: 0 0 1.5rem 0; color: #0f172a; font-size: 1rem; }

.empty-replies { color: #64748b; font-style: italic; }

.reply-list { display: flex; flex-direction: column; gap: 1rem; }
.reply-item { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
.reply-item.is-flagged { border: 2px solid #fecaca; background: #fef2f2; }

.reply-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.85rem; }
.reply-author { font-weight: 600; color: #0f172a; }
.reply-votes { color: #64748b; }

.reply-body { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; }
.reply-content { margin: 0; color: #334155; line-height: 1.5; font-size: 0.95rem; }

.small-delete-btn {
  display: flex; align-items: center; gap: 0.25rem; background: transparent; border: 1px solid #fecaca; color: #ef4444; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; white-space: nowrap;
}
.small-delete-btn:hover { background: #ef4444; color: white; }

/* =========================================
   MODAL STYLES
========================================= */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-card { background: white; width: 90%; max-width: 450px; border-radius: 20px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

.modal-header { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 1rem; text-align: center; }
.modal-header h2 { font-size: 1.5rem; margin: 0; }
.text-danger { color: #dc2626; }
.text-warning { color: #d97706; }

.modal-body { text-align: center; color: #475569; line-height: 1.6; margin-bottom: 1.5rem; }
.modal-body strong { color: #0f172a; }

.modal-actions { display: flex; gap: 1rem; }
.btn-cancel { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; flex: 1; }
.btn-cancel:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }

.flex-fill { flex: 1; }
.btn-danger { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: #dc2626; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

.alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; }
.alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.mb-4 { margin-bottom: 1rem; }

.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes modal-pop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
</style>