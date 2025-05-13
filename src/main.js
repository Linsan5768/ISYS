import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './styles/theme.css'
import config from "./config.js";
console.log("Backend API URL:", config.apiBaseUrl);
console.log("Running on GitHub Pages:", config.isGitHubPages);

// Create axios instance
const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true  // 确保所有请求都包含凭证
})

// Add a request interceptor to include authentication token with requests
axiosInstance.interceptors.request.use(
  config => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    }
    return config
  },
  error => Promise.reject(error)
)

// Create app
const app = createApp(App)

// Provide axios globally
app.config.globalProperties.$axios = axiosInstance

// Provide a flag to indicate if running on GitHub Pages
app.config.globalProperties.$isGitHubPages = config.isGitHubPages

app.use(router)
app.mount('#app')

