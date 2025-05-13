<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTheme } from '@/composables/useTheme.js'

const { themeName } = useTheme()

// 用户角色状态
const userRole = ref(null)

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.user) {
        userRole.value = data.user.role
        console.log('User role:', userRole.value)
      } else {
        console.error('User info not found in response')
      }
    } else {
      console.error('Failed to fetch user info')
    }
  } catch (error) {
    console.error('Error fetching user info:', error)
  }
}

// 只在主题真正改变时才触发切换
watch(themeName, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    document.documentElement.classList.toggle('dark', newVal === 'dark')
  }
}, { immediate: false })

// 页面加载后获取用户信息
onMounted(() => {
  fetchUserInfo() // 获取用户信息
})
</script>

<template>
  <div class="container">
    <div class="card">
      <img src="@/assets/logo.png" alt="Logo" class="welcome-image" />
     
      
      <!-- 根据用户角色显示不同按钮组 -->
      <!-- 管理员用户按钮 -->
      <div v-if="userRole === 'admin'" class="button-group">
        <router-link to="/dashboard" class="button">DASHBOARD</router-link>
        <router-link to="/admin/dashboard" class="button">AUDIT LOGS</router-link>
        <router-link to="/issues" class="button">VIEW ISSUES</router-link>
      </div>
      
      <!-- 普通用户按钮 -->
      <div v-else class="button-group">
        <router-link to="/add" class="button">CREATE A FORM</router-link>
        <router-link to="/form-history" class="button">FORM HISTORY</router-link>
        <router-link to="/dashboard" class="button">DASHBOARD</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  padding-top: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  min-height: 100vh;
  background: #E5E5E5;
  overflow: hidden;
}

.card {
  position: relative;
  z-index: 1;
  background: #E1E1E1;
  padding: 3rem 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 90%;
  max-width: 400px;
  animation: fadeIn 1s ease;
  margin-bottom: 200px;
}

.welcome-image {
  width: 160px;
  margin: 0 auto auto;
  animation: float 3s ease-in-out infinite;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-main);
}

.subtext {
  font-size: 1.1rem;
  color: var(--text-subtle);
  margin-bottom: 2rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.button {
  display: block;
  padding: 12px;
  text-decoration: none;
  background: #1F3A93;
  color: white;
  font-weight: bold;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  text-align: center;
}

.button:hover {
  background: #142c70;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>