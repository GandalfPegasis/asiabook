<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// Mocking data from: GET /api/admin/forums (Joined with `clubs` and `forum_reply`)
const forums = ref([
  {
    id: 1,
    title: 'Meeting spot behind the school',
    club: 'General (No Club)',
    author: 'User #2',
    votes: -14,
    status: 'flagged', // active, locked, flagged
    createdAt: '2026-05-29T10:00:00Z',
    replies: [
      { id: 1, author: 'User #2', content: 'i usually go to the back of the school to meet my regular femboy called joel', votes: -8, flagged: true },
      { id: 2, author: 'User #1', content: 'ok got it can i have his phone number', votes: 2, flagged: false },
      { id: 3, author: 'User #2', content: 'his phone number 12344444', votes: 0, flagged: false }
    ]
  },
  {
    id: 2,
    title: 'Looking for SYM Jet SL second-hand market prices',
    club: 'Taiwan Riders',
    author: 'Alex Wu',
    votes: 45,
    status: 'active',
    createdAt: '2026-05-28T14:30:00Z',
    replies: [
      { id: 4, author: 'Mike Ross', content: 'Check the Facebook marketplace groups, usually around 80k NTD depending on mileage.', votes: 12, flagged: false }
    ]
  },
  {
    id: 3,
    title: 'Building a Gym Management App (Zelox) - Backend Architecture',
    club: 'Software Engineering Hub',
    author: 'Sarah Tan',
    votes: 89,
    status: 'active',
    createdAt: '2026-05-25T09:15:00Z',
    replies: []
  }
])

const searchQuery = ref('')
const clubFilter = ref('all')
const expandedThreadId = ref<number | null>(null)

const filteredForums = computed(() => {
  return forums.value.filter(forum => {
    const matchesSearch = forum.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesClub = clubFilter.value === 'all' || forum.club === clubFilter.value
    return matchesSearch && matchesClub
  })
})

// Toggle the thread row to see the replies inside
const toggleThread = (id: number) => {
  expandedThreadId.value = expandedThreadId.value === id ? null : id
}

// Moderation Actions
const deleteReply = (threadId: number, replyId: number) => {
  if (confirm('Delete this specific reply? This will cascade and delete any nested replies.')) {
    const thread = forums.value.find(f => f.id === threadId)
    if (thread) {
      thread.replies = thread.replies.filter(r => r.id !== replyId)
      // Call: DELETE /api/admin/replies/:replyId
    }
  }
}

const toggleThreadLock = (forum: any) => {
  if (forum.status === 'locked') {
    forum.status = 'active'
  } else {
    forum.status = 'locked'
    // Call: PUT /api/admin/forums/:id/lock
  }
}

const deleteThread = (threadId: number) => {
  if (confirm('CRITICAL: Delete this entire forum thread and all its replies?')) {
    forums.value = forums.value.filter(f => f.id !== threadId)
    // Call: DELETE /api/admin/forums/:id
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
          <span class="kpi-number">1</span>
          <span class="kpi-label">Flagged Thread</span>
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
          <option value="Software Engineering Hub">Software Engineering Hub</option>
          <option value="Taiwan Riders">Taiwan Riders</option>
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
        
        <tbody v-for="forum in filteredForums" :key="forum.id">
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
              <button class="action-btn delete" @click="deleteThread(forum.id)" title="Delete Thread">
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
                      <button class="small-delete-btn" @click="deleteReply(forum.id, reply.id)">
                        <Icon icon="heroicons:x-mark" /> Delete Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
.search-input:focus, .club-select:focus { border-color: #6366f1; }

/* Table */
.table-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
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

/* Actions */
.text-right { text-align: right; }
.actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }
.action-btn { background: white; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s;}
.action-btn.suspend:hover { color: #f59e0b; border-color: #fde68a; background: #fffbeb; }
.action-btn.restore:hover { color: #10b981; border-color: #a7f3d0; background: #ecfdf5; }
.action-btn.delete:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }

/* Nested Replies Drawer */
.drawer-row td { padding: 0; border-bottom: 2px solid #e2e8f0; }
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
</style>