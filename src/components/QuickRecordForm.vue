<template>
  <div class="quick-record-form">
    <el-form @submit.prevent="handleSubmit">
      <el-form-item label="开始时间">
        <el-date-picker
          v-model="formData.startTime"
          type="datetime"
          placeholder="选择开始时间"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="时长（分钟）">
        <el-input-number
          v-model="formData.duration"
          :min="1"
          :max="300"
          placeholder="输入时长"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="心情评分">
        <el-rate v-model="formData.mood" :max="5" />
      </el-form-item>
      
      <el-form-item label="精力评分">
        <el-rate v-model="formData.energy" :max="5" />
      </el-form-item>
      
      <el-form-item label="备注">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="添加备注（可选）"
        />
      </el-form-item>
      
      <div class="form-actions">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'

defineOptions({
  name: 'QuickRecordForm'
})

const emit = defineEmits(['saved', 'cancel'])

const store = useRecordStore()

const formData = ref({
  startTime: new Date(),
  duration: 5,
  mood: 3,
  energy: 3,
  notes: ''
})

const handleSubmit = async () => {
  try {
    const record = {
      id: uuidv4(),
      startTime: formData.value.startTime,
      endTime: new Date(formData.value.startTime.getTime() + formData.value.duration * 60 * 1000),
      duration: formData.value.duration * 60, // 转换为秒
      mood: formData.value.mood,
      energy: formData.value.energy,
      notes: formData.value.notes || undefined,
      tags: [],
      location: undefined,
      isPrivate: false
    }
    
    await store.addRecord(record)
    ElMessage.success('记录保存成功')
    emit('saved')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.quick-record-form {
  padding: 1rem 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
