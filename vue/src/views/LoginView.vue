<template>
  <div class="auth-page login-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>AsiaBook</h1>
          <p>Connect with students and teachers worldwide</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
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

          <button v-if="!isLoading" type="submit" class="btn-submit">
            Sign In
          </button>
          <button v-else type="button" class="btn-submit loading" disabled>
            <span class="spinner"></span>
            Signing in...
          </button>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>

        <div class="auth-divider">
          <span>Don't have an account?</span>
        </div>

        <router-link :to="{ name: 'signup' }" class="btn-signup">
          Create new account
        </router-link>
      </div>

      <div class="auth-info">
        <div class="info-card">
          <h3>Connect with your network</h3>
          <p>Join thousands of students and teachers sharing knowledge and building friendships.</p>
        </div>
        <div class="info-card">
          <h3>Share your thoughts</h3>
          <p>Post updates, join forums, and participate in clubs to expand your horizons.</p>
        </div>
        <div class="info-card">
          <h3>Build meaningful relationships</h3>
          <p>Find friends, send messages, and grow your academic and social circle.</p>
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
const { login } = useAuth();
const isLoading = ref(false);
const error = ref('');

const formData = ref({
  email: '',
  password: '',
});

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  const result = await login(formData.value.email, formData.value.password);

  if (result.success) {
    await router.push({ name: 'home' });
  } else {
    error.value = result.error || 'Login failed';
  }

  isLoading.value = false;
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-submit {
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
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

.btn-signup {
  display: block;
  padding: 1rem;
  background: #f1f5f9;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 10px;
  text-align: center;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-signup:hover {
  background: #667eea;
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
