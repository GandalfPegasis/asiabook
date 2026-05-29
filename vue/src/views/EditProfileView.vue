<template>
  <main class="edit-profile-container">
    
    <header class="page-header">
      <button type="button" class="button-back" @click="goBack" title="Back to Profile">
        <Icon icon="mdi:arrow-left" width="24" height="24" />
      </button>
      <div>
        <h1>Edit Profile</h1>
        <p class="page-subtitle">Update your personal information and contact details.</p>
      </div>
    </header>

    <div v-if="isLoading" class="state-wrapper loading-state">
      <Icon icon="eos-icons:loading" class="spin-icon" />
      <p>Loading your information...</p>
    </div>

    <div v-else-if="fetchError" class="state-wrapper error-state">
      <Icon icon="mdi:alert-circle-outline" class="error-icon" />
      <p>{{ fetchError }}</p>
      <button @click="fetchProfileData" class="button-primary">Try Again</button>
    </div>

    <div v-else class="form-card card-box">
      
      <div class="avatar-section">
        <div class="avatar-preview">
          {{ formData.name ? formData.name.charAt(0).toUpperCase() : '?' }}
        </div>
        <div class="avatar-actions">
          <h3>Profile Picture</h3>
          <p>JPG, GIF or PNG. Max size of 5MB.</p>
          <button class="button-secondary btn-small">
            <Icon icon="mdi:camera-outline" />
            <span>Change Picture</span>
          </button>
        </div>
      </div>

      <hr class="divider" />

      <form @submit.prevent="saveProfile" class="edit-form">
        
        <div v-if="saveSuccess" class="alert-success">
          <Icon icon="mdi:check-circle" />
          <span>Profile updated successfully!</span>
        </div>
        <div v-if="saveError" class="alert-error">
          <Icon icon="mdi:alert-circle" />
          <span>{{ saveError }}</span>
        </div>

        <div class="form-grid">
          <div class="input-group">
            <label for="name">Full Name</label>
            <div class="input-wrapper">
              <Icon icon="mdi:account-outline" class="input-icon" />
              <input id="name" v-model="formData.name" type="text" placeholder="e.g. Jane Doe" required />
            </div>
          </div>

          <div class="input-group">
            <label for="email">Email Address</label>
            <div class="input-wrapper">
              <Icon icon="mdi:email-outline" class="input-icon" />
              <input id="email" v-model="formData.email" type="email" placeholder="jane@example.com" required />
            </div>
          </div>

          <div class="input-group">
            <label for="department">Department</label>
            <div class="input-wrapper">
              <Icon icon="mdi:domain" class="input-icon" />
              <input id="department" v-model="formData.department" type="text" placeholder="e.g. Engineering" />
            </div>
          </div>

          <div class="input-group">
            <label for="role">Role</label>
            <div class="input-wrapper">
              <Icon icon="mdi:briefcase-outline" class="input-icon" />
              <input id="role" v-model="formData.role" type="text" placeholder="e.g. Software Engineer" />
            </div>
          </div>

          <div class="input-group">
            <label for="birth_date">Birth Date</label>
            <div class="input-wrapper">
              <Icon icon="mdi:calendar-outline" class="input-icon" />
              <input id="birth_date" v-model="formData.birth_date" type="date" />
            </div>
          </div>

          <div class="input-group">
            <label for="nationality">Nationality</label>
            <div class="input-wrapper">
              <Icon icon="mdi:earth" class="input-icon" />
              <input id="nationality" v-model="formData.nationality" type="text" placeholder="e.g. Taiwanese" />
            </div>
          </div>

          <div class="input-group">
            <label for="language">Primary Language</label>
            <div class="input-wrapper">
              <Icon icon="mdi:translate" class="input-icon" />
              <input id="language" v-model="formData.language" type="text" placeholder="e.g. English, Mandarin" />
            </div>
          </div>

          <div class="input-group">
            <label for="contact_info">Contact Info (Phone/Skype)</label>
            <div class="input-wrapper">
              <Icon icon="mdi:phone-outline" class="input-icon" />
              <input id="contact_info" v-model="formData.contact_info" type="text" placeholder="+1 234 567 890" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="button-secondary" @click="goBack" :disabled="isSaving">
            Cancel
          </button>
          <button type="submit" class="button-primary" :disabled="isSaving">
            <Icon v-if="!isSaving" icon="mdi:content-save-outline" class="btn-icon" />
            <Icon v-else icon="mdi:loading" class="btn-icon spin-icon" />
            <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>

      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { apiClient } from '@/api/api';

const router = useRouter();

// State
const isLoading = ref(true);
const isSaving = ref(false);
const fetchError = ref<string | null>(null);
const saveError = ref<string | null>(null);
const saveSuccess = ref(false);

// Form Data Model
const formData = ref({
  name: '',
  email: '',
  birth_date: '',
  nationality: '',
  role: '',
  department: '',
  language: '',
  contact_info: ''
});

// Format Date for HTML <input type="date"> (Requires YYYY-MM-DD)
const formatDateForInput = (dateString: string | undefined) => {
  if (!dateString) return '';
  return dateString.split('T')[0]; 
};

// Fetch current user data
const fetchProfileData = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const response = await apiClient.get('/profile');
    const user = response.data;
    
    formData.value = {
      name: user.name || '',
      email: user.email || '',
      birth_date: formatDateForInput(user.birth_date),
      nationality: user.nationality || '',
      role: user.role || '',
      department: user.department || '',
      language: user.language || '',
      contact_info: user.contact_info || ''
    };
  } catch (err: any) {
    fetchError.value = err.response?.data?.message || 'Could not load your profile data.';
  } finally {
    isLoading.value = false;
  }
};

// Save changes
const saveProfile = async () => {
  isSaving.value = true;
  saveError.value = null;
  saveSuccess.value = false;

  try {
    await apiClient.put('/profile', formData.value);
    saveSuccess.value = true;
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
    
  } catch (err: any) {
    saveError.value = err.response?.data?.error || 'Failed to update profile. Please try again.';
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'profile' }); // Adjust to match your profile route name
};

onMounted(() => {
  fetchProfileData();
});
</script>

<style scoped>
/* =========================================
   Base Layout
========================================= */
.edit-profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 2rem;
  box-sizing: border-box;
  max-width: 900px; /* Slightly narrower than full profile for better form readability */
  margin: 0 auto;
}

/* =========================================
   Header
========================================= */
.page-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1.25rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  color: #475569;
  font-size: 1rem;
}

/* =========================================
   Cards & States
========================================= */
.card-box {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

.form-card {
  padding: 2.5rem;
}

.state-wrapper {
  padding: 3rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  text-align: center;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  font-size: 1.05rem;
}

.spin-icon {
  font-size: 2.5rem;
  color: #6366f1;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

/* =========================================
   Avatar Section
========================================= */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: grid;
  place-items: center;
  font-size: 2.5rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
}

.avatar-actions h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.avatar-actions p {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #64748b;
}

.divider {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 2rem 0;
}

/* =========================================
   Form Layout & Inputs
========================================= */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  font-size: 1.2rem;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.75rem;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.input-wrapper input:focus {
  background: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-wrapper input::placeholder {
  color: #94a3b8;
}

/* =========================================
   Buttons & Actions
========================================= */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.button-primary,
.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary {
  border: none;
  background: #6366f1;
  color: white;
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.button-secondary {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.button-secondary:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.button-primary:disabled,
.button-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-back {
  background: white;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(15, 23, 42, 0.02);
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.button-back:hover {
  background: #f8fafc;
  color: #6366f1;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 10px;
}

/* =========================================
   Alerts
========================================= */
.alert-success,
.alert-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.alert-success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* =========================================
   Mobile Responsiveness
========================================= */
@media (max-width: 720px) {
  .edit-profile-container {
    padding: 1.5rem 1rem;
  }
  
  .form-card {
    padding: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>