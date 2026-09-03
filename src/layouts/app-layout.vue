<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import AppTabBar from '@/components/app-tab-bar.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const sidebarWidth = ref(220)
const dragging = ref(false)

const collapsed = computed(() => sidebarWidth.value < 120)

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    home: '发现',
    compose: '发布帖子',
    'post-detail': '帖子详情',
    agent: 'Agent 助手',
    admin: '管理端',
    sections: '板块',
    messages: '消息',
    me: '我的',
  }
  return map[route.name as string] || '精弘论坛'
})

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
          <span v-if="!collapsed">发现</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'compose' }" :to="{ name: 'compose' }">
          <el-icon><EditPen /></el-icon>
          <span v-if="!collapsed">发布帖子</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'agent' }" :to="{ name: 'agent' }">
          <el-icon><ChatDotRound /></el-icon>
          <span v-if="!collapsed">Agent 助手</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'sections' }" :to="{ name: 'sections' }">
          <el-icon><Grid /></el-icon>
          <span v-if="!collapsed">板块</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'messages' }" :to="{ name: 'messages' }">
          <el-icon><Bell /></el-icon>
          <span v-if="!collapsed">消息</span>
        </RouterLink>
        <RouterLink class="nav-item" :class="{ active: route.name === 'me' }" :to="{ name: 'me' }">
          <el-icon><User /></el-icon>
          <span v-if="!collapsed">我的</span>
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
          <strong>{{ pageTitle }}</strong>
          <span class="muted desktop-only"> · {{ auth.user?.name || '未登录' }}</span>
        </div>
        <div class="row">
          <el-button class="mobile-only" size="small" type="primary" @click="router.push({ name: 'compose' })">
            发布
          </el-button>
          <el-button type="danger" plain size="small" @click="logout">退出</el-button>
        </div>
      </div>
      <div class="page-content">
        <RouterView />
      </div>
    </section>

    <AppTabBar />
  </div>
</template>

<style scoped>
.desktop-only {
  display: inline;
}
.mobile-only {
  display: none;
}
@media (max-width: 860px) {
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: inline-flex;
  }
}
</style>
