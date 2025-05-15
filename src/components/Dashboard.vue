<template>
  <!-- 加载指示器和错误信息 -->
  <div v-if="isLoading" class="loading-indicator">
    Loading data...
  </div>
  
  <div v-if="error" class="error-message">
    {{ error }}
    <button @click="useTestData" class="btn-test-data">Use Test Data</button>
  </div>
  
  <div v-if="isTestMode" class="test-mode-badge">
    Test Mode - Displaying Sample Data
  </div>

  <!-- 主面板 -->
  <div class="dashboard-container">
    <div class="main-card">
      <div class="back-arrow" @click="goBack">
        <span class="arrow-icon">←</span>
        <span class="back-text">Back</span>
      </div>

      <h2 class="dashboard-title">Tax Dashboard</h2>
      
      <!-- 组件行 -->
      <div class="components-row">
        <!-- Tax Liabilities (原Tax Tasks) -->
        <div class="inner-card tasks-section">
          <h3>Current Tax Liabilities</h3>
          <div class="info-tooltip">
            <span class="help-icon">?</span>
            <div class="tooltip-content">
              <p><strong>Red items</strong>: Taxes to be paid</p>
              <p>This section shows your current tax obligations</p>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="liabilities-list">
              <div v-for="liability in currentTaxLiabilities.slice(0, 5)" :key="liability.id" class="liability-item">
                <div class="liability-info">
                  <span class="liability-name">{{ liability.name }}</span>
                  <span class="liability-amount" :style="{ color: '#d32f2f' }">
                    {{ formatCurrency(liability.amount) }}
                  </span>
                </div>
                <div class="liability-due-date">
                  Due: {{ formatDate(liability.dueDate) }}
                </div>
                <div class="liability-status" :class="liability.status">
                  {{ liability.statusText }}
                </div>
              </div>
              <!-- 显示调试信息，帮助诊断数据问题 -->
              <div v-if="currentTaxLiabilities.length === 0 && taxLiabilities.length > 0" class="debug-info">
                <p>There are {{ taxLiabilities.length }} tax liability records, but none meet the current display criteria.</p>
                <button @click="refreshTaxLiabilities" class="btn-refresh">Refresh Data</button>
              </div>
              <div v-if="taxLiabilities.length === 0" class="no-data">
                No current tax liabilities
              </div>
            </div>
          </div>
          <div class="fixed-summary" v-if="currentTaxLiabilities.length > 0">
            <div class="summary-item">
              <div class="summary-inner">
                <span class="summary-label">Total Tax Obligations:</span>
                <span class="summary-amount" :style="{ color: '#d32f2f' }">
                  {{ formatCurrency(totalTaxObligations) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment History (原Recent Income) -->
        <div class="inner-card income-table">
          <h3>Financial Transactions History</h3>
          <div class="info-tooltip">
            <span class="help-icon">?</span>
            <div class="tooltip-content">
              <p><strong>Income</strong>: Salary, business income, and investment gains</p>
              <p><strong>Tax Refund/Reimbursement</strong>: Tax returns and expense reimbursements</p>
              <p><strong>Deductible Expenses</strong>: Expenses deductible from taxes</p>
              <p><strong>Investment</strong>: Investment capital outflows</p>
            </div>
          </div>
          <div class="scrollable-content">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in paymentHistory.slice(0, 5)" :key="payment.id">
                  <td>{{ formatDate(payment.date) }}</td>
                  <td class="transaction-type" :class="payment.type">{{ payment.transactionType }}</td>
                  <td>{{ payment.description }}</td>
                  <td class="amount" :class="payment.type === 'credit' ? 'positive' : 'negative'" 
                      :style="{ color: payment.type === 'credit' ? '#2e7d32' : '#d32f2f' }">
                    {{ formatCurrency(payment.amount) }}
                  </td>
                </tr>
                <tr v-if="paymentHistory.length === 0">
                  <td colspan="4" class="no-data">No transaction history</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="fixed-summary" v-if="paymentHistory.length > 0">
            <div class="summary-row">
              <div class="summary-label">Net Income/Expense:</div>
              <div class="amount" :class="netTransactionAmount >= 0 ? 'positive' : 'negative'"
                  :style="{ color: netTransactionAmount >= 0 ? '#2e7d32' : '#d32f2f' }">
                {{ formatCurrency(netTransactionAmount) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Outstanding Credits/Debits -->
        <div class="inner-card expense-table">
          <h3>Financial Items & Tax Estimates</h3>
          <div class="info-tooltip">
            <span class="help-icon">?</span>
            <div class="tooltip-content">
              <p><strong>Credit (Green)</strong>: Available tax refunds, reimbursements, and deductible items</p>
              <p><strong>Debit (Red)</strong>: Estimated taxes due and other financial obligations</p>
              <p>This section shows outstanding financial items and system-estimated tax items</p>
            </div>
          </div>
          <div class="scrollable-content">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in outstandingItems.slice(0, 5)" :key="item.id || item.description">
                  <td class="transaction-type" :class="item.type.toLowerCase()">{{ item.type }}</td>
                  <td>{{ item.description }}</td>
                  <td class="amount" :class="item.type === 'Credit' ? 'positive' : 'negative'"
                      :style="{ color: item.type === 'Credit' ? '#2e7d32' : '#d32f2f' }">
                    {{ formatCurrency(item.amount) }}
                  </td>
                </tr>
                <tr v-if="outstandingItems.length === 0">
                  <td colspan="3" class="no-data">No outstanding items</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="fixed-summary" v-if="outstandingItems.length > 0">
            <div class="summary-row">
              <div class="summary-label">Net Financial Position:</div>
              <div class="amount" :class="netOutstandingAmount >= 0 ? 'positive' : 'negative'"
                  :style="{ color: netOutstandingAmount >= 0 ? '#2e7d32' : '#d32f2f' }">
                {{ formatCurrency(netOutstandingAmount) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons 和视图切换 -->
        <div class="inner-card action-controls">
          <div class="action-buttons">
            <button class="btn-export" @click="showExportOptions = !showExportOptions">
              <span class="action-icon">📊</span> EXPORT
            </button>
            <button class="btn-filter" @click="showFilterOptions = !showFilterOptions">
              <span class="action-icon">🔍</span> FILTER
            </button>
          </div>
          <div class="view-toggle">
            <button 
              class="view-btn" 
              :class="{ 'active': viewMode === 'yearly' }"
              @click="changeViewMode('yearly')"
            >
              Yearly
            </button>
            <button 
              class="view-btn" 
              :class="{ 'active': viewMode === 'quarterly' }"
              @click="changeViewMode('quarterly')"
            >
              Quarterly
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Panel Overlay -->
      <div class="filter-overlay" v-if="showFilterOptions">
        <div class="filter-backdrop" @click="showFilterOptions = false"></div>
        <div class="filter-modal">
          <button class="close-button" @click="showFilterOptions = false">×</button>
          <h3>Filter Options</h3>
          
          <div class="filter-controls">
            <!-- 增加视图模式选择器 -->
            <div class="filter-section">
              <div class="filter-label">View Mode</div>
              <div class="filter-toggle">
                <button 
                  class="toggle-btn" 
                  :class="{ 'active': filterViewMode === 'yearly' }"
                  @click="filterViewMode = 'yearly'"
                >
                  Yearly
                </button>
                <button 
                  class="toggle-btn" 
                  :class="{ 'active': filterViewMode === 'quarterly' }"
                  @click="filterViewMode = 'quarterly'"
                >
                  Quarterly
                </button>
              </div>
            </div>
            
            <!-- Yearly View Filters -->
            <div class="filter-section" v-if="filterViewMode === 'yearly'">
              <div class="filter-label">Year Range</div>
              <div class="filter-row">
                <div class="filter-group half-width">
                  <label for="start-year-filter">From Year</label>
                  <select id="start-year-filter" v-model="filterStartYear" class="select-control">
                    <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                  </select>
                </div>
                
                <div class="filter-group half-width">
                  <label for="end-year-filter">To Year</label>
                  <select id="end-year-filter" v-model="filterEndYear" class="select-control">
                    <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Quarterly View Filters -->
            <div class="filter-section" v-if="filterViewMode === 'quarterly'">
              <div class="filter-label">Quarter Selection</div>
              <div class="filter-row">
                <div class="filter-group half-width">
                  <label for="filter-year">Year</label>
                  <select id="filter-year" v-model="filterQuarterYear" class="select-control">
                    <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                  </select>
                </div>
                
                <div class="filter-group half-width">
                  <label for="filter-quarter">Quarter</label>
                  <select id="filter-quarter" v-model="filterQuarter" class="select-control">
                    <option value="all">All</option>
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="filter-actions">
              <button class="btn-apply" @click="applyFilters">Apply</button>
              <button class="btn-reset" @click="resetFilters">Reset</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Panel Overlay -->
      <div class="filter-overlay" v-if="showExportOptions">
        <div class="filter-backdrop" @click="showExportOptions = false"></div>
        <div class="export-modal">
          <button class="close-button" @click="showExportOptions = false">×</button>
          <h3>Export Options</h3>
          
          <div class="export-controls">
            <div class="filter-section">
              <div class="filter-label">Export Format</div>
              <div class="export-format-toggle">
                <button 
                  class="toggle-btn" 
                  :class="{ 'active': exportFormat === 'csv' }"
                  @click="exportFormat = 'csv'"
                >
                  CSV
                </button>
                <button 
                  class="toggle-btn" 
                  :class="{ 'active': exportFormat === 'pdf' }"
                  @click="exportFormat = 'pdf'"
                >
                  PDF
                </button>
              </div>
            </div>
            
            <div class="filter-section">
              <div class="filter-label">Select Data to Export</div>
              <div class="export-options">
                <div class="export-option">
                  <input type="checkbox" id="export-liabilities" v-model="exportOptions.liabilities">
                  <label for="export-liabilities">Current Tax Liabilities</label>
                </div>
                <div class="export-option">
                  <input type="checkbox" id="export-transactions" v-model="exportOptions.transactions">
                  <label for="export-transactions">Financial Transactions History</label>
                </div>
                <div class="export-option">
                  <input type="checkbox" id="export-outstanding" v-model="exportOptions.outstanding">
                  <label for="export-outstanding">Financial Items & Tax Estimates</label>
                </div>
              </div>
            </div>
            
            <div class="export-actions">
              <button class="btn-cancel" @click="showExportOptions = false">Cancel</button>
              <button class="btn-export-now" @click="exportData">Export</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="components-row charts-row">
        <!-- Income Trend -->
        <div class="inner-card income-chart-card">
          <h3>Income Analysis by {{ viewMode === 'yearly' ? 'Year' : 'Quarter' }}</h3>
          <div class="chart">
            <div v-if="!hasIncomeData" class="chart-placeholder">
              <div class="placeholder-text">Income data will be displayed here</div>
            </div>
            <canvas v-else class="chart-area" id="income-chart"></canvas>
          </div>
        </div>
        
        <!-- Expense Chart - Redesigned to show financial flow -->
        <div class="inner-card expense-chart-card">
          <h3>Financial Trends by {{ viewMode === 'yearly' ? 'Year' : 'Quarter' }}</h3>
          <div class="chart">
            <div v-if="!hasExpenseData" class="chart-placeholder">
              <div class="placeholder-text">Financial trend data will be displayed here</div>
            </div>
            <canvas v-else class="chart-area" id="expense-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue'
import Chart from "chart.js/auto";
import axios from 'axios';

const { proxy } = getCurrentInstance()

// 加载数据的方法
const loadTaxLiabilities = async () => {
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/tax-liabilities')
    // const data = await response.json()
    
    // 修改后:
    const response = await proxy.$axios.get('/api/tax-liabilities')
    const data = response.data
    
    // 处理数据的逻辑保持不变...
  } catch (error) {
    console.error('Error loading tax liabilities:', error)
  }
}

// 其他API调用方法也需要类似修改
const submitForm = async (formData) => {
  try {
    // 修改前:
    // const response = await fetch('https://fanum-backend.onrender.com/api/submit-form', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })
    
    // 修改后:
    const response = await proxy.$axios.post('/api/submit-form', formData)
    
    // 处理响应逻辑...
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

// 其他dashboard方法这里省略，但应用相同的修改模式...
</script>

<style scoped>
/* 主容器样式 */
.dashboard-container {
  padding: 18px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background-color: #E5E5E5;
}

/* 主卡片样式 */
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

.dashboard-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

/* 组件行布局 */
.components-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.charts-row {
  margin-top: 12px;
}

/* 内部卡片样式 */
.inner-card {
  flex: 1;
  background-color: #F5F5F5;
  border-radius: 7px;
  padding: 10px;
  height: 264px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inner-card h3 {
  margin-top: 0;
  margin-bottom: 7px;
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

/* 可滚动内容区域 */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 5px;
  border-bottom: 1px solid #eee;
}

/* 固定摘要区域 */
.fixed-summary {
  padding: 8px 0;
  background-color: #f5f5f5;
  border-top: 1px solid #eee;
  font-weight: bold;
}

.fixed-summary .summary-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 15px;
  background-color: #f9f9f9;
}

.fixed-summary .summary-item {
  padding: 5px 0;
}

/* 任务部分 */
.tasks-section {
  overflow: hidden;
}

.liabilities-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.liability-item {
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.liability-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.liability-name {
  font-weight: 600;
}

.liability-amount {
  font-weight: 600;
  color: #d32f2f;
}

.liability-due-date {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
}

.liability-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.liability-status.overdue {
  background-color: #ffebee;
  color: #c62828;
}

.liability-status.due-soon {
  background-color: #fff8e1;
  color: #ff8f00;
}

.liability-status.upcoming {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* 财务表格部分 */
table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 5px;
  overflow: hidden;
  font-size: 13px;
}

th, td {
  padding: 6px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 2;
}

.amount {
  text-align: right;
  font-weight: 600;
}

.positive {
  color: #2e7d32;
}

.negative {
  color: #d32f2f;
}

.no-data {
  text-align: center;
  padding: 8px;
  color: #888;
  font-style: italic;
}

.summary-label {
  font-weight: bold;
  padding-right: 10px;
}

.summary-amount {
  font-weight: 600;
}

/* 操作控制部分 */
.action-controls {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  justify-content: flex-start;
  margin-bottom: 10px;
}

button {
  padding: 10px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export, .btn-filter, .btn-apply {
  background-color: #1F3A93;
  color: white;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  text-align: center;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-export:hover, .btn-filter:hover, .btn-apply:hover {
  background-color: #142c70;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.btn-reset {
  background-color: #757575;
  color: white;
}

.btn-reset:hover {
  background-color: #616161;
}

/* 图表样式 */
.chart {
  height: 168px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFF;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-style: italic;
}

.placeholder-text {
  text-align: center;
  padding: 10px;
}

.chart-area {
  width: 100%;
  height: 100%;
}

/* 过滤器面板 */
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.filter-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.filter-modal {
  position: relative;
  background-color: #F5F5F5;
  padding: 24px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 1001;
}

.close-button {
  position: absolute;
  right: 10px;
  top: 10px;
  background: none;
  border: none;
  font-size: 24px;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.filter-modal h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.filter-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.half-width {
  flex: 1;
  min-width: 120px;
}

.full-width {
  width: 100%;
}

.filter-group label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.select-control {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  font-size: 13px;
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  justify-content: flex-end;
  width: 100%;
}

/* 加载指示器和错误消息样式 */
.loading-indicator {
  background-color: #e3f2fd;
  color: #0d47a1;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 8px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 8px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.btn-test-data {
  background-color: #1F3A93;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-test-data:hover {
  background-color: #142c70;
}

.test-mode-badge {
  background-color: #ff9800;
  color: white;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 8px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .components-row {
    flex-wrap: wrap;
  }
  
  .inner-card {
    flex: 0 0 48%;
    margin-bottom: 10px;
  }
}

@media (max-width: 768px) {
  .inner-card {
    flex: 0 0 100%;
  }
}

/* 收入支出表格卡片专用样式 */
.income-table, .expense-table {
  height: 264px;
}

/* 图表卡片专用样式 */
.income-chart-card, .expense-chart-card {
  height: 480px;
}

/* 增加图表区域高度 */
.income-chart-card .chart, .expense-chart-card .chart {
  height: 480px;
}

.action-icon {
  font-size: 14px;
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

/* 新样式 */
.transaction-type {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.transaction-type.credit {
  background-color: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
}

.transaction-type.debit {
  background-color: rgba(211, 47, 47, 0.1);
  color: #d32f2f;
}

.summary-row {
  font-weight: bold;
  border-top: 2px solid #ddd;
}

.summary-label {
  text-align: right;
  padding-right: 10px;
}

.info-tooltip {
  display: inline-block;
  position: relative;
  margin-left: 8px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #1F3A93;
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
}

.tooltip-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  width: 250px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 12px;
}

.tooltip-content p {
  margin: 5px 0;
}

.info-tooltip:hover .tooltip-content {
  display: block;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.summary-inner {
  display: flex;
  align-items: center;
}

.summary-label {
  font-weight: bold;
  margin-right: 10px;
}

.summary-amount {
  font-weight: 600;
}

/* View toggle buttons */
.view-toggle {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  width: 100%;
}

.view-btn {
  flex: 1;
  padding: 8px 0;
  background-color: #f1f1f1;
  border: 1px solid #ddd;
  color: #333;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  min-width: 0;
}

.view-btn:first-child {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-right: none;
}

.view-btn:last-child {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-left: none;
}

.view-btn.active {
  background-color: #1F3A93;
  color: white;
  border-color: #1F3A93;
}

.view-btn:hover:not(.active) {
  background-color: #e1e1e1;
}

/* Enhanced chart styles */
.charts-row {
  margin-top: 1.5rem;
}

.chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-area {
  width: 100%;
  height: 100%;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.placeholder-text {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

/* 添加调试信息样式 */
.debug-info {
  margin: 10px 0;
  padding: 10px;
  background-color: #fff3e0;
  border-radius: 4px;
  font-size: 12px;
  color: #e65100;
}

.btn-refresh {
  background-color: #e65100;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  margin-top: 5px;
  cursor: pointer;
}

.btn-refresh:hover {
  background-color: #bf360c;
}

/* 导出选项样式 */
.export-modal {
  position: relative;
  background-color: #F5F5F5;
  padding: 24px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 1001;
}

.export-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-format-toggle {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.toggle-btn {
  flex: 1;
  padding: 8px 15px;
  background-color: #f1f1f1;
  border: 1px solid #ddd;
  color: #333;
  font-weight: 600;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #1F3A93;
  color: white;
  border-color: #1F3A93;
}

.toggle-btn:hover:not(.active) {
  background-color: #e1e1e1;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #1F3A93;
}

.export-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  justify-content: flex-end;
}

.btn-export-now {
  background-color: #1F3A93;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export-now:hover {
  background-color: #142c70;
}

.btn-cancel {
  background-color: #757575;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #616161;
}

.filter-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.filter-toggle {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
</style>