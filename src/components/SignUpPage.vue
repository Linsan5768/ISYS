<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'

// Get theme functionality
useTheme()
const router = useRouter()
const { proxy } = getCurrentInstance()

// Registration form data
const registerForm = reactive({
  givenName: '',
  familyName: '',
  role: 'individual',
  phone: '', // Will be displayed with country code format in UI
  email: '',
  password: '',
  confirmPassword: '',
})

// Form validation
const registerError = ref('')
const isLoading = ref(false)

// Phone number formatting
const formattedPhone = ref('')

// Listen for phone input and apply formatting
const handlePhoneInput = (event) => {
  // Remove all non-digit characters
  let phoneNumber = event.target.value.replace(/\D/g, '')
  
  // If user enters 0 as first digit (Australian local format), remove it
  if (phoneNumber.startsWith('0')) {
    phoneNumber = phoneNumber.substring(1)
  }
  
  // Limit to 9 digits (standard Australian mobile number length, without country code)
  phoneNumber = phoneNumber.substring(0, 9)
  
  // Update form data
  registerForm.phone = phoneNumber
  
  // Format display (without +61 prefix, as it's shown separately)
  if (phoneNumber.length > 0) {
    // Australian phone format: XXX XXX XXX (without +61 prefix)
    if (phoneNumber.length <= 3) {
      formattedPhone.value = phoneNumber
    } else if (phoneNumber.length <= 6) {
      formattedPhone.value = phoneNumber.substring(0, 3) + ' ' + phoneNumber.substring(3)
    } else {
      formattedPhone.value = phoneNumber.substring(0, 3) + ' ' + phoneNumber.substring(3, 6) + ' ' + phoneNumber.substring(6)
    }
  } else {
    formattedPhone.value = ''
  }
}

// Initialize phone input field
onMounted(() => {
  formattedPhone.value = ''
})

// Handle registration submit
const handleRegister = async () => {
  // Reset error message
  registerError.value = ''
  
  // Basic validation
  if (!registerForm.givenName || !registerForm.familyName || !registerForm.email || !registerForm.password) {
    registerError.value = 'ALL FIELDS ARE REQUIRED'
    return
  }
  
  // Validate name format (no numbers or special characters)
  const nameRegex = /^[A-Za-z\s-']+$/
  if (!nameRegex.test(registerForm.givenName)) {
    registerError.value = 'GIVEN NAME SHOULD ONLY CONTAIN LETTERS'
    return
  }
  
  if (!nameRegex.test(registerForm.familyName)) {
    registerError.value = 'FAMILY NAME SHOULD ONLY CONTAIN LETTERS'
    return
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.email)) {
    registerError.value = 'PLEASE ENTER A VALID EMAIL ADDRESS'
    return
  }
  
  // Validate phone format (Australian mobile numbers are typically 9 digits)
  if (registerForm.phone.length < 9) {
    registerError.value = 'PLEASE ENTER A VALID AUSTRALIAN PHONE NUMBER'
    return
  }
  
  if (registerForm.password !== registerForm.confirmPassword) {
    registerError.value = 'PASSWORDS DO NOT MATCH'
    return
  }
  
  if (registerForm.password.length < 6) {
    registerError.value = 'PASSWORD MUST BE AT LEAST 6 CHARACTERS'
    return
  }
  
  try {
    isLoading.value = true
    console.log('Starting registration:', registerForm.email, 'role:', registerForm.role)
    
    console.log('Registration with global axios instance')
    
    const response = await proxy.$axios.post('/api/auth/register', {
      email: registerForm.email,
      givenName: registerForm.givenName,
      familyName: registerForm.familyName,
      phone: '+61' + registerForm.phone, // Ensure +61 prefix is added
      password: registerForm.password,
      role: registerForm.role
    })
    
    console.log('Registration response status:', response.status)
    const result = response.data
    console.log('Registration response data:', result)
    
    if (response.status === 200 && result.success) {
      // Redirect to login page after successful registration
      alert('REGISTRATION SUCCESSFUL')
      router.push('/login')
    } else {
      registerError.value = result.message || 'REGISTRATION FAILED'
      console.error('Registration failed:', result.message || 'Unknown error')
    }
  } catch (error) {
    console.error('Error during registration process:', error)
    registerError.value = 'REGISTRATION FAILED, PLEASE TRY AGAIN LATER'
  } finally {
    isLoading.value = false
  }
}

// Navigate to login page
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="signup-container">
    <div class="signup-card">
      <h1>CREATE ACCOUNT</h1>
      
      <form @submit.prevent="handleRegister" class="signup-form">
        <div class="form-group">
          <label for="register-given-name">GIVEN NAME</label>
          <input 
            type="text" 
            id="register-given-name" 
            v-model="registerForm.givenName" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="register-family-name">FAMILY NAME</label>
          <input 
            type="text" 
            id="register-family-name" 
            v-model="registerForm.familyName" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="register-role">ROLE</label>
          <select 
            id="register-role" 
            v-model="registerForm.role"
            class="form-input"
          >
            <option value="" disabled selected>Select</option>
            <option value="individual">INDIVIDUAL TAXPAYER</option>
            <option value="business">BUSINESS TAXPAYER</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="register-phone">PHONE</label>
          <div class="phone-input-container">
            <div class="phone-prefix">+61</div>
            <input 
              type="tel" 
              id="register-phone" 
              :value="formattedPhone"
              @input="handlePhoneInput"
              class="form-input phone-input"
              aria-label="Phone number"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="register-email">EMAIL</label>
          <input 
            type="email" 
            id="register-email" 
            v-model="registerForm.email" 
            autocomplete="email"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="register-password">PASSWORD</label>
          <input 
            type="password" 
            id="register-password" 
            v-model="registerForm.password" 
            autocomplete="new-password"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="confirm-password">CONFIRM PASSWORD</label>
          <input 
            type="password" 
            id="confirm-password" 
            v-model="registerForm.confirmPassword" 
            autocomplete="new-password"
            class="form-input"
          />
        </div>
        
        <p v-if="registerError" class="error-message">{{ registerError }}</p>
        
        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? 'SIGNING UP...' : 'SIGN UP' }}
        </button>
      </form>
      
      <p class="toggle-form">
        ALREADY HAVE AN ACCOUNT? 
        <a href="#" @click.prevent="goToLogin">SIGN IN</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #E5E5E5;
  padding: 20px;
}

.signup-card {
  background-color: #E1E1E1;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  text-align: center;
  animation: fadeIn 0.8s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
  width: 80%; /* Adjust form overall width */
  margin-left: auto;
  margin-right: auto;
}

.form-group {
  text-align: left;
  margin-bottom: 12px;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 3px;
  font-size: 0.8rem;
  color: var(--text-main);
  font-weight: 700;
  text-transform: uppercase;
}

/* Ensure consistent input styles */
.form-input {
  width: 100%;
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: #fff;
  color: var(--text-main);
  transition: border-color 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  height: 28px;
  appearance: none; /* Remove default styling */
  box-sizing: border-box;
}

/* Add dropdown arrow for select elements */
select.form-input {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23555' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 25px;
  width: 100%; /* Ensure dropdown width matches other inputs */
}

.form-input:focus {
  border-color: #1F3A93;
  outline: none;
}

input::placeholder {
  opacity: 0; /* Hide all placeholders */
}

.submit-button {
  background-color: #1F3A93;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 0.5rem;
  height: 30px;
  width: 100%; /* Ensure button width consistency */
}

.submit-button:hover:not(:disabled) {
  background-color: #142c70;
  transform: translateY(-2px);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: #ff5252;
  font-size: 0.8rem;
  text-align: left;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.toggle-form {
  font-size: 0.9rem;
  color: var(--text-subtle);
  width: 80%; /* Match form width */
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.toggle-form a {
  color: #1F3A93;
  text-decoration: none;
  font-weight: 600;
}

.toggle-form a:hover {
  text-decoration: underline;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Phone input container styles */
.phone-input-container {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.phone-prefix {
  background-color: #fff;
  border: 1px solid #ddd;
  border-right: none;
  border-radius: 4px 0 0 4px;
  padding: 5px 8px;
  font-size: 0.85rem;
  color: var(--text-main);
  height: 28px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  width: 40px; /* Fixed width for prefix */
  justify-content: center;
  box-sizing: border-box;
}

.phone-input {
  border-radius: 0 4px 4px 0;
  border-left: none;
  flex: 1;
  min-width: 0; /* Prevent overflow */
}
</style> 