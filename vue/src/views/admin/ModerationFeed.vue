<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api'

// Toggling between posts and comments
const activeTab = ref('posts')

// Initialize as empty arrays
const flaggedPosts = ref<any[]>([])
const flaggedComments = ref<any[]>([])
const isLoading = ref(false)

const activeQueue = computed(() => activeTab.value === 'posts' ? flaggedPosts.value : flaggedComments.value)

// --- MODAL STATE ---
const showModal = ref(false)
const isProcessing = ref(false)
const modalAction = ref<'delete' | 'warn' | null>(null)
const selectedItem = ref<any>(null)
const actionError = ref('')

// 1. FETCH DATA FUNCTION
const fetchModerationData = async () => {
  try {
    isLoading.value = true;

    // Fetch both posts and comments simultaneously
    const [postsRes, commentsRes] = await Promise.all([
      apiClient.get('/admin/post/'),
      apiClient.get('/admin/post/comments').catch(() => ({ data: { data: [] } })) 
    ]);

    // Format Posts
    flaggedPosts.value = postsRes.data.data.map((post: any) => ({
      id: post.id,
      author: post.author_name,
      authorInitials: post.author_name ? post.author_name.charAt(0).toUpperCase() : '?',
      role: 'student', 
      caption: post.caption,
      hasImage: !!post.image_url, 
      imageUrl: post.image_url || '',
      reportReason: post.reports?.length > 0 
        ? post.reports.map((r: any) => r.reason).join(', ') 
        : 'Auto-flagged by System',
      reportedBy: post.report_count > 1 ? 'Multiple Users' : 'Community Member',
      severity: post.report_count >= 3 ? 'high' : 'medium',
      timestamp: new Date(post.created_at).toLocaleString()
    }));

    // FIXED: Format Comments using the exact same structure!
    const rawComments = commentsRes.data?.data || [];
    flaggedComments.value = rawComments.map((comment: any) => ({
      id: comment.id,
      author: comment.author_name,
      authorInitials: comment.author_name ? comment.author_name.charAt(0).toUpperCase() : '?',
      role: 'student', 
      content: comment.content, // Comments use 'content' instead of 'caption'
      hasImage: false,          // Comments don't have images in your schema
      imageUrl: '',
      reportReason: comment.reports?.length > 0 
        ? comment.reports.map((r: any) => r.reason).join(', ') 
        : 'Auto-flagged by System',
      reportedBy: comment.report_count > 1 ? 'Multiple Users' : 'Community Member',
      severity: comment.report_count >= 3 ? 'high' : 'medium',
      timestamp: new Date(comment.created_at).toLocaleString()
    }));

  } catch (error) {
    console.error("Failed to load moderation queue:", error);
  } finally {
    isLoading.value = false;
  }
}

// 2. IMMEDIATE ACTION (Keep Content)
const handleKeepContent = async (id: number) => {
  const originalPosts = [...flaggedPosts.value];
  const originalComments = [...flaggedComments.value];

  try {
    // Optimistic UI Update
    if (activeTab.value === 'posts') {
      flaggedPosts.value = flaggedPosts.value.filter(p => p.id !== id);
    } else {
      flaggedComments.value = flaggedComments.value.filter(c => c.id !== id);
    }

    // FIXED: Dynamically choose the endpoint based on the active tab
    const endpointBase = activeTab.value === 'posts' ? `/admin/post` : `/admin/post/comments`; 
    
    await apiClient.put(`${endpointBase}/${id}/dismiss-reports`);

  } catch (error) {
    console.error(`Failed to dismiss reports:`, error);
    // Revert UI on failure
    flaggedPosts.value = originalPosts;
    flaggedComments.value = originalComments;
    alert(`Failed to keep content. Please try again.`);
  }
}

// 3. OPEN MODAL (For Destructive Actions)
const promptAction = (item: any, action: 'delete' | 'warn') => {
  selectedItem.value = item;
  modalAction.value = action;
  actionError.value = '';
  showModal.value = true;
}

// 4. CONFIRM MODAL ACTION
const confirmAction = async () => {
  if (!selectedItem.value) return;

  isProcessing.value = true;
  actionError.value = '';

  const id = selectedItem.value.id;
  
  // FIXED: Dynamically choose the endpoint based on the active tab
  const endpointBase = activeTab.value === 'posts' ? `/admin/post` : `/admin/post/comments`; 

  try {
    if (modalAction.value === 'delete') {
      // Actually delete the content
      await apiClient.delete(`${endpointBase}/${id}`);
    } 
    else if (modalAction.value === 'warn') {
      // Suspend it and warn the user
      await apiClient.put(`${endpointBase}/${id}/suspend`);
    }

    // Remove from UI successfully
    if (activeTab.value === 'posts') {
      flaggedPosts.value = flaggedPosts.value.filter(p => p.id !== id);
    } else {
      flaggedComments.value = flaggedComments.value.filter(c => c.id !== id);
    }

    // Close modal
    showModal.value = false;
    selectedItem.value = null;

  } catch (error: any) {
    console.error(`Failed to execute ${modalAction.value}:`, error);
    actionError.value = error.response?.data?.error || `Failed to ${modalAction.value} the content.`;
  } finally {
    isProcessing.value = false;
  }
}

// 5. TRIGGER FETCH ON LOAD
onMounted(() => {
  fetchModerationData();
})
</script>

<template>
  <div class="moderation-feed">
    
    <header class="page-header">
      <div class="title-section">
        <h1>Moderation Queue</h1>
        <p>Review flagged posts and comments to ensure community safety.</p>
      </div>
      
      <div class="header-stats">
        <div class="stat-badge">
          <span class="stat-num">{{ flaggedPosts.length + flaggedComments.length }}</span>
          <span class="stat-label">Pending Reviews</span>
        </div>
      </div>
    </header>

    <div class="tabs-container">
      <button 
        :class="['tab-btn', { active: activeTab === 'posts' }]"
        @click="activeTab = 'posts'"
      >
        <Icon icon="heroicons:document-text" class="tab-icon" />
        Flagged Posts ({{ flaggedPosts.length }})
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'comments' }]"
        @click="activeTab = 'comments'"
      >
        <Icon icon="heroicons:chat-bubble-left-ellipsis" class="tab-icon" />
        Flagged Comments ({{ flaggedComments.length }})
      </button>
    </div>

    <div class="feed-container">
      <div v-if="isLoading" class="empty-state-card">
        <Icon icon="eos-icons:loading" class="spin-icon" style="font-size: 3rem; color: #6366f1;" />
        <p>Loading moderation queue...</p>
      </div>

      <div v-else-if="activeQueue.length === 0" class="empty-state-card">
        <Icon icon="heroicons:check-badge" class="empty-icon" />
        <h2>All caught up!</h2>
        <p>There is no flagged content waiting in the queue.</p>
      </div>

      <div v-else v-for="item in activeQueue" :key="item.id" class="report-card">
        
        <div class="report-meta" :class="item.severity">
          <div class="meta-left">
            <Icon icon="heroicons:flag-solid" class="flag-icon" />
            <span class="reason-label">Report Reason:</span>
            <span class="reason-text">{{ item.reportReason }}</span>
          </div>
          <div class="meta-right">
            <span>Reported by <strong>{{ item.reportedBy }}</strong></span>
          </div>
        </div>

        <div class="content-preview">
          <div class="content-header">
            <div class="avatar-sm">{{ item.authorInitials }}</div>
            <div class="author-info">
              <span class="author-name">{{ item.author }}</span>
              <span class="timestamp">{{ item.timestamp }}</span>
            </div>
            <span class="content-id">ID: #{{ item.id }}</span>
          </div>
          
          <p class="content-body">{{ 'caption' in item ? item.caption : item.content }}</p>
          
          <div v-if="'hasImage' in item && item.hasImage" class="content-image-wrapper">
            <img :src="item.imageUrl" alt="Reported image" class="content-image" />
          </div>
        </div>

        <div class="action-bar">
          <button class="action-btn keep" @click="handleKeepContent(item.id)">
            <Icon icon="heroicons:check-circle" class="btn-icon" />
            <span>Ignore / Keep Content</span>
          </button>
          
          <div class="destructive-actions">
            <!-- <button class="action-btn warn" @click="promptAction(item, 'warn')">
              <Icon icon="heroicons:exclamation-triangle" class="btn-icon" />
              <span>Warn User</span>
            </button> -->
            <button class="action-btn delete" @click="promptAction(item, 'delete')">
              <Icon icon="heroicons:trash" class="btn-icon" />
              <span>Delete Content</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card" :class="modalAction === 'delete' ? 'delete-modal' : 'warning-modal'">
        
        <div class="modal-header" :class="modalAction === 'delete' ? 'text-danger' : 'text-warning'">
          <Icon :icon="modalAction === 'delete' ? 'heroicons:trash' : 'heroicons:exclamation-triangle'" width="36" />
          <h2>{{ modalAction === 'delete' ? 'Delete Content?' : 'Warn User & Suspend?' }}</h2>
        </div>

        <p class="modal-body">
          <template v-if="modalAction === 'delete'">
            Are you sure you want to permanently delete this content? This action will remove it from the database entirely and <strong>cannot be undone</strong>.
          </template>
          <template v-else>
            Are you sure you want to suspend this content and flag a warning on <strong>{{ selectedItem?.author }}</strong>'s account? It will be hidden from the feed.
          </template>
        </p>

        <div class="modal-snippet">
           "{{ selectedItem?.caption || selectedItem?.content }}"
        </div>

        <div v-if="actionError" class="alert error mb-4">
          <Icon icon="mdi:alert-circle" />
          <span>{{ actionError }}</span>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false" :disabled="isProcessing">
            Cancel
          </button>
          <button 
            :class="['flex-fill', modalAction === 'delete' ? 'btn-danger' : 'btn-warning']" 
            @click="confirmAction" 
            :disabled="isProcessing"
          >
            <Icon v-if="isProcessing" icon="eos-icons:loading" class="spin-icon" />
            <span>{{ isProcessing ? 'Processing...' : 'Confirm Action' }}</span>
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* Keeping your existing styles, adding just the modal styles below */
.moderation-feed { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
.title-section h1 { font-size: 2rem; color: #0f172a; margin: 0 0 0.5rem 0; }
.title-section p { color: #64748b; margin: 0; }
.stat-badge { background: #e0e7ff; color: #4f46e5; padding: 0.75rem 1.25rem; border-radius: 16px; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 1.5rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }

/* Tabs */
.tabs-container { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
.tab-btn { background: none; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; transition: all 0.2s; }
.tab-btn:hover { background: #f8fafc; color: #0f172a; }
.tab-btn.active { background: #e0e7ff; color: #4f46e5; }
.tab-icon { font-size: 1.25rem; }

/* Feed & Cards */
.feed-container { display: flex; flex-direction: column; gap: 1.5rem; }
.empty-state-card { background: white; border-radius: 20px; border: 1px dashed #cbd5e1; padding: 4rem 2rem; text-align: center; color: #64748b; }
.empty-icon { font-size: 4rem; color: #10b981; margin-bottom: 1rem; opacity: 0.5; }
.empty-state-card h2 { color: #0f172a; margin: 0 0 0.5rem 0; font-size: 1.5rem; }

.report-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }

/* Report Meta Banner */
.report-meta { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; font-size: 0.85rem; font-weight: 600; }
.report-meta.high { background: #fef2f2; color: #991b1b; border-bottom: 1px solid #fecaca; }
.report-meta.medium { background: #fffbeb; color: #b45309; border-bottom: 1px solid #fde68a; }
.meta-left { display: flex; align-items: center; gap: 0.5rem; }
.flag-icon { font-size: 1.1rem; }
.reason-text { font-weight: 700; text-transform: uppercase; }
.meta-right strong { font-weight: 700; }

/* Content Preview */
.content-preview { padding: 1.5rem; }
.content-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.avatar-sm { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); color: #4f46e5; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; }
.author-info { display: flex; flex-direction: column; flex-grow: 1; }
.author-name { font-weight: 600; color: #0f172a; }
.timestamp { font-size: 0.8rem; color: #64748b; }
.content-id { font-size: 0.8rem; color: #94a3b8; font-family: monospace; background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 6px; }

.content-body { color: #1e293b; line-height: 1.6; margin: 0 0 1rem 0; font-size: 1.05rem; }
.content-image-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; max-height: 400px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
.content-image { max-width: 100%; max-height: 400px; object-fit: contain; }

/* Action Bar */
.action-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.destructive-actions { display: flex; gap: 0.75rem; }

.action-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.action-btn.keep { background: white; border-color: #cbd5e1; color: #475569; }
.action-btn.keep:hover { background: #f1f5f9; color: #10b981; border-color: #a7f3d0; }
.action-btn.warn { background: white; border-color: #fde68a; color: #d97706; }
.action-btn.warn:hover { background: #fffbeb; }
.action-btn.delete { background: white; border-color: #fecaca; color: #dc2626; }
.action-btn.delete:hover { background: #fef2f2; }

/* =========================================
   MODAL STYLES
========================================= */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-card { background: white; width: 90%; max-width: 450px; border-radius: 20px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

.modal-header { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 1rem; text-align: center; }
.modal-header h2 { font-size: 1.5rem; margin: 0; }
.text-danger { color: #dc2626; }
.text-warning { color: #d97706; }

.modal-body { text-align: center; color: #475569; line-height: 1.6; margin-bottom: 1rem; }
.modal-body strong { color: #0f172a; }

.modal-snippet { background: #f1f5f9; padding: 1rem; border-radius: 12px; font-style: italic; color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; border-left: 4px solid #cbd5e1; text-align: left; }

.modal-actions { display: flex; gap: 1rem; }
.btn-cancel { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; flex: 1; }
.btn-cancel:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }

.flex-fill { flex: 1; }
.btn-danger, .btn-warning { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-danger { background: #dc2626; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-warning { background: #f59e0b; }
.btn-warning:hover:not(:disabled) { background: #d97706; }
.btn-danger:disabled, .btn-warning:disabled { opacity: 0.7; cursor: not-allowed; }

.alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.9rem; }
.mb-4 { margin-bottom: 1rem; }
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes modal-pop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
</style>