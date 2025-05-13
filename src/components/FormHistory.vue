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

<script>
import axios from 'axios'

export default {
  name: 'FormHistory',
  data() {
    return {
      forms: [],
      loading: true,
      error: null,
      selectedStatus: 'ALL',
      statusMap: {
        SAVED: 'Draft',
        SUBMITTED: 'Submitted'
      },
      isDev: process.env.NODE_ENV === 'development'
    }
  },
  computed: {
    formattedForms() {
      return this.forms.map(form => {
        const taxYear = this.extractTaxYear(form) || 'N/A';
        const totalAmount = this.extractTotalAmount(form);
        const uniqueTrackingId = `${form.id || 'unknown'}-${Date.now()}`;
        
        // 处理所有日期字段，确保显示'-'而不是null或undefined
        
        // 创建日期 - 确保总是有值
        let createdDate = '-';
        if (form.created_at) {
          createdDate = this.formatDate(form.created_at);
          console.log(`已格式化创建日期: ${form.created_at} -> ${createdDate}`);
        }
        
        // 最后编辑日期 - 使用创建日期作为备用
        let lastEditedDate = '-';
        if (form.updated_at) {
          lastEditedDate = this.formatDate(form.updated_at);
          console.log(`已格式化更新日期: ${form.updated_at} -> ${lastEditedDate}`);
        } else if (createdDate !== '-') {
          lastEditedDate = createdDate;
        }
        
        // 提交日期 - 如果未提交则显示'-'
        let submissionDate = '-';
        if (form.submitted_at) {
          submissionDate = this.formatDate(form.submitted_at);
          console.log(`已格式化提交日期: ${form.submitted_at} -> ${submissionDate}`);
        }
        
        // 保存原始状态值用于调试
        const originalStatus = form.status;
        
        // 只保留SUBMITTED和SAVED两种状态
        let displayStatus = 'SAVED'; // 默认为已保存
        
        if (form.status === 'submitted' || form.status === 'Submitted' || 
            form.status === this.statusMap.SUBMITTED || form.status === 'SUBMITTED') {
          displayStatus = 'SUBMITTED';
        }
        
        console.log(`表单 ${form.id} 状态: 原始=${originalStatus}, 显示=${displayStatus}`);
        
        // 确保使用数据库ID
        let displayId = form.id;
        // 如果ID是以temp-开头的临时ID，但form有数值型id属性，则使用数值型id
        if (typeof form.id === 'string' && form.id.startsWith('temp-') && form.numeric_id) {
          displayId = form.numeric_id;
        }
        // 将ID转换为纯数字格式（如果可能）
        if (displayId && !isNaN(Number(displayId)) && !displayId.startsWith('temp-')) {
          displayId = Number(displayId).toString();
        }
        
        // 获取声明类型 - 确保使用正确的键
        let declarationType = 'N/A';
        if (form.declaration_type) {
          declarationType = form.declaration_type;
        } else if (form.declarationType) {
          declarationType = form.declarationType;
        }
        
        return {
          ...form,
          id: displayId || 'N/A', // 使用处理后的ID显示
          declarationType: declarationType,
          submissionDate,
          createdDate,
          lastEditedDate,
          status: displayStatus,
          originalStatus: originalStatus, // 保存原始状态
          taxYear,
          totalAmount,
          uniqueTrackingId
        };
      });
    },
    filteredForms() {
      if (this.selectedStatus === 'ALL') {
        return this.formattedForms;
      }
      
      return this.formattedForms.filter(form => form.status === this.selectedStatus);
    }
  },
  methods: {
    extractTaxYear(form) {
      // 从date字段提取年份（TaxForm模型）
      if (form.date) {
        // 尝试从日期字符串中提取年份
        const dateMatch = form.date.match(/(\d{4})/);
        if (dateMatch) {
          return dateMatch[1];  // 返回第一个匹配的4位数字（年份）
        }
      }
      
      // 回退到之前的逻辑
      if (form.tax_year) return form.tax_year;
      if (form.taxYear) return form.taxYear;
      
      if (form.formData) {
        if (form.formData.tax_year) return form.formData.tax_year;
        if (form.formData.year) return form.formData.year;
        if (form.formData.taxYear) return form.formData.taxYear;
        
        // 如果找不到具体的税年字段，尝试从日期中提取年份
        if (form.created_at) return new Date(form.created_at).getFullYear();
        if (form.updated_at) return new Date(form.updated_at).getFullYear();
      }
      
      // 如果所有方法都失败，默认使用当前年份
      return new Date().getFullYear();
    },
    
    extractTotalAmount(form) {
      // 首先检查price字段（来自数据库的TaxForm模型）
      if (form.price !== undefined && !isNaN(Number(form.price))) {
        return this.formatAmount(Number(form.price));
      }
      
      // 其次检查直接的total_amount字段
      if (form.total_amount && !isNaN(Number(form.total_amount))) {
        return this.formatAmount(Number(form.total_amount));
      }
      
      if (form.totalAmount && !isNaN(Number(form.totalAmount))) {
        return this.formatAmount(Number(form.totalAmount));
      }
      
      // 然后检查表单数据中的金额字段
      if (form.formData) {
        // 添加price到查找字段列表
        const amountFields = ['price', 'total_tax', 'total_amount', 'totalTax', 'totalAmount', 'amount', 'tax'];
        
        for (const field of amountFields) {
          if (form.formData[field] && !isNaN(Number(form.formData[field]))) {
            return this.formatAmount(Number(form.formData[field]));
          }
        }
      }
      
      // 如果没有找到有效金额，返回零
      return '$0.00';
    },
    
    formatAmount(amount) {
      // 确保amount是一个数字
      if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
      
      try {
        // 使用toLocaleString格式化金额，修改¥为$
        return `$${Number(amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      } catch (error) {
        console.error('Error formatting amount:', error);
        return '$0.00';
      }
    },
    async loadForms() {
      this.loading = true;
      this.error = null;
      
      try {
        // 从服务器API加载表单
        console.log("Fetching forms from server...");
        const response = await axios.get('/api/get_tax_forms');
        console.log("Forms data returned from server:", response.data);
        
        if (response.data.success) {
          // 为每个表单添加可跟踪的ID属性
          this.forms = response.data.forms.map(form => {
            // 显式转换为字符串以便比较和显示
            let formId;
            // 确保ID是数据库中的顺序ID
            if (form.id && !isNaN(Number(form.id))) {
              formId = String(Number(form.id));
            } else {
              // 如果没有有效的数字ID，使用临时ID但添加numeric_id标记
              formId = String(form.id || form.temp_id || `temp-${Date.now()}`);
              // 尝试从ID中提取数字部分
              const numericMatch = formId.match(/\d+/);
              if (numericMatch) {
                form.numeric_id = numericMatch[0];
              }
            }
            
            console.log(`Loading form - Database ID: ${formId}, Price: ${form.price}, Status: ${form.status}`);
            return {
              ...form,
              id: formId, // 确保ID是字符串
              _uniqueId: `form-${formId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` // 添加唯一标识符
            };
          });
          
          // 按照ID数值排序（如果ID是数字）
          this.forms.sort((a, b) => {
            const idA = !isNaN(Number(a.id)) ? Number(a.id) : Infinity;
            const idB = !isNaN(Number(b.id)) ? Number(b.id) : Infinity;
            return idA - idB;  // 升序排列
          });
          
          console.log(`Total forms loaded: ${this.forms.length}`);
          
          // 在控制台显示表单价格信息，用于调试
          if (this.isDev) {
            this.forms.forEach(form => {
              console.log(`Form ${form.id} - Price: ${form.price}, Formatted Amount: ${this.extractTotalAmount(form)}`);
            });
          }
          
          // 同时加载localStorage中的表单作为备份
          try {
            const savedFormsData = localStorage.getItem('taxForms');
            if (savedFormsData) {
              const localForms = JSON.parse(savedFormsData);
              console.log("Forms in localStorage:", localForms);
              
              // 检查本地表单是否有新的未保存到服务器的表单
              const serverFormIds = new Set(this.forms.map(f => f.id));
              const tempIdMap = new Set(this.forms.filter(f => f.temp_id).map(f => f.temp_id));
              
              const newLocalForms = localForms.filter(localForm => {
                const localId = String(localForm.id);
                // 如果数据库ID不在服务器返回列表中，且临时ID也不匹配服务器中的任何表单
                return !serverFormIds.has(localId) && 
                       !tempIdMap.has(localId) &&
                       typeof localId === 'string' && 
                       localId.startsWith('temp-');
              });
              
              if (newLocalForms.length > 0) {
                console.log(`Found ${newLocalForms.length} local temporary forms not saved to server`);
                // 添加这些本地表单到表单列表中
                newLocalForms.forEach(localForm => {
                  // 尝试从临时ID中提取数字部分作为numeric_id
                  const localId = String(localForm.id);
                  const numericMatch = localId.match(/\d+/);
                  
                  if (numericMatch) {
                    localForm.numeric_id = numericMatch[0];
                  }
                  
                  // 添加唯一标识符
                  const uniqueForm = {
                    ...localForm,
                    _uniqueId: `local-${localForm.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                  };
                  this.forms.push(uniqueForm);
                });
                
                // 重新排序以确保ID升序
                this.forms.sort((a, b) => {
                  const idA = !isNaN(Number(a.id)) ? Number(a.id) : 
                             (a.numeric_id && !isNaN(Number(a.numeric_id)) ? Number(a.numeric_id) : Infinity);
                  const idB = !isNaN(Number(b.id)) ? Number(b.id) : 
                             (b.numeric_id && !isNaN(Number(b.numeric_id)) ? Number(b.numeric_id) : Infinity);
                  return idA - idB;  // 升序排列
                });
              }
            }
          } catch (e) {
            console.error("Error loading local forms:", e);
          }
        } else {
          this.error = response.data.message || 'Failed to load forms';
          console.error("Failed to load forms:", this.error);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
        this.error = 'Cannot connect to server, showing locally cached forms';
        
        // 服务器请求失败，回退到加载localStorage中的表单
        try {
          const savedFormsData = localStorage.getItem('taxForms');
          if (savedFormsData) {
            const localForms = JSON.parse(savedFormsData);
            console.log("Loading forms from localStorage as fallback:", localForms);
            this.forms = localForms.map(form => {
              // 处理ID，优先使用数字ID
              let formId = String(form.id);
              // 尝试从临时ID中提取数字部分
              if (formId.startsWith('temp-')) {
                const numericMatch = formId.match(/\d+/);
                if (numericMatch) {
                  form.numeric_id = numericMatch[0];
                }
              } else if (!isNaN(Number(formId))) {
                // 如果ID已经是数字，确保使用数字格式
                formId = String(Number(formId));
              }
              
              return {
                ...form,
                id: formId,
                _uniqueId: `local-${form.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              };
            });
            
            // 按ID升序排序
            this.forms.sort((a, b) => {
              const idA = !isNaN(Number(a.id)) ? Number(a.id) : 
                         (a.numeric_id && !isNaN(Number(a.numeric_id)) ? Number(a.numeric_id) : Infinity);
              const idB = !isNaN(Number(b.id)) ? Number(b.id) : 
                         (b.numeric_id && !isNaN(Number(b.numeric_id)) ? Number(b.numeric_id) : Infinity);
              return idA - idB;  // 升序排列
            });
          }
        } catch (e) {
          console.error("Error loading saved forms:", e);
          this.forms = [];
        }
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      
      // 尝试作为ISO字符串解析
      let date = new Date(dateString);
      
      // 检查日期是否有效
      if (!isNaN(date.getTime())) {
        // 使用标准格式
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      
      // 如果标准解析失败，尝试解析常见的日期格式
      const formats = [
        // 年-月-日
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        // 月/日/年
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        // 年.月.日
        /(\d{4})\.(\d{1,2})\.(\d{1,2})/
      ];
      
      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          // 根据格式创建日期
          if (format === formats[0]) {
            // 年-月-日
            date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
          } else if (format === formats[1]) {
            // 月/日/年
            date = new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
          } else {
            // 年.月.日
            date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
          }
          
          if (!isNaN(date.getTime())) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
        }
      }
      
      // 如果所有尝试都失败，返回原始字符串
      console.warn("无法解析日期格式:", dateString);
      return dateString;
    },
    getStatusClass(status) {
      if (status === 'SUBMITTED') return 'status-submitted';
      if (status === 'SAVED') return 'status-saved';
      return '';
    },
    viewForm(form) {
      // Store the form to view in localStorage
      localStorage.setItem('viewFormId', form.id);
      
      console.log(`查看表单 ID:${form.id}, 状态:${form.status}, 原始状态:${form.originalStatus}`);
      
      // 检查是否为已提交的表单
      const isSubmitted = form.status === 'SUBMITTED' || 
                          form.originalStatus === 'submitted' || 
                          form.originalStatus === 'Submitted';
      
      // Redirect to form view/edit page
      if (isSubmitted) {
        // View only mode for submitted forms
        console.log("正在跳转到ViewForm路由...");
        this.$router.push({ name: 'ViewForm', query: { id: form.id, mode: 'view' } });
      } else {
        // Edit mode for saved drafts or failed submissions
        console.log("正在跳转到AddRecord路由...");
        this.$router.push({ name: 'AddRecord', query: { id: form.id, mode: 'edit' } });
      }
    },
    createNewForm() {
      this.$router.push({ name: 'AddRecord' });
    },
    goBack() {
      // Return to the previous page instead of dashboard
      this.$router.go(-1);
    },
    returnToHistory() {
      // Implement the logic to return to form history
      this.$router.push('/form-history');
    }
  },
  mounted() {
    this.loadForms();
  }
}
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