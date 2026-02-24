# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript + Electron desktop application built with Vite.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server with hot reload (Vite + Electron)
- `npm run build` - Full production build (type-check + vite build + electron-builder)
- `npm run electron:dev` - Vite dev mode only
- `npm run electron:build` - Production build with electron-builder
- `npm run preview` - Preview production build

## Architecture

### Project Structure

```
src/              # Vue frontend application
electron/         # Electron main process
  main.ts         # Entry point for Electron main process
  preload.ts      # Preload script with contextBridge API
dist/             # Built frontend assets (Vite output)
dist-electron/    # Built Electron files
release/          # Packaged app output (electron-builder)
```

### Key Configuration

- **vite.config.ts** - Vite configuration with `vite-plugin-electron` for dual-process builds
- **electron-builder.yml** - Electron packaging configuration (supports macOS, Windows, Linux)
- **tsconfig.json** - Frontend TypeScript config (Vue + DOM types)
- **tsconfig.node.json** - Electron process TypeScript config

### Electron IPC

The preload script exposes a safe IPC API via `contextBridge`:

```typescript
window.electronAPI.sendMessage(message: string)
window.electronAPI.onMessage(callback: (message: string) => void)
```

Add new IPC channels in `electron/preload.ts` and handle them in `electron/main.ts`.

### Build Output

- Frontend builds to `dist/`
- Electron main/preload builds to `dist-electron/`
- Packaged applications output to `release/`

### Path Aliases

Use `@/` to import from `src/`:

```typescript
import MyComponent from '@/components/MyComponent.vue'
```

## 组件库
全局使用 naive-ui 组件库

## 设计规范
样式设计需要完全遵循 DESIGN.md 指定的规范