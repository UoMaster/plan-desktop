export type TaskStatus = 'draft' | 'brainstorming' | 'planning' | 'ready' | 'running' | 'paused' | 'completed' | 'failed' | 'locked'

export interface Task {
  id: string
  name: string
  description: string
  status: TaskStatus
  workspaceDir: string
  documents: {
    brainstorming?: string
    plan?: string
  }
  sessionId?: string
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
