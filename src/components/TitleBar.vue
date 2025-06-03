<template>
  <div class="title-bar">
    <div class="title">DickHelper</div>
    <div class="window-controls">
      <el-button
        class="control-button minimize"
        @click="minimizeWindow"
        type="text"
      >
        <el-icon><Minus /></el-icon>
      </el-button>
      <el-button
        class="control-button maximize"
        @click="toggleMaximize"
        type="text"
      >
        <el-icon><FullScreen v-if="!isMaximized" /><CopyDocument v-else /></el-icon>
      </el-button>
      <el-button
        class="control-button close"
        @click="closeWindow"
        type="text"
      >
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Minus, FullScreen, CopyDocument, Close } from '@element-plus/icons-vue'

defineOptions({
  name: 'TitleBar'
})

const isMaximized = ref(false)

// 监听窗口状态变化
let removeMaximizeListener: (() => void) | null = null
let removeUnmaximizeListener: (() => void) | null = null

onMounted(() => {
  removeMaximizeListener = (window as any).electronAPI?.onWindowMaximize(() => {
    isMaximized.value = true
  })

  removeUnmaximizeListener = (window as any).electronAPI?.onWindowUnmaximize(() => {
    isMaximized.value = false
  })
})

onUnmounted(() => {
  removeMaximizeListener?.()
  removeUnmaximizeListener?.()
})

// 窗口控制函数
const minimizeWindow = () => {
  ;(window as any).electronAPI?.minimizeWindow()
}

const toggleMaximize = () => {
  ;(window as any).electronAPI?.toggleMaximizeWindow()
}

const closeWindow = () => {
  ;(window as any).electronAPI?.closeWindow()
}
</script>

<style scoped>
.title-bar {
  height: 32px;
  background-color: var(--el-bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.window-controls {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.control-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  transition: all 0.3s;
}

.control-button:hover {
  background-color: var(--el-fill-color-light);
}

.close:hover {
  background-color: #f56c6c;
  color: white;
}

:deep(.el-icon) {
  font-size: 16px;
}
</style>

<script lang="ts">
export default {
  name: 'TitleBar'
}
</script> 