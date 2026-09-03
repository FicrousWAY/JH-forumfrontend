<script setup lang="ts">
import { computed } from 'vue'
import type { PostItem } from '@/types'

const props = defineProps<{
  post: PostItem
  liked?: boolean
}>()

const emit = defineEmits<{
  open: []
  like: []
}>()

const title = computed(() => {
  const lines = props.post.content.trim().split(/\r?\n/)
  return lines[0]?.slice(0, 40) || '无标题'
})

const excerpt = computed(() => {
  const text = props.post.content.trim()
  const firstLine = text.split(/\r?\n/)[0] || ''
  const rest = text.slice(firstLine.length).trim()
  return rest || text
})

const tagLabel = computed(() => {
  const role = props.post.author.role
  return role === 'admin' ? '管理' : '学生'
})

const avatarChar = computed(() => (props.post.author.name || '?').charAt(0))

const timeText = computed(() => new Date(props.post.created_at).toLocaleString())
</script>

<template>
  <article class="jh-card" @click="emit('open')">
    <div class="jh-card__header">
      <div class="jh-avatar">{{ avatarChar }}</div>
      <div class="jh-card__state">
        <span class="jh-card__state__name">{{ post.author.name }}</span>
        <span class="jh-card__state__time">{{ timeText }}</span>
      </div>
    </div>

    <div class="jh-card__context">
      <div class="jh-card__title">
        <span class="jh-tag">#{{ tagLabel }}</span>
        <span class="jh-card__title__text">{{ title }}</span>
      </div>
      <p class="jh-card__article">{{ excerpt }}</p>
    </div>

    <div class="jh-card__actions" @click.stop>
      <button class="jh-card__action" type="button" @click="emit('like')">
        {{ liked ? '已赞' : '点赞' }} {{ post.like_count }}
      </button>
      <button class="jh-card__action" type="button" @click="emit('open')">
        评论 {{ post.comment_count }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.jh-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 4px;
  margin-bottom: 4px;
  background-color: #ffffff;
  box-sizing: border-box;
  padding: 16px 14px 6px 14px;
  cursor: pointer;
}

.jh-card__header {
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.jh-card__state {
  display: flex;
  flex-direction: column;
}

.jh-card__state__name {
  font-size: 12px;
  line-height: 16px;
}

.jh-card__state__time {
  color: #a9a9a9;
  font-size: 9px;
  line-height: 12px;
}

.jh-card__context {
  display: flex;
  flex-direction: column;
  margin: 0 0 4px 10px;
  overflow: hidden;
}

.jh-card__title__text {
  font-size: 14px;
  line-height: 20px;
}

.jh-card__article {
  margin: 4px 0 0;
  color: #a9a9a9;
  font-size: 12px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
}

.jh-card__actions {
  display: flex;
  gap: 16px;
  margin: 4px 0 8px 10px;
}

.jh-card__action {
  border: none;
  background: transparent;
  color: #81b2e9;
  font-size: 12px;
  padding: 0;
  cursor: pointer;
}
</style>
