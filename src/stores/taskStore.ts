import { ref, computed } from 'vue'
import type { Task, TaskStatus, AppSettings } from '@/types/task'
import { loadTasks, saveTasks } from '@/services/storage'

const tasks = ref<Task[]>([])
const currentTaskId = ref<string | null>(null)
const settings = ref<AppSettings>({
  defaultWorkspace: '',
  theme: 'light'
})

// 初始化数据
export async function initTaskStore() {
  try {
    tasks.value = await loadTasks()
  } catch (error) {
    console.error('初始化任务存储失败:', error)
  }
}

// 自动保存
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function debounceSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveTasks(tasks.value)
  }, 500)
}

export function useTaskStore() {
  const currentTask = computed(() =>
    tasks.value.find(t => t.id === currentTaskId.value)
  )

  const taskList = computed(() => tasks.value)

  const tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      draft: [],
      brainstorming: [],
      planning: [],
      ready: [],
      running: [],
      paused: [],
      completed: [],
      failed: [],
      locked: []
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
    debounceSave()
    return task
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()
      debounceSave()
    }
  }

  function deleteTask(id: string) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index > -1) {
      tasks.value.splice(index, 1)
      debounceSave()
    }
  }

  function updateTask(id: string, updates: Partial<Task>) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      Object.assign(task, updates)
      task.updatedAt = new Date().toISOString()
      debounceSave()
    }
  }

  function setTasks(newTasks: Task[]) {
    tasks.value = newTasks
  }

  function setCurrentTaskId(id: string | null) {
    currentTaskId.value = id
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
    deleteTask,
    updateTask,
    setTasks,
    setCurrentTaskId
  }
}
