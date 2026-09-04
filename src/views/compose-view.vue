<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi } from '@/api'
import { usePostsStore } from '@/stores/posts'

const router = useRouter()
const postsStore = usePostsStore()
const title = ref('')
const body = ref('')
const loading = ref(false)

async function submit() {
  const t = title.value.trim()
  const text = body.value.trim()
  if (!t) {
    ElMessage.warning('标题不能为空')
    return
  }
  if (t.length > 60) {
    ElMessage.warning('标题最多 60 字')
    return
  }
  if (!text) {
    ElMessage.warning('正文不能为空')
    return
  }
  if (text.length > 2000) {
    ElMessage.warning('正文最多 2000 字')
    return
  }
  loading.value = true
  try {
    const { data } = await postApi.create({ title: t, body: text })
    postsStore.invalidate() // 发帖后清 TTL，下次进发现页会重新拉取
    ElMessage.success('发布成功')
    router.push({ name: 'post-detail', params: { id: data.data.id } })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2 style="margin-top: 0; font-size: 18px">发布帖子</h2>
    <p class="muted" style="font-size: 13px">请分别填写标题和正文。作者信息来自登录态。</p>
    <el-input
      v-model="title"
      maxlength="60"
      show-word-limit
      placeholder="标题"
      style="margin-bottom: 12px"
    />
    <el-input
      v-model="body"
      type="textarea"
      :rows="10"
      maxlength="2000"
      show-word-limit
      placeholder="正文"
    />
    <div class="row" style="margin-top: 14px; justify-content: flex-end">
      <el-button @click="router.back()">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">发布</el-button>
    </div>
  </div>
</template>
