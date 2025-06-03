/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // 在这里添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 扩展Window接口以包含Electron IPC
interface Window {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
  }
} 