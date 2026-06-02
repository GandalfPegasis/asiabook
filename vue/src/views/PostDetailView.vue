<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api'
import { useAuth } from '@/composables/useAuth'

const { getUserId } = useAuth(); 

const route = useRoute()
const router = useRouter()
const postId = route.params.id

// State
const post = ref<any>(null)
const comments = ref<any[]>([])
const newComment = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

// --- NEW: REPORT MODAL STATE ---
const showReportModal = ref(false)
const selectedCommentId = ref<number | null>(null)
const reportReason = ref('')
const isReporting = ref(false)
const reportError = ref('')
const reportSuccess = ref('')

// 1. FETCH POST & COMMENTS
const fetchPostData = async () => {
  try {
    isLoading.value = true
    
    const [postRes, commentsRes] = await Promise.all([
      apiClient.get(`/posts/${postId}`), 
      apiClient.get(`/posts/${postId}/comments`)
    ])

    post.value = postRes.data.data || postRes.data
    comments.value = commentsRes.data.data || commentsRes.data

  } catch (error) {
    console.error("Failed to load post data", error)
    alert("This post might have been deleted or doesn't exist.")
    router.push('/') 
  } finally {
    isLoading.value = false
  }
}

// 2. SUBMIT A NEW COMMENT
const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    isSubmitting.value = true
    
    const res = await apiClient.post(`/posts/${postId}/comments`, {
      userId: getUserId,
      content: newComment.value
    })


    console.log(res);

    comments.value.push({
      id: res.data.id,
      author_name: 'You', 
      author_role: 'student',
      content: newComment.value,
      created_at: new Date().toISOString()
    })

    newComment.value = ''
    
  } catch (error) {
    console.error("Failed to post comment", error)
    alert("Could not post comment. It may have been flagged.")
  } finally {
    isSubmitting.value = false
  }
}

// --- NEW: REPORT MODAL LOGIC ---
const openReportModal = (commentId: number) => {
  selectedCommentId.value = commentId
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = ''
  showReportModal.value = true
}

const closeReportModal = () => {
  showReportModal.value = false
  selectedCommentId.value = null
}

const submitReport = async () => {
  if (!selectedCommentId.value || !reportReason.value) return

  isReporting.value = true
  reportError.value = ''

  try {
    // Make sure you have this route in your backend!
    // E.g., POST /api/posts/comments/:id/report
    await apiClient.post(`/posts/comments/${selectedCommentId.value}/report`, {
      reason: reportReason.value
    })

    reportSuccess.value = 'Report submitted to moderators.'
    
    // Auto-close modal after a moment
    setTimeout(() => {
      closeReportModal()
    }, 2000)

  } catch (error: any) {
    console.error("Failed to report comment", error)
    reportError.value = error.response?.data?.error || "Failed to submit report."
  } finally {
    isReporting.value = false
  }
}

const goBack = () => {
  router.push('/') 
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

onMounted(() => {
  fetchPostData()
})
</script>

<template>
  <div class="post-detail-page">
    
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <Icon icon="heroicons:arrow-left" class="icon" />
        <span>Back to Feed</span>
      </button>
    </header>

    <div v-if="isLoading" class="loading-state">
      <Icon icon="heroicons:arrow-path" class="spinner" />
      <p>Loading post and comments...</p>
    </div>

    <div v-else-if="post" class="content-layout">
      
      <article class="main-post-card">
        <div class="post-header">
          <div class="author-avatar">{{ post.author_name?.charAt(0).toUpperCase() || 'U' }}</div>
          <div class="author-meta">
            <div class="author-name-row">
              <span class="author-name">{{ post.author_name || 'Unknown User' }}</span>
              <span v-if="post.author_role" class="author-role">{{ post.author_role }}</span>
            </div>
            <span class="post-time">{{ formatDate(post.created_at) }}</span>
          </div>
        </div>
        <p class="post-caption">{{ post.caption }}</p>
        
        <div class="post-stats">
          <Icon icon="heroicons:heart" class="stat-icon" />
          <span>{{ post.likes }} Likes</span>
        </div>
      </article>

      <section class="comments-section">
        <h3 class="comments-title">Comments ({{ comments.length }})</h3>

        <div class="comment-input-area">
          <div class="author-avatar small">Y</div>
          <div class="input-wrapper">
            <textarea 
              v-model="newComment" 
              placeholder="Write a comment..." 
              rows="2"
              @keydown.enter.exact.prevent="submitComment"
            ></textarea>
            <div class="input-actions">
              <span class="hint">Press Enter to post (Shift+Enter for new line)</span>
              <button 
                class="primary-btn" 
                @click="submitComment" 
                :disabled="!newComment.trim() || isSubmitting"
              >
                <Icon v-if="isSubmitting" icon="heroicons:arrow-path" class="spinner-small" />
                <span v-else>Post Reply</span>
              </button>
            </div>
          </div>
        </div>

        <div class="comments-list">
          
          <div v-if="comments.length === 0" class="empty-comments">
            <Icon icon="heroicons:chat-bubble-oval-left-ellipsis" class="empty-icon" />
            <p>No comments yet. Be the first to start the discussion!</p>
          </div>
          
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="author-avatar small">{{ comment.author_name?.charAt(0).toUpperCase() || 'U' }}</div>
            <div class="comment-content">
              <div class="comment-bubble">
                <div class="comment-author">
                  <span class="name">{{ comment.author_name }}</span>
                  <span v-if="comment.author_role === 'teacher' || comment.author_role === 'admin'" class="badge">Staff</span>
                </div>
                <p class="text">{{ comment.content }}</p>
              </div>
              <div class="comment-actions">
                <span class="time">{{ formatDate(comment.created_at) }}</span>
                <button class="text-btn" @click="openReportModal(comment.id)">Report</button>
              </div>
            </div>
          </div>
          
        </div>
      </section>
    </div>

    <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
      <div class="modal-card">
        
        <div class="modal-header text-danger">
          <Icon icon="heroicons:flag" width="36" />
          <h2>Report Comment</h2>
        </div>

        <p class="modal-body">
          Please select a reason for reporting this comment. False reports may result in account penalties.
        </p>

        <form @submit.prevent="submitReport" class="modal-form">
          <div class="form-group">
            <label>Reason *</label>
            <select v-model="reportReason" required class="reason-select">
              <option value="" disabled>Select a reason...</option>
              <option value="spam">Spam / Bot Activity</option>
              <option value="harassment">Harassment or Bullying</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div v-if="reportError" class="alert error">
            <Icon icon="mdi:alert-circle" />
            <span>{{ reportError }}</span>
          </div>

          <div v-if="reportSuccess" class="alert success">
            <Icon icon="heroicons:check-circle" />
            <span>{{ reportSuccess }}</span>
          </div>

          <div class="modal-actions" v-if="!reportSuccess">
            <button type="button" class="btn-cancel" @click="closeReportModal" :disabled="isReporting">
              Cancel
            </button>
            <button type="submit" class="btn-danger flex-fill" :disabled="isReporting || !reportReason">
              <Icon v-if="isReporting" icon="eos-icons:loading" class="spin-icon" />
              <span>{{ isReporting ? 'Submitting...' : 'Submit Report' }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* Keeping all your existing styles exactly as they were... */
.post-detail-page { max-width: 768px; margin: 0 auto; padding: 2rem 1rem; }
.page-header { margin-bottom: 1.5rem; }
.back-btn { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; color: #64748b; font-weight: 600; cursor: pointer; padding: 0.5rem 0; transition: color 0.2s; }
.back-btn:hover { color: #0f172a; }
.back-btn .icon { font-size: 1.25rem; }

.loading-state { text-align: center; padding: 4rem; color: #94a3b8; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; margin-bottom: 1rem; color: #6366f1; }
.spinner-small { font-size: 1.2rem; animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.main-post-card { background: white; border-radius: 20px; padding: 1.5rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.post-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.author-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; display: grid; place-items: center; font-weight: bold; font-size: 1.1rem; flex-shrink: 0; }
.author-avatar.small { width: 36px; height: 36px; font-size: 0.9rem; }
.author-name-row { display: flex; align-items: center; gap: 0.5rem; }
.author-name { font-weight: 600; color: #0f172a; font-size: 1.05rem;}
.author-role { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 999px; background: #e0e7ff; color: #4f46e5; font-weight: 600; text-transform: capitalize; }
.post-time { font-size: 0.85rem; color: #94a3b8; margin-top: 0.2rem; }
.post-caption { font-size: 1.1rem; line-height: 1.6; color: #334155; margin-bottom: 1.5rem; white-space: pre-wrap; }
.post-stats { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-weight: 600; font-size: 0.9rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
.stat-icon { color: #ef4444; font-size: 1.2rem; }

.comments-title { font-size: 1.25rem; color: #0f172a; margin-bottom: 1.5rem; }
.comment-input-area { display: flex; gap: 1rem; margin-bottom: 2.5rem; }
.input-wrapper { flex-grow: 1; background: white; border: 1px solid #cbd5e1; border-radius: 16px; padding: 0.75rem; transition: border-color 0.2s, box-shadow 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);}
.input-wrapper:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
.input-wrapper textarea { width: 100%; border: none; resize: none; outline: none; font-family: inherit; font-size: 0.95rem; color: #334155; background: transparent; padding: 0.25rem; }
.input-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; }
.hint { font-size: 0.75rem; color: #94a3b8; }
.primary-btn { display: flex; align-items: center; justify-content: center; background: #6366f1; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; min-width: 100px; }
.primary-btn:hover:not(:disabled) { background: #4f46e5; }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.comments-list { display: flex; flex-direction: column; gap: 1.5rem; }
.empty-comments { text-align: center; color: #94a3b8; padding: 3rem 0; }
.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5; }
.comment-item { display: flex; gap: 1rem; }
.comment-content { flex-grow: 1; }
.comment-bubble { background: #f8fafc; padding: 1rem 1.25rem; border-radius: 0 20px 20px 20px; display: inline-block; min-width: 200px; max-width: 100%; border: 1px solid #f1f5f9; }
.comment-author { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
.comment-author .name { font-weight: 600; font-size: 0.95rem; color: #0f172a; }
.comment-author .badge { font-size: 0.7rem; background: #fef08a; color: #854d0e; padding: 0.1rem 0.5rem; border-radius: 999px; font-weight: 700; }
.comment-bubble .text { margin: 0; font-size: 0.95rem; color: #334155; line-height: 1.5; white-space: pre-wrap; }
.comment-actions { display: flex; align-items: center; gap: 1rem; margin-top: 0.4rem; margin-left: 0.75rem; }
.comment-actions .time { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
.text-btn { background: none; border: none; font-size: 0.8rem; font-weight: 600; color: #94a3b8; cursor: pointer; padding: 0; transition: color 0.2s; }
.text-btn:hover { color: #ef4444; }

/* =========================================
   NEW: REPORT MODAL STYLES
========================================= */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-card { background: white; width: 90%; max-width: 450px; border-radius: 20px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

.modal-header { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 1rem; text-align: center; }
.modal-header h2 { font-size: 1.5rem; margin: 0; }
.text-danger { color: #dc2626; }

.modal-body { text-align: center; color: #475569; line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.95rem; }

.modal-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.88rem; font-weight: 600; color: #475569; }
.reason-select { padding: 0.85rem 1rem; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.95rem; font-family: inherit; outline: none; background: #f8fafc; cursor: pointer; }
.reason-select:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

.alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; }
.alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.alert.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

.modal-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }
.btn-cancel { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; flex: 1; }
.btn-cancel:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }

.flex-fill { flex: 1; }
.btn-danger { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: white; background: #dc2626; border: none; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

.spin-icon { animation: spin 1s linear infinite; }
@keyframes modal-pop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
</style>