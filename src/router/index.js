import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue' // 或你自定义的主页组件
import AddRecord from '../components/AddRecord.vue'
import Statistics from '../components/Statistics.vue'
import LoginPage from '../components/LoginPage.vue'
import SignUpPage from '../components/SignUpPage.vue'
import FormHistory from '../components/FormHistory.vue'
import AdminDashboard from '../components/AdminDashboard.vue'
import NotificationHistory from '@/components/NotificationHistory.vue'

// 确定正确的基础路径
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction ? '/pages/ISYS2110-2025-S1/CC04-05/' : '/';

const routes = [
  // Default route - redirect to login if not authenticated, home if authenticated
  { 
    path: '/', 
    name: 'Root',
    redirect: () => {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const isAuthenticated = user && user.isLoggedIn
      
      return isAuthenticated ? { name: 'HomePage' } : { name: 'Login' }
    }
  },
  { 
    path: '/login', 
    name: 'Login', 
    component: LoginPage 
  },
  { 
    path: '/signup', 
    name: 'SignUp', 
    component: SignUpPage 
  },
  { 
    path: '/home', 
    name: 'HomePage', 
    component: HomePage,
    meta: { requiresAuth: true }
  },
  { 
    path: '/add', 
    name: 'AddRecord', 
    component: AddRecord,
    meta: { requiresAuth: true }
  },
  { 
    path: '/statistics', 
    name: 'StatisticsPage', 
    component: Statistics,
    meta: { requiresAuth: true }
  },
  // 新增路由配置
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: () => import('../components/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  { 
    path: '/issues', 
    name: 'Issues', 
    component: () => import('../components/Issues.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // 表单历史和查看表单路由
  {
    path: '/form-history',
    name: 'FormHistory',
    component: FormHistory,
    meta: { requiresAuth: true }
  },
  {
    path: '/view-form',
    name: 'ViewForm',
    component: AddRecord,
    props: (route) => {
      console.log('ViewForm路由参数:', route.query);
      return { 
        viewMode: true, 
        formId: route.query.id,
        mode: route.query.mode || 'view'
      };
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../components/AdminUsers.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('../components/AdminSettings.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/notifications',
    name: 'NotificationHistory',
    component: NotificationHistory,
    meta: { requiresAuth: true }
  },
  // Catch-all / 404 route - redirect to login
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'Login' }
  }
]

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes
})

// 添加路由守卫，检查管理员权限
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAuthenticated = user && user.isLoggedIn
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'Login' })
      return
    }
    
    // 检查是否需要管理员权限
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (user.role !== 'admin') {
        console.warn(`用户 ${user.email} 尝试访问管理员页面但没有权限`)
        // 显示提示消息
        alert('您没有访问管理员页面的权限')
        // 如果不是管理员，重定向到主页
        next({ name: 'HomePage' }) 
        return
      }
    }
  }
  
  next()
})

export default router