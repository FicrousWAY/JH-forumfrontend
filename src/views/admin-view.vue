<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi } from '@/api'
import type { PostItem } from '@/types'

const loading = ref(false)
const posts = ref<PostItem[]>([])
const query = reactive({ page: 1, page_size: 20, total: 0 })

async function load() {
  loading.value = true
  try {
    const { data } = await postApi.list({
      page: query.page,
      page_size: query.page_size,
      sort: 'latest',
    })
    posts.value = data.data.items
    query.total = data.data.meta.total
  } finally {
    loading.value = false
  }
}

async function remove(post: PostItem) {
  try {
    await ElMessageBox.confirm(`确认删除帖子 #${post.id}？`, '管理删除', { type: 'warning' })
    await postApi.adminDelete(post.id)
    ElMessage.success('删除成功')
    await load()
  } catch {
    // cancel
  }
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <h2 style="margin-top: 0; font-size: 18px">管理端 · 帖子治理</h2>
    <p class="muted" style="font-size: 13px">仅管理员可删除任意帖子。学生账号访问会被路由拦截。</p>

    <el-table :data="posts" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="作者" width="140">
        <template #default="{ row }">{{ row.author.name }}</template>
      </el-table-column>
      <el-table-column prop="like_count" label="赞" width="80" />
      <el-table-column prop="comment_count" label="评" width="80" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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
