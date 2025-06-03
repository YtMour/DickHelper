<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
import { Delete, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { MasturbationRecord } from '@/types/record'

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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

:deep(.el-card__header) {
  padding: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

:deep(.el-card__body) {
  flex: 1;
  padding: 6px;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.list-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 4px;
  position: relative;
}

:deep(.el-table) {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  font-size: 12px;
}

:deep(.el-table__inner-wrapper) {
  height: 100%;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

:deep(.el-table .el-table__cell) {
  padding: 2px 0;
  font-size: 12px;
}

:deep(.el-table__header) {
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-table__header .el-table__cell) {
  font-size: 12px;
  font-weight: 500;
}

:deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

.tag-item {
  margin-right: 2px;
  margin-bottom: 1px;
  border-radius: 3px;
  font-size: 10px;
  padding: 0 3px;
  height: 16px;
  line-height: 14px;
}

:deep(.el-input) {
  width: 120px;
}

:deep(.el-input__wrapper) {
  padding: 0 6px;
}

:deep(.el-input__inner) {
  height: 24px;
  font-size: 12px;
}

:deep(.el-button--small) {
  padding: 3px 6px;
  height: 24px;
  font-size: 12px;
}

:deep(.el-rate--small) {
  height: 16px;
}

:deep(.el-rate--small .el-rate__item) {
  font-size: 12px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  :deep(.el-card__header) {
    padding: 4px;
  }

  :deep(.el-card__body) {
    padding: 4px;
  }

  .list-header {
    font-size: 12px;
  }

  .header-actions {
    flex-direction: column;
    gap: 2px;
  }

  :deep(.el-input) {
    width: 100px;
  }

  :deep(.el-table) {
    font-size: 11px;
  }

  :deep(.el-table .el-table__cell) {
    padding: 1px 0;
    font-size: 11px;
  }

  :deep(.el-button--small) {
    padding: 2px 4px;
    height: 20px;
    font-size: 11px;
  }

  .tag-item {
    font-size: 9px;
    height: 14px;
    line-height: 12px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'HistoryList'
}
</script> 