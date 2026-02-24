<template>
  <n-modal v-model:show="show" preset="dialog" title="新建任务">
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item label="任务名称" path="name">
        <n-input v-model:value="form.name" placeholder="输入任务名称" />
      </n-form-item>
      <n-form-item label="工作目录" path="workspace">
        <n-input v-model:value="form.workspace" placeholder="选择工作目录">
          <template #append>
            <n-button @click="selectDir">选择</n-button>
          </template>
        </n-input>
      </n-form-item>
      <n-form-item label="任务描述" path="description">
        <n-input
          v-model:value="form.description"
          type="textarea"
          placeholder="简要描述任务目标"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="show = false">取消</n-button>
      <n-button type="primary" @click="handleSubmit">创建</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { useTaskStore } from '@/stores/taskStore'

const show = ref(false)
const formRef = ref()
const taskStore = useTaskStore()

const form = reactive({
  name: '',
  workspace: '',
  description: ''
})

const rules = {
  name: { required: true, message: '请输入任务名称' },
  workspace: { required: true, message: '请选择工作目录' }
}

async function selectDir() {
  try {
    const result = await window.electronAPI.selectDirectory()
    if (!result.canceled && result.path) {
      form.workspace = result.path
    }
  } catch (error) {
    console.error('选择目录失败:', error)
  }
}

function handleSubmit() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      taskStore.addTask(form.name, form.workspace)
      show.value = false
      form.name = ''
      form.workspace = ''
      form.description = ''
    }
  })
}

defineExpose({ show })
</script>
