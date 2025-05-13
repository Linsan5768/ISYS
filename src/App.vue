<template>
  <div id="app">
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
              <router-link class="menu-item admin-item" to="/admin/dashboard" @click="closeMenu">Audit Logs</router-link>
              <router-link class="menu-item admin-item" to="/admin/users" @click="closeMenu">User Management</router-link>
              <router-link class="menu-item admin-item" to="/admin/settings" @click="closeMenu">System Settings</router-link>
              <div class="menu-item admin-item logout-item" @click="handleLogout">Logout</div>
            </div>
          </template>
        </div>
        <!-- 移动端覆盖层 -->
        <div class="menu-overlay" v-if="isMenuOpen" @click="closeMenu"></div>
      </div>
    </nav>

    <!-- 路由页面 -->
    <router-view />
    
    <!-- 用户信息页脚 -->
    <UserInfoFooter />
    
    <!-- 会话超时警告 -->
    <InactivityWarning 
      ref="inactivityWarning"
      :warning-time="30"
      @extend="resetInactivityTimer"
      @timeout="handleLogout"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from './composables/useAuth'
import UserInfoFooter from './components/UserInfoFooter.vue'
import InactivityWarning from './components/InactivityWarning.vue'

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
  if (isAuthenticated) {
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
})

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
</style>