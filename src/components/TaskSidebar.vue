<template>
  <div class="task-sidebar">
    <div class="sidebar-header">
      <n-input v-model:value="searchText" placeholder="搜索任务..." clearable>
        <template #prefix>
          <n-icon><Search /></n-icon>
        </template>
      </n-input>
      <n-button quaternary circle @click="emit('add-task')">
        <template #icon><Plus /></template>
      </n-button>
    </div>

    <n-scrollbar>
      <div class="task-list">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-item"
          :class="{ active: task.id === modelValue }"
          @click="selectTask(task.id)"
        >
          <div class="task-icon">
            <n-tag :type="statusColors[task.status]" size="small">
              {{ statusLabels[task.status] }}
            </n-tag>
          </div>
          <div class="task-info">
            <div class="task-name">{{ task.name }}</div>
            <div class="task-time">{{ formatTime(task.updatedAt) }}</div>
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NTag, NIcon, NScrollbar } from 'naive-ui'
import { Search, Plus } from '@vicons/ionicons5'
import type { Task, TaskStatus } from '@/types/task'

const props = defineProps<{
  tasks: Task[]
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
  'add-task': []
}>()

const searchText = ref('')

const filteredTasks = computed(() => {
  if (!searchText.value) return props.tasks
  return props.tasks.filter(t =>
    t.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

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

function selectTask(id: string) {
  emit('update:modelValue', id)
}

function formatTime(iso: string) {
  const date = new Date(iso)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.task-sidebar {
  width: 280px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.sidebar-header {
  padding: 12px;
  display: flex;
  gap: 8px;
}

.task-list {
  flex: 1;
  padding: 8px;
}

.task-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.task-item:hover {
  background: #f0f0f0;
}

.task-item.active {
  background: #e8f4ff;
}

.task-info {
  flex: 1;
  overflow: hidden;
}

.task-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  font-size: 12px;
  color: #999;
}
</style>
