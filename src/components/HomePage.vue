<script setup>
import { ref, onMounted, watch, inject, getCurrentInstance } from 'vue'
import { useTheme } from '@/composables/useTheme.js'
import { useRouter } from 'vue-router'

const { themeName } = useTheme()
const router = useRouter()
const { proxy } = getCurrentInstance()

// 用户角色状态
const userRole = ref(null)

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await proxy.$axios.get('/api/auth/verify')
    
    if (response.status === 200) {
      const data = response.data
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
  generateTaxReminders()
})

const tasks = ref([
  { description: '创建新的表单', link: '/add' },
  { description: '查看历史表单', link: '/form-history' },
  { description: '查看财务面板', link: '/dashboard' }
])

// 获取toast服务和通知服务
const toast = inject('toast')
const notifications = inject('notifications')

// 生成示例税务提醒
const generateTaxReminders = () => {
  // 检查是否在当前月是否有应缴税款
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1 // 月份是0-11，加1得到1-12
  const currentDay = currentDate.getDate()
  
  // 生成一个当天唯一标识，用于检查是否已经发送过提醒
  const today = `${currentDate.getFullYear()}-${currentMonth}-${currentDay}`
  
  // 从localStorage检查今天是否已经发送过提醒
  const sentReminders = JSON.parse(localStorage.getItem('sentTaxReminders') || '{}')
  
  // 如果今天已经发送过提醒，则不再发送
  if (sentReminders[today]) {
    console.log('今天已经发送过税务提醒，跳过')
    return
  }
  
  // 记录需要发送的提醒
  let hasReminders = false
  
  // 模拟税务周期提醒
  const quarterlyTaxMonths = [3, 6, 9, 12] // 季度末月份
  const yearEndTaxMonth = 6 // 财年末（澳大利亚财年6月30日结束）
  
  // 如果接近季度末，发出提醒
  if (quarterlyTaxMonths.includes(currentMonth)) {
    const daysLeft = new Date(currentDate.getFullYear(), currentMonth, 0).getDate() - currentDate.getDate()
    
    if (daysLeft <= 14) {
      // 发送季度提醒
      setTimeout(() => {
        toast.warning(`季度税务申报将在${daysLeft}天后截止`, {
          title: '季度税务提醒',
          duration: 6000
        })
        
        // 添加到通知中心
        if (notifications) {
          notifications.addNotification({
            title: '季度税务申报',
            message: `QUARTERLY TAX DECLARATION DUE SOON`,
            time: new Date(),
            read: false
          })
        }
      }, 3000)
      
      hasReminders = true
    }
  }
  
  // 如果接近财年末，发出提醒
  if (currentMonth === yearEndTaxMonth) {
    const daysLeft = new Date(currentDate.getFullYear(), currentMonth, 0).getDate() - currentDate.getDate()
    
    if (daysLeft <= 30) {
      // 发送年度提醒
      setTimeout(() => {
        toast.warning(`年度财务申报将在${daysLeft}天后截止`, {
          title: '年度税务提醒',
          duration: 6000
        })
        
        // 添加到通知中心
        if (notifications) {
          notifications.addNotification({
            title: '年度税务申报',
            message: 'ANNUAL TAX DECLARATION DUE SOON',
            time: new Date(),
            read: false
          })
        }
      }, 5000)
      
      hasReminders = true
    }
  }
  
  // 薪资申报提醒 - 模拟每月15日前需要提交
  if (currentDate.getDate() <= 15) {
    const daysLeft = 15 - currentDate.getDate()
    
    if (daysLeft <= 7) {
      // 发送薪资提醒
      setTimeout(() => {
        toast.info(`薪资申报将在${daysLeft}天后截止`, {
          title: '薪资申报提醒',
          duration: 6000
        })
        
        // 添加到通知中心
        if (notifications) {
          notifications.addNotification({
            title: '薪资申报提醒',
            message: 'SALARY DECLARATION DUE SOON',
            time: new Date(),
            read: false
          })
        }
      }, 7000)
      
      hasReminders = true
    }
  }
  
  // 如果发送了提醒，记录今天已经发送过
  if (hasReminders) {
    sentReminders[today] = true
    localStorage.setItem('sentTaxReminders', JSON.stringify(sentReminders))
    console.log('今天的税务提醒已发送并记录')
  }
}

const navigateTo = (link) => {
  router.push(link)
}
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