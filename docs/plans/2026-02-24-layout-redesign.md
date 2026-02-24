# 布局重构实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将侧边栏布局改为顶部菜单形式，并添加版心显示配置开关（通过 electron-store 持久化）

**Architecture:** 使用 Electron IPC 在主进程存储布局配置，渲染进程通过 preload 暴露的 API 读写配置。MainView 组件根据配置动态切换内容区域的 CSS 类。

**Tech Stack:** Vue 3, TypeScript, Electron, naive-ui, electron-store

---

## 前置信息

### 关键文件路径
- 主进程: `electron/main.ts`
- Preload: `electron/preload.ts`
- 类型定义: `src/types/electron.d.ts`
- 主视图: `src/views/MainView.vue`
- 设计文档: `docs/plans/2026-02-24-layout-redesign-design.md`

### 设计规范 (DESIGN.md)
- 色彩: Slate 深色主题 (#0F172A 背景, #1E293B  elevated)
- 顶部栏高度: 64px
- 版心宽度: 1280px
- 间距基准: 4px
- 边框色: #334155 (Slate 700)

---

## Task 1: 更新类型定义

**Files:**
- Modify: `src/types/electron.d.ts`

**Step 1: 添加 LayoutConfig 接口和更新 ElectronAPI**

在 `src/types/electron.d.ts` 中添加：

```typescript
interface LayoutConfig {
  useFixedWidth: boolean
}

interface ElectronAPI {
  selectDirectory(): Promise<{ canceled: boolean; path?: string }>
  confirmWorkspace(workspace: { name: string; path: string }): Promise<{ success: boolean; error?: string }>
  exitToSetup(): Promise<void>
  getSavedWorkspace(): Promise<{ name: string; path: string; lastOpenedAt: string } | null>

  // 新增：布局配置
  getLayoutConfig(): Promise<LayoutConfig>
  setLayoutConfig(config: Partial<LayoutConfig>): Promise<void>
}
```

**Step 2: 验证类型无错误**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/types/electron.d.ts
git commit -m "types: 添加 LayoutConfig 类型和 IPC 接口"
```

---

## Task 2: 更新 Preload 脚本

**Files:**
- Modify: `electron/preload.ts`

**Step 1: 添加 IPC 调用**

在 `electron/preload.ts` 中，在已有的 `contextBridge.exposeInMainWorld` 调用中添加：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 已有方法

  // 布局配置
  getLayoutConfig: () => ipcRenderer.invoke('get-layout-config'),
  setLayoutConfig: (config: Partial<LayoutConfig>) => ipcRenderer.invoke('set-layout-config', config)
})
```

**Step 2: 验证构建**

Run: `npm run electron:dev`
Expected: 启动无错误

**Step 3: Commit**

```bash
git add electron/preload.ts
git commit -m "feat(preload): 暴露布局配置 IPC 接口"
```

---

## Task 3: 更新主进程

**Files:**
- Modify: `electron/main.ts`

**Step 1: 定义 layoutConfig schema**

在 Store schema 中添加：

```typescript
const store = new Store<{
  workspace: { name: string; path: string; lastOpenedAt: string } | null
  layoutConfig: { useFixedWidth: boolean }
}>({
  defaults: {
    workspace: null,
    layoutConfig: {
      useFixedWidth: true  // 默认启用版心
    }
  }
})
```

**Step 2: 注册 IPC handlers**

在 `ipcMain.handle` 注册区域添加：

```typescript
// 获取布局配置
ipcMain.handle('get-layout-config', () => {
  return store.get('layoutConfig')
})

// 设置布局配置
ipcMain.handle('set-layout-config', (_, config) => {
  const current = store.get('layoutConfig')
  store.set('layoutConfig', { ...current, ...config })
})
```

**Step 3: 验证构建**

Run: `npm run electron:dev`
Expected: 启动无错误，控制台无 IPC 错误

**Step 4: Commit**

```bash
git add electron/main.ts
git commit -m "feat(main): 添加布局配置 IPC 处理器和存储"
```

---

## Task 4: 重构 MainView 布局 - 添加顶部导航

**Files:**
- Modify: `src/views/MainView.vue`

**Step 1: 更新 imports**

添加 `NSwitch` 和 `Settings` 图标导入：

```typescript
import {
  // ... 已有 imports
  NSwitch,
  NTooltip
} from 'naive-ui'
import {
  // ... 已有 icons
  Settings,
  Maximize2
} from 'lucide-vue-next'
```

**Step 2: 添加配置状态**

在 script setup 中添加：

```typescript
// 布局配置
const useFixedWidth = ref(true)
const isLoadingConfig = ref(true)

// 页面加载时读取配置
onMounted(async () => {
  try {
    const config = await window.electronAPI.getLayoutConfig()
    useFixedWidth.value = config.useFixedWidth
  } catch (error) {
    console.error('读取布局配置失败:', error)
  } finally {
    isLoadingConfig.value = false
  }
})

// 切换版心设置
async function toggleFixedWidth(value: boolean) {
  useFixedWidth.value = value
  try {
    await window.electronAPI.setLayoutConfig({ useFixedWidth: value })
  } catch (error) {
    console.error('保存布局配置失败:', error)
  }
}
```

**Step 3: Commit 中间状态**

```bash
git add src/views/MainView.vue
git commit -m "feat(MainView): 添加布局配置状态管理"
```

---

## Task 5: 重构 MainView 布局 - 替换为顶部导航

**Files:**
- Modify: `src/views/MainView.vue`

**Step 1: 替换模板结构**

将现有的侧边栏布局替换为顶部导航：

```vue
<template>
  <div class="main-wrapper">
    <NLayout class="main-layout">
      <!-- 顶部导航栏 -->
      <NLayoutHeader bordered class="top-header">
        <div class="header-left">
          <!-- Logo/工作区名称 -->
          <div class="header-brand">
            <div class="workspace-icon">
              <FolderOpen :size="20" />
            </div>
            <span class="workspace-name">
              {{ workspaceInfo?.name || '工作区' }}
            </span>
          </div>

          <!-- 水平导航菜单 -->
          <NMenu
            mode="horizontal"
            :options="menuOptions"
            :value="activeMenuKey"
            @update:value="handleMenuUpdate"
            class="header-menu"
          />
        </div>

        <div class="header-right">
          <NSpace align="center">
            <NTag size="small" type="success">
              <template #icon>
                <NIcon><Clock /></NIcon>
              </template>
              运行中
            </NTag>

            <!-- 设置下拉菜单 -->
            <NDropdown
              :options="dropdownOptions"
              @select="handleDropdownSelect"
              placement="bottom-end"
            >
              <NButton quaternary circle>
                <template #icon>
                  <NIcon><Settings /></NIcon>
                </template>
              </NButton>
            </NDropdown>
          </NSpace>
        </div>
      </NLayoutHeader>

      <!-- 内容区域 -->
      <NLayoutContent
        :class="['content-body', useFixedWidth ? 'content-fixed-width' : 'content-fluid']"
      >
        <!-- 保留原有内容 -->
        <div class="content-inner">
          <!-- 原有 NTabs 内容 -->
        </div>
      </NLayoutContent>
    </NLayout>
  </div>
</template>
```

**Step 2: 更新下拉菜单选项**

将 `dropdownOptions` 改为函数返回的选项，添加版心开关：

```typescript
// 下拉菜单选项
const dropdownOptions = computed(() => [
  {
    key: 'toggle-fixed-width',
    type: 'render',
    render: () => h(
      'div',
      {
        style: 'display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: default;',
        onClick: (e: Event) => e.stopPropagation()
      },
      [
        h('span', { style: 'margin-right: 16px;' }, '按版心显示'),
        h(NSwitch, {
          value: useFixedWidth.value,
          onUpdateValue: toggleFixedWidth,
          size: 'small'
        })
      ]
    )
  },
  {
    key: 'divider',
    type: 'divider'
  },
  {
    label: '退出当前工作目录',
    key: 'exit-workspace'
  }
])
```

**Step 3: Commit**

```bash
git add src/views/MainView.vue
git commit -m "feat(MainView): 重构为顶部导航布局"
```

---

## Task 6: 更新 MainView 样式

**Files:**
- Modify: `src/views/MainView.vue`

**Step 1: 替换样式部分**

将 `<style scoped>` 内容替换为：

```vue
<style scoped>
.main-wrapper {
  height: 100vh;
  background-color: var(--color-bg-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-layout {
  flex: 1;
  min-height: 0;
}

/* 顶部导航栏 */
.top-header {
  height: 64px;
  background-color: var(--color-bg-elevated) !important;
  border-bottom: 1px solid var(--color-border) !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.workspace-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-base);
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workspace-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-menu {
  background-color: transparent !important;
  --n-item-color-hover: var(--color-bg-overlay) !important;
  --n-item-color-active: var(--color-accent-muted) !important;
  --n-item-text-color: var(--color-text-muted) !important;
  --n-item-text-color-hover: var(--color-text-base) !important;
  --n-item-text-color-active: var(--color-accent) !important;
  --n-item-icon-color: var(--color-text-muted) !important;
  --n-item-icon-color-hover: var(--color-text-base) !important;
  --n-item-icon-color-active: var(--color-accent) !important;
  --n-item-height: 40px !important;
  --n-item-border-radius: var(--radius-base) !important;
}

/* 内容区域 */
.content-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.content-fixed-width {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-5);
}

.content-fluid {
  width: 100%;
  padding: var(--space-5);
}

.content-inner {
  max-width: 100%;
}

/* 保留原有的统计卡片、欢迎卡片等样式 */
/* ... 保留原有未修改的样式 ... */
</style>
```

**Step 2: 验证构建**

Run: `npm run electron:dev`
Expected: 启动无错误，界面显示顶部导航

**Step 3: Commit**

```bash
git add src/views/MainView.vue
git commit -m "style(MainView): 更新顶部导航和内容区域样式"
```

---

## Task 7: 功能测试

**Files:**
- 无需修改，仅测试

**Step 1: 启动应用测试**

Run: `npm run electron:dev`

**Step 2: 测试清单**

- [ ] 侧边栏已消失，顶部出现水平导航栏
- [ ] Logo 和工作区名称显示在左侧
- [ ] 菜单项（概览）可正常切换
- [ ] 设置按钮在右上角
- [ ] 点击设置按钮显示下拉菜单
- [ ] 下拉菜单中有"按版心显示"开关
- [ ] 开关默认为开启状态
- [ ] 内容区域默认居中（max-width: 1280px）
- [ ] 关闭开关后内容区域变为全宽
- [ ] 重新打开开关恢复版心模式
- [ ] 重启应用后保持上次设置

**Step 3: 修复发现的问题（如有）**

根据测试结果修复问题。

**Step 4: Commit 修复**

```bash
git add .
git commit -m "fix: 修复布局测试中发现的问题"
```

---

## 完成检查清单

- [x] 类型定义已更新
- [x] Preload 脚本已更新
- [x] 主进程 IPC 处理器已添加
- [x] MainView 布局已重构为顶部导航
- [x] 版心配置开关已实现
- [x] 配置通过 electron-store 持久化
- [x] 样式遵循 DESIGN.md 规范
- [x] 所有功能测试通过

---

## 相关文档

- 设计文档: `docs/plans/2026-02-24-layout-redesign-design.md`
- naive-ui 文档: https://www.naiveui.com/
- electron-store: https://github.com/sindresorhus/electron-store
