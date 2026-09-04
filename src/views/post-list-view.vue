<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi } from '@/api'
import type { PostItem } from '@/types'
import { usePostsStore } from '@/stores/posts'
import PostItemCard from '@/components/post-item-card.vue'

const router = useRouter()
const postsStore = usePostsStore()
const channel = ref<'square' | 'college' | 'garden'>('square')

const banners = [
  { title: '精弘论坛', subtitle: '校园交流广场', color: '#da8eae' },
  { title: '热门话题', subtitle: '看看大家都在聊什么', color: '#81b2e9' },
  { title: '欢迎发帖', subtitle: '分享你的校园生活', color: '#3cc51f' },
]

async function load(force = false) {
  await postsStore.fetchList({ force }) // 默认 SWR：TTL 内用缓存，过期后台刷新；force 则强制请求
}

async function toggleLike(post: PostItem) {
  try {
    const { data } = await postApi.like(post.id)
    postsStore.updateLike(post.id, data.data.is_liked)
  } catch {
    ElMessage.warning('点赞操作失败，请稍后重试')
  }
}

function openPost(post: PostItem) {
  router.push({ name: 'post-detail', params: { id: post.id } })
}

onMounted(() => load())
</script>

<template>
  <div class="explore">
    <div class="segment-tabs">
      <span
        class="segment-tab"
        :class="{ active: channel === 'square' }"
        @click="channel = 'square'"
      >广场</span>
      <span
        class="segment-tab"
        :class="{ active: channel === 'college' }"
        @click="channel = 'college'"
      >学院</span>
      <span
        class="segment-tab"
        :class="{ active: channel === 'garden' }"
        @click="channel = 'garden'"
      >后院</span>
    </div>

    <template v-if="channel === 'square'">
      <div class="banner-wrap">
        <el-carousel height="160px" indicator-position="outside">
          <el-carousel-item v-for="(b, i) in banners" :key="i">
            <div class="banner-slide" :style="{ background: b.color }">
              <strong>{{ b.title }}</strong>
              <span>{{ b.subtitle }}</span>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <div class="sort-bar">
        <span class="muted">
          排序方式
          <span v-if="postsStore.refreshing" class="refresh-hint">· 更新中</span>
        </span>
        <el-radio-group
          v-model="postsStore.sort"
          size="small"
          @change="() => { postsStore.page = 1; load(true) }"
        >
          <el-radio-button label="latest">最新</el-radio-button>
          <el-radio-button label="hot">热门</el-radio-button>
        </el-radio-group>
      </div>

      <el-skeleton :loading="postsStore.loading" animated :rows="6">
        <div v-if="!postsStore.posts.length" class="empty-state">暂无帖子，去发布第一条吧。</div>
        <PostItemCard
          v-for="post in postsStore.posts"
          :key="post.id"
          :post="post"
          :liked="!!postsStore.likedMap[post.id]"
          @open="openPost(post)"
          @like="toggleLike(post)"
        />
      </el-skeleton>

      <div class="pager">
        <el-pagination
          background
          layout="prev, pager, next"
          :page-size="postsStore.pageSize"
          :current-page="postsStore.page"
          :total="postsStore.total"
          @current-change="(p: number) => { postsStore.page = p; load(true) }"
        />
      </div>
    </template>

    <div v-else class="empty-state">
      {{ channel === 'college' ? '学院频道即将上线' : '后院频道即将上线' }}
    </div>
  </div>
</template>

<style scoped>
.banner-wrap {
  background: #fff;
  margin-bottom: 6px;
}

.banner-slide {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
}

.banner-slide strong {
  font-size: 22px;
}

.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fff;
  margin-bottom: 4px;
  font-size: 13px;
}

.refresh-hint {
  color: var(--el-color-primary);
  font-size: 12px;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  padding: 8px;
}
</style>
