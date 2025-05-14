<template>
  <div v-if="showWarning" class="inactivity-warning">
    <div class="warning-dialog">
      <h3>Session Timeout Warning</h3>
      <p>Your session will expire in {{ remainingTime }} seconds due to inactivity.</p>
      <div class="warning-actions">
        <button @click="extendSession" class="extend-btn">Stay Logged In</button>
        <button @click="logoutNow" class="logout-btn">Logout Now</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, defineProps, defineEmits, defineExpose } from 'vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  warningTime: {
    type: Number,
    default: 60 // 默认在超时前60秒显示警告
  },
  onExtend: Function,
  onTimeout: Function
})

const emit = defineEmits(['extend', 'timeout'])

const { logout } = useAuth()
const showWarning = ref(false)
const remainingTime = ref(props.warningTime)
let countdownTimer = null

// 显示警告
const showTimeoutWarning = () => {
  showWarning.value = true
  remainingTime.value = props.warningTime
  startCountdown()
}

// 开始倒计时
const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  
  countdownTimer = setInterval(() => {
    remainingTime.value -= 1
    
    if (remainingTime.value <= 0) {
      clearInterval(countdownTimer)
      handleTimeout()
    }
  }, 1000)
}

// 延长会话
const extendSession = () => {
  showWarning.value = false
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  if (props.onExtend) {
    props.onExtend()
  }
  emit('extend')
}

// 处理超时
const handleTimeout = () => {
  showWarning.value = false
  if (props.onTimeout) {
    props.onTimeout()
  } else {
    logout()
  }
  emit('timeout')
}

// 直接登出
const logoutNow = () => {
  showWarning.value = false
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  emit('timeout')
}

// 公开方法给父组件调用
defineExpose({
  showTimeoutWarning
})

// 组件卸载时清除计时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.inactivity-warning {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.warning-dialog {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
  width: 400px;
  max-width: 90%;
}

h3 {
  color: #e74c3c;
  margin-top: 0;
  margin-bottom: 15px;
}

p {
  margin-bottom: 20px;
  color: #333;
}

.warning-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.extend-btn {
  background-color: #3498db;
  color: white;
}

.extend-btn:hover {
  background-color: #2980b9;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
}

.logout-btn:hover {
  background-color: #c0392b;
}
</style> 