# Superpowers 桌面客户端实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个以任务为单位的 superpowers 桌面客户端，支持多任务并行管理、文档编辑和 Claude Code 实时交互。

**Architecture:** 采用 Electron + Vue 3 技术栈，使用 naive-ui 组件库。左侧任务列表 + 右侧文档编辑布局，单独终端页面显示 Claude Code 交互。任务状态自动流转，支持调用 superpowers 的 brainstorming、writing-plans、executing-plans 三个命令。

**Tech Stack:**
- Electron (桌面应用框架)
- Vue 3 + TypeScript
- Vite (构建工具)
- naive-ui (组件库)
- Shell (调用 Claude Code)

---

## Task 1: 项目结构设计和数据模型定义

**Files:**
- Create: `src/types/task.ts`
- Create: `src/stores/taskStore.ts`

**Step 1: 定义任务数据类型**

```typescript
// src/types/task.ts
export type TaskStatus = 'draft' | 'brainstorming' | 'planning' | 'ready' | 'running' | 'paused' | 'completed' | 'failed' | 'locked'

export interface Task {
  id: string
  name: string
  description: string
  status: TaskStatus
  workspaceDir: string
  documents: {
    brainstorming?: string  // 脑暴文档路径
    plan?: string         // 设计文档路径
  }
  sessionId?: string       // Claude Code 会话 ID
  logs: {
    startTime?: string
    endTime?: string
    result?: 'success' | 'failed'
  }
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  defaultWorkspace: string
  theme: 'light' | 'dark'
}
```

**Step 2: 创建任务状态管理**

```typescript
// src/stores/taskStore.ts
import { ref, computed } from 'vue'
import type { Task, TaskStatus } from '@/types/task'

const tasks = ref<Task[]>([])
const currentTaskId = ref<string | null>(null)
const settings = ref<AppSettings>({
  defaultWorkspace: '',
  theme: 'light'
})

export function useTaskStore() {
  const currentTask = computed(() =>
    tasks.value.find(t => t.id === currentTaskId.value)
  )

  const taskList = computed(() => tasks.value)

  const tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      draft: [], brainstorming: [], planning: [], ready: [],
      running: [], paused: [], completed: [], failed: [], locked: []
    }
    tasks.value.forEach(t => grouped[t.status].push(t))
    return grouped
  })

  function addTask(name: string, workspaceDir: string): Task {
    const task: Task = {
      id: `task-${Date.now()}`,
      name,
      description: '',
      status: 'draft',
      workspaceDir,
      documents: {},
      logs: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    tasks.value.push(task)
    return task
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()
    }
  }

  function deleteTask(id: string) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index > -1) tasks.value.splice(index, 1)
  }

  return {
    tasks,
    currentTaskId,
    currentTask,
    taskList,
    tasksByStatus,
    settings,
    addTask,
    updateTaskStatus,
    deleteTask
  }
}
```

**Step 3: Commit**

```bash
git add src/types/task.ts src/stores/taskStore.ts
git commit -m "feat: add task types and store"
```

---

## Task 2: 主界面布局 - 左侧任务列表

**Files:**
- Create: `src/components/TaskSidebar.vue`
- Modify: `src/views/MainView.vue`

**Step 1: 创建任务侧边栏组件**

```vue
<!-- src/components/TaskSidebar.vue -->
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
```

**Step 2: 更新 MainView 集成侧边栏**

```vue
<!-- src/views/MainView.vue -->
<template>
  <div class="main-view">
    <TaskSidebar
      :tasks="taskStore.taskList"
      v-model="taskStore.currentTaskId"
      @add-task="showAddTaskModal = true"
    />
    <div class="content">
      <TaskDetail
        v-if="taskStore.currentTask"
        :task="taskStore.currentTask"
        @update="handleTaskUpdate"
      />
      <div v-else class="empty-state">
        <n-empty description="选择一个任务开始" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NEmpty } from 'naive-ui'
import TaskSidebar from '@/components/TaskSidebar.vue'
import TaskDetail from '@/components/TaskDetail.vue'
import { useTaskStore } from '@/stores/taskStore'

const taskStore = useTaskStore()
const showAddTaskModal = ref(false)

function handleTaskUpdate() {
  // 保存任务到持久化存储
}
</script>

<style scoped>
.main-view {
  display: flex;
  height: 100vh;
}

.content {
  flex: 1;
  overflow: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
```

**Step 3: Commit**

```bash
git add src/components/TaskSidebar.vue src/views/MainView.vue
git commit -m "feat: add task sidebar component"
```

---

## Task 3: 右侧任务详情面板

**Files:**
- Create: `src/components/TaskDetail.vue`
- Create: `src/components/DocumentEditor.vue`

**Step 1: 创建任务详情组件**

```vue
<!-- src/components/TaskDetail.vue -->
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
          <n-button size="small" @click="runTask" :disabled="!canRun">
            运行
          </n-button>
          <n-button size="small" @click="stopTask" :disabled="task.status !== 'running'">
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
          @blur="saveTask"
        />
      </n-tab-pane>

      <n-tab-pane name="brainstorming" tab="脑暴文档">
        <DocumentEditor
          v-model="task.documents.brainstorming"
          placeholder="点击生成脑暴文档..."
          @generate="generateBrainstorming"
        />
      </n-tab-pane>

      <n-tab-pane name="plan" tab="设计文档">
        <DocumentEditor
          v-model="task.documents.plan"
          placeholder="点击生成设计文档..."
          @generate="generatePlan"
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
    saveTask()
  }
}

function saveTask() {
  emit('update', props.task)
}

function runTask() {
  // Task 4 中实现
}

function stopTask() {
  // Task 4 中实现
}

function generateBrainstorming() {
  // Task 4 中实现
}

function generatePlan() {
  // Task 4 中实现
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
```

**Step 2: 创建文档编辑器组件**

```vue
<!-- src/components/DocumentEditor.vue -->
<template>
  <div class="document-editor">
    <div class="editor-header">
      <n-button size="small" @click="emit('generate')">
        <template #icon><Sparkles /></template>
        AI 生成
      </n-button>
    </div>
    <n-input
      v-model:value="content"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 10 }"
      @blur="emit('update:modelValue', content)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NButton } from 'naive-ui'
import { Sparkles } from '@vicons/ionicons5'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'generate': []
}>()

const content = ref(props.modelValue || '')

watch(() => props.modelValue, (val) => {
  content.value = val || ''
})
</script>

<style scoped>
.document-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-header {
  display: flex;
  justify-content: flex-end;
}
</style>
```

**Step 3: Commit**

```bash
git add src/components/TaskDetail.vue src/components/DocumentEditor.vue
git commit -m "feat: add task detail and document editor components"
```

---

## Task 4: 任务执行 - 调用 superpowers 命令

**Files:**
- Modify: `electron/main.ts` (添加 task runner)
- Create: `electron/preload.ts` (暴露 task runner API)
- Create: `src/composables/useTaskRunner.ts` (渲染进程调用)
- Modify: `src/components/TaskDetail.vue`

**Step 1: 主进程添加 Task Runner**

```typescript
// electron/main.ts - 添加以下内容

// Task Runner 类型
interface TaskProcess {
  taskId: string
  proc: ChildProcessWithoutNullStreams | null
  input: Writable
}

// 存储运行中的任务
const runningTasks = new Map<string, TaskProcess>()

// IPC: 启动脑暴
ipcMain.handle('task:brainstorming', async (event, task: Task) => {
  const store = useTaskStore()
  store.updateTaskStatus(task.id, 'brainstorming')

  const prompt = task.description || task.name

  // 使用 Claude Code 调用 superpowers brainstorming
  const proc = spawn('claude', [
    '-p',
    `使用 /bmad-brainstorming skill，主题是：${prompt}`
  ], {
    cwd: task.workspaceDir,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  const taskProc: TaskProcess = {
    taskId: task.id,
    proc,
    input: proc.stdin
  }
  runningTasks.set(task.id, taskProc)

  return new Promise((resolve, reject) => {
    let output = ''

    proc.stdout?.on('data', (data) => {
      output += data.toString()
      // 发送输出到渲染进程
      mainWindow?.webContents.send('task:output', { taskId: task.id, data: data.toString() })
    })

    proc.stderr?.on('data', (data) => {
      output += data.toString()
      mainWindow?.webContents.send('task:output', { taskId: task.id, data: data.toString() })
    })

    proc.on('close', (code) => {
      runningTasks.delete(task.id)

      if (code === 0) {
        // 保存脑暴结果到文档
        task.documents.brainstorming = output
        store.updateTaskStatus(task.id, 'planning')
        resolve({ success: true, output })
      } else {
        store.updateTaskStatus(task.id, 'failed')
        reject(new Error(`脑暴失败，退出码: ${code}`))
      }
    })

    proc.on('error', (err) => {
      runningTasks.delete(task.id)
      store.updateTaskStatus(task.id, 'failed')
      reject(err)
    })
  })
})

// IPC: 启动设计
ipcMain.handle('task:planning', async (event, task: Task) => {
  const store = useTaskStore()
  store.updateTaskStatus(task.id, 'planning')

  const brainstormingContent = task.documents.brainstorming || task.description

  const proc = spawn('claude', [
    '-p',
    `使用 /bmad-writing-plans skill，基于以下需求生成设计文档：\n\n${brainstormingContent}`
  ], {
    cwd: task.workspaceDir,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  const taskProc: TaskProcess = {
    taskId: task.id,
    proc,
    input: proc.stdin
  }
  runningTasks.set(task.id, taskProc)

  return new Promise((resolve, reject) => {
    let output = ''

    proc.stdout?.on('data', (data) => {
      output += data.toString()
      mainWindow?.webContents.send('task:output', { taskId: task.id, data: data.toString() })
    })

    proc.stderr?.on('data', (data) => {
      output += data.toString()
      mainWindow?.webContents.send('task:output', { taskId: task.id, data: data.toString() })
    })

    proc.on('close', (code) => {
      runningTasks.delete(task.id)

      if (code === 0) {
        task.documents.plan = output
        store.updateTaskStatus(task.id, 'ready')
        resolve({ success: true, output })
      } else {
        store.updateTaskStatus(task.id, 'failed')
        reject(new Error(`设计失败，退出码: ${code}`))
      }
    })

    proc.on('error', (err) => {
      runningTasks.delete(task.id)
      store.updateTaskStatus(task.id, 'failed')
      reject(err)
    })
  })
})

// IPC: 启动执行
ipcMain.handle('task:execute', async (event, task: Task) => {
  const store = useTaskStore()
  store.updateTaskStatus(task.id, 'running')

  task.logs.startTime = new Date().toISOString()
  task.logs.result = undefined

  const planContent = task.documents.plan || task.description

  const proc = spawn('claude', [
    '-p',
    `使用 /bmad-executing-plans skill，执行以下计划：\n\n${planContent}`
  ], {
    cwd: task.workspaceDir,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  const taskProc: TaskProcess = {
    taskId: task.id,
    proc,
    input: proc.stdin
  }
  runningTasks.set(task.id, taskProc)

  return new Promise((resolve, reject) => {
    proc.stdout?.on('data', (data) => {
      mainWindow?.webContents.send('task:output', { taskId: task.id, data: data.toString() })
    })

    proc.stderr?.on('data', (data) => {
      mainWindow?.webContents.send('task:output', { taskId: task.id, data: data.toString() })
    })

    proc.on('close', (code) => {
      runningTasks.delete(task.id)

      task.logs.endTime = new Date().toISOString()
      task.logs.result = code === 0 ? 'success' : 'failed'

      if (code === 0) {
        store.updateTaskStatus(task.id, 'completed')
        resolve({ success: true })
      } else {
        store.updateTaskStatus(task.id, 'failed')
        reject(new Error(`执行失败，退出码: ${code}`))
      }
    })

    proc.on('error', (err) => {
      runningTasks.delete(task.id)
      store.updateTaskStatus(task.id, 'failed')
      task.logs.endTime = new Date().toISOString()
      task.logs.result = 'failed'
      reject(err)
    })
  })
})

// IPC: 停止任务
ipcMain.handle('task:stop', async (_, taskId: string) => {
  const taskProc = runningTasks.get(taskId)
  if (taskProc?.proc) {
    taskProc.proc.kill()
    runningTasks.delete(taskId)

    const store = useTaskStore()
    const task = store.tasks.find(t => t.id === taskId)
    if (task) {
      task.logs.endTime = new Date().toISOString()
      task.logs.result = 'failed'
      store.updateTaskStatus(taskId, 'failed')
    }
    return { success: true }
  }
  return { success: false, error: '任务未运行' }
})

// IPC: 发送输入
ipcMain.handle('task:input', async (_, taskId: string, input: string) => {
  const taskProc = runningTasks.get(taskId)
  if (taskProc?.input) {
    taskProc.input.write(input + '\n')
    return { success: true }
  }
  return { success: false, error: '任务未运行' }
})

// IPC: 检查任务是否运行中
ipcMain.handle('task:is-running', (_, taskId: string) => {
  return runningTasks.has(taskId)
})
```

**Step 2: Preload 暴露 Task Runner API**

```typescript
// electron/preload.ts - 添加以下内容

contextBridge.exposeInMainWorld('taskAPI', {
  brainstorming: (task: Task) => ipcRenderer.invoke('task:brainstorming', task),
  planning: (task: Task) => ipcRenderer.invoke('task:planning', task),
  execute: (task: Task) => ipcRenderer.invoke('task:execute', task),
  stop: (taskId: string) => ipcRenderer.invoke('task:stop', taskId),
  sendInput: (taskId: string, input: string) => ipcRenderer.invoke('task:input', taskId, input),
  isRunning: (taskId: string) => ipcRenderer.invoke('task:is-running', taskId),
  onOutput: (callback: (data: { taskId: string; data: string }) => void) => {
    ipcRenderer.on('task:output', (_, data) => callback(data))
  }
})
```

**Step 3: 创建渲染进程调用 Hook**

```typescript
// src/composables/useTaskRunner.ts
import type { Task } from '@/types/task'

declare global {
  interface Window {
    taskAPI: {
      brainstorming: (task: Task) => Promise<{ success: boolean; output?: string }>
      planning: (task: Task) => Promise<{ success: boolean; output?: string }>
      execute: (task: Task) => Promise<{ success: boolean }>
      stop: (taskId: string) => Promise<{ success: boolean; error?: string }>
      sendInput: (taskId: string, input: string) => Promise<{ success: boolean; error?: string }>
      isRunning: (taskId: string) => Promise<boolean>
      onOutput: (callback: (data: { taskId: string; data: string }) => void) => void
    }
  }
}

export function useTaskRunner() {
  async function runBrainstorming(task: Task) {
    return window.taskAPI.brainstorming(task)
  }

  async function runPlanning(task: Task) {
    return window.taskAPI.planning(task)
  }

  async function runTask(task: Task) {
    return window.taskAPI.execute(task)
  }

  async function stopTask(taskId: string) {
    return window.taskAPI.stop(taskId)
  }

  async function sendInput(taskId: string, input: string) {
    return window.taskAPI.sendInput(taskId, input)
  }

  function onOutput(callback: (data: { taskId: string; data: string }) => void) {
    window.taskAPI.onOutput(callback)
  }

  return {
    runBrainstorming,
    runPlanning,
    runTask,
    stopTask,
    sendInput,
    onOutput
  }
}
```

**Step 4: Commit**

```bash
git add electron/main.ts electron/preload.ts src/composables/useTaskRunner.ts
git commit -m "feat: add task runner in main process"
```

---

## Task 4b: 终端视图组件

**Files:**
- Create: `src/components/TerminalView.vue`

**Step 1: 创建终端视图组件**

```vue
<!-- src/components/TerminalView.vue -->
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
    // 自动滚动到底部
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
```

**Step 2: Commit**

```bash
git add src/components/TerminalView.vue
git commit -m "feat: add terminal view component"
```

---

## Task 5: 数据持久化 - 任务保存和加载

**Files:**
- Create: `src/services/storage.ts`
- Modify: `src/stores/taskStore.ts`

**Step 1: 创建存储服务**

```typescript
// src/services/storage.ts
import { promises as fs } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { Task, AppSettings } from '@/types/task'

const DATA_FILE = 'tasks.json'
const SETTINGS_FILE = 'settings.json'

async function getDataPath(): Promise<string> {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'data')
}

export async function loadTasks(): Promise<Task[]> {
  try {
    const dataPath = await getDataPath()
    const filePath = join(dataPath, DATA_FILE)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const dataPath = await getDataPath()
  await fs.mkdir(dataPath, { recursive: true })
  const filePath = join(dataPath, DATA_FILE)
  await fs.writeFile(filePath, JSON.stringify(tasks, null, 2))
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const dataPath = await getDataPath()
    const filePath = join(dataPath, SETTINGS_FILE)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { defaultWorkspace: '', theme: 'light' }
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const dataPath = await getDataPath()
  await fs.mkdir(dataPath, { recursive: true })
  const filePath = join(dataPath, SETTINGS_FILE)
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2))
}
```

**Step 2: 更新任务存储集成持久化**

```typescript
// src/stores/taskStore.ts 修改
import { loadTasks, saveTasks, loadSettings, saveSettings } from '@/services/storage'

// 在初始化时加载数据
export async function initTaskStore() {
  tasks.value = await loadTasks()
  settings.value = await loadSettings()
}

// 修改 addTask 等方法后自动保存
function withSave(action: () => void) {
  action()
  saveTasks(tasks.value)
}
```

**Step 3: Commit**

```bash
git add src/services/storage.ts
git commit -m "feat: add data persistence service"
```

---

## Task 6: 添加任务弹窗

**Files:**
- Create: `src/components/AddTaskModal.vue`
- Modify: `src/views/MainView.vue`

**Step 1: 创建添加任务弹窗**

```vue
<!-- src/components/AddTaskModal.vue -->
<template>
  <n-modal v-model:show="show" preset="dialog" title="新建任务">
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item label="任务名称" path="name">
        <n-input v-model:value="form.name" placeholder="输入任务名称" />
      </n-form-item>
      <n-form-item label="工作目录" path="workspace">
        <n-input v-model:value="form.workspace" placeholder="选择工作目录">
          <template #append>
            <n-button @click="selectDir">选择</n-button>
          </template>
        </n-input>
      </n-form-item>
      <n-form-item label="任务描述" path="description">
        <n-input
          v-model:value="form.description"
          type="textarea"
          placeholder="简要描述任务目标"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="show = false">取消</n-button>
      <n-button type="primary" @click="handleSubmit">创建</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, useDialog } from 'naive-ui'
import { useTaskStore } from '@/stores/taskStore'

const show = ref(false)
const formRef = ref()
const taskStore = useTaskStore()

const form = reactive({
  name: '',
  workspace: '',
  description: ''
})

const rules = {
  name: { required: true, message: '请输入任务名称' },
  workspace: { required: true, message: '请选择工作目录' }
}

function selectDir() {
  // 调用 Electron 的 dialog API 选择目录
  // 需要在主进程中实现
}

function handleSubmit() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      const task = taskStore.addTask(form.name, form.workspace)
      task.description = form.description
      show.value = false
      form.name = ''
      form.workspace = ''
      form.description = ''
    }
  })
}

defineExpose({ show })
</script>
```

**Step 2: Commit**

```bash
git add src/components/AddTaskModal.vue
git commit -m "feat: add task creation modal"
```

---

## Task 7: 主进程集成 - Electron IPC

**Files:**
- Modify: `electron/main.ts`
- Create: `electron/preload.ts`

**Step 1: 主进程添加 IPC 处理**

```typescript
// electron/main.ts
import { ipcMain, dialog, BrowserWindow } from 'electron'

// 选择目录
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

// 读取文件
ipcMain.handle('read-file', async (_, filePath: string) => {
  const fs = await import('fs/promises')
  return fs.readFile(filePath, 'utf-8')
})

// 写入文件
ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  const fs = await import('fs/promises')
  await fs.writeFile(filePath, content, 'utf-8')
})

// 打开外部链接
ipcMain.handle('open-external', async (_, url: string) => {
  const { shell } = require('electron')
  await shell.openExternal(url)
})
```

**Step 2: Preload 暴露 API**

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('write-file', filePath, content),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})
```

**Step 3: Commit**

```bash
git add electron/main.ts electron/preload.ts
git commit -m "feat: add electron ipc handlers"
```

---

## 总结

**完成后的功能：**

1. ✅ 任务创建、编辑、重命名
2. ✅ 任务列表 + 搜索过滤
3. ✅ 任务详情 + 文档编辑
4. ✅ 状态自动流转
5. ✅ 执行日志记录
6. ✅ 调用 superpowers 命令运行任务
7. ✅ 终端实时交互
8. ✅ 数据持久化

**后续可扩展：**
- 多工作目录支持
- 任务模板
- 快捷键支持
- 主题切换
- 通知系统

---

Plan complete and saved to `docs/plans/2026-02-24-superpowers-client.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
