<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi } from '@/api'
import type { PostItem } from '@/types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const posts = ref<PostItem[]>([])
const likedMap = ref<Record<number, boolean>>({})
const query = reactive({
  page: 1,
  page_size: 20,
  sort: 'latest',
  total: 0,
})

async function load() {
  loading.value = true
  try {
    const { data } = await postApi.list({
      page: query.page,
      page_size: query.page_size,
      sort: query.sort,
    })
    posts.value = data.data.items
    query.total = data.data.meta.total
    const ids = posts.value.map((p) => p.id)
    if (ids.length) {
      const statusResp = await postApi.likeStatus(ids)
      const map: Record<number, boolean> = {}
      statusResp.data.data.status.forEach((s) => {
        map[s.post_id] = s.liked
      })
      likedMap.value = map
    } else {
      likedMap.value = {}
    }
  } finally {
    loading.value = false
  }
}

async function toggleLike(post: PostItem) {
  try {
    const { data } = await postApi.like(post.id)
    likedMap.value[post.id] = data.data.is_liked
    post.like_count += data.data.is_liked ? 1 : -1
    if (post.like_count < 0) post.like_count = 0
  } catch {
    ElMessage.warning('点赞操作失败，请稍后重试')
  }
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <div class="row" style="justify-content: space-between; margin-bottom: 12px">
      <div>
        <h2 style="margin: 0">帖子广场</h2>
        <p class="muted" style="margin: 6px 0 0">支持最新 / 热门排序</p>
      </div>
      <el-radio-group v-model="query.sort" @change="() => { query.page = 1; load() }">
        <el-radio-button label="latest">最新</el-radio-button>
        <el-radio-button label="hot">热门</el-radio-button>
      </el-radio-group>
    </div>

    <el-skeleton :loading="loading" animated :rows="6">
      <div v-if="!posts.length" class="muted">暂无帖子，去发布第一条吧。</div>
      <div v-for="post in posts" :key="post.id" class="post-item">
        <div class="row" style="justify-content: space-between">
          <strong>{{ post.author.name }}</strong>
          <span class="muted">{{ new Date(post.created_at).toLocaleString() }}</span>
        </div>
        <p style="white-space: pre-wrap; cursor: pointer" @click="router.push({ name: 'post-detail', params: { id: post.id } })">
          {{ post.content }}
        </p>
        <div class="row">
          <el-button size="small" :type="likedMap[post.id] ? 'primary' : 'default'" @click="toggleLike(post)">
            {{ likedMap[post.id] ? '已赞' : '点赞' }} {{ post.like_count }}
          </el-button>
          <el-button size="small" @click="router.push({ name: 'post-detail', params: { id: post.id } })">
            评论 {{ post.comment_count }}
          </el-button>
          <el-tag size="small" type="info">{{ post.author.role }}</el-tag>
          <span v-if="auth.isAdmin" class="muted">#{{ post.id }}</span>
        </div>
      </div>
    </el-skeleton>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="query.page_size"
        :current-page="query.page"
        :total="query.total"
        @current-change="(p: number) => { query.page = p; load() }"
      />
    </div>
  </div>
</template>
