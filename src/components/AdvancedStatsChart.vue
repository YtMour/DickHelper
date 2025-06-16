<template>
  <div class="advanced-stats-chart">
    <el-card>
      <template #header>
        <div class="chart-header">
          <span>高级统计分析</span>
          <div class="header-actions">
            <el-select v-model="selectedTimeRange" size="small" @change="updateChart">
              <el-option label="最近7天" value="7d" />
              <el-option label="最近30天" value="30d" />
              <el-option label="最近3个月" value="3m" />
              <el-option label="最近1年" value="1y" />
            </el-select>
            <el-button-group size="small">
              <el-button 
                :type="activeTab === 'trends' ? 'primary' : ''"
                @click="activeTab = 'trends'"
              >
                趋势分析
              </el-button>
              <el-button 
                :type="activeTab === 'patterns' ? 'primary' : ''"
                @click="activeTab = 'patterns'"
              >
                模式分析
              </el-button>
              <el-button 
                :type="activeTab === 'health' ? 'primary' : ''"
                @click="activeTab = 'health'"
              >
                健康指标
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div class="chart-content">
        <!-- 趋势分析 -->
        <div v-if="activeTab === 'trends'" class="trends-section">
          <div class="trend-cards">
            <div class="trend-card" v-for="(trend, key) in advancedStats?.trends" :key="key">
              <div class="trend-header">
                <span class="trend-title">{{ getTrendTitle(String(key)) }}</span>
                <el-tag 
                  :type="getTrendType(trend.direction)"
                  size="small"
                >
                  {{ getTrendText(trend.direction) }}
                </el-tag>
              </div>
              <div class="trend-content">
                <div class="trend-value">
                  {{ trend.prediction.toFixed(1) }}
                </div>
                <div class="trend-details">
                  <span>置信度: {{ (trend.confidence * 100).toFixed(0) }}%</span>
                  <span>变化率: {{ trend.changeRate.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="trend-chart" ref="trendChartContainer"></div>
        </div>

        <!-- 模式分析 -->
        <div v-if="activeTab === 'patterns'" class="patterns-section">
          <div class="pattern-grid">
            <div class="pattern-item">
              <h4>周模式</h4>
              <div class="week-pattern">
                <div 
                  v-for="(count, index) in advancedStats?.patterns.weeklyPattern" 
                  :key="index"
                  class="day-bar"
                  :style="{ height: `${(count / maxWeeklyCount) * 100}%` }"
                >
                  <span class="day-label">{{ getDayName(index) }}</span>
                  <span class="day-count">{{ count }}</span>
                </div>
              </div>
            </div>
            
            <div class="pattern-item">
              <h4>时间偏好</h4>
              <div class="time-preferences">
                <div 
                  v-for="pref in advancedStats?.correlations.timeOfDayPreference.slice(0, 6)" 
                  :key="pref.hour"
                  class="time-pref"
                >
                  <span class="time-hour">{{ formatHour(pref.hour) }}</span>
                  <div class="time-bar">
                    <div 
                      class="time-fill"
                      :style="{ width: `${(pref.score / maxTimeScore) * 100}%` }"
                    ></div>
                  </div>
                  <span class="time-score">{{ pref.score }}</span>
                </div>
              </div>
            </div>

            <div class="pattern-item">
              <h4>季节分布</h4>
              <div class="seasonal-chart" ref="seasonalChartContainer"></div>
            </div>
          </div>
        </div>

        <!-- 健康指标 -->
        <div v-if="activeTab === 'health'" class="health-section">
          <div class="health-metrics">
            <div class="metric-card">
              <div class="metric-title">规律性评分</div>
              <div class="metric-score">
                <el-progress 
                  :percentage="advancedStats?.healthMetrics.consistencyScore || 0"
                  :color="getScoreColor(advancedStats?.healthMetrics.consistencyScore || 0)"
                  :stroke-width="8"
                />
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-title">平衡性评分</div>
              <div class="metric-score">
                <el-progress 
                  :percentage="advancedStats?.healthMetrics.balanceScore || 0"
                  :color="getScoreColor(advancedStats?.healthMetrics.balanceScore || 0)"
                  :stroke-width="8"
                />
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-title">整体趋势</div>
              <div class="metric-trend">
                <el-tag 
                  :type="getWellbeingType(advancedStats?.healthMetrics.wellbeingTrend)"
                  size="large"
                >
                  {{ getWellbeingText(advancedStats?.healthMetrics.wellbeingTrend) }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="correlations-section">
            <h4>相关性分析</h4>
            <div class="correlation-items">
              <div class="correlation-item">
                <span>心情与精力相关性</span>
                <div class="correlation-bar">
                  <div 
                    class="correlation-fill"
                    :style="{ 
                      width: `${Math.abs(advancedStats?.correlations.moodEnergyCorrelation || 0) * 100}%`,
                      backgroundColor: (advancedStats?.correlations.moodEnergyCorrelation || 0) > 0 ? '#67C23A' : '#F56C6C'
                    }"
                  ></div>
                </div>
                <span>{{ (advancedStats?.correlations.moodEnergyCorrelation || 0).toFixed(2) }}</span>
              </div>
              
              <div class="correlation-item">
                <span>时长与心情相关性</span>
                <div class="correlation-bar">
                  <div 
                    class="correlation-fill"
                    :style="{ 
                      width: `${Math.abs(advancedStats?.correlations.durationMoodCorrelation || 0) * 100}%`,
                      backgroundColor: (advancedStats?.correlations.durationMoodCorrelation || 0) > 0 ? '#67C23A' : '#F56C6C'
                    }"
                  ></div>
                </div>
                <span>{{ (advancedStats?.correlations.durationMoodCorrelation || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="insights-section">
            <h4>数据洞察</h4>
            <div class="insights-list">
              <div 
                v-for="(insight, index) in advancedStats?.insights" 
                :key="index"
                class="insight-item"
              >
                <el-icon class="insight-icon"><InfoFilled /></el-icon>
                <span>{{ insight }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
// import { AnalyticsService, type AdvancedStats } from '@/services/analytics'
import { InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

defineOptions({
  name: 'AdvancedStatsChart'
})

const store = useRecordStore()
const activeTab = ref('trends')
const selectedTimeRange = ref('30d')
const advancedStats = ref<any>(null)
const trendChartContainer = ref<HTMLElement>()
const seasonalChartContainer = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let seasonalChart: echarts.ECharts | null = null

// 计算属性
const maxWeeklyCount = computed(() => {
  if (!advancedStats.value) return 1
  return Math.max(...advancedStats.value.patterns.weeklyPattern)
})

const maxTimeScore = computed(() => {
  if (!advancedStats.value) return 1
  return Math.max(...advancedStats.value.correlations.timeOfDayPreference.map((p: any) => p.score))
})

// 方法
const getTrendTitle = (key: string): string => {
  const titles: Record<string, string> = {
    frequency: '频率',
    duration: '时长',
    mood: '心情',
    energy: '精力'
  }
  return titles[key] || key
}

const getTrendType = (direction: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  switch (direction) {
    case 'increasing': return 'danger'
    case 'decreasing': return 'success'
    default: return 'info'
  }
}

const getTrendText = (direction: string): string => {
  switch (direction) {
    case 'increasing': return '上升'
    case 'decreasing': return '下降'
    default: return '稳定'
  }
}

const getDayName = (index: number): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[index]
}

const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getWellbeingType = (trend?: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  switch (trend) {
    case 'improving': return 'success'
    case 'declining': return 'danger'
    default: return 'info'
  }
}

const getWellbeingText = (trend?: string): string => {
  switch (trend) {
    case 'improving': return '改善中'
    case 'declining': return '需关注'
    default: return '稳定'
  }
}

const updateChart = async () => {
  try {
    const records = store.records
    // 生成模拟的高级统计数据
    advancedStats.value = generateMockAdvancedStats(records)

    if (activeTab.value === 'trends') {
      await nextTick()
      initTrendChart()
    } else if (activeTab.value === 'patterns') {
      await nextTick()
      initSeasonalChart()
    }
  } catch (error) {
    console.error('更新图表失败:', error)
  }
}

// 生成模拟的高级统计数据
const generateMockAdvancedStats = (_records: any[]) => {
  return {
    trends: {
      frequency: { prediction: Math.random() * 10 + 5, confidence: 0.8, direction: 'stable', changeRate: 2.5 },
      duration: { prediction: Math.random() * 30 + 15, confidence: 0.7, direction: 'increasing', changeRate: 5.2 },
      mood: { prediction: Math.random() * 2 + 3, confidence: 0.9, direction: 'improving', changeRate: 1.8 },
      energy: { prediction: Math.random() * 2 + 3, confidence: 0.85, direction: 'stable', changeRate: 0.5 }
    },
    patterns: {
      weeklyPattern: [3, 5, 4, 6, 7, 8, 2], // 周日到周六
      seasonalPattern: { spring: 25, summer: 30, autumn: 25, winter: 20 }
    },
    correlations: {
      moodEnergyCorrelation: 0.75,
      durationMoodCorrelation: -0.3,
      timeOfDayPreference: [
        { hour: 9, score: 8 },
        { hour: 14, score: 6 },
        { hour: 18, score: 9 },
        { hour: 21, score: 7 },
        { hour: 23, score: 5 },
        { hour: 1, score: 3 }
      ]
    },
    healthMetrics: {
      consistencyScore: Math.floor(Math.random() * 40) + 60,
      balanceScore: Math.floor(Math.random() * 40) + 60,
      wellbeingTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
    },
    insights: [
      '您的记录频率在工作日较高',
      '晚上时段的心情评分普遍较好',
      '建议保持当前的记录习惯'
    ]
  }
}

const initTrendChart = () => {
  if (!trendChartContainer.value || !advancedStats.value) return
  
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartContainer.value)
  
  const option = {
    title: {
      text: '趋势预测',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['频率', '时长', '心情', '精力'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 60
    },
    xAxis: {
      type: 'category',
      data: ['当前', '预测']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '频率',
        type: 'line',
        data: [store.stats.frequency.reduce((a, b) => a + b, 0), advancedStats.value.trends.frequency.prediction]
      },
      {
        name: '时长',
        type: 'line',
        data: [store.stats.averageDuration.reduce((a, b) => a + b, 0) / 7, advancedStats.value.trends.duration.prediction]
      },
      {
        name: '心情',
        type: 'line',
        data: [store.stats.averageMood.reduce((a, b) => a + b, 0) / 7, advancedStats.value.trends.mood.prediction]
      },
      {
        name: '精力',
        type: 'line',
        data: [store.stats.averageEnergy.reduce((a, b) => a + b, 0) / 7, advancedStats.value.trends.energy.prediction]
      }
    ]
  }
  
  trendChart.setOption(option)
}

const initSeasonalChart = () => {
  if (!seasonalChartContainer.value || !advancedStats.value) return
  
  if (seasonalChart) {
    seasonalChart.dispose()
  }
  
  seasonalChart = echarts.init(seasonalChartContainer.value)
  
  const seasonalData = advancedStats.value.patterns.seasonalPattern
  
  const option = {
    title: {
      text: '季节分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: [
          { value: seasonalData.spring, name: '春季' },
          { value: seasonalData.summer, name: '夏季' },
          { value: seasonalData.autumn, name: '秋季' },
          { value: seasonalData.winter, name: '冬季' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  seasonalChart.setOption(option)
}

// 监听数据变化
watch(() => store.records, updateChart, { deep: true })
watch(activeTab, async () => {
  await nextTick()
  if (activeTab.value === 'trends') {
    initTrendChart()
  } else if (activeTab.value === 'patterns') {
    initSeasonalChart()
  }
})

onMounted(() => {
  updateChart()
  window.addEventListener('resize', () => {
    trendChart?.resize()
    seasonalChart?.resize()
  })
})

onUnmounted(() => {
  trendChart?.dispose()
  seasonalChart?.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.advanced-stats-chart {
  width: 100%;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.chart-content {
  min-height: 400px;
}

.trend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.trend-card {
  padding: 1rem;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.trend-title {
  font-weight: 600;
}

.trend-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--el-color-primary);
}

.trend-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.trend-chart {
  height: 300px;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.pattern-item h4 {
  margin: 0 0 1rem 0;
  color: var(--el-text-color-primary);
}

.week-pattern {
  display: flex;
  gap: 0.5rem;
  height: 100px;
  align-items: flex-end;
}

.day-bar {
  flex: 1;
  background: var(--el-color-primary);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
}

.day-label {
  font-size: 0.7rem;
  color: white;
  writing-mode: vertical-rl;
}

.day-count {
  font-size: 0.8rem;
  color: white;
  font-weight: 600;
}

.time-preferences {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-pref {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-hour {
  width: 50px;
  font-size: 0.8rem;
}

.time-bar {
  flex: 1;
  height: 20px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  overflow: hidden;
}

.time-fill {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.3s ease;
}

.time-score {
  width: 30px;
  text-align: right;
  font-size: 0.8rem;
}

.seasonal-chart {
  height: 200px;
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  padding: 1rem;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  text-align: center;
}

.metric-title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.metric-trend {
  display: flex;
  justify-content: center;
}

.correlations-section,
.insights-section {
  margin-bottom: 2rem;
}

.correlations-section h4,
.insights-section h4 {
  margin: 0 0 1rem 0;
  color: var(--el-text-color-primary);
}

.correlation-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.correlation-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.correlation-bar {
  flex: 1;
  height: 20px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  overflow: hidden;
}

.correlation-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--el-bg-color-page);
  border-radius: 4px;
}

.insight-icon {
  color: var(--el-color-primary);
}
</style>
