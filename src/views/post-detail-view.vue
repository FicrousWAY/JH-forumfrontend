<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi } from '@/api'
import type { PostDetail } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import PostReplyCard from '@/components/post-reply-card.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const postsStore = usePostsStore()
const loading = ref(false)
const detail = ref<PostDetail | null>(null)
const liked = ref(false)
const comment = ref('')

const postId = computed(() => Number(route.params.id))

const title = computed(() => {
  if (!detail.value) return ''
  const lines = detail.value.content.trim().split(/\r?\n/)
  return lines[0]?.slice(0, 60) || '无标题'
})

const body = computed(() => {
  if (!detail.value) return ''
  const text = detail.value.content.trim()
  const lines = text.split(/\r?\n/)
  if (lines.length <= 1) return text
  return lines.slice(1).join('\n').trim() || text
})

const avatarChar = computed(() => (detail.value?.author.name || '?').charAt(0))

async function load() {
  if (!Number.isFinite(postId.value) || postId.value < 1) {
    ElMessage.error('非法帖子 ID')
    router.push({ name: 'home' })
    return
  }
  loading.value = true
  try {
    const { data } = await postApi.detail(postId.value)
    detail.value = data.data
    const status = await postApi.likeStatus([postId.value])
    liked.value = !!status.data.data.status.find((s) => s.post_id === postId.value)?.liked
  } finally {
    loading.value = false
  }
}

async function toggleLike() {
  if (!detail.value) return
  const { data } = await postApi.like(postId.value)
  liked.value = data.data.is_liked
  detail.value.like_count += data.data.is_liked ? 1 : -1
  if (detail.value.like_count < 0) detail.value.like_count = 0
}

async function submitComment() {
  const text = comment.value.trim()
  if (!text) {
    ElMessage.warning('评论不能为空')
    return
  }
  if (text.length > 1000) {
    ElMessage.warning('评论最多 1000 字')
    return
  }
  await postApi.comment(postId.value, text)
  ElMessage.success('评论成功')
  comment.value = ''
  await load()
}

async function removePost() {
  try {
    await ElMessageBox.confirm('确认删除该帖子及其评论吗？此操作不可恢复。', '管理删除', {
      type: 'warning',
    })
    await postApi.adminDelete(postId.value)
    postsStore.removePost(postId.value)
    ElMessage.success('已删除')
    router.push({ name: 'home' })
  } catch {
    // cancel
  }
}

onMounted(load)
</script>

<template>
  <div class="jh-post" v-loading="loading">
    <div class="back-row">
      <el-button text @click="router.push({ name: 'home' })">← 返回</el-button>
      <el-button v-if="auth.isAdmin && detail" type="danger" size="small" @click="removePost">
        删除
      </el-button>
    </div>

    <template v-if="detail">
      <div class="jh-post__body">
        <div class="jh-body__head">
          <div class="jh-avatar jh-avatar--large">{{ avatarChar }}</div>
          <div class="jh-body__head__name">{{ detail.author.name }}</div>
        </div>
        <div class="jh-body__title">{{ title }}</div>
        <div class="jh-body__content">{{ body }}</div>
        <div class="jh-body__meta muted">
          {{ new Date(detail.created_at).toLocaleString() }} · #{{ detail.id }}
        </div>
        <div class="jh-body__actions">
          <el-button size="small" :type="liked ? 'primary' : 'default'" @click="toggleLike">
            {{ liked ? '已赞' : '点赞' }} {{ detail.like_count }}
          </el-button>
          <span class="muted">评论 {{ detail.comment_count }}</span>
        </div>
      </div>

      <div class="jh-post__replies">
        <div v-if="!detail.comments.length" class="empty-state">还没有评论</div>
        <PostReplyCard v-for="c in detail.comments" :key="c.id" :comment="c" />
      </div>

      <div class="jh-post__compose">
        <el-input
          v-model="comment"
          type="textarea"
          :rows="3"
          maxlength="1000"
          show-word-limit
          placeholder="写下你的评论..."
        />
        <div class="row" style="justify-content: flex-end; margin-top: 10px">
          <el-button type="primary" @click="submitComment">发表评论</el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
}

.jh-post__body {
  margin-bottom: 6px;
  padding: 16px;
  background-color: #ffffff;
}

.jh-body__head {
  position: relative;
  min-height: 45px;
}

.jh-body__head__name {
  position: absolute;
  top: 0;
  left: 55px;
  font-size: 16px;
  color: #000000;
  letter-spacing: 0.8px;
  font-weight: 400;
}

.jh-body__title {
  margin-top: 27px;
  line-height: 28px;
  font-size: 22px;
  font-weight: 600;
}

.jh-body__content {
  margin-top: 10px;
  font-size: 14px;
  color: #a9a9a9;
  letter-spacing: 0.7px;
  font-weight: 400;
  white-space: pre-wrap;
}

.jh-body__meta {
  margin-top: 12px;
  font-size: 12px;
}

.jh-body__actions {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.jh-post__compose {
  margin-top: 6px;
  padding: 16px;
  background: #ffffff;
}
</style>
