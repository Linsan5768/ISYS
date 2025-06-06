import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './styles/theme.css'
import toast from './services/toast'

// ✅ 导入配置模块
import config from "./config.js"

// ✅ 打印调试信息
console.log("Backend API URL:", config.apiBaseUrl);
console.log("Running on GitHub Pages:", config.isGitHubPages);

// ✅ 解构 API 地址
const { apiBaseUrl } = config

// ✅ 创建 axios 实例（放在使用之前）
const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
})

// ✅ 添加请求拦截器
axiosInstance.interceptors.request.use(
  config => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  error => Promise.reject(error)
)

// ✅ 添加响应拦截器
axiosInstance.interceptors.response.use(
  response => {
    // 成功响应处理
    console.log(`API Response Success: ${response.config.url}`)
    return response
  },
  error => {
    // 错误响应处理
    console.error('API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })
    return Promise.reject(error)
  }
)

// ✅ 创建 Vue 应用
const app = createApp(App)

// ✅ 注入全局属性
app.config.globalProperties.$axios = axiosInstance
app.config.globalProperties.$toast = toast
app.config.globalProperties.$isGitHubPages = config.isGitHubPages

app.use(router)
app.mount('#app')