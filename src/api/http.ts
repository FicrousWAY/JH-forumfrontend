import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { ApiResponse } from '@/types'

const http = axios.create({
  baseURL: '/api/v1', // 相对路径，本地走 Vite 代理，生产走 Netlify / Nginx 反代
  timeout: 20000,
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

http.interceptors.response.use(
  (resp) => {
    const body = resp.data as ApiResponse<unknown>
    if (body && typeof body.code === 'number' && body.code !== 0) {
      ElMessage.error(body.msg || '请求失败')
      return Promise.reject(body)
    }
    return resp
  },
  (error) => {
    const status = error?.response?.status
    const msg = error?.response?.data?.msg || error.message || '网络异常'
    if (status === 401) {
      const auth = useAuthStore()
      auth.logout() // JWT 失效：清空本地登录态并跳转登录
      ElMessage.warning('登录已失效，请重新登录')
      router.push({ name: 'login' })
    } else if (status === 403) {
      ElMessage.error(msg || '没有权限')
    } else if (status === 404) {
      ElMessage.error(msg || '资源不存在')
    } else if (status === 409) {
      ElMessage.error(msg || '资源冲突')
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

export default http
