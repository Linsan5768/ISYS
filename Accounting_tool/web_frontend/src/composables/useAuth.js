import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'

// Create a reactive state that will be shared across all component instances
const currentUser = ref(null)
const isAuthenticated = computed(() => !!currentUser.value)
const isAdmin = computed(() => currentUser.value && currentUser.value.role === 'admin')

// Check localStorage on startup
try {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  }
} catch (error) {
  console.error('Error parsing stored user data:', error)
  localStorage.removeItem('user')
}

export function useAuth() {
  const router = useRouter()
  
  // Login function
  const login = (userData) => {
    // Ensure we capture the role if it exists
    if (!userData.role) {
      // Try to get role from API if not provided
      fetchUserRole(userData)
    }
    
    currentUser.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }
  
  // Fetch user role if not provided
  const fetchUserRole = async (userData) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user && data.user.role) {
          userData.role = data.user.role
          currentUser.value = userData
          localStorage.setItem('user', JSON.stringify(userData))
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }
  
  // Logout function
  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('user')
    router.push('/login')
  }
  
  // Check if user has valid token
  const checkAuth = async () => {
    if (!currentUser.value || !currentUser.value.token) {
      return false
    }
    
    try {
      // Call the verify endpoint
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.value.token}`
        }
      })
      
      if (!response.ok) {
        logout()
        return false
      }
      
      // Update user info if needed
      const data = await response.json()
      if (data.success && data.user) {
        if (!currentUser.value.role && data.user.role) {
          currentUser.value.role = data.user.role
          localStorage.setItem('user', JSON.stringify(currentUser.value))
        }
      }
      
      // User is authenticated
      return true
    } catch (error) {
      console.error('Auth verification error:', error)
      logout()
      return false
    }
  }
  
  return {
    user: readonly(currentUser),
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkAuth
  }
}

export default useAuth 