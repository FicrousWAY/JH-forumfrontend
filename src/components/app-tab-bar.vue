<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'home', label: '发现', icon: '🏠', to: { name: 'home' as const } },
  { name: 'sections', label: '板块', icon: '📋', to: { name: 'sections' as const } },
  { name: 'messages', label: '消息', icon: '💬', to: { name: 'messages' as const } },
  { name: 'me', label: '我的', icon: '👤', to: { name: 'me' as const } },
]

const active = computed(() => {
  const n = route.name as string
  if (n === 'home' || n === 'post-detail' || n === 'compose') return 'home'
  if (n === 'sections') return 'sections'
  if (n === 'messages') return 'messages'
  if (n === 'me' || n === 'agent' || n === 'admin') return 'me'
  return ''
})
</script>

<template>
  <nav class="app-tab-bar">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      class="app-tab-bar__item"
      :class="{ active: active === tab.name }"
      :to="tab.to"
    >
      <span class="app-tab-bar__icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>
