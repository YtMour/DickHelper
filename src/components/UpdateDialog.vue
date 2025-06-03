<template>
  <div class="update-dialog">
    <!-- 临时占位 -->
    <el-dialog
      v-model="visible"
      title="更新提示"
      width="30%"
      align-center
    >
      <span>发现新版本，是否更新？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdate">
            更新
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'UpdateDialog'
})

const visible = ref(false)

const handleUpdate = () => {
  // TODO: 实现更新逻辑
  visible.value = false
}
</script>

<style scoped>
.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<script lang="ts">
export default {
  name: 'UpdateDialog'
}
</script> 