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
              <el-button :icon="Upload" text bg>导入数据</el-button>
            </el-upload>
            <el-button :icon="Download" @click="exportData" text bg>导出数据</el-button>
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
          <el-form label-position="top" size="small" class="responsive-form">
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

            <el-form-item label="备注" class="form-item-full-width">
              <el-input
                v-model="notes"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
                size="small"
              />
            </el-form-item>

            <el-form-item class="form-item-full-width">
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
import {
  CaretRight,
  Download,
  Timer,
  Upload,
  VideoPlay
} from '@element-plus/icons-vue'
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
    resetForm()
  } catch (error) {
    // 处理记录保存失败的情况
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
        // 处理数据导入成功的情况
      } else {
        // 处理数据导入失败的情况
      }
    } catch (error) {
      // 处理数据导入失败的情况
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
  } catch (error) {
    // 处理数据导出失败的情况
  }
}
</script>

<style scoped>
.record-form {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-card) {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

:deep(.el-card__header) {
  flex-shrink: 0;
}

:deep(.el-card__body) {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 10px; /* 减少一些内边距给表单留出空间 */
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.form-actions .el-button {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 8px;
}

.form-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 减小间距 */
}

.responsive-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 1rem;
  flex-grow: 1;
  flex-direction: column; /* 保持列方向，虽然grid会覆盖，但为flex-grow服务 */
}

.form-item-full-width {
  grid-column: 1 / -1;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.form-item-full-width :deep(.el-form-item__content) {
  flex-grow: 1;
}

.form-item-full-width :deep(.el-textarea__inner) {
  height: 100% !important;
  min-height: 48px; /* 保证一个最小高度 */
}

.timer-section {
  flex-shrink: 0;
}

.form-action-center {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.form-fields {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex子元素收缩 */
}

.timer-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px;
  border: none;
}

:deep(.timer-card .el-card__body) {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  height: auto;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.timer-icon {
  font-size: 2.5rem;
}

.timer-text {
  font-size: 2.8rem;
  font-weight: 600;
  font-family: 'Courier New', Courier, monospace;
}

.timer-controls {
  display: flex;
  gap: 1rem;
}

.timer-controls .el-button {
  --el-button-text-color: white;
  --el-button-hover-text-color: white;
  border-radius: 8px;
  border-color: rgba(255, 255, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.2);
}

.timer-controls .el-button.is-disabled {
  border-color: rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.timer-controls .el-button--primary:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.7);
}

.timer-controls .el-button--danger {
  --el-button-hover-bg-color: #f89898;
  --el-button-active-bg-color: #f78181;
  --el-button-active-border-color: #f78181;
}

:deep(.el-form-item__label) {
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
}

:deep(.el-rate__icon) {
  font-size: 24px;
}

:deep(.el-select) {
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  :deep(.el-card__body) {
    padding: 1rem;
  }

  .form-header {
    font-size: 1rem;
  }

  .timer-icon {
    font-size: 2rem;
  }

  .timer-text {
    font-size: 2.2rem;
  }

  .responsive-form {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style> 