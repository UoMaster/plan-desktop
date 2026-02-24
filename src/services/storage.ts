import type { Task, AppSettings } from '@/types/task'

const DATA_FILE = 'tasks.json'
const SETTINGS_FILE = 'settings.json'

declare global {
  interface Window {
    electronAPI: {
      // 其他已存在的 API
      getDataPath?: () => Promise<string>
      readFile?: (filePath: string) => Promise<string>
      writeFile?: (filePath: string, content: string) => Promise<void>
    }
  }
}

async function getDataPath(): Promise<string> {
  // 使用 localStorage 作为临时方案
  return ''
}

export async function loadTasks(): Promise<Task[]> {
  try {
    const data = localStorage.getItem(DATA_FILE)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('加载任务失败:', error)
  }
  return []
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    localStorage.setItem(DATA_FILE, JSON.stringify(tasks, null, 2))
  } catch (error) {
    console.error('保存任务失败:', error)
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = localStorage.getItem(SETTINGS_FILE)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
  return { defaultWorkspace: '', theme: 'light' }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}
