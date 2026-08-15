<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const sidebarWidth = ref(260)
const dragging = ref(false)

const collapsed = computed(() => sidebarWidth.value < 120)

function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return
  sidebarWidth.value = Math.min(380, Math.max(72, e.clientX))
}

function stopDrag() {
  dragging.value = false
}

function startDrag() {
  dragging.value = true
}

async function logout() {
  try {
    await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' })
    auth.logout()
    router.push({ name: 'login' })
  } catch {
    // cancelled
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div class="app-shell" :class="{ collapsed }" :style="{ '--sidebar-width': `${sidebarWidth}px` }">
    <aside class="sidebar">
      <div class="brand">{{ collapsed ? 'JH' : '精弘论坛' }}</div>
      <nav class="nav-list">
        <RouterLink class="nav-item" :class="{ active: route.name === 'home' }" :to="{ name: 'home' }">
          <el-icon><House /></el-icon>
          <span v-if="!collapsed">帖子广场</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'compose' }" :to="{ name: 'compose' }">
          <el-icon><EditPen /></el-icon>
          <span v-if="!collapsed">发布帖子</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'agent' }" :to="{ name: 'agent' }">
          <el-icon><ChatDotRound /></el-icon>
          <span v-if="!collapsed">Agent 助手</span>
        </RouterLink>
        <RouterLink
          v-if="auth.isAdmin"
          class="nav-item"
          :class="{ active: route.name === 'admin' }"
          :to="{ name: 'admin' }"
        >
          <el-icon><Setting /></el-icon>
          <span v-if="!collapsed">管理端</span>
        </RouterLink>
      </nav>
      <div style="margin-top: auto" class="muted" v-if="!collapsed">
        {{ auth.user?.name }}（{{ auth.user?.role }}）
      </div>
      <div class="resize-handle" @mousedown.prevent="startDrag" />
    </aside>

    <section class="main-area">
      <div class="topbar">
        <div>
          <strong>{{ auth.user?.name || '未登录' }}</strong>
          <span class="muted"> · {{ auth.user?.username }}</span>
        </div>
        <el-button type="danger" plain @click="logout">退出</el-button>
      </div>
      <RouterView />
    </section>
  </div>
</template>
