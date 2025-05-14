import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './styles/theme.css'
import toast from './services/toast'


// 导入配置并使用其API URL
import config from "./config.js";


// 检测是否运行在 GitHub Pages（你现在不需要了，但保留逻辑以便本地测试）
const isGitHubPages = window.location.hostname.includes('github.io');
console.log("Backend API URL:", apiBaseUrl);
console.log("Running on GitHub Pages:", isGitHubPages);

// 创建 axios 实例（不再根据是否 GitHub Pages，统一指向后端）
const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true
});

// 请求拦截器（添加 token）
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

// 创建 app 实例
const app = createApp(App)

// 注入 axios 实例
app.config.globalProperties.$axios = axiosInstance

// 注入 toast 全局服务
app.config.globalProperties.$toast = toast

// 注入环境标识
app.config.globalProperties.$isGitHubPages = isGitHubPages

app.use(router)
app.mount('#app')