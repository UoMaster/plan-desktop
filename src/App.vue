<script setup lang="ts">
import { NConfigProvider, darkTheme, NMessageProvider } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

// 主题覆盖 - 玫瑰粉色主题
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#F43F5E',
    primaryColorHover: '#FB7185',
    primaryColorPressed: '#E11D48',
    bodyColor: '#18181B',
    baseColor: '#18181B',
    cardColor: '#27272A',
    modalColor: '#27272A',
    textColorBase: '#FAFAFA',
    textColor1: '#FAFAFA',
    textColor2: '#A1A1AA',
    textColor3: '#71717A',
    borderColor: '#3F3F46',
    dividerColor: '#3F3F46',
    fontFamily: "'Space Grotesk', -apple-system, sans-serif",
    borderRadius: '6px',
  },
  Button: {
    colorPrimary: '#F43F5E',
    textColorPrimary: '#FAFAFA',
    colorPrimaryHover: '#FB7185',
    colorPrimaryPressed: '#E11D48',
  },
  Card: {
    color: '#27272A',
    borderColor: '#3F3F46',
  },
  Input: {
    color: '#18181B',
    colorFocus: '#18181B',
    borderColor: '#3F3F46',
    borderColorHover: '#52525B',
    borderColorFocus: '#F43F5E',
  },
  Form: {
    labelTextColor: '#FAFAFA',
    labelFontWeight: '500',
  }
}
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <router-view />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
/* 全局样式已在 main.ts 引入 */
</style>
