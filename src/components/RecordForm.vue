<template>
  <div class="record-form">
    <el-card>
      <template #header>
        <div class="form-header">
          <span>记录表单</span>
          <div class="form-actions">
            <el-upload
              class="upload-demo"
              action=""
              :auto-upload="false"
              :show-file-list="false"
              accept=".json"
              @change="handleFileChange"
            >
              <el-button :icon="Upload">导入数据</el-button>
            </el-upload>
            <el-button :icon="Download" @click="exportData">导出数据</el-button>
          </div>
        </div>
      </template>

      <div class="form-content">
        <div class="timer-section">
          <el-card class="timer-card" shadow="hover">
            <div class="timer-display">
              <el-icon class="timer-icon"><Timer /></el-icon>
              <span class="timer-text">{{ timerDisplay }}</span>
            </div>
            <div class="timer-controls">
              <el-button
                type="primary"
                :icon="VideoPlay"
                @click="startRecording"
                :disabled="isRecording"
                size="small"
              >
                开始
              </el-button>
              <el-button
                type="danger"
                :icon="CaretRight"
                @click="stopRecording"
                :disabled="!isRecording"
                size="small"
              >
                停止
              </el-button>
            </div>
          </el-card>
        </div>

        <div class="form-fields">
          <el-form label-position="top" size="small">
            <el-form-item label="心情评分">
              <el-rate
                v-model="mood"
                :max="5"
                :colors="['#F56C6C', '#E6A23C', '#67C23A']"
                size="small"
              />
            </el-form-item>

            <el-form-item label="精力评分">
              <el-rate
                v-model="energy"
                :max="5"
                :colors="['#F56C6C', '#E6A23C', '#67C23A']"
                size="small"
              />
            </el-form-item>

            <el-form-item label="标签">
              <el-select
                v-model="tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或创建标签"
                size="small"
              >
                <el-option
                  v-for="tag in ['快乐', '疲惫', '兴奋', '放松']"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="位置">
              <el-input v-model="location" placeholder="请输入位置" size="small" />
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="notes"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
                size="small"
              />
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="isPrivate" size="small">私密记录</el-checkbox>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
import { ElMessage } from 'element-plus'
import { Timer, CaretRight, VideoPlay, Upload, Download } from '@element-plus/icons-vue'
import type { MasturbationRecord } from '@/types/record'
import type { UploadFile } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'

defineOptions({
  name: 'RecordForm'
})

const store = useRecordStore()
const isRecording = ref(false)
const startTime = ref<Date | null>(null)
const timer = ref<number | null>(null)
const duration = ref(0)
const mood = ref<number>(3)
const energy = ref<number>(3)
const notes = ref('')
const tags = ref<string[]>([])
const location = ref('')
const isPrivate = ref(false)

// 计时器显示
const timerDisplay = computed(() => {
  const minutes = Math.floor(duration.value / 60)
  const seconds = duration.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 开始记录
const startRecording = () => {
  isRecording.value = true
  startTime.value = new Date()
  duration.value = 0
  timer.value = window.setInterval(() => {
    duration.value++
  }, 1000)
}

// 停止记录
const stopRecording = async () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  
  if (!startTime.value) return
  
  const record: MasturbationRecord = {
    id: uuidv4(),
    startTime: startTime.value,
    endTime: new Date(),
    duration: duration.value,
    mood: mood.value,
    energy: energy.value,
    notes: notes.value || undefined,
    tags: tags.value.length ? tags.value : undefined,
    location: location.value || undefined,
    isPrivate: isPrivate.value
  }
  
  try {
    await store.addRecord(record)
    ElMessage.success('记录保存成功')
    resetForm()
  } catch (error) {
    ElMessage.error('记录保存失败')
  }
}

// 重置表单
const resetForm = () => {
  isRecording.value = false
  startTime.value = null
  duration.value = 0
  mood.value = 3
  energy.value = 3
  notes.value = ''
  tags.value = []
  location.value = ''
  isPrivate.value = false
}

// 处理文件上传变化
const handleFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const jsonData = e.target?.result as string
      const success = await store.importData(jsonData)
      if (success) {
        ElMessage.success('数据导入成功')
      } else {
        ElMessage.error('数据导入失败')
      }
    } catch (error) {
      ElMessage.error('数据导入失败')
    }
  }
  reader.readAsText(file)
}

// 导出数据
const exportData = async () => {
  try {
    const data = await store.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dickhelper-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  }
}
</script>

<style scoped>
.record-form {
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

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.form-actions {
  display: flex;
  gap: 4px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.timer-section {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.timer-card {
  width: 100%;
  max-width: 180px;
  text-align: center;
  background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 6px;
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.timer-icon {
  font-size: 14px;
  color: var(--el-color-primary);
}

.timer-text {
  font-size: 18px;
  font-weight: 600;
  font-family: monospace;
  color: var(--el-color-primary);
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.form-fields {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px;
}

:deep(.el-form-item) {
  margin-bottom: 6px;
}

:deep(.el-form-item__label) {
  padding-bottom: 2px;
  font-size: 12px;
  line-height: 1.2;
}

:deep(.el-form-item__content) {
  line-height: 1.2;
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

:deep(.el-select) {
  width: 100%;
}

:deep(.el-rate) {
  height: 20px;
}

:deep(.el-rate__item) {
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  font-size: 12px;
  padding: 4px 6px;
}

:deep(.el-checkbox) {
  font-size: 12px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .timer-card {
    max-width: 160px;
    padding: 4px;
  }

  .timer-text {
    font-size: 16px;
  }

  .form-fields {
    padding: 0 1px;
  }

  :deep(.el-form-item) {
    margin-bottom: 4px;
  }

  :deep(.el-form-item__label) {
    font-size: 11px;
  }

  :deep(.el-button--small) {
    padding: 2px 4px;
    height: 20px;
    font-size: 11px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'RecordForm'
}
</script> 