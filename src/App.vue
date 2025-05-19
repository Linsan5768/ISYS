<template>
  <div id="app">
    <!-- Toast Notifications Wrapper -->
    <ToastWrapper />
    
    <!-- 导航栏 -->
    <nav class="navbar" v-if="isAuthenticated">
      <div class="menu-container">
        <button class="menu-btn" @click="toggleMenu" aria-label="Menu">
          𓃑
        </button>
        <div class="menu-content" :class="{ 'menu-open': isMenuOpen }">
          <!-- 普通用户菜单项 -->
          <template v-if="!isAdminUser">
            <div class="user-section">
              <router-link class="menu-item" to="/home" @click="closeMenu">Home</router-link>
              <router-link class="menu-item" to="/add" @click="closeMenu">Create Form</router-link>
              <router-link class="menu-item" to="/form-history" @click="closeMenu">Form History</router-link>
              <router-link class="menu-item" to="/dashboard" @click="closeMenu">Dashboard</router-link>
              <div class="menu-item logout-item" @click="handleLogout">Logout</div>
            </div>
          </template>
          
          <!-- 管理员专用菜单项 -->
          <template v-if="isAdminUser">
            <div class="admin-section">
              <div class="admin-header">{{ user.username }}</div>
              <router-link class="menu-item admin-item" to="/home" @click="closeMenu">Home</router-link>
              <router-link class="menu-item admin-item" to="/admin/dashboard" @click="closeMenu">Audit Logs</router-link>
              <router-link class="menu-item admin-item" to="/issues" @click="closeMenu">System Issues</router-link>
              <router-link class="menu-item admin-item" to="/admin/users" @click="closeMenu">User Management</router-link>
              <router-link class="menu-item admin-item" to="/admin/settings" @click="closeMenu">System Settings</router-link>
              <div class="menu-item admin-item logout-item" @click="handleLogout">Logout</div>
            </div>
          </template>
        </div>
        <!-- 移动端覆盖层 -->
        <div class="menu-overlay" v-if="isMenuOpen" @click="closeMenu"></div>
      </div>

      <!-- 提醒事项按钮 -->
      <div class="notification-container" 
           @mouseenter="showPreview = true" 
           @mouseleave="showPreview = false">
        <button class="notification-btn" @click="navigateToNotifications" aria-label="Notifications">
          <img src="@/assets/notification.png" alt="Notifications" class="notification-icon" />
          <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
        </button>
        
        <!-- 鼠标悬停时的简略预览 -->
        <div class="notification-preview" v-if="showPreview && notifications.length > 0">
          <div class="preview-header">
            <h3>Recent Notifications</h3>
          </div>
          <div class="preview-list">
            <div 
              v-for="(notification, index) in previewNotifications" 
              :key="index"
              class="preview-item"
            >
              <div class="preview-title">{{ notification.title }}</div>
              <div class="preview-time">{{ formatTime(notification.time) }}</div>
            </div>
          </div>
          <div class="preview-footer">
            <span @click="navigateToNotifications">View all notifications</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- 路由页面 -->
    <router-view @form-submitted="handleFormSubmitted" @form-saved="handleFormSaved" @form-error="handleFormError" />
    
    <!-- 用户信息页脚 -->
    <UserInfoFooter />
    
    <!-- 会话超时警告 -->
    <InactivityWarning 
      ref="inactivityWarning"
      :warning-time="30"
      @extend="resetInactivityTimer"
      @timeout="handleLogout"
      v-if="isAuthenticated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, provide, watch } from 'vue'
import { useAuth } from './composables/useAuth'
import { useRouter, useRoute } from 'vue-router'
import UserInfoFooter from './components/UserInfoFooter.vue'
import InactivityWarning from './components/InactivityWarning.vue'
import ToastWrapper from './components/ToastWrapper.vue'
import toastService from './services/toast'

// Provide the new toastService globally
provide('toast', toastService)

// 路由
const router = useRouter()
const route = useRoute()

// 获取认证状态
const { user, isAuthenticated, logout, isAdmin } = useAuth()

// 判断是否为管理员
const isAdminUser = isAdmin;

// 菜单状态
const isMenuOpen = ref(false)

// 自动登出功能
const INACTIVITY_TIMEOUT = 1 * 60 * 1000 // 1分钟无操作自动登出
const WARNING_BEFORE_TIMEOUT = 30 * 1000 // 超时前30秒显示警告
let inactivityTimer = null
const lastActivity = ref(Date.now())
const inactivityWarning = ref(null)

// 重置计时器
const resetInactivityTimer = () => {
  lastActivity.value = Date.now()
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }
  
  // 只有在用户已登录的情况下才设置计时器
  if (isAuthenticated.value) {
    inactivityTimer = setTimeout(checkInactivity, 60000) // 每分钟检查一次
  }
}

// 检查用户是否长时间未活动
const checkInactivity = () => {
  const now = Date.now()
  const timeSinceLastActivity = now - lastActivity.value
  
  // 如果接近超时时间，显示警告
  if (timeSinceLastActivity >= INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT) {
    if (inactivityWarning.value) {
      inactivityWarning.value.showTimeoutWarning()
    }
  } else if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
    // 已超时，执行登出
    console.log('用户长时间未活动，自动登出')
    handleLogout()
  } else {
    // 还未达到超时时间，继续检查
    inactivityTimer = setTimeout(checkInactivity, 60000)
  }
}

// 用户活动事件监听器
const userActivityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

// 组件挂载时设置事件监听
onMounted(() => {
  resetInactivityTimer()
  userActivityEvents.forEach(event => {
    window.addEventListener(event, resetInactivityTimer)
  })
  
  // 只有在初始加载时用户已认证才检查草稿和负债
  if (isAuthenticated.value) {
    checkSavedDrafts()
    checkUpcomingTaxLiabilities()
  }
  
  // 清除所有通知和提醒记录
  clearAllNotifications()
  
  // 重新加载空通知
  loadNotifications()
})

// 监听认证状态变化
watch(isAuthenticated, (newValue, oldValue) => {
  if (newValue === true && oldValue === false) {
    // 用户从"未登录"变为"已登录"
    checkSavedDrafts() 
    checkUpcomingTaxLiabilities() 
    // 重新加载通知，确保新用户的通知被正确加载
    loadNotifications()
    // 重置活动计时器，因为用户刚刚执行了操作（登录）
    resetInactivityTimer()
  }
  if (newValue === false && oldValue === true) {
    // 用户从"已登录"变为"未登录"
    // 清除可能存在的计时器
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
    // 清除通知，避免显示前一个用户的通知
    notifications.value = [] 
    saveNotifications() // 保存空的通知列表到localStorage
  }
});

// 检查已保存的表单草稿
const checkSavedDrafts = () => {
  // Prevent this check for admin users
  if (isAdmin.value) {
    console.log('Admin user, skipping saved drafts check.');
    return;
  }
  try {
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
      return;
    }
    const userObj = JSON.parse(currentUser);
    if (!userObj.isLoggedIn) {
      return;
    }

    const taxForms = JSON.parse(localStorage.getItem('taxForms') || '[]')
    const draftForms = taxForms.filter(form => form.status === 'Saved as Draft')
    
    if (draftForms.length > 0) {
      // 延迟一下显示通知，让页面先加载完成
      setTimeout(() => {
        toastService.info(`You have ${draftForms.length} saved draft${draftForms.length > 1 ? 's' : ''} waiting to be submitted`, {
          title: 'Saved Forms',
          duration: 5000
        })
        
        // 添加到通知中心
        addNotification({
          title: 'Saved Forms',
          message: `You have ${draftForms.length} forms saved as drafts`,
          time: new Date(),
          read: false
        })
      }, 1000)
    }
  } catch (error) {
    console.error('Error checking saved drafts:', error)
  }
}

// 检查即将到期的税务负债
const checkUpcomingTaxLiabilities = () => {
  try {
    // 检查用户是否登录
    const currentUser = localStorage.getItem('user')
    if (!currentUser) {
      console.log('User not logged in, skipping tax liability checks')
      return
    }
    
    const userObj = JSON.parse(currentUser)
    if (!userObj.isLoggedIn) {
      console.log('User not logged in, skipping tax liability checks')
      return
    }
    
    // 获取用户ID或Email作为唯一标识
    const userId = userObj.email || 'anonymous'
    
    // 针对管理员用户显示管理员特定的提醒
    if (isAdmin.value) {
      // 只添加管理员专属通知
      setTimeout(() => {
        toastService.info('Administrative view allows flagging unresolved or repeated errors for further review', {
          title: 'Admin Features',
          duration: 10000
        })
        
        // 添加到通知中心
        addNotification({
          userId: userId, 
          title: 'Administrative Alert',
          message: 'Provide an administrative view where unresolved or repeated errors can be flagged for further review.',
          time: new Date(),
          read: false,
          isAdminNotification: true,
          issuesLink: '/issues' // 修改为Issues页面路径
        })
      }, 1000)
      
      // 管理员用户不接收税务负债提醒
      return
    }
    
    // 以下代码只对非管理员用户执行 - 处理税务提醒
    
    // 尝试从Dashboard组件获取Current Tax Liabilities
    // 由于我们无法直接访问Dashboard组件，我们使用模拟数据，但在实际集成中
    // 这里应该访问Dashboard组件中的currentTaxLiabilities或从API获取
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    
    // 获取当前税务负债数据 - 应该从API或Dashboard组件获取
    // 这是一个模拟示例
    const taxLiabilities = [
      { 
        id: 1, 
        name: 'Quarterly Tax Payment', 
        dueDate: new Date(currentYear, currentDate.getMonth() + 1, 15), 
        amount: 5000,
        status: 'upcoming',
        statusText: 'Due Soon'
      },
      { 
        id: 2, 
        name: 'Annual Income Tax', 
        dueDate: new Date(currentYear, currentDate.getMonth() + 2, 15), 
        amount: 12000,
        status: 'upcoming',
        statusText: 'Upcoming'
      }
    ]
    
    // 确保我们只显示实际的税务负债，不包括预测性和负值项目
    const currentTaxLiabilities = taxLiabilities.filter(liability => {
      // 只保留实际的税务负债，排除预测的投资回报等
      const isActualTaxLiability = 
        !liability.name.toLowerCase().includes('projected') &&
        !liability.name.toLowerCase().includes('interest') &&
        !liability.name.toLowerCase().includes('return') &&
        liability.amount > 0;
      
      // 确保是未来或当前需要支付的项目
      const isCurrentOrUpcoming = 
        liability.status === 'upcoming' || 
        liability.status === 'due-soon' ||
        liability.status === 'overdue';
      
      return isActualTaxLiability && isCurrentOrUpcoming;
    })
    
    if (currentTaxLiabilities.length > 0) {
      // 延迟显示通知
      setTimeout(() => {
        const totalAmount = currentTaxLiabilities.reduce((sum, item) => sum + item.amount, 0)
        
        // 显示汇总通知
        toastService.warning(`You have ${currentTaxLiabilities.length} tax liabilities totaling ${new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD'
        }).format(totalAmount)}`, {
          title: 'Tax Liability Alert',
          duration: 7000
        })
        
        // 添加各项税务负债到通知中心
        currentTaxLiabilities.forEach(liability => {
          const daysLeft = Math.floor((liability.dueDate - new Date()) / (24 * 60 * 60 * 1000))
          const dueText = daysLeft <= 7 
            ? `due in ${daysLeft} days` 
            : `due on ${liability.dueDate.toLocaleDateString('en-US')}`
          
          addNotification({
            userId: userId,
            title: 'Tax Liability Alert',
            message: `${liability.name.toUpperCase()}: ${new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD'
            }).format(liability.amount)} ${dueText}`,
            time: new Date(),
            read: false
          })
        })
        
        // 记录今天已经向该用户发送过提醒
        const today = `${currentYear}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
        const storageKey = `sentLiabilityReminders_${userId}`
        const sentLiabilityReminders = JSON.parse(localStorage.getItem(storageKey) || '{}')
        sentLiabilityReminders[today] = true
        localStorage.setItem(storageKey, JSON.stringify(sentLiabilityReminders))
        console.log(`Tax liability reminders sent to user ${userId} and recorded for today`)
      }, 2000)
    }
  } catch (error) {
    console.error('Error checking tax liabilities:', error)
  }
}

// 组件卸载时清除事件监听和计时器
onUnmounted(() => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }
  userActivityEvents.forEach(event => {
    window.removeEventListener(event, resetInactivityTimer)
  })
})

// 切换菜单
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
  resetInactivityTimer() // 记录菜单操作
}

// 关闭菜单
const closeMenu = () => {
  isMenuOpen.value = false
  document.body.style.overflow = ''
  resetInactivityTimer() // 记录菜单操作
}

// 处理登出
const handleLogout = () => {
  closeMenu()
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
  logout()
}

// 通知相关
const showPreview = ref(false) // 控制悬停预览显示
const notifications = ref([])

// 只显示最近的3条通知
const previewNotifications = computed(() => {
  // 先过滤出当前用户的通知
  const userNotifications = filterUserNotifications(notifications.value);
  return userNotifications.slice(0, 3);
})

const unreadNotifications = computed(() => {
  // 先过滤出当前用户的通知，再计算未读数
  const userNotifications = filterUserNotifications(notifications.value);
  return userNotifications.filter(notification => !notification.read).length;
})

// 筛选当前用户的通知
const filterUserNotifications = (allNotifications) => {
  const currentUser = localStorage.getItem('user');
  if (!currentUser) return [];
  
  const userObj = JSON.parse(currentUser);
  if (!userObj.isLoggedIn) return [];
  
  const userId = userObj.email || 'anonymous';
  
  return allNotifications.filter(notification => 
    !notification.userId || notification.userId === userId
  );
}

// 导航到通知历史页面
const navigateToNotifications = () => {
  router.push('/notifications')
  resetInactivityTimer()
}

// 添加通知
const addNotification = (notification) => {
  // Prevent adding form-related notifications for admin users
  const formRelatedTitles = ['Saved Forms', 'Form Submitted', 'Form Saved', 'Form Error'];
  if (isAdmin.value && formRelatedTitles.includes(notification.title)) {
    console.log(`Admin user, skipping form-related notification: "${notification.title}"`);
    return;
  }

  // 获取当前用户ID
  const currentUser = localStorage.getItem('user');
  if (!currentUser) {
    console.log('用户未登录，跳过添加通知');
    return;
  }
  
  const userObj = JSON.parse(currentUser);
  if (!userObj.isLoggedIn) {
    console.log('用户未登录，跳过添加通知');
    return;
  }
  
  // 设置用户ID
  const userId = userObj.email || 'anonymous';
  
  // 确保通知包含用户ID
  const notificationWithUser = { 
    ...notification,
    userId: notification.userId || userId
  };
  
  notifications.value.unshift(notificationWithUser);
  
  // 最多保留每个用户20条通知
  const userNotifications = notifications.value.filter(n => n.userId === userId);
  if (userNotifications.length > 20) {
    // 找到要移除的通知索引
    const toRemove = notifications.value.findIndex(
      (n, idx) => n.userId === userId && idx >= 20
    );
    if (toRemove >= 0) {
      notifications.value.splice(toRemove, 1);
    }
  }
  // 保存到localStorage
  saveNotifications();
}

// 清除所有通知数据
const clearAllNotifications = () => {
  try {
    // 清除所有通知
    notifications.value = [];
    localStorage.removeItem('notifications');
    
    // 清除所有提醒记录
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sentLiabilityReminders_') || 
          key.startsWith('sentDashboardReminders_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('所有通知和提醒记录已清除');
  } catch (error) {
    console.error('清除通知数据时出错:', error);
  }
}

// 保存通知到本地存储
const saveNotifications = () => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications.value));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

// 加载通知
const loadNotifications = () => {
  try {
    // 检查用户是否登录
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
      console.log('用户未登录，跳过加载通知');
      return;
    }
    
    const userObj = JSON.parse(currentUser);
    if (!userObj.isLoggedIn) {
      console.log('用户未登录，跳过加载通知');
      return;
    }
    
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      notifications.value = JSON.parse(savedNotifications).map(n => ({
        ...n,
        time: new Date(n.time)
      }));
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// 处理表单提交成功
const handleFormSubmitted = (data) => {
  toastService.success('Form submitted successfully!', {
    duration: 4000
  })
  
  addNotification({
    title: 'Form Submitted',
    message: 'FORM SUBMISSION SUCCESSFUL',
    time: new Date(),
    read: false
  })
}

// 处理表单保存成功
const handleFormSaved = (data) => {
  toastService.success('Form saved as draft successfully!', {
    duration: 4000
  })
  
  addNotification({
    title: 'Form Saved',
    message: 'FORM SAVED AS DRAFT',
    time: new Date(),
    read: false
  })
}

// 处理表单错误
const handleFormError = (error) => {
  toastService.error(`Form error: ${error}`, {
    duration: 5000
  })
  
  addNotification({
    title: 'Form Error',
    message: 'FORM SUBMISSION FAILED',
    time: new Date(),
    read: false
  })
}

const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInHours = Math.floor((now - time) / (1000 * 60 * 60))
  
  if (diffInHours < 24) {
    return diffInHours === 0 ? 'Just now' : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInHours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

// 向全局暴露通知API
provide('notifications', {
  addNotification: (notification) => {
    // Prevent adding form-related notifications for admin users
    const formRelatedTitles = ['Saved Forms', 'Form Submitted', 'Form Saved', 'Form Error'];
    if (isAdmin.value && formRelatedTitles.includes(notification.title)) {
      console.log(`Admin user, skipping form-related notification via global API: "${notification.title}"`);
      return;
    }
    
    // 获取当前用户ID
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
      console.log('用户未登录，跳过添加通知');
      return;
    }
    
    const userObj = JSON.parse(currentUser);
    if (!userObj.isLoggedIn) {
      console.log('用户未登录，跳过添加通知');
      return;
    }
    
    // 设置用户ID
    const userId = userObj.email || 'anonymous';
    
    // 确保通知包含用户ID
    const notificationWithUser = { 
      ...notification,
      userId: notification.userId || userId
    };
    
    notifications.value.unshift(notificationWithUser);
    // 最多保留每个用户20条通知
    const userNotifications = notifications.value.filter(n => n.userId === userId);
    if (userNotifications.length > 20) {
      // 找到要移除的通知索引
      const toRemove = notifications.value.findIndex(
        (n, idx) => n.userId === userId && idx >= 20
      );
      if (toRemove >= 0) {
        notifications.value.splice(toRemove, 1);
      }
    }
    saveNotifications();
  },
  notifications: notifications,
  unreadNotifications: unreadNotifications,
  saveNotifications: () => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications.value));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  },
  markAsRead: (index) => {
    if (index >= 0 && index < notifications.value.length) {
      notifications.value[index].read = true;
      saveNotifications();
    }
  },
  filterUserNotifications: filterUserNotifications,
  clearAllNotifications: clearAllNotifications // 添加清除方法到API
})
</script>


<style>
:root {
  --bg-base: #E5E5E5;
  --bg-card: #E1E1E1;
  --text-main: #444;
  --text-subtle: #666;
  --primary: #1F3A93;
  --primary-hover: #142c70;
  --slected-box-shadow: 5px 5px 12px rgba(31, 58, 147, 0.5);
  --box-shadow: 5px 5px 10px rgba(108, 108, 108, 0.7);
  --slected-bt: 5px 5px 10px rgba(31, 58, 147, 0.5);
  --slider-shadow: 2px 2px 10px rgba(0, 0, 0, 0.7);
  --slider-text: rgb(255, 246, 234);
  --menu: rgba(31, 58, 147, 0.1);
  --text-color: rgba(68, 68, 68, 0.15);
}

html, body {
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-family: 'Poppins', 'PingFang SC', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-base);
  color: var(--text-main);
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 导航栏基础样式 */
.navbar {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: #E5E5E5;
  z-index: 100;
  position: relative;
}

/* 菜单容器 */
.menu-container {
  position: relative;
  z-index: 1000;
}

/* 菜单按钮 */
.menu-btn {
  font-size: 1.5rem;
  background: none;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  padding: 10px 16px;
  transition: transform 0.3s ease;
  z-index: 1001;
  position: relative;
}

.menu-btn:hover {
  transform: scale(1.1);
}

/* 菜单内容 - PC端水平显示，移动端垂直显示 */
.menu-content {
  position: absolute;
  background-color: #E1E1E1;
  border-radius: 10px;
  box-shadow: var(--box-shadow);
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  z-index: 1000;
  
  /* PC端默认为水平布局，隐藏在一侧 */
  display: flex;
  flex-direction: row;
  padding: 0;
  
  /* 默认状态（隐藏） */
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
}

/* 菜单打开状态 */
.menu-content.menu-open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* 菜单项 */
.menu-item {
  padding: 12px 20px;
  text-decoration: none;
  color: var(--text-main);
  font-size: 1.1rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-align: center;
}

.menu-item:hover {
  background-color: #1F3A93;
  color: white;
}

.admin-item {
  color: #1F3A93;
  background-color: rgba(31, 58, 147, 0.1);
  font-weight: 600;
  border-left: 3px solid #1F3A93;
}

.admin-item:hover {
  border-left: 3px solid white;
}

/* 菜单覆盖层，点击时关闭菜单 */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 媒体查询 - 响应式设计 */
@media (max-width: 768px) {
  /* 移动端菜单样式 */
  .menu-content {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 250px;
    flex-direction: column;
    border-radius: 0;
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2);
    transform: translateX(-100%);
    padding-top: 20px; /* 减少顶部填充 */
  }
  
  .menu-content.menu-open {
    transform: translateX(0);
  }
  
  .menu-item {
    width: 100%;
    text-align: left;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 15px 20px;
  }
  
  /* 移动端菜单中的标题样式调整 */
  .user-header,
  .admin-header {
    margin-top: 50px;
  }
}

/* 用户菜单部分 */
.user-section {
  display: flex;
  flex-direction: column;
  background-color: rgba(76, 175, 80, 0.05);
  border-radius: 0;
  margin: 0;
  overflow: hidden;
  min-width: 200px;
}

.user-header {
  background-color: #4CAF50;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  padding: 10px 15px;
  letter-spacing: 1px;
}

.user-header small {
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.9;
}

/* 管理员菜单部分 */
.admin-section {
  display: flex;
  flex-direction: column;
  background-color: rgba(31, 58, 147, 0.05);
  border-radius: 0;
  margin: 0;
  overflow: hidden;
  min-width: 200px;
}

.admin-header {
  background-color: #1F3A93;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  padding: 10px 15px;
  letter-spacing: 1px;
}

.admin-header small {
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.9;
}

.admin-item {
  color: #1F3A93;
  background-color: transparent;
  font-weight: 500;
  border-left: 3px solid #1F3A93;
  font-size: 1rem;
  padding: 10px 15px;
}

.admin-item:hover {
  background-color: rgba(31, 58, 147, 0.2);
  color: #1F3A93;
  border-left: 3px solid #1F3A93;
}

/* 登出按钮项 */
.logout-item {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: auto;
  color: #e74c3c;
  font-weight: 500;
  cursor: pointer;
}

.logout-item:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #c0392b;
}

/* 提醒事项样式 */
.notification-container {
  position: relative;
  z-index: 1000;
}

.notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1001;
}

.notification-btn:hover {
  transform: scale(1.1);
}

.notification-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* 通知悬停预览样式 */
.notification-preview {
  position: absolute;
  right: 0;
  top: 100%;
  width: 280px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1002;
}

.preview-header {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.preview-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.preview-list {
  max-height: 250px;
  overflow-y: auto;
}

.preview-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
}

.preview-item:hover {
  background-color: #f7f7f7;
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 3px;
}

.preview-time {
  font-size: 11px;
  color: #888;
}

.preview-footer {
  padding: 8px 12px;
  text-align: center;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.preview-footer span {
  font-size: 12px;
  color: #1F3A93;
  cursor: pointer;
}

.preview-footer span:hover {
  text-decoration: underline;
}

/* 媒体查询 - 响应式 */
@media (max-width: 768px) {
  .notification-preview {
    width: 250px;
    right: -10px;
  }
}
</style>