# 工作目录初始化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 setup 窗口点击确认时，在工作目录创建 .plan-claude 标记文件夹

**Architecture:** 在 `confirm-workspace` IPC 处理器中，使用 Node.js `fs.mkdirSync` 创建文件夹（`recursive: true` 和 `existOk` 语义），更新返回类型以包含错误信息，并在前端展示错误提示

**Tech Stack:** Electron IPC, Node.js fs module, Vue 3 + naive-ui

---

### Task 1: 更新 IPC 返回类型定义

**Files:**
- Modify: `electron/preload.ts:16-18`
- Modify: `electron/preload.ts:50-55`

**Step 1: 更新 ConfirmWorkspaceResult 接口**

在 `electron/preload.ts` 中修改接口，添加可选的 error 字段：

```typescript
// 确认工作区结果
interface ConfirmWorkspaceResult {
  success: boolean
  error?: string
}
```

**Step 2: 更新全局 Window 接口中的类型**

确保 global interface 中的类型一致：

```typescript
confirmWorkspace: (workspaceInfo: WorkspaceInfo) => Promise<ConfirmWorkspaceResult>
```

**Step 3: Commit**

```bash
git add electron/preload.ts
git commit -m "feat: add error field to ConfirmWorkspaceResult type"
```

---

### Task 2: 实现主进程文件夹创建逻辑

**Files:**
- Modify: `electron/main.ts:1-5`（添加 fs 导入）
- Modify: `electron/main.ts:125-141`（修改 confirm-workspace 处理器）

**Step 1: 添加 fs 模块导入**

在文件顶部添加：

```typescript
import { mkdirSync } from 'fs'
import { join } from 'path'
```

**Step 2: 修改 confirm-workspace 处理器**

将现有的处理器替换为：

```typescript
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
```

**Step 3: 编译检查**

Run: `npm run build`
Expected: 编译成功，无 TypeScript 错误

**Step 4: Commit**

```bash
git add electron/main.ts
git commit -m "feat: create .plan-claude marker directory on workspace confirmation"
```

---

### Task 3: 更新前端错误处理

**Files:**
- Modify: `src/views/SetupView.vue:90-115`
- Modify: `src/views/SetupView.vue:73-87`

**Step 1: 修改 handleConfirm 函数**

将现有的 handleConfirm 函数替换为：

```typescript
// 确认创建
async function handleConfirm() {
  // 验证
  if (!workspaceName.value.trim()) {
    message.error('请输入工作区名称')
    return
  }
  if (!workspacePath.value.trim()) {
    message.error('请选择工作目录')
    return
  }

  loading.value = true
  try {
    // 通知主进程确认工作区
    const result = await window.electronAPI.confirmWorkspace({
      name: workspaceName.value.trim(),
      path: workspacePath.value.trim()
    })

    // 处理失败情况
    if (!result.success) {
      message.error(result.error || '创建工作区失败')
      loading.value = false
      return
    }

    // 成功：主进程会关闭此窗口并创建新窗口
  } catch (error) {
    message.error('创建失败，请重试')
    console.error(error)
    loading.value = false
  }
}
```

**Step 2: 修改 handleUseSavedWorkspace 函数**

同样更新使用上次工作区的函数：

```typescript
// 使用上次工作区
async function handleUseSavedWorkspace() {
  if (!savedWorkspace.value) return

  loading.value = true
  try {
    const result = await window.electronAPI.confirmWorkspace({
      name: savedWorkspace.value.name,
      path: savedWorkspace.value.path
    })

    if (!result.success) {
      message.error(result.error || '加载工作区失败')
      loading.value = false
      return
    }
  } catch (error) {
    message.error('加载工作区失败')
    console.error(error)
    loading.value = false
  }
}
```

**Step 3: Commit**

```bash
git add src/views/SetupView.vue
git commit -m "feat: handle workspace initialization errors in UI"
```

---

### Task 4: 手动测试验证

**测试场景 1: 正常创建**

1. 启动应用：`npm run dev`
2. 选择一个新的空目录
3. 点击"确认并开始"
4. 验证：检查该目录下是否创建了 `.plan-claude` 文件夹

**测试场景 2: 目录已存在**

1. 手动在目录中创建 `.plan-claude` 文件夹
2. 在应用中选择该目录
3. 点击"确认并开始"
4. 验证：应该正常启动，无错误提示

**测试场景 3: 权限不足（macOS/Linux）**

1. 创建一个只读目录：`mkdir -p /tmp/readonly-test && chmod 555 /tmp/readonly-test`
2. 选择该目录
3. 点击"确认并开始"
4. 验证：应该显示错误提示"创建工作区标记失败..."，setup 窗口保持打开

**Step: Commit test verification**

```bash
git commit --allow-empty -m "test: verify workspace initialization works correctly"
```

---

## 验证清单

- [ ] `.plan-claude` 文件夹在用户确认后自动创建
- [ ] 文件夹已存在时静默继续，不报错
- [ ] 权限不足时显示友好的错误提示
- [ ] 错误时 setup 窗口保持打开，用户可修改后重试
