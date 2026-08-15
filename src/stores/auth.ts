import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types'

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
