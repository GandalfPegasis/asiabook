<template>
  <div class="page-container">
    
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>Discover Clubs</h1>
          <p>Find your community. Join a club to participate in specialized forums and discussions.</p>
        </div>
        <button class="btn-primary" @click="showRequestModal = true">
          <Icon icon="mdi:plus-circle-outline" class="btn-icon" />
          <span>Request New Club</span>
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="state-wrapper">
      <Icon icon="eos-icons:loading" class="spin-icon" />
      <p>Loading clubs...</p>
    </div>

    <div v-else-if="error" class="state-wrapper error-state">
      <Icon icon="mdi:alert-circle-outline" class="error-icon" />
      <p>{{ error }}</p>
      <button @click="fetchClubs" class="btn-secondary">Try Again</button>
    </div>

    <div v-else-if="clubs.length > 0" class="clubs-grid">
      <div v-for="club in clubs" :key="club.id" class="club-card" @click="gotoClub(club.id)">
        <div class="club-icon-wrapper">
          <Icon :icon="club.icon || 'mdi:account-group-outline'" class="club-icon" />
        </div>
        <div class="club-content">
          <h2 class="club-title">{{ club.title }}</h2>
          <p class="club-description">{{ club.description }}</p>
        </div>
        <button class="join-btn">
          <span>View Club</span>
          <Icon icon="mdi:arrow-right" class="btn-icon" />
        </button>
      </div>
    </div>

    <div v-else class="state-wrapper">
      <Icon icon="mdi:ghost-outline" class="empty-icon" />
      <p>No clubs available yet.</p>
    </div>

    <div v-if="showRequestModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Request a New Club</h2>
          <p>Propose a new community for AsiaBook.</p>
        </div>

        <form @submit.prevent="submitClubRequest" class="modal-form">
          <div class="form-group">
            <label for="club-title">Club Title *</label>
            <input 
              id="club-title" 
              v-model="requestForm.title" 
              type="text" 
              placeholder="e.g., AI Enthusiasts" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="club-desc">Description *</label>
            <textarea 
              id="club-desc" 
              v-model="requestForm.description" 
              rows="3" 
              placeholder="What is this club about?" 
              required 
            ></textarea>
          </div>

          <div v-if="requestError" class="alert error">
            <Icon icon="mdi:alert-circle" />
            <span>{{ requestError }}</span>
          </div>

          <div v-if="requestSuccess" class="alert success">
            <Icon icon="mdi:check-circle" />
            <span>{{ requestSuccess }}</span>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal" :disabled="isSubmitting">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <Icon v-if="isSubmitting" icon="eos-icons:loading" class="spin-icon" />
              <span>{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { api, apiClient } from '@/api/api'; // Adjust path if necessary

const router = useRouter();

// Interfaces
interface Club {
  id: number;
  title: string;
  description: string;
  icon?: string;
}

// State
const clubs = ref<Club[]>([]);
const isLoading = ref(true);
const error = ref('');

// Modal State
const showRequestModal = ref(false);
const isSubmitting = ref(false);
const requestForm = ref({ title: '', description: '' });
const requestError = ref('');
const requestSuccess = ref('');

const gotoClub = (clubId: number) => {
  router.push({ name: 'club-detail', params: { id: String(clubId) } });
};

const fetchClubs = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    // Assuming api.getClubs() is defined in your api.ts file
    clubs.value = await api.getClubs();
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load clubs.';
  } finally {
    isLoading.value = false;
  }
};

const submitClubRequest = async () => {
  requestError.value = '';
  requestSuccess.value = '';
  isSubmitting.value = true;

  try {
    // You will need to ensure this route exists on your Express backend!
    await apiClient.post('/clubs/request-new', {
      title: requestForm.value.title,
      description: requestForm.value.description
    });
    
    requestSuccess.value = 'Your request has been submitted to the admins for approval!';
    requestForm.value = { title: '', description: '' }; // Reset form
    
    // Auto-close modal after 2 seconds on success
    setTimeout(() => {
      closeModal();
    }, 2000);

  } catch (err: any) {
    requestError.value = err.response?.data?.error || 'Failed to submit request.';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  showRequestModal.value = false;
  requestError.value = '';
  requestSuccess.value = '';
  requestForm.value = { title: '', description: '' };
};

onMounted(() => {
  fetchClubs();
});
</script>

<style scoped>
/* Base Layout & Typography */
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 3rem 2rem;
  box-sizing: border-box;
}

h1, h2, p {
  margin: 0;
}

/* Header */
.page-header {
  max-width: 1200px;
  margin: 0 auto 3rem auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  color: #475569;
  max-width: 600px;
  line-height: 1.6;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* States (Loading, Error, Empty) */
.state-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spin-icon { font-size: 2.5rem; color: #6366f1; animation: spin 1s linear infinite; }
.error-icon { font-size: 3rem; color: #ef4444; }
.empty-icon { font-size: 3.5rem; color: #cbd5e1; }

@keyframes spin { 100% { transform: rotate(360deg); } }

/* Grid Layout */
.clubs-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .clubs-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .clubs-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Card Styling */
.club-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
}

.club-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 32px rgba(15, 23, 42, 0.08);
  border-color: #c7d2fe;
}

.club-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}

.club-card:hover .club-icon-wrapper {
  transform: scale(1.05);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.club-icon { width: 32px; height: 32px; }

.club-content {
  flex-grow: 1;
  margin-bottom: 2rem;
}

.club-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.club-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #64748b;
}

.join-btn {
  width: 100%;
  justify-content: center;
  background: transparent;
  border: 2px solid #e0e7ff;
  color: #6366f1;
  padding: 0.85rem 1.5rem;
  border-radius: 16px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.join-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.15);
}

.btn-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.join-btn:hover .btn-icon { transform: translateX(4px); }

/* =========================================
   MODAL STYLES
========================================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  margin-bottom: 2rem;
  text-align: center;
}

.modal-header h2 {
  font-size: 1.75rem;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.modal-header p { color: #64748b; }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #475569;
}

.form-group input, .form-group textarea {
  padding: 0.85rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  background: #f8fafc;
}

.form-group input:focus, .form-group textarea:focus {
  background: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group textarea { resize: vertical; }

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.modal-actions button { flex: 1; justify-content: center; }

.btn-cancel {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.85rem 1.25rem;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.alert.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

@keyframes modal-pop {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

/* Mobile Adjustments */
@media (max-width: 720px) {
  .page-container { padding: 2rem 1rem; }
  .header-content { flex-direction: column; text-align: center; gap: 1.5rem; }
  .club-card { padding: 2rem 1.5rem; }
  .page-header h1 { font-size: 2rem; }
}
</style>