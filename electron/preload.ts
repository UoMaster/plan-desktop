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
    ipcRenderer.on('message', (_, message) => callback(message))
  }
})

declare global {
  interface Window {
    electronAPI: {
      selectDirectory: () => Promise<SelectDirectoryResult>
      confirmWorkspace: (workspaceInfo: WorkspaceInfo) => Promise<ConfirmWorkspaceResult>
      getWindowType: () => Promise<'setup' | 'main' | 'unknown'>
      getSavedWorkspace: () => Promise<WorkspaceInfo | null>
      clearWorkspace: () => Promise<void>
      exitToSetup: () => Promise<void>
      getDirectoryStructure: (path: string) => Promise<GetDirectoryStructureResult>
      sendMessage: (message: string) => void
      onMessage: (callback: (message: string) => void) => void
    }
  }
}
