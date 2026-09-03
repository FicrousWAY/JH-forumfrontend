import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postApi } from '@/api'
import type { PostItem } from '@/types'

/** 缓存有效期：过期后在后台静默刷新 */
const CACHE_TTL_MS = 60_000

export const usePostsStore = defineStore(
  'posts',
  () => {
    const posts = ref<PostItem[]>([])
    const likedMap = ref<Record<number, boolean>>({})
    const page = ref(1)
    const pageSize = ref(20)
    const sort = ref('latest')
    const total = ref(0)
    const fetchedAt = ref(0)
    const loading = ref(false)
    const refreshing = ref(false)

    function hasCache() {
      return posts.value.length > 0 || total.value > 0
    }

    function isStale() {
      return !fetchedAt.value || Date.now() - fetchedAt.value > CACHE_TTL_MS
    }

    async function fetchList(options?: { page?: number; sort?: string; force?: boolean }) {
      const queryChanged =
        (options?.page !== undefined && options.page !== page.value) ||
        (options?.sort !== undefined && options.sort !== sort.value)

      if (options?.page !== undefined) page.value = options.page
      if (options?.sort !== undefined) sort.value = options.sort

      if (!queryChanged && !options?.force && hasCache() && !isStale()) {
        return
      }

      if (queryChanged || !hasCache()) {
        loading.value = true
      } else {
        refreshing.value = true
      }

      try {
        const { data } = await postApi.list({
          page: page.value,
          page_size: pageSize.value,
          sort: sort.value,
        })
        posts.value = data.data.items
        total.value = data.data.meta.total
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
        fetchedAt.value = Date.now()
      } finally {
        loading.value = false
        refreshing.value = false
      }
    }

    function updateLike(postId: number, isLiked: boolean) {
      likedMap.value[postId] = isLiked
      const post = posts.value.find((p) => p.id === postId)
      if (post) {
        post.like_count += isLiked ? 1 : -1
        if (post.like_count < 0) post.like_count = 0
      }
    }

    function invalidate() {
      fetchedAt.value = 0
    }

    /** 写操作后立刻从列表缓存移除，避免 SWR 短暂展示已删除内容 */
    function removePost(postId: number) {
      posts.value = posts.value.filter((p) => p.id !== postId)
      const nextLiked = { ...likedMap.value }
      delete nextLiked[postId]
      likedMap.value = nextLiked
      if (total.value > 0) total.value -= 1
      fetchedAt.value = 0
    }

    return {
      posts,
      likedMap,
      page,
      pageSize,
      sort,
      total,
      fetchedAt,
      loading,
      refreshing,
      fetchList,
      updateLike,
      invalidate,
      removePost,
    }
  },
  {
    persist: {
      pick: ['posts', 'likedMap', 'page', 'pageSize', 'sort', 'total', 'fetchedAt'],
    },
  },
)
