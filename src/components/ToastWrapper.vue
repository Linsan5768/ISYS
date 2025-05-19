<template>
  <div class="toast-wrapper" :class="[positionClass]">
    <transition-group name="toast-list" tag="div">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :title="toast.title"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        :show-close="toast.showClose !== undefined ? toast.showClose : true"
        @close="removeToast(toast.id)"
      />
    </transition-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import ToastNotification from './ToastNotification.vue';
import toastService from '../services/toast'; // We'll modify toastService to expose toasts array

const toasts = ref([]);
const position = ref('top-right'); // Default position, can be made a prop

const positionClass = computed(() => {
  // Convert position to a CSS class, e.g., 'top-right' -> 'wrapper-top-right'
  // This assumes ToastNotification.vue's position classes are for individual toasts
  // and we might need different ones for the wrapper.
  // For now, let's keep it simple and assume direct mapping or style directly.
  return position.value;
});

const removeToast = (id) => {
  toastService.remove(id); // We'll add this method to toastService
};

let unsubscribe;

onMounted(() => {
  // Subscribe to toast updates from the service
  unsubscribe = toastService.subscribe((newToasts) => {
    toasts.value = newToasts;
  });
  // Initialize with current toasts if any (though service might need change for this)
  toasts.value = toastService.getActiveToasts(); // We'll add this method
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px; /* Space between toasts */
}

/* Default position if not overridden by specific classes */
.toast-wrapper.top-right {
  top: 20px;
  right: 20px;
  align-items: flex-end; /* Toasts align to the right */
}
.toast-wrapper.top-left {
  top: 20px;
  left: 20px;
  align-items: flex-start;
}
.toast-wrapper.top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.toast-wrapper.bottom-right {
  bottom: 20px;
  right: 20px;
  align-items: flex-end;
}
.toast-wrapper.bottom-left {
  bottom: 20px;
  left: 20px;
  align-items: flex-start;
}
.toast-wrapper.bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

/* Transition for adding/removing toasts */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.5s ease;
}
.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(30px); /* Slide in from right, adjust as needed */
}
.toast-list-move {
  transition: transform 0.3s ease;
}
</style> 