<template>
  <main class="settings-container card-box">
    <header class="settings-header">
      <h1>Account Settings</h1>
      <p class="subtitle">Manage your account security, credentials, and data privacy.</p>
    </header>

    <section class="settings-section">
      <div class="section-title">
        <Icon icon="mdi:lock-outline" width="22" />
        <h2>Change Password</h2>
      </div>

      <form @submit.prevent="handlePasswordChange" class="settings-form">
        <div class="form-group">
          <label for="current-password">Current Password</label>
          <input 
            id="current-password" 
            v-model="passwordForm.currentPassword" 
            type="password" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="new-password">New Password</label>
          <input 
            id="new-password" 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm New Password</label>
          <input 
            id="confirm-password" 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <div v-if="alertMessage" :class="['alert', alertType]">
          <Icon :icon="alertType === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'" />
          <span>{{ alertMessage }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="isUpdatingPassword">
          <Icon v-if="isUpdatingPassword" icon="eos-icons:loading" class="spin-icon" />
          <span>{{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}</span>
        </button>
      </form>
    </section>

    <div class="divider"></div>

    <section class="settings-section danger-zone">
      <div class="section-title text-danger">
        <Icon icon="mdi:alert-octagon-outline" width="22" />
        <h2>Danger Zone</h2>
      </div>
      <p class="danger-desc">Permanently remove your account profile, personal data and platform footprints. This action is irreversible.</p>
      
      <button 
        class="btn-danger" 
        @click="showDeleteModal = true" 
        :disabled="isDeletingAccount">
        <Icon icon="mdi:trash-can-outline" />
        <span>Delete Account Permanently</span>
      </button>
    </section>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-card">
        <div class="modal-header text-danger">
          <Icon icon="mdi:alert" width="32" />
          <h2>Confirm Deletion</h2>
        </div>
        <p class="modal-body">
          Are you absolutely sure you want to delete your account? This action will permanently wipe all profile footprints and <strong>cannot be undone</strong>.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteModal = false" :disabled="isDeletingAccount">
            Cancel
          </button>
          <button class="btn-danger" @click="confirmDeleteAccount" :disabled="isDeletingAccount">
            <Icon v-if="isDeletingAccount" icon="eos-icons:loading" class="spin-icon" />
            <span>{{ isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account' }}</span>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api'

const router = useRouter()
const { deleteAccount, logout } = useAuth()

const isUpdatingPassword = ref(false)
const isDeletingAccount = ref(false)
const showDeleteModal = ref(false) // NEW: Controls the modal visibility

const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handlePasswordChange = async () => {
  alertMessage.value = ''
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alertType.value = 'error'
    alertMessage.value = 'New passwords do not match.'
    return
  }

  isUpdatingPassword.value = true
  try {
    await apiClient.post('/auth/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    alertType.value = 'success'
    alertMessage.value = 'Password changed successfully.'
    
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    alertType.value = 'error'
    alertMessage.value = err.response?.data?.error || 'Failed to update password.'
  } finally {
    isUpdatingPassword.value = false
  }
}

// NEW: Function that runs when they click "Yes, Delete" inside the modal
const confirmDeleteAccount = async () => {
  isDeletingAccount.value = true
  const result = await deleteAccount()

  if (result.success) {
    logout()
    router.push({ name: 'login' })
  } else {
    // If it fails, close the modal and show the error in our inline alert banner instead of a native alert
    showDeleteModal.value = false
    alertType.value = 'error'
    alertMessage.value = `Failed to delete account: ${result.error}`
  }
  isDeletingAccount.value = false
}
</script>

<style scoped>
/* Keeping your existing styles exactly as they were... */
.settings-container {
  max-width: 650px;
  margin: 2rem auto;
  padding: 2.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.settings-header h1 {
  font-size: 1.75rem;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.settings-section {
  margin: 1.5rem 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e293b;
  margin-bottom: 1.25rem;
}

.section-title h2 {
  font-size: 1.2rem;
  margin: 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #6366f1;
}

.btn-submit {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:hover { background: #4f46e5; }
.btn-submit:disabled { opacity: 0.7; }

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 2.5rem 0;
}

.danger-zone {
  background: #fff5f5;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px dashed #fca5a5;
}

.text-danger { color: #dc2626; }

.danger-desc {
  font-size: 0.9rem;
  color: #7f1d1d;
  margin-bottom: 1.25rem;
}

.btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}
.alert.success { background: #ecfdf5; color: #065f46; }
.alert.error { background: #fef2f2; color: #991b1b; }

.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* =========================================
   NEW: Modal Styles
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
  max-width: 450px;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.modal-body {
  text-align: center;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-actions button {
  flex: 1;
}

.btn-cancel {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
}
.btn-cancel:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes modal-pop {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
</style>