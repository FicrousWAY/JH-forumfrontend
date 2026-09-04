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
  title: string
  body: string
  /** 旧缓存兼容，新接口不再返回 */
  content?: string
  author: User
  like_count: number
  comment_count: number
  created_at: string
}

export function postTitleOf(p: PostItem): string {
  if (p.title?.trim()) return p.title.trim()
  const first = (p.content || '').trim().split(/\r?\n/)[0]
  return first?.slice(0, 60) || '无标题'
}

export function postBodyOf(p: PostItem): string {
  if (p.body?.trim()) return p.body.trim()
  const text = (p.content || '').trim()
  const lines = text.split(/\r?\n/)
  if (lines.length <= 1) return text
  return lines.slice(1).join('\n').trim() || text
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
  title?: string
  body?: string
  content: string
  expires_at: string
}

export interface AgentChatData {
  session_id: string
  reply: string
  pending_action: PendingAction | null
}
