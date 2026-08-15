import http from './http'
import type {
  AgentChatData,
  ApiResponse,
  PageMeta,
  PostDetail,
  PostItem,
  TokenData,
  User,
} from '@/types'

export const authApi = {
  register(data: { username: string; name: string; password: string; role: string }) {
    return http.post<ApiResponse<User>>('/auth/register', data)
  },
  login(data: { username: string; password: string }) {
    return http.post<ApiResponse<TokenData>>('/auth/login', data)
  },
}

export const postApi = {
  list(params: { page?: number; page_size?: number; sort?: string }) {
    return http.get<ApiResponse<{ items: PostItem[]; meta: PageMeta }>>('/posts', { params })
  },
  create(content: string) {
    return http.post<ApiResponse<PostItem>>('/posts', { content })
  },
  detail(postId: number) {
    return http.get<ApiResponse<PostDetail>>(`/posts/${postId}`)
  },
  like(postId: number) {
    return http.post<ApiResponse<{ post_id: number; is_liked: boolean }>>(`/posts/${postId}/like`)
  },
  likeStatus(postIds: number[]) {
    return http.post<ApiResponse<{ status: { post_id: number; liked: boolean }[] }>>('/posts/likes', {
      post_ids: postIds,
    })
  },
  comment(postId: number, content: string) {
    return http.post(`/posts/${postId}/comment`, { content })
  },
  adminDelete(postId: number) {
    return http.delete(`/admin/posts/${postId}`)
  },
}

export const agentApi = {
  chat(data: { session_id: string; message: string; confirm_draft_id?: string }) {
    return http.post<ApiResponse<AgentChatData>>('/agent/chat', data)
  },
}
