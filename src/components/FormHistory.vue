<template>
  <div class="container">
    <div class="history-card">
      <div class="back-arrow" @click="goBack">
        <span class="arrow-icon">←</span>
        <span class="back-text">Back</span>
      </div>

      <h2 class="card-title">TAX SUBMISSION HISTORY</h2>
      
      <div class="filter-section">
        <div class="filter-label">Filter by Status:</div>
        <div class="filter-buttons">
          <button 
            @click="selectedStatus = 'ALL'" 
            :class="['filter-btn', selectedStatus === 'ALL' ? 'active' : '']"
          >
            ALL
          </button>
          <button 
            @click="selectedStatus = 'SUBMITTED'" 
            :class="['filter-btn', selectedStatus === 'SUBMITTED' ? 'active' : '']"
          >
            SUBMITTED
          </button>
          <button 
            @click="selectedStatus = 'SAVED'" 
            :class="['filter-btn', selectedStatus === 'SAVED' ? 'active' : '']"
          >
            SAVED
          </button>
        </div>
      </div>
      
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="loading" class="loading-message">Loading forms...</div>
      
      <!-- 仅在开发环境显示调试信息 -->
      <div class="debug-info" v-if="isDev && forms.length > 0">
        <div>Total Forms: {{ forms.length }}</div>
        <div>Formatted Forms: {{ formattedForms.length }}</div>
      </div>
      
      <div class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th style="width: 10%;">FORM ID</th>
              <th style="width: 13%;">TYPE</th>
              <th style="width: 13%;">AMOUNT</th>
              <th style="width: 13%;">CREATED</th>
              <th style="width: 13%;">EDITED</th>
              <th style="width: 13%;">SUBMITTED</th>
              <th style="width: 12%;">STATUS</th>
              <th style="width: 13%;">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="form in filteredForms" :key="form.uniqueTrackingId">
              <td><span class="form-id">{{ form.id || 'N/A' }}</span></td>
              <td class="declaration-type">{{ form.declarationType || 'N/A' }}</td>
              <td class="amount">{{ form.totalAmount }}</td>
              <td>{{ form.createdDate }}</td>
              <td>{{ form.lastEditedDate }}</td>
              <td>{{ form.submissionDate }}</td>
              <td class="status-cell" :class="getStatusClass(form.status)">{{ form.status }}</td>
              <td>
                <button @click="viewForm(form)" class="btn-view">VIEW</button>
              </td>
            </tr>
            <tr v-if="filteredForms.length === 0">
              <td colspan="8" class="no-forms">No tax forms found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button @click="createNewForm" class="btn-new-form">CREATE NEW FORM</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import axios from 'axios'

const { proxy } = getCurrentInstance()
const formHistory = ref([])

const loadFormHistory = async () => {
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/forms/history')
    // const data = await response.json()
    
    // 修改后:
    const response = await proxy.$axios.get('/api/forms/history')
    const data = response.data
    
    formHistory.value = data
  } catch (error) {
    console.error('Error loading form history:', error)
  }
}

const selectedStatus = ref('ALL')
const statusMap = {
  SAVED: 'Draft',
  SUBMITTED: 'Submitted'
}
const isDev = process.env.NODE_ENV === 'development'

const formattedForms = ref([])
const filteredForms = ref([])

const loadForms = async () => {
  // Implementation of loadForms method
}

const viewForm = (form) => {
  // Implementation of viewForm method
}

const createNewForm = () => {
  // Implementation of createNewForm method
}

const goBack = () => {
  // Implementation of goBack method
}

const returnToHistory = () => {
  // Implementation of returnToHistory method
}

const getStatusClass = (status) => {
  // Implementation of getStatusClass method
}

onMounted(() => {
  loadForms()
})
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #E5E5E5; /* Updated to match standard color */
  padding: 0;
  box-sizing: border-box;
}

.history-card {
  position: relative;
  background: #E1E1E1;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 1200px; /* 增加最大宽度，确保表格能完整显示 */
  min-height: 600px;
  max-height: 85vh;
  margin: auto;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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

.card-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #333;
}

.filter-section {
  margin: 20px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  margin-right: 15px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn.active {
  background: #1F3A93;
  color: white;
  border-color: #1F3A93;
}

.filter-btn:hover:not(.active) {
  background: #e0e0e0;
}

.history-table-container {
  overflow-x: auto; /* 确保表格可以水平滚动 */
  overflow-y: auto;
  flex: 1;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 确保在小屏幕上表格可以水平滚动 */
@media (max-width: 992px) {
  .history-table {
    min-width: 800px;
  }
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  table-layout: fixed; /* 添加固定表格布局 */
}

.history-table th,
.history-table td {
  padding: 0.7rem;
  text-align: center;
  border-bottom: 1px solid #eee;
  overflow: hidden;
  text-overflow: ellipsis; /* 超出部分显示省略号 */
  white-space: nowrap; /* 防止内容换行 */
}

.history-table th {
  background: #f9f9f9;
  font-weight: 600;
  color: #333;
  font-size: 0.85rem; /* 减小表头字体大小 */
}

.history-table tbody tr:last-child td {
  border-bottom: none;
}

.history-table tbody tr:hover {
  background-color: #f9f9f9;
}

.status-cell {
  font-weight: 600;
  min-width: 100px; /* 确保状态列有足够宽度显示 */
  letter-spacing: -0.3px; /* 减小字母间距 */
}

.status-submitted {
  color: #2e7d32;
  font-weight: bold;
  white-space: nowrap; /* 确保不会换行 */
  overflow: visible; /* 确保可见 */
}

.status-saved {
  color: #ff9800;
  font-weight: bold;
  white-space: nowrap; /* 确保不会换行 */
  overflow: visible; /* 确保可见 */
}

.btn-view {
  background: #1F3A93; /* Updated to match LoginPage button color */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-view:hover {
  background: #142c70; /* Darker version of button color to match LoginPage */
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: auto; /* Push to bottom */
  padding: 15px 0;
  border-top: 1px solid #ddd;
  background-color: #E1E1E1; /* Updated to match the LoginPage card background */
  position: sticky;
  bottom: 0;
  border-radius: 0 0 12px 12px; /* Add rounded corners to match card */
}

.btn-new-form {
  background: #1F3A93; /* Updated to match LoginPage button color */
  color: white;
  border: none;
  border-radius: 4px; /* Match login button */
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  min-width: 200px;
  transition: background-color 0.3s, transform 0.2s;
}

.btn-new-form:hover {
  background: #142c70; /* Darker version of button color to match LoginPage */
  transform: translateY(-2px);
}

.no-forms {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

.loading-message, 
.error-message {
  text-align: center;
  margin: 1rem 0;
  padding: 0.5rem;
  border-radius: 4px;
}

.loading-message {
  background-color: #e3f2fd;
  color: #0d47a1;
  font-size: 1.2rem;
  padding: 1rem;
  text-align: center;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse 1.5s infinite;
  margin: 2rem auto;
  max-width: 300px;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.form-id {
  font-weight: 600;
  font-family: monospace;
  color: #333;
}

.amount {
  font-weight: 600;
  font-family: monospace;
  color: #333;
  white-space: nowrap; /* 防止金额换行 */
}

.debug-info {
  margin: 10px 0;
  padding: 5px;
  background-color: #f0f8ff;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

.declaration-type {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .history-card {
    padding: 1rem;
    border-radius: 8px;
    margin: 0.5rem;
    height: 95vh; /* 移动端使用更大的高度 */
    max-height: 95vh;
  }
  
  .history-table th,
  .history-table td {
    padding: 0.7rem 0.5rem;
    font-size: 0.85rem;
    white-space: nowrap; /* 防止内容换行 */
  }
  
  .card-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-buttons {
    margin-top: 0.5rem;
  }
  
  .btn-view {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>