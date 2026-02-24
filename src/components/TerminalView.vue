<template>
  <div class="terminal-view">
    <div class="terminal-header">
      <n-tabs type="segment" v-model:value="activeTaskId">
        <n-tab-pane
          v-for="running in runningTasks"
          :key="running.id"
          :name="running.id"
          :tab="running.name"
        />
      </n-tabs>
    </div>
    <n-scrollbar class="terminal-output" ref="outputScroll">
      <pre>{{ output }}</pre>
    </n-scrollbar>
    <div class="terminal-input">
      <n-input
        v-model:value="inputText"
        placeholder="输入消息..."
        @keyup.enter="sendInput"
        :disabled="!activeTaskId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NTabs, NTabPane, NInput, NScrollbar } from 'naive-ui'
import { useTaskStore } from '@/stores/taskStore'
import { useTaskRunner } from '@/composables/useTaskRunner'

const taskStore = useTaskStore()
const { sendInput: sendToTask, onOutput } = useTaskRunner()

const activeTaskId = ref<string | null>(null)
const inputText = ref('')
const output = ref('')

const runningTasks = computed(() =>
  taskStore.tasks.filter(t => t.status === 'running')
)

onMounted(() => {
  onOutput((data) => {
    output.value += data.data
  })
})

async function sendInput() {
  if (!activeTaskId.value || !inputText.value) return

  output.value += `\n> ${inputText.value}\n`

  await sendToTask(activeTaskId.value, inputText.value)

  inputText.value = ''
}
</script>

<style scoped>
.terminal-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
}

.terminal-header {
  padding: 12px;
  background: #2d2d2d;
}

.terminal-output {
  flex: 1;
  padding: 12px;
}

.terminal-output pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
}

.terminal-input {
  padding: 12px;
  background: #2d2d2d;
}

.terminal-input :deep(.n-input) {
  --n-color: #3c3c3c;
  --n-color-focus: #3c3c3c;
}
</style>
