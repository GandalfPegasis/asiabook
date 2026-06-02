<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Reset Password</h1>
        <p>Enter your email and we'll send you a link to reset your password.</p>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form v-else @submit.prevent="handleRequestReset" class="auth-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="spin-icon"></span>
          <span>{{ isLoading ? 'Sending...' : 'Send Reset Link' }}</span>
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <div class="auth-divider">
        <span>Remember your password?</span>
      </div>

      <router-link :to="{ name: 'login' }" class="btn-secondary">
        Back to Sign In
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '@/api/api';

const email = ref('');
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');

const handleRequestReset = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    const response = await apiClient.post('/auth/forgot-password', { email: email.value });
    successMessage.value = response.data.message;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to send reset link.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Paste the EXACT SAME CSS from your LoginView.vue here */
/* .auth-page, .auth-card, .auth-header, .form-group, .btn-primary, etc... */
.success-message {
  padding: 1rem;
  background: #ecfdf5;
  color: #065f46;
  border-radius: 12px;
  border: 1px solid #a7f3d0;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

/* Base Page Match */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Card matches Profile/Error pages */
.auth-card {
  background: white;
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  padding: 3rem 2.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.05);
  text-align: center;
}

/* Header Match */
.auth-header {
  margin-bottom: 2rem;
}

.auth-header h1 {
  margin: 0;
  font-size: 2.25rem;
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.auth-header p {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* Form Styles */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  color: #475569;
  font-weight: 600;
  font-size: 0.85rem;
}

.form-group input {
  padding: 0.85rem 1.15rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  transition: all 0.2s ease;
  font-family: inherit;
  outline: none;
}

.form-group input:focus {
  background: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Button Match */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.85rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 0.85rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 12px;
  font-size: 0.9rem;
  text-align: center;
  border: 1px solid #fecaca;
}

/* Divider & Secondary Button */
.auth-divider {
  margin: 2rem 0 1rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

.btn-secondary {
  display: block;
  width: 100%;
  padding: 0.85rem;
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.btn-secondary:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

@media (max-width: 480px) {
  .auth-page {
    padding: 1rem;
  }
  .auth-card {
    padding: 2rem 1.5rem;
  }
}
</style>