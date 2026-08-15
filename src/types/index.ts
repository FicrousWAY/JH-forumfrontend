export type Role = 'student' | 'admin'

export interface User {
  id: number
  username: string
  name: string
  role: Role
}

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface TokenData {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface PostItem {
  id: number
  content: string
  author: User
  like_count: number
  comment_count: number
  created_at: string
}

export interface CommentItem {
  id: number
  post_id: number
  content: string
  author: User
  created_at: string
}

export interface PostDetail extends PostItem {
  comments: CommentItem[]
}

export interface PendingAction {
  draft_id: string
  action: 'create_post'
  content: string
  expires_at: string
}

export interface AgentChatData {
  session_id: string
  reply: string
  pending_action: PendingAction | null
}
