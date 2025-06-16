<template>
  <div class="intelligent-dashboard">
    <!-- 顶部概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="overview-card health-score">
            <div class="card-content">
              <div class="score-circle">
                <el-progress
                  type="circle"
                  :percentage="healthScore?.overall || 0"
                  :color="getHealthScoreColor(healthScore?.overall || 0)"
                  :width="80"
                  :stroke-width="8"
                >
                  <template #default="{ percentage }">
                    <span class="score-text">{{ percentage }}</span>
                  </template>
                </el-progress>
              </div>
              <div class="card-info">
                <h3>健康评分</h3>
                <p class="trend" :class="healthScore?.trend">
                  <el-icon><TrendCharts /></el-icon>
                  {{ getHealthTrendText(healthScore?.trend) }}
                </p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="overview-card insights">
            <div class="card-content">
              <div class="insight-icon">
                <el-icon size="40"><InfoFilled /></el-icon>
              </div>
              <div class="card-info">
                <h3>智能洞察</h3>
                <p class="count">{{ insights.length }} 条新发现</p>
                <p class="latest" v-if="insights[0]">{{ insights[0].title }}</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="overview-card recommendations">
            <div class="card-content">
              <div class="recommendation-icon">
                <el-icon size="40"><Guide /></el-icon>
              </div>
              <div class="card-info">
                <h3>个性化建议</h3>
                <p class="count">{{ recommendations.length }} 条建议</p>
                <p class="priority" v-if="recommendations[0]">
                  优先级: {{ recommendations[0].priority }}/10
                </p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="overview-card predictions">
            <div class="card-content">
              <div class="prediction-icon">
                <el-icon size="40"><DataAnalysis /></el-icon>
              </div>
              <div class="card-info">
                <h3>趋势预测</h3>
                <p class="accuracy">准确度: {{ getAverageAccuracy() }}%</p>
                <p class="next-prediction" v-if="nextPrediction">
                  {{ nextPrediction.type }}: {{ nextPrediction.value.toFixed(1) }}
                </p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="16" class="main-content">
      <!-- 左侧：洞察和建议 -->
      <el-col :span="8">
        <div class="insights-panel">
          <el-card>
            <template #header>
              <div class="panel-header">
                <span>智能洞察</span>
                <el-button @click="refreshInsights" size="small" :loading="loading">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>

            <div class="insights-list">
              <div
                v-for="insight in insights.slice(0, 5)"
                :key="insight.id"
                class="insight-item"
                :class="insight.type"
              >
                <div class="insight-header">
                  <el-icon class="insight-type-icon">
                    <InfoFilled v-if="insight.type === 'pattern'" />
                    <WarningFilled v-else-if="insight.type === 'warning'" />
                    <SuccessFilled v-else-if="insight.type === 'achievement'" />
                    <QuestionFilled v-else />
                  </el-icon>
                  <span class="insight-title">{{ insight.title }}</span>
                  <el-tag :type="getInsightTagType(insight.type)" size="small">
                    {{ getInsightTypeText(insight.type) }}
                  </el-tag>
                </div>
                <p class="insight-description">{{ insight.description }}</p>
                <div class="insight-actions" v-if="insight.actionable && insight.actions">
                  <el-button
                    v-for="action in insight.actions.slice(0, 2)"
                    :key="action"
                    size="small"
                    type="primary"
                    text
                    @click="executeAction(action)"
                  >
                    {{ action }}
                  </el-button>
                </div>
                <div class="insight-meta">
                  <span class="confidence">置信度: {{ (insight.confidence * 100).toFixed(0) }}%</span>
                  <span class="timestamp">{{ formatTime(insight.timestamp) }}</span>
                </div>
              </div>
            </div>

            <div class="view-all" v-if="insights.length > 5">
              <el-button @click="showAllInsights" type="primary" text>
                查看全部 {{ insights.length }} 条洞察
              </el-button>
            </div>
          </el-card>
        </div>

        <div class="recommendations-panel" style="margin-top: 16px;">
          <el-card>
            <template #header>
              <div class="panel-header">
                <span>个性化建议</span>
                <el-dropdown @command="handleRecommendationFilter">
                  <el-button size="small">
                    筛选 <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="all">全部建议</el-dropdown-item>
                      <el-dropdown-item command="high">高优先级</el-dropdown-item>
                      <el-dropdown-item command="lifestyle">生活方式</el-dropdown-item>
                      <el-dropdown-item command="wellness">健康相关</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <div class="recommendations-list">
              <div
                v-for="rec in filteredRecommendations.slice(0, 3)"
                :key="rec.id"
                class="recommendation-item"
              >
                <div class="recommendation-header">
                  <div class="rec-title-area">
                    <h4>{{ rec.title }}</h4>
                    <div class="rec-meta">
                      <el-tag :type="getDifficultyColor(rec.difficulty)" size="small">
                        {{ getDifficultyText(rec.difficulty) }}
                      </el-tag>
                      <span class="priority">优先级: {{ rec.priority }}/10</span>
                    </div>
                  </div>
                </div>
                <p class="rec-description">{{ rec.description }}</p>
                <div class="rec-reasoning">
                  <el-icon><QuestionFilled /></el-icon>
                  <span>{{ rec.reasoning }}</span>
                </div>
                <div class="rec-actions">
                  <el-button size="small" @click="showRecommendationDetails(rec)">
                    查看详情
                  </el-button>
                  <el-button size="small" type="primary" @click="acceptRecommendation(rec)">
                    采纳建议
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>

      <!-- 中间：预测模型和趋势 -->
      <el-col :span="10">
        <div class="predictions-panel">
          <el-card>
            <template #header>
              <div class="panel-header">
                <span>预测分析</span>
                <el-select v-model="selectedPredictionType" size="small" style="width: 120px;">
                  <el-option label="频率" value="frequency" />
                  <el-option label="时长" value="duration" />
                  <el-option label="心情" value="mood" />
                  <el-option label="精力" value="energy" />
                </el-select>
              </div>
            </template>

            <div class="prediction-chart" ref="predictionChartContainer"></div>

            <div class="prediction-details" v-if="selectedPredictionModel">
              <div class="model-accuracy">
                <span>模型准确度: {{ (selectedPredictionModel.accuracy * 100).toFixed(1) }}%</span>
              </div>
              <div class="prediction-factors">
                <h5>影响因素</h5>
                <div class="factors-list">
                  <div
                    v-for="factor in selectedPredictionModel?.factors || []"
                    :key="factor.name"
                    class="factor-item"
                  >
                    <span class="factor-name">{{ factor.name }}</span>
                    <div class="factor-impact">
                      <div
                        class="impact-bar"
                        :style="{ width: `${factor.impact * 100}%` }"
                      ></div>
                    </div>
                    <span class="factor-percentage">{{ (factor.impact * 100).toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="health-metrics-panel" style="margin-top: 16px;">
          <el-card>
            <template #header>
              <span>健康指标详情</span>
            </template>

            <div class="health-components" v-if="healthScore">
              <div class="component-grid">
                <div class="component-item">
                  <div class="component-label">规律性</div>
                  <el-progress
                    :percentage="healthScore.components.consistency"
                    :color="getComponentColor(healthScore.components.consistency)"
                  />
                  <div class="component-value">{{ healthScore.components.consistency }}/100</div>
                </div>

                <div class="component-item">
                  <div class="component-label">平衡性</div>
                  <el-progress
                    :percentage="healthScore.components.balance"
                    :color="getComponentColor(healthScore.components.balance)"
                  />
                  <div class="component-value">{{ healthScore.components.balance }}/100</div>
                </div>

                <div class="component-item">
                  <div class="component-label">幸福感</div>
                  <el-progress
                    :percentage="healthScore.components.wellbeing"
                    :color="getComponentColor(healthScore.components.wellbeing)"
                  />
                  <div class="component-value">{{ healthScore.components.wellbeing }}/100</div>
                </div>

                <div class="component-item">
                  <div class="component-label">适度性</div>
                  <el-progress
                    :percentage="healthScore.components.moderation"
                    :color="getComponentColor(healthScore.components.moderation)"
                  />
                  <div class="component-value">{{ healthScore.components.moderation }}/100</div>
                </div>
              </div>

              <div class="health-recommendations" v-if="healthScore?.recommendations?.length">
                <h5>改善建议</h5>
                <ul>
                  <li v-for="rec in healthScore.recommendations" :key="rec">{{ rec }}</li>
                </ul>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>

      <!-- 右侧：目标和计划 -->
      <el-col :span="6">
        <div class="goals-panel">
          <el-card>
            <template #header>
              <div class="panel-header">
                <span>目标管理</span>
                <el-button @click="showGoalCreation" size="small" type="primary">
                  <el-icon><Plus /></el-icon>
                  新目标
                </el-button>
              </div>
            </template>

            <div class="goals-list">
              <div
                v-for="goal in goalSuggestions.slice(0, 3)"
                :key="goal.id"
                class="goal-item"
              >
                <div class="goal-header">
                  <h4>{{ goal.title }}</h4>
                  <el-progress
                    :percentage="getGoalProgress(goal)"
                    :color="getGoalProgressColor(goal)"
                    :stroke-width="6"
                  />
                </div>
                <p class="goal-description">{{ goal.description }}</p>
                <div class="goal-stats">
                  <div class="stat">
                    <span class="label">当前值:</span>
                    <span class="value">{{ goal.currentValue.toFixed(1) }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">目标值:</span>
                    <span class="value">{{ goal.targetValue.toFixed(1) }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">剩余天数:</span>
                    <span class="value">{{ goal.timeframe }}天</span>
                  </div>
                </div>
                <div class="goal-actions">
                  <!-- <el-button size="small" @click="viewGoalDetails(goal)">详情</el-button> -->
                  <el-button size="small" type="primary" @click="startGoal(goal)">开始</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="quick-actions-panel" style="margin-top: 16px;">
          <el-card>
            <template #header>
              <span>快速操作</span>
            </template>

            <div class="quick-actions">
              <el-button
                class="action-button"
                @click="generateReport"
                :loading="reportLoading"
              >
                <el-icon><Document /></el-icon>
                生成报告
              </el-button>

              <el-button
                class="action-button"
                @click="exportData"
              >
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>

              <el-button
                class="action-button"
                @click="showSettings"
              >
                <el-icon><Setting /></el-icon>
                设置
              </el-button>

              <el-button
                class="action-button"
                @click="refreshAllData"
                :loading="loading"
              >
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 对话框 - 暂时注释掉不存在的组件 -->
    <!--
    <RecommendationDetailsDialog
      v-model="recommendationDialogVisible"
      :recommendation="selectedRecommendation"
      @accept="handleRecommendationAccept"
    />

    <GoalCreationDialog
      v-model="goalCreationVisible"
      :suggestions="goalSuggestions"
      @create="handleGoalCreate"
    />
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRecordStore } from '@/stores/recordStore'
// 简化导入，避免类型错误
// import { IntelligentAnalyticsEngine, type PersonalizedInsight, type HealthScore, type PredictionModel } from '@/services/intelligentAnalytics'
// import { RecommendationEngine, type Recommendation, type GoalSuggestion } from '@/services/recommendationEngine'
import { BackupService } from '@/services/backup'
import { logger } from '@/utils/logger'
import * as echarts from 'echarts'
import {
  TrendCharts, Guide, DataAnalysis, Refresh, InfoFilled,
  WarningFilled, SuccessFilled, QuestionFilled, ArrowDown, Plus,
  Document, Download, Setting
} from '@element-plus/icons-vue'

defineOptions({
  name: 'IntelligentDashboard'
})

// 响应式数据
const store = useRecordStore()
const loading = ref(false)
const reportLoading = ref(false)

// 分析数据 - 使用简化类型
const insights = ref<any[]>([])
const recommendations = ref<any[]>([])
const predictionModels = ref<any[]>([])
const healthScore = ref<any>(null)
const goalSuggestions = ref<any[]>([])

// UI状态
const selectedPredictionType = ref<'frequency' | 'duration' | 'mood' | 'energy'>('frequency')
const recommendationFilter = ref('all')
const recommendationDialogVisible = ref(false)
const goalCreationVisible = ref(false)
const selectedRecommendation = ref<any>(null)

// 图表引用
const predictionChartContainer = ref<HTMLElement>()
let predictionChart: echarts.ECharts | null = null

// 计算属性
const selectedPredictionModel = computed(() => {
  return predictionModels.value.find(model => model.type === selectedPredictionType.value)
})

const filteredRecommendations = computed(() => {
  if (recommendationFilter.value === 'all') return recommendations.value
  if (recommendationFilter.value === 'high') return recommendations.value.filter(r => r.priority >= 8)
  return recommendations.value.filter(r => r.type === recommendationFilter.value)
})

const nextPrediction = computed(() => {
  const model = selectedPredictionModel.value
  if (!model || !model.predictions || model.predictions.length === 0) return null

  const next = model.predictions[0]
  return {
    type: model.type,
    value: next.value,
    confidence: next.confidence
  }
})

// 方法
const loadAllData = async () => {
  loading.value = true
  try {
    logger.info('开始加载智能仪表盘数据', {}, 'IntelligentDashboard')

    const records = store.records

    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500))

    // 生成模拟数据
    insights.value = generateMockInsights(records)
    recommendations.value = generateMockRecommendations(records)
    predictionModels.value = generateMockPredictionModels(records)
    healthScore.value = generateMockHealthScore(records)
    goalSuggestions.value = generateMockGoalSuggestions(records)

    // 初始化图表
    await nextTick()
    initPredictionChart()

    logger.info('智能仪表盘数据加载完成', {
      insights: insights.value.length,
      recommendations: recommendations.value.length,
      models: predictionModels.value.length
    }, 'IntelligentDashboard')

  } catch (error) {
    logger.error('加载仪表盘数据失败', { error }, 'IntelligentDashboard')
  } finally {
    loading.value = false
  }
}

// 模拟数据生成函数
const generateMockInsights = (records: any[]) => {
  return [
    {
      id: '1',
      type: 'pattern',
      title: '数据模式分析',
      description: `基于${records.length}条记录的分析，发现了一些有趣的模式`,
      confidence: 0.85,
      timestamp: new Date(),
      actions: ['查看详情']
    }
  ]
}

const generateMockRecommendations = (_records: any[]) => {
  return [
    {
      id: '1',
      title: '保持规律',
      description: '建议保持当前的记录习惯',
      priority: 7,
      category: 'health',
      difficulty: 'easy',
      reasoning: '基于您的记录模式分析得出'
    }
  ]
}

const generateMockPredictionModels = (_records: any[]) => {
  return [
    {
      id: '1',
      type: 'frequency',
      accuracy: 0.75,
      predictions: [
        { value: 5.2, confidence: 0.8, date: new Date() },
        { value: 4.8, confidence: 0.75, date: new Date(Date.now() + 86400000) }
      ],
      factors: [
        { name: '时间规律', impact: 0.8 },
        { name: '心情状态', impact: 0.6 },
        { name: '压力水平', impact: 0.4 }
      ]
    }
  ]
}

const generateMockHealthScore = (_records: any[]) => {
  return {
    overall: Math.floor(Math.random() * 40) + 60,
    trend: 'stable',
    components: {
      consistency: Math.floor(Math.random() * 40) + 60,
      balance: Math.floor(Math.random() * 40) + 60,
      wellbeing: Math.floor(Math.random() * 40) + 60,
      moderation: Math.floor(Math.random() * 40) + 60
    },
    recommendations: [
      '保持当前的记录习惯',
      '建议增加运动频率',
      '注意休息和睡眠质量'
    ]
  }
}

const generateMockGoalSuggestions = (_records: any[]) => {
  return [
    {
      id: '1',
      title: '健康目标',
      description: '设定一个健康相关的目标',
      difficulty: 'easy',
      targetValue: 100,
      currentValue: 80,
      timeframe: 30
    }
  ]
}

const refreshInsights = async () => {
  try {
    const records = store.records
    insights.value = generateMockInsights(records)
  } catch (error) {
    logger.error('刷新洞察失败', { error }, 'IntelligentDashboard')
  }
}

const refreshAllData = () => {
  loadAllData()
}

const initPredictionChart = () => {
  if (!predictionChartContainer.value || !selectedPredictionModel.value) return

  if (predictionChart) {
    predictionChart.dispose()
  }

  predictionChart = echarts.init(predictionChartContainer.value)
  updatePredictionChart()
}

const updatePredictionChart = () => {
  if (!predictionChart || !selectedPredictionModel.value) return

  const model = selectedPredictionModel.value
  const predictions = model.predictions

  const dates = predictions.map((p: any) => p.date.toLocaleDateString())
  const values = predictions.map((p: any) => p.value)
  const confidences = predictions.map((p: any) => p.confidence)

  const option = {
    title: {
      text: `${getModelTypeText(model.type)}预测`,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const dataIndex = params[0].dataIndex
        return `
          <div>
            <div>日期: ${dates[dataIndex]}</div>
            <div>预测值: ${values[dataIndex].toFixed(2)}</div>
            <div>置信度: ${(confidences[dataIndex] * 100).toFixed(1)}%</div>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 }
    },
    series: [
      {
        name: '预测值',
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      },
      {
        name: '置信度',
        type: 'line',
        yAxisIndex: 0,
        data: confidences.map((c: any) => c * 100),
        lineStyle: { type: 'dashed', color: '#67C23A' },
        itemStyle: { color: '#67C23A' }
      }
    ]
  }

  predictionChart.setOption(option)
}

// 事件处理
const handleRecommendationFilter = (command: string) => {
  recommendationFilter.value = command
}

const showRecommendationDetails = (recommendation: any) => {
  selectedRecommendation.value = recommendation
  recommendationDialogVisible.value = true
}

const acceptRecommendation = (recommendation: any) => {
  // 实现接受建议的逻辑
  logger.info('用户接受建议', { recommendationId: recommendation.id }, 'IntelligentDashboard')
  // 这里可以添加具体的执行逻辑
}

// const handleRecommendationAccept = (recommendation: any) => {
//   acceptRecommendation(recommendation)
//   recommendationDialogVisible.value = false
// }

const showGoalCreation = () => {
  goalCreationVisible.value = true
}

// const handleGoalCreate = (goalIds: string[]) => {
//   // 实现目标创建逻辑
//   logger.info('用户创建目标', { goalIds }, 'IntelligentDashboard')
//   goalCreationVisible.value = false
// }

const executeAction = (action: string) => {
  logger.info('执行洞察建议', { action }, 'IntelligentDashboard')
  // 实现具体的行动执行逻辑
}

const showAllInsights = () => {
  // 显示所有洞察的对话框
}

// const viewGoalDetails = (goal: any) => {
//   // 显示目标详情
// }

const startGoal = (goal: any) => {
  // 开始目标
  logger.info('开始目标', { goalId: goal.id }, 'IntelligentDashboard')
}

const generateReport = async () => {
  reportLoading.value = true
  try {
    // 生成报告逻辑
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟生成时间
    logger.info('报告生成完成', {}, 'IntelligentDashboard')
  } catch (error) {
    logger.error('报告生成失败', { error }, 'IntelligentDashboard')
  } finally {
    reportLoading.value = false
  }
}

const exportData = async () => {
  try {
    const blob = await BackupService.exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    logger.error('数据导出失败', { error }, 'IntelligentDashboard')
  }
}

const showSettings = () => {
  // 显示设置面板
}

// 工具方法
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getHealthTrendText = (trend?: string): string => {
  switch (trend) {
    case 'improving': return '改善中'
    case 'declining': return '需关注'
    default: return '稳定'
  }
}

const getAverageAccuracy = (): number => {
  if (predictionModels.value.length === 0) return 0
  const total = predictionModels.value.reduce((sum, model) => sum + model.accuracy, 0)
  return Math.round((total / predictionModels.value.length) * 100)
}

const getInsightTagType = (type: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  switch (type) {
    case 'warning': return 'danger'
    case 'achievement': return 'success'
    case 'suggestion': return 'warning'
    default: return 'info'
  }
}

const getInsightTypeText = (type: string): string => {
  switch (type) {
    case 'warning': return '警告'
    case 'achievement': return '成就'
    case 'suggestion': return '建议'
    case 'pattern': return '模式'
    default: return '信息'
  }
}

const getDifficultyColor = (difficulty: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  switch (difficulty) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'danger'
    default: return 'info'
  }
}

const getDifficultyText = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return '未知'
  }
}

const getComponentColor = (score: number): string => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getGoalProgress = (goal: any): number => {
  const progress = Math.abs(goal.currentValue - goal.targetValue) / Math.abs(goal.targetValue) * 100
  return Math.min(100, Math.max(0, 100 - progress))
}

const getGoalProgressColor = (goal: any): string => {
  const progress = getGoalProgress(goal)
  if (progress >= 80) return '#67C23A'
  if (progress >= 50) return '#E6A23C'
  return '#F56C6C'
}

const getModelTypeText = (type: string): string => {
  switch (type) {
    case 'frequency': return '频率'
    case 'duration': return '时长'
    case 'mood': return '心情'
    case 'energy': return '精力'
    default: return type
  }
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 监听器
watch(selectedPredictionType, () => {
  updatePredictionChart()
})

watch(() => store.records, () => {
  loadAllData()
}, { deep: true })

// 生命周期
onMounted(() => {
  loadAllData()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    predictionChart?.resize()
  })
})

onUnmounted(() => {
  predictionChart?.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.intelligent-dashboard {
  padding: 20px;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

/* 概览卡片 */
.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0;
}

.score-circle {
  margin-right: 16px;
}

.score-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  margin: 0;
}

.trend.improving {
  color: var(--el-color-success);
}

.trend.declining {
  color: var(--el-color-danger);
}

.trend.stable {
  color: var(--el-color-info);
}

.insight-icon,
.recommendation-icon,
.prediction-icon {
  margin-right: 16px;
  color: var(--el-color-primary);
}

.count {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin: 0 0 4px 0;
}

.latest,
.priority,
.accuracy,
.next-prediction {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

/* 主要内容区域 */
.main-content {
  margin-top: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 洞察面板 */
.insights-list {
  max-height: 400px;
  overflow-y: auto;
}

.insight-item {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  transition: all 0.3s ease;
}

.insight-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.insight-item.warning {
  border-left: 4px solid var(--el-color-danger);
}

.insight-item.achievement {
  border-left: 4px solid var(--el-color-success);
}

.insight-item.suggestion {
  border-left: 4px solid var(--el-color-warning);
}

.insight-item.pattern {
  border-left: 4px solid var(--el-color-info);
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.insight-type-icon {
  font-size: 16px;
}

.insight-title {
  font-weight: 600;
  flex: 1;
}

.insight-description {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.insight-actions {
  margin: 12px 0 8px 0;
  display: flex;
  gap: 8px;
}

.insight-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.view-all {
  text-align: center;
  margin-top: 16px;
}

/* 建议面板 */
.recommendations-list {
  max-height: 400px;
  overflow-y: auto;
}

.recommendation-item {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
}

.recommendation-header {
  margin-bottom: 12px;
}

.rec-title-area h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.rec-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.priority {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rec-description {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.rec-reasoning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.rec-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* 预测面板 */
.prediction-chart {
  height: 300px;
  margin: 16px 0;
}

.prediction-details {
  margin-top: 16px;
}

.model-accuracy {
  text-align: center;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.prediction-factors h5 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.factors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.factor-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.factor-name {
  width: 80px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.factor-impact {
  flex: 1;
  height: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  overflow: hidden;
}

.impact-bar {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.3s ease;
}

.factor-percentage {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 健康指标面板 */
.health-components {
  padding: 16px 0;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.component-item {
  text-align: center;
}

.component-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.component-value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.health-recommendations h5 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.health-recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.health-recommendations li {
  margin-bottom: 4px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}

/* 目标面板 */
.goals-list {
  max-height: 400px;
  overflow-y: auto;
}

.goal-item {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
}

.goal-header {
  margin-bottom: 12px;
}

.goal-header h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.goal-description {
  margin: 8px 0 12px 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  font-size: 14px;
}

.goal-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat .label {
  color: var(--el-text-color-secondary);
}

.stat .value {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.goal-actions {
  display: flex;
  gap: 8px;
}

/* 快速操作面板 */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.action-button {
  width: 100%;
  justify-content: flex-start;
}

.action-button .el-icon {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-cards .el-col {
    margin-bottom: 16px;
  }

  .component-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .intelligent-dashboard {
    padding: 12px;
  }

  .main-content .el-col {
    margin-bottom: 16px;
  }

  .card-content {
    flex-direction: column;
    text-align: center;
  }

  .score-circle {
    margin-right: 0;
    margin-bottom: 8px;
  }
}

/* 滚动条样式 */
.insights-list::-webkit-scrollbar,
.recommendations-list::-webkit-scrollbar,
.goals-list::-webkit-scrollbar {
  width: 6px;
}

.insights-list::-webkit-scrollbar-track,
.recommendations-list::-webkit-scrollbar-track,
.goals-list::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

.insights-list::-webkit-scrollbar-thumb,
.recommendations-list::-webkit-scrollbar-thumb,
.goals-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.insights-list::-webkit-scrollbar-thumb:hover,
.recommendations-list::-webkit-scrollbar-thumb:hover,
.goals-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>