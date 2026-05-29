<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// Toggling between posts and comments
const activeTab = ref('posts')

// Mocking data from a joined query: 
// SELECT * FROM posts p JOIN profile u ON p.posted_by = u.id JOIN reports r ON r.post_id = p.id
const flaggedPosts = ref([
  {
    id: 101,
    author: 'Alex Wu',
    authorInitials: 'A',
    role: 'student',
    caption: 'Selling my old exam papers for CS101. DM me with offers.',
    hasImage: false,
    reportedBy: 'System Auto-Mod',
    reportReason: 'Academic Dishonesty / Selling Course Material',
    severity: 'high',
    timestamp: '2 hours ago'
  },
  {
    id: 102,
    author: 'John Chen',
    authorInitials: 'J',
    role: 'student',
    caption: 'This new parking policy is completely ridiculous. Whoever wrote this should be fired.',
    hasImage: true,
    imageUrl: 'https://images.unsplash.com/photo-1590642916589-592bca10dfbf?auto=format&fit=crop&w=600&q=80',
    reportedBy: 'Prof. Lin',
    reportReason: 'Harassment / Uncivil Behavior',
    severity: 'medium',
    timestamp: '5 hours ago'
  }
])

const flaggedComments = ref([
  {
    id: 501,
    author: 'Sarah Tan',
    authorInitials: 'S',
    role: 'student',
    content: 'spam link http://malicious-site.com/free-money',
    parentPostId: 42,
    reportedBy: 'Mike Ross',
    reportReason: 'Spam / Phishing',
    severity: 'high',
    timestamp: '10 mins ago'
  }
])

const activeQueue = computed(() => activeTab.value === 'posts' ? flaggedPosts.value : flaggedComments.value)

// Moderation Actions
const resolveReport = (id: number, action: 'keep' | 'delete' | 'warn') => {
  if (action === 'delete') {
    if (!confirm('Permanently delete this content from the database?')) return
  }
  
  // Remove from the local UI queue
  if (activeTab.value === 'posts') {
    flaggedPosts.value = flaggedPosts.value.filter(p => p.id !== id)
  } else {
    flaggedComments.value = flaggedComments.value.filter(c => c.id !== id)
  }
  
  // In reality, you'd send an API request here:
  // POST /api/admin/moderation/resolve { itemId: id, action: action, type: activeTab.value }
}
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
      
      <div v-if="activeQueue.length === 0" class="empty-state-card">
        <Icon icon="heroicons:check-badge" class="empty-icon" />
        <h2>All caught up!</h2>
        <p>There is no flagged content waiting in the queue.</p>
      </div>

      <div v-for="item in activeQueue" :key="item.id" class="report-card">
        
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
          <button class="action-btn keep" @click="resolveReport(item.id, 'keep')">
            <Icon icon="heroicons:check-circle" class="btn-icon" />
            <span>Ignore / Keep Content</span>
          </button>
          
          <div class="destructive-actions">
            <button class="action-btn warn" @click="resolveReport(item.id, 'warn')">
              <Icon icon="heroicons:exclamation-triangle" class="btn-icon" />
              <span>Warn User</span>
            </button>
            <button class="action-btn delete" @click="resolveReport(item.id, 'delete')">
              <Icon icon="heroicons:trash" class="btn-icon" />
              <span>Delete Content</span>
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.moderation-feed {
  max-width: 1000px;
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

.stat-badge {
  background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
  border-radius: 16px; display: flex; align-items: center; gap: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.stat-num { font-size: 1.5rem; font-weight: 700; color: #ef4444; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #64748b; text-transform: uppercase; }

/* Tabs */
.tabs-container {
  display: flex; gap: 1rem; margin-bottom: 1.5rem;
}
.tab-btn {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.5rem;
  background: white; border: 1px solid #e2e8f0; border-radius: 12px;
  font-size: 0.95rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.tab-btn:hover { background: #f8fafc; color: #0f172a; }
.tab-btn.active {
  background: #eef2ff; color: #6366f1; border-color: #c7d2fe;
}
.tab-icon { font-size: 1.2rem; }

/* Feed Container */
.feed-container { display: flex; flex-direction: column; gap: 1.5rem; }

/* Empty State */
.empty-state-card {
  background: white; border-radius: 24px; border: 1px dashed #cbd5e1;
  padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.empty-icon { font-size: 4rem; color: #10b981; margin-bottom: 1rem; }
.empty-state-card h2 { margin: 0 0 0.5rem 0; color: #0f172a; }
.empty-state-card p { margin: 0; color: #64748b; }

/* Report Cards */
.report-card {
  background: white; border-radius: 24px; border: 1px solid #e2e8f0;
  overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

/* Report Meta Header */
.report-meta {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem;
}
.report-meta.high { background: #fef2f2; border-bottom-color: #fecaca; }
.report-meta.medium { background: #fffbeb; border-bottom-color: #fde68a; }

.meta-left { display: flex; align-items: center; gap: 0.5rem; }
.flag-icon { font-size: 1.1rem; }
.report-meta.high .flag-icon { color: #ef4444; }
.report-meta.medium .flag-icon { color: #f59e0b; }

.reason-label { color: #64748b; font-weight: 500; }
.reason-text { font-weight: 700; color: #0f172a; }
.meta-right { color: #64748b; }

/* Content Preview (The actual post) */
.content-preview { padding: 1.5rem; }
.content-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; position: relative;}
.avatar-sm {
  width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;
}
.author-info { display: flex; flex-direction: column; }
.author-name { font-weight: 600; color: #0f172a; font-size: 0.95rem; }
.timestamp { color: #94a3b8; font-size: 0.8rem; }
.content-id { position: absolute; right: 0; top: 0; font-size: 0.75rem; color: #cbd5e1; font-family: monospace; }

.content-body { margin: 0 0 1rem 0; color: #334155; line-height: 1.5; font-size: 1rem; }
.content-image-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; max-height: 400px; display: flex; justify-content: center; background: #f1f5f9; }
.content-image { width: 100%; object-fit: contain; }

/* Action Bar */
.action-bar {
  display: flex; justify-content: space-between; padding: 1rem 1.5rem;
  background: #f8fafc; border-top: 1px solid #e2e8f0;
}
.destructive-actions { display: flex; gap: 0.75rem; }

.action-btn {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem;
  border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
}
.btn-icon { font-size: 1.2rem; }

.action-btn.keep { background: white; border: 1px solid #cbd5e1; color: #475569; }
.action-btn.keep:hover { border-color: #10b981; color: #10b981; background: #ecfdf5; }

.action-btn.warn { background: white; border: 1px solid #fde68a; color: #d97706; }
.action-btn.warn:hover { background: #fffbeb; }

.action-btn.delete { background: #ef4444; border: 1px solid #ef4444; color: white; }
.action-btn.delete:hover { background: #dc2626; border-color: #dc2626; }
</style>