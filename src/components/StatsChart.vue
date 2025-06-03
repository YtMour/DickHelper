<template>
  <div class="stats-chart">
    <el-card>
      <template #header>
        <div class="chart-header">
          <span>统计图表</span>
        </div>
      </template>
      <div class="chart-content" ref="chartContainer"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

defineOptions({
  name: 'StatsChart'
})

const store = useRecordStore()
const chartContainer = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 初始化图表
const initChart = async () => {
  if (!chartContainer.value) return
  
  await nextTick()
  
  if (chart) {
    chart.dispose()
  }
  
  chart = echarts.init(chartContainer.value)
  updateChart()
  
  // 确保图表在容器大小变化时重新调整
  const resizeObserver = new ResizeObserver(() => {
    if (chart) {
      chart.resize()
    }
  })
  resizeObserver.observe(chartContainer.value)
}

// 更新图表数据
const updateChart = () => {
  if (!chart || !store.stats) return

  const option: EChartsOption = {
    title: {
      text: '活动统计',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      textStyle: {
        fontSize: 12
      }
    },
    legend: {
      data: ['次数', '平均时长', '平均心情', '平均精力'],
      top: 35,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '10%',
      top: 65,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '次数',
        position: 'left',
        axisLabel: {
          fontSize: 11
        },
        nameTextStyle: {
          fontSize: 11
        }
      },
      {
        type: 'value',
        name: '评分',
        position: 'right',
        min: 0,
        max: 5,
        axisLabel: {
          fontSize: 11
        },
        nameTextStyle: {
          fontSize: 11
        }
      }
    ],
    series: [
      {
        name: '次数',
        type: 'bar',
        data: [store.stats.frequencyPerWeek]
      },
      {
        name: '平均时长',
        type: 'line',
        data: [store.stats.averageDuration]
      },
      {
        name: '平均心情',
        type: 'line',
        yAxisIndex: 1,
        data: [store.stats.averageMood]
      },
      {
        name: '平均精力',
        type: 'line',
        yAxisIndex: 1,
        data: [store.stats.averageEnergy]
      }
    ]
  }

  chart.setOption(option, { notMerge: true })
}

// 监听窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize({ animation: { duration: 300 } })
  }
}

// 监听数据变化
watch(() => store.stats, updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.stats-chart {
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 250px);
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
  max-height: calc(100vh - 320px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9));
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  position: relative;
}

.chart-header::after {
  content: '📊';
  position: absolute;
  right: 0;
  font-size: 18px;
  opacity: 0.7;
}

.chart-content {
  flex: 1;
  min-height: 250px;
  max-height: calc(100vh - 380px);
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at 30% 30%, rgba(102, 126, 234, 0.05), transparent 70%);
  border-radius: 12px;
  padding: 8px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .stats-chart {
    min-height: 300px;
  }

  :deep(.el-card__header) {
    padding: 0.75rem;
  }

  :deep(.el-card__body) {
    padding: 0.75rem;
    min-height: 250px;
  }

  .chart-content {
    min-height: 230px;
    padding: 6px;
  }

  .chart-header {
    font-size: 14px;
  }

  .chart-header::after {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .stats-chart {
    min-height: 280px;
  }

  :deep(.el-card__header) {
    padding: 0.5rem;
  }

  :deep(.el-card__body) {
    padding: 0.5rem;
    min-height: 230px;
  }

  .chart-content {
    min-height: 210px;
    padding: 4px;
  }

  .chart-header {
    font-size: 13px;
  }

  .chart-header::after {
    font-size: 14px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'StatsChart'
}
</script> 