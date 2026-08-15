import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login-view.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/app-layout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/post-list-view.vue') },
        { path: 'compose', name: 'compose', component: () => import('@/views/compose-view.vue') },
        { path: 'posts/:id', name: 'post-detail', component: () => import('@/views/post-detail-view.vue') },
        { path: 'agent', name: 'agent', component: () => import('@/views/agent-view.vue') },
        { path: 'admin', name: 'admin', component: () => import('@/views/admin-view.vue'), meta: { admin: true } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLogin) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.admin && !auth.isAdmin) {
    return { name: 'home' }
  }
  if (to.name === 'login' && auth.isLogin) {
    return { name: 'home' }
  }
})

export default router
