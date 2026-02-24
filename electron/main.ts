import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import Store from 'electron-store'

// Task 类型定义
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

// Task Runner 类型
interface TaskProcess {
  taskId: string
  proc: ChildProcessWithoutNullStreams | null
}

// 存储运行中的任务
const runningTasks = new Map<string, TaskProcess>()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

// 窗口引用
let setupWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null

// 工作区信息
interface WorkspaceInfo {
  name: string
  path: string
}

// 存储的工作区配置
interface StoredWorkspace extends WorkspaceInfo {
  lastOpenedAt: string
}

// 布局配置
interface LayoutConfig {
  useFixedWidth: boolean
}

// 初始化 electron-store
const store = new Store<{
  workspace: { name: string; path: string; lastOpenedAt: string } | null
  layoutConfig: LayoutConfig
}>({
  defaults: {
    workspace: null,
    layoutConfig: {
      useFixedWidth: true  // 默认启用版心
    }
  }
})

// 创建 Setup 窗口
function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 520,
    height: 580,
    resizable: false,
    maximizable: false,
    minimizable: true,
    show: false,
    center: true,
    title: '设置工作区',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 加载页面时带上查询参数标记为 setup 窗口
  if (isDev) {
    setupWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL!}?window=setup`)
  } else {
    setupWindow.loadFile(join(__dirname, '../dist/index.html'), {
      query: { window: 'setup' }
    })
  }

  setupWindow.once('ready-to-show', () => {
    setupWindow?.show()
  })

  setupWindow.on('closed', () => {
    setupWindow = null
  })
}

// 创建主窗口
function createMainWindow(workspaceInfo: WorkspaceInfo) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    center: true,
    title: `${workspaceInfo.name} - Plan Desktop`,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 加载页面时带上工作区信息
  const query = new URLSearchParams({
    window: 'main',
    workspaceName: workspaceInfo.name,
    workspacePath: workspaceInfo.path
  }).toString()

  if (isDev) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL!}?${query}`)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow?.loadFile(join(__dirname, '../dist/index.html'), {
      query: Object.fromEntries(new URLSearchParams(query))
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC 处理
function setupIPC() {
  // 选择目录
  ipcMain.handle('select-directory', async () => {
    if (!setupWindow) return { canceled: true, path: '' }

    const result = await dialog.showOpenDialog(setupWindow, {
      properties: ['openDirectory'],
      title: '选择工作目录'
    })

    return {
      canceled: result.canceled,
      path: result.filePaths[0] || ''
    }
  })

  // 确认工作区设置
  ipcMain.handle('confirm-workspace', async (_, workspaceInfo: WorkspaceInfo) => {
    try {
      // 验证路径存在
      if (!workspaceInfo.path) {
        return { success: false, error: '工作目录路径不能为空' }
      }

      // 创建 .plan-claude 标记目录
      const markerDir = join(workspaceInfo.path, '.plan-claude')
      mkdirSync(markerDir, { recursive: true })

      // 保存到 store
      store.set('workspace', {
        ...workspaceInfo,
        lastOpenedAt: new Date().toISOString()
      })

      // 关闭 setup 窗口
      setupWindow?.close()
      setupWindow = null

      // 创建主窗口
      createMainWindow(workspaceInfo)

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '初始化工作目录失败'
      return { success: false, error: `创建工作区标记失败：${errorMessage}` }
    }
  })

  // 获取窗口类型
  ipcMain.handle('get-window-type', (event) => {
    const sender = event.sender
    if (sender === setupWindow?.webContents) {
      return 'setup'
    }
    if (sender === mainWindow?.webContents) {
      return 'main'
    }
    return 'unknown'
  })

  // 获取保存的工作区
  ipcMain.handle('get-saved-workspace', () => {
    const workspace = store.get('workspace')
    return workspace || null
  })

  // 清除保存的工作区
  ipcMain.handle('clear-workspace', () => {
    store.delete('workspace')
  })

  // 退出到 setup 窗口
  ipcMain.handle('exit-to-setup', () => {
    // 清除保存的工作区
    store.delete('workspace')
    // 关闭主窗口
    mainWindow?.close()
    mainWindow = null
    // 创建 setup 窗口
    createSetupWindow()
  })

  // 目录树节点类型
  interface DirectoryNode {
    key: string
    label: string
    isLeaf: boolean
    size?: number
    children?: DirectoryNode[]
  }

  // 格式化文件大小
  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i]
  }

  // 递归读取目录结构
  async function readDirectoryStructure(dirPath: string): Promise<DirectoryNode[]> {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const nodes: DirectoryNode[] = []

    // 分离文件夹和文件
    const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))
    const files = entries.filter(e => e.isFile()).sort((a, b) => a.name.localeCompare(b.name))

    // 先处理文件夹
    for (const dir of dirs) {
      const fullPath = join(dirPath, dir.name)
      const key = fullPath
      try {
        const children = await readDirectoryStructure(fullPath)
        nodes.push({
          key,
          label: dir.name,
          isLeaf: false,
          children
        })
      } catch {
        // 无权限访问的目录，跳过
      }
    }

    // 再处理文件
    for (const file of files) {
      const fullPath = join(dirPath, file.name)
      const key = fullPath
      try {
        const stats = await stat(fullPath)
        nodes.push({
          key,
          label: `${file.name} (${formatSize(stats.size)})`,
          isLeaf: true,
          size: stats.size
        })
      } catch {
        // 无权限访问的文件，跳过
      }
    }

    return nodes
  }

  // 获取目录结构 IPC
  ipcMain.handle('get-directory-structure', async (_, dirPath: string) => {
    try {
      const structure = await readDirectoryStructure(dirPath)
      return { success: true, data: structure }
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取目录失败'
      return { success: false, error: message }
    }
  })

  // 获取布局配置
  ipcMain.handle('get-layout-config', () => {
    return store.get('layoutConfig')
  })

  // 设置布局配置
  ipcMain.handle('set-layout-config', (_, config: Partial<LayoutConfig>) => {
    const current = store.get('layoutConfig')
    store.set('layoutConfig', { ...current, ...config })
  })

  // ===== Task Runner IPC 处理 =====

  // IPC: 启动脑暴
  ipcMain.handle('task:brainstorming', async (event, task: Task) => {
    const prompt = task.description || task.name

    const proc = spawn('claude', [
      '-p',
      `使用 /bmad-brainstorming skill，主题是：${prompt}`
    ], {
      cwd: task.workspaceDir,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const taskProc: TaskProcess = {
      taskId: task.id,
      proc
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
          resolve({ success: true, output })
        } else {
          reject(new Error(`脑暴失败，退出码: ${code}`))
        }
      })

      proc.on('error', (err) => {
        runningTasks.delete(task.id)
        reject(err)
      })
    })
  })

  // IPC: 启动设计
  ipcMain.handle('task:planning', async (event, task: Task) => {
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
      proc
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
          resolve({ success: true, output })
        } else {
          reject(new Error(`设计失败，退出码: ${code}`))
        }
      })

      proc.on('error', (err) => {
        runningTasks.delete(task.id)
        reject(err)
      })
    })
  })

  // IPC: 启动执行
  ipcMain.handle('task:execute', async (event, task: Task) => {
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
      proc
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
        if (code === 0) {
          resolve({ success: true })
        } else {
          reject(new Error(`执行失败，退出码: ${code}`))
        }
      })

      proc.on('error', (err) => {
        runningTasks.delete(task.id)
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
      return { success: true }
    }
    return { success: false, error: '任务未运行' }
  })

  // IPC: 发送输入
  ipcMain.handle('task:input', async (_, taskId: string, input: string) => {
    const taskProc = runningTasks.get(taskId)
    if (taskProc?.proc?.stdin) {
      taskProc.proc.stdin.write(input + '\n')
      return { success: true }
    }
    return { success: false, error: '任务未运行' }
  })

  // IPC: 检查任务是否运行中
  ipcMain.handle('task:is-running', (_, taskId: string) => {
    return runningTasks.has(taskId)
  })
}

app.whenReady().then(() => {
  setupIPC()

  // 检查是否有保存的工作区
  const savedWorkspace = store.get('workspace') as WorkspaceInfo | undefined

  if (savedWorkspace) {
    // 有保存的工作区，直接打开主窗口
    createMainWindow(savedWorkspace)
  } else {
    // 没有保存的工作区，显示 setup 窗口
    createSetupWindow()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // 重新激活时也检查是否有保存的工作区
      const savedWorkspace = store.get('workspace') as WorkspaceInfo | undefined
      if (savedWorkspace) {
        createMainWindow(savedWorkspace)
      } else {
        createSetupWindow()
      }
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
