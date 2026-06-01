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
        @click="handleDeleteAccount" 
        :disabled="isDeletingAccount">
        <Icon :icon="isDeletingAccount ? 'eos-icons:loading' : 'mdi:trash-can-outline'" :class="{ 'spin-icon': isDeletingAccount }" />
        <span>{{ isDeletingAccount ? 'Deleting Account...' : 'Delete Account Permanently' }}</span>
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Icon } from '@iconify/vue'
import { apiClient } from '@/api/api' // Adjust path based on your api structure

const router = useRouter()
const { deleteAccount, logout } = useAuth()

const isUpdatingPassword = ref(false)
const isDeletingAccount = ref(false)

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
    // Hits the backend route we structured earlier
    await apiClient.post('/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    alertType.value = 'success'
    alertMessage.value = 'Password changed successfully.'
    
    // Clear form inputs
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

const handleDeleteAccount = async () => {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
  if (!confirm('This will permanently wipe all profile footprints. Continue?')) return

  isDeletingAccount.value = true
  const result = await deleteAccount()

  if (result.success) {
    logout()
    router.push({ name: 'login' })
  } else {
    alert(`Failed to delete account: ${result.error}`)
  }
  isDeletingAccount.value = false
}
</script>

<style scoped>
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
  gap: 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger:hover { background: #b91c1c; }

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
</style>