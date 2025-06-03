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
  window.open('https://github.com/zzzdajb/DickHelper', '_blank')
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
                <h1 class="welcome-title">欢迎使用 DickHelper</h1>
                <p class="welcome-text">祝愿所有给本项目Star的小伙伴牛子长度翻倍！</p>
                <el-button
                  type="primary"
                  class="github-button"
                  @click="openGitHub"
                >
                  <el-icon><Platform /></el-icon>
                  Star on GitHub
                </el-button>
              </div>

              <div class="content-section">
                <record-form />
                <stats-chart />
              </div>
            </div>

            <div v-else-if="activeTab === 'history'" key="history" class="history-page">
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
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 32px); /* 减去标题栏高度 */
}

.side-menu {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
}

.menu {
  height: 100%;
  border-right: none;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
}

.home-page,
.history-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.welcome-section {
  text-align: center;
  padding: 0.5rem;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color-page) 100%);
}

.welcome-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.welcome-text {
  color: var(--el-text-color-secondary);
  font-size: 0.8rem;
  margin: 0.25rem 0;
}

.github-button {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  height: 24px;
}

.content-section {
  flex: 1;
  min-height: 500px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0 0.5rem 0.5rem;
}

.history-page {
  min-height: calc(100vh - 150px);
  padding: 0.5rem;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .main-content {
    padding: 0.25rem;
  }

  .welcome-section {
    padding: 0.25rem;
  }

  .welcome-title {
    font-size: 1.1rem;
  }

  .welcome-text {
    font-size: 0.75rem;
  }

  .github-button {
    padding: 0.125rem 0.5rem;
    height: 20px;
    font-size: 0.75rem;
  }

  .content-section {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0 0.25rem 0.25rem;
    min-height: 600px;
  }

  .history-page {
    padding: 0.25rem;
    min-height: calc(100vh - 120px);
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 1rem;
  }

  .welcome-text {
    font-size: 0.7rem;
  }

  .content-section {
    padding: 0 0.125rem 0.125rem;
    gap: 0.25rem;
    min-height: 650px;
  }

  .history-page {
    padding: 0.125rem;
  }
}
</style>
