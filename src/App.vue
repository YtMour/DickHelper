<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElConfigProvider, ElMessage, ElNotification } from 'element-plus'
import {
  Platform, House, DataLine, Plus, User, Moon, Sunny, FullScreen, Refresh, Bell, Document
} from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import { logger } from '@/utils/logger'
import { BackupService } from '@/services/backup'

// 组件导入
import RecordForm from './components/RecordForm.vue'
import HistoryList from './components/HistoryList.vue'
import UpdateDialog from './components/UpdateDialog.vue'
import TitleBar from './components/TitleBar.vue'
import IntelligentDashboard from './components/IntelligentDashboard.vue'
import AdvancedStatsChart from './components/AdvancedStatsChart.vue'
import SettingsPanel from './components/SettingsPanel.vue'

// 应用状态
const store = useRecordStore()
const activeTab = ref('home')
const loading = ref(false)
const isDarkMode = ref(false)
const isFullscreen = ref(false)
const lastBackupTime = ref<Date | null>(null)

// 计算属性
const currentComponent = computed(() => {
  const components = {
    'home': null,
    'dashboard': IntelligentDashboard,
    'record': RecordForm,
    'history': HistoryList,
    'analytics': AdvancedStatsChart,
    'settings': SettingsPanel
  }
  return components[activeTab.value as keyof typeof components]
})

const unreadCount = computed(() => {
  // 这里可以添加未读通知的逻辑
  return 0
})

// 应用初始化
const initializeApp = async () => {
  loading.value = true
  try {
    logger.info('应用初始化开始', {}, 'App')

    // 初始化存储
    await store.initializeStore()

    // 加载用户设置
    await loadUserSettings()

    // 检查备份状态
    await checkBackupStatus()

    // 设置定期任务
    setupPeriodicTasks()

    logger.info('应用初始化完成', {}, 'App')
    ElNotification.success({
      title: '欢迎回来',
      message: '应用已成功启动',
      duration: 3000
    })
  } catch (error) {
    logger.error('应用初始化失败', { error }, 'App')
    ElMessage.error('应用初始化失败，请重试')
  } finally {
    loading.value = false
  }
}

// 用户设置管理
const loadUserSettings = async () => {
  try {
    const settings = localStorage.getItem('app_settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      isDarkMode.value = parsed.darkMode || false
      // 应用主题
      document.documentElement.classList.toggle('dark', isDarkMode.value)
    }
  } catch (error) {
    logger.error('加载用户设置失败', { error }, 'App')
  }
}

const saveUserSettings = async () => {
  try {
    const settings = {
      darkMode: isDarkMode.value,
      lastActiveTab: activeTab.value,
      timestamp: Date.now()
    }
    localStorage.setItem('app_settings', JSON.stringify(settings))
  } catch (error) {
    logger.error('保存用户设置失败', { error }, 'App')
  }
}

// 备份状态检查
const checkBackupStatus = async () => {
  try {
    const backupInfo = await BackupService.getBackupInfo()
    if (backupInfo.lastBackup) {
      lastBackupTime.value = new Date(backupInfo.lastBackup)
    }
  } catch (error) {
    logger.error('检查备份状态失败', { error }, 'App')
    // 不阻止应用启动，只是记录错误
  }
}

// 定期任务设置
const setupPeriodicTasks = () => {
  // 每5分钟自动保存设置
  setInterval(saveUserSettings, 5 * 60 * 1000)

  // 每小时检查备份
  setInterval(checkBackupStatus, 60 * 60 * 1000)
}

// 事件处理
const handleMenuSelect = (index: string) => {
  if (index !== 'github') {
    activeTab.value = index
    logger.debug('页面切换', { page: index }, 'App')
  }
}

const openGitHub = () => {
  window.open('https://github.com/YtMour/DickHelper', '_blank')
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  saveUserSettings()
  ElMessage.success(`已切换到${isDarkMode.value ? '深色' : '浅色'}模式`)
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const refreshApp = async () => {
  loading.value = true
  try {
    await store.initializeStore()
    await checkBackupStatus()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  initializeApp()

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  saveUserSettings()
})

// 辅助方法
const getPageTitle = () => {
  const titles = {
    'home': '主页',
    'dashboard': '智能仪表盘',
    'record': '新建记录',
    'history': '历史记录',
    'analytics': '高级分析',
    'settings': '设置'
  }
  return titles[activeTab.value as keyof typeof titles] || '未知页面'
}

const formatBackupTime = () => {
  if (!lastBackupTime.value) return '从未'
  const now = new Date()
  const diff = now.getTime() - lastBackupTime.value.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const getThisWeekCount = () => {
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  weekStart.setHours(0, 0, 0, 0)

  return store.records.filter(record =>
    new Date(record.startTime) >= weekStart
  ).length
}

const getAverageDuration = () => {
  if (store.records.length === 0) return '0分钟'
  const totalDuration = store.records.reduce((sum, record) => sum + record.duration, 0)
  const avgMinutes = Math.round(totalDuration / store.records.length / 60)
  return `${avgMinutes}分钟`
}

// 监听器
watch(activeTab, (newTab) => {
  logger.debug('页面切换', { from: activeTab.value, to: newTab }, 'App')
})
</script>

<template>
  <el-config-provider>
    <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
      <title-bar />
      <update-dialog />

      <!-- 顶部工具栏 -->
      <div class="top-toolbar">
        <div class="toolbar-left">
          <div class="app-info">
            <span class="app-logo">🍆</span>
            <span class="app-name">DickHelper</span>
            <el-tag size="small" type="info">v0.1.0</el-tag>
          </div>
        </div>

        <div class="toolbar-center">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="activeTab !== 'home'">
              {{ getPageTitle() }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="toolbar-right">
          <el-button-group size="small">
            <el-button @click="refreshApp" :loading="loading" circle>
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button @click="toggleDarkMode" circle>
              <el-icon><Moon v-if="!isDarkMode" /><Sunny v-else /></el-icon>
            </el-button>
            <el-button @click="toggleFullscreen" circle>
              <el-icon><FullScreen /></el-icon>
            </el-button>
            <el-button circle>
              <el-icon><Bell /></el-icon>
              <el-badge v-if="unreadCount > 0" :value="unreadCount" class="notification-badge" />
            </el-button>
          </el-button-group>
        </div>
      </div>

      <el-container class="main-container">
        <!-- 侧边导航 -->
        <el-aside width="240px" class="side-menu">
          <div class="menu-header">
            <el-avatar :size="40" class="user-avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="user-info">
              <div class="user-name">用户</div>
              <div class="user-status">在线</div>
            </div>
          </div>

          <el-menu
            :default-active="activeTab"
            class="navigation-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="home">
              <el-icon><House /></el-icon>
              <span>主页</span>
            </el-menu-item>
            <el-menu-item index="dashboard">
              <el-icon><DataLine /></el-icon>
              <span>智能仪表盘</span>
            </el-menu-item>
            <el-menu-item index="record">
              <el-icon><Plus /></el-icon>
              <span>新建记录</span>
            </el-menu-item>
            <el-menu-item index="history">
              <el-icon><List /></el-icon>
              <span>历史记录</span>
            </el-menu-item>
            <el-menu-item index="analytics">
              <el-icon><TrendCharts /></el-icon>
              <span>高级分析</span>
            </el-menu-item>
            <el-menu-item index="settings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-menu-item>
          </el-menu>

          <!-- 快速信息 -->
          <div class="quick-info">
            <div class="info-item">
              <span class="info-label">总记录</span>
              <span class="info-value">{{ store.records.length }}</span>
            </div>
            <div class="info-item" v-if="lastBackupTime">
              <span class="info-label">最后备份</span>
              <span class="info-value">{{ formatBackupTime() }}</span>
            </div>
          </div>

          <!-- GitHub链接 -->
          <div class="menu-footer">
            <el-button @click="openGitHub" text class="github-link">
              <el-icon><Platform /></el-icon>
              <span>Star on GitHub</span>
            </el-button>
          </div>
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="main-content" v-loading="loading">
          <transition name="fade" mode="out-in">
            <!-- 主页 -->
            <div v-if="activeTab === 'home'" key="home" class="home-page">
              <div class="welcome-hero">
                <div class="hero-content">
                  <div class="hero-logo">
                    <div class="logo-icon">🍆</div>
                    <h1 class="hero-title">DickHelper</h1>
                    <p class="hero-subtitle">个人健康数据管理助手</p>
                  </div>

                  <div class="hero-description">
                    <p>祝愿所有给本项目Star的小伙伴牛子长度翻倍！</p>
                    <p>一个专业、安全、私密的个人健康数据记录和分析工具</p>
                  </div>

                  <div class="hero-actions">
                    <el-button
                      type="primary"
                      size="large"
                      @click="activeTab = 'dashboard'"
                      class="primary-action"
                    >
                      <el-icon><DataLine /></el-icon>
                      开始使用
                    </el-button>
                    <el-button
                      size="large"
                      @click="activeTab = 'record'"
                      class="secondary-action"
                    >
                      <el-icon><Plus /></el-icon>
                      快速记录
                    </el-button>
                  </div>
                </div>

                <!-- 快速统计卡片 -->
                <div class="quick-stats-grid">
                  <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ store.records.length }}</div>
                      <div class="stat-label">总记录数</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ getThisWeekCount() }}</div>
                      <div class="stat-label">本周记录</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ getAverageDuration() }}</div>
                      <div class="stat-label">平均时长</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">💾</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ lastBackupTime ? '已备份' : '未备份' }}</div>
                      <div class="stat-label">备份状态</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 功能特性展示 -->
              <div class="features-section">
                <h2 class="section-title">核心功能</h2>
                <div class="features-grid">
                  <div class="feature-card" @click="activeTab = 'record'">
                    <div class="feature-icon">✏️</div>
                    <h3>智能记录</h3>
                    <p>支持计时、评分、标签等多维度数据记录</p>
                  </div>
                  <div class="feature-card" @click="activeTab = 'analytics'">
                    <div class="feature-icon">📈</div>
                    <h3>数据分析</h3>
                    <p>深度分析个人模式，提供健康建议</p>
                  </div>
                  <div class="feature-card" @click="activeTab = 'history'">
                    <div class="feature-icon">🗂️</div>
                    <h3>历史管理</h3>
                    <p>完整的历史记录管理和搜索功能</p>
                  </div>
                  <div class="feature-card" @click="activeTab = 'settings'">
                    <div class="feature-icon">🔒</div>
                    <h3>隐私保护</h3>
                    <p>本地加密存储，保护个人隐私数据</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 动态组件渲染 -->
            <component
              v-else
              :is="currentComponent"
              :key="activeTab"
              class="page-component"
            />
          </transition>
        </el-main>
      </el-container>

      <!-- 全局浮动操作按钮 -->
      <el-backtop :right="30" :bottom="30" />

      <!-- 状态栏 -->
      <div class="status-bar">
        <div class="status-left">
          <span class="status-item">
            <el-icon><DataLine /></el-icon>
            {{ store.records.length }} 条记录
          </span>
          <span class="status-item" v-if="lastBackupTime">
            <el-icon><Document /></el-icon>
            最后备份: {{ formatBackupTime() }}
          </span>
        </div>
        <div class="status-right">
          <span class="status-item">
            {{ isDarkMode ? '深色模式' : '浅色模式' }}
          </span>
          <span class="status-item">
            v0.1.0
          </span>
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
/* 应用容器 */
.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.app-container.dark-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

/* 顶部工具栏 */
.top-toolbar {
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dark-mode .top-toolbar {
  background: rgba(26, 26, 46, 0.95);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  font-size: 24px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

/* 主容器 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 92px); /* 减去工具栏和状态栏高度 */
}

/* 侧边菜单 */
.side-menu {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.dark-mode .side-menu {
  background: rgba(26, 26, 46, 0.95);
  border-right-color: rgba(255, 255, 255, 0.1);
}

.menu-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.dark-mode .menu-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.user-status {
  font-size: 12px;
  color: var(--el-color-success);
}

.navigation-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 10px;
}

:deep(.navigation-menu .el-menu-item) {
  border-radius: 8px;
  margin: 2px 0;
  height: 48px;
  line-height: 48px;
  transition: all 0.3s ease;
}

:deep(.navigation-menu .el-menu-item:hover) {
  background: rgba(103, 194, 58, 0.1);
  color: var(--el-color-success);
  transform: translateX(4px);
}

:deep(.navigation-menu .el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  color: white;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.quick-info {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dark-mode .quick-info {
  border-color: rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.info-label {
  color: var(--el-text-color-secondary);
}

.info-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.menu-footer {
  padding: 20px;
}

.github-link {
  width: 100%;
  justify-content: flex-start;
  gap: 8px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
  position: relative;
}

.dark-mode .main-content {
  background: rgba(0, 0, 0, 0.1);
}

.page-component {
  padding: 30px;
  min-height: 100%;
}

/* 主页样式 */
.home-page {
  padding: 40px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.welcome-hero {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 60px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.dark-mode .welcome-hero {
  background: rgba(26, 26, 46, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.welcome-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  background-size: 200% 100%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero-logo {
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 80px;
  margin-bottom: 20px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 20px;
  color: var(--el-text-color-secondary);
  margin: 0 0 30px 0;
  font-weight: 500;
}

.hero-description {
  margin-bottom: 40px;
}

.hero-description p {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-action,
.secondary-action {
  padding: 16px 32px;
  font-size: 16px;
  height: auto;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  min-width: 160px;
}

.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

/* 快速统计网格 */
.quick-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.dark-mode .stat-card {
  background: rgba(26, 26, 46, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

/* 功能特性区域 */
.features-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark-mode .features-section {
  background: rgba(26, 26, 46, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 40px 0;
  color: var(--el-text-color-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.dark-mode .feature-card {
  background: rgba(26, 26, 46, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: var(--el-color-primary);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
  display: block;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.feature-card p {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

/* 状态栏 */
.status-bar {
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.dark-mode .status-bar {
  background: rgba(26, 26, 46, 0.9);
  border-top-color: rgba(255, 255, 255, 0.1);
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .side-menu {
    width: 200px;
  }

  .hero-title {
    font-size: 40px;
  }

  .quick-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .app-container {
    height: 100vh;
  }

  .top-toolbar {
    height: 50px;
    padding: 0 15px;
  }

  .app-name {
    display: none;
  }

  .toolbar-center {
    display: none;
  }

  .main-container {
    flex-direction: column;
    height: calc(100vh - 82px);
  }

  .side-menu {
    width: 100%;
    height: auto;
    order: 2;
    flex-direction: row;
    overflow-x: auto;
  }

  .menu-header {
    display: none;
  }

  .navigation-menu {
    display: flex;
    padding: 10px;
    min-width: max-content;
  }

  :deep(.navigation-menu .el-menu-item) {
    flex-shrink: 0;
    margin: 0 4px;
    min-width: 80px;
    justify-content: center;
    font-size: 12px;
  }

  .quick-info,
  .menu-footer {
    display: none;
  }

  .main-content {
    order: 1;
  }

  .page-component {
    padding: 20px 15px;
  }

  .home-page {
    padding: 20px 15px;
    gap: 30px;
  }

  .welcome-hero {
    padding: 40px 20px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .logo-icon {
    font-size: 60px;
  }

  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
    max-width: 280px;
  }

  .quick-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .stat-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .stat-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
  }

  .stat-number {
    font-size: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 24px 16px;
  }

  .feature-icon {
    font-size: 36px;
  }

  .status-bar {
    padding: 0 15px;
    font-size: 11px;
  }

  .status-left,
  .status-right {
    gap: 12px;
  }
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-text {
  color: var(--el-text-color-secondary);
  font-size: 1rem;
  margin: 1rem 0 1.5rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.dashboard-button,
.github-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  height: auto;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.dashboard-button:hover,
.github-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 深色模式和其他样式 */
.dark-mode {
  color-scheme: dark;
}

.dark-mode :deep(.el-button) {
  border-color: rgba(255, 255, 255, 0.2);
}

.dark-mode :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.dark-mode ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 加载状态 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.dark-mode :deep(.el-loading-mask) {
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
