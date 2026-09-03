<script setup lang="ts">
import { computed } from 'vue'
import type { CommentItem } from '@/types'

const props = defineProps<{
  comment: CommentItem
}>()

const avatarChar = computed(() => (props.comment.author.name || '?').charAt(0))
const timeText = computed(() => new Date(props.comment.created_at).toLocaleString())
</script>

<template>
  <div class="jh-reply">
    <div class="jh-reply__header">
      <div class="jh-avatar">{{ avatarChar }}</div>
      <div class="jh-reply__meta">
        <span class="jh-reply__name">{{ comment.author.name }}</span>
        <span class="jh-reply__time">{{ timeText }}</span>
      </div>
    </div>
    <p class="jh-reply__body">{{ comment.content }}</p>
  </div>
</template>

<style scoped>
.jh-reply {
  background: #ffffff;
  padding: 16px;
  margin-bottom: 6px;
}

.jh-reply__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.jh-reply__meta {
  display: flex;
  flex-direction: column;
}

.jh-reply__name {
  font-size: 13px;
  line-height: 18px;
}

.jh-reply__time {
  color: #a9a9a9;
  font-size: 10px;
}

.jh-reply__body {
  margin: 0 0 0 10px;
  font-size: 13px;
  line-height: 20px;
  white-space: pre-wrap;
  color: #333;
}
</style>
