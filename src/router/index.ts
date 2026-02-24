import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'setup',
    component: () => import('@/views/SetupView.vue')
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('@/views/MainView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
