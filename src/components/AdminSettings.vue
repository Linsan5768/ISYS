<template>
  <div class="admin-settings-container">
    <div class="main-card">
      <div class="back-arrow" @click="goBack">
        <span class="arrow-icon">←</span>
        <span class="back-text">Back</span>
      </div>

      <h2 class="dashboard-title">System Settings</h2>
      
      <div class="settings-wrapper">
        <!-- 左侧导航 -->
        <div class="settings-nav">
          <div 
            v-for="(section, index) in sections" 
            :key="index"
            :class="['nav-item', { active: currentSection === index }]"
            @click="currentSection = index"
          >
            <span class="nav-icon">{{ section.icon }}</span>
            <span class="nav-text">{{ section.title }}</span>
          </div>
        </div>
        
        <!-- 右侧内容 -->
        <div class="settings-content">
          <!-- 基本设置 -->
          <div v-if="currentSection === 0" class="settings-section">
            <h3 class="section-title">General Settings</h3>
            
            <div class="settings-form">
              <div class="form-group">
                <label>System Name</label>
                <input type="text" v-model="settings.systemName" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Default Items Per Page</label>
                <select v-model="settings.itemsPerPage" class="form-control">
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Date Format</label>
                <select v-model="settings.dateFormat" class="form-control">
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Enable Auto Logout</label>
                <div class="toggle-wrapper">
                  <label class="switch">
                    <input type="checkbox" v-model="settings.autoLogout">
                    <span class="slider round"></span>
                  </label>
                  <span class="toggle-text">{{ settings.autoLogout ? 'Enabled' : 'Disabled' }}</span>
                </div>
              </div>
              
              <div class="form-group" v-if="settings.autoLogout">
                <label>Auto Logout After (minutes)</label>
                <input type="number" v-model="settings.autoLogoutTime" min="5" max="60" class="form-control">
              </div>
            </div>
          </div>
          
          <!-- 安全设置 -->
          <div v-if="currentSection === 1" class="settings-section">
            <h3 class="section-title">Security Settings</h3>
            
            <div class="settings-form">
              <div class="form-group">
                <label>Minimum Password Length</label>
                <input type="number" v-model="settings.minPasswordLength" min="6" max="16" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Password Requirements</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.requireUppercase">
                    Require Uppercase Letter
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.requireLowercase">
                    Require Lowercase Letter
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.requireNumber">
                    Require Number
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.requireSpecial">
                    Require Special Character
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label>Failed Login Attempts Before Lockout</label>
                <input type="number" v-model="settings.maxLoginAttempts" min="3" max="10" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Account Lockout Duration (minutes)</label>
                <input type="number" v-model="settings.lockoutDuration" min="5" max="60" class="form-control">
              </div>
            </div>
          </div>
          
          <!-- 邮件设置 -->
          <div v-if="currentSection === 2" class="settings-section">
            <h3 class="section-title">Email Settings</h3>
            
            <div class="settings-form">
              <div class="form-group">
                <label>SMTP Server</label>
                <input type="text" v-model="settings.smtpServer" class="form-control">
              </div>
              
              <div class="form-group">
                <label>SMTP Port</label>
                <input type="number" v-model="settings.smtpPort" class="form-control">
              </div>
              
              <div class="form-group">
                <label>SMTP Username</label>
                <input type="text" v-model="settings.smtpUsername" class="form-control">
              </div>
              
              <div class="form-group">
                <label>SMTP Password</label>
                <input type="password" v-model="settings.smtpPassword" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Sender Email</label>
                <input type="email" v-model="settings.senderEmail" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Email Verification</label>
                <div class="toggle-wrapper">
                  <label class="switch">
                    <input type="checkbox" v-model="settings.requireEmailVerification">
                    <span class="slider round"></span>
                  </label>
                  <span class="toggle-text">{{ settings.requireEmailVerification ? 'Required' : 'Optional' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 数据库备份 -->
          <div v-if="currentSection === 3" class="settings-section">
            <h3 class="section-title">Database Backup</h3>
            
            <div class="settings-form">
              <div class="form-group">
                <label>Auto Backup</label>
                <div class="toggle-wrapper">
                  <label class="switch">
                    <input type="checkbox" v-model="settings.autoBackup">
                    <span class="slider round"></span>
                  </label>
                  <span class="toggle-text">{{ settings.autoBackup ? 'Enabled' : 'Disabled' }}</span>
                </div>
              </div>
              
              <div class="form-group" v-if="settings.autoBackup">
                <label>Backup Frequency</label>
                <select v-model="settings.backupFrequency" class="form-control">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div class="form-group" v-if="settings.autoBackup">
                <label>Maximum Backups to Keep</label>
                <input type="number" v-model="settings.maxBackups" min="1" max="30" class="form-control">
              </div>
              
              <div class="action-group">
                <button class="btn-primary" @click="backupNow">Backup Now</button>
                <button class="btn-secondary" @click="restoreBackup">Restore from Backup</button>
              </div>
              
              <div class="backup-history" v-if="backupHistory.length > 0">
                <h4>Backup History</h4>
                <table class="backup-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(backup, index) in backupHistory" :key="index">
                      <td>{{ backup.date }}</td>
                      <td>{{ backup.size }}</td>
                      <td>
                        <button class="btn-icon" @click="downloadBackup(backup)">📥</button>
                        <button class="btn-icon btn-delete" @click="deleteBackup(backup)">🗑️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-actions">
        <button class="btn-secondary" @click="resetSettings">Reset to Default</button>
        <button class="btn-primary" @click="saveSettings" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'

const { proxy } = getCurrentInstance()
const router = useRouter()

const sections = [
  { title: 'General', icon: '⚙️' },
  { title: 'Security', icon: '🔒' },
  { title: 'Email', icon: '✉️' },
  { title: 'Backup', icon: '💾' }
]

const currentSection = ref(0)
const settings = ref({})
const originalSettings = ref({})
const backupHistory = ref([
  // Example data
  { date: '2023-07-15 14:30:22', size: '1.2 MB' },
  { date: '2023-07-08 09:15:47', size: '1.1 MB' }
])
const saving = ref(false)
const error = ref(null)

// 加载设置
const loadSettings = async () => {
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/admin/settings')
    // const data = await response.json()
    
    // 修改后:
    const response = await proxy.$axios.get('/api/admin/settings')
    const data = response.data
    
    settings.value = data
    originalSettings.value = { ...data }
  } catch (error) {
    console.error('Error loading settings:', error)
    error.value = 'Failed to load settings. Please try again later.'
  }
}

// 保存设置
const saveSettings = async () => {
  saving.value = true
  
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/admin/settings', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(settingsData)
    // })
    
    // 修改后:
    const response = await proxy.$axios.put('/api/admin/settings', settings.value)
    
    // 处理响应...
    originalSettings.value = { ...settings.value }
    alert('Settings saved successfully!')
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Error saving settings. Please try again later.')
  } finally {
    saving.value = false
  }
}

const resetSettings = () => {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    settings.value = { ...originalSettings.value }
  }
}

const backupNow = async () => {
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/admin/backup')
    // const data = await response.json()
    
    // 修改后:
    const response = await proxy.$axios.post('/api/admin/backup')
    
    // 处理响应...
    const now = new Date()
    backupHistory.value.unshift({
      date: now.toLocaleString(),
      size: '1.3 MB'
    })
    alert('Backup created successfully!')
  } catch (error) {
    console.error('Error creating backup:', error)
    alert('Error creating backup. Please try again later.')
  }
}

const restoreBackup = () => {
  alert('This feature will be implemented in a future release.')
}

const downloadBackup = (backup) => {
  alert(`Downloading backup from ${backup.date}...`)
}

const deleteBackup = (backup) => {
  if (confirm(`Are you sure you want to delete the backup from ${backup.date}?`)) {
    const index = backupHistory.value.indexOf(backup)
    if (index !== -1) {
      backupHistory.value.splice(index, 1)
    }
  }
}

const goBack = () => {
  router.go(-1)
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.admin-settings-container {
  padding: 18px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background-color: #E5E5E5;
}

.main-card {
  position: relative;
  background-color: #E1E1E1;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
}

.back-arrow {
  position: absolute;
  top: 15px;
  left: 15px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 5px 12px;
  transition: background-color 0.2s, transform 0.2s;
}

.back-arrow:hover {
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.arrow-icon {
  font-size: 18px;
  font-weight: bold;
}

.back-text {
  font-weight: 500;
}

.dashboard-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.settings-wrapper {
  display: flex;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.settings-nav {
  width: 200px;
  background-color: #f5f5f5;
  border-right: 1px solid #eee;
}

.nav-item {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #eee;
}

.nav-item:hover {
  background-color: #e9e9e9;
}

.nav-item.active {
  background-color: #1F3A93;
  color: white;
}

.nav-icon {
  font-size: 1.2rem;
}

.settings-content {
  flex: 1;
  padding: 20px;
  min-height: 500px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23333' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  padding-right: 30px;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4caf50;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.slider.round {
  border-radius: 22px;
}

.slider.round:before {
  border-radius: 50%;
}

.toggle-text {
  font-size: 14px;
  color: #555;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.action-group {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.backup-history {
  margin-top: 20px;
}

.backup-history h4 {
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.backup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.backup-table th {
  background-color: #f5f5f5;
  padding: 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #ddd;
}

.backup-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.btn-delete {
  color: #e74c3c;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1F3A93;
  border: 1px solid #1F3A93;
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  color: #555;
}

.btn-primary:hover {
  background-color: #142c70;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-primary:disabled {
  background-color: #7f8c8d;
  border-color: #7f8c8d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .settings-wrapper {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eee;
    display: flex;
    flex-wrap: wrap;
  }
  
  .nav-item {
    flex: 1;
    min-width: 120px;
    justify-content: center;
    text-align: center;
    border-bottom: none;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-icon {
    font-size: 1.5rem;
  }
}
</style> 