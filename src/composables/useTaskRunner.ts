import type { Task } from '@/types/task'

export function useTaskRunner() {
  async function runBrainstorming(task: Task) {
    return window.electronAPI.taskAPI.brainstorming(task)
  }

  async function runPlanning(task: Task) {
    return window.electronAPI.taskAPI.planning(task)
  }

  async function runTask(task: Task) {
    return window.electronAPI.taskAPI.execute(task)
  }

  async function stopTask(taskId: string) {
    return window.electronAPI.taskAPI.stop(taskId)
  }

  async function sendInput(taskId: string, input: string) {
    return window.electronAPI.taskAPI.sendInput(taskId, input)
  }

  function onOutput(callback: (data: { taskId: string; data: string }) => void) {
    window.electronAPI.taskAPI.onOutput(callback)
  }

  return {
    runBrainstorming,
    runPlanning,
    runTask,
    stopTask,
    sendInput,
    onOutput
  }
}
