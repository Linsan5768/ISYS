import { createApp, h } from 'vue'
import ToastNotification from '../components/ToastNotification.vue'

// Toast Counter for unique IDs
let toastCounter = 0

// Active toasts
const activeToasts = new Set()

const createToast = (options) => {
  const toastId = ++toastCounter
  const container = document.createElement('div')
  document.body.appendChild(container)

  const toastApp = createApp({
    render() {
      return h(ToastNotification, {
        ...options,
        onClose: () => {
          // Remove after animation completes
          setTimeout(() => {
            toastApp.unmount()
            container.remove()
            activeToasts.delete(toastId)
          }, 300)
        }
      })
    }
  })

  toastApp.mount(container)
  activeToasts.add(toastId)
  
  return toastId
}

// Clear all toasts
const clearAll = () => {
  document.querySelectorAll('.toast-container').forEach(el => {
    el.remove()
  })
  activeToasts.clear()
}

// Create different toast types
const toast = {
  success(message, options = {}) {
    return createToast({ message, type: 'success', ...options })
  },
  error(message, options = {}) {
    return createToast({ message, type: 'error', ...options })
  },
  info(message, options = {}) {
    return createToast({ message, type: 'info', ...options })
  },
  warning(message, options = {}) {
    return createToast({ message, type: 'warning', ...options })
  },
  clearAll
}

export default toast 
 
 
 