<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api'

const route = useRoute()
const router = useRouter()
const postId = route.params.id

// State
const post = ref<any>(null)
const comments = ref<any[]>([])
const newComment = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

// 1. FETCH POST & COMMENTS
const fetchPostData = async () => {
  try {
    isLoading.value = true
    
    // Fetch both the post details and its comments at the same time
    const [postRes, commentsRes] = await Promise.all([
      apiClient.get(`/posts/${postId}`), // Make sure you have this route in your backend!
      apiClient.get(`/posts/${postId}/comments`)
    ])

    post.value = postRes.data.data || postRes.data
    comments.value = commentsRes.data.data || commentsRes.data

  } catch (error) {
    console.error("Failed to load post data", error)
    alert("This post might have been deleted or doesn't exist.")
    router.push('/') // Send them back if it fails
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
      userId: 1, // TODO: Replace with your actual logged-in user's ID!
      content: newComment.value
    })

    // Optimistic UI Update: Instantly push the new comment to the screen
    comments.value.push({
      id: res.data.data?.id || Date.now(),
      author_name: 'You', // Replace with active user's name
      author_role: 'student',
      content: newComment.value,
      created_at: new Date().toISOString()
    })

    // Clear the input box
    newComment.value = ''
    
  } catch (error) {
    console.error("Failed to post comment", error)
    alert("Could not post comment. It may have been flagged.")
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/') 
}

// Format the date nicely
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
                <button class="text-btn">Report</button>
              </div>
            </div>
          </div>
          
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.post-detail-page {
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header { margin-bottom: 1.5rem; }
.back-btn { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; color: #64748b; font-weight: 600; cursor: pointer; padding: 0.5rem 0; transition: color 0.2s; }
.back-btn:hover { color: #0f172a; }
.back-btn .icon { font-size: 1.25rem; }

/* Loading State */
.loading-state { text-align: center; padding: 4rem; color: #94a3b8; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; margin-bottom: 1rem; color: #6366f1; }
.spinner-small { font-size: 1.2rem; animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Main Post */
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

/* Comments Section */
.comments-title { font-size: 1.25rem; color: #0f172a; margin-bottom: 1.5rem; }

/* Input Area */
.comment-input-area { display: flex; gap: 1rem; margin-bottom: 2.5rem; }
.input-wrapper { flex-grow: 1; background: white; border: 1px solid #cbd5e1; border-radius: 16px; padding: 0.75rem; transition: border-color 0.2s, box-shadow 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);}
.input-wrapper:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
.input-wrapper textarea { width: 100%; border: none; resize: none; outline: none; font-family: inherit; font-size: 0.95rem; color: #334155; background: transparent; padding: 0.25rem; }
.input-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; }
.hint { font-size: 0.75rem; color: #94a3b8; }
.primary-btn { display: flex; align-items: center; justify-content: center; background: #6366f1; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; min-width: 100px; }
.primary-btn:hover:not(:disabled) { background: #4f46e5; }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Comments List */
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
</style>