<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentApi } from '@/api'
import type { PendingAction } from '@/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const sessionId = ref(`sess_${auth.user?.username || 'guest'}_${Date.now().toString(36)}`)
const input = ref('')
const loading = ref(false)
const pending = ref<PendingAction | null>(null)
const messages = ref<{ role: 'user' | 'assistant'; content: string }[]>([
  {
    role: 'assistant',
    content: '你好，我是论坛 Agent。可以帮你查帖子、看评论，或起草帖子（需二次确认后发布）。',
  },
])

const canConfirm = computed(() => !!pending.value)

async function send(confirmDraftId?: string) {
  const text = input.value.trim() || (confirmDraftId ? '确认发布草稿' : '')
  if (!text && !confirmDraftId) {
    ElMessage.warning('请输入消息')
    return
  }
  if (!confirmDraftId) {
    messages.value.push({ role: 'user', content: text })
  }
  loading.value = true
  try {
    const { data } = await agentApi.chat({
      session_id: sessionId.value,
      message: text || '确认',
      confirm_draft_id: confirmDraftId,
    })
    messages.value.push({ role: 'assistant', content: data.data.reply })
    pending.value = data.data.pending_action
    input.value = ''
  } finally {
    loading.value = false
  }
}

async function confirmDraft() {
  if (!pending.value) return
  try {
    await ElMessageBox.confirm(
      `确认发布以下帖子吗？\n\n${pending.value.content}`,
      '二次确认',
      { type: 'warning' },
    )
    const draftId = pending.value.draft_id
    await send(draftId)
  } catch {
    ElMessage.info('已取消确认')
  }
}
</script>

<template>
  <div class="panel" style="display: flex; flex-direction: column; min-height: 70vh">
    <div class="row" style="justify-content: space-between">
      <div>
        <h2 style="margin: 0">Agent 多轮对话</h2>
        <p class="muted" style="margin: 6px 0 0">session: {{ sessionId }}</p>
      </div>
      <el-button v-if="canConfirm" type="warning" @click="confirmDraft">确认发布草稿</el-button>
    </div>

    <div style="flex: 1; overflow: auto; margin: 16px 0; display: flex; flex-direction: column; gap: 10px">
      <div
        v-for="(m, idx) in messages"
        :key="idx"
        :style="{
          alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
          background: m.role === 'user' ? 'var(--accent-soft)' : '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '10px 12px',
          maxWidth: '85%',
          whiteSpace: 'pre-wrap',
        }"
      >
        {{ m.content }}
      </div>
      <div v-if="pending" class="panel" style="background: #fff7ed; box-shadow: none">
        <strong>待确认草稿</strong>
        <p>{{ pending.content }}</p>
        <div class="muted">draft_id: {{ pending.draft_id }} · 过期：{{ pending.expires_at }}</div>
      </div>
    </div>

    <div class="row">
      <el-input
        v-model="input"
        type="textarea"
        :rows="3"
        maxlength="4000"
        show-word-limit
        placeholder="例如：帮我起草一条招新帖子 / 查一下最新帖子"
        @keydown.enter.exact.prevent="send()"
      />
    </div>
    <div class="row" style="justify-content: flex-end; margin-top: 10px">
      <el-button type="primary" :loading="loading" @click="send()">发送</el-button>
    </div>
  </div>
</template>
