# 布局重构设计文档

> 将侧边栏布局改为顶部菜单形式，并添加版心显示配置开关

---

## 1. 背景

当前 MainView 使用侧边栏（左侧导航）布局。本次设计将其改为顶部水平导航菜单形式，并提供一个配置开关让用户选择内容区域是否按照固定版心（1280px）显示。

---

## 2. 目标

1. 将侧边栏布局改为顶部菜单导航
2. 添加"内容区域按版心显示"配置开关，默认开启
3. 配置通过 electron-store 持久化保存
4. 遵循 DESIGN.md 设计规范

---

## 3. 架构设计

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 主进程                       │
│                   (electron/main.ts)                     │
│  ┌─────────────────┐  ┌──────────────────────────┐      │
│  │  electron-store │  │  IPC Handlers            │      │
│  │  - layoutConfig │  │  - get-layout-config     │      │
│  │    - useFixedWidth│  │  - set-layout-config     │      │
│  │      (boolean)  │  │                          │      │
│  └─────────────────┘  └──────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↑↓ IPC
┌─────────────────────────────────────────────────────────┐
│                    Electron 渲染进程                     │
│              (src/views/MainView.vue)                   │
│  ┌─────────────────┐  ┌──────────────────────────┐      │
│  │ 顶部导航菜单栏   │  │    内容区域               │      │
│  │ ┌─────────────┐ │  │  ┌─────────────────────┐ │      │
│  │ │ Logo  菜单项 │ │  │  │ 版心模式: max-width │ │      │
│  │ └─────────────┘ │  │  │ 全宽模式: 100%      │ │      │
│  └─────────────────┘  │  └─────────────────────┘ │      │
│                       │                           │      │
│  ┌───────────────────────────────────────────────┐      │
│  │ 设置按钮 → 下拉菜单 → "内容区域按版心显示"开关  │      │
│  └───────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 3.2 数据流

```
初始化流程:
MainView 挂载
  → window.electronAPI.getLayoutConfig()
  → IPC 到主进程
  → electron-store 读取
  → 返回 useFixedWidth (默认 true)
  → 应用到 CSS 类

切换流程:
用户点击开关
  → window.electronAPI.setLayoutConfig({ useFixedWidth: boolean })
  → IPC 到主进程
  → electron-store 保存
  → 更新 MainView 状态
  → CSS 类切换
```

---

## 4. 组件设计

### 4.1 布局结构

```vue
<NLayout>
  <!-- 顶部导航栏 -->
  <NLayoutHeader class="top-header">
    <div class="header-left">
      <Logo />
      <NMenu mode="horizontal" :options="menuOptions" />
    </div>
    <div class="header-right">
      <NDropdown>
        <NButton>
          <SettingsIcon />
        </NButton>
        <!-- 下拉菜单包含版心开关 -->
      </NDropdown>
    </div>
  </NLayoutHeader>

  <!-- 内容区域 -->
  <NLayoutContent :class="{ 'fixed-width': useFixedWidth }">
    <router-view />
  </NLayoutContent>
</NLayout>
```

### 4.2 CSS 样式

```css
/* 顶部导航栏 */
.top-header {
  height: 64px;
  background-color: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

/* 版心模式（默认） */
.content-fixed-width {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

/* 全宽模式 */
.content-fluid {
  width: 100%;
  padding: 24px;
}
```

---

## 5. 接口设计

### 5.1 类型定义

```typescript
// src/types/electron.d.ts

interface LayoutConfig {
  useFixedWidth: boolean  // 默认 true
}

interface ElectronAPI {
  // ... 已有方法

  // 布局配置
  getLayoutConfig(): Promise<LayoutConfig>
  setLayoutConfig(config: Partial<LayoutConfig>): Promise<void>
}
```

### 5.2 IPC 通道

| 通道名 | 方向 | 参数 | 返回值 |
|--------|------|------|--------|
| `get-layout-config` | invoke | - | `LayoutConfig` |
| `set-layout-config` | invoke | `Partial<LayoutConfig>` | `void` |

---

## 6. 实现清单

### 6.1 主进程 (electron/main.ts)
- [ ] 初始化 electron-store 的 `layoutConfig` schema
- [ ] 注册 `get-layout-config` IPC handler
- [ ] 注册 `set-layout-config` IPC handler

### 6.2 Preload (electron/preload.ts)
- [ ] 添加 `getLayoutConfig()` 到 contextBridge
- [ ] 添加 `setLayoutConfig()` 到 contextBridge

### 6.3 类型定义 (src/types/electron.d.ts)
- [ ] 添加 `LayoutConfig` 接口
- [ ] 更新 `ElectronAPI` 接口

### 6.4 主视图 (src/views/MainView.vue)
- [ ] 移除 `NLayoutSider` 侧边栏
- [ ] 添加顶部 `NLayoutHeader` 导航栏
- [ ] 添加设置下拉菜单（包含 `NSwitch` 版心开关）
- [ ] 添加内容区域版心/全宽样式切换逻辑
- [ ] 在 `onMounted` 中读取保存的配置

---

## 7. 设计规范遵循

- [x] 使用 DESIGN.md 定义的色彩系统（Slate 深色主题）
- [x] 顶部导航栏高度 64px
- [x] 版心宽度 1280px
- [x] 使用 naive-ui 的 `NSwitch` 组件
- [x] 间距使用 4px 基准系统
- [x] 不使用 emoji，使用 Lucide 图标

---

## 8. 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-24 | 1.0 | 初始设计文档 |
