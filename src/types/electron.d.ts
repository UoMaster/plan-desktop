// 工作区信息类型
interface WorkspaceInfo {
  name: string
  path: string
}

// 存储的工作区配置
interface StoredWorkspace extends WorkspaceInfo {
  lastOpenedAt: string
}

// 选择目录结果
interface SelectDirectoryResult {
  canceled: boolean
  path: string
}

// 确认工作区结果
interface ConfirmWorkspaceResult {
  success: boolean
  error?: string
}

// 目录树节点
interface DirectoryNode {
  key: string
  label: string
  isLeaf: boolean
  size?: number
  children?: DirectoryNode[]
}

// 获取目录结构结果
interface GetDirectoryStructureResult {
  success: boolean
  data?: DirectoryNode[]
  error?: string
}

// 布局配置
interface LayoutConfig {
  useFixedWidth: boolean
}

// Task 类型
interface TaskDocument {
  brainstorming?: string
  plan?: string
}

interface TaskLogs {
  startTime?: string
  endTime?: string
  result?: 'success' | 'failed'
}

interface Task {
  id: string
  name: string
  description: string
  status: string
  workspaceDir: string
  documents: TaskDocument
  sessionId?: string
  logs: TaskLogs
  createdAt: string
  updatedAt: string
}

declare global {
  interface Window {
    electronAPI: {
      selectDirectory: () => Promise<SelectDirectoryResult>
      confirmWorkspace: (workspaceInfo: WorkspaceInfo) => Promise<ConfirmWorkspaceResult>
      getWindowType: () => Promise<'setup' | 'main' | 'unknown'>
      getSavedWorkspace: () => Promise<StoredWorkspace | null>
      clearWorkspace: () => Promise<void>
      exitToSetup: () => Promise<void>
      getDirectoryStructure: (path: string) => Promise<GetDirectoryStructureResult>
      sendMessage: (message: string) => void
      onMessage: (callback: (message: string) => void) => void

      // 布局配置
      getLayoutConfig: () => Promise<LayoutConfig>
      setLayoutConfig: (config: Partial<LayoutConfig>) => Promise<void>

      // Task Runner API
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
}

export {}
