<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi } from '@/api'

const router = useRouter()
const content = ref('')
const loading = ref(false)

async function submit() {
  const text = content.value.trim()
  if (!text) {
    ElMessage.warning('内容不能为空')
    return
  }
  if (text.length > 2000) {
    ElMessage.warning('内容最多 2000 字')
    return
  }
  loading.value = true
  try {
    const { data } = await postApi.create(text)
    ElMessage.success('发布成功')
    router.push({ name: 'post-detail', params: { id: data.data.id } })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2 style="margin-top: 0">发布帖子</h2>
    <p class="muted">作者信息来自登录态，无需也不允许手动传 user_id。</p>
    <el-input
      v-model="content"
      type="textarea"
      :rows="10"
      maxlength="2000"
      show-word-limit
      placeholder="分享你的想法..."
    />
    <div class="row" style="margin-top: 14px; justify-content: flex-end">
      <el-button @click="router.back()">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">发布</el-button>
    </div>
  </div>
</template>
