# 概览页面重新设计实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在概览页面添加标签页切换功能，支持展示工作目录的文件结构和文件大小。

**Architecture:** 使用 naive-ui 的 NTabs 组件实现内嵌式标签页（概览/文件）。文件树通过 Electron IPC 调用主进程的目录读取功能获取数据。

**Tech Stack:** Vue 3, TypeScript, naive-ui, Electron, Node.js fs

---

## Task 1: 添加 IPC 接口 - 获取目录结构

**Files:**
- Modify: `electron/preload.ts:21-51`
- Modify: `electron/main.ts:1-4` (import), `109-191` (IPC setup)

**Step 1: 在 preload.ts 添加 IPC 接口**

在 `electron/preload.ts` 的 `contextBridge.exposeInMainWorld` 中添加新方法：

```typescript
// 在 contextBridge.exposeInMainWorld 对象中添加
getDirectoryStructure: (path: string): Promise<DirectoryNode[]> =>
  ipcRenderer.invoke('get-directory-structure', path),
```

在文件顶部添加类型定义（在现有 interface 之后）：

```typescript
// 目录树节点
interface DirectoryNode {
  key: string
  label: string
  isLeaf: boolean
  size?: number
  children?: DirectoryNode[]
}
```

在 `declare global` 的 `Window` interface 中添加：

```typescript
getDirectoryStructure: (path: string) => Promise<DirectoryNode[]>
```

**Step 2: 在 main.ts 添加 IPC 处理**

在 `electron/main.ts` 顶部导入所需模块：

```typescript
import { readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
```

在 `setupIPC()` 函数末尾（`exit-to-setup` 处理之后）添加：

```typescript
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
```

**Step 3: 验证编译**

Run: `npm run build`
Expected: 无 TypeScript 编译错误

**Step 4: Commit**

```bash
git add electron/preload.ts electron/main.ts
git commit -m "feat: add IPC for reading directory structure"
```

---

## Task 2: 创建文件树组件

**Files:**
- Create: `src/components/FileTree.vue`

**Step 1: 创建组件文件**

```vue
<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NTree, NSpin, NEmpty, NAlert } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { Folder, FileText } from 'lucide-vue-next'

interface DirectoryNode {
  key: string
  label: string
  isLeaf: boolean
  size?: number
  children?: DirectoryNode[]
}

const props = defineProps<{
  path: string
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const treeData = ref<TreeOption[]>([])

// 将 DirectoryNode 转换为 TreeOption
function convertToTreeOption(node: DirectoryNode): TreeOption {
  return {
    key: node.key,
    label: node.label,
    isLeaf: node.isLeaf,
    children: node.children?.map(convertToTreeOption),
    prefix: () => h(node.isLeaf ? FileText : Folder, {
      size: 16,
      style: {
        marginRight: '6px',
        color: node.isLeaf ? 'var(--color-text-secondary)' : 'var(--color-accent)'
      }
    })
  }
}

async function loadDirectory() {
  if (!props.path) return

  loading.value = true
  error.value = null
  treeData.value = []

  try {
    const result = await window.electronAPI.getDirectoryStructure(props.path)
    if (result.success) {
      treeData.value = result.data.map(convertToTreeOption)
    } else {
      error.value = result.error || '读取目录失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '读取目录失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDirectory()
})
</script>

<template>
  <div class="file-tree">
    <NSpin v-if="loading" :show="loading" description="加载中...">
      <div style="height: 200px;"></div>
    </NSpin>

    <NAlert v-else-if="error" type="error" :show-icon="true">
      {{ error }}
    </NAlert>

    <NEmpty v-else-if="treeData.length === 0" description="暂无文件">
      <template #icon>
        <Folder :size="48" style="opacity: 0.3;" />
      </template>
    </NEmpty>

    <NTree
      v-else
      :data="treeData"
      :default-expand-all="false"
      :expand-on-click="true"
      :selectable="false"
      block-line
      block-node
    />
  </div>
</template>

<style scoped>
.file-tree {
  padding: 8px 0;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.file-tree :deep(.n-tree-node-content) {
  font-size: 14px;
  line-height: 1.6;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/FileTree.vue
git commit -m "feat: create FileTree component for displaying directory structure"
```

---

## Task 3: 修改 MainView.vue 添加标签页

**Files:**
- Modify: `src/views/MainView.vue`

**Step 1: 添加导入**

在 `<script setup>` 顶部添加：

```typescript
import { ref } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { LayoutDashboard, FolderOpen } from 'lucide-vue-next'
import FileTree from '@/components/FileTree.vue'

const activeTab = ref('overview')
```

**Step 2: 修改内容区域**

找到主内容区的 `<n-layout-content>` 部分，将原有内容包裹在 NTabs 中：

```vue
<n-layout-content class="main-content">
  <div class="content-wrapper">
    <n-tabs v-model:value="activeTab" type="line" animated>
      <!-- 概览标签页 -->
      <n-tab-pane name="overview" tab="概览">
        <template #tab>
          <span class="tab-label">
            <LayoutDashboard :size="16" />
            概览
          </span>
        </template>

        <!-- 原有的欢迎卡片和统计卡片 -->
        <div class="overview-content">
          <!-- 欢迎卡片 -->
          <n-card class="welcome-card">
            <!-- ...原有内容... -->
          </n-card>

          <!-- 统计卡片网格 -->
          <div class="stats-grid">
            <!-- ...原有统计卡片... -->
          </div>
        </div>
      </n-tab-pane>

      <!-- 文件标签页 -->
      <n-tab-pane name="files" tab="文件">
        <template #tab>
          <span class="tab-label">
            <FolderOpen :size="16" />
            文件
          </span>
        </template>

        <n-card title="工作目录文件结构" class="files-card">
          <FileTree :path="workspaceInfo.path" />
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</n-layout-content>
```

**Step 3: 添加样式**

在 `<style scoped>` 中添加：

```css
.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.overview-content {
  padding-top: 8px;
}

.files-card {
  margin-top: 8px;
}

.files-card :deep(.n-card-header) {
  font-size: 16px;
  font-weight: 500;
}
```

**Step 4: Commit**

```bash
git add src/views/MainView.vue
git commit -m "feat: add tabs to MainView for overview and files"
```

---

## Task 4: 测试功能

**Files:**
- N/A

**Step 1: 启动开发服务器**

Run: `npm run dev`
Expected: Electron 窗口正常打开

**Step 2: 测试概览标签页**

1. 确认默认显示"概览"标签页
2. 验证欢迎卡片显示正确
3. 验证统计卡片显示正确

**Step 3: 测试文件标签页**

1. 点击"文件"标签页
2. 验证文件树加载成功
3. 验证文件夹可以展开/折叠
4. 验证文件显示大小信息
5. 验证排序正确（文件夹在前，按字母排序）

**Step 4: 测试边界情况**

1. 切换回"概览"再切回"文件"，验证状态保持
2. 检查空目录提示
3. 检查样式符合深色主题

**Step 5: Commit**

```bash
git commit -m "test: verify tabs and file tree functionality" --allow-empty
```

---

## Task 5: 构建验证

**Files:**
- N/A

**Step 1: 运行完整构建**

Run: `npm run build`
Expected: 构建成功，无错误

**Step 2: 验证生产版本**

Run: `npm run preview`
Expected: 生产版本功能正常

**Step 3: Commit**

```bash
git commit -m "build: verify production build passes" --allow-empty
```

---

## 总结

实施完成后，概览页面将具备：
- 两个标签页：概览、文件
- 文件标签页显示工作目录的完整文件树
- 文件大小自动格式化（B/KB/MB/GB）
- 支持展开/折叠文件夹
- 按字母排序，文件夹在前
