<template>
  <div v-if="isAuthenticated" class="user-info-footer">
    <div class="user-details">
      <div class="user-email">{{ user.email }}</div>
      <div class="user-role">{{ formatRole(user.role) }}</div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth.js'

const { user, isAuthenticated } = useAuth()

// Format role for display
const formatRole = (role) => {
  if (!role) return 'User'
  
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'individual':
      return 'Individual Taxpayer'
    case 'business':
      return 'Business Taxpayer'
    default:
      return role.charAt(0).toUpperCase() + role.slice(1)
  }
}
</script>

<style scoped>
.user-info-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  padding: 8px 12px;
  background-color: rgba(225, 225, 225, 0.8);
  border-top-right-radius: 8px;
  font-size: 12px;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-weight: 500;
  color: var(--text-main, #444);
}

.user-role {
  color: var(--text-subtle, #666);
  font-style: italic;
}

@media (max-width: 768px) {
  .user-info-footer {
    padding: 6px 10px;
    font-size: 10px;
  }
}
</style> 