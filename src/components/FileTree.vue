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

interface GetDirectoryStructureResult {
  success: boolean
  data?: DirectoryNode[]
  error?: string
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
        color: node.isLeaf ? 'var(--color-text-muted)' : 'var(--color-accent)'
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
    const result = await window.electronAPI.getDirectoryStructure(props.path) as GetDirectoryStructureResult
    if (result.success) {
      treeData.value = result.data?.map(convertToTreeOption) || []
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
