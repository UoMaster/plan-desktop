<template>
  <div class="document-editor">
    <div class="editor-header">
      <n-button size="small" @click="emit('generate')">
        <template #icon><Sparkles /></template>
        AI 生成
      </n-button>
    </div>
    <n-input
      v-model:value="content"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 10 }"
      @blur="emit('update:modelValue', content)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NButton } from 'naive-ui'
import { Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'generate': []
}>()

const content = ref(props.modelValue || '')

watch(() => props.modelValue, (val) => {
  content.value = val || ''
})
</script>

<style scoped>
.document-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-header {
  display: flex;
  justify-content: flex-end;
}
</style>
