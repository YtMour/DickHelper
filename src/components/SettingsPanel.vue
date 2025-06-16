<template>
  <div class="settings-panel">
    <div class="settings-header">
      <h2>应用设置</h2>
      <p>个性化您的应用体验</p>
    </div>

    <div class="settings-content">
      <!-- 外观设置 -->
      <el-card class="setting-card">
        <template #header>
          <div class="card-header">
            <el-icon><Sunny /></el-icon>
            <span>外观设置</span>
          </div>
        </template>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">深色模式</div>
            <div class="setting-desc">切换应用的明暗主题</div>
          </div>
          <el-switch v-model="settings.darkMode" @change="updateDarkMode" />
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">动画效果</div>
            <div class="setting-desc">启用页面切换动画</div>
          </div>
          <el-switch v-model="settings.animations" />
        </div>
      </el-card>

      <!-- 隐私设置 -->
      <el-card class="setting-card">
        <template #header>
          <div class="card-header">
            <el-icon><Lock /></el-icon>
            <span>隐私设置</span>
          </div>
        </template>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">数据加密</div>
            <div class="setting-desc">本地数据加密存储</div>
          </div>
          <el-switch v-model="settings.encryption" disabled />
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">自动备份</div>
            <div class="setting-desc">定期自动备份数据</div>
          </div>
          <el-switch v-model="settings.autoBackup" />
        </div>
      </el-card>

      <!-- 数据管理 -->
      <el-card class="setting-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>数据管理</span>
          </div>
        </template>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">导出数据</div>
            <div class="setting-desc">导出所有记录数据</div>
          </div>
          <el-button @click="exportData" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-title">导入数据</div>
            <div class="setting-desc">从文件导入记录数据</div>
          </div>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            @change="handleFileChange"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-upload>
        </div>

        <div class="setting-item danger">
          <div class="setting-info">
            <div class="setting-title">清除所有数据</div>
            <div class="setting-desc">永久删除所有记录（不可恢复）</div>
          </div>
          <el-button type="danger" @click="confirmClearData">
            <el-icon><Delete /></el-icon>
            清除
          </el-button>
        </div>
      </el-card>

      <!-- 关于 -->
      <el-card class="setting-card">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>关于应用</span>
          </div>
        </template>

        <div class="about-content">
          <div class="app-info">
            <div class="app-logo">🍆</div>
            <div class="app-details">
              <h3>DickHelper</h3>
              <p>版本 v0.1.0</p>
              <p>个人健康数据管理助手</p>
            </div>
          </div>

          <div class="links">
            <el-button text @click="openGitHub">
              <el-icon><Platform /></el-icon>
              GitHub 仓库
            </el-button>
            <el-button text @click="checkUpdate">
              <el-icon><Refresh /></el-icon>
              检查更新
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>



<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Sunny, Lock, Document, Download, Upload, Delete,
  InfoFilled, Platform, Refresh
} from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import { BackupService } from '@/services/backup'
import { logger } from '@/utils/logger'

defineOptions({
  name: 'SettingsPanel'
})

const store = useRecordStore()
const exporting = ref(false)
const uploadRef = ref()

const settings = reactive({
  darkMode: false,
  animations: true,
  encryption: true,
  autoBackup: true
})

onMounted(() => {
  loadSettings()
})

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('app_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    }
  } catch (error) {
    logger.error('加载设置失败', { error }, 'SettingsPanel')
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem('app_settings', JSON.stringify(settings))
  } catch (error) {
    logger.error('保存设置失败', { error }, 'SettingsPanel')
  }
}

const updateDarkMode = () => {
  document.documentElement.classList.toggle('dark', settings.darkMode)
  saveSettings()
  ElMessage.success(`已切换到${settings.darkMode ? '深色' : '浅色'}模式`)
}

const exportData = async () => {
  exporting.value = true
  try {
    const blob = await BackupService.exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dickhelper-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  } finally {
    exporting.value = false
  }
}

const handleFileChange = async (file: any) => {
  try {
    const text = await file.raw.text()
    const success = await BackupService.importBackup(text)
    if (success) {
      ElMessage.success('数据导入成功')
      await store.initializeStore()
    } else {
      ElMessage.error('数据导入失败')
    }
  } catch (error) {
    ElMessage.error('文件读取失败')
  }
}

const confirmClearData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除所有记录数据，且无法恢复。确定要继续吗？',
      '危险操作',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 清除所有记录
    store.records.splice(0)
    localStorage.removeItem('masturbation_records')
    ElMessage.success('所有数据已清除')
  } catch (error) {
    // 用户取消操作
  }
}

const openGitHub = () => {
  window.open('https://github.com/YtMour/DickHelper', '_blank')
}

const checkUpdate = () => {
  ElMessage.info('当前已是最新版本')
}




</script>

<style scoped>
.settings-panel {
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 30px;
}

.settings-header h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.settings-header p {
  color: var(--el-text-color-secondary);
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger {
  border-color: var(--el-color-danger-light-8);
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.about-content {
  padding: 20px 0;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.app-logo {
  font-size: 48px;
}

.app-details h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.app-details p {
  margin: 0 0 4px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.links {
  display: flex;
  gap: 16px;
}

@media (max-width: 768px) {
  .settings-panel {
    padding: 0 10px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .app-info {
    flex-direction: column;
    text-align: center;
  }

  .links {
    justify-content: center;
  }
}
</style>
