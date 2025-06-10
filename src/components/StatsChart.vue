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
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['次数', '平均时长', '平均心情', '平均精力'],
      top: 40,
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 80
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: [
      {
        type: 'value',
        name: '次数/时长'
      },
      {
        type: 'value',
        name: '评分',
        min: 0,
        max: 5
      }
    ],
    series: [
      {
        name: '次数',
        type: 'bar',
        data: store.stats.frequency
      },
      {
        name: '平均时长',
        type: 'line',
        data: store.stats.averageDuration
      },
      {
        name: '平均心情',
        type: 'line',
        yAxisIndex: 1,
        data: store.stats.averageMood
      },
      {
        name: '平均精力',
        type: 'line',
        yAxisIndex: 1,
        data: store.stats.averageEnergy
      }
    ],
    media: [
      {
        query: {
          maxWidth: 500
        },
        option: {
          grid: {
            left: '12%',
            right: '5%',
            top: 80,
            bottom: '15%'
          },
          legend: {
            top: 40,
            left: 'center',
            orient: 'horizontal'
          },
          title: {
            textStyle: {
              fontSize: 14
            }
          },
          xAxis: {
            axisLabel: {
              rotate: 45
            }
          }
        }
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
  padding: 0.5rem;
  min-height: 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-content {
  width: 100%;
  height: 100%;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .chart-header {
    font-size: 1rem;
  }
}
</style> 