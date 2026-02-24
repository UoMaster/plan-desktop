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
    }
  }
}

export {}
