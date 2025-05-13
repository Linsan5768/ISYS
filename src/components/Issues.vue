<script>
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'IssuesPage'
}
</script>

<script setup>
const isLoading = ref(true)
const issues = ref([
  {
    id: 1,
    title: 'Form Submission Error',
    description: 'Users are experiencing errors when trying to submit large forms with multiple attachments.',
    reportedBy: 'user123',
    status: 'open',
    priority: 'high',
    createdAt: '2023-04-18T14:30:00Z'
  },
  {
    id: 2,
    title: 'Data Export Not Working',
    description: 'The export to CSV feature is not working for financial reports.',
    reportedBy: 'business_user5',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2023-04-16T09:15:00Z'
  },
  {
    id: 3,
    title: 'Login Problems After Password Reset',
    description: 'Some users report being unable to log in after using the password reset feature.',
    reportedBy: 'john_doe',
    status: 'open',
    priority: 'high',
    createdAt: '2023-04-15T11:45:00Z'
  },
  {
    id: 4,
    title: 'Dashboard Statistics Not Updating',
    description: 'User dashboard statistics are not being updated in real-time as expected.',
    reportedBy: 'finance_manager',
    status: 'resolved',
    priority: 'low',
    createdAt: '2023-04-10T16:20:00Z'
  },
  {
    id: 5,
    title: 'Form Templates Not Loading',
    description: 'Several users have reported that form templates fail to load under certain conditions.',
    reportedBy: 'tax_advisor',
    status: 'open',
    priority: 'medium',
    createdAt: '2023-04-14T13:50:00Z'
  },
  {
    id: 6,
    title: 'Notification Emails Not Being Sent',
    description: 'Automated notification emails for form approvals are not being sent to users.',
    reportedBy: 'admin_assistant',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2023-04-13T10:05:00Z'
  },
  {
    id: 7,
    title: 'Mobile View Layout Issues',
    description: 'The form submission page has layout issues when viewed on mobile devices.',
    reportedBy: 'ui_specialist',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2023-04-08T09:30:00Z'
  },
  {
    id: 8,
    title: 'Search Functionality Not Working',
    description: 'The search feature for finding previous submissions is not returning correct results.',
    reportedBy: 'data_analyst',
    status: 'open',
    priority: 'high',
    createdAt: '2023-04-12T15:40:00Z'
  }
])

const statusFilter = ref('all')
const priorityFilter = ref('all')
const searchQuery = ref('')

const filteredIssues = computed(() => {
  return issues.value.filter(issue => {
    // Filter by status
    if (statusFilter.value !== 'all' && issue.status !== statusFilter.value) {
      return false
    }
    
    // Filter by priority
    if (priorityFilter.value !== 'all' && issue.priority !== priorityFilter.value) {
      return false
    }
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      return issue.title.toLowerCase().includes(query) || 
             issue.description.toLowerCase().includes(query) ||
             issue.reportedBy.toLowerCase().includes(query)
    }
    
    return true
  })
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Simulate loading
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
})
</script>

<template>
  <div class="issues-container">
    <div class="issues-header">
      <h1>System Issues</h1>
      <p>Manage and resolve reported system issues</p>
    </div>
    
    <div class="filters">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search issues..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-group">
        <label for="status-filter">Status:</label>
        <select id="status-filter" v-model="statusFilter" class="filter-select">
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="priority-filter">Priority:</label>
        <select id="priority-filter" v-model="priorityFilter" class="filter-select">
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading">
      Loading issues...
    </div>
    
    <div v-else-if="filteredIssues.length === 0" class="no-issues">
      <p>No issues found matching your filters.</p>
    </div>
    
    <div v-else class="issues-list">
      <div v-for="issue in filteredIssues" :key="issue.id" class="issue-card">
        <div class="issue-header">
          <h3 class="issue-title">{{ issue.title }}</h3>
          <div class="issue-meta">
            <span :class="['issue-status', issue.status]">{{ issue.status.replace('_', ' ') }}</span>
            <span :class="['issue-priority', issue.priority]">{{ issue.priority }}</span>
          </div>
        </div>
        
        <p class="issue-description">{{ issue.description }}</p>
        
        <div class="issue-footer">
          <span class="issue-reporter">Reported by: {{ issue.reportedBy }}</span>
          <span class="issue-date">{{ formatDate(issue.createdAt) }}</span>
        </div>
        
        <div class="issue-actions">
          <button v-if="issue.status !== 'resolved'" class="action-button resolve">
            Mark as Resolved
          </button>
          <button v-if="issue.status === 'open'" class="action-button progress">
            Start Working
          </button>
          <button class="action-button view">
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.issues-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.issues-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.issues-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.issues-header p {
  font-size: 1.1rem;
  color: var(--text-subtle);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
  background: var(--bg-card);
  color: var(--text-main);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: bold;
  color: var(--text-main);
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
  background: var(--bg-card);
  color: var(--text-main);
}

.loading, .no-issues {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.2rem;
  color: var(--text-subtle);
}

.issues-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .issues-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

.issue-card {
  background: var(--bg-card);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.issue-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.issue-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-main);
  margin: 0;
}

.issue-meta {
  display: flex;
  gap: 0.5rem;
}

.issue-status, .issue-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  text-transform: capitalize;
  font-weight: bold;
}

.issue-status.open {
  background: #ffebee;
  color: #c62828;
}

.issue-status.in_progress {
  background: #fff8e1;
  color: #f57c00;
}

.issue-status.resolved {
  background: #e6f7e6;
  color: #2e7d32;
}

.issue-priority.high {
  background: #ffebee;
  color: #c62828;
}

.issue-priority.medium {
  background: #fff8e1;
  color: #f57c00;
}

.issue-priority.low {
  background: #e6f7e6;
  color: #2e7d32;
}

.issue-description {
  color: var(--text-main);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.issue-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-subtle);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.issue-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s ease, transform 0.3s ease;
}

.action-button.resolve {
  background: #e6f7e6;
  color: #2e7d32;
}

.action-button.resolve:hover {
  background: #c8e6c9;
}

.action-button.progress {
  background: #fff8e1;
  color: #f57c00;
}

.action-button.progress:hover {
  background: #ffe0b2;
}

.action-button.view {
  background: var(--bg-base);
  color: var(--text-main);
}

.action-button.view:hover {
  background: var(--border-color);
}

.action-button:hover {
  transform: translateY(-2px);
}
</style> 