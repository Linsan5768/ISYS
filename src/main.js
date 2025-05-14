import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './styles/theme.css'
import toast from './services/toast'

// ✅ 导入配置模块（包含 API 地址与是否 GitHub Pages）
import config from "./config.js"

// ✅ 打印调试信息
console.log("Backend API URL:", config.apiBaseUrl);
console.log("Running on GitHub Pages:", config.isGitHubPages);

// ✅ 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true
});

// ✅ 请求拦截器：自动附加 token
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
);

// ✅ 创建并挂载 Vue 应用
const app = createApp(App)

app.config.globalProperties.$axios = axiosInstance
app.config.globalProperties.$toast = toast
app.config.globalProperties.$isGitHubPages = config.isGitHubPages

app.use(router)
app.mount('#app')