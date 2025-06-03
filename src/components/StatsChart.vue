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
  min-height: 350px;
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
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

:deep(.el-card__body) {
  flex: 1;
  padding: 8px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  font-size: 14px;
}

.chart-content {
  flex: 1;
  min-height: 280px;
  width: 100%;
  height: 100%;
  position: relative;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .stats-chart {
    min-height: 300px;
  }

  :deep(.el-card__body) {
    min-height: 250px;
  }

  .chart-content {
    min-height: 230px;
  }

  .chart-header {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .stats-chart {
    min-height: 280px;
  }

  :deep(.el-card__body) {
    min-height: 230px;
  }

  .chart-content {
    min-height: 210px;
  }

  .chart-header {
    font-size: 12px;
  }
}
</style>

<script lang="ts">
export default {
  name: 'StatsChart'
}
</script> 