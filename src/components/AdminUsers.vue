<template>
  <div class="admin-users-container">
    <div class="main-card">
      <div class="back-arrow" @click="goBack">
        <span class="arrow-icon">←</span>
        <span class="back-text">Back</span>
      </div>

      <h2 class="dashboard-title">User Management</h2>
      
      <div class="dashboard-controls">
        <div class="search-filters">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Search users..." 
            class="search-input"
            @input="filterUsers"
          />
          
          <div class="filter-dropdown">
            <select v-model="roleFilter" @change="filterUsers" class="filter-control">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
        
        <div class="action-controls">
          <button class="btn-refresh" @click="loadUsers">
            <span class="refresh-icon">↻</span> Refresh
          </button>
        </div>
      </div>
      
      <!-- Loading and Error Messages -->
      <div v-if="loading" class="loading-indicator">
        Loading users...
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- Users Table -->
      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Email Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" :class="user.role">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select v-model="user.role" @change="updateUser(user)" class="role-select">
                  <option value="admin">Admin</option>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </td>
              <td>
                <label class="switch">
                  <input type="checkbox" v-model="user.is_active" @change="updateUser(user)">
                  <span class="slider round"></span>
                </label>
                <span class="status-text">{{ user.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td>
                <label class="switch">
                  <input type="checkbox" v-model="user.email_verified" @change="updateUser(user)">
                  <span class="slider round"></span>
                </label>
                <span class="status-text">{{ user.email_verified ? 'Verified' : 'Unverified' }}</span>
              </td>
              <td class="actions-cell">
                <button class="btn-delete" @click="confirmDeleteUser(user)">
                  <span class="delete-icon">🗑️</span>
                </button>
              </td>
            </tr>
            
            <tr v-if="filteredUsers.length === 0 && !loading">
              <td colspan="7" class="no-data">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Confirmation Dialog -->
    <div class="overlay-backdrop" v-if="showConfirmDialog" @click="cancelAction"></div>
    <div class="confirm-dialog" v-if="showConfirmDialog">
      <div class="dialog-header">
        <h3>Confirm Action</h3>
      </div>
      <div class="dialog-content">
        <p>Are you sure you want to delete user <strong>{{ selectedUser?.username }}</strong>?</p>
        <p class="warning-text">This action cannot be undone.</p>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="cancelAction">Cancel</button>
        <button class="btn-confirm" @click="deleteUser">Delete User</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const { proxy } = getCurrentInstance()
const router = useRouter()
const users = ref([])
const filteredUsers = ref([])
const loading = ref(false)
const error = ref(null)
const searchTerm = ref('')
const roleFilter = ref('')
const showConfirmDialog = ref(false)
const selectedUser = ref(null)

const loadUsers = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await proxy.$axios.get('/api/admin/users')
    const data = response.data
    
    if (data.success) {
      users.value = data.users
      filterUsers()
    } else {
      error.value = data.message || 'Failed to load users'
    }
  } catch (err) {
    console.error('Error loading users:', err)
    if (err.response) {
      if (err.response.status === 401) {
        router.push('/login')
        return
      } else if (err.response.status === 403) {
        error.value = 'You do not have permission to access this page.'
        setTimeout(() => {
          router.push('/home')
        }, 3000)
        return
      }
    }
    error.value = 'Error loading users. Please try again later.'
  } finally {
    loading.value = false
  }
}

const filterUsers = () => {
  filteredUsers.value = users.value.filter(user => {
    const matchesSearch = 
      searchTerm.value === '' || 
      user.username.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.value.toLowerCase())
      
    const matchesRole = 
      roleFilter.value === '' || 
      user.role === roleFilter.value
      
    return matchesSearch && matchesRole
  })
}

const updateUser = async (user) => {
  try {
    const response = await proxy.$axios.put(`/api/admin/user/${user.id}`, {
      is_active: user.is_active,
      email_verified: user.email_verified,
      role: user.role
    })
    
    if (response.data.success) {
      alert(`User ${user.username} has been updated.`)
    } else {
      loadUsers()
      alert(response.data.message || 'Failed to update user.')
    }
  } catch (err) {
    console.error('Error updating user:', err)
    loadUsers()
    alert('Error updating user. Please try again later.')
  }
}

const confirmDeleteUser = (user) => {
  selectedUser.value = user
  showConfirmDialog.value = true
}

const cancelAction = () => {
  showConfirmDialog.value = false
  selectedUser.value = null
}

const deleteUser = async () => {
  if (!selectedUser.value) return
  
  try {
    const response = await proxy.$axios.delete(`/api/admin/user/${selectedUser.value.id}`)
    
    if (response.data.success) {
      users.value = users.value.filter(user => user.id !== selectedUser.value.id)
      filterUsers()
      alert(`User ${selectedUser.value.username} has been deleted.`)
    } else {
      alert(response.data.message || 'Failed to delete user.')
    }
  } catch (err) {
    console.error('Error deleting user:', err)
    alert('Error deleting user. Please try again later.')
  } finally {
    showConfirmDialog.value = false
    selectedUser.value = null
  }
}

const goBack = () => {
  router.go(-1)
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-users-container {
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

.dashboard-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  min-width: 250px;
  font-size: 14px;
}

.filter-control {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  font-size: 14px;
  min-width: 120px;
}

.action-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-refresh {
  padding: 8px 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background-color: #388e3c;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.users-table th {
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 0;
}

.users-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.users-table tr:last-child td {
  border-bottom: none;
}

.users-table tr:hover td {
  background-color: #f9f9f9;
}

.role-select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.actions-cell {
  width: 80px;
  text-align: center;
}

.btn-delete {
  background-color: transparent;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 5px;
  transition: all 0.2s;
}

.btn-delete:hover {
  transform: scale(1.1);
}

/* Toggle switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
  margin-right: 8px;
  vertical-align: middle;
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

.status-text {
  vertical-align: middle;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.loading-indicator, .error-message {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  color: #f44336;
}

/* Row styling by role */
tr.admin {
  background-color: rgba(31, 58, 147, 0.05);
}

tr.admin td {
  font-weight: 500;
}

/* Confirmation dialog */
.overlay-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.confirm-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 10px;
  width: 400px;
  max-width: 90%;
  z-index: 101;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialog-content {
  padding: 20px;
  flex-grow: 1;
}

.warning-text {
  color: #e74c3c;
  font-weight: 500;
}

.dialog-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel, .btn-confirm {
  padding: 8px 16px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  color: #555;
}

.btn-confirm {
  background-color: #e74c3c;
  border: 1px solid #e74c3c;
  color: white;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

.btn-confirm:hover {
  background-color: #c0392b;
}

@media (max-width: 768px) {
  .search-filters, .action-controls {
    width: 100%;
  }
  
  .search-input {
    flex-grow: 1;
  }
  
  .users-table th, .users-table td {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style> 