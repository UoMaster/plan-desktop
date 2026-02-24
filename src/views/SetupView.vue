<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NButton,
  NInput,
  NForm,
  NFormItem,
  NSpace,
  NCard,
  NDivider,
  useMessage
} from 'naive-ui'
import { FolderOpen, Check, Folder, History } from 'lucide-vue-next'

const message = useMessage()

// 表单数据
const workspaceName = ref('')
const workspacePath = ref('')
const loading = ref(false)

// 保存的工作区
const savedWorkspace = ref<{ name: string; path: string; lastOpenedAt: string } | null>(null)

// 页面加载时获取保存的工作区
onMounted(async () => {
  try {
    const workspace = await window.electronAPI.getSavedWorkspace()
    if (workspace) {
      savedWorkspace.value = workspace
    }
  } catch (error) {
    console.error('获取保存的工作区失败:', error)
  }
})

// 表单验证规则
const rules = {
  name: {
    required: true,
    message: '请输入工作区名称',
    trigger: ['blur', 'input']
  },
  path: {
    required: true,
    message: '请选择工作目录',
    trigger: ['blur']
  }
}

// 选择目录
async function handleSelectDirectory() {
  try {
    const result = await window.electronAPI.selectDirectory()
    if (!result.canceled && result.path) {
      workspacePath.value = result.path

      // 如果名称为空，使用目录名作为默认名称
      if (!workspaceName.value) {
        const pathParts = result.path.split(/[/\\]/)
        const folderName = pathParts[pathParts.length - 1]
        if (folderName) {
          workspaceName.value = folderName
        }
      }
    }
  } catch (error) {
    message.error('选择目录失败')
    console.error(error)
  }
}

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
</script>

<template>
  <div class="setup-wrapper">
    <NCard class="setup-card" :bordered="false">
      <!-- 图标 -->
      <div class="setup-icon">
        <Folder :size="32" />
      </div>

      <!-- 标题 -->
      <div class="setup-header">
        <h1 class="setup-title">设置工作区</h1>
        <p class="setup-subtitle">选择工作目录并开始使用</p>
      </div>

      <NDivider class="divider" />

      <!-- 上次工作区 -->
      <div v-if="savedWorkspace" class="saved-workspace">
        <div class="saved-workspace-header">
          <History :size="14" />
          <span>上次使用</span>
        </div>
        <div class="saved-workspace-card" @click="handleUseSavedWorkspace">
          <div class="saved-workspace-info">
            <div class="saved-workspace-name">{{ savedWorkspace.name }}</div>
            <div class="saved-workspace-path">{{ savedWorkspace.path }}</div>
          </div>
          <NButton
            type="primary"
            size="small"
            :loading="loading"
            class="use-saved-btn"
          >
            进入
          </NButton>
        </div>
        <NDivider class="or-divider">
          <span class="or-text">或创建新工作区</span>
        </NDivider>
      </div>

      <!-- 表单 -->
      <NForm
        :model="{ name: workspaceName, path: workspacePath }"
        :rules="rules"
        label-placement="top"
        size="medium"
        class="setup-form"
      >
        <NFormItem label="工作区名称" path="name">
          <NInput
            v-model:value="workspaceName"
            placeholder="输入工作区名称"
            clearable
            class="setup-input"
          />
        </NFormItem>

        <NFormItem label="工作目录" path="path">
          <NSpace vertical style="width: 100%">
            <NInput
              v-model:value="workspacePath"
              placeholder="点击右侧按钮选择目录"
              readonly
              class="setup-input"
            >
              <template #suffix>
                <NButton
                  quaternary
                  size="small"
                  @click="handleSelectDirectory"
                  class="select-btn"
                >
                  <template #icon>
                    <FolderOpen :size="16" />
                  </template>
                  选择
                </NButton>
              </template>
            </NInput>
          </NSpace>
        </NFormItem>
      </NForm>

      <!-- 操作按钮 -->
      <div class="setup-actions">
        <NButton
          type="primary"
          size="large"
          :loading="loading"
          :disabled="!workspaceName || !workspacePath"
          @click="handleConfirm"
          class="confirm-btn"
        >
          <template #icon>
            <Check :size="18" />
          </template>
          确认并开始
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>.setup-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--color-bg-base);
}

.setup-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.setup-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4);
}

.setup-header {
  text-align: center;
  margin-bottom: var(--space-4);
}

.setup-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-base);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: -0.02em;
}

.setup-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.divider {
  margin: var(--space-4) 0;
}

:deep(.n-divider) {
  background-color: var(--color-border);
}

.setup-form {
  margin-bottom: var(--space-4);
}

:deep(.n-form-item-label) {
  color: var(--color-text-base);
  font-weight: 500;
  font-size: 14px;
}

:deep(.n-form-item-label__asterisk) {
  color: var(--color-accent);
}

.setup-input {
  --n-color: var(--color-bg-base) !important;
  --n-color-focus: var(--color-bg-base) !important;
  --n-border: 1px solid var(--color-border) !important;
  --n-border-hover: 1px solid var(--color-border-light) !important;
  --n-border-focus: 1px solid var(--color-accent) !important;
  --n-box-shadow-focus: 0 0 0 2px var(--color-accent-muted) !important;
  --n-text-color: var(--color-text-base) !important;
  --n-placeholder-color: var(--color-text-disabled) !important;
}

.select-btn {
  --n-text-color: var(--color-text-muted) !important;
  --n-text-color-hover: var(--color-accent) !important;
  --n-text-color-pressed: var(--color-accent) !important;
}

.setup-actions {
  display: flex;
  justify-content: center;
  padding-top: var(--space-2);
}

.confirm-btn {
  min-width: 160px;
  --n-color: var(--color-accent) !important;
  --n-color-hover: var(--color-accent-hover) !important;
  --n-color-pressed: var(--color-accent) !important;
  --n-text-color: var(--color-text-base) !important;
  --n-text-color-hover: var(--color-text-base) !important;
  --n-text-color-pressed: var(--color-text-base) !important;
}

.confirm-btn:disabled {
  --n-color: var(--color-accent-muted) !important;
  --n-text-color: var(--color-text-disabled) !important;
  opacity: 0.6;
}

.saved-workspace {
  margin-bottom: var(--space-4);
}

.saved-workspace-header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.saved-workspace-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.saved-workspace-card:hover {
  border-color: var(--color-accent);
  background-color: var(--color-accent-muted);
}

.saved-workspace-info {
  flex: 1;
  min-width: 0;
  margin-right: var(--space-3);
}

.saved-workspace-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-base);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.saved-workspace-path {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.use-saved-btn {
  --n-color: var(--color-accent) !important;
  --n-color-hover: var(--color-accent-hover) !important;
  --n-color-pressed: var(--color-accent) !important;
  --n-text-color: var(--color-text-base) !important;
  flex-shrink: 0;
}

.or-divider {
  margin: var(--space-4) 0;
}

.or-text {
  font-size: 12px;
  color: var(--color-text-muted);
}

:deep(.n-divider__title) {
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>