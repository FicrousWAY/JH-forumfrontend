<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentApi } from '@/api'
import { useAgentStore } from '@/stores/agent'

const agentStore = useAgentStore()
const input = ref('')
const loading = ref(false)

const canConfirm = computed(() => !!agentStore.pending)

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
      session_id: agentStore.sessionId,
      message: text || '确认',
      confirm_draft_id: confirmDraftId,
    })
    agentStore.pushMessage({ role: 'assistant', content: data.data.reply })
    agentStore.pending = data.data.pending_action
    input.value = ''
  } finally {
    loading.value = false
  }
}

async function confirmDraft() {
  if (!agentStore.pending) return
  try {
    await ElMessageBox.confirm(
      `确认发布以下帖子吗？\n\n${agentStore.pending.content}`,
      '二次确认',
      { type: 'warning' },
    )
    const draftId = agentStore.pending.draft_id
    await send(draftId)
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
      <div class="row">
        <el-button size="small" @click="clearHistory">清空对话</el-button>
        <el-button v-if="canConfirm" type="warning" size="small" @click="confirmDraft">确认发布草稿</el-button>
      </div>
    </div>

    <div class="agent-messages">
      <div
        v-for="(m, idx) in agentStore.messages"
        :key="idx"
        class="agent-bubble"
        :class="m.role === 'user' ? 'is-user' : 'is-bot'"
      >
        {{ m.content }}
      </div>
      <div v-if="agentStore.pending" class="pending-box">
        <strong>待确认草稿</strong>
        <p>{{ agentStore.pending.content }}</p>
        <div class="muted" style="font-size: 12px">
          draft_id: {{ agentStore.pending.draft_id }} · 过期：{{ agentStore.pending.expires_at }}
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
      <el-button type="primary" :loading="loading" @click="send()">发送</el-button>
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

.pending-box {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 12px;
  border-radius: 8px;
}
</style>
