<template>
  <div class="auth-page signup-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Join AsiaBook</h1>
          <p>Create your account and start connecting</p>
        </div>

        <form @submit.prevent="handleSignup" class="auth-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="John Doe"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button v-if="!isLoading" type="submit" class="btn-submit">
            Create Account
          </button>
          <button v-else type="button" class="btn-submit loading" disabled>
            <span class="spinner"></span>
            Creating account...
          </button>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>

        <div class="auth-divider">
          <span>Already have an account?</span>
        </div>

        <router-link :to="{ name: 'login' }" class="btn-login">
          Sign In
        </router-link>
      </div>

      <div class="auth-info">
        <div class="info-card">
          <h3>✨ Meet new people</h3>
          <p>Connect with students and teachers from around the world and build meaningful relationships.</p>
        </div>
        <div class="info-card">
          <h3>💬 Share and discuss</h3>
          <p>Participate in forums, clubs, and discussions about topics that interest you.</p>
        </div>
        <div class="info-card">
          <h3>🌍 Expand your network</h3>
          <p>Find study partners, mentors, and friends who share your goals and interests.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { signup } = useAuth();
const isLoading = ref(false);
const error = ref('');

const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const handleSignup = async () => {
  error.value = '';
  isLoading.value = true;

  const result = await signup(
    formData.value.name,
    formData.value.email,
    formData.value.password,
    formData.value.confirmPassword
  );

  if (result.success) {
    await router.push({ name: 'home' });
  } else {
    error.value = result.error || 'Signup failed';
  }

  isLoading.value = false;
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: grid;
  place-items: center;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  width: 100%;
  max-width: 1000px;
  align-items: center;
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-header {
  margin-bottom: 2.5rem;
  text-align: center;
}

.auth-header h1 {
  margin: 0;
  font-size: 2.5rem;
  color: #f5576c;
  font-weight: 700;
}

.auth-header p {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 1rem;
}

.auth-form {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.form-group label {
  color: #1e293b;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-group input {
  padding: 1rem 1.25rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #f5576c;
  box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
}

.btn-submit {
  padding: 1rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(245, 87, 108, 0.3);
}

.btn-submit:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.btn-submit.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.auth-divider {
  text-align: center;
  margin: 2rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.btn-login {
  display: block;
  padding: 1rem;
  background: #f1f5f9;
  color: #f5576c;
  border: 2px solid #f5576c;
  border-radius: 10px;
  text-align: center;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-login:hover {
  background: #f5576c;
  color: white;
}

.auth-info {
  display: grid;
  gap: 1.5rem;
}

.info-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 1.5rem;
  color: white;
  backdrop-filter: blur(10px);
}

.info-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.info-card p {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .auth-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .auth-card {
    padding: 2rem;
  }

  .auth-info {
    display: none;
  }
}
</style>
