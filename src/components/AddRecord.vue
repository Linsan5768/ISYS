<template>
  <div class="container">
    <div class="form-card">
      <div class="back-arrow" @click="goBack">
        <span class="arrow-icon">←</span>
        <span class="back-text">Back</span>
      </div>

      <h2 class="card-title">{{ isReviewMode ? 'TAX FORM REVIEW' : 'TAX FORM' }}</h2>
      
      <!-- 编辑模式 -->
      <form v-if="!isReviewMode" @submit.prevent="reviewForm">
        <!-- Filling Progress Bar -->
        <div v-if="!isReviewMode && formCompletenessComputed.total > 0" class="progress-section">
          <label class="progress-label">Form Progress: {{ formCompletenessComputed.filled }} / {{ formCompletenessComputed.total }} fields completed</label>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: formCompletenessComputed.percentage + '%' }">
              {{ formCompletenessComputed.percentage }}%
            </div>
          </div>
        </div>

        <div class="form-content">
          <!-- Date and Declaration Type on the same row -->
          <div class="form-row">
            <div class="form-group half-width">
              <label for="date-picker">DATE</label>
              <div class="input-wrapper">
                <input type="text" id="date-picker" v-model="form.date" class="form-control" ref="dateInput" required>
              </div>
            </div>

            <div class="form-group half-width">
              <label for="declaration-type">DECLARATION TYPE</label>
              <div class="input-wrapper">
                <select 
                  id="declaration-type" 
                  v-model="form.declarationType" 
                  class="form-control"
                  required
                >
                  <option value="">Select Declaration Type</option>
                  <option v-for="type in declarationTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Income Type field - 只在declarationType为'income'时显示 -->
          <div v-if="form.declarationType === 'income'" class="form-group">
            <label for="income-type">INCOME TYPE</label>
            <div class="input-wrapper">
              <select 
                id="income-type" 
                v-model="form.incomeType" 
                class="form-control"
                required
              >
                <option value="">Select Income Type</option>
                <option v-for="type in incomeTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
          </div>

          <!-- Credit Type field - 只在declarationType为'credit'时显示 -->
          <div v-if="form.declarationType === 'credit'" class="form-group">
            <label for="credit-type">CREDIT TYPE</label>
            <div class="input-wrapper">
              <select 
                id="credit-type" 
                v-model="form.creditType" 
                class="form-control"
                required
              >
                <option value="">Select Credit Type</option>
                <option v-for="type in creditTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
          </div>

          <!-- Deduction Type field - 只在declarationType为'deduction'时显示 -->
          <div v-if="form.declarationType === 'deduction'" class="form-group">
            <label for="deduction-type">DEDUCTION TYPE</label>
            <div class="input-wrapper">
              <select 
                id="deduction-type" 
                v-model="form.deductionType" 
                class="form-control"
                required
              >
                <option value="">Select Deduction Type</option>
                <option v-for="type in deductionTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
          </div>

          <!-- Address field -->
        <div class="form-group">
            <label for="address">ADDRESS</label>
            <div class="input-wrapper">
              <input 
                type="text" 
                id="address" 
                v-model="form.address" 
                class="form-control"
                required
              />
          </div>
        </div>

          <!-- Declaration Name field -->
        <div class="form-group">
            <label for="declaration-name">DECLARATION NAME</label>
            <div class="input-wrapper">
            <input 
              type="text" 
                id="declaration-name" 
                v-model="form.declarationName" 
                class="form-control"
                required
              />
          </div>
        </div>

          <!-- Price field with formatting -->
        <div class="form-group">
            <label for="price">AMOUNT</label>
            <div class="input-wrapper">
            <input 
              type="text" 
                id="price" 
                v-model="formattedPrice"
              @focus="removeFormatting"
                @blur="formatPrice"
                class="form-control"
              required
            />
          </div>
        </div>

          <!-- Other Information field -->
        <div class="form-group">
            <label for="other-info">OTHER INFORMATION</label>
            <div class="input-wrapper">
              <textarea 
                id="other-info"
                v-model="form.otherInfo"
                class="form-control"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Submit and Save buttons -->
        <div class="button-group">
          <button type="submit" class="btn-submit">
            PREVIEW
          </button>
          <button type="button" class="btn-save" @click="saveAndExit">
            SAVE & EXIT
          </button>
        </div>

        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>
      </form>

      <!-- 审阅模式 -->
      <div v-else class="form-content">
        <!-- Date and Declaration Type on the same row -->
        <div class="form-row">
          <div class="form-group half-width">
            <label>DATE</label>
            <div class="review-field" :class="{'editing': editingField === 'date'}">
              <input 
                v-if="editingField === 'date'" 
                type="text" 
                v-model="form.date"
                class="form-control" 
                @blur="finishEdit" 
                ref="editInput"
              >
              <div v-else class="readonly-value">{{ form.date }}</div>
              <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('date')" class="edit-icon" alt="Edit">
              </div>
            </div>

          <div class="form-group half-width">
            <label>DECLARATION TYPE</label>
            <div class="review-field" :class="{'editing': editingField === 'declarationType'}">
              <select 
                v-if="editingField === 'declarationType'" 
                v-model="form.declarationType" 
                class="form-control"
                @blur="finishEdit"
              >
                <option v-for="type in declarationTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
              <div v-else class="readonly-value">
                {{ getDeclarationTypeName(form.declarationType) }}
              </div>
              <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('declarationType')" class="edit-icon" alt="Edit">
            </div>
          </div>
        </div>

        <!-- Income Type field - 只在declarationType为'income'时显示 -->
        <div v-if="form.declarationType === 'income'" class="form-group">
          <label>INCOME TYPE</label>
          <div class="review-field" :class="{'editing': editingField === 'incomeType'}">
            <select 
              v-if="editingField === 'incomeType'" 
              v-model="form.incomeType" 
              class="form-control"
              @blur="finishEdit"
            >
              <option v-for="type in incomeTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
            <div v-else class="readonly-value">
              {{ getIncomeTypeName(form.incomeType) }}
            </div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('incomeType')" class="edit-icon" alt="Edit">
          </div>
        </div>

        <!-- Credit Type field - 只在declarationType为'credit'时显示 -->
        <div v-if="form.declarationType === 'credit'" class="form-group">
          <label>CREDIT TYPE</label>
          <div class="review-field" :class="{'editing': editingField === 'creditType'}">
            <select 
              v-if="editingField === 'creditType'" 
              v-model="form.creditType" 
              class="form-control"
              @blur="finishEdit"
            >
              <option v-for="type in creditTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
            <div v-else class="readonly-value">
              {{ getCreditTypeName(form.creditType) }}
            </div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('creditType')" class="edit-icon" alt="Edit">
          </div>
        </div>

        <!-- Deduction Type field - 只在declarationType为'deduction'时显示 -->
        <div v-if="form.declarationType === 'deduction'" class="form-group">
          <label>DEDUCTION TYPE</label>
          <div class="review-field" :class="{'editing': editingField === 'deductionType'}">
            <select 
              v-if="editingField === 'deductionType'" 
              v-model="form.deductionType" 
              class="form-control"
              @blur="finishEdit"
            >
              <option v-for="type in deductionTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
            <div v-else class="readonly-value">
              {{ getDeductionTypeName(form.deductionType) }}
            </div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('deductionType')" class="edit-icon" alt="Edit">
          </div>
        </div>

        <!-- Address field -->
        <div class="form-group">
          <label>ADDRESS</label>
          <div class="review-field" :class="{'editing': editingField === 'address'}">
            <input 
              v-if="editingField === 'address'" 
              type="text" 
              v-model="form.address" 
              class="form-control"
              @blur="finishEdit"
            >
            <div v-else class="readonly-value">{{ form.address }}</div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('address')" class="edit-icon" alt="Edit">
              </div>
            </div>

        <!-- Declaration Name field -->
        <div class="form-group">
          <label>DECLARATION NAME</label>
          <div class="review-field" :class="{'editing': editingField === 'declarationName'}">
            <input 
              v-if="editingField === 'declarationName'" 
              type="text" 
              v-model="form.declarationName" 
              class="form-control"
              @blur="finishEdit"
            >
            <div v-else class="readonly-value">{{ form.declarationName }}</div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('declarationName')" class="edit-icon" alt="Edit">
          </div>
        </div>

        <!-- Price field -->
        <div class="form-group">
          <label>AMOUNT</label>
          <div class="review-field" :class="{'editing': editingField === 'price'}">
            <input 
              v-if="editingField === 'price'" 
              type="text" 
              v-model="formattedPrice" 
              class="form-control"
              @focus="removeFormatting"
              @blur="formatPriceAndFinishEdit"
            >
            <div v-else class="readonly-value">{{ formattedPrice }}</div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('price')" class="edit-icon" alt="Edit">
          </div>
        </div>

        <!-- Other Information field -->
        <div class="form-group">
          <label>OTHER INFORMATION</label>
          <div class="review-field" :class="{'editing': editingField === 'otherInfo'}">
            <textarea 
              v-if="editingField === 'otherInfo'" 
              v-model="form.otherInfo" 
              class="form-control"
              rows="3"
              @blur="finishEdit"
            ></textarea>
            <div v-else class="readonly-value">{{ form.otherInfo || '-' }}</div>
            <img v-if="!isReadOnly" src="@/assets/edit-text.png" @click="editField('otherInfo')" class="edit-icon" alt="Edit">
          </div>
        </div>

        <!-- Verification checkbox - only show if not in read-only mode -->
        <div v-if="!isReadOnly" class="verification-box">
          <label class="verification-label">
            <input type="checkbox" v-model="formVerified">
            <span>I verify that all the information are correct.</span>
          </label>
        </div>

        <!-- Submit, Back, and Return buttons -->
        <div class="button-group">
          <button 
            v-if="!isReadOnly"
            class="btn-submit" 
            @click="submitTaxForm" 
            :disabled="!formVerified"
          >
            SUBMIT
        </button>
          <button 
            v-if="!isReadOnly" 
            type="button" 
            class="btn-save" 
            @click="backToEdit"
          >
            BACK TO EDIT
          </button>
          <button 
            v-if="isReadOnly" 
            type="button" 
            class="btn-back" 
            @click="returnToHistory"
          >
            RETURN TO HISTORY
        </button>
        </div>

        <div v-if="validationError" class="error-message">
          {{ validationError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.min.css"
import { inject } from 'vue'

// Form status constants
const FORM_STATUS = {
  DRAFT: 'Saved as Draft',
  SUBMITTED: 'Submitted',
  FAILED: 'Submission Failed'
}

export default {
  name: "AddRecord",
  data() {
    return {
      toast: null,
      form: {
        id: `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        date: '',
        declarationType: '',
        address: '',
        declarationName: '',
        price: 0,
        otherInfo: '',
        status: '', // Track form status
        // Tax classification fields
        incomeType: '',
        creditType: '',
        deductionType: '',
        appliedTaxRate: null,
        appliedReturnRate: null,
        appliedInterestRate: null,
        appliedDeductionRate: null
      },
      formattedPrice: "",
      declarationTypes: [],
      individualDeclarationTypes: [
        { id: 'income', name: 'Income - Salary, investment returns, etc.' },
        { id: 'deduction', name: 'Deduction - Tax-deductible expenses' },
        { id: 'credit', name: 'Credit - Tax refunds, etc.' },
        { id: 'investment', name: 'Investment - Investment expenses' }
      ],
      businessDeclarationTypes: [
        { id: 'income', name: 'Income - Sales, service revenue, etc.' },
        { id: 'expense', name: 'Expense - Business-related expenses' },
        { id: 'asset', name: 'Asset - Business asset purchases' },
        { id: 'liability', name: 'Liability - Loans and liabilities' },
        { id: 'tax', name: 'Tax - Tax payments' }
      ],
      // 新增的分类选项
      incomeTypes: [
        { id: 'SALARY', name: 'Salary - Personal wage income' },
        { id: 'INVESTMENT', name: 'Investment - Dividends, interest, etc.' },
        { id: 'BUSINESS', name: 'Business - Business income' },
        { id: 'OTHER', name: 'Other - Other types of income' }
      ],
      creditTypes: [
        { id: 'REFUND', name: 'Tax Refund - Tax refunds' },
        { id: 'REIMBURSEMENT', name: 'Reimbursement - Expense reimbursements' }
      ],
      deductionTypes: [
        { id: 'BUSINESS_EXPENSE', name: 'Business Expense - 100% deductible' },
        { id: 'EDUCATION', name: 'Education - 50% deductible' },
        { id: 'CHARITY', name: 'Charity - 100% deductible' },
        { id: 'MEDICAL', name: 'Medical - 80% deductible' }
      ],
      loading: false,
      validationError: '',
      userRole: 'individual', // Default to 'individual', should be dynamically set
      isReviewMode: false,
      editingField: null,
      formVerified: false,
      savedForms: [], // Store all saved forms with their status
      isReadOnly: false, // For submitted forms that can't be edited
    }
  },
  props: {
    viewMode: {
      type: Boolean,
      default: false
    },
    formId: {
      type: [String, Number],
      default: null
    },
    mode: {
      type: String,
      default: 'edit' // 'edit' or 'view'
    }
  },
  created() {
    this.toast = inject('toast') || {
      success: msg => console.log('Toast success:', msg),
      error: msg => console.error('Toast error:', msg),
      info: msg => console.info('Toast info:', msg)
    }
  },
  computed: {
    formCompletenessComputed() {
      const requiredFields = [];
      let filledCount = 0;

      requiredFields.push({ key: 'date', label: 'Date' });
      requiredFields.push({ key: 'declarationType', label: 'Declaration Type' });
      requiredFields.push({ key: 'address', label: 'Address' });
      requiredFields.push({ key: 'declarationName', label: 'Declaration Name' });
      requiredFields.push({ key: 'price', label: 'Amount', validator: val => typeof val === 'number' && val > 0 });

      if (this.form.declarationType === 'income') {
        requiredFields.push({ key: 'incomeType', label: 'Income Type' });
      }
      if (this.form.declarationType === 'credit') {
        requiredFields.push({ key: 'creditType', label: 'Credit Type' });
      }
      if (this.form.declarationType === 'deduction') {
        requiredFields.push({ key: 'deductionType', label: 'Deduction Type' });
      }

      requiredFields.forEach(field => {
        const value = this.form[field.key];
        if (field.validator) {
          if (field.validator(value)) {
            filledCount++;
          }
        } else if (value && value.toString().trim() !== '') {
          filledCount++;
        }
      });

      if (requiredFields.length === 0) return { percentage: 0, filled: 0, total: 0 };
      
      const percentage = Math.round((filledCount / requiredFields.length) * 100);
      return {
        percentage,
        filled: filledCount,
        total: requiredFields.length
      };
    }
  },
  methods: {
    formatPrice() {
      let rawValue = this.formattedPrice.replace(/[^\d.]/g, "")
      const parts = rawValue.split(".")
      if (parts.length > 2) rawValue = parts[0] + "." + parts.slice(1).join("")
      
      // Ensure exactly 2 decimal places
      if (parts.length === 1) {
        rawValue += ".00"
      } else if (parts[1].length === 1) {
        rawValue += "0"
      } else if (parts[1].length > 2) {
        rawValue = parts[0] + "." + parts[1].slice(0, 2)
      }
      
      this.form.price = parseFloat(rawValue) || 0
      this.formattedPrice = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " AUD"
    },
    formatPriceAndFinishEdit() {
      this.formatPrice()
      this.finishEdit()
    },
    removeFormatting() {
      this.formattedPrice = this.formattedPrice.replace(/[^\d.]/g, "")
    },
    goBack() {
      // Navigate back to the previous page
      this.$router.go(-1);
    },
    reviewForm() {
      // Validate form
      if (this.validateForm()) {
        this.isReviewMode = true;
      }
    },
    validateForm() {
      this.validationError = ""
      
      // Validation logic
      if (!this.form.date) {
        this.validationError = "Please enter a valid date"
        return false
      }
      if (!this.form.declarationType) {
        this.validationError = "Please select a declaration type"
        return false
      }
      if (!this.form.address) {
        this.validationError = "Please enter an address"
        return false
      }
      if (!this.form.declarationName) {
        this.validationError = "Please enter a declaration name"
        return false
      }
      if (!this.form.price || this.form.price <= 0) {
        this.validationError = "Please enter a valid price greater than zero"
        return false
      }
      
      return true
    },
    async submitTaxForm() {
      if (!this.formVerified) {
        this.validationError = "Please verify the information before submission"
        return
      }
      
      this.loading = true
      this.validationError = '';
      let retryCount = 0;
      const maxRetries = 3;
      
      const submitWithRetry = async () => {
        try {
          console.log("Submitting form data:", {
          date: this.form.date,
            declaration_type: this.form.declarationType,
            address: this.form.address,
            declaration_name: this.form.declarationName,
            price: this.form.price,
            other_info: this.form.otherInfo,
            form_id: this.form.id
          });
          
          // Ensure API endpoint is correct - adjust based on actual interface
          const res = await this.$axios.post("/api/submit_tax_form", {
            date: this.form.date,
            declaration_type: this.form.declarationType,
            address: this.form.address,
            declaration_name: this.form.declarationName,
            price: this.form.price,
            other_info: this.form.otherInfo,
            form_id: this.form.id
          });
          
          if (res.data.success) {
            // Update the form with the server-assigned ID if provided
            if (res.data.form_id) {
              this.form.id = res.data.form_id;
            }
            
            // 设置为已提交状态
            this.form.status = FORM_STATUS.SUBMITTED;
            this.storeFormWithStatus();
            
            // 显示成功信息，使用注入的toast服务
            this.toast.success('Form submitted successfully!');
            
            // 发出表单提交事件
            this.$emit('form-submitted', this.form);
            
            // 重定向到表单历史页面
            this.$router.push('/form-history');
          } else {
            throw new Error(res.data.message || "Form submission failed");
          }
        } catch (error) {
          console.error("Error submitting form:", error);
          
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retry attempt ${retryCount}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return submitWithRetry();
          }
          
          // 将表单标记为提交失败
          this.form.status = FORM_STATUS.FAILED;
          this.storeFormWithStatus();
          
          // 显示错误信息，使用注入的toast服务
          this.toast.error('Form submission failed. Please try again later.');
          
          // 发出表单错误事件
          this.$emit('form-error', error.message || 'Unknown error');
          
          this.validationError = "Failed to submit form. The data has been saved locally.";
      } finally {
          this.loading = false;
        }
      };
      
      await submitWithRetry();
    },
    saveAndExit() {
      // Save the current form state and navigate away
      this.form.status = FORM_STATUS.DRAFT;
      this.storeFormWithStatus();
      
      // 显示成功信息，使用注入的toast服务
      this.toast.success('Form saved as draft.');
      
      // 发出表单保存事件
      this.$emit('form-saved', this.form);
      
      this.$router.push('/form-history');
    },
    storeFormWithStatus() {
      // Check if the form already has an ID, otherwise create a temporary one
      const formId = this.form.id || `temp-${Date.now()}`;
      
      // Create a copy of the form with a unique ID and timestamp
      const formCopy = {
        ...this.form,
        id: formId,
        savedAt: new Date().toISOString(),
        formattedPrice: this.formattedPrice
      };
      
      // Add to saved forms array
      this.savedForms.push(formCopy);
      
      // Save to localStorage
      try {
        // Get existing forms if any
        let savedFormsData = localStorage.getItem('taxForms') || '[]';
        let forms = JSON.parse(savedFormsData);
        
        // If this form already exists (with same ID), update it instead of adding
        const existingIndex = forms.findIndex(f => f.id === formId);
        if (existingIndex >= 0) {
          forms[existingIndex] = formCopy;
        } else {
          // Add new form
          forms.push(formCopy);
        }
        
        // Save back to localStorage
        localStorage.setItem('taxForms', JSON.stringify(forms));
        
        // Also save the current draft separately if it's a draft
        if (formCopy.status === FORM_STATUS.DRAFT) {
          localStorage.setItem('taxFormDraft', JSON.stringify(this.form));
        }
      } catch (e) {
        console.error("Error saving form data:", e);
      }
    },
    resetForm() {
      // Reset form without losing ID
      this.form = {
        id: `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toISOString().split('T')[0],
        declarationType: '',
        address: '',
        declarationName: '',
        price: 0,
        otherInfo: '',
        status: '',
        // 重置新的税务分类字段
        incomeType: '',
        creditType: '',
        deductionType: '',
        appliedTaxRate: null,
        appliedReturnRate: null,
        appliedInterestRate: null,
        appliedDeductionRate: null
      };
      
      this.formattedPrice = '';
      this.validationError = '';
      this.isReviewMode = false;
      this.formVerified = false;
    },
    backToEdit() {
      this.isReviewMode = false
      this.editingField = null
    },
    editField(field) {
      this.editingField = field
      this.$nextTick(() => {
        // Focus on the edit field
        if (this.$refs.editInput) {
          this.$refs.editInput.focus()
        } else {
          const editEl = document.querySelector('.editing input, .editing select, .editing textarea')
          if (editEl) editEl.focus()
        }
      })
    },
    finishEdit() {
      // Set a short delay to ensure the blur event is processed before clearing the edit state
      setTimeout(() => {
        this.editingField = null
      }, 100)
    },
    getDeclarationTypeName(typeId) {
      const allTypes = [...this.individualDeclarationTypes, ...this.businessDeclarationTypes]
      const foundType = allTypes.find(type => type.id === typeId)
      return foundType ? foundType.name : typeId
    },
    getIncomeTypeName(typeId) {
      const foundType = this.incomeTypes.find(type => type.id === typeId)
      return foundType ? foundType.name : (typeId || 'Not specified')
    },
    getCreditTypeName(typeId) {
      const foundType = this.creditTypes.find(type => type.id === typeId)
      return foundType ? foundType.name : (typeId || 'Not specified')
    },
    getDeductionTypeName(typeId) {
      const foundType = this.deductionTypes.find(type => type.id === typeId)
      return foundType ? foundType.name : (typeId || 'Not specified')
    },
    async getUserRole() {
      try {
        // Replace with your actual API endpoint to get user role
        const res = await this.$axios.get('/api/auth/user')
        this.userRole = res.data.role || 'individual'
        this.setDeclarationTypesByRole()
      } catch (err) {
        console.error("Failed to get user role:", err)
        // Default to individual
        this.userRole = 'individual'
        this.setDeclarationTypesByRole()
      }
    },
    setDeclarationTypesByRole() {
      if (this.userRole === 'business') {
        this.declarationTypes = this.businessDeclarationTypes
      } else {
        this.declarationTypes = this.individualDeclarationTypes
      }
    },
    loadSavedForms() {
      // Load all saved forms
      try {
        const savedFormsData = localStorage.getItem('taxForms');
        if (savedFormsData) {
          this.savedForms = JSON.parse(savedFormsData);
        }
      } catch (e) {
        console.error("Error loading saved forms:", e);
      }
    },
    loadSavedDraft() {
      const savedForm = localStorage.getItem('taxFormDraft')
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm)
          this.form = { ...parsedForm }
          this.formattedPrice = this.form.price ? 
            this.form.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " AUD" : ""
        } catch (e) {
          console.error("Error loading saved form:", e)
        }
      }
    },
    loadSpecificForm() {
      const formId = this.formId || this.$route.query.id;
      const mode = this.mode || this.$route.query.mode || 'edit';
      
      console.log(`Loading form, ID: ${formId}, Mode: ${mode}, Props: viewMode=${this.viewMode}`);
      
      if (!formId) return;
      
      try {
        // 首先检查localStorage中是否有完整的表单数据
        const viewFormData = localStorage.getItem('viewForm');
        if (viewFormData) {
          try {
            const savedForm = JSON.parse(viewFormData);
            if (savedForm && (savedForm.id.toString() === formId.toString() || savedForm.displayId === formId)) {
              console.log("从viewForm数据加载表单:", savedForm);
              this.form = { ...savedForm };
              this.formattedPrice = savedForm.formattedPrice || 
                (savedForm.price ? `${parseFloat(savedForm.price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} AUD` : "");
              
              // 检查表单是否已提交
              const isSubmitted = 
                this.form.status === 'SUBMITTED' || 
                this.form.status === 'Submitted' || 
                this.form.status === 'submitted' ||
                (this.form.originalStatus && 
                ['submitted', 'Submitted', 'SUBMITTED'].includes(this.form.originalStatus));
              
              // 根据模式设置表单状态
              if (mode === 'view') {
                // 标准只读模式 - 不可编辑
                console.log(`设置表单为完全只读模式: mode=${mode}`);
                this.isReadOnly = true;
                this.isReviewMode = true;
              } else if (mode === 'editable') {
                // 可编辑查看模式 - 可编辑但保持在查看界面
                console.log(`设置表单为可编辑查看模式: mode=${mode}`);
                this.isReadOnly = false;
                this.isReviewMode = true;
              } else if (mode === 'edit') {
                // 完全编辑模式
                console.log(`设置表单为完全编辑模式: mode=${mode}`);
                this.isReadOnly = false;
                this.isReviewMode = false;
              } else if (isSubmitted || this.viewMode === true) {
                // 已提交表单或显式viewMode=true，设为只读
                console.log(`基于状态设置为只读模式: isSubmitted=${isSubmitted}, viewMode=${this.viewMode}`);
                this.isReadOnly = true;
                this.isReviewMode = true;
              }
              
              // 获取用户角色以设置声明类型
              this.getUserRole();
              
              // 清除缓存的表单数据
              localStorage.removeItem('viewForm');
              
              return; // 已成功加载表单，退出方法
            }
          } catch (e) {
            console.error("解析viewForm数据时出错:", e);
          }
        }
        
        // 如果没有找到viewForm数据，尝试从保存的表单中查找
        const savedFormsData = localStorage.getItem('taxForms');
        if (savedFormsData) {
          const forms = JSON.parse(savedFormsData);
          const formToLoad = forms.find(f => 
            f.id.toString() === formId.toString() || 
            (f.numeric_id && f.numeric_id.toString() === formId.toString()) ||
            (f.displayId && f.displayId.toString() === formId.toString())
          );
          
          if (formToLoad) {
            console.log(`找到表单: ID=${formToLoad.id}, 状态=${formToLoad.status}`);
            
            // 加载表单数据
            this.form = { ...formToLoad };
            this.formattedPrice = this.form.formattedPrice || '';
            if (!this.formattedPrice && this.form.price) {
              this.formattedPrice = `${parseFloat(this.form.price).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} AUD`;
            }
            
            // 检查表单是否已提交
            const isSubmitted = 
              this.form.status === 'SUBMITTED' || 
              this.form.status === 'Submitted' || 
              this.form.status === 'submitted' ||
              (this.form.originalStatus && 
               ['submitted', 'Submitted', 'SUBMITTED'].includes(this.form.originalStatus));
            
            // 根据模式设置表单状态
            if (mode === 'view') {
              // 标准只读模式 - 不可编辑
              this.isReadOnly = true;
              this.isReviewMode = true;
            } else if (mode === 'editable') {
              // 可编辑查看模式 - 可编辑但保持在查看界面
              this.isReadOnly = false;
              this.isReviewMode = true;
            } else if (mode === 'edit') {
              // 完全编辑模式
              this.isReadOnly = false;
              this.isReviewMode = false;
            } else if (isSubmitted || this.viewMode === true) {
              // 已提交表单或显式viewMode=true，设为只读
              this.isReadOnly = true;
              this.isReviewMode = true;
            }
            
            // 获取用户角色以设置声明类型
            this.getUserRole();
          } else {
            console.error(`未找到ID为 ${formId} 的表单`);
            // 尝试使用旧的viewFormId回退
            const viewFormId = localStorage.getItem('viewFormId');
            if (viewFormId && viewFormId === formId) {
              console.warn(`尝试使用viewFormId=${viewFormId}重新搜索表单`);
              const formByOldId = forms.find(f => 
                f.id.toString() === viewFormId ||
                (f.numeric_id && f.numeric_id.toString() === viewFormId) ||
                (f.displayId && f.displayId.toString() === viewFormId)
              );
              
              if (formByOldId) {
                this.form = { ...formByOldId };
                this.formattedPrice = this.form.formattedPrice || '';
                if (!this.formattedPrice && this.form.price) {
                  this.formattedPrice = `${parseFloat(this.form.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} AUD`;
                }
                
                // 根据模式设置表单状态
                if (mode === 'view' || this.viewMode === true) {
                  this.isReadOnly = true;
                  this.isReviewMode = true;
                } else if (mode === 'editable') {
                  this.isReadOnly = false;
                  this.isReviewMode = true;
                } else {
                  this.isReadOnly = false;
                  this.isReviewMode = false;
                }
                
                this.getUserRole();
              }
            }
          }
        }
      } catch (e) {
        console.error("加载特定表单时出错:", e);
        this.toast.error(`加载表单失败: ${e.message || '未知错误'}`);
      }
    },
    returnToHistory() {
      // Implement the logic to return to form history
      this.$router.push('/form-history');
    },
  },
  mounted() {
    // Initialize date picker
    flatpickr("#date-picker", {
      dateFormat: "Y - m - d",
      // Ensure defaultDate is set only if form.date is empty, otherwise use existing
      defaultDate: this.form.date || new Date(),
      onChange: (selectedDates, dateStr) => {
        this.form.date = dateStr
      }
    })
    
    // Check if we are loading an existing form (view or edit)
    if (this.formId || this.$route.query.id) {
      console.log("Loading existing form...");
      this.loadSpecificForm();
    } else {
      // This is for creating a NEW form
      console.log("Creating new form...");
      // Ensure a fresh temporary ID is generated for a new form
      this.resetForm(); 
      
      // Get user role and set declaration types
      this.getUserRole();
      
      // Load saved forms (might not be needed for new form view)
      // this.loadSavedForms(); 
      
      // Don't load draft when explicitly creating a new form
      // this.loadSavedDraft(); 
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #E5E5E5;
  padding: 0;
  box-sizing: border-box;
  overflow-y: auto;
}

.form-card {
  position: relative;
  background: #E1E1E1;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  margin: auto;
  max-height: 90vh;
  overflow-y: auto;
}

.form-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.form-row {
  display: flex;
  width: 100%;
  max-width: 500px;
  gap: 10px;
  margin-bottom: 0.8rem;
}

.half-width {
  flex: 1;
  margin-bottom: 0 !important;
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
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
  color: #333;
}

.form-group {
  margin-bottom: 0.8rem;
  width: 100%;
  max-width: 500px;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #555;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.form-control {
  width: 100%;
  height: 40px;
  padding: 0.6rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: white;
  color: #333;
  box-sizing: border-box;
}

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23333' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  padding-right: 2rem;
}

textarea.form-control {
  min-height: 70px;
  resize: vertical;
}

/* 审阅模式样式 */
.review-field {
  position: relative;
  width: 100%;
  min-height: 40px;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
}

.readonly-value {
  padding: 0.6rem 0;
  font-size: 1rem;
  color: #333;
  flex-grow: 1;
}

.edit-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-left: 10px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.edit-icon:hover {
  opacity: 1;
}

.verification-box {
  width: 100%;
  max-width: 500px;
  margin: 1rem 0;
  padding: 0.6rem;
  background: #f5f5f5;
  border-radius: 5px;
}

.verification-label {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
}

.verification-label input {
  margin-top: 3px;
  margin-right: 10px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.2rem;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 0.5rem;
}

.btn-submit, .btn-save {
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.3s, transform 0.2s;
  width: 100%;
}

.btn-submit {
  background: #1F3A93;
  color: white;
}

.btn-submit:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
  transform: none !important;
}

.btn-save {
  background: transparent;
  border: 1px solid #1F3A93;
  color: #1F3A93;
}

.btn-submit:not(:disabled):hover {
  background: #142c70;
  transform: translateY(-2px);
}

.btn-save:hover {
  border-color: #142c70;
  color: #142c70;
  transform: translateY(-2px);
}

.btn-back {
  background: #1F3A93; /* Updated to match LoginPage button color */
  color: white;
}

.btn-back:hover {
  background: #142c70; /* Darker version to match LoginPage hover */
  transform: translateY(-2px);
}

.error-message {
  color: #e53935;
  margin-top: 0.8rem;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 600px) {
  .form-card {
    padding: 0.8rem;
    max-height: 95vh;
    margin: auto;
    border-radius: 10px;
  }
  
  .form-group, .button-group, .form-row, .verification-box {
    max-width: 100%;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .half-width {
    width: 100%;
  }
}

.progress-section {
  margin-bottom: 1.2rem; /* Increased margin */
  width: 100%;
  max-width: 500px; /* Match form group width */
  margin-left: auto; /* Center align with form fields */
  margin-right: auto;
}

.progress-label {
  font-size: 0.95em; /* Slightly larger label */
  color: #444; /* Darker text */
  margin-bottom: 0.4rem;
  display: block;
  font-weight: 500;
}

.progress-bar-container {
  width: 100%;
  background-color: #e9ecef; /* Lighter grey */
  border-radius: 8px; /* More rounded */
  height: 22px; /* Slightly taller */
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
}

.progress-bar-fill {
  height: 100%;
  background-color: #1F3A93; 
  /* Optional: gradient for a nicer look */
  /* background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent); */
  /* background-size: 40px 40px; */
  color: white;
  text-align: center;
  line-height: 22px; /* Match container height */
  font-size: 0.85em;
  font-weight: bold;
  border-radius: 8px 0 0 8px; 
  transition: width 0.4s ease-in-out;
}

.progress-bar-fill[style*="width: 100%"] {
  border-radius: 8px; /* Full radius when 100% */
}

.progress-bar-fill[style*="width: 0%"] {
  /* Hide text if 0% to avoid 0% text on empty bar */
  color: transparent;
}
</style>
