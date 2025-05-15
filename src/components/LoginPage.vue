<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { useAuth } from '../composables/useAuth'

const { proxy } = getCurrentInstance()
const router = useRouter()
const { login, isAuthenticated } = useAuth()

// Get theme functionality
useTheme()

// Redirect if already logged in
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/home')
  }
})

// Login form data
const loginForm = reactive({
  email: '',
  password: '',
})

// Form validation
const loginError = ref('')
const isLoading = ref(false)

// Handle login submit
const handleLogin = async () => {
  isLoading.value = true
  loginError.value = ''
  
  try {
    console.log('Login attempt:', loginForm.email)
    
    // 修改前: 
    // const apiUrl = 'https://fanum-frontend.vercel.app/api/auth/login'
    // console.log('Login API URL:', apiUrl)
    // const response = await fetch(apiUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(loginForm)
    // })
    
    // 修改后:
    console.log('Login with global axios instance')
    const response = await proxy.$axios.post('/api/auth/login', loginForm)
    
    console.log('Login response status:', response.status)
    
    // 修改前:
    // if (response.ok) {
    //   const data = await response.json()
    
    // 修改后:
    if (response.status === 200) {
      const data = response.data
      
      login(data)
      router.push('/home')
    } else {
      loginError.value = 'Login failed. Please check your credentials.'
    }
  } catch (error) {
    console.log(' Error during login process:', error)
    loginError.value = 'Error during login. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

// Navigate to signup page
const goToSignUp = () => {
  router.push('/signup')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Replace title with logo -->
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="login-email">EMAIL</label>
          <input 
            type="email" 
            id="login-email" 
            v-model="loginForm.email" 
            autocomplete="email"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">PASSWORD</label>
          <input 
            type="password" 
            id="password" 
            v-model="loginForm.password" 
            autocomplete="current-password"
            class="form-input"
          />
        </div>
        
        <p v-if="loginError" class="error-message">{{ loginError }}</p>
        
        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? 'SIGNING IN...' : 'SIGN IN' }}
        </button>
      </form>
      
      <p class="toggle-form">
        DON'T HAVE AN ACCOUNT? 
        <a href="#" @click.prevent="goToSignUp">SIGN UP NOW</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #E5E5E5;
  padding: 20px;
}

.login-card {
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

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.logo-image {
  max-width: 200px;
  height: auto;
  margin-bottom: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
  width: 80%; /* 调整表单整体宽度 */
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

.form-input:focus {
  border-color: #1F3A93;
  outline: none;
}

input::placeholder {
  opacity: 0; /* 隐藏所有placeholder */
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
  width: 100%; /* 确保按钮宽度一致 */
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
  width: 80%; /* 与表单宽度一致 */
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
</style> 