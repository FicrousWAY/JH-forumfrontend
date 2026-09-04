import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PendingAction } from '@/types'
import { useAuthStore } from '@/stores/auth'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  pending?: PendingAction | null
  draftStatus?: 'pending' | 'confirmed' | 'failed'
}

interface AgentSession {
  sessionId: string
  messages: AgentMessage[]
  pending: PendingAction | null
}

const WELCOME_MESSAGE: AgentMessage = {
  role: 'assistant',
  content: '你好，我是论坛 Agent。可以帮你查帖子、看评论，或起草帖子（需二次确认后发布）。',
}

function createSession(username: string): AgentSession {
  return {
    sessionId: `sess_${username}_${Date.now().toString(36)}`,
    messages: [{ ...WELCOME_MESSAGE }],
    pending: null,
  }
}

/**
 * Agent 对话缓存：按用户名隔离 sessions，persist 只持久化 sessions 到 localStorage。
 * 刷新或关闭浏览器后，同一账号可恢复 sessionId、消息记录和待确认草稿。
 * 「清空对话」调用 resetSession，会新建 sessionId。
 */
export const useAgentStore = defineStore(
  'agent',
  () => {
    const sessions = ref<Record<string, AgentSession>>({})

    const username = computed(() => useAuthStore().user?.username || 'guest')

    const current = computed(() => {
      const key = username.value
      if (!sessions.value[key]) {
        sessions.value[key] = createSession(key)
      }
      return sessions.value[key]
    })

    const sessionId = computed(() => current.value.sessionId)
    const messages = computed(() => current.value.messages)
    const pending = computed({
      get: () => current.value.pending,
      set: (value) => {
        current.value.pending = value
      },
    })

    function pushMessage(message: AgentMessage) {
      current.value.messages.push(message)
    }

    function bindPendingToLastReply() {
      const pendingAction = current.value.pending
      if (!pendingAction) return
      const last = [...current.value.messages].reverse().find((m) => m.role === 'assistant')
      if (last && !last.pending) {
        last.pending = pendingAction
        last.draftStatus = 'pending'
      }
    }

    function resetSession() {
      sessions.value[username.value] = createSession(username.value)
    }

    return {
      sessions,
      sessionId,
      messages,
      pending,
      pushMessage,
      bindPendingToLastReply,
      resetSession,
    }
  },
  {
    persist: {
      pick: ['sessions'], // 按用户名隔离的会话映射，刷新后可恢复对话
    },
  },
)
