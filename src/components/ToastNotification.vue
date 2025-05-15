<template>
  <transition name="toast-fade">
    <div 
      v-if="show" 
      class="toast-container"
      :class="[`toast-${type}`, position]"
    >
      <div class="toast-icon" v-if="icon">
        {{ icon }}
      </div>
      <div class="toast-content">
        <div class="toast-title" v-if="title">{{ title }}</div>
        <div class="toast-message">{{ message }}</div>
      </div>
      <div class="toast-close" @click="close" v-if="showClose">×</div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'].includes(value)
  },
  showClose: {
    type: Boolean,
    default: true
  },
  onClose: {
    type: Function,
    default: () => {}
  }
});

const show = ref(true);
let timer = null;

// Icon based on type
const icon = computed(() => {
  switch (props.type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return '';
  }
});

// Close the toast
const close = () => {
  show.value = false;
  if (timer) clearTimeout(timer);
  props.onClose();
};

// Auto close after duration
onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
});

// Clean up
onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  display: flex;
  align-items: center;
  min-width: 250px;
  max-width: 350px;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  z-index: 9999;
  margin: 10px;
  animation: toast-in 0.3s ease-out;
}

/* Positions */
.top-right {
  top: 20px;
  right: 20px;
}

.top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.top-left {
  top: 20px;
  left: 20px;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
}

.bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.bottom-left {
  bottom: 20px;
  left: 20px;
}

/* Types */
.toast-success {
  background-color: rgba(87, 217, 163, 0.95);
  color: white;
}

.toast-error {
  background-color: rgba(255, 76, 81, 0.95);
  color: white;
}

.toast-info {
  background-color: rgba(85, 171, 255, 0.95);
  color: white;
}

.toast-warning {
  background-color: rgba(255, 183, 77, 0.95);
  color: white;
}

.toast-icon {
  font-size: 18px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
}

.toast-message {
  font-size: 13px;
  line-height: 1.4;
}

.toast-close {
  margin-left: 10px;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 
 
 
 
 