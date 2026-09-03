<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  try {
    await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' })
    auth.logout()
    router.push({ name: 'login' })
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div>
    <div class="panel me-profile">
      <div class="jh-avatar jh-avatar--large">{{ (auth.user?.name || '?').charAt(0) }}</div>
      <div>
        <div class="me-name">{{ auth.user?.name || '未登录' }}</div>
        <div class="muted">{{ auth.user?.username }} · {{ auth.user?.role }}</div>
      </div>
    </div>

    <div class="me-menu">
      <button class="me-menu__item" type="button" @click="router.push({ name: 'compose' })">
        发布帖子
      </button>
      <button class="me-menu__item" type="button" @click="router.push({ name: 'agent' })">
        Agent 助手
      </button>
      <button
        v-if="auth.isAdmin"
        class="me-menu__item"
        type="button"
        @click="router.push({ name: 'admin' })"
      >
        管理端
      </button>
      <button class="me-menu__item danger" type="button" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<style scoped>
.me-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.me-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.me-menu {
  background: #fff;
  margin-top: 6px;
}

.me-menu__item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  border-bottom: 1px solid #efeff4;
  background: #fff;
  padding: 14px 16px;
  font-size: 14px;
  cursor: pointer;
}

.me-menu__item:last-child {
  border-bottom: none;
}

.me-menu__item.danger {
  color: var(--danger);
}
</style>
