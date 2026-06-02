<template>
  <div class="auth-page">
    <div class="auth-card">
      
      <div class="auth-header">
        <h1>Join AsiaBook</h1>
        <p>Step {{ currentStep }} of 2: {{ currentStep === 1 ? 'Account Details' : 'Personal Profile' }}</p>
      </div>

      <form @submit.prevent="currentStep === 1 ? nextStep() : handleSignup()" class="auth-form">
        
        <div v-show="currentStep === 1" class="step-container">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input id="name" v-model="formData.name" type="text" placeholder="John Doe" required />
          </div>

          <div class="form-group">
            <label for="email">Email Address *</label>
            <input id="email" v-model="formData.email" type="email" placeholder="you@example.com" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">Password *</label>
              <input id="password" v-model="formData.password" type="password" placeholder="••••••••" required />
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password *</label>
              <input id="confirmPassword" v-model="formData.confirmPassword" type="password" placeholder="••••••••" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="role">Role *</label>
              <select id="role" v-model="formData.role" required>
                <option value="" disabled>Select role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <div class="form-group">
              <label for="department">Department *</label>
              <select id="department" v-model="formData.department" required>
                <option value="" disabled>Select dept</option>
                <option v-for="dept in departments" :key="dept" :value="dept">
                  {{ dept }}
                </option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn-primary">
            Continue to Profile
          </button>
        </div>

        <div v-show="currentStep === 2" class="step-container">
          
          <div class="form-row">
            <div class="form-group">
              <label for="birthDate">Birth Date</label>
              <input id="birthDate" v-model="formData.birthDate" type="date" />
            </div>

            <div class="form-group">
              <label for="contactNumber">Phone Number</label>
              <input id="contactNumber" v-model="formData.contactNumber" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nationality">Nationality</label>
              <select id="nationality" v-model="formData.nationality">
                <option value="" disabled>Select country</option>
                <option value="Taiwan">Taiwan</option>
                <option value="United States">United States</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
                <option value="Indonesia">Indonesia</option>
                </select>
            </div>

            <div class="form-group">
              <label for="language">Primary Language</label>
              <select id="language" v-model="formData.language">
                <option value="" disabled>Select language</option>
                <option value="English">English</option>
                <option value="Mandarin">Mandarin (Chinese)</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Indonesian">Indonesian</option>
              </select>
            </div>
          </div>

          <div class="button-group">
            <button type="button" class="btn-secondary-outline" @click="currentStep = 1">
              Back
            </button>

            <button v-if="!isLoading" type="submit" class="btn-primary flex-fill">
              Create Account
            </button>
            <button v-else type="button" class="btn-primary flex-fill" disabled>
              <span class="spin-icon"></span> Creating...
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <div v-if="currentStep === 1" class="auth-divider">
        <span>Already have an account?</span>
      </div>

      <router-link v-if="currentStep === 1" :to="{ name: 'login' }" class="btn-secondary">
        Sign In
      </router-link>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { signup } = useAuth();

const currentStep = ref(1);
const isLoading = ref(false);
const error = ref('');

const departments = [
  'Computer Science & Engineering',
  'Business Administration',
  'Medicine & Healthcare',
  'Law',
  'Civil Engineering',
  'Psychology',
  'Education',
  'Nursing',
  'Finance & Accounting',
  'Environmental Science'
];

const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  department: '',
  birthDate: '',
  contactNumber: '',
  nationality: '',
  language: ''
});

const nextStep = () => {
  error.value = '';
  
  // Custom Validation for Step 1
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Passwords do not match.';
    return;
  }
  
  // If native HTML5 validation passes and passwords match, move to step 2
  currentStep.value = 2;
};

const handleSignup = async () => {
  error.value = '';
  isLoading.value = true;

  console.log(formData);

  const result = await signup(
    formData.value.name,
    formData.value.email,
    formData.value.password,
    formData.value.confirmPassword,
    formData.value.role,
    formData.value.department,
    formData.value.contactNumber || undefined,
    formData.value.birthDate || undefined,
    formData.value.nationality || undefined,
    formData.value.language || undefined
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

.auth-card {
  background: white;
  width: 100%;
  max-width: 540px; /* Slightly wider for the 2-step layout */
  border-radius: 24px;
  padding: 2.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.05);
  text-align: center;
}

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
  color: #6366f1; /* Highlighting the step tracker */
  font-weight: 600;
  font-size: 0.95rem;
}

/* Form Styles */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  text-align: left;
}

.step-container {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
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

.form-group input, 
.form-group select {
  padding: 0.85rem 1.15rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  transition: all 0.2s ease;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.form-group select {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2em;
  padding-right: 2.5rem;
}

.form-group input:focus, 
.form-group select:focus {
  background: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Button Match */
.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.flex-fill {
  flex: 1;
}

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
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  padding: 0.85rem 1.5rem;
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary-outline:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
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
  margin-top: 0.5rem;
}

/* Divider & Secondary Button */
.auth-divider {
  margin: 1.5rem 0 1rem;
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

@media (max-width: 600px) {
  .auth-page {
    padding: 1rem;
  }
  .auth-card {
    padding: 2rem 1.5rem;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }
}
</style>