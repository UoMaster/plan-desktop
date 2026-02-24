<template>
  <div class="task-detail">
    <div class="detail-header">
      <n-input
        v-if="isEditing"
        v-model:value="editName"
        @blur="saveName"
        @keyup.enter="saveName"
      />
      <h2 v-else @dblclick="startEditName">{{ task.name }}</h2>
      <div class="header-actions">
        <n-tag :type="statusColors[task.status]">
          {{ statusLabels[task.status] }}
        </n-tag>
        <n-button-group>
          <n-button size="small" @click="emit('run')" :disabled="!canRun">
            运行
          </n-button>
          <n-button size="small" @click="emit('stop')" :disabled="task.status !== 'running'">
            停止
          </n-button>
        </n-button-group>
      </div>
    </div>

    <n-tabs type="line" animated>
      <n-tab-pane name="description" tab="任务描述">
        <n-input
          v-model:value="task.description"
          type="textarea"
          placeholder="输入任务描述..."
          :autosize="{ minRows: 3 }"
          @blur="emit('update', task)"
        />
      </n-tab-pane>

      <n-tab-pane name="brainstorming" tab="脑暴文档">
        <DocumentEditor
          v-model="task.documents.brainstorming"
          placeholder="点击生成脑暴文档..."
          @generate="emit('generate-brainstorming')"
        />
      </n-tab-pane>

      <n-tab-pane name="plan" tab="设计文档">
        <DocumentEditor
          v-model="task.documents.plan"
          placeholder="点击生成设计文档..."
          @generate="emit('generate-plan')"
        />
      </n-tab-pane>

      <n-tab-pane name="logs" tab="执行日志">
        <div class="log-viewer">
          <div v-if="task.logs.startTime" class="log-item">
            开始时间: {{ formatDateTime(task.logs.startTime) }}
          </div>
          <div v-if="task.logs.endTime" class="log-item">
            结束时间: {{ formatDateTime(task.logs.endTime) }}
          </div>
          <div v-if="task.logs.result" class="log-item">
            结果: <n-tag :type="task.logs.result === 'success' ? 'success' : 'error'">
              {{ task.logs.result === 'success' ? '成功' : '失败' }}
            </n-tag>
          </div>
          <n-empty v-if="!task.logs.startTime" description="暂无执行记录" />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NButtonGroup, NTag, NTabs, NTabPane, NEmpty } from 'naive-ui'
import DocumentEditor from './DocumentEditor.vue'
import type { Task, TaskStatus } from '@/types/task'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  'update': [task: Task]
  'run': []
  'stop': []
  'generate-brainstorming': []
  'generate-plan': []
}>()

const isEditing = ref(false)
const editName = ref('')

const canRun = computed(() =>
  ['ready', 'paused'].includes(props.task.status)
)

const statusColors: Record<TaskStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  brainstorming: 'info',
  planning: 'info',
  ready: 'success',
  running: 'warning',
  paused: 'warning',
  completed: 'success',
  failed: 'error',
  locked: 'warning'
}

const statusLabels: Record<TaskStatus, string> = {
  draft: '草稿',
  brainstorming: '脑暴中',
  planning: '设计中',
  ready: '待运行',
  running: '运行中',
  paused: '暂停',
  completed: '已完成',
  failed: '失败',
  locked: '锁定'
}

function startEditName() {
  isEditing.value = true
  editName.value = props.task.name
}

function saveName() {
  isEditing.value = false
  if (editName.value !== props.task.name) {
    props.task.name = editName.value
    emit('update', props.task)
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN')
}
</script>

<style scoped>
.task-detail {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h2 {
  margin: 0;
  cursor: pointer;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-viewer {
  padding: 12px;
}

.log-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
</style>
