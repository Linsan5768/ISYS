<template>
  <div class="notification-history-container">
    <div class="notification-history-card">
      <div class="back-arrow" @click="$router.go(-1)">
        <span class="arrow-icon">←</span>
      </div>
      
      <h2 class="history-title">Notification History</h2>
      
      <div class="notification-filter">
        <div class="notification-preference">
          <span class="preference-label">Notification Settings: </span>
          <div class="toggle-group">
            <button :class="['toggle-btn', { 'active': notificationPreference === 'on' }]" @click="notificationPreference = 'on'">On</button>
            <button :class="['toggle-btn', { 'active': notificationPreference === 'off' }]" @click="notificationPreference = 'off'">Off</button>
          </div>
        </div>
        
        <div class="notification-type-filter">
          <span class="filter-label">Email Notifications:</span>
          <input type="checkbox" v-model="emailFilter" />
        </div>
      </div>
      
      <div class="notification-actions">
        <button v-if="notificationsList.some(n => n.read)" @click="clearReadNotifications" class="action-button read-button">Clear Read</button>
        <button @click="clearAllNotifications" class="action-button clear-all-button">Clear All</button>
      </div>
      
      <div class="notification-table">
        <div class="table-header">
          <div class="header-cell">Date</div>
          <div class="header-cell">Notification</div>
          <div class="header-cell">Actions</div>
        </div>
        
        <div v-for="(notification, index) in notificationsList" :key="index" 
             class="table-row" 
             :class="{'read-row': notification.read, 'admin-row': notification.isAdminNotification}">
          <div class="cell date-cell">{{ formatDate(notification.time) }}</div>
          <div class="cell description-cell">
            <span v-if="notification.isAdminNotification" class="admin-tag">Admin</span>
            {{ notification.message }}
          </div>
          <div class="cell action-cell">
            <button class="read-btn" :class="{ 'read': notification.read }" @click="markAsRead(index)">
              {{ notification.read ? 'Read' : 'Mark Read' }}
            </button>
            
            <!-- Admin notification has View Issues button -->
            <button v-if="notification.isAdminNotification" 
                    class="view-issues-btn"
                    @click="navigateToIssues(notification.issuesLink || '/issues')">
              View Issues
            </button>
          </div>
        </div>
        
        <div v-if="notificationsList.length === 0" class="empty-state">
          <p>No notifications yet</p>
          <p class="empty-state-help">Notifications about tax due dates and form submissions will appear here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 通知首选项状态
const notificationPreference = ref('on')
const emailFilter = ref(true)

// 获取全局通知服务
const notificationsService = inject('notifications')

// 获取通知列表
const notificationsList = computed(() => {
  if (notificationsService && notificationsService.notifications) {
    console.log('Notification service data type:', typeof notificationsService.notifications);
    console.log('Notification list:', notificationsService.notifications);
    
    // 获取当前用户ID
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
      console.log('User not logged in, not showing notifications');
      return [];
    }
    
    const userObj = JSON.parse(currentUser);
    if (!userObj.isLoggedIn) {
      console.log('User not logged in, not showing notifications');
      return [];
    }
    
    // 使用服务中的筛选方法，获取当前用户的通知
    if (notificationsService.filterUserNotifications) {
      // 检查是否是ref对象
      if (notificationsService.notifications.value) {
        return notificationsService.filterUserNotifications(notificationsService.notifications.value);
      }
      
      // 否则尝试直接使用对象
      return notificationsService.filterUserNotifications(notificationsService.notifications);
    }
    
    // 自行筛选用户通知（如果通知服务没有提供筛选方法）
    const userId = userObj.email || 'anonymous';
    let allNotifications = [];
    
    // 检查是否是ref对象
    if (notificationsService.notifications.value) {
      allNotifications = notificationsService.notifications.value || [];
    } else {
      // 否则尝试直接使用对象
      allNotifications = Array.isArray(notificationsService.notifications) ? 
        notificationsService.notifications : [];
    }
    
    // 筛选当前用户的通知
    return allNotifications.filter(notification => 
      !notification.userId || notification.userId === userId
    );
  }
  
  // 尝试直接从localStorage获取通知
  try {
    // 检查用户是否登录
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
      console.log('User not logged in, not showing notifications');
      return [];
    }
    
    const userObj = JSON.parse(currentUser);
    if (!userObj.isLoggedIn) {
      console.log('User not logged in, not showing notifications');
      return [];
    }
    
    const userId = userObj.email || 'anonymous';
    
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications);
      if (Array.isArray(parsedNotifications)) {
        // 筛选当前用户的通知并格式化日期
        return parsedNotifications
          .filter(notification => !notification.userId || notification.userId === userId)
          .map(n => ({
            ...n,
            time: new Date(n.time) // 确保time是Date对象
          }));
      }
    }
  } catch (error) {
    console.error('Unable to get notifications from localStorage:', error);
  }
  
  return [];
})

// 标记通知为已读
const markAsRead = (index) => {
  if (index < 0 || index >= notificationsList.value.length) {
    console.error('Invalid notification index:', index);
    return;
  }
  
  // 如果通知服务有markAsRead方法，使用它
  if (notificationsService && typeof notificationsService.markAsRead === 'function') {
    notificationsService.markAsRead(index);
    return;
  }
  
  // 否则直接修改通知并保存
  if (notificationsService && notificationsService.notifications) {
    // 检查是否是ref对象
    if (notificationsService.notifications.value) {
      notificationsService.notifications.value[index].read = true;
      
      // 保存更新后的通知
      if (typeof notificationsService.saveNotifications === 'function') {
        notificationsService.saveNotifications();
      } else {
        saveNotificationsToLocalStorage();
      }
    } else if (Array.isArray(notificationsService.notifications)) {
      notificationsService.notifications[index].read = true;
      saveNotificationsToLocalStorage();
    }
  } else {
    // 直接更新本地计算属性
    const notification = notificationsList.value[index];
    if (notification) {
      notification.read = true;
      saveNotificationsToLocalStorage();
    }
  }
}

// 导航到问题页面
const navigateToIssues = (path) => {
  router.push(path);
}

// 本地保存通知到localStorage
const saveNotificationsToLocalStorage = () => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notificationsList.value));
  } catch (error) {
    console.error('Error saving notifications to localStorage:', error);
  }
}

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return 'Invalid date'
    }
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

// 清除所有已读通知
const clearReadNotifications = () => {
  if (notificationsService && notificationsService.notifications) {
    notificationsService.notifications.value = notificationsService.notifications.value.filter(
      notification => !notification.read
    )
    
    // 保存更新后的通知列表
    try {
      localStorage.setItem('notifications', JSON.stringify(notificationsService.notifications.value))
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }
}

// 清除所有通知
const clearAllNotifications = () => {
  // 如果通知服务有clearAllNotifications方法，使用它
  if (notificationsService && typeof notificationsService.clearAllNotifications === 'function') {
    notificationsService.clearAllNotifications();
    return;
  }
  
  // 否则自行清除
  try {
    // 清除所有通知
    if (notificationsService && notificationsService.notifications) {
      if (notificationsService.notifications.value) {
        notificationsService.notifications.value = [];
      } else if (Array.isArray(notificationsService.notifications)) {
        notificationsService.notifications.length = 0;
      }
    }
    
    // 清除localStorage中的通知
    localStorage.removeItem('notifications');
    
    // 清除所有提醒记录
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sentLiabilityReminders_') || 
          key.startsWith('sentDashboardReminders_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('All notifications and reminders cleared');
    
    // 保存更改
    if (notificationsService && typeof notificationsService.saveNotifications === 'function') {
      notificationsService.saveNotifications();
    }
  } catch (error) {
    console.error('Error clearing notification data:', error);
  }
}

// 在组件挂载时加载通知数据
onMounted(() => {
  console.log('NotificationHistory mounted, notifications:', notificationsList.value)
})
</script>

<style scoped>
.notification-history-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #E5E5E5;
}

.notification-history-card {
  position: relative;
  background-color: #E1E1E1;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  height: 500px;
  min-height: 500px;
  padding: 20px;
  overflow-y: auto;
}

.back-arrow {
  position: absolute;
  top: 15px;
  left: 15px;
  cursor: pointer;
  font-size: 20px;
  color: #333;
}

.history-title {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
}

.notification-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 10px;
}

.notification-preference {
  display: flex;
  align-items: center;
}

.preference-label {
  font-size: 12px;
  margin-right: 8px;
  color: #555;
}

.toggle-group {
  display: flex;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.toggle-btn {
  padding: 4px 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
}

.toggle-btn.active {
  background-color: #1F3A93;
  color: white;
}

.notification-type-filter {
  display: flex;
  align-items: center;
}

.filter-label {
  font-size: 12px;
  margin-right: 8px;
  color: #555;
}

.notification-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  gap: 10px;
}

.action-button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.read-button {
  background-color: #3498db;
}

.read-button:hover {
  background-color: #2980b9;
}

.clear-all-button {
  background-color: #e74c3c;
}

.clear-all-button:hover {
  background-color: #c0392b;
}

.notification-table {
  background-color: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
  font-weight: bold;
  font-size: 12px;
  color: #333;
}

.header-cell {
  padding: 10px;
  flex: 1;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #eee;
  align-items: center;
  font-size: 12px;
}

.read-row {
  background-color: #f9f9f9;
  color: #777;
}

.cell {
  padding: 10px;
  flex: 1;
}

.date-cell {
  min-width: 80px;
}

.description-cell {
  flex: 2;
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.read-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 10px;
  cursor: pointer;
}

.read-btn.read {
  background-color: #95a5a6;
}

.view-issues-btn {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 10px;
  cursor: pointer;
}

.view-issues-btn:hover {
  background-color: #2980b9;
}

.empty-state {
  padding: 30px;
  text-align: center;
  color: #888;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: #f9f9f9;
  border-radius: 6px;
  margin-top: 10px;
}

.empty-state p {
  margin: 5px 0;
}

.empty-state-help {
  font-size: 14px;
  color: #aaa;
  max-width: 80%;
}

@media (max-width: 600px) {
  .notification-history-card {
    max-width: 100%;
    padding: 15px;
  }
  
  .notification-filter {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.admin-row {
  background-color: rgba(31, 58, 147, 0.05);
  border-left: 3px solid #1F3A93;
}

.admin-tag {
  background-color: #1F3A93;
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  margin-right: 8px;
  display: inline-block;
}
</style> 