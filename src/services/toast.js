import { ref } from 'vue'

let toastCounter = 0
const toasts = ref([]) // Reactive array of toasts
const listeners = new Set() // For subscribers to toast changes

const notifyListeners = () => {
  listeners.forEach(listener => listener(toasts.value))
}

const addToast = (options) => {
  const id = ++toastCounter
  const toast = {
    id,
    ...options,
    duration: options.duration === undefined ? 3000 : options.duration, // Default duration
    showClose: options.showClose === undefined ? true : options.showClose, // Default showClose
    onCloseInternal: () => { // Renamed to avoid conflict with user-provided onClose
      removeToast(id)
      if (options.onClose) {
        options.onClose()
      }
    }
  }
  toasts.value = [toast, ...toasts.value] // Add to the beginning for top stacking
  notifyListeners()

  if (toast.duration > 0) {
    setTimeout(() => {
      // Check if toast still exists before trying to remove
      if (toasts.value.some(t => t.id === id)) {
        removeToast(id)
      }
    }, toast.duration)
  }
  return id
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
  notifyListeners()
}

const clearAllToasts = () => {
  toasts.value = []
  notifyListeners()
}

// API for ToastWrapper to subscribe to changes
const subscribe = (listener) => {
  listeners.add(listener)
  listener(toasts.value) // Immediately notify with current toasts
  return () => listeners.delete(listener) // Return an unsubscribe function
}

const getActiveToasts = () => {
  return toasts.value
}

const toastService = {
  success(message, options = {}) {
    return addToast({ message, type: 'success', ...options })
  },
  error(message, options = {}) {
    return addToast({ message, type: 'error', ...options })
  },
  info(message, options = {}) {
    return addToast({ message, type: 'info', ...options })
  },
  warning(message, options = {}) {
    return addToast({ message, type: 'warning', ...options })
  },
  clearAll: clearAllToasts,
  remove: removeToast,      // Expose remove for ToastWrapper
  subscribe,              // Expose subscribe for ToastWrapper
  getActiveToasts         // Expose getActiveToasts for ToastWrapper initialization
}

export default toastService 
 
 
 
 