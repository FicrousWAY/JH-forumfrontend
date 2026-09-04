<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'

const auth = useAuthStore()
const postsStore = usePostsStore()
const router = useRouter()
const route = useRoute()
const mode = ref<'login' | 'register'>('login')
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const registerForm = reactive({
  username: '',
  name: '',
  password: '',
  role: 'student',
})

async function submitLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const { data } = await authApi.login(loginForm)
    auth.setAuth(data.data.access_token, data.data.user)
    postsStore.invalidate()
    void postsStore.fetchList({ force: true }) // 登录后预热列表缓存，缩短进入首页等待
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } finally {
    loading.value = false
  }
}

async function submitRegister() {
  if (!/^\d+$/.test(registerForm.username)) {
    ElMessage.warning('学号/工号只能由数字组成')
    return
  }
  if (registerForm.password.length < 8 || registerForm.password.length > 16) {
    ElMessage.warning('密码长度需为 8–16 位')
    return
  }
  loading.value = true
  try {
    await authApi.register(registerForm)
    ElMessage.success('注册成功，请登录')
    mode.value = 'login'
    loginForm.username = registerForm.username
    loginForm.password = registerForm.password
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">精弘论坛</h1>

      <el-tabs v-model="mode">
        <el-tab-pane label="登录" name="login">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="学号/工号">
              <el-input v-model="loginForm.username" placeholder="例如 20260001" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" show-password />
            </el-form-item>
            <el-button type="primary" style="width: 100%" :loading="loading" @click="submitLogin">
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="学号/工号">
              <el-input v-model="registerForm.username" placeholder="仅数字" />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="registerForm.name" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" show-password />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="registerForm.role" style="width: 100%">
                <el-option label="学生" value="student" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
            <el-button type="primary" style="width: 100%" :loading="loading" @click="submitRegister">
              注册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.auth-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
}
</style>
