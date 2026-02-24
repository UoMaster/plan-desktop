<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute } from 'vue-router'
import { animate } from 'animejs'
import {
  NButton,
  NCard,
  NSpace,
  NTag,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NIcon,
  NDropdown,
  NTabs,
  NTabPane,
  NSwitch,
  useMessage
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  FolderOpen,
  LayoutDashboard,
  Clock,
  Settings
} from 'lucide-vue-next'
import FileTree from '@/components/FileTree.vue'

const activeTab = ref('overview')

interface WorkspaceInfo {
  name: string
  path: string
}

// 布局配置
const useFixedWidth = ref(true)
const isLoadingConfig = ref(true)
const contentBodyRef = ref<HTMLElement | null>(null)

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
  const el = contentBodyRef.value
  if (!el) {
    useFixedWidth.value = value
    await window.electronAPI.setLayoutConfig({ useFixedWidth: value })
    return
  }

  // 获取当前计算样式
  const computedStyle = window.getComputedStyle(el)
  const currentMaxWidth = parseInt(computedStyle.maxWidth) || el.clientWidth
  const currentPadding = parseInt(computedStyle.paddingLeft) || 24

  // 目标值
  const targetMaxWidth = value ? 1280 : el.parentElement?.clientWidth || window.innerWidth
  const targetPadding = 24 // var(--space-5) = 24px

  // 先设置初始值
  el.style.maxWidth = currentMaxWidth + 'px'
  el.style.margin = value ? '0' : '0 auto'
  el.style.paddingLeft = currentPadding + 'px'
  el.style.paddingRight = currentPadding + 'px'

  // 使用 Anime.js 动画
  animate(el, {
    maxWidth: targetMaxWidth,
    paddingLeft: targetPadding,
    paddingRight: targetPadding,
    duration: 400,
    ease: 'cubicBezier(0.4, 0.0, 0.2, 1)',
    onComplete: () => {
      // 动画完成后更新状态，让 CSS 类接管
      useFixedWidth.value = value
      // 清除内联样式
      el.style.maxWidth = ''
      el.style.margin = ''
      el.style.paddingLeft = ''
      el.style.paddingRight = ''
    }
  })

  try {
    await window.electronAPI.setLayoutConfig({ useFixedWidth: value })
  } catch (error) {
    console.error('保存布局配置失败:', error)
  }
}

const route = useRoute()

// 从路由 query 参数获取工作区信息
const workspaceInfo = computed<WorkspaceInfo | null>(() => {
  const name = route.query.workspaceName as string
  const path = route.query.workspacePath as string
  if (name && path) {
    return { name, path }
  }
  return null
})

const message = useMessage()
const activeMenuKey = ref('dashboard')

// 菜单配置
const menuOptions: MenuOption[] = [
  {
    label: '概览',
    key: 'dashboard',
    icon: () => h(NIcon, null, { default: () => h(LayoutDashboard) })
  }
]

function handleMenuUpdate(key: string) {
  activeMenuKey.value = key
  message.info(`切换到: ${menuOptions.find(item => item.key === key)?.label}`)
}

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

// 处理下拉菜单选择
async function handleDropdownSelect(key: string) {
  if (key === 'exit-workspace') {
    await window.electronAPI.exitToSetup()
  }
}
</script>

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
        ref="contentBodyRef"
        :class="['content-body', useFixedWidth ? 'content-fixed-width' : 'content-fluid']"
      >
        <div class="content-inner">
            <NTabs v-model:value="activeTab" type="line" animated>
              <!-- 概览标签页 -->
              <NTabPane name="overview" tab="概览">
                <template #tab>
                  <span class="tab-label">
                    <LayoutDashboard :size="16" />
                    概览
                  </span>
                </template>

                <div class="overview-content">
                  <!-- 欢迎卡片 -->
                  <NCard class="welcome-card" :bordered="false">
                    <div class="welcome-content">
                      <h1 class="welcome-title">
                        欢迎回来，{{ workspaceInfo?.name }}
                      </h1>
                      <p class="welcome-subtitle">
                        {{ workspaceInfo?.path }}
                      </p>
                    </div>
                  </NCard>

                  <!-- 统计卡片 -->
                  <div class="section">
                    <h2 class="section-title">概览</h2>
                    <div class="stats-grid">
                      <NCard class="stat-card" :bordered="false">
                        <div class="stat-header">
                          <span class="stat-label">待办任务</span>
                          <NTag type="warning" size="small">进行中</NTag>
                        </div>
                        <div class="stat-value">12</div>
                        <div class="stat-change">较上周 +3</div>
                      </NCard>

                      <NCard class="stat-card" :bordered="false">
                        <div class="stat-header">
                          <span class="stat-label">已完成</span>
                          <NTag type="success" size="small">本周</NTag>
                        </div>
                        <div class="stat-value">28</div>
                        <div class="stat-change text-success">较上周 +8</div>
                      </NCard>

                      <NCard class="stat-card" :bordered="false">
                        <div class="stat-header">
                          <span class="stat-label">文档</span>
                          <NTag type="info" size="small">总计</NTag>
                        </div>
                        <div class="stat-value">45</div>
                        <div class="stat-change">本周新增 5</div>
                      </NCard>

                      <NCard class="stat-card" :bordered="false">
                        <div class="stat-header">
                          <span class="stat-label">项目</span>
                          <NTag type="default" size="small">活跃</NTag>
                        </div>
                        <div class="stat-value">6</div>
                        <div class="stat-change">2 个即将截止</div>
                      </NCard>
                    </div>
                  </div>
                </div>
              </NTabPane>

              <!-- 文件标签页 -->
              <NTabPane name="files" tab="文件">
                <template #tab>
                  <span class="tab-label">
                    <FolderOpen :size="16" />
                    文件
                  </span>
                </template>

                <NCard title="工作目录文件结构" class="files-card">
                  <FileTree v-if="workspaceInfo?.path" :path="workspaceInfo.path" />
                </NCard>
              </NTabPane>
            </NTabs>
          </div>
        </NLayoutContent>
      </NLayout>
    </div>
  </template>

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
  max-width: 100%;
  margin: 0;
  padding: var(--space-5);
}

.content-inner {
  max-width: 100%;
}

/* 欢迎卡片 */
.welcome-card {
  background: linear-gradient(135deg, var(--color-accent-muted) 0%, var(--color-bg-elevated) 100%);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.welcome-content {
  padding: var(--space-4) 0;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-base);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  font-family: var(--font-mono);
}

/* 区块标题 */
.section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-base);
  margin: 0 0 var(--space-4) 0;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
}

.action-card {
  cursor: pointer;
  background-color: var(--color-bg-elevated) !important;
  border: 1px solid var(--color-border) !important;
  transition: border-color var(--transition-fast);
}

.action-card:hover {
  border-color: var(--color-border-light) !important;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-overlay);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
}

.action-label {
  font-size: 14px;
  color: var(--color-text-base);
  font-weight: 500;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.stat-card {
  background-color: var(--color-bg-elevated) !important;
  border: 1px solid var(--color-border) !important;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-base);
  line-height: 1.2;
  margin-bottom: var(--space-1);
}

.stat-change {
  font-size: 13px;
  color: var(--color-text-muted);
}

.stat-change.text-success {
  color: var(--color-success);
}

/* 标签页样式 */
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

/* 响应式 */

/* 小屏幕 (< 768px) */
@media (max-width: 768px) {
  .top-header {
    padding: 0 var(--space-3);
  }

  .header-left {
    gap: var(--space-3);
  }

  .workspace-name {
    display: none;
  }

  .content-fixed-width,
  .content-fluid {
    padding: var(--space-4);
  }

  .welcome-title {
    font-size: 22px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 中等屏幕 (768px - 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .content-fixed-width {
    max-width: 100%;
  }
}

/* 大屏幕 (1200px - 1599px) */
@media (min-width: 1200px) and (max-width: 1599px) {
  .content-fixed-width {
    max-width: 1200px;
  }
}

/* 超大屏幕 (>= 1600px) */
@media (min-width: 1600px) {
  .content-fixed-width {
    max-width: 1400px;
  }
}
</style>
