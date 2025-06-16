import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import { setupGlobalErrorHandling, logger } from './utils/logger'
import { BackupService } from './services/backup'

// 设置全局错误处理
setupGlobalErrorHandling()

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(ElementPlus)

// 应用启动日志
logger.info('应用启动', { version: '0.1.0' }, 'APP')

// 启动自动备份
BackupService.autoBackup()

// 挂载应用
app.mount('#app')

// 定期自动备份
setInterval(() => {
  BackupService.autoBackup()
}, 60 * 60 * 1000) // 每小时检查一次
