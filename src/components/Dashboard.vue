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

<script>
import Chart from "chart.js/auto";
import axios from 'axios';

export default {
  name: 'UserDashboard',
  created() {
    // 注入toast和notifications服务
    this.toast = this.$root.$parent?.$options?.__compPromise?.data?.provides?.toast || null;
    this.notifications = this.$root.$parent?.$options?.__compPromise?.data?.provides?.notifications || null;
  },
  data() {
    return {
      toast: null,
      notifications: null,
      viewMode: 'yearly', // Can be 'yearly' or 'quarterly'
      hasIncomeData: false,
      hasExpenseData: false,
      incomeChart: null,
      expenseChart: null,
      tasks: [
        { description: 'MONTHLY DECLARATION', completed: false },
        { description: 'MID-YEAR DECLARATION', completed: false },
        { description: 'SALARY DECLARATION', completed: false }
      ],
      incomeData: [],
      expenseData: [],
      showFilterOptions: false,
      showExportOptions: false, // 控制导出选项面板显示
      availableYears: [],
      formData: [], // All tax form data from server
      isLoading: false,
      error: null,
      isTestMode: false, // 是否使用测试数据的标志
      filterStartYear: new Date().getFullYear() - 4,
      filterEndYear: new Date().getFullYear(),
      filterViewMode: 'yearly', // 筛选面板中的视图模式
      filterQuarterYear: new Date().getFullYear(), // 季度视图的年份
      filterQuarter: 'all', // 选择的季度，'all'表示全部
      exportFormat: 'csv', // 默认导出格式
      exportOptions: {
        liabilities: true,
        transactions: true,
        outstanding: true
      },
      maxYearsRange: 10, // 最大可选年份范围
      FORM_STATUS: {
        DRAFT: 'Saved as Draft',
        SUBMITTED: 'Submitted',
        FAILED: 'Submission Failed'
      },
      // 收入类型及其税率
      INCOME_TYPES: {
        SALARY: { 
          label: 'Salary', 
          taxRate: 0.32, 
          thresholds: [
            { min: 0, max: 18200, rate: 0 },
            { min: 18200, max: 45000, rate: 0.19 },
            { min: 45000, max: 120000, rate: 0.325 },
            { min: 120000, max: 180000, rate: 0.37 },
            { min: 180000, max: Infinity, rate: 0.45 }
          ],
          color: 'rgba(75, 192, 192, 0.6)'
        },
        INVESTMENT: { 
          label: 'Investment', 
          taxRate: 0.15, 
          returnRate: 0.08, // 8% 平均投资回报率
          color: 'rgba(153, 102, 255, 0.6)'
        },
        BUSINESS: { 
          label: 'Business', 
          taxRate: 0.25, 
          color: 'rgba(255, 159, 64, 0.6)'
        },
        OTHER: { 
          label: 'Other', 
          taxRate: 0.30, 
          color: 'rgba(201, 203, 207, 0.6)'
        }
      },
      // 信用和扣除类型
      CREDIT_TYPES: {
        REFUND: { 
          label: 'Tax Refund', 
          interestRate: 0.03, // 3% 年利率
          color: 'rgba(75, 192, 192, 0.6)'
        },
        REIMBURSEMENT: { 
          label: 'Reimbursement', 
          interestRate: 0, 
          color: 'rgba(54, 162, 235, 0.6)'
        }
      },
      DEDUCTION_TYPES: {
        BUSINESS_EXPENSE: { 
          label: 'Business Expense', 
          deductionRate: 1.0, // 100% 可抵扣
          color: 'rgba(255, 99, 132, 0.6)'
        },
        EDUCATION: { 
          label: 'Education', 
          deductionRate: 0.5, // 50% 可抵扣
          color: 'rgba(255, 159, 64, 0.6)'
        },
        CHARITY: { 
          label: 'Charity', 
          deductionRate: 1.0, // 100% 可抵扣
          color: 'rgba(255, 205, 86, 0.6)'
        },
        MEDICAL: { 
          label: 'Medical', 
          deductionRate: 0.8, // 80% 可抵扣
          color: 'rgba(153, 102, 255, 0.6)'
        }
      },
      taxLiabilities: [],
      paymentHistory: [],
      outstandingItems: []
    }
  },
  
  methods: {
    // 添加新的标准化日期格式函数
    standardizeDate(dateString) {
      if (!dateString) return null;
      
      // 如果是日期对象，直接返回
      if (dateString instanceof Date) return dateString;
      
      // 移除所有空格，确保格式是YYYY-MM-DD
      const cleanDateStr = String(dateString).replace(/\s+/g, '');
      
      // 检查是否是有效日期格式
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDateStr)) {
        const date = new Date(cleanDateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      console.warn(`无法标准化日期: "${dateString}"`);
      return null;
    },
    
    // Format date for display - 替换原有的formatDate方法
    formatDate(dateString) {
      if (!dateString) return '-';
      
      // 使用标准化函数处理日期
      const date = this.standardizeDate(dateString);
      if (!date || isNaN(date.getTime())) return '-';
      
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // Format currency for display
    formatCurrency(amount) {
      // Format as USD
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    },
    
    // Fetch all form data from the server
    async fetchFormData() {
      this.isLoading = true;
      this.error = null;
      this.isTestMode = false;
      
      console.log("Fetching form data...");
      
      // If running on GitHub Pages, use test data
      if (this.$isGitHubPages) {
        console.log("Running on GitHub Pages, using test data");
        setTimeout(() => {
          this.useTestData();
          this.isLoading = false;
        }, 500);
        return;
      }
      
      try {
        // Use setTimeout to simulate network delay and ensure the loading indicator is visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await axios.get('/api/get_tax_forms');
        console.log("Server response data:", response.data);
        
        if (response.data.success) {
          this.formData = response.data.forms || [];
          console.log(`Retrieved ${this.formData.length} form records`);
          
          // 检查表单数据的格式和日期字段
          if (this.formData.length > 0) {
            console.log("表单日期字段样本:", {
              firstItem: {
                id: this.formData[0].id,
                dateValue: this.formData[0].date,
                dateType: typeof this.formData[0].date,
                allFields: Object.keys(this.formData[0]).join(', ')
              }
            });
          }
          
          // Check if data is empty, use test data if so
          if (!this.formData || this.formData.length === 0) {
            console.log("Server returned empty data, using test data");
            this.useTestData();
          } else {
            this.processFormData();
          }
        } else {
          this.error = response.data.message || 'Failed to load form data';
          console.error("Failed to load form data:", this.error);
          // Try to load data from localStorage
          this.loadFromLocalStorage();
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        this.error = 'Cannot connect to server, trying local data';
        
        // Load from localStorage as a backup
        this.loadFromLocalStorage();
      } finally {
        this.isLoading = false;
      }
    },
    
    // Load form data from localStorage
    loadFromLocalStorage() {
      try {
        const savedFormsData = localStorage.getItem('taxForms');
        console.log("Attempting to load form data from localStorage");
        
        if (savedFormsData) {
          const localForms = JSON.parse(savedFormsData);
          console.log(`Loaded ${localForms.length} form records from localStorage`);
          this.formData = localForms;
          
          // Check if data is empty, use test data if so
          if (!this.formData || this.formData.length === 0) {
            console.log("localStorage data is empty, using test data");
            this.useTestData();
          } else {
            this.processFormData();
          }
        } else {
          console.log("No form data in localStorage, using test data");
          this.useTestData();
        }
      } catch (e) {
        console.error("Error loading local form data:", e);
        this.useTestData();
      }
    },
    
    // Use test data with new salary types and deduction types
    useTestData() {
      console.log("Using test data to display charts");
      this.isTestMode = true;
      
      // Clear test notification markers from localStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sentLiabilityReminders_') || 
              key.startsWith('sentDashboardReminders_')) {
            localStorage.removeItem(key);
          }
        });
        console.log("Cleared test notification markers");
      } catch (e) {
        console.error("Error clearing test notification markers:", e);
      }
      
      // Get current year and month
      const currentYear = new Date().getFullYear();
      
      // Generate test data
      this.formData = [
        // Income data - add new salary items
        {
          id: "test-salary-1",
          date: `${currentYear}-05-05`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "Monthly Salary",
          price: 12000,
          status: "submitted"
        },
        {
          id: "test-salary-2",
          date: `${currentYear}-04-20`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "Fixed Salary",
          price: 1500,
          status: "submitted"
        },
        {
          id: "test-investment-1",
          date: `${currentYear}-03-10`,
          declarationType: "income",
          incomeType: "INVESTMENT",
          declarationName: "Stock Dividends",
          price: 5000,
          status: "submitted"
        },
        {
          id: "test-business-1",
          date: `${currentYear}-02-15`,
          declarationType: "income",
          incomeType: "BUSINESS",
          declarationName: "Business Income",
          price: 8500,
          status: "submitted"
        },
        
        // Add credit and refund items
        {
          id: "test-credit-1",
          date: `${currentYear}-03-15`,
          declarationType: "credit",
          creditType: "REFUND",
          declarationName: "Tax Refund",
          price: 3200,
          status: "submitted"
        },
        {
          id: "test-credit-2",
          date: `${currentYear}-04-10`,
          declarationType: "credit",
          creditType: "REIMBURSEMENT",
          declarationName: "Work Expense Reimbursement",
          price: 1200,
          status: "submitted"
        },
        
        // Add deduction items
        {
          id: "test-deduction-1",
          date: `${currentYear}-02-08`,
          declarationType: "deduction",
          deductionType: "BUSINESS_EXPENSE",
          declarationName: "Office Supplies",
          price: 2500,
          status: "submitted"
        },
        {
          id: "test-deduction-2",
          date: `${currentYear}-03-12`,
          declarationType: "deduction",
          deductionType: "EDUCATION",
          declarationName: "Professional Course",
          price: 1800,
          status: "submitted"
        },
        {
          id: "test-deduction-3",
          date: `${currentYear}-04-05`,
          declarationType: "deduction",
          deductionType: "CHARITY",
          declarationName: "Charity Donation",
          price: 1000,
          status: "submitted"
        },
        {
          id: "test-deduction-4",
          date: `${currentYear}-05-18`,
          declarationType: "deduction",
          deductionType: "MEDICAL",
          declarationName: "Medical Expenses",
          price: 2200,
          status: "submitted"
        },
        
        // Debt and tax items
        {
          id: "test-tax-1",
          date: `${currentYear}-03-20`,
          declarationType: "tax",
          taxType: "SALARY",
          declarationName: "Income Tax Payment",
          price: 3500,
          status: "submitted"
        },
        {
          id: "test-liability-1",
          date: `${currentYear}-04-15`,
          declarationType: "liability",
          declarationName: "Bank Loan Interest",
          price: 1200,
          status: "submitted"
        },
        
        // Add extra month data for annual view testing
        {
          id: "test-salary-month-1",
          date: `${currentYear}-01-15`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "January Salary",
          price: 10000,
          status: "submitted"
        },
        {
          id: "test-salary-month-2",
          date: `${currentYear}-02-15`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "February Salary",
          price: 10000,
          status: "submitted"
        },
        {
          id: "test-investment-month-1",
          date: `${currentYear}-02-20`,
          declarationType: "income",
          incomeType: "INVESTMENT",
          declarationName: "Quarterly Investment Return",
          price: 3500,
          status: "submitted"
        },
        
        // Add data from previous years for annual view
        {
          id: "test-salary-y1",
          date: `${currentYear-1}-05-15`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "Last Year Salary",
          price: 120000,
          status: "submitted"
        },
        {
          id: "test-investment-y1",
          date: `${currentYear-1}-06-10`,
          declarationType: "income",
          incomeType: "INVESTMENT",
          declarationName: "Last Year Investment",
          price: 25000,
          status: "submitted"
        },
        {
          id: "test-deduction-y1",
          date: `${currentYear-1}-07-20`,
          declarationType: "deduction",
          deductionType: "BUSINESS_EXPENSE",
          declarationName: "Last Year Business Expense",
          price: 15000,
          status: "submitted"
        },
        {
          id: "test-salary-y2",
          date: `${currentYear-2}-05-15`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "2 Years Ago Salary",
          price: 110000,
          status: "submitted"
        },
        {
          id: "test-business-y2",
          date: `${currentYear-2}-08-10`,
          declarationType: "income",
          incomeType: "BUSINESS",
          declarationName: "2 Years Ago Business",
          price: 40000,
          status: "submitted"
        },
        {
          id: "test-salary-y3",
          date: `${currentYear-3}-05-15`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "3 Years Ago Salary",
          price: 100000,
          status: "submitted"
        },
        {
          id: "test-salary-y4",
          date: `${currentYear-4}-05-15`,
          declarationType: "income",
          incomeType: "SALARY",
          declarationName: "4 Years Ago Salary",
          price: 90000,
          status: "submitted"
        }
      ];
      
      // 检查测试数据的日期
      console.log("测试数据日期示例:", {
        testDate1: this.formData[0].date,
        testDateType: typeof this.formData[0].date,
        parsedTestDate: new Date(this.formData[0].date).toString()
      });
      
      console.log(`Generated ${this.formData.length} test data`);
      this.processFormData();
    },
    
    // Generate list of available years from form data
    generateAvailableYears() {
      const yearSet = new Set();
      const currentYear = new Date().getFullYear();
      
      // Include current year and past 10 years
      for (let i = 0; i <= 10; i++) {
        yearSet.add(currentYear - i);
      }
      
      // Also add any years from form data that might be outside this range
      this.formData.forEach(form => {
        if (form.date) {
          const year = new Date(form.date).getFullYear();
          if (!isNaN(year)) {
            yearSet.add(year);
          }
        }
      });
      
      // Convert to array and sort
      this.availableYears = Array.from(yearSet).sort((a, b) => b - a);
      
      // Set default start/end years if not already set
      if (!this.filterStartYear || !this.filterEndYear) {
        this.resetYearDefaults();
      }
    },
    
    // Reset year range defaults
    resetYearDefaults() {
      const currentYear = new Date().getFullYear();
      
      // Default to last 5 years (current + past 4)
      this.filterStartYear = currentYear - 4;
      this.filterEndYear = currentYear;
    },
    
    // 确保年份范围在允许的最大范围内 (1-10年)
    validateYearRange() {
      // 确保至少选择1年
      if (this.filterEndYear < this.filterStartYear) {
        this.filterEndYear = this.filterStartYear;
      }
      
      // 确保最多选择10年
      if (this.filterEndYear - this.filterStartYear > this.maxYearsRange - 1) {
        this.filterEndYear = this.filterStartYear + this.maxYearsRange - 1;
      }
    },
    
    // Process form data into categories for dashboard display
    processFormData() {
      this.generateAvailableYears();
      this.validateYearRange();
      
      // 先清空数组，确保完全重新加载
      this.taxLiabilities = [];
      this.paymentHistory = [];
      this.outstandingItems = [];
      
      // 添加额外日志
      console.log(`开始处理表单数据，当前视图模式: ${this.viewMode}`);
      
      // 处理数据
      this.processTaxLiabilities();
      this.processPaymentHistory();
      this.processOutstandingItems();
      
      console.log(`表单数据处理完成，生成了 ${this.taxLiabilities.length} 条税务负债记录`);
      
      // Clear any existing charts first
      if (this.incomeChart) {
        try {
          this.incomeChart.destroy();
        } catch (e) {
          console.error("Failed to destroy income chart:", e);
        }
        this.incomeChart = null;
      }
      
      if (this.expenseChart) {
        try {
          this.expenseChart.destroy();
        } catch (e) {
          console.error("Failed to destroy expense chart:", e);
        }
        this.expenseChart = null;
      }
      
      // Ensure containers are ready before refreshing charts
      this.$nextTick(() => {
        this.ensureChartCanvasReady();
        
        // Now refresh charts with a slight delay
        setTimeout(() => {
          this.refreshCharts();
        }, 200);
      });
      
      this.error = null; // Clear any error messages
    },
    
    // 计算薪资税款，使用阶梯税率
    calculateIncomeTax(amount, incomeType) {
      // 默认使用OTHER类型的税率
      let typeConfig = this.INCOME_TYPES.OTHER;
      
      // 如果提供了收入类型并且存在对应配置，则使用该类型的配置
      if (incomeType && this.INCOME_TYPES[incomeType]) {
        typeConfig = this.INCOME_TYPES[incomeType];
      }
      
      // 如果收入类型是薪资，使用阶梯税率计算
      if (incomeType === 'SALARY' && typeConfig.thresholds) {
        let tax = 0;
        
        // 检查是否为月度收入 (低于年度最低阶梯税率的1/6)
        const isLikelyMonthlyIncome = amount < (typeConfig.thresholds[1]?.min || 18200) / 6;
        
        // 如果似乎是月收入且小于免税额的月值，返回0
        if (isLikelyMonthlyIncome && amount < (typeConfig.thresholds[1]?.min || 18200) / 12) {
          return 0;
        }
        
        // 对于月度收入，我们需要年化后再计算，然后除以12得到月度税款
        if (isLikelyMonthlyIncome) {
          // 年化收入
          const annualizedAmount = amount * 12;
          let taxableAmount = annualizedAmount;
          
          // 遍历每个税率阶梯
          for (const threshold of typeConfig.thresholds) {
            if (taxableAmount <= 0) break;
            
            const taxableInThisBracket = Math.min(
              taxableAmount,
              threshold.max - threshold.min
            );
            
            if (taxableInThisBracket > 0) {
              tax += taxableInThisBracket * threshold.rate;
              taxableAmount -= taxableInThisBracket;
            }
          }
          
          // 返回月度税款
          return tax / 12;
        } else {
          // 对于年度或其他收入，直接计算
          let remainingAmount = amount;
          
          // 遍历每个税率阶梯
          for (const threshold of typeConfig.thresholds) {
            if (remainingAmount <= 0) break;
            
            const taxableInThisBracket = Math.min(
              remainingAmount,
              threshold.max - threshold.min
            );
            
            if (taxableInThisBracket > 0) {
              tax += taxableInThisBracket * threshold.rate;
              remainingAmount -= taxableInThisBracket;
            }
          }
          
          return tax;
        }
      }
      
      // 对于其他类型收入，使用固定税率
      return amount * typeConfig.taxRate;
    },
    
    // 计算投资收益
    calculateInvestmentReturn(amount, investmentType) {
      // 默认使用INVESTMENT类型的配置
      let typeConfig = this.INCOME_TYPES.INVESTMENT;
      
      // 如果提供了特定投资类型并且存在对应配置，则使用该类型的配置
      if (investmentType && this.INCOME_TYPES[investmentType]) {
        typeConfig = this.INCOME_TYPES[investmentType];
      }
      
      // 计算投资收益（简化模型，实际应根据投资期限等因素计算）
      const returnRate = typeConfig.returnRate || 0.05; // 默认5%收益率
      return amount * returnRate;
    },
    
    // 计算信用利息
    calculateCreditInterest(amount, creditType) {
      // 默认使用REFUND类型的配置
      let typeConfig = this.CREDIT_TYPES.REFUND;
      
      // 如果提供了特定信用类型并且存在对应配置，则使用该类型的配置
      if (creditType && this.CREDIT_TYPES[creditType]) {
        typeConfig = this.CREDIT_TYPES[creditType];
      }
      
      // 计算利息（简化模型，实际应根据持有期限等因素计算）
      const interestRate = typeConfig.interestRate || 0;
      return amount * interestRate;
    },
    
    // 计算扣除额
    calculateDeduction(amount, deductionType) {
      // 默认使用BUSINESS_EXPENSE类型的配置
      let typeConfig = this.DEDUCTION_TYPES.BUSINESS_EXPENSE;
      
      // 如果提供了特定扣除类型并且存在对应配置，则使用该类型的配置
      if (deductionType && this.DEDUCTION_TYPES[deductionType]) {
        typeConfig = this.DEDUCTION_TYPES[deductionType];
      }
      
      // 计算可扣除金额
      const deductionRate = typeConfig.deductionRate || 0;
      return amount * deductionRate;
    },
    
    // 获取特定类型的颜色
    getTypeColor(type, category = 'INCOME') {
      const colors = {
        INCOME: {
          SALARY: 'rgba(75, 192, 192, 0.6)',
          BUSINESS: 'rgba(54, 162, 235, 0.6)',
          INVESTMENT: 'rgba(153, 102, 255, 0.6)',
          OTHER: 'rgba(201, 203, 207, 0.6)'
        },
        CREDIT: {
          REFUND: 'rgba(75, 192, 192, 0.6)',
          REIMBURSEMENT: 'rgba(54, 162, 235, 0.6)',
          INTEREST: 'rgba(153, 102, 255, 0.6)'
        },
        DEDUCTION: {
          BUSINESS_EXPENSE: 'rgba(255, 99, 132, 0.6)',
          EDUCATION: 'rgba(255, 159, 64, 0.6)',
          CHARITY: 'rgba(255, 205, 86, 0.6)',
          MEDICAL: 'rgba(75, 192, 192, 0.6)'
        }
      };
      
      if (category && colors[category] && colors[category][type]) {
        return colors[category][type];
      }
      
      // Default colors if not found
      const defaultColors = {
        INCOME: 'rgba(75, 192, 192, 0.6)',
        CREDIT: 'rgba(54, 162, 235, 0.6)',
        DEDUCTION: 'rgba(255, 99, 132, 0.6)'
      };
      
      return defaultColors[category] || 'rgba(201, 203, 207, 0.6)';
    },
    
    // Process tax liabilities from form data
    processTaxLiabilities() {
      console.log(`执行processTaxLiabilities，当前视图模式: ${this.viewMode}`);
      
      // 确保taxLiabilities是一个新数组，避免引用问题
      this.taxLiabilities = [];
      
      // Get the current date for calculating due status
      const currentDate = new Date();
      const currentYear = new Date().getFullYear();
      
      // 计算各类型收入的总和，用于计算税款
      const incomesByType = {};
      const deductionsByType = {};
      
      // 首先统计各类型收入和扣除
      let processedCount = 0;
      this.formData.forEach(form => {
        // 标准化日期
        const standardizedDate = this.standardizeDate(form.date);
        if (standardizedDate) {
          form.standardizedDate = standardizedDate;
          
          // 检查是否在筛选范围内
          const formYear = standardizedDate.getFullYear();
          const formMonth = standardizedDate.getMonth();
          const formQuarter = Math.floor(formMonth / 3) + 1;
          
          // 跳过不在筛选范围内的记录
          if (this.viewMode === 'yearly') {
            if (formYear < this.filterStartYear || formYear > this.filterEndYear) {
              return; // 不在年份范围内，跳过
            }
          } else if (this.viewMode === 'quarterly') {
            if (formYear !== this.filterQuarterYear) {
              return; // 不在选定年份，跳过
            }
            
            if (this.filterQuarter !== 'all' && formQuarter.toString() !== this.filterQuarter) {
              return; // 不在选定季度，跳过
            }
          }
        }
        
        // 只处理提交状态的表单
        if (form.status === 'submitted' || form.status === this.FORM_STATUS.SUBMITTED) {
          processedCount++;
          
          // 处理收入表单
          if (form.declarationType === 'income' || form.declaration_type === 'income') {
            // 获取收入类型，默认为OTHER
            const incomeType = form.incomeType || 'OTHER';
            
            // 初始化收入类型计数器
            if (!incomesByType[incomeType]) {
              incomesByType[incomeType] = 0;
            }
            
            // 累计该类型的收入
            incomesByType[incomeType] += (form.price || 0);
          }
          
          // 处理扣除表单
          else if (form.declarationType === 'deduction' || form.declaration_type === 'deduction') {
            // 获取扣除类型，默认为BUSINESS_EXPENSE
            const deductionType = form.deductionType || 'BUSINESS_EXPENSE';
            
            // 初始化扣除类型计数器
            if (!deductionsByType[deductionType]) {
              deductionsByType[deductionType] = 0;
            }
            
            // 累计该类型的扣除
            deductionsByType[deductionType] += (form.price || 0);
          }
        }
      });
      
      console.log(`处理了 ${processedCount} 个表单记录进行税负计算`);
      
      // 计算扣除后的应税收入
      let totalDeductions = 0;
      for (const [deductionType, amount] of Object.entries(deductionsByType)) {
        const deductibleAmount = this.calculateDeduction(amount, deductionType);
        totalDeductions += deductibleAmount;
      }
      
      // 根据收入计算应缴税款并添加到负债列表
      for (const [incomeType, totalIncome] of Object.entries(incomesByType)) {
        // 计算该类型收入占总收入的比例
        const totalAllIncome = Object.values(incomesByType).reduce((sum, amount) => sum + amount, 0);
        const incomeRatio = totalIncome / totalAllIncome;
        
        // 按比例分配扣除额
        const applicableDeduction = totalDeductions * incomeRatio;
        
        // 计算应税收入和税款
        const taxableIncome = Math.max(0, totalIncome - applicableDeduction);
        const taxAmount = this.calculateIncomeTax(taxableIncome, incomeType);
        
        // 创建对应的税务负债项
        if (taxAmount > 0) {
          // 设置到期日为当前日期后30天
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          
          // 确定税款描述，根据收入判断是月度还是年度税
          const isLikelyMonthlyIncome = incomeType === 'SALARY' && 
              taxableIncome < (this.INCOME_TYPES.SALARY.thresholds[1]?.min || 18200) / 6;
          
          const taxDescription = isLikelyMonthlyIncome 
              ? `Monthly ${this.INCOME_TYPES[incomeType]?.label || 'Income'} Tax` 
              : `${this.INCOME_TYPES[incomeType]?.label || 'Income'} Tax`;
          
          // 计算状态
          let status = 'upcoming';
          let statusText = 'Upcoming';
          
          // 创建唯一ID，包含视图模式信息，确保不会因为视图切换而丢失
          const taxId = `tax-${incomeType.toLowerCase()}-${currentDate.getTime()}-${this.viewMode}`;
          
          this.taxLiabilities.push({
            id: taxId,
            name: taxDescription,
            amount: taxAmount,
            dueDate: dueDate,
            status: status,
            statusText: statusText,
            color: this.INCOME_TYPES[incomeType]?.color || 'rgba(255, 99, 132, 0.6)'
          });
        }
        
        // 对于投资类型，增加潜在收益预测
        if (incomeType === 'INVESTMENT') {
          const returnAmount = this.calculateInvestmentReturn(totalIncome, incomeType);
          
          // 预测收益日期为当前日期后90天
          const projectedDate = new Date();
          projectedDate.setDate(projectedDate.getDate() + 90);
          
          this.taxLiabilities.push({
            id: `return-investment-${currentDate.getTime()}-${this.viewMode}`,
            name: 'Projected Investment Return',
            amount: -returnAmount, // 负值表示收益
            dueDate: projectedDate,
            status: 'upcoming',
            statusText: 'Projected',
            color: this.INCOME_TYPES.INVESTMENT.color
          });
        }
      }
      
      // 生成季度估算税项，确保所有季度都有估算税
      if (this.viewMode === 'yearly' || this.filterQuarter === 'all') {
        // 为当前和下一年计算季度估算税
        const taxYears = [currentYear];
        if (currentYear + 1 <= this.filterEndYear) {
          taxYears.push(currentYear + 1);
        }
        
        taxYears.forEach(year => {
          // 确保年份在过滤范围内
          if (year >= this.filterStartYear && year <= this.filterEndYear) {
            // Q1 (due April 15)
            const q1Tax = this.calculateEstimatedQuarterlyTax(1);
            if (q1Tax > 0) {
              const q1DueDate = new Date(year, 3, 15); // April 15
              
              // 计算状态
              let status = 'upcoming';
              let statusText = 'Upcoming';
              
              if (q1DueDate < currentDate) {
                status = 'overdue';
                statusText = 'Overdue';
              } else if (q1DueDate.getTime() - currentDate.getTime() < 7*24*60*60*1000) {
                status = 'due-soon';
                statusText = 'Due Soon';
              }
              
              this.taxLiabilities.push({
                id: `estimated-tax-q1-${year}-${this.viewMode}`,
                name: `Q1 ${year} Estimated Tax`,
                amount: q1Tax,
                dueDate: q1DueDate,
                status: status,
                statusText: statusText,
                color: 'rgba(255, 152, 0, 0.6)'
              });
            }
            
            // Q2 (due June 15)
            const q2Tax = this.calculateEstimatedQuarterlyTax(2);
            if (q2Tax > 0) {
              const q2DueDate = new Date(year, 5, 15); // June 15
              
              // 计算状态
              let status = 'upcoming';
              let statusText = 'Upcoming';
              
              if (q2DueDate < currentDate) {
                status = 'overdue';
                statusText = 'Overdue';
              } else if (q2DueDate.getTime() - currentDate.getTime() < 7*24*60*60*1000) {
                status = 'due-soon';
                statusText = 'Due Soon';
              }
              
              this.taxLiabilities.push({
                id: `estimated-tax-q2-${year}-${this.viewMode}`,
                name: `Q2 ${year} Estimated Tax`,
                amount: q2Tax,
                dueDate: q2DueDate,
                status: status,
                statusText: statusText,
                color: 'rgba(255, 152, 0, 0.6)'
              });
            }
            
            // Q3 (due September 15)
            const q3Tax = this.calculateEstimatedQuarterlyTax(3);
            if (q3Tax > 0) {
              const q3DueDate = new Date(year, 8, 15); // September 15
              
              // 计算状态
              let status = 'upcoming';
              let statusText = 'Upcoming';
              
              if (q3DueDate < currentDate) {
                status = 'overdue';
                statusText = 'Overdue';
              } else if (q3DueDate.getTime() - currentDate.getTime() < 7*24*60*60*1000) {
                status = 'due-soon';
                statusText = 'Due Soon';
              }
              
              this.taxLiabilities.push({
                id: `estimated-tax-q3-${year}-${this.viewMode}`,
                name: `Q3 ${year} Estimated Tax`,
                amount: q3Tax,
                dueDate: q3DueDate,
                status: status,
                statusText: statusText,
                color: 'rgba(255, 152, 0, 0.6)'
              });
            }
            
            // Q4 (due January 15 next year)
            const q4Tax = this.calculateEstimatedQuarterlyTax(4);
            if (q4Tax > 0) {
              const q4DueDate = new Date(year + 1, 0, 15); // January 15 next year
              
              // 计算状态
              let status = 'upcoming';
              let statusText = 'Upcoming';
              
              if (q4DueDate < currentDate) {
                status = 'overdue';
                statusText = 'Overdue';
              } else if (q4DueDate.getTime() - currentDate.getTime() < 7*24*60*60*1000) {
                status = 'due-soon';
                statusText = 'Due Soon';
              }
              
              this.taxLiabilities.push({
                id: `estimated-tax-q4-${year}-${this.viewMode}`,
                name: `Q4 ${year} Estimated Tax`,
                amount: q4Tax,
                dueDate: q4DueDate,
                status: status,
                statusText: statusText,
                color: 'rgba(255, 152, 0, 0.6)'
              });
            }
          }
        });
      } else if (this.viewMode === 'quarterly' && this.filterQuarter !== 'all') {
        // 针对特定季度的视图，只添加该季度的估算税
        const quarter = parseInt(this.filterQuarter);
        const year = this.filterQuarterYear;
        
        // 确定季度税应该的到期日
        let dueDateMonth, dueDateDay;
        switch(quarter) {
          case 1: dueDateMonth = 3; dueDateDay = 15; break; // Q1: April 15
          case 2: dueDateMonth = 5; dueDateDay = 15; break; // Q2: June 15
          case 3: dueDateMonth = 8; dueDateDay = 15; break; // Q3: September 15
          case 4: dueDateMonth = 0; dueDateDay = 15; // Q4: January 15 next year (month 0 = January)
          break;
        }
        
        const dueDate = quarter === 4 
          ? new Date(year + 1, dueDateMonth, dueDateDay)
          : new Date(year, dueDateMonth, dueDateDay);
        
        const quarterlyTax = this.calculateEstimatedQuarterlyTax(quarter);
        if (quarterlyTax > 0) {
          // 计算状态
          let status = 'upcoming';
          let statusText = 'Upcoming';
          
          if (dueDate < currentDate) {
            status = 'overdue';
            statusText = 'Overdue';
          } else if (dueDate.getTime() - currentDate.getTime() < 7*24*60*60*1000) {
            status = 'due-soon';
            statusText = 'Due Soon';
          }
          
          this.taxLiabilities.push({
            id: `estimated-tax-q${quarter}-${year}-${this.viewMode}`,
            name: `Q${quarter} ${year} Estimated Tax`,
            amount: quarterlyTax,
            dueDate: dueDate,
            status: status,
            statusText: statusText,
            color: 'rgba(255, 152, 0, 0.6)'
          });
        }
      }
      
      // 处理现有信用和退税项目，增加利息计算
      this.formData.forEach(form => {
        if (form.status === 'submitted' || form.status === this.FORM_STATUS.SUBMITTED) {
          // 处理信用类型（退税、报销等）
          if (form.declarationType === 'credit' || form.declaration_type === 'credit' || 
              form.declarationType === 'refund' || form.declaration_type === 'refund') {
            
            // 获取信用类型
            const creditType = form.creditType || 'REFUND';
            const amount = form.price || 0;
            
            // 计算利息（如果适用）
            const interestAmount = this.calculateCreditInterest(amount, creditType);
            
            // 如果有利息，添加到负债列表（负值表示收益）
            if (interestAmount > 0) {
              // 利息预计到账日期为当前日期后60天
              const interestDate = new Date();
              interestDate.setDate(interestDate.getDate() + 60);
              
              this.taxLiabilities.push({
                id: `interest-${creditType.toLowerCase()}-${currentDate.getTime()}`,
                name: `${this.CREDIT_TYPES[creditType]?.label || 'Credit'} Interest`,
                amount: -interestAmount, // 负值表示收益
                dueDate: interestDate,
                status: 'upcoming',
                statusText: 'Projected',
                color: this.CREDIT_TYPES[creditType]?.color || 'rgba(75, 192, 192, 0.6)'
              });
            }
          }
        }
      });
      
      // 处理现有税务负债表单 - 不根据视图模式过滤，确保在任何视图下都显示所有税务负债
      let liabilityCount = 0;
      this.formData.forEach(form => {
        // Filter for draft forms or tax payment forms - 注意这里不根据视图模式过滤
        if (form.status === 'draft' || 
            form.declaration_type === 'tax' || 
            form.declarationType === 'tax' || 
            form.declaration_type === 'liability' || 
            form.declarationType === 'liability') {
          
          liabilityCount++;
          
          // 使用标准化后的日期
          const standardizedDate = this.standardizeDate(form.date);
          const formDate = standardizedDate || new Date();
          const dueDate = form.due_date ? this.standardizeDate(form.due_date) : new Date(formDate.getTime() + 30*24*60*60*1000);
          
          // Calculate status
          let status = 'upcoming';
          let statusText = 'Upcoming';
          
          if (dueDate < currentDate) {
            status = 'overdue';
            statusText = 'Overdue';
          } else if (dueDate.getTime() - currentDate.getTime() < 7*24*60*60*1000) {
            status = 'due-soon';
            statusText = 'Due Soon';
          }
          
          // 分配合适的颜色
          let color = 'rgba(255, 99, 132, 0.6)'; // 默认红色
          if (form.taxType && this.INCOME_TYPES[form.taxType]) {
            color = this.INCOME_TYPES[form.taxType].color;
          }
          
          // 创建唯一ID，包含视图模式信息，确保不会因为视图切换而丢失
          const liabilityId = form.id + `-${this.viewMode}`;
          
          this.taxLiabilities.push({
            id: liabilityId,
            name: form.declaration_name || form.declarationName || 'Tax Liability',
            amount: form.price || 0,
            dueDate: dueDate,
            status: status,
            statusText: statusText,
            formData: form,
            color: color
          });
        }
      });
      
      // 处理现有信用类型表单，添加到负债列表（负值表示收益）
      this.formData.forEach(form => {
        if ((form.status === 'submitted' || form.status === this.FORM_STATUS.SUBMITTED) &&
            (form.declarationType === 'credit' || form.declaration_type === 'credit')) {
          
          // 获取信用类型
          const creditType = form.creditType || 'REFUND';
          const amount = form.price || 0;
          
          // 使用标准化后的日期
          const standardizedDate = this.standardizeDate(form.date);
          const formDate = standardizedDate || new Date();
          
          // 设置到账日期为当前日期后14天
          const receivableDate = new Date(formDate);
          receivableDate.setDate(receivableDate.getDate() + 14);
          
          // 创建唯一ID，包含视图模式信息
          const creditId = `credit-${form.id}-${this.viewMode}`;
          
          // 添加已有的信用记录到负债列表，显示为未来收益
          this.taxLiabilities.push({
            id: creditId,
            name: `${this.CREDIT_TYPES[creditType]?.label || 'Credit'} Receivable`,
            amount: -amount, // 负值表示收益
            dueDate: receivableDate,
            status: 'upcoming',
            statusText: 'Upcoming',
            formData: form,
            color: this.CREDIT_TYPES[creditType]?.color || 'rgba(75, 192, 192, 0.6)'
          });
        }
      });
      
      // Sort liabilities by due date (earliest first)
      this.taxLiabilities.sort((a, b) => {
        if (a.dueDate instanceof Date && b.dueDate instanceof Date) {
          return a.dueDate - b.dueDate;
        }
        return 0; // 如果日期不是有效的Date对象，则不改变顺序
      });
      
      console.log(`处理了 ${liabilityCount} 条税务负债记录，生成了 ${this.taxLiabilities.length} 条负债显示项，当前视图模式: ${this.viewMode}`);
      
      // 强制更新响应式数据
      this.$nextTick(() => {
        console.log(`税务负债数据更新后检查: 总数=${this.taxLiabilities.length}, 当前显示数=${this.currentTaxLiabilities.length}`);
      });
      
      // 检查即将到期的负债，发送通知提醒
      this.sendUpcomingLiabilitiesNotifications();
    },
    
    // 新增方法：发送税务负债通知
    sendUpcomingLiabilitiesNotifications() {
      // 从useAuth获取当前用户信息
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        console.log('User not logged in, skipping notifications');
        return;
      }
      
      const userObj = JSON.parse(currentUser);
      if (!userObj.isLoggedIn) {
        console.log('User not logged in, skipping notifications');
        return;
      }
      
      // 获取用户ID或Email作为唯一标识
      const userId = userObj.email || 'anonymous';
      
      // 检查用户是否是管理员，如果是，则跳过税务提醒
      if (userObj.isAdmin) {
        console.log('User is admin, skipping tax liability notifications');
        return;
      }
      
      // 如果未获取toast或notifications服务，则跳过
      if (!this.toast || !this.notifications) {
        console.log('Toast or notification service unavailable, skipping notifications');
        return;
      }
      
      // 开发环境中检查：跳过发送2025年及以后的未来通知
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      if (this.taxLiabilities.some(l => {
        const liabilityYear = l.dueDate ? l.dueDate.getFullYear() : 0;
        return liabilityYear > currentYear + 1; // 跳过超过当前年份+1年的通知
      })) {
        console.log('Detected test data with future dates, skipping notifications');
        return;
      }
      
      // 发送通知前先检查：使用currentTaxLiabilities计算属性获取当前税务负债
      const liabilities = this.currentTaxLiabilities || [];
      
      if (liabilities.length > 0) {
        // 延迟发送通知
        setTimeout(() => {
          // 汇总总金额
          const totalAmount = liabilities.reduce((sum, item) => sum + item.amount, 0);
          
          // 发送汇总通知
          this.toast.warning(`You have ${liabilities.length} tax ${liabilities.length === 1 ? 'liability' : 'liabilities'} totaling ${this.formatCurrency(totalAmount)}`, {
            title: 'Tax Liability Alert',
            duration: 8000
          });
          
          // 添加详细通知到通知中心，包含用户ID
          liabilities.forEach(liability => {
            const daysLeft = Math.ceil((liability.dueDate - currentDate) / (24 * 60 * 60 * 1000));
            const dueText = daysLeft <= 7 
              ? `due in ${daysLeft} days` 
              : `due on ${this.formatDate(liability.dueDate)}`;
            
            this.notifications.addNotification({
              userId: userId,
              title: 'Tax Liability Alert',
              message: `${liability.name}: ${this.formatCurrency(liability.amount)}, ${dueText}`,
              time: new Date(),
              read: false
            });
          });
          
          // 记录今天已经向该用户发送过提醒
          const today = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
          const storageKey = `sentDashboardReminders_${userId}`;
          const sentDashboardReminders = JSON.parse(localStorage.getItem(storageKey) || '{}');
          sentDashboardReminders[today] = true;
          localStorage.setItem(storageKey, JSON.stringify(sentDashboardReminders));
          console.log(`Tax liability reminders sent to user ${userId} and recorded for today`);
        }, 1500);
      }
    },
    
    // Process payment history from form data
    processPaymentHistory() {
      this.paymentHistory = [];
      console.log("开始处理支付历史...");
      
      this.formData.forEach(form => {
        const standardizedDate = this.standardizeDate(form.date);
        if (standardizedDate) {
          form.standardizedDate = standardizedDate;
        }
        
        if (form.status === 'submitted' || form.status === this.FORM_STATUS.SUBMITTED) {
          // 新增：如果表单类型是 'credit' 或 'refund'，则不在支付历史中显示，这些将显示在 Outstanding Items 中
          const declType = form.declarationType || form.declaration_type;
          if (declType === 'credit' || declType === 'refund') {
            console.log(`表单 ${form.id} 类型为 ${declType}，将不在 Financial Transactions History 中显示，改在 Financial Items & Tax Estimates 中显示。`);
            return; // 跳过添加到 paymentHistory
          }

          // 跳过不在当前过滤范围内的数据
          if (form.standardizedDate) {
            const formYear = form.standardizedDate.getFullYear();
            const formMonth = form.standardizedDate.getMonth();
            const formQuarter = Math.floor(formMonth / 3) + 1;
            
            // 检查是否在筛选范围内
            if (this.viewMode === 'yearly') {
              // 年视图: 检查年份是否在选定范围内
              if (formYear < this.filterStartYear || formYear > this.filterEndYear) {
                console.log(`表单 ${form.id} 日期 ${form.date} 不在年份筛选范围内(${this.filterStartYear}-${this.filterEndYear})，已跳过`);
                return; // 不在过滤范围内，跳过
              }
            } else if (this.viewMode === 'quarterly') {
              // 季度视图: 检查年份和季度
              if (formYear !== this.filterQuarterYear) {
                console.log(`表单 ${form.id} 日期 ${form.date} 不在季度筛选年份内(${this.filterQuarterYear})，已跳过`);
                return; // 不在选定年份，跳过
              }
              
              // 如果指定了特定季度，检查是否匹配
              if (this.filterQuarter !== 'all' && formQuarter.toString() !== this.filterQuarter) {
                console.log(`表单 ${form.id} 日期 ${form.date} 不在季度筛选季度内(Q${this.filterQuarter})，已跳过`);
                return; // 不在选定季度，跳过
              }
            }
          } else {
            console.log(`警告: 表单 ${form.id} 无法解析日期 "${form.date}"`);
          }
          
          // 处理收入类型，确保正确识别salary
          if (form.declarationType === 'income' || form.declaration_type === 'income') {
            // 检查收入类型的各种情况
            const description = (form.declarationName || form.declaration_name || '').toLowerCase();
            
            // 检查表单名称和描述是否包含salary关键字
            if (description.includes('salary') || description.includes('wage') || description.includes('pay')) {
              console.log(`检测到工资关键字在描述中: "${description}"`);
              form.incomeType = 'SALARY';
            }
            
            // 如果已有incomeType，确保标准化为大写
            if (form.incomeType) {
              // 确保转为大写
              form.incomeType = form.incomeType.toUpperCase();
              console.log(`处理收入表单: ${form.id}, 收入类型已标准化为: ${form.incomeType}`);
            } else {
              // 如果没有指定收入类型但名称包含工资相关词汇，设置为SALARY
              form.incomeType = 'SALARY';
              console.log(`为表单指定默认收入类型SALARY: ${form.id}`);
            }
          }
          
          // Determine payment type (credit or debit)
          let paymentType = 'debit';
          let flowType = '';
          
          // 确保所有income类型都是credit
          if (form.declarationType === 'income' || form.declaration_type === 'income' ||
              form.declarationType === 'credit' || form.declaration_type === 'credit' ||
              form.declarationType === 'refund' || form.declaration_type === 'refund' ||
              (form.declarationName && form.declarationName.toLowerCase().includes('salary'))) {
            paymentType = 'credit';
            flowType = 'Income';
          } else {
            paymentType = this.determinePaymentType(form);
            flowType = paymentType === 'credit' ? 'Income' : 'Expense';
          }
          
          // Create a more descriptive payment description based on form type
          let description = form.declaration_name || form.declarationName || 'Tax Payment';
          let categoryLabel = '';
          
          // 处理收入类型标签
          if (form.declarationType === 'income' && form.incomeType) {
            // 已经在上面确保了incomeType为大写
            categoryLabel = this.getTypeLabel(form.incomeType, 'INCOME');
            description = `${categoryLabel}: ${description}`;
          } else if (form.declarationType === 'credit' && form.creditType) {
            categoryLabel = this.getTypeLabel(form.creditType, 'CREDIT');
            description = `${categoryLabel}: ${description}`;
          } else if (form.declarationType === 'deduction' && form.deductionType) {
            categoryLabel = this.getTypeLabel(form.deductionType, 'DEDUCTION');
            description = `${categoryLabel}: ${description}`;
          }
          
          // Create a clear transaction type label
          let transactionType = '';
          if (form.declarationType === 'income') {
            transactionType = 'Income';
          } else if (form.declarationType === 'credit') {
            // 只在Financial Transactions History中显示Credit类型，不在Outstanding Items中显示
            transactionType = 'Tax Credit';
          } else if (form.declarationType === 'deduction') {
            transactionType = 'Deductible Expense';
          } else if (form.declarationType === 'investment') {
            transactionType = 'Investment';
          } else {
            transactionType = flowType;
          }
          
          // 避免在收入历史中重复添加已在Outstanding Items中显示的Credit类型表单
          // Credit类型的表单只显示在Financial Transactions History中
          this.paymentHistory.push({
            id: form.id,
            date: form.standardizedDate || new Date(), // 使用标准化后的日期
            rawDate: form.date, // 保留原始日期以便调试
            description: description,
            amount: form.price || 0,
            type: paymentType,
            transactionType: transactionType,
            categoryLabel: categoryLabel,
            formData: form
          });
          
          console.log(`添加记录: ID=${form.id}, 标准化日期=${form.standardizedDate ? form.standardizedDate.toISOString() : 'N/A'}, 原始日期=${form.date}, 类型=${transactionType}, 描述=${description}`);
        }
      });
      
      // Sort payment history by date (most recent first)
      // 排序现在使用标准化后的日期，应该不会有问题
      this.paymentHistory.sort((a, b) => {
        // 使用标准化后的日期进行排序
        if (a.date && b.date) {
          return b.date - a.date;
        }
        
        // 后备排序机制
        return a.id > b.id ? -1 : 1;
      });
      
      // 打印支付历史的排序结果
      console.log("排序后的支付历史记录(前5条):");
      this.paymentHistory.slice(0, 5).forEach(item => {
        console.log(`ID=${item.id}, 标准化日期=${item.date instanceof Date ? item.date.toISOString() : item.date}, 原始日期=${item.rawDate}, 描述=${item.description}`);
      });
      
      // 打印处理后的payment history
      console.log(`处理了 ${this.paymentHistory.length} 条支付历史记录`);
      this.paymentHistory.filter(item => 
        item.formData && item.formData.declarationType === 'income'
      ).forEach(item => {
        console.log(`支付历史记录: ${item.id}, 收入类型: ${item.formData.incomeType}, 日期: ${item.date}`);
      });
    },
    
    // Process outstanding credits/debits from form data with filtering
    processOutstandingItems() {
      this.outstandingItems = [];
      
      this.formData.forEach(form => {
        if (form.status === 'submitted' || form.status === this.FORM_STATUS.SUBMITTED) {
          const standardizedDate = this.standardizeDate(form.date);
          
          if (standardizedDate) {
            const formYear = standardizedDate.getFullYear();
            const formMonth = standardizedDate.getMonth();
            const formQuarter = Math.floor(formMonth / 3) + 1;
            
            if (this.viewMode === 'yearly') {
              if (formYear < this.filterStartYear || formYear > this.filterEndYear) {
                return;
              }
            } else if (this.viewMode === 'quarterly') {
              if (formYear !== this.filterQuarterYear) {
                return;
              }
              if (this.filterQuarter !== 'all' && formQuarter.toString() !== this.filterQuarter) {
                return;
              }
            }
          } else {
            if (this.viewMode === 'quarterly' && this.filterQuarter !== 'all') {
              return;
            }
          }
          
          if (form.declarationType === 'deduction' || form.declaration_type === 'deduction') {
            const deductionType = form.deductionType || 'BUSINESS_EXPENSE';
            const deductibleAmount = this.calculateDeduction(form.price || 0, deductionType);
            const deductionLabel = this.getTypeLabel(deductionType, 'DEDUCTION');
            const description = `${deductionLabel}: ${form.declarationName || 'Tax Deduction'}`;
            this.outstandingItems.push({
              id: form.id,
              type: 'Credit',
              description: description,
              amount: deductibleAmount,
              category: 'DEDUCTION',
              itemType: deductionType,
              date: form.standardizedDate || form.date // Prefer standardized, fallback to original
            });
          }
          // 恢复将 'credit' (如退税) 类型表单添加到 outstandingItems 的逻辑
          else if (form.declarationType === 'credit' || form.declaration_type === 'credit') {
            const creditType = form.creditType || 'REFUND'; 
            const creditLabel = this.getTypeLabel(creditType, 'CREDIT');
            const description = `${creditLabel}: ${form.declarationName || 'Tax Credit'}`;
            this.outstandingItems.push({
              id: form.id,
              type: 'Credit',
              description: description,
              amount: form.price || 0,
              category: 'CREDIT',
              itemType: creditType,
              date: form.standardizedDate || form.date // Prefer standardized, fallback to original
            });
            
            // 暂时不在此处重复计算和添加预计利息，因为利息的预计已经统一在 processTaxLiabilities 中处理并可能显示在 Current Tax Liabilities
            // 或者利息的逻辑可以更清晰地分离
          }
        }
      });
      
      // 添加现有税务负债到Outstanding Items，确保与Current Tax Liabilities保持一致
      // 这样避免了用户看到两个不同的值
      this.taxLiabilities.forEach(liability => {
        // 只添加实际的税务负债(不包括负值的收益项)，避免重复
        if (liability.amount > 0 && liability.name.includes('Estimated Tax')) {
          this.outstandingItems.push({
            id: `outstanding-${liability.id}`,
            type: 'Debit',
            description: liability.name,
            amount: liability.amount,
            category: 'TAX',
            itemType: 'QUARTERLY',
            date: liability.dueDate
          });
        }
      });
      
      // 排除旧的独立计算的季度估算税方法，使用taxLiabilities中的数据代替
      /*
      // Add estimated quarterly tax payments
      const currentYear = new Date().getFullYear();
      
      if (this.filterStartYear <= currentYear && this.filterEndYear >= currentYear) {
        
        // Q1 (due April 15)
        const q1Tax = this.calculateEstimatedQuarterlyTax(1);
        if (q1Tax > 0) {
          this.outstandingItems.push({
            id: `q1-${currentYear}`,
            type: 'Debit',
            description: `Q1 ${currentYear} Estimated Tax`,
            amount: q1Tax,
            category: 'TAX',
            itemType: 'QUARTERLY',
            date: new Date(currentYear, 3, 15) // April 15
          });
        }
        
        // Q2 (due June 15)
        const q2Tax = this.calculateEstimatedQuarterlyTax(2);
        if (q2Tax > 0) {
          this.outstandingItems.push({
            id: `q2-${currentYear}`,
            type: 'Debit',
            description: `Q2 ${currentYear} Estimated Tax`,
            amount: q2Tax,
            category: 'TAX',
            itemType: 'QUARTERLY',
            date: new Date(currentYear, 5, 15) // June 15
          });
        }
        
        // Q3 (due September 15)
        const q3Tax = this.calculateEstimatedQuarterlyTax(3);
        if (q3Tax > 0) {
          this.outstandingItems.push({
            id: `q3-${currentYear}`,
            type: 'Debit',
            description: `Q3 ${currentYear} Estimated Tax`,
            amount: q3Tax,
            category: 'TAX',
            itemType: 'QUARTERLY',
            date: new Date(currentYear, 8, 15) // September 15
          });
        }
        
        // Q4 (due January 15 next year)
        const q4Tax = this.calculateEstimatedQuarterlyTax(4);
        if (q4Tax > 0) {
          this.outstandingItems.push({
            id: `q4-${currentYear}`,
            type: 'Debit',
            description: `Q4 ${currentYear} Estimated Tax`,
            amount: q4Tax,
            category: 'TAX',
            itemType: 'QUARTERLY',
            date: new Date(currentYear + 1, 0, 15) // January 15 next year
          });
        }
      }
      */
      
      // Sort by date (most recent first)
      this.outstandingItems.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date();
        const dateB = b.date ? new Date(b.date) : new Date();
        return dateA - dateB; // Sort by date ascending
      });
    },
    
    // Calculate estimated quarterly tax based on income data
    calculateEstimatedQuarterlyTax(quarter) {
      // Get income for the relevant quarter
      const currentYear = new Date().getFullYear();
      let totalIncome = 0;
      let totalTax = 0;
      
      // Define quarter date ranges
      const quarterRanges = {
        1: { start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
        2: { start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
        3: { start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
        4: { start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }
      };
      
      // 按收入类型分类统计
      const incomesByType = {};
      
      // Find income in this quarter
      this.formData.forEach(form => {
        const formDate = form.date ? new Date(form.date) : null;
        if (formDate && 
            formDate >= quarterRanges[quarter].start && 
            formDate <= quarterRanges[quarter].end &&
            (form.declaration_type === 'income' || form.declarationType === 'income')) {
          
          const incomeType = form.incomeType || 'OTHER';
          const amount = form.price || 0;
          
          if (!incomesByType[incomeType]) {
            incomesByType[incomeType] = 0;
          }
          
          incomesByType[incomeType] += amount;
          totalIncome += amount;
        }
      });
      
      // 计算每种收入类型的税款
      for (const [incomeType, amount] of Object.entries(incomesByType)) {
        totalTax += this.calculateIncomeTax(amount, incomeType);
      }
      
      // 如果没有基于收入类型的税款信息，回退到原来的简单估算
      if (totalTax === 0 && totalIncome > 0) {
        totalTax = totalIncome * 0.25; // 简单估算: 收入的25%
      }
      
      return totalTax;
    },
    
    // Helper method to determine if a form represents a credit or debit
    determinePaymentType(form) {
      // Default to debit
      let type = 'debit';
      
      // Check declaration type
      const declarationType = form.declaration_type || form.declarationType || '';
      
      // Income and credits should be marked as credit (money coming in)
      if (declarationType.toLowerCase().includes('income') || 
          declarationType.toLowerCase().includes('refund') || 
          declarationType.toLowerCase().includes('credit') || 
          declarationType.includes('reimburse')) {
        type = 'credit';
      }
      
      // Check declaration name as backup
      const declarationName = form.declaration_name || form.declarationName || '';
      if (declarationName.toLowerCase().includes('income') ||
          declarationName.toLowerCase().includes('salary') ||
          declarationName.toLowerCase().includes('refund') || 
          declarationName.toLowerCase().includes('credit') || 
          declarationName.toLowerCase().includes('reimburse')) {
        type = 'credit';
      }
      
      return type;
    },
    
    // Refresh charts based on processed data
    refreshCharts() {
      // Reset chart instances
      this.destroyCharts();
      
      // Check if we have data to display
      this.hasIncomeData = this.paymentHistory && this.paymentHistory.filter(item => 
        item.formData && 
        (item.formData.declarationType === 'income' || item.formData.declaration_type === 'income')
      ).length > 0;
      
      console.log(`收入数据检查: hasIncomeData = ${this.hasIncomeData}`);
      
      // 确保只要有任何数据，我们就显示财务趋势图
      this.hasExpenseData = this.paymentHistory && this.paymentHistory.length > 0;
      
      // 强制设置为true以便于测试和调试
      this.hasIncomeData = true;
      
      // Schedule the chart initialization after current tick to ensure DOM is updated
      this.$nextTick(() => {
        this.resetChartCanvases();
        
        // Only initialize charts if we have data
        if (this.hasIncomeData || this.hasExpenseData) {
          this.initCharts();
        }
      });
    },
    
    // Initialize charts with available data
    initCharts() {
      // Context for charting
      let labels = [];
      
      if (this.viewMode === 'yearly') {
        // For yearly view, use years as labels
        for (let y = this.filterStartYear; y <= this.filterEndYear; y++) {
          labels.push(y.toString());
        }
      } else {
        // For quarterly view, use quarters as labels (without year)
        for (let q = 1; q <= 4; q++) {
          labels.push(`Q${q}`);
        }
      }
      
      // Income Chart - Enhanced for different income types
      const incomeCtx = document.getElementById('income-chart');
      if (incomeCtx && this.hasIncomeData) {
        // Create the income data structure by income type
        const incomeDatasets = this.prepareChartDatasets('INCOME');
        
        this.incomeChart = new Chart(incomeCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: incomeDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                title: {
                  display: true,
                  text: this.viewMode === 'yearly' ? 'Year' : 'Quarter'
                }
              },
              y: {
                stacked: true,
                title: {
                  display: true,
                  text: 'Amount ($)'
                },
                ticks: {
                  callback: function(value) {
                    return '$' + value.toLocaleString();
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD'
                      }).format(context.parsed.y);
                    }
                    return label;
                  }
                }
              },
              legend: {
                position: 'top',
                labels: {
                  boxWidth: 15,
                  padding: 15
                }
              },
              title: {
                display: true,
                text: this.viewMode === 'yearly' ? 'Income Breakdown by Year' : `Income Breakdown by Quarter (${this.filterQuarterYear})`
              }
            }
          }
        });
      }
      
      // Financial Trends Chart - Line chart showing income, expense and net income trends
      const expenseCtx = document.getElementById('expense-chart');
      if (expenseCtx && this.hasExpenseData) {
        // Get financial trends datasets
        const trendsDatasets = this.prepareChartDatasets('FINANCIAL_TRENDS');
        
        this.expenseChart = new Chart(expenseCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: trendsDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: this.viewMode === 'yearly' ? 'Year' : 'Quarter'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Amount ($)'
                },
                ticks: {
                  callback: function(value) {
                    return '$' + value.toLocaleString();
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      // Show values with appropriate formatting
                      const formattedValue = new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD'
                      }).format(context.parsed.y);
                      
                      return label + formattedValue;
                    }
                    return label;
                  }
                }
              },
              legend: {
                position: 'top',
                labels: {
                  boxWidth: 15,
                  padding: 15,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              title: {
                display: true,
                text: this.viewMode === 'yearly' ? 'Financial Trends by Year' : `Financial Trends by Quarter (${this.filterQuarterYear})`
              }
            }
          }
        });
      }
    },
    
    // Helper method to prepare chart datasets by category
    prepareChartDatasets(category) {
      const datasets = [];
      const dataByType = {};
      
      // Labels array based on view mode
      const labels = [];
      
      if (this.viewMode === 'yearly') {
        // Years in filter range
        for (let y = this.filterStartYear; y <= this.filterEndYear; y++) {
          labels.push(y);
        }
      } else {
        // Quarters for quarterly view (current year)
        for (let q = 1; q <= 4; q++) {
          labels.push(`Q${q}`);
        }
      }
      
      // Process data based on category
      let itemsToProcess = [];
      
      // 根据不同图表类型获取数据
      if (category === 'INCOME') {
        itemsToProcess = this.paymentHistory.filter(item => 
          item.formData && 
          (item.formData.declarationType === 'income' || 
           item.formData.declaration_type === 'income'));
        
        // 调试: 打印收入项的数量和类型
        console.log(`为图表处理 ${itemsToProcess.length} 个收入项`);
        itemsToProcess.forEach(item => {
          console.log(`图表收入项: ${item.id}, 收入类型: ${item.formData.incomeType || 'UNDEFINED'}, 描述: ${item.description}, 标准化日期: ${item.date instanceof Date ? item.date.toISOString().substring(0, 10) : item.date}`);
        });
      } else if (category === 'CREDIT') {
        itemsToProcess = this.outstandingItems.filter(item => 
          item.type === 'Credit' && 
          (item.category === 'CREDIT' || item.category === 'INTEREST'));
      } else if (category === 'DEDUCTION') {
        itemsToProcess = this.outstandingItems.filter(item => 
          item.category === 'DEDUCTION');
      } else if (category === 'FINANCIAL_TRENDS') {
        // 获取所有收入记录
        const incomeItems = this.paymentHistory.filter(item => 
          item.type === 'credit' && item.formData && 
          (item.formData.declarationType === 'income' || 
           item.formData.declaration_type === 'income')
        );
        
        // 获取所有支出记录
        const expenseItems = this.paymentHistory.filter(item => 
          item.type === 'debit' || 
          (item.formData && item.formData.declarationType === 'deduction')
        );
        
        // 处理收入记录 - 确保使用标准化日期
        incomeItems.forEach(item => {
          itemsToProcess.push({
            ...item,
            trendType: 'INCOME',
            // date已经是标准化后的日期对象
          });
        });
        
        // 处理支出记录 - 确保使用标准化日期
        expenseItems.forEach(item => {
          itemsToProcess.push({
            ...item,
            trendType: 'EXPENSE',
            // date已经是标准化后的日期对象
          });
        });
        
        console.log(`财务趋势: 处理 ${incomeItems.length} 个收入项和 ${expenseItems.length} 个支出项`);
      }
      
      // 对于财务趋势图表，我们需要特殊处理
      if (category === 'FINANCIAL_TRENDS') {
        // 按期间(年份或季度)分组的数据
        const periodData = {};
        
        // 初始化所有期间
        labels.forEach(period => {
          periodData[period] = {
            income: 0,
            expense: 0,
            credit: 0,
            debit: 0,
            // taxRefund: 0, // 移除 taxRefund，合并到 credit
            taxLiability: 0 
          };
        });
        
        // 处理 paymentHistory，区分 income 和 credit (如 tax refund)
        this.paymentHistory.forEach(item => {
          if (!item.date || !(item.date instanceof Date)) {
            console.warn(`跳过财务趋势项 (paymentHistory ${item.id}): 无效日期`);
            return;
          }
          
          const itemDate = item.date;
          const year = itemDate.getFullYear();
          
          if (this.viewMode === 'yearly' && (year < this.filterStartYear || year > this.filterEndYear)) {
            return;
          }
          
          const quarter = Math.floor(itemDate.getMonth() / 3) + 1;
          const periodKey = this.viewMode === 'yearly' ? year : `Q${quarter}`;
          
          if (!periodData[periodKey]) {
            periodData[periodKey] = { income: 0, expense: 0, credit: 0, debit: 0, taxLiability: 0 };
          }
          
          const amount = Math.abs(item.amount || 0);
          if (item.formData) {
            const declType = item.formData.declarationType || item.formData.declaration_type;
            if (declType === 'income') {
              periodData[periodKey].income += amount;
            } else if (declType === 'credit' || declType === 'refund') { // Tax refunds and other direct credits
              periodData[periodKey].credit += amount;
            } else if (item.type === 'debit' || declType === 'deduction' || declType === 'tax' || declType === 'liability') {
              periodData[periodKey].expense += amount; // Expenses, deductions, tax payments, liabilities treated as expense flow for chart
            }
          } else if (item.type === 'debit') { // Fallback for items without formData if they are debits
             periodData[periodKey].expense += amount;
          } else if (item.type === 'credit') { // Fallback for general credits without specific formData declarationType
             // If it's a credit from paymentHistory without formData, decide if it's income-like or credit-like.
             // For now, let's assume general credits from payment history (if not 'income' declType) are credit-like.
             periodData[periodKey].credit += amount;
          }
        });
        
        // 处理Financial Items & Tax Estimates数据(outstandingItems)
        this.outstandingItems.forEach(item => {
          let itemDate = null;
          if (item.date) {
            itemDate = item.date instanceof Date ? item.date : this.standardizeDate(item.date);
          } else {
            itemDate = new Date(); // Fallback, though ideally all items should have dates
          }
          
          if (!itemDate || isNaN(itemDate.getTime())) {
            console.warn(`跳过Outstanding项 ${item.description}: 无效日期`);
            return;
          }
          
          const year = itemDate.getFullYear();
          
          if (this.viewMode === 'yearly' && (year < this.filterStartYear || year > this.filterEndYear)) {
            return;
          }
          
          const quarter = Math.floor(itemDate.getMonth() / 3) + 1;
          const periodKey = this.viewMode === 'yearly' ? year : `Q${quarter}`;
          
          if (!periodData[periodKey]) {
            periodData[periodKey] = { income: 0, expense: 0, credit: 0, debit: 0, taxLiability: 0 };
          }
          
          const amount = Math.abs(item.amount || 0);
          if (item.type === 'Credit') {
            periodData[periodKey].credit += amount; // Sums with credits from paymentHistory
          } else if (item.type === 'Debit') {
            // Debits from outstandingItems are typically future obligations or estimates not yet paid.
            // For 'Net Financial Position', these are 'debits'.
            // For 'Total Expenses' line, we should be careful not to double count if also in paymentHistory.
            // The 'Total Expenses' line is derived from paymentHistory (actual outflows).
            // So, outstanding 'Debit' items should primarily affect 'debit' for Net Financial Position,
            // and the 'Tax Liabilities' line if they are 'TAX' category.
            periodData[periodKey].debit += amount;
          }
        });
        
        // 使用taxLiabilities数据生成更准确的税务负债趋势 (已过滤掉 'estimated tax')
        const taxLiabilityTrends = this.taxLiabilities.filter(liability => 
          liability.amount > 0 && 
          liability.dueDate instanceof Date &&
          !liability.name.toLowerCase().includes('estimated tax') 
        );
        
        taxLiabilityTrends.forEach(liability => {
          const itemDate = liability.dueDate;
          const year = itemDate.getFullYear();
          
          if (this.viewMode === 'yearly' && (year < this.filterStartYear || year > this.filterEndYear)) {
            return;
          }
          
          const quarter = Math.floor(itemDate.getMonth() / 3) + 1;
          const periodKey = this.viewMode === 'yearly' ? year : `Q${quarter}`;
          
          if (!periodData[periodKey]) {
            periodData[periodKey] = { income: 0, expense: 0, credit: 0, debit: 0, taxLiability: 0 };
          }
          
          periodData[periodKey].taxLiability = (periodData[periodKey].taxLiability || 0) + liability.amount;
        });
        
        // 创建总收入数据集
        const incomeData = labels.map(period => periodData[period]?.income || 0);
        datasets.push({
          label: 'Total Income',
          data: incomeData,
          backgroundColor: 'rgba(46, 125, 50, 0.2)',
          borderColor: 'rgba(46, 125, 50, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointBackgroundColor: 'rgba(46, 125, 50, 1)',
          pointRadius: 4
        });
        
        // 创建总支出数据集
        const expenseData = labels.map(period => periodData[period]?.expense || 0);
        datasets.push({
          label: 'Total Expenses',
          data: expenseData,
          backgroundColor: 'rgba(211, 47, 47, 0.2)',
          borderColor: 'rgba(211, 47, 47, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointBackgroundColor: 'rgba(211, 47, 47, 1)',
          pointRadius: 4
        });
        
        // 创建税务信用(Credit)数据集
        const creditData = labels.map(period => periodData[period]?.credit || 0);
        datasets.push({
          label: 'Tax Credits & Deductions',
          data: creditData,
          backgroundColor: 'rgba(156, 39, 176, 0.2)',
          borderColor: 'rgba(156, 39, 176, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointBackgroundColor: 'rgba(156, 39, 176, 1)',
          pointRadius: 4,
          pointStyle: 'triangle'
        });
        
        // 创建税务欠款(Debit)数据集 - 使用直接从taxLiabilities获取的数据
        const taxLiabilityData = labels.map(period => periodData[period]?.taxLiability || 0);
        const hasLiabilityData = taxLiabilityData.some(amount => amount > 0);
        const debitData = labels.map(period => periodData[period]?.debit || 0);
        
        datasets.push({
          label: 'Tax Liabilities',
          data: hasLiabilityData ? taxLiabilityData : debitData,
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          borderColor: 'rgba(255, 152, 0, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointBackgroundColor: 'rgba(255, 152, 0, 1)',
          pointRadius: 4,
          pointStyle: 'rect'
        });
        
        // 创建净收益数据集 (已包含所有Credit和Debit)
        const netIncomeData = labels.map(period => {
          const income = periodData[period]?.income || 0;
          const expense = periodData[period]?.expense || 0;
          const credit = periodData[period]?.credit || 0;
          const debit = periodData[period]?.debit || 0;
          // const taxRefund = periodData[period]?.taxRefund || 0; // taxRefund is now part of credit
          const taxLiability = periodData[period]?.taxLiability || 0; 
          return (income + credit) - (expense + debit + taxLiability); // Updated formula
        });
        
        datasets.push({
          label: 'Net Financial Position',
          data: netIncomeData,
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointBackgroundColor: 'rgba(33, 150, 243, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        });
        
        console.log('Financial trend datasets prepared:', datasets.map(d => d.label));
        return datasets;
      }
      
      // 以下为原有的非财务趋势图表处理逻辑
      // Group data by type and period (year or quarter)
      itemsToProcess.forEach(item => {
        // 确保使用标准化后的日期对象
        if (!item.date || !(item.date instanceof Date)) {
          console.warn(`跳过图表项 ${item.id}: 无效日期对象`);
          return;
        }
        
        const itemDate = item.date;
        const year = itemDate.getFullYear();
        
        // Skip if not in the filter range (for yearly view)
        if (this.viewMode === 'yearly' && (year < this.filterStartYear || year > this.filterEndYear)) {
          return;
        }
        
        // Get quarter for quarterly view
        const quarter = Math.floor(itemDate.getMonth() / 3) + 1;
        const periodKey = this.viewMode === 'yearly' ? year : `Q${quarter}`;
        
        // Get type based on category
        let itemType = 'OTHER';
        let displayLabel = '';
        
        if (category === 'INCOME' && item.formData) {
          // 增强的收入类型检测逻辑
          let detectedType = 'OTHER';
          
          // 首先检查form中显式设置的incomeType
          if (item.formData.incomeType) {
            detectedType = item.formData.incomeType.toUpperCase();
            console.log(`使用表单中的收入类型: ${detectedType}`);
          }
          
          // 如果没有明确的类型，尝试从描述检测
          if (detectedType === 'OTHER' || !detectedType) {
            const description = item.description.toLowerCase();
            if (description.includes('salary') || 
                description.includes('wage') || 
                description.includes('monthly pay') ||
                description.includes('fixed salary')) {
              detectedType = 'SALARY';
              console.log(`从描述中检测到工资类型: "${description}" -> SALARY`);
            } else if (description.includes('business')) {
              detectedType = 'BUSINESS';
            } else if (description.includes('investment') || description.includes('stock') || description.includes('dividend')) {
              detectedType = 'INVESTMENT';
            }
          }
          
          // 确保类型有效
          if (detectedType && this.INCOME_TYPES[detectedType]) {
            itemType = detectedType;
          } else {
            itemType = 'OTHER';
          }
          
          // 更新表单中的收入类型以确保一致性
          if (item.formData && itemType !== 'OTHER') {
            item.formData.incomeType = itemType;
            console.log(`更新表单收入类型: ${item.id} -> ${itemType}`);
          }
          
          displayLabel = this.getTypeLabel(itemType, category);
        } else if (category === 'CREDIT') {
          itemType = item.itemType || 'REFUND';
          displayLabel = this.getTypeLabel(itemType, category);
        } else if (category === 'DEDUCTION') {
          itemType = item.itemType || 'BUSINESS_EXPENSE';
          displayLabel = this.getTypeLabel(itemType, category);
        } else if (category === 'CASHFLOW') {
          // For cash flow, use specific groupings
          if (item.flowDirection === 'inflow') {
            itemType = item.itemType || 'REFUND';
            displayLabel = `${this.getTypeLabel(itemType, 'CREDIT')} (Inflow)`;
          } else {
            itemType = item.itemType || 'BUSINESS_EXPENSE';
            displayLabel = `${this.getTypeLabel(itemType, 'DEDUCTION')} (Outflow)`;
          }
        }
        
        // Create the data structure if it doesn't exist
        const typeKey = category === 'CASHFLOW' 
          ? `${itemType}_${item.flowDirection}` 
          : itemType;
          
        if (!dataByType[typeKey]) {
          let color = '';
          if (category === 'CASHFLOW') {
            // Use green for inflows and red for outflows
            color = item.flowDirection === 'inflow' 
              ? 'rgba(46, 125, 50, 0.6)'  // Green for inflows
              : 'rgba(211, 47, 47, 0.6)'; // Red for outflows
          } else {
            color = this.getTypeColor(itemType, category);
          }
          
          dataByType[typeKey] = {
            type: itemType,
            category: category,
            label: category === 'CASHFLOW' ? displayLabel : this.getTypeLabel(itemType, category),
            color: color,
            periods: {},
            flowDirection: item.flowDirection  // Only used for CASHFLOW
          };
          
          // Initialize all periods with zero
          labels.forEach(period => {
            dataByType[typeKey].periods[period] = 0;
          });
        }
        
        // Add the amount to the appropriate period
        if (!dataByType[typeKey].periods[periodKey]) {
          dataByType[typeKey].periods[periodKey] = 0;
        }
        
        // For cash flow, we use signed values (positive or negative)
        if (category === 'CASHFLOW') {
          dataByType[typeKey].periods[periodKey] += item.amount; // Already signed appropriately
        } else {
          dataByType[typeKey].periods[periodKey] += Math.abs(item.amount);
        }
      });
      
      // 打印数据类型分组信息
      console.log(`图表数据类型 for ${category}:`, Object.keys(dataByType).join(', '));
      
      // Convert the data to Chart.js datasets
      Object.values(dataByType).forEach(typeData => {
        const data = labels.map(period => typeData.periods[period] || 0);
        
        datasets.push({
          label: typeData.label,
          data: data,
          backgroundColor: typeData.color,
          borderColor: typeData.color.replace('0.6', '1'),
          borderWidth: 1
        });
      });
      
      return datasets;
    },
    
    // 获取类型标签
    getTypeLabel(type, category) {
      if (category === 'INCOME') {
        const incomeType = this.INCOME_TYPES[type];
        return incomeType ? incomeType.label || 'Other Income' : 'Other Income';
      } else if (category === 'CREDIT') {
        const creditType = this.CREDIT_TYPES[type];
        return creditType ? creditType.label || 'Tax Refund' : 'Tax Refund';
      } else if (category === 'DEDUCTION') {
        const deductionType = this.DEDUCTION_TYPES[type];
        return deductionType ? deductionType.label || 'Business Expense' : 'Business Expense';
      }
      return type;
    },
    
    // Update task completion status
    updateTaskStatus(index) {
      // Here you would typically send the update to your backend
      console.log(`Task ${this.tasks[index].description} set to ${this.tasks[index].completed}`);
      
      // Save tasks to localStorage for persistence
      localStorage.setItem('taxTasks', JSON.stringify(this.tasks));
    },
    
    // Export report as CSV
    exportReport() {
      const allData = [...this.paymentHistory];
      
      // Sort by date
      allData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Date,Description,Type,Amount\n";
      
      allData.forEach(item => {
        csvContent += `${this.formatDate(item.date)},${item.description},${item.type},${item.amount}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `tax_report_${this.filterStartYear}_${this.filterEndYear}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
    },
    
    // Apply selected filters with validation
    applyFilters() {
      // 验证年份范围
      this.validateYearRange();
      
      // 更新视图模式
      this.viewMode = this.filterViewMode;
      
      // 清空当前数据
      this.taxLiabilities = [];
      this.paymentHistory = [];
      this.outstandingItems = [];
      
      // Process all data with new filters
      this.processFormData();
      this.showFilterOptions = false;
      
      // 强制更新视图
      this.$forceUpdate();
      
      console.log(`Filters applied. Current view mode: ${this.viewMode}, Tax liabilities: ${this.taxLiabilities.length}, Current tax liabilities: ${this.currentTaxLiabilities.length}`);
    },
    
    // Reset filters to defaults
    resetFilters() {
      this.resetYearDefaults();
      this.filterViewMode = 'yearly';
      this.filterQuarter = 'all';
      this.filterQuarterYear = new Date().getFullYear();
      this.processFormData();
      this.showFilterOptions = false;
    },
    
    // Load initial tasks from localStorage
    loadTasks() {
      try {
        const savedTasks = localStorage.getItem('taxTasks');
        if (savedTasks) {
          this.tasks = JSON.parse(savedTasks);
        }
      } catch (e) {
        console.error("Error loading saved tasks:", e);
      }
    },
    
    totalIncome() {
      return this.incomeData.reduce((sum, item) => sum + item.amount, 0);
    },
    
    totalExpense() {
      return this.expenseData.reduce((sum, item) => sum + item.amount, 0);
    },
    
    netAmount() {
      return this.totalIncome - this.totalExpense;
    },

    goBack() {
      // Return to the previous page
      this.$router.go(-1);
    },

    // Ensure canvas containers are ready for charting
    ensureChartCanvasReady() {
      // Fix income chart container
      const incomeChartElement = document.getElementById('income-chart');
      if (incomeChartElement) {
        // Reset canvas by replacing it with a fresh one
        const parentElement = incomeChartElement.parentElement;
        if (parentElement) {
          // Remove old canvas
          parentElement.removeChild(incomeChartElement);
          
          // Create and append new canvas
          const newCanvas = document.createElement('canvas');
          newCanvas.id = 'income-chart';
          newCanvas.className = 'chart-area';
          parentElement.appendChild(newCanvas);
        }
      }
      
      // Fix expense chart container
      const expenseChartElement = document.getElementById('expense-chart');
      if (expenseChartElement) {
        // Reset canvas by replacing it with a fresh one
        const parentElement = expenseChartElement.parentElement;
        if (parentElement) {
          // Remove old canvas
          parentElement.removeChild(expenseChartElement);
          
          // Create and append new canvas
          const newCanvas = document.createElement('canvas');
          newCanvas.id = 'expense-chart';
          newCanvas.className = 'chart-area';
          parentElement.appendChild(newCanvas);
        }
      }
    },
    
    // Change view mode between yearly and quarterly
    changeViewMode(mode) {
      if (this.viewMode !== mode) {
        console.log(`View mode changing from ${this.viewMode} to ${mode}`);
        this.viewMode = mode;
        
        // Reset charts before re-rendering
        this.destroyCharts();
        
        // 完全重置数据
        this.taxLiabilities = [];
        this.paymentHistory = [];
        this.outstandingItems = [];
        
        // Process all data again with the new view mode
        this.processFormData();
        
        // 添加多个延迟检查点，确保视图正确更新
        setTimeout(() => {
          console.log(`视图切换后首次检查: 税务负债数量=${this.taxLiabilities.length}, 当前税务负债=${this.currentTaxLiabilities.length}`);
          // 强制重新计算所有计算属性
          this.$forceUpdate();
          
          // 再次延迟检查
          setTimeout(() => {
            console.log(`视图切换后再次检查: 税务负债数量=${this.taxLiabilities.length}, 当前税务负债=${this.currentTaxLiabilities.length}`);
            
            // 如果数据仍然有问题，重新执行一次处理
            if (this.currentTaxLiabilities.length === 0 && this.taxLiabilities.length > 0) {
              console.log("检测到数据异常，重新执行数据处理");
              // 递归调用自身，但使用相同的模式以避免无限循环
              this.processTaxLiabilities();
              this.$forceUpdate();
            }
          }, 200);
        }, 100);
      }
    },
    
    // Destroy existing charts before recreating them
    destroyCharts() {
      if (this.incomeChart) {
        this.incomeChart.destroy();
        this.incomeChart = null;
      }
      
      if (this.expenseChart) {
        this.expenseChart.destroy();
        this.expenseChart = null;
      }
    },
    
    // Reset chart canvases
    resetChartCanvases() {
      // Reset income chart canvas
      const incomeChartElement = document.getElementById('income-chart');
      if (incomeChartElement) {
        incomeChartElement.innerHTML = '';
      }
      
      // Reset expense chart canvas
      const expenseChartElement = document.getElementById('expense-chart');
      if (expenseChartElement) {
        expenseChartElement.innerHTML = '';
      }
    },
    
    // 添加一个方法用于手动刷新税务负债数据
    refreshTaxLiabilities() {
      console.log("手动刷新税务负债数据");
      // 清空并重新处理
      this.taxLiabilities = [];
      this.processTaxLiabilities();
      this.$forceUpdate();
    },
    
    // Export data in selected format
    exportData() {
      if (!this.exportOptions.liabilities && !this.exportOptions.transactions && !this.exportOptions.outstanding) {
        alert('Please select at least one data section to export');
        return;
      }
      
      if (this.exportFormat === 'csv') {
        this.exportAsCSV();
      } else if (this.exportFormat === 'pdf') {
        this.exportAsPDF();
      }
      
      this.showExportOptions = false;
    },
    
    // Export data as CSV
    exportAsCSV() {
      let allData = [];
      
      // Add tax liabilities data
      if (this.exportOptions.liabilities) {
        this.currentTaxLiabilities.forEach(liability => {
          allData.push({
            section: 'Current Tax Liabilities',
            name: liability.name,
            amount: liability.amount,
            date: this.formatDate(liability.dueDate),
            status: liability.statusText,
            type: 'N/A',
            description: liability.name
          });
        });
      }
      
      // Add payment history data
      if (this.exportOptions.transactions) {
        this.paymentHistory.forEach(payment => {
          allData.push({
            section: 'Financial Transactions History',
            name: payment.transactionType,
            amount: payment.amount,
            date: this.formatDate(payment.date),
            status: 'N/A',
            type: payment.type,
            description: payment.description
          });
        });
      }
      
      // Add outstanding items data
      if (this.exportOptions.outstanding) {
        this.outstandingItems.forEach(item => {
          allData.push({
            section: 'Financial Items & Tax Estimates',
            name: item.type,
            amount: item.amount,
            date: 'N/A',
            status: 'N/A',
            type: item.type,
            description: item.description
          });
        });
      }
      
      // Create merged CSV content with all data
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Section,Name,Amount,Date,Status,Type,Description\n";
      
      allData.forEach(item => {
        const amount = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD'
        }).format(item.amount);
        
        csvContent += `${item.section},${item.name},${amount},${item.date},${item.status},${item.type},${item.description}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      
      // Set filename based on current filter
      let filename = `tax_report_`;
      if (this.viewMode === 'yearly') {
        filename += `${this.filterStartYear}_${this.filterEndYear}`;
      } else {
        filename += `${this.filterQuarterYear}_Q${this.filterQuarter !== 'all' ? this.filterQuarter : 'all'}`;
      }
      filename += `.csv`;
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
    },
    
    // Export data as PDF
    exportAsPDF() {
      // Dynamically load jsPDF library from CDN
      if (!window.jspdf) {
        try {
          // Show loading message
          alert('Preparing PDF generator. This might take a moment. Click OK and wait for the download to start.');
          
          // First load the main jsPDF library
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.async = true;
          
          // Use a Promise to track loading
          const jspdfLoaded = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load jsPDF library'));
          });
          
          document.head.appendChild(script);
          
          // When jsPDF is loaded, then load the autoTable plugin
          jspdfLoaded.then(() => {
            // Ensure jsPDF is available
            if (!window.jspdf) {
              throw new Error('jsPDF failed to initialize properly');
            }
            
            console.log('jsPDF loaded successfully, loading autoTable plugin');
            
            // Now load the autoTable plugin
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
            autoTableScript.async = true;
            
            // Return a new promise for autoTable loading
            return new Promise((resolve, reject) => {
              autoTableScript.onload = resolve;
              autoTableScript.onerror = () => reject(new Error('Failed to load autoTable plugin'));
              document.head.appendChild(autoTableScript);
            });
          })
          .then(() => {
            // Both libraries should be loaded, give a moment for initialization
            console.log('AutoTable plugin loaded, waiting for initialization');
            return new Promise(resolve => setTimeout(resolve, 1000));
          })
          .then(() => {
            // Verify that jsPDF object exists and has autoTable method attached
            if (!window.jspdf) {
              throw new Error('jsPDF library not found after loading');
            }
            
            // Create a test instance to verify autoTable is attached
            const { jsPDF } = window.jspdf;
            const testDoc = new jsPDF();
            
            if (typeof testDoc.autoTable !== 'function') {
              throw new Error('autoTable plugin not properly initialized');
            }
            
            console.log('All PDF libraries successfully loaded and initialized');
            this.generatePDF();
          })
          .catch(error => {
            console.error('Error loading PDF libraries:', error);
            alert('Failed to load PDF generation libraries: ' + error.message + '\nPlease try using CSV format instead.');
          });
        } catch (error) {
          console.error('Error in PDF export setup:', error);
          alert('Failed to initialize PDF export: ' + error.message + '\nPlease try the CSV option instead.');
        }
      } else {
        // Verify autoTable is available before proceeding
        try {
          const { jsPDF } = window.jspdf;
          const testDoc = new jsPDF();
          
          if (typeof testDoc.autoTable !== 'function') {
            throw new Error('autoTable plugin not properly initialized');
          }
          
          this.generatePDF();
        } catch (error) {
          console.error('Error checking PDF libraries:', error);
          alert('PDF export unavailable: ' + error.message + '\nPlease try using CSV format instead.');
        }
      }
    },
    
    // Generate PDF content using jsPDF
    generatePDF() {
      try {
        // Create new PDF document
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
          throw new Error('jsPDF constructor not found');
        }
        
        const doc = new jsPDF();
        
        // Verify autoTable is available
        if (typeof doc.autoTable !== 'function') {
          throw new Error('autoTable plugin not properly initialized');
        }
        
        // Add title
        doc.setFontSize(18);
        doc.text('Tax Dashboard Report', 14, 20);
        
        // Add subtitle with filter info
        doc.setFontSize(12);
        let filterText = this.viewMode === 'yearly' 
          ? `Year Range: ${this.filterStartYear} - ${this.filterEndYear}` 
          : `Year: ${this.filterQuarterYear}, Quarter: ${this.filterQuarter !== 'all' ? `Q${this.filterQuarter}` : 'All Quarters'}`;
        doc.text(`Filter: ${filterText}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);
        
        let yPos = 40;
        
        // Add tax liabilities section
        if (this.exportOptions.liabilities && this.currentTaxLiabilities.length > 0) {
          yPos += 8;
          doc.setFontSize(14);
          doc.text('Current Tax Liabilities', 14, yPos);
          yPos += 8;
          
          // Prepare table data
          const liabilitiesData = this.currentTaxLiabilities.map(liability => [
            liability.name,
            this.formatCurrency(liability.amount),
            this.formatDate(liability.dueDate),
            liability.statusText
          ]);
          
          // Add table
          doc.autoTable({
            startY: yPos,
            head: [['Tax Liability', 'Amount', 'Due Date', 'Status']],
            body: liabilitiesData,
            theme: 'striped',
            headStyles: { fillColor: [31, 58, 147] }
          });
          
          yPos = doc.lastAutoTable.finalY + 10;
          
          // Add summary
          if (this.currentTaxLiabilities.length > 0) {
            doc.text(`Total Tax Obligations: ${this.formatCurrency(this.totalTaxObligations)}`, 14, yPos);
            yPos += 10;
          }
        }
        
        // Check if we need a new page for payment history
        if (yPos > 200 && this.exportOptions.transactions) {
          doc.addPage();
          yPos = 20;
        }
        
        // Add payment history section
        if (this.exportOptions.transactions && this.paymentHistory.length > 0) {
          doc.setFontSize(14);
          doc.text('Financial Transactions History', 14, yPos);
          yPos += 8;
          
          // Prepare table data
          const transactionData = this.paymentHistory.map(payment => [
            this.formatDate(payment.date),
            payment.transactionType,
            payment.description,
            this.formatCurrency(payment.amount)
          ]);
          
          // Add table
          doc.autoTable({
            startY: yPos,
            head: [['Date', 'Type', 'Description', 'Amount']],
            body: transactionData,
            theme: 'striped',
            headStyles: { fillColor: [31, 58, 147] }
          });
          
          yPos = doc.lastAutoTable.finalY + 10;
          
          // Add summary
          if (this.paymentHistory.length > 0) {
            doc.text(`Net Income/Expense: ${this.formatCurrency(this.netTransactionAmount)}`, 14, yPos);
            yPos += 10;
          }
        }
        
        // Check if we need a new page for outstanding items
        if (yPos > 200 && this.exportOptions.outstanding) {
          doc.addPage();
          yPos = 20;
        }
        
        // Add outstanding items section
        if (this.exportOptions.outstanding && this.outstandingItems.length > 0) {
          doc.setFontSize(14);
          doc.text('Financial Items & Tax Estimates', 14, yPos);
          yPos += 8;
          
          // Prepare table data
          const outstandingData = this.outstandingItems.map(item => [
            item.type,
            item.description,
            this.formatCurrency(item.amount)
          ]);
          
          // Add table
          doc.autoTable({
            startY: yPos,
            head: [['Type', 'Description', 'Amount']],
            body: outstandingData,
            theme: 'striped',
            headStyles: { fillColor: [31, 58, 147] }
          });
          
          yPos = doc.lastAutoTable.finalY + 10;
          
          // Add summary
          if (this.outstandingItems.length > 0) {
            doc.text(`Net Financial Position: ${this.formatCurrency(this.netOutstandingAmount)}`, 14, yPos);
          }
        }
        
        // Set filename
        let filename = `tax_report_`;
        if (this.viewMode === 'yearly') {
          filename += `${this.filterStartYear}_${this.filterEndYear}`;
        } else {
          filename += `${this.filterQuarterYear}_Q${this.filterQuarter !== 'all' ? this.filterQuarter : 'all'}`;
        }
        filename += `.pdf`;
        
        // Save the PDF
        doc.save(filename);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again or use CSV format instead. Error: ' + error.message);
      }
    }
  },
  
  mounted() {
    console.log("Dashboard component loaded");
    
    // Load tasks from localStorage
    this.loadTasks();
    
    // Fetch form data from server
    this.fetchFormData();
    
    // Set up auto-refresh interval (every 5 minutes)
    this.refreshInterval = setInterval(() => {
      console.log("Auto-refreshing form data");
      this.fetchFormData();
    }, 5 * 60 * 1000);
  },
  
  beforeUnmount() {
    // Clear interval when component is unmounted
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Destroy chart instances
    if (this.incomeChart) {
      this.incomeChart.destroy();
    }
    if (this.expenseChart) {
      this.expenseChart.destroy();
    }
  },
  
  watch: {
    // Watch for changes in filters
    filterYear() {
      console.log(`Year filter changed to: ${this.filterYear}`);
    },
    filterMonth() {
      console.log(`Month filter changed to: ${this.filterMonth}`);
    },
    // Add a new watcher for viewMode
    viewMode(newMode, oldMode) {
      console.log(`View mode changed from ${oldMode} to ${newMode}`);
      // viewMode change is already handled in changeViewMode method
    }
  },
  
  computed: {
    // 只获取当前税务负债，不包括预测性项目和负值项目
    currentTaxLiabilities() {
      console.log(`计算属性currentTaxLiabilities被调用，当前taxLiabilities长度: ${this.taxLiabilities.length}`);
      const result = this.taxLiabilities.filter(liability => {
        // 只保留实际的税务负债，排除预测的投资回报、利息等
        const isActualTaxLiability = 
          !liability.name.toLowerCase().includes('projected') &&
          !liability.name.toLowerCase().includes('interest') &&
          !liability.name.toLowerCase().includes('return') &&
          !liability.name.toLowerCase().includes('estimated tax') && // 新增：排除预估税款
          liability.amount > 0; // 金额为正，表示需要支付的税款
        
        // 确保是未来或当前需要支付的项目
        const isCurrentOrUpcoming = 
          liability.status === 'upcoming' || 
          liability.status === 'due-soon' ||
          liability.status === 'overdue';
        
        return isActualTaxLiability && isCurrentOrUpcoming;
      });
      
      console.log(`过滤后的当前税务负债数量: ${result.length}`);
      return result;
    },
    
    // 计算当前税务负债总额
    totalTaxObligations() {
      return this.currentTaxLiabilities.reduce((sum, liability) => sum + liability.amount, 0);
    },
    
    // 计算净交易金额（所有Payment History中的收入减去支出）
    netTransactionAmount() {
      return this.paymentHistory.reduce((sum, payment) => {
        if (payment.type === 'credit') {
          return sum + payment.amount;
        } else {
          return sum - payment.amount;
        }
      }, 0);
    },
    // 计算净财务状况（所有Outstanding Items中的收入减去支出）
    netOutstandingAmount() {
      return this.outstandingItems.reduce((sum, item) => {
        if (item.type === 'Credit') {
          return sum + item.amount;
        } else if (item.type === 'Debit') {
          // 新增条件：如果这个Debit项是预估税（通过description判断），则不计入netOutstandingAmount的计算
          if (item.description && item.description.toLowerCase().includes('estimated tax')) {
            return sum; // 保持sum不变，即不减去这个预估税的金额
          }
          return sum - item.amount; // 其他非预估的Debit项正常减去
        }
        return sum; // 对于其他类型（如果有的话），保持sum不变
      }, 0);
    },
    // 计算净税务状况（所有Tax Liabilities中的收入减去支出）
    netTaxAmount() {
      return this.taxLiabilities.reduce((sum, liability) => {
        if (liability.amount < 0) {
          return sum + liability.amount;
        } else {
          return sum - liability.amount;
        }
      }, 0);
    }
  }
}
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