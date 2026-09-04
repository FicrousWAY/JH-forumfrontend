<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentApi } from '@/api'
import { useAgentStore, type AgentMessage } from '@/stores/agent'
import { usePostsStore } from '@/stores/posts'
import type { PendingAction } from '@/types'

const agentStore = useAgentStore()
const postsStore = usePostsStore()
const input = ref('')
const loading = ref(false)
const confirmingId = ref('')

onMounted(() => {
  agentStore.bindPendingToLastReply()
})

function isDraftPending(m: AgentMessage) {
  return (
    m.role === 'assistant' &&
    !!m.pending?.draft_id &&
    m.draftStatus !== 'confirmed' &&
    m.draftStatus !== 'failed'
  )
}

function isExpired(pending: PendingAction) {
  const t = Date.parse(pending.expires_at)
  return Number.isFinite(t) && t <= Date.now()
}

async function send(confirmDraftId?: string) {
  const text = input.value.trim() || (confirmDraftId ? '确认发布草稿' : '')
  if (!text && !confirmDraftId) {
    ElMessage.warning('请输入消息')
    return
  }
  if (!confirmDraftId) {
    agentStore.pushMessage({ role: 'user', content: text })
  }
  loading.value = true
  try {
    const { data } = await agentApi.chat({
      session_id: agentStore.sessionId, // 按用户持久化的多轮会话 ID，确认草稿也必须带上
      message: text || '确认',
      confirm_draft_id: confirmDraftId,
    })
    const pending = data.data.pending_action
    agentStore.pushMessage({
      role: 'assistant',
      content: data.data.reply,
      pending,
      draftStatus: pending?.action === 'create_post' ? 'pending' : undefined,
    })
    agentStore.pending = pending
    input.value = ''
    if (confirmDraftId) {
      markDraft(confirmDraftId, 'confirmed')
      postsStore.invalidate()
    }
  } catch {
    if (confirmDraftId) markDraft(confirmDraftId, 'failed')
  } finally {
    loading.value = false
    confirmingId.value = ''
  }
}

function markDraft(draftId: string, status: 'confirmed' | 'failed') {
  const msg = agentStore.messages.find((m) => m.pending?.draft_id === draftId)
  if (msg) msg.draftStatus = status
  if (agentStore.pending?.draft_id === draftId) {
    agentStore.pending = null
  }
}

async function confirmDraft(pending: PendingAction) {
  if (isExpired(pending)) {
    ElMessage.warning('草稿已过期，请重新起草')
    markDraft(pending.draft_id, 'failed')
    return
  }
  try {
    const preview = [pending.title, pending.body || pending.content].filter(Boolean).join('\n\n')
    await ElMessageBox.confirm(`确认发布以下帖子吗？\n\n${preview}`, '二次确认', {
      type: 'warning',
    })
    confirmingId.value = pending.draft_id
    await send(pending.draft_id)
  } catch {
    ElMessage.info('已取消确认')
  }
}

async function clearHistory() {
  try {
    await ElMessageBox.confirm('确认清空当前对话记录吗？', '提示', { type: 'warning' })
    agentStore.resetSession()
    ElMessage.success('已清空')
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="panel agent-panel">
    <div class="row" style="justify-content: space-between">
      <div>
        <h2 style="margin: 0; font-size: 18px">Agent 多轮对话</h2>
        <p class="muted" style="margin: 6px 0 0; font-size: 12px">session: {{ agentStore.sessionId }}</p>
      </div>
      <el-button size="small" @click="clearHistory">清空对话</el-button>
    </div>

    <div class="agent-messages">
      <div
        v-for="(m, idx) in agentStore.messages"
        :key="idx"
        class="agent-bubble"
        :class="m.role === 'user' ? 'is-user' : 'is-bot'"
      >
        <div>{{ m.content }}</div>
        <div v-if="m.pending" class="draft-card">
          <strong>待确认草稿</strong>
          <p v-if="m.pending.title"><b>{{ m.pending.title }}</b></p>
          <p>{{ m.pending.body || m.pending.content }}</p>

          <div class="draft-actions">
            <el-button
              v-if="isDraftPending(m)"
              type="warning"
              size="small"
              :loading="confirmingId === m.pending.draft_id"
              :disabled="loading && confirmingId !== m.pending.draft_id"
              @click="confirmDraft(m.pending)"
            >
              确认发布
            </el-button>
            <span v-else-if="m.draftStatus === 'confirmed'" class="draft-status is-ok">已发布</span>
            <span v-else-if="m.draftStatus === 'failed'" class="draft-status is-fail">未发布</span>
          </div>
        </div>
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
      <el-button type="primary" :loading="loading && !confirmingId" @click="send()">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.agent-panel {
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

.agent-messages {
  flex: 1;
  overflow: auto;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agent-bubble {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 10px 12px;
  max-width: 85%;
  white-space: pre-wrap;
  font-size: 14px;
}

.agent-bubble.is-user {
  align-self: flex-end;
  background: var(--accent-soft);
}

.agent-bubble.is-bot {
  align-self: flex-start;
  background: #f8f8f8;
}

.draft-card {
  margin-top: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 12px;
  border-radius: 8px;
  white-space: normal;
}

.draft-card p {
  margin: 8px 0;
}

.draft-actions {
  margin-top: 10px;
}

.draft-status {
  font-size: 13px;
}

.draft-status.is-ok {
  color: var(--accent);
}

.draft-status.is-fail {
  color: var(--danger);
}
</style>
