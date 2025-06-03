<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import { Platform, House, List } from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import RecordForm from './components/RecordForm.vue'
import StatsChart from './components/StatsChart.vue'
import HistoryList from './components/HistoryList.vue'
import UpdateDialog from './components/UpdateDialog.vue'
import TitleBar from './components/TitleBar.vue'

// 组件名称声明
const components = {
  RecordForm,
  StatsChart,
  HistoryList,
  UpdateDialog,
  TitleBar
}

const store = useRecordStore()
const activeTab = ref('home')

onMounted(async () => {
  await store.initializeStore()
})

const handleMenuSelect = (index: string) => {
  if (index !== 'github') {
    activeTab.value = index
  }
}

const openGitHub = () => {
  window.open('https://github.com/YtMour/DickHelper', '_blank')
}
</script>

<template>
  <el-config-provider>
    <div class="app-container">
      <title-bar />
      <update-dialog />
      
      <el-container class="main-container">
        <el-aside width="64px" class="side-menu">
          <el-menu
            default-active="home"
            class="menu"
            :collapse="true"
            @select="handleMenuSelect"
          >
            <el-menu-item index="home">
              <el-icon><House /></el-icon>
              <template #title>主页</template>
            </el-menu-item>
            <el-menu-item index="history">
              <el-icon><List /></el-icon>
              <template #title>历史</template>
            </el-menu-item>
            <el-menu-item index="github" @click="openGitHub">
              <el-icon><Platform /></el-icon>
              <template #title>GitHub</template>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="main-content">
          <transition name="fade" mode="out-in">
            <div v-if="activeTab === 'home'" key="home" class="home-page">
              <div class="welcome-section">
                <div class="welcome-content">
                  <div class="logo-section">
                    <div class="app-logo">🍆</div>
                    <h1 class="welcome-title">DickHelper</h1>
                  </div>
                  <p class="welcome-text">祝愿所有给本项目Star的小伙伴牛子长度翻倍！</p>
                  <div class="action-buttons">
                    <el-button
                      type="primary"
                      class="github-button"
                      @click="openGitHub"
                    >
                      <el-icon><Platform /></el-icon>
                      Star on GitHub
                    </el-button>
                    <el-button
                      type="success"
                      class="feature-button"
                      @click="activeTab = 'history'"
                    >
                      <el-icon><List /></el-icon>
                      查看历史
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="content-section">
                <record-form />
                <stats-chart />
              </div>
            </div>

            <div v-else-if="activeTab === 'history'" key="history" class="history-page">
              <div class="page-header">
                <h2 class="page-title">
                  <el-icon><List /></el-icon>
                  历史记录
                </h2>
                <el-button
                  type="primary"
                  @click="activeTab = 'home'"
                  class="back-button"
                >
                  <el-icon><House /></el-icon>
                  返回主页
                </el-button>
              </div>
              <history-list />
            </div>
          </transition>
        </el-main>
      </el-container>
    </div>
  </el-config-provider>
</template>

<style scoped>
.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 32px);
  backdrop-filter: blur(10px);
}

.side-menu {
  background: rgba(255, 255, 255, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.menu {
  height: 100%;
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  border-radius: 8px;
  margin: 4px;
  width: 56px;
}

:deep(.el-menu-item:hover) {
  background: rgba(103, 194, 58, 0.1) !important;
  color: var(--el-color-success);
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3)) !important;
  color: white;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  height: calc(100vh - 32px - 2rem); /* 减去标题栏高度和padding */
}

.home-page,
.history-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.welcome-section {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
  overflow: hidden;
}

.welcome-content {
  padding: 1.5rem;
  text-align: center;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.app-logo {
  font-size: 2.5rem;
  line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.welcome-title {
  font-size: 1.8rem;
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
  font-size: 0.9rem;
  margin: 0.75rem 0;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.github-button,
.feature-button {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  height: auto;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.github-button:hover,
.feature-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.content-section {
  flex: 1;
  min-height: 500px;
  max-height: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0;
  overflow: visible;
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

.back-button {
  border-radius: 8px;
  font-weight: 500;
}

.history-page {
  min-height: calc(100vh - 120px);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem;
  }

  .welcome-content {
    padding: 1.5rem;
  }

  .logo-section {
    flex-direction: column;
    gap: 0.5rem;
  }

  .app-logo {
    font-size: 2.5rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-text {
    font-size: 0.9rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .github-button,
  .feature-button {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    width: 200px;
  }

  .content-section {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    min-height: 600px;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1rem;
  }

  .history-page {
    min-height: calc(100vh - 150px);
  }
}

@media (max-width: 480px) {
  .welcome-content {
    padding: 1rem;
  }

  .app-logo {
    font-size: 2rem;
  }

  .welcome-title {
    font-size: 1.2rem;
  }

  .welcome-text {
    font-size: 0.8rem;
  }

  .github-button,
  .feature-button {
    width: 180px;
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }

  .content-section {
    gap: 0.5rem;
    min-height: 650px;
  }

  .page-header {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.2rem;
  }
}
</style>
