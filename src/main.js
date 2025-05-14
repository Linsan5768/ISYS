import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './styles/theme.css'
import toast from './services/toast'

// 导入配置并使用其API URL
import config from "./config.js";
const apiBaseUrl = config.apiBaseUrl;

// 检测GitHub Pages环境
const isGitHubPages = window.location.hostname.includes('github.io');
console.log("Backend API URL:", apiBaseUrl);
console.log("Running on GitHub Pages:", isGitHubPages);

// Create axios instance
const axiosInstance = axios.create({
  baseURL: isGitHubPages ? '/' : '/api',  // 在GitHub Pages上使用相对路径
  withCredentials: !isGitHubPages  // 在GitHub Pages上禁用凭证
})

// 在GitHub Pages上拦截请求并返回模拟数据
if (isGitHubPages) {
  axiosInstance.interceptors.request.use(
    config => {
      console.log("Running on GitHub Pages - API requests will be mocked");
      // 在GitHub Pages上，返回一个被拒绝的promise，这样会触发错误处理
      // 错误处理中会使用测试数据
      return Promise.reject({
        response: {
          status: 0,
          data: { message: "Running on GitHub Pages, using test data" }
        }
      });
    },
    error => Promise.reject(error)
  )
} else {
  // 正常环境下，添加认证token
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
}

// Create app
const app = createApp(App)

// Provide axios globally
app.config.globalProperties.$axios = axiosInstance

// Provide toast service globally
app.config.globalProperties.$toast = toast

// Provide a flag to indicate if running on GitHub Pages
app.config.globalProperties.$isGitHubPages = isGitHubPages

app.use(router)
app.mount('#app')

