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
  min-height: 500px;
  max-height: none;
  overflow: visible;
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
  overflow: visible;
  min-height: 400px;
  max-height: none;
  display: flex;
  flex-direction: column;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-actions {
  display: flex;
  gap: 8px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: auto;
  min-height: 0;
  overflow: visible;
}

.timer-section {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 0.75rem;
}

.timer-card {
  width: 100%;
  max-width: 200px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  padding: 1rem 0.75rem;
  border-radius: 16px;
  color: white;
  position: relative;
  overflow: hidden;
}

.timer-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  pointer-events: none;
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.timer-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.timer-text {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

:deep(.timer-card .el-button) {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

:deep(.timer-card .el-button:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

:deep(.timer-card .el-button:disabled) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.5) !important;
}

.form-fields {
  flex: 1;
  min-height: 300px;
  max-height: none;
  overflow-y: auto;
  padding: 0 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
}

.form-fields::-webkit-scrollbar {
  width: 6px;
}

.form-fields::-webkit-scrollbar-track {
  background: transparent;
}

.form-fields::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.form-fields::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

:deep(.el-form-item) {
  margin-bottom: 0.75rem;
  background: rgba(102, 126, 234, 0.02);
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

:deep(.el-form-item:hover) {
  background: rgba(102, 126, 234, 0.05);
  border-color: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

:deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-size: 14px;
  line-height: 1.2;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:deep(.el-form-item__content) {
  line-height: 1.2;
}

:deep(.el-input__wrapper) {
  padding: 0 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

:deep(.el-input__inner) {
  height: 32px;
  font-size: 14px;
}

:deep(.el-button--small) {
  padding: 6px 12px;
  height: 32px;
  font-size: 14px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--small:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-rate) {
  height: 28px;
}

:deep(.el-rate__item) {
  font-size: 18px;
  margin-right: 4px;
}

:deep(.el-textarea__inner) {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

:deep(.el-textarea__inner:hover) {
  border-color: rgba(102, 126, 234, 0.4);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

:deep(.el-checkbox) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* 上传按钮样式 */
:deep(.upload-demo .el-button) {
  background: linear-gradient(135deg, var(--el-color-success), var(--el-color-success-light-3));
  border: none;
  color: white;
  font-weight: 500;
}

:deep(.upload-demo .el-button:hover) {
  background: linear-gradient(135deg, var(--el-color-success-dark-2), var(--el-color-success));
}

/* 响应式布局 */
@media (max-width: 768px) {
  .record-form {
    min-height: 450px;
  }

  :deep(.el-card__body) {
    min-height: 350px;
  }

  .form-fields {
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .record-form {
    min-height: 400px;
  }

  :deep(.el-card__body) {
    min-height: 320px;
  }

  .form-fields {
    min-height: 220px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'RecordForm'
}
</script> 