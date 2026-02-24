import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)
app.use(router)

// 等待路由准备好后，根据 URL 参数进行初始导航
router.isReady().then(() => {
  // 从 window.location.search 获取 query 参数（Electron 传递的参数）
  const urlParams = new URLSearchParams(window.location.search)
  const windowType = urlParams.get('window')
  const workspaceName = urlParams.get('workspaceName')
  const workspacePath = urlParams.get('workspacePath')

  // 如果是主窗口且当前不在 /main 路由，则导航到 /main
  if (windowType === 'main' && router.currentRoute.value.path !== '/main') {
    router.push({
      path: '/main',
      query: {
        workspaceName: workspaceName || '',
        workspacePath: workspacePath || ''
      }
    })
  }
  // 如果是 setup 窗口且当前不在 / 路由，则导航到 /
  else if (windowType === 'setup' && router.currentRoute.value.path !== '/') {
    router.push('/')
  }
})

app.mount('#app')
