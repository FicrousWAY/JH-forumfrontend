<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi } from '@/api'
import type { PostDetail } from '@/types'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const detail = ref<PostDetail | null>(null)
const liked = ref(false)
const comment = ref('')

const postId = computed(() => Number(route.params.id))

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
    ElMessage.success('已删除')
    router.push({ name: 'home' })
  } catch {
    // cancel
  }
}

onMounted(load)
</script>

<template>
  <div class="panel" v-loading="loading">
    <el-button text @click="router.push({ name: 'home' })">← 返回列表</el-button>
    <template v-if="detail">
      <div class="row" style="justify-content: space-between">
        <div>
          <h2 style="margin-bottom: 4px">{{ detail.author.name }}</h2>
          <div class="muted">{{ new Date(detail.created_at).toLocaleString() }} · #{{ detail.id }}</div>
        </div>
        <el-button v-if="auth.isAdmin" type="danger" @click="removePost">管理员删除</el-button>
      </div>
      <p style="white-space: pre-wrap; font-size: 1.05rem">{{ detail.content }}</p>
      <div class="row">
        <el-button :type="liked ? 'primary' : 'default'" @click="toggleLike">
          {{ liked ? '已赞' : '点赞' }} {{ detail.like_count }}
        </el-button>
        <span class="muted">评论 {{ detail.comment_count }}</span>
      </div>

      <h3>评论</h3>
      <div v-if="!detail.comments.length" class="muted">还没有评论</div>
      <div v-for="c in detail.comments" :key="c.id" class="post-item">
        <div class="row" style="justify-content: space-between">
          <strong>{{ c.author.name }}</strong>
          <span class="muted">{{ new Date(c.created_at).toLocaleString() }}</span>
        </div>
        <p style="white-space: pre-wrap">{{ c.content }}</p>
      </div>

      <el-input
        v-model="comment"
        type="textarea"
        :rows="4"
        maxlength="1000"
        show-word-limit
        placeholder="写下你的评论..."
        style="margin-top: 12px"
      />
      <div class="row" style="justify-content: flex-end; margin-top: 10px">
        <el-button type="primary" @click="submitComment">发表评论</el-button>
      </div>
    </template>
  </div>
</template>
