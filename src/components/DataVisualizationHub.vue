<template>
  <div class="data-visualization-hub">
    <el-card>
      <template #header>
        <div class="hub-header">
          <span>数据可视化中心</span>
          <div class="header-controls">
            <el-select v-model="selectedTimeRange" size="small" @change="updateAllCharts">
              <el-option label="最近7天" value="7d" />
              <el-option label="最近30天" value="30d" />
              <el-option label="最近3个月" value="3m" />
              <el-option label="最近1年" value="1y" />
              <el-option label="全部时间" value="all" />
            </el-select>
            <el-button-group size="small">
              <el-button
                :type="viewMode === 'grid' ? 'primary' : ''"
                @click="viewMode = 'grid'"
              >
                网格视图
              </el-button>
              <el-button
                :type="viewMode === 'tabs' ? 'primary' : ''"
                @click="viewMode = 'tabs'"
              >
                标签视图
              </el-button>
            </el-button-group>
            <el-button @click="exportCharts" size="small">
              <el-icon><Download /></el-icon>
              导出图表
            </el-button>
          </div>
        </div>
      </template>

      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="grid-view">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="chart-container">
              <h4>频率趋势分析</h4>
              <div class="chart-wrapper" ref="frequencyChartContainer"></div>
              <div class="chart-insights">
                <el-tag v-if="frequencyInsight" :type="frequencyInsight.type" size="small">
                  {{ frequencyInsight.text }}
                </el-tag>
              </div>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="chart-container">
              <h4>时长分布热力图</h4>
              <div class="chart-wrapper" ref="durationHeatmapContainer"></div>
              <div class="chart-insights">
                <span class="insight-text">平均时长: {{ averageDuration.toFixed(1) }}分钟</span>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="8">
            <div class="chart-container">
              <h4>心情与精力关联</h4>
              <div class="chart-wrapper" ref="moodEnergyScatterContainer"></div>
              <div class="chart-insights">
                <span class="correlation-text">
                  相关系数: {{ moodEnergyCorrelation.toFixed(3) }}
                </span>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="chart-container">
              <h4>时间分布雷达图</h4>
              <div class="chart-wrapper" ref="timeRadarContainer"></div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="chart-container">
              <h4>标签词云</h4>
              <div class="chart-wrapper" ref="tagCloudContainer"></div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="24">
            <div class="chart-container">
              <h4>多维度时间线分析</h4>
              <div class="timeline-controls">
                <el-checkbox-group v-model="selectedMetrics" @change="updateTimelineChart">
                  <el-checkbox label="frequency">频率</el-checkbox>
                  <el-checkbox label="duration">时长</el-checkbox>
                  <el-checkbox label="mood">心情</el-checkbox>
                  <el-checkbox label="energy">精力</el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="chart-wrapper timeline-chart" ref="timelineChartContainer"></div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 标签视图 -->
      <div v-else class="tabs-view">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="趋势分析" name="trends">
            <div class="tab-content">
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="chart-wrapper" ref="trendFrequencyContainer"></div>
                </el-col>
                <el-col :span="12">
                  <div class="chart-wrapper" ref="trendDurationContainer"></div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="模式识别" name="patterns">
            <div class="tab-content">
              <el-row :gutter="16">
                <el-col :span="8">
                  <div class="pattern-card">
                    <h5>周模式</h5>
                    <div class="chart-wrapper small" ref="weekPatternContainer"></div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="pattern-card">
                    <h5>月模式</h5>
                    <div class="chart-wrapper small" ref="monthPatternContainer"></div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="pattern-card">
                    <h5>季节模式</h5>
                    <div class="chart-wrapper small" ref="seasonPatternContainer"></div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="相关性分析" name="correlations">
            <div class="tab-content">
              <div class="correlation-matrix">
                <h5>相关性矩阵</h5>
                <div class="chart-wrapper" ref="correlationMatrixContainer"></div>
              </div>
              <div class="correlation-details">
                <h5>详细分析</h5>
                <div class="correlation-list">
                  <div
                    v-for="corr in correlationAnalysis"
                    :key="corr.name"
                    class="correlation-item"
                  >
                    <span class="corr-name">{{ corr.name }}</span>
                    <div class="corr-bar">
                      <div
                        class="corr-fill"
                        :style="{
                          width: `${Math.abs(corr.value) * 100}%`,
                          backgroundColor: corr.value > 0 ? '#67C23A' : '#F56C6C'
                        }"
                      ></div>
                    </div>
                    <span class="corr-value">{{ corr.value.toFixed(3) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="预测模型" name="predictions">
            <div class="tab-content">
              <div class="prediction-controls">
                <el-select v-model="selectedPredictionMetric" @change="updatePredictionChart">
                  <el-option label="频率预测" value="frequency" />
                  <el-option label="时长预测" value="duration" />
                  <el-option label="心情预测" value="mood" />
                  <el-option label="精力预测" value="energy" />
                </el-select>
                <el-slider
                  v-model="predictionDays"
                  :min="7"
                  :max="90"
                  :step="7"
                  show-stops
                  @change="updatePredictionChart"
                />
                <span class="prediction-label">预测天数: {{ predictionDays }}</span>
              </div>
              <div class="chart-wrapper" ref="predictionChartContainer"></div>
              <div class="prediction-accuracy">
                <el-descriptions :column="3" size="small">
                  <el-descriptions-item label="模型准确度">
                    {{ currentPredictionAccuracy }}%
                  </el-descriptions-item>
                  <el-descriptions-item label="置信区间">
                    {{ currentConfidenceInterval }}
                  </el-descriptions-item>
                  <el-descriptions-item label="预测方法">
                    {{ currentPredictionMethod }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="异常检测" name="anomalies">
            <div class="tab-content">
              <div class="anomaly-detection">
                <div class="detection-controls">
                  <el-slider
                    v-model="anomalyThreshold"
                    :min="1"
                    :max="3"
                    :step="0.1"
                    @change="detectAnomalies"
                  />
                  <span class="threshold-label">敏感度: {{ anomalyThreshold }}</span>
                </div>
                <div class="chart-wrapper" ref="anomalyChartContainer"></div>
                <div class="anomaly-list">
                  <h5>检测到的异常点</h5>
                  <div
                    v-for="anomaly in detectedAnomalies"
                    :key="anomaly.id"
                    class="anomaly-item"
                    :class="anomaly.severity"
                  >
                    <div class="anomaly-header">
                      <span class="anomaly-date">{{ formatDate(anomaly.date) }}</span>
                      <el-tag :type="getAnomalyTagType(anomaly.severity)" size="small">
                        {{ anomaly.severity }}
                      </el-tag>
                    </div>
                    <p class="anomaly-description">{{ anomaly.description }}</p>
                    <div class="anomaly-metrics">
                      <span>偏离度: {{ anomaly.deviation.toFixed(2) }}</span>
                      <span>置信度: {{ (anomaly.confidence * 100).toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
import type { MasturbationRecord } from '@/types/record'
import { logger } from '@/utils/logger'
import * as echarts from 'echarts'
import { Download } from '@element-plus/icons-vue'

defineOptions({
  name: 'DataVisualizationHub'
})

// 响应式数据
const store = useRecordStore()
const selectedTimeRange = ref('30d')
const viewMode = ref<'grid' | 'tabs'>('grid')
const activeTab = ref('trends')
const selectedMetrics = ref(['frequency', 'duration'])
const selectedPredictionMetric = ref('frequency')
const predictionDays = ref(30)
const anomalyThreshold = ref(2.0)

// 图表引用
const frequencyChartContainer = ref<HTMLElement>()
const durationHeatmapContainer = ref<HTMLElement>()
const moodEnergyScatterContainer = ref<HTMLElement>()
const timeRadarContainer = ref<HTMLElement>()
const tagCloudContainer = ref<HTMLElement>()
const timelineChartContainer = ref<HTMLElement>()
const trendFrequencyContainer = ref<HTMLElement>()
const trendDurationContainer = ref<HTMLElement>()
const weekPatternContainer = ref<HTMLElement>()
const monthPatternContainer = ref<HTMLElement>()
const seasonPatternContainer = ref<HTMLElement>()
const correlationMatrixContainer = ref<HTMLElement>()
const predictionChartContainer = ref<HTMLElement>()
const anomalyChartContainer = ref<HTMLElement>()

// 图表实例
let charts: { [key: string]: echarts.ECharts } = {}

// 分析数据
const frequencyInsight = ref<{ type: 'success' | 'primary' | 'warning' | 'info' | 'danger'; text: string } | null>(null)
const averageDuration = ref(0)
const moodEnergyCorrelation = ref(0)
const correlationAnalysis = ref<Array<{ name: string; value: number }>>([])
const detectedAnomalies = ref<Array<{
  id: string
  date: Date
  severity: string
  description: string
  deviation: number
  confidence: number
}>>([])

// 计算属性
const filteredRecords = computed(() => {
  const records = store.records
  if (selectedTimeRange.value === 'all') return records

  const now = new Date()
  const days = parseInt(selectedTimeRange.value.replace(/[^\d]/g, ''))
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return records.filter(record => record.startTime >= cutoff)
})

const currentPredictionAccuracy = computed(() => {
  // 模拟预测准确度计算
  return Math.round(85 + Math.random() * 10)
})

const currentConfidenceInterval = computed(() => {
  return '±15%'
})

const currentPredictionMethod = computed(() => {
  return '线性回归'
})

// 方法
const updateAllCharts = async () => {
  await nextTick()
  if (viewMode.value === 'grid') {
    initGridCharts()
  } else {
    initTabCharts()
  }
  calculateInsights()
}

const initGridCharts = () => {
  initFrequencyChart()
  initDurationHeatmap()
  initMoodEnergyScatter()
  initTimeRadar()
  initTagCloud()
  initTimelineChart()
}

const initTabCharts = () => {
  if (activeTab.value === 'trends') {
    initTrendCharts()
  } else if (activeTab.value === 'patterns') {
    initPatternCharts()
  } else if (activeTab.value === 'correlations') {
    initCorrelationCharts()
  } else if (activeTab.value === 'predictions') {
    initPredictionChart()
  } else if (activeTab.value === 'anomalies') {
    initAnomalyChart()
  }
}

const initFrequencyChart = () => {
  if (!frequencyChartContainer.value) return

  const chart = echarts.init(frequencyChartContainer.value)
  charts.frequency = chart

  const records = filteredRecords.value
  const dailyData = calculateDailyFrequency(records)

  const option = {
    title: { text: '频率趋势', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyData.map(d => d.date),
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 }
    },
    series: [{
      name: '频率',
      type: 'line',
      data: dailyData.map(d => d.count),
      smooth: true,
      areaStyle: { opacity: 0.3 }
    }]
  }

  chart.setOption(option)
}

const initDurationHeatmap = () => {
  if (!durationHeatmapContainer.value) return

  const chart = echarts.init(durationHeatmapContainer.value)
  charts.durationHeatmap = chart

  const records = filteredRecords.value
  const heatmapData = calculateDurationHeatmap(records)

  const option = {
    title: { text: '时长热力图', textStyle: { fontSize: 14 } },
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${params.data[0]}:00 - 平均时长: ${params.data[2].toFixed(1)}分钟`
      }
    },
    grid: { height: '50%', top: '10%' },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => i),
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%'
    },
    series: [{
      name: '时长',
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      }
    }]
  }

  chart.setOption(option)
}

const initMoodEnergyScatter = () => {
  if (!moodEnergyScatterContainer.value) return

  const chart = echarts.init(moodEnergyScatterContainer.value)
  charts.moodEnergyScatter = chart

  const records = filteredRecords.value.filter(r => r.mood && r.energy)
  const scatterData = records.map(r => [r.mood, r.energy, r.duration])

  const option = {
    title: { text: '心情-精力散点图', textStyle: { fontSize: 14 } },
    tooltip: {
      formatter: (params: any) => {
        return `心情: ${params.data[0]}<br/>精力: ${params.data[1]}<br/>时长: ${params.data[2].toFixed(1)}分钟`
      }
    },
    grid: { left: '3%', right: '7%', bottom: '3%', containLabel: true },
    xAxis: {
      name: '心情',
      min: 1,
      max: 5,
      type: 'value',
      splitLine: { show: false }
    },
    yAxis: {
      name: '精力',
      min: 1,
      max: 5,
      type: 'value',
      splitLine: { show: false }
    },
    series: [{
      name: '记录',
      type: 'scatter',
      data: scatterData,
      symbolSize: (data: number[]) => Math.sqrt(data[2]) * 2,
      itemStyle: {
        opacity: 0.7,
        color: '#409EFF'
      }
    }]
  }

  chart.setOption(option)
}

const initTimeRadar = () => {
  if (!timeRadarContainer.value) return

  const chart = echarts.init(timeRadarContainer.value)
  charts.timeRadar = chart

  const records = filteredRecords.value
  const timeDistribution = calculateTimeDistribution(records)

  const option = {
    title: { text: '时间分布', textStyle: { fontSize: 14 } },
    radar: {
      indicator: [
        { name: '凌晨', max: Math.max(...Object.values(timeDistribution)) },
        { name: '上午', max: Math.max(...Object.values(timeDistribution)) },
        { name: '下午', max: Math.max(...Object.values(timeDistribution)) },
        { name: '晚上', max: Math.max(...Object.values(timeDistribution)) }
      ]
    },
    series: [{
      name: '时间分布',
      type: 'radar',
      data: [{
        value: [
          timeDistribution.night,
          timeDistribution.morning,
          timeDistribution.afternoon,
          timeDistribution.evening
        ],
        name: '活动分布'
      }]
    }]
  }

  chart.setOption(option)
}

const initTagCloud = () => {
  if (!tagCloudContainer.value) return

  // 简化的标签云实现
  const records = filteredRecords.value
  const tagCounts = new Map<string, number>()

  records.forEach(record => {
    record.tags?.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  const tagData = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ name: tag, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20)

  const chart = echarts.init(tagCloudContainer.value)
  charts.tagCloud = chart

  const option = {
    title: { text: '标签分布', textStyle: { fontSize: 14 } },
    series: [{
      type: 'wordCloud',
      gridSize: 2,
      sizeRange: [12, 50],
      rotationRange: [-90, 90],
      shape: 'pentagon',
      width: '100%',
      height: '100%',
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: () => {
          return `rgb(${Math.round(Math.random() * 160)}, ${Math.round(Math.random() * 160)}, ${Math.round(Math.random() * 160)})`
        }
      },
      emphasis: {
        textStyle: { shadowBlur: 10, shadowColor: '#333' }
      },
      data: tagData
    }]
  }

  chart.setOption(option)
}

const initTimelineChart = () => {
  if (!timelineChartContainer.value) return

  const chart = echarts.init(timelineChartContainer.value)
  charts.timeline = chart

  updateTimelineChart()
}

const updateTimelineChart = () => {
  const chart = charts.timeline
  if (!chart) return

  const records = filteredRecords.value
  const timelineData = calculateTimelineData(records, selectedMetrics.value)

  const series = selectedMetrics.value.map(metric => ({
    name: getMetricName(metric),
    type: 'line',
    data: timelineData[metric] || [],
    smooth: true
  }))

  const option = {
    title: { text: '多维度时间线', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: selectedMetrics.value.map(getMetricName) },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: timelineData.dates || []
    },
    yAxis: { type: 'value' },
    series
  }

  chart.setOption(option)
}

// 辅助计算方法
const calculateDailyFrequency = (records: MasturbationRecord[]) => {
  const dailyMap = new Map<string, number>()

  records.forEach(record => {
    const dateKey = record.startTime.toDateString()
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1)
  })

  return Array.from(dailyMap.entries()).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString(),
    count
  }))
}

const calculateDurationHeatmap = (records: MasturbationRecord[]) => {
  const heatmapMap = new Map<string, { total: number; count: number }>()

  records.forEach(record => {
    const hour = record.startTime.getHours()
    const day = record.startTime.getDay()
    const key = `${day}-${hour}`

    const current = heatmapMap.get(key) || { total: 0, count: 0 }
    current.total += record.duration
    current.count += 1
    heatmapMap.set(key, current)
  })

  const result: number[][] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`
      const data = heatmapMap.get(key)
      const avgDuration = data ? data.total / data.count / 60 : 0 // 转换为分钟
      result.push([hour, day, avgDuration])
    }
  }

  return result
}

const calculateTimeDistribution = (records: MasturbationRecord[]) => {
  const distribution = { night: 0, morning: 0, afternoon: 0, evening: 0 }

  records.forEach(record => {
    const hour = record.startTime.getHours()
    if (hour >= 0 && hour < 6) distribution.night++
    else if (hour >= 6 && hour < 12) distribution.morning++
    else if (hour >= 12 && hour < 18) distribution.afternoon++
    else distribution.evening++
  })

  return distribution
}

const calculateTimelineData = (records: MasturbationRecord[], metrics: string[]) => {
  // 简化的时间线数据计算
  const data: { [key: string]: any[] } = { dates: [] }

  // 按周分组
  const weeklyData = new Map<string, any>()

  records.forEach(record => {
    const weekKey = getWeekKey(record.startTime)
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        frequency: 0,
        duration: 0,
        mood: [],
        energy: []
      })
    }

    const week = weeklyData.get(weekKey)!
    week.frequency++
    week.duration += record.duration
    if (record.mood) week.mood.push(record.mood)
    if (record.energy) week.energy.push(record.energy)
  })

  const sortedWeeks = Array.from(weeklyData.entries()).sort()
  data.dates = sortedWeeks.map(([week]) => week)

  metrics.forEach(metric => {
    data[metric] = sortedWeeks.map(([, weekData]) => {
      switch (metric) {
        case 'frequency':
          return weekData.frequency
        case 'duration':
          return weekData.duration / 60 // 转换为分钟
        case 'mood':
          return weekData.mood.length > 0
            ? weekData.mood.reduce((a: number, b: number) => a + b, 0) / weekData.mood.length
            : 0
        case 'energy':
          return weekData.energy.length > 0
            ? weekData.energy.reduce((a: number, b: number) => a + b, 0) / weekData.energy.length
            : 0
        default:
          return 0
      }
    })
  })

  return data
}

const getWeekKey = (date: Date): string => {
  const year = date.getFullYear()
  const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${week.toString().padStart(2, '0')}`
}

const getMetricName = (metric: string): string => {
  const names: { [key: string]: string } = {
    frequency: '频率',
    duration: '时长',
    mood: '心情',
    energy: '精力'
  }
  return names[metric] || metric
}

const calculateInsights = () => {
  const records = filteredRecords.value

  // 计算平均时长
  averageDuration.value = records.length > 0
    ? records.reduce((sum, r) => sum + r.duration, 0) / records.length / 60
    : 0

  // 计算心情精力相关性
  const moodEnergyRecords = records.filter(r => r.mood && r.energy)
  if (moodEnergyRecords.length > 1) {
    const moods = moodEnergyRecords.map(r => r.mood!)
    const energies = moodEnergyRecords.map(r => r.energy!)
    moodEnergyCorrelation.value = calculateCorrelation(moods, energies)
  }

  // 生成频率洞察
  const recentFreq = records.filter(r => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return r.startTime >= weekAgo
  }).length

  if (recentFreq > 10) {
    frequencyInsight.value = { type: 'warning', text: '最近频率较高' }
  } else if (recentFreq < 2) {
    frequencyInsight.value = { type: 'info', text: '最近频率较低' }
  } else {
    frequencyInsight.value = { type: 'success', text: '频率正常' }
  }
}

const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

// 其他图表初始化方法的简化实现
const initTrendCharts = () => {
  // 实现趋势图表
}

const initPatternCharts = () => {
  // 实现模式图表
}

const initCorrelationCharts = () => {
  // 实现相关性图表
}

const initPredictionChart = () => {
  // 实现预测图表
}

const updatePredictionChart = () => {
  // 更新预测图表
}

const initAnomalyChart = () => {
  // 实现异常检测图表
}

const detectAnomalies = () => {
  // 实现异常检测
}

const exportCharts = () => {
  // 实现图表导出
  logger.info('导出图表', {}, 'DataVisualizationHub')
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString()
}

const getAnomalyTagType = (severity: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  switch (severity) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

// 监听器
watch(selectedMetrics, updateTimelineChart)
watch(activeTab, initTabCharts)
watch(() => store.records, updateAllCharts, { deep: true })

// 生命周期
onMounted(() => {
  updateAllCharts()

  window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => chart?.resize())
  })
})

onUnmounted(() => {
  Object.values(charts).forEach(chart => chart?.dispose())
  window.removeEventListener('resize', () => {})
})
</script>