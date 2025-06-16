<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
import { Delete, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
// import type { MasturbationRecord } from '@/types/record'

defineOptions({
  name: 'HistoryList'
})

const store = useRecordStore()
const searchQuery = ref('')
const selectedRecords = ref<string[]>([])

// 搜索过滤
const filteredRecords = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return store.records.filter(record => {
    if (!query) return true
    return (
      record.notes?.toLowerCase().includes(query) ||
      record.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      record.location?.toLowerCase().includes(query)
    )
  })
})

// 格式化时间
const formatTime = (date: Date) => {
  return new Date(date).toLocaleString()
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 删除记录
const handleDelete = async (ids: string[]) => {
  try {
    await store.deleteRecords(ids)
    selectedRecords.value = []
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 处理选择变化
const handleSelectionChange = (val: any[]) => {
  selectedRecords.value = val.map(item => item.id)
}
</script>

<template>
  <div class="history-list">
    <el-card>
      <template #header>
        <div class="list-header">
          <span>历史记录</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索记录..."
              :prefix-icon="Search"
              clearable
              size="small"
            />
            <el-button
              type="danger"
              :icon="Delete"
              :disabled="!selectedRecords.length"
              @click="handleDelete(selectedRecords)"
              size="small"
            >
              删除选中
            </el-button>
          </div>
        </div>
      </template>

      <div class="list-content">
        <el-table
          :data="filteredRecords"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          size="small"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column prop="startTime" label="开始时间" width="140">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="时长" width="80">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column prop="mood" label="心情" width="80">
            <template #default="{ row }">
              <el-rate
                v-model="row.mood"
                disabled
                :colors="['#F56C6C', '#E6A23C', '#67C23A']"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column prop="energy" label="精力" width="80">
            <template #default="{ row }">
              <el-rate
                v-model="row.energy"
                disabled
                :colors="['#F56C6C', '#E6A23C', '#67C23A']"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column prop="tags" label="标签" width="120">
            <template #default="{ row }">
              <el-tag
                v-for="tag in row.tags"
                :key="tag"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" width="80" />
          <el-table-column prop="notes" label="备注" show-overflow-tooltip />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.history-list {
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 180px);
  min-height: 350px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.95);
}

:deep(.el-card__header) {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
}

:deep(.el-card__body) {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
  min-height: 280px;
  max-height: calc(100vh - 250px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9));
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.list-content {
  flex: 1;
  min-height: 250px;
  max-height: calc(100vh - 320px);
  overflow: hidden;
  margin-top: 12px;
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
}

:deep(.el-table) {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  font-size: 13px;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-table__inner-wrapper) {
  height: 100%;
  border-radius: 12px;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: rgba(102, 126, 234, 0.05);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background: rgba(102, 126, 234, 0.5);
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.08);
}

:deep(.el-table__header) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 12px 12px 0 0;
}

:deep(.el-table__header .el-table__cell) {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
  background: transparent;
}

:deep(.el-table__row) {
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

:deep(.el-table__row:hover) {
  background: rgba(102, 126, 234, 0.05) !important;
  transform: scale(1.002);
}

:deep(.el-table__row:nth-child(even)) {
  background: rgba(248, 250, 252, 0.5);
}

:deep(.el-table__row:nth-child(even):hover) {
  background: rgba(102, 126, 234, 0.08) !important;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 2px;
  border-radius: 6px;
  font-size: 11px;
  padding: 2px 6px;
  height: 20px;
  line-height: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-8));
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-5);
  font-weight: 500;
  transition: all 0.3s ease;
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

:deep(.el-input) {
  width: 160px;
}

:deep(.el-input__wrapper) {
  padding: 0 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid rgba(102, 126, 234, 0.2);
  background: rgba(255, 255, 255, 0.8);
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4);
  background: rgba(255, 255, 255, 0.9);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  background: white;
}

:deep(.el-input__inner) {
  height: 32px;
  font-size: 13px;
}

:deep(.el-button--small) {
  padding: 6px 12px;
  height: 32px;
  font-size: 13px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--small:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, var(--el-color-danger), var(--el-color-danger-light-3));
  border: none;
  color: white;
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(135deg, var(--el-color-danger-dark-2), var(--el-color-danger));
}

:deep(.el-rate--small) {
  height: 20px;
}

:deep(.el-rate--small .el-rate__item) {
  font-size: 14px;
  margin-right: 2px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .history-list {
    min-height: 350px;
  }

  :deep(.el-card__header) {
    padding: 0.75rem;
  }

  :deep(.el-card__body) {
    padding: 0.75rem;
  }

  .list-content {
    min-height: 250px;
    margin-top: 8px;
  }

  .list-header {
    font-size: 14px;
    margin-bottom: 0.25rem;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  :deep(.el-input) {
    width: 140px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table .el-table__cell) {
    padding: 6px 0;
    font-size: 12px;
  }

  :deep(.el-button--small) {
    padding: 4px 8px;
    height: 28px;
    font-size: 12px;
  }

  .tag-item {
    font-size: 10px;
    height: 18px;
    line-height: 14px;
    padding: 1px 4px;
  }
}

@media (max-width: 480px) {
  .history-list {
    min-height: 320px;
  }

  :deep(.el-card__header) {
    padding: 0.5rem;
  }

  :deep(.el-card__body) {
    padding: 0.5rem;
  }

  .list-content {
    min-height: 220px;
    margin-top: 6px;
  }

  .list-header {
    font-size: 13px;
  }

  .header-actions {
    gap: 6px;
  }

  :deep(.el-input) {
    width: 120px;
  }

  :deep(.el-table) {
    font-size: 11px;
  }

  :deep(.el-table .el-table__cell) {
    padding: 4px 0;
    font-size: 11px;
  }

  :deep(.el-button--small) {
    padding: 3px 6px;
    height: 24px;
    font-size: 11px;
  }

  .tag-item {
    font-size: 9px;
    height: 16px;
    line-height: 12px;
    padding: 1px 3px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'HistoryList'
}
</script> 