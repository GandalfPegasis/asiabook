<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

// --- MOCK STATE ---
const isSaving = ref(false)

// Global Platform Controls
const platformSettings = ref({
  maintenanceMode: false,
  allowRegistrations: true,
  requireEmailVerification: true,
  autoModerateToxicity: true
})

// Feature Flags (Turn new features on/off without redeploying code)
const featureFlags = ref({
  enableStories: false,
  enableClubCreation: true,
  enableGIFComments: true,
  betaDarkMode: false
})

// Mocking an Audit Log: 
// SELECT * FROM admin_logs ORDER BY created_at DESC
const auditLogs = ref([
  { id: 1, admin: 'Super Admin', action: 'Deleted user "Alex Wu"', time: '10 mins ago', type: 'danger' },
  { id: 2, admin: 'Prof. Lin', action: 'Approved club "IDX Quant Trading"', time: '1 hour ago', type: 'success' },
  { id: 3, admin: 'Super Admin', action: 'Toggled Maintenance Mode ON', time: '2 days ago', type: 'warning' },
  { id: 4, admin: 'Super Admin', action: 'Toggled Maintenance Mode OFF', time: '2 days ago', type: 'success' },
])

// Save Action
const saveSettings = async () => {
  isSaving.value = true
  
  // Simulate an API call: PUT /api/admin/settings
  await new Promise(resolve => setTimeout(resolve, 800))
  
  isSaving.value = false
  // In a real app, you might show a toast notification here
}
</script>

<template>
  <div class="system-settings">
    
    <!-- Page Header -->
    <header class="page-header">
      <div class="title-section">
        <h1>System Configurations</h1>
        <p>Manage platform availability, feature flags, and view security audits.</p>
      </div>
      
      <button 
        class="primary-btn" 
        :class="{ 'saving': isSaving }" 
        @click="saveSettings"
        :disabled="isSaving"
      >
        <Icon :icon="isSaving ? 'heroicons:arrow-path' : 'heroicons:server'" :class="{ 'spin': isSaving }" class="btn-icon" />
        <span>{{ isSaving ? 'Saving Changes...' : 'Save Configuration' }}</span>
      </button>
    </header>

    <div class="settings-grid">
      
      <!-- LEFT COLUMN -->
      <div class="settings-col">
        
        <!-- Global Access Card -->
        <div class="settings-card">
          <div class="card-header">
            <Icon icon="heroicons:globe-alt" class="header-icon" />
            <h2>Global Access</h2>
          </div>
          <div class="settings-list">
            
            <div class="setting-item">
              <div class="setting-info">
                <h3>Maintenance Mode</h3>
                <p>Locks out all non-admin users and shows a "Be right back" screen.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="platformSettings.maintenanceMode">
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3>Allow New Registrations</h3>
                <p>Enable or disable the sign-up form on the login page.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="platformSettings.allowRegistrations">
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3>Require Email Verification</h3>
                <p>Users must verify their .edu email before posting.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="platformSettings.requireEmailVerification">
                <span class="slider"></span>
              </label>
            </div>

          </div>
        </div>

        <!-- Feature Flags Card -->
        <div class="settings-card">
          <div class="card-header">
            <Icon icon="heroicons:beaker" class="header-icon" />
            <h2>Feature Flags (Beta)</h2>
          </div>
          <div class="settings-list">
            
            <div class="setting-item">
              <div class="setting-info">
                <h3>Instagram-style Stories</h3>
                <p>Enable the top-bar stories UI for all students.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="featureFlags.enableStories">
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3>Student Club Creation</h3>
                <p>Allow standard users to submit new club requests.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="featureFlags.enableClubCreation">
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3>Auto-Mod Toxicity Filter</h3>
                <p>Use AI to automatically flag heavy profanity in posts.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="platformSettings.autoModerateToxicity">
                <span class="slider"></span>
              </label>
            </div>

          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="settings-col">
        
        <!-- System Health Card -->
        <div class="settings-card health-card">
          <div class="card-header">
            <Icon icon="heroicons:cpu-chip" class="header-icon" />
            <h2>System Status</h2>
          </div>
          
          <div class="health-metrics">
            <div class="metric-box">
              <span class="metric-title">API Server</span>
              <span class="metric-value online">Operational</span>
            </div>
            <div class="metric-box">
              <span class="metric-title">Database</span>
              <span class="metric-value online">Connected</span>
            </div>
            <div class="metric-box">
              <span class="metric-title">App Version</span>
              <span class="metric-value">v1.2.4</span>
            </div>
          </div>
        </div>

        <!-- Audit Log Card -->
        <div class="settings-card audit-card">
          <div class="card-header">
            <Icon icon="heroicons:clipboard-document-list" class="header-icon" />
            <h2>Recent Admin Actions</h2>
          </div>
          
          <div class="audit-log">
            <div v-for="log in auditLogs" :key="log.id" class="log-item">
              <div class="log-indicator" :class="log.type"></div>
              <div class="log-content">
                <p class="log-action"><strong>{{ log.admin }}</strong> {{ log.action }}</p>
                <span class="log-time">{{ log.time }}</span>
              </div>
            </div>
          </div>
          
          <button class="text-btn">View Full Audit Log</button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.system-settings {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.title-section h1 { font-size: 2rem; color: #0f172a; margin: 0 0 0.5rem 0; }
.title-section p { color: #64748b; margin: 0; }

.primary-btn {
  background: #6366f1; color: white; border: none; padding: 0.85rem 1.5rem;
  border-radius: 14px; font-weight: 600; display: flex; align-items: center;
  gap: 0.5rem; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}
.primary-btn:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); }
.primary-btn.saving { opacity: 0.8; cursor: wait; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Grid Layout */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1.5fr 1fr;
  }
}

.settings-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Cards */
.settings-card {
  background: white; border-radius: 24px; border: 1px solid #e2e8f0;
  padding: 2rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;
  padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9;
}
.header-icon { font-size: 1.5rem; color: #6366f1; }
.card-header h2 { margin: 0; font-size: 1.25rem; color: #0f172a; }

/* Settings List & Toggles */
.settings-list { display: flex; flex-direction: column; gap: 1.5rem; }

.setting-item {
  display: flex; justify-content: space-between; align-items: center; gap: 2rem;
}

.setting-info h3 { margin: 0 0 0.25rem 0; font-size: 1rem; color: #1e293b; }
.setting-info p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4;}

/* iOS Style Toggle Switch */
.toggle-switch {
  position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cbd5e1; transition: .3s; border-radius: 34px;
}
.slider:before {
  position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px;
  background-color: white; transition: .3s; border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(22px); }
input:focus + .slider { box-shadow: 0 0 1px #10b981; }

/* Health Metrics */
.health-metrics { display: flex; flex-direction: column; gap: 1rem; }
.metric-box {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
}
.metric-title { font-weight: 600; color: #334155; }
.metric-value { font-family: monospace; color: #64748b; background: white; padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;}
.metric-value.online { color: #10b981; border-color: #a7f3d0; background: #ecfdf5; font-weight: 600;}

/* Audit Log */
.audit-log { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }
.log-item { display: flex; gap: 1rem; align-items: flex-start; }

.log-indicator {
  width: 10px; height: 10px; border-radius: 50%; margin-top: 0.35rem; flex-shrink: 0;
}
.log-indicator.danger { background: #ef4444; box-shadow: 0 0 0 3px #fee2e2; }
.log-indicator.success { background: #10b981; box-shadow: 0 0 0 3px #d1fae5; }
.log-indicator.warning { background: #f59e0b; box-shadow: 0 0 0 3px #fef3c7; }

.log-content { display: flex; flex-direction: column; gap: 0.2rem; }
.log-action { margin: 0; font-size: 0.9rem; color: #334155; line-height: 1.4; }
.log-action strong { color: #0f172a; }
.log-time { font-size: 0.75rem; color: #94a3b8; }

.text-btn {
  width: 100%; padding: 0.85rem; background: transparent; border: 1px dashed #cbd5e1;
  color: #6366f1; font-weight: 600; border-radius: 12px; cursor: pointer; transition: 0.2s;
}
.text-btn:hover { background: #f8fafc; border-color: #6366f1; }
</style>