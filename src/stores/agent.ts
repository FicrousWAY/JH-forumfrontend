import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PendingAction } from '@/types'
import { useAuthStore } from '@/stores/auth'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
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

    function resetSession() {
      sessions.value[username.value] = createSession(username.value)
    }

    return {
      sessions,
      sessionId,
      messages,
      pending,
      pushMessage,
      resetSession,
    }
  },
  {
    persist: {
      pick: ['sessions'],
    },
  },
)
