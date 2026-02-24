const { contextBridge, ipcRenderer } = require('electron')

// 工作区信息类型
interface WorkspaceInfo {
  name: string
  path: string
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

contextBridge.exposeInMainWorld('electronAPI', {
  // 选择目录
  selectDirectory: (): Promise<SelectDirectoryResult> =>
    ipcRenderer.invoke('select-directory'),

  // 确认工作区设置
  confirmWorkspace: (workspaceInfo: WorkspaceInfo): Promise<ConfirmWorkspaceResult> =>
    ipcRenderer.invoke('confirm-workspace', workspaceInfo),

  // 获取窗口类型
  getWindowType: (): Promise<'setup' | 'main' | 'unknown'> =>
    ipcRenderer.invoke('get-window-type'),

  // 获取保存的工作区
  getSavedWorkspace: (): Promise<WorkspaceInfo | null> =>
    ipcRenderer.invoke('get-saved-workspace'),

  // 清除保存的工作区
  clearWorkspace: (): Promise<void> =>
    ipcRenderer.invoke('clear-workspace'),

  // 退出到 setup 窗口
  exitToSetup: (): Promise<void> =>
    ipcRenderer.invoke('exit-to-setup'),

  // 获取目录结构
  getDirectoryStructure: (path: string): Promise<GetDirectoryStructureResult> =>
    ipcRenderer.invoke('get-directory-structure', path),

  // 保留原有 API 供扩展使用
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('message', (_event: unknown, message: string) => callback(message))
  },

  // 布局配置
  getLayoutConfig: (): Promise<LayoutConfig> =>
    ipcRenderer.invoke('get-layout-config'),
  setLayoutConfig: (config: Partial<LayoutConfig>): Promise<void> =>
    ipcRenderer.invoke('set-layout-config', config),

  // Task Runner API
  taskAPI: {
    brainstorming: (task: unknown) => ipcRenderer.invoke('task:brainstorming', task),
    planning: (task: unknown) => ipcRenderer.invoke('task:planning', task),
    execute: (task: unknown) => ipcRenderer.invoke('task:execute', task),
    stop: (taskId: string) => ipcRenderer.invoke('task:stop', taskId),
    sendInput: (taskId: string, input: string) => ipcRenderer.invoke('task:input', taskId, input),
    isRunning: (taskId: string) => ipcRenderer.invoke('task:is-running', taskId),
    onOutput: (callback: (data: { taskId: string; data: string }) => void) => {
      ipcRenderer.on('task:output', (_event: unknown, data: { taskId: string; data: string }) => callback(data))
    }
  }
})

export {}
