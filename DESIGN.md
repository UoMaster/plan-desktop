# Plan Desktop 设计系统

> 瑞士极简主义 × 深色模式
> 面向开发者的生产力工具设计规范

---

## 1. 设计原则

### 1.1 核心理念

| 原则 | 描述 |
|------|------|
| **功能性优先** | 每个元素都应有明确目的，去除装饰性元素 |
| **深度克制** | 使用有限的色彩和间距，保持一致性 |
| **隐式设计巧思** | 通过网格对齐、微妙动画、精准间距体现设计感 |
| **开发者友好** | 深色主题护眼，高对比度确保长时间使用舒适 |

### 1.2 设计关键词

```
极简 (Minimal) · 几何 (Geometric) · 精确 (Precise) · 内敛 (Restrained)
```

---

## 2. 色彩系统

### 2.1 主色调

```css
/* 背景层级 */
--color-bg-base: #0F172A;      /* Slate 900 - 主背景 */
--color-bg-elevated: #1E293B;  /* Slate 800 - 卡片、面板 */
--color-bg-overlay: #334155;   /* Slate 700 - 悬停、边框 */
```

### 2.2 文字色

```css
--color-text-base: #F8FAFC;      /* Slate 50 - 主要文字 */
--color-text-muted: #94A3B8;     /* Slate 400 - 次要文字 */
--color-text-disabled: #64748B;  /* Slate 500 - 禁用文字 */
```

### 2.3 强调色

```css
--color-accent: #22C55E;        /* Emerald 500 - 主强调色 */
--color-accent-hover: #34D399;  /* Emerald 400 - 悬停状态 */
--color-accent-muted: #064E3B;  /* Emerald 900 - 强调背景 */
```

> **设计意图**：Emerald 绿色象征"运行/成功"，与开发者心智模型一致

### 2.4 语义色

```css
--color-error: #EF4444;    /* Red 500 */
--color-warning: #F59E0B;  /* Amber 500 */
--color-info: #3B82F6;     /* Blue 500 */
--color-success: #22C55E;  /* 同强调色 */
```

### 2.5 边框色

```css
--color-border: #334155;       /* Slate 700 - 默认边框 */
--color-border-light: #475569; /* Slate 600 - 悬停边框 */
```

### 2.6 使用规则

| 场景 | 颜色 | 示例 |
|------|------|------|
| 页面背景 | `--color-bg-base` | 整个应用背景 |
| 卡片/面板 | `--color-bg-elevated` | 内容卡片、侧边栏 |
| 主要按钮 | `--color-accent` | 创建、保存、运行 |
| 次要按钮 | transparent + border | 取消、返回 |
| 悬停状态 | `--color-bg-overlay` | 列表项悬停 |
| 选中状态 | `--color-accent-muted` | 选中标签背景 |

---

## 3. 字体系统

### 3.1 字体族

```css
--font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

> **选择理由**：Space Grotesk 具有几何感，适合技术产品；字母间距紧凑，符合瑞士风格

### 3.2 字号规范

| 级别 | 尺寸 | 行高 | 用途 |
|------|------|------|------|
| Display | 48px | 1.1 | 页面标题 |
| H1 | 32px | 1.25 | 区块标题 |
| H2 | 24px | 1.25 | 卡片标题 |
| H3 | 18px | 1.5 | 小标题 |
| Body | 15px | 1.5 | 正文内容 |
| Small | 14px | 1.5 | 辅助文字 |
| Tiny | 12px | 1.5 | 标签、时间戳 |

### 3.3 字重规范

| 字重 | 值 | 用途 |
|------|-----|------|
| Regular | 400 | 正文、描述 |
| Medium | 500 | 按钮文字、标签 |
| Semibold | 600 | 标题、强调 |
| Bold | 700 | 数字、大标题 |

### 3.4 字体模式

```css
/* 瑞士风格大标题 */
.swiss-title {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* 等宽数字标记 */
.mono-index {
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 600;
  color: var(--color-accent);
}

/* 正文 muted */
.text-muted {
  color: var(--color-text-muted);
}
```

---

## 4. 间距系统

### 4.1 基准单位

以 **4px** 为基准，所有间距为其倍数：

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 128px;
```

### 4.2 使用建议

| 场景 | 推荐间距 |
|------|----------|
| 图标与文字之间 | `--space-2` (8px) |
| 表单元素之间 | `--space-3` (12px) |
| 卡片内边距 | `--space-4` (16px) |
| 区块之间 | `--space-6` (32px) |
| 页面垂直间距 | `--space-8` (64px) |
| 大区块分隔 | `--space-10` (128px) |

---

## 5. 圆角规范

### 5.1 圆角值

```css
--radius-none: 0px;   /* 按钮组内部、分割线 */
--radius-sm: 2px;     /* 标签、小按钮 */
--radius-base: 4px;   /* 输入框、按钮 */
--radius-md: 6px;     /* 卡片、弹窗 */
--radius-lg: 8px;     /* 大卡片、模态框 */
```

### 5.2 使用规则

> **原则**：保持克制，接近直角但不过于尖锐

- 卡片/面板：`--radius-md` (6px)
- 按钮/输入框：`--radius-base` (4px)
- 标签/徽章：`--radius-sm` (2px)

---

## 6. 布局系统

### 6.1 12 列网格

```css
.swiss-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}
```

### 6.2 网格间距变体

```css
.swiss-grid-gap-sm { gap: var(--space-2); }  /* 8px - 紧凑 */
.swiss-grid-gap-md { gap: var(--space-4); }  /* 16px - 默认 */
.swiss-grid-gap-lg { gap: var(--space-6); }  /* 32px - 宽松 */
```

### 6.3 列跨度类

```css
.col-1  { grid-column: span 1; }   /* 8.33% */
.col-2  { grid-column: span 2; }   /* 16.67% */
.col-3  { grid-column: span 3; }   /* 25% */
.col-4  { grid-column: span 4; }   /* 33.33% */
.col-6  { grid-column: span 6; }   /* 50% */
.col-8  { grid-column: span 8; }   /* 66.67% */
.col-12 { grid-column: span 12; }  /* 100% */
```

### 6.4 容器规范

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.container-narrow { max-width: 768px; }
.container-wide   { max-width: 1440px; }
```

### 6.5 布局模式示例

```html
<!-- 两栏布局：侧边栏 + 内容 -->
<div class="swiss-grid">
  <div class="col-3"><!-- 侧边栏 --></div>
  <div class="col-9"><!-- 主内容 --></div>
</div>

<!-- 三栏卡片布局 -->
<div class="swiss-grid">
  <div class="col-4"><!-- 卡片 1 --></div>
  <div class="col-4"><!-- 卡片 2 --></div>
  <div class="col-4"><!-- 卡片 3 --></div>
</div>
```

---

## 7. 组件规范

### 7.1 按钮

#### 主要按钮
```css
/* 状态 */
默认:   bg-accent, text-dark, radius-base
悬停:   bg-accent-hover
按下:   opacity 0.9
禁用:   bg-accent-muted, text-muted
```

#### 次要按钮
```css
/* 状态 */
默认:   transparent, border-default, text-base
悬停:   bg-overlay, border-light
按下:   opacity 0.9
```

#### 按钮尺寸

| 尺寸 | 高度 | 内边距 | 用途 |
|------|------|--------|------|
| Tiny | 24px | 0 8px | 图标按钮、标签内 |
| Small | 32px | 0 12px | 紧凑布局 |
| Medium | 40px | 0 16px | 默认 |
| Large | 48px | 0 24px | 主要操作 |

### 7.2 卡片

```css
.card {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

/* 可悬停卡片 */
.card-hover:hover {
  border-color: var(--color-border-light);
  transition: border-color 100ms ease-out;
}
```

### 7.3 输入框

```css
/* 状态 */
默认:   bg-base, border-default, radius-base
悬停:   border-light
聚焦:   border-accent, box-shadow accent-muted
禁用:   bg-elevated, text-disabled
```

### 7.4 标签/徽章

```css
.tag {
  background-color: var(--color-bg-overlay);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-size: 12px;
}

.tag-accent {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
}
```

### 7.5 状态指示器

```css
/* 状态点 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 脉冲动画 */
.status-dot-active {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## 8. 交互规范

### 8.1 过渡时间

```css
--transition-fast: 100ms ease-out;   /* 悬停、状态切换 */
--transition-base: 150ms ease-out;   /* 按钮点击、展开 */
--transition-slow: 200ms ease-out;   /* 模态框、页面切换 */
```

### 8.2 悬停模式

| 元素类型 | 悬停效果 |
|----------|----------|
| 主要按钮 | 背景色变亮 (accent → accent-hover) |
| 次要按钮 | 背景填充 overlay，边框变亮 |
| 卡片 | 边框变亮 (border → border-light) |
| 链接 | 透明度变化 (100% → 80%) |
| 列表项 | 背景填充 overlay |

### 8.3 聚焦状态

```css
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent-muted);
}
```

> **可访问性**：所有交互元素必须可见聚焦状态

### 8.4 微交互动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 上滑进入 */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 脉冲（状态指示器） */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 8.5 减少动画

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. 代码示例

### 9.1 完整页面模板

```vue
<template>
  <div class="app-wrapper">
    <main class="container section-lg">
      <div class="swiss-grid swiss-grid-gap-md">
        <!-- 标题区 -->
        <div class="col-12">
          <h1 class="swiss-title">页面标题</h1>
          <p class="text-muted subtitle">页面描述</p>
        </div>

        <!-- 内容卡片 -->
        <div class="col-6">
          <NCard class="card-hover" title="卡片标题">
            <p class="text-muted">卡片内容</p>
            <NButton type="primary">操作按钮</NButton>
          </NCard>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  background-color: var(--color-bg-base);
}

.swiss-title {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-2) 0;
}

.subtitle {
  font-size: 18px;
  margin: 0 0 var(--space-6) 0;
}
</style>
```

### 9.2 自定义组件模式

```vue
<!-- StatusBadge.vue -->
<template>
  <span class="status-badge">
    <span :class="['status-dot', `status-dot-${type}`, { 'status-dot-active': active }]" />
    <span>{{ label }}</span>
  </span>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'info' }, // info | success | warning | error
  label: { type: String, required: true },
  active: { type: Boolean, default: false }
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
}
</style>
```

---

## 10. 文件结构

```
src/
├── styles/
│   ├── index.css       # 全局样式、工具类
│   └── theme.ts        # naive-ui 主题配置
├── components/
│   └── [组件名]/
│       ├── index.vue   # 组件
│       └── index.css   # 组件样式（可选）
├── App.vue
└── main.ts
```

---

## 11. 检查清单

### 视觉检查

- [ ] 不使用 emoji 作为图标（使用 SVG）
- [ ] 所有图标使用统一图标库（Lucide/Heroicons）
- [ ] 悬停状态使用透明度或边框变化，不引起布局偏移
- [ ] 深色模式文字对比度达到 4.5:1 以上
- [ ] 边框在深色背景下可见

### 交互检查

- [ ] 所有可点击元素有 `cursor: pointer`
- [ ] 悬停状态有视觉反馈
- [ ] 过渡动画在 100-200ms 之间
- [ ] 聚焦状态可见（键盘导航）

### 布局检查

- [ ] 使用 12 列网格系统
- [ ] 响应式：375px / 768px / 1024px / 1440px
- [ ] 无水平滚动条（移动端）
- [ ] 浮动元素有适当的边距

---

## 12. 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2024-02-21 | 1.0 | 初始版本，瑞士极简深色主题 |

---

> **文档维护**：当新增组件或调整样式时，请同步更新本文档
