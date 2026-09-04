import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types'

/**
 * 登录态全局存储。persist: true 把 token 与 user 写入 localStorage，刷新后仍保持登录。
 * 请求拦截器从 token 注入 Authorization；401 时 logout 并跳转登录页。
 * 前端没有登出接口：退出只清空本地 JWT。
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref('')
    const user = ref<User | null>(null)

    const isLogin = computed(() => !!token.value)
    const isAdmin = computed(() => user.value?.role === 'admin')

    function setAuth(accessToken: string, nextUser: User) {
      token.value = accessToken
      user.value = nextUser
    }

    function logout() {
      token.value = ''
      user.value = null
    }

    return { token, user, isLogin, isAdmin, setAuth, logout }
  },
  {
    persist: true,
  },
)
