/**
 * 智能数据分析引擎
 * 提供AI驱动的数据洞察、预测分析和个性化建议
 */

import type { MasturbationRecord } from '@/types/record'
import { logger } from '@/utils/logger'
import { cache } from '@/utils/cache'

export interface PredictionModel {
    type: 'frequency' | 'duration' | 'mood' | 'energy'
    accuracy: number
    predictions: Array<{
        date: Date
        value: number
        confidence: number
    }>
    factors: Array<{
        name: string
        impact: number
        description: string
    }>
}

export interface PersonalizedInsight {
    id: string
    type: 'warning' | 'suggestion' | 'achievement' | 'pattern'
    title: string
    description: string
    actionable: boolean
    actions?: string[]
    priority: 'low' | 'medium' | 'high'
    confidence: number
    timestamp: Date
}

export interface BehaviorPattern {
    name: string
    description: string
    frequency: number
    strength: number // 0-1
    triggers: string[]
    recommendations: string[]
}

export interface HealthScore {
    overall: number // 0-100
    components: {
        consistency: number
        balance: number
        wellbeing: number
        moderation: number
    }
    trend: 'improving' | 'stable' | 'declining'
    recommendations: string[]
}

export class IntelligentAnalyticsEngine {
    private static readonly CACHE_TTL = 300000 // 5分钟缓存

    /**
     * 生成预测模型
     */
    static async generatePredictionModels(records: MasturbationRecord[]): Promise<PredictionModel[]> {
        const cacheKey = 'prediction_models'
        const cached = cache.get<PredictionModel[]>(cacheKey)
        if (cached) return cached

        logger.info('生成预测模型', { recordCount: records.length }, 'IntelligentAnalytics')

        const models: PredictionModel[] = []

        // 频率预测模型
        const frequencyModel = this.buildFrequencyModel(records)
        models.push(frequencyModel)

        // 时长预测模型
        const durationModel = this.buildDurationModel(records)
        models.push(durationModel)

        // 心情预测模型
        const moodModel = this.buildMoodModel(records)
        models.push(moodModel)

        // 精力预测模型
        const energyModel = this.buildEnergyModel(records)
        models.push(energyModel)

        cache.set(cacheKey, models, this.CACHE_TTL)
        return models
    }

    /**
     * 生成个性化洞察
     */
    static async generatePersonalizedInsights(records: MasturbationRecord[]): Promise<PersonalizedInsight[]> {
        const insights: PersonalizedInsight[] = []

        // 分析异常模式
        const anomalies = this.detectAnomalies(records)
        insights.push(...anomalies)

        // 分析积极趋势
        const achievements = this.detectAchievements(records)
        insights.push(...achievements)

        // 生成健康建议
        const healthSuggestions = this.generateHealthSuggestions(records)
        insights.push(...healthSuggestions)

        // 识别行为模式
        const patterns = this.identifyBehaviorPatterns(records)
        insights.push(...patterns)

        return insights.sort((a, b) => b.priority.localeCompare(a.priority))
    }

    /**
     * 计算健康评分
     */
    static calculateHealthScore(records: MasturbationRecord[]): HealthScore {
        const consistency = this.calculateConsistencyScore(records)
        const balance = this.calculateBalanceScore(records)
        const wellbeing = this.calculateWellbeingScore(records)
        const moderation = this.calculateModerationScore(records)

        const overall = Math.round((consistency + balance + wellbeing + moderation) / 4)

        const trend = this.calculateHealthTrend(records)
        const recommendations = this.generateHealthRecommendations(overall, {
            consistency, balance, wellbeing, moderation
        })

        return {
            overall,
            components: { consistency, balance, wellbeing, moderation },
            trend,
            recommendations
        }
    }

    /**
     * 识别行为模式
     */
    static identifyBehaviorPatterns(records: MasturbationRecord[]): PersonalizedInsight[] {
        const patterns: PersonalizedInsight[] = []

        // 时间模式分析
        const timePatterns = this.analyzeTimePatterns(records)
        if (timePatterns.strength > 0.7) {
            patterns.push({
                id: `pattern_time_${Date.now()}`,
                type: 'pattern',
                title: '时间规律性发现',
                description: `您倾向于在${timePatterns.name}进行活动，规律性较强`,
                actionable: true,
                actions: timePatterns.recommendations,
                priority: 'medium',
                confidence: timePatterns.strength,
                timestamp: new Date()
            })
        }

        // 心情模式分析
        const moodPatterns = this.analyzeMoodPatterns(records)
        if (moodPatterns.strength > 0.6) {
            patterns.push({
                id: `pattern_mood_${Date.now()}`,
                type: 'pattern',
                title: '情绪关联模式',
                description: moodPatterns.description,
                actionable: true,
                actions: moodPatterns.recommendations,
                priority: 'medium',
                confidence: moodPatterns.strength,
                timestamp: new Date()
            })
        }

        return patterns
    }

    /**
     * 构建频率预测模型
     */
    private static buildFrequencyModel(records: MasturbationRecord[]): PredictionModel {
        const weeklyData = this.getWeeklyFrequency(records)
        const predictions = this.generateFrequencyPredictions(weeklyData)
        
        return {
            type: 'frequency',
            accuracy: this.calculateModelAccuracy(weeklyData),
            predictions,
            factors: [
                { name: '历史趋势', impact: 0.4, description: '基于过去的频率变化趋势' },
                { name: '季节性', impact: 0.3, description: '季节和月份对频率的影响' },
                { name: '心情状态', impact: 0.2, description: '心情评分对频率的影响' },
                { name: '随机因素', impact: 0.1, description: '不可预测的外部因素' }
            ]
        }
    }

    /**
     * 构建时长预测模型
     */
    private static buildDurationModel(records: MasturbationRecord[]): PredictionModel {
        const durationData = this.getDurationTrends(records)
        const predictions = this.generateDurationPredictions(durationData)
        
        return {
            type: 'duration',
            accuracy: this.calculateModelAccuracy(durationData),
            predictions,
            factors: [
                { name: '个人习惯', impact: 0.5, description: '个人的时长偏好和习惯' },
                { name: '精力水平', impact: 0.3, description: '精力评分对时长的影响' },
                { name: '时间压力', impact: 0.2, description: '可用时间对时长的限制' }
            ]
        }
    }

    /**
     * 构建心情预测模型
     */
    private static buildMoodModel(records: MasturbationRecord[]): PredictionModel {
        const moodData = this.getMoodTrends(records)
        const predictions = this.generateMoodPredictions(moodData)
        
        return {
            type: 'mood',
            accuracy: this.calculateModelAccuracy(moodData),
            predictions,
            factors: [
                { name: '生活压力', impact: 0.4, description: '外部压力对心情的影响' },
                { name: '健康状况', impact: 0.3, description: '身体健康对心情的影响' },
                { name: '社交活动', impact: 0.2, description: '社交互动对心情的影响' },
                { name: '天气环境', impact: 0.1, description: '环境因素对心情的影响' }
            ]
        }
    }

    /**
     * 构建精力预测模型
     */
    private static buildEnergyModel(records: MasturbationRecord[]): PredictionModel {
        const energyData = this.getEnergyTrends(records)
        const predictions = this.generateEnergyPredictions(energyData)
        
        return {
            type: 'energy',
            accuracy: this.calculateModelAccuracy(energyData),
            predictions,
            factors: [
                { name: '睡眠质量', impact: 0.4, description: '睡眠对精力水平的影响' },
                { name: '运动锻炼', impact: 0.3, description: '体育活动对精力的提升' },
                { name: '饮食营养', impact: 0.2, description: '营养摄入对精力的影响' },
                { name: '工作强度', impact: 0.1, description: '工作负荷对精力的消耗' }
            ]
        }
    }

    /**
     * 检测异常模式
     */
    private static detectAnomalies(records: MasturbationRecord[]): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = []

        // 频率异常检测
        const recentFreq = this.getRecentFrequency(records, 7)
        const avgFreq = this.getAverageFrequency(records)
        
        if (recentFreq > avgFreq * 2) {
            insights.push({
                id: `anomaly_freq_high_${Date.now()}`,
                type: 'warning',
                title: '频率显著增加',
                description: '最近一周的频率比平均水平高出100%以上，建议关注身心平衡',
                actionable: true,
                actions: [
                    '尝试增加其他兴趣爱好',
                    '关注压力管理',
                    '保持规律作息',
                    '考虑寻求专业建议'
                ],
                priority: 'high',
                confidence: 0.8,
                timestamp: new Date()
            })
        }

        // 时长异常检测
        const recentDuration = this.getRecentAverageDuration(records, 7)
        const avgDuration = this.getAverageDuration(records)
        
        if (recentDuration > avgDuration * 1.5) {
            insights.push({
                id: `anomaly_duration_${Date.now()}`,
                type: 'warning',
                title: '时长明显延长',
                description: '最近的平均时长比以往增加较多，可能需要关注',
                actionable: true,
                actions: [
                    '设置合理的时间限制',
                    '关注其他活动安排',
                    '保持时间意识'
                ],
                priority: 'medium',
                confidence: 0.7,
                timestamp: new Date()
            })
        }

        return insights
    }

    /**
     * 检测成就和积极趋势
     */
    private static detectAchievements(records: MasturbationRecord[]): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = []

        // 规律性成就
        const consistency = this.calculateConsistencyScore(records)
        if (consistency > 80) {
            insights.push({
                id: `achievement_consistency_${Date.now()}`,
                type: 'achievement',
                title: '规律性优秀',
                description: `您的行为模式非常规律，规律性评分达到${consistency}分`,
                actionable: false,
                priority: 'low',
                confidence: 0.9,
                timestamp: new Date()
            })
        }

        // 心情改善趋势
        const moodTrend = this.getMoodTrend(records)
        if (moodTrend > 0.2) {
            insights.push({
                id: `achievement_mood_${Date.now()}`,
                type: 'achievement',
                title: '心情状态改善',
                description: '您的整体心情评分呈现上升趋势，保持良好状态',
                actionable: true,
                actions: ['继续保持当前的生活方式', '记录积极因素'],
                priority: 'low',
                confidence: 0.8,
                timestamp: new Date()
            })
        }

        return insights
    }

    /**
     * 生成健康建议
     */
    private static generateHealthSuggestions(records: MasturbationRecord[]): PersonalizedInsight[] {
        const insights: PersonalizedInsight[] = []

        const healthScore = this.calculateHealthScore(records)
        
        if (healthScore.overall < 60) {
            insights.push({
                id: `health_suggestion_${Date.now()}`,
                type: 'suggestion',
                title: '健康状况需要关注',
                description: `综合健康评分为${healthScore.overall}分，建议采取改善措施`,
                actionable: true,
                actions: healthScore.recommendations,
                priority: 'high',
                confidence: 0.8,
                timestamp: new Date()
            })
        }

        return insights
    }

    /**
     * 分析时间模式
     */
    private static analyzeTimePatterns(records: MasturbationRecord[]): BehaviorPattern {
        const hourCounts = new Array(24).fill(0)
        records.forEach(record => {
            hourCounts[record.startTime.getHours()]++
        })

        const maxCount = Math.max(...hourCounts)
        const maxHour = hourCounts.indexOf(maxCount)
        const strength = maxCount / records.length

        let timeDescription = ''
        if (maxHour >= 6 && maxHour < 12) timeDescription = '上午'
        else if (maxHour >= 12 && maxHour < 18) timeDescription = '下午'
        else if (maxHour >= 18 && maxHour < 22) timeDescription = '晚上'
        else timeDescription = '深夜'

        return {
            name: timeDescription,
            description: `主要活跃时间为${timeDescription}(${maxHour}:00左右)`,
            frequency: maxCount,
            strength,
            triggers: [`${timeDescription}时间段`, '日常作息习惯'],
            recommendations: [
                '保持规律的作息时间',
                '在活跃时间段安排其他活动',
                '关注时间管理'
            ]
        }
    }

    /**
     * 分析心情模式
     */
    private static analyzeMoodPatterns(records: MasturbationRecord[]): BehaviorPattern {
        const moodRecords = records.filter(r => r.mood)
        if (moodRecords.length === 0) {
            return {
                name: '心情数据不足',
                description: '缺少足够的心情数据进行分析',
                frequency: 0,
                strength: 0,
                triggers: [],
                recommendations: ['开始记录心情评分以获得更好的分析']
            }
        }

        const avgMood = moodRecords.reduce((sum, r) => sum + r.mood!, 0) / moodRecords.length
        const moodVariance = moodRecords.reduce((sum, r) => sum + Math.pow(r.mood! - avgMood, 2), 0) / moodRecords.length
        const stability = 1 - (Math.sqrt(moodVariance) / 5)

        return {
            name: '心情关联模式',
            description: `平均心情评分${avgMood.toFixed(1)}，情绪稳定性${(stability * 100).toFixed(0)}%`,
            frequency: moodRecords.length,
            strength: stability,
            triggers: ['情绪状态', '心理压力'],
            recommendations: [
                '关注情绪管理',
                '保持心理健康',
                '寻找压力释放方式'
            ]
        }
    }

    // 辅助方法
    private static getWeeklyFrequency(records: MasturbationRecord[]): number[] {
        // 实现周频率计算
        const weeks = new Map<string, number>()
        records.forEach(record => {
            const weekKey = this.getWeekKey(record.startTime)
            weeks.set(weekKey, (weeks.get(weekKey) || 0) + 1)
        })
        return Array.from(weeks.values())
    }

    private static getWeekKey(date: Date): string {
        const year = date.getFullYear()
        const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
        return `${year}-W${week}`
    }

    private static generateFrequencyPredictions(weeklyData: number[]): Array<{ date: Date; value: number; confidence: number }> {
        // 简单的线性预测
        const predictions = []
        const trend = this.calculateLinearTrend(weeklyData)
        
        for (let i = 1; i <= 4; i++) { // 预测未来4周
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + i * 7)
            
            const predictedValue = Math.max(0, weeklyData[weeklyData.length - 1] + trend * i)
            const confidence = Math.max(0.3, 1 - i * 0.2) // 时间越远置信度越低
            
            predictions.push({
                date: futureDate,
                value: predictedValue,
                confidence
            })
        }
        
        return predictions
    }

    private static calculateLinearTrend(data: number[]): number {
        if (data.length < 2) return 0
        
        const n = data.length
        const x = Array.from({ length: n }, (_, i) => i)
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = data.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0)
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    }

    private static calculateModelAccuracy(data: number[]): number {
        // 简化的准确度计算
        if (data.length < 3) return 0.5
        
        const variance = this.calculateVariance(data)
        const mean = data.reduce((a, b) => a + b, 0) / data.length
        const cv = Math.sqrt(variance) / mean // 变异系数
        
        return Math.max(0.3, Math.min(0.95, 1 - cv))
    }

    private static calculateVariance(data: number[]): number {
        const mean = data.reduce((a, b) => a + b, 0) / data.length
        return data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length
    }

    private static getDurationTrends(records: MasturbationRecord[]): number[] {
        return records.map(r => r.duration)
    }

    private static getMoodTrends(records: MasturbationRecord[]): number[] {
        return records.filter(r => r.mood).map(r => r.mood!)
    }

    private static getEnergyTrends(records: MasturbationRecord[]): number[] {
        return records.filter(r => r.energy).map(r => r.energy!)
    }

    private static generateDurationPredictions(data: number[]): Array<{ date: Date; value: number; confidence: number }> {
        // 类似频率预测的实现
        return this.generateFrequencyPredictions(data)
    }

    private static generateMoodPredictions(data: number[]): Array<{ date: Date; value: number; confidence: number }> {
        return this.generateFrequencyPredictions(data)
    }

    private static generateEnergyPredictions(data: number[]): Array<{ date: Date; value: number; confidence: number }> {
        return this.generateFrequencyPredictions(data)
    }

    private static getRecentFrequency(records: MasturbationRecord[], days: number): number {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        return records.filter(r => r.startTime >= cutoff).length
    }

    private static getAverageFrequency(records: MasturbationRecord[]): number {
        if (records.length === 0) return 0
        const daySpan = (Date.now() - records[0].startTime.getTime()) / (1000 * 60 * 60 * 24)
        return records.length / Math.max(1, daySpan) * 7 // 周频率
    }

    private static getRecentAverageDuration(records: MasturbationRecord[], days: number): number {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        const recentRecords = records.filter(r => r.startTime >= cutoff)
        return recentRecords.length > 0 
            ? recentRecords.reduce((sum, r) => sum + r.duration, 0) / recentRecords.length 
            : 0
    }

    private static getAverageDuration(records: MasturbationRecord[]): number {
        return records.length > 0 
            ? records.reduce((sum, r) => sum + r.duration, 0) / records.length 
            : 0
    }

    private static calculateConsistencyScore(records: MasturbationRecord[]): number {
        // 基于频率稳定性计算一致性评分
        const weeklyFreq = this.getWeeklyFrequency(records)
        if (weeklyFreq.length < 2) return 50
        
        const variance = this.calculateVariance(weeklyFreq)
        const mean = weeklyFreq.reduce((a, b) => a + b, 0) / weeklyFreq.length
        const cv = Math.sqrt(variance) / Math.max(1, mean)
        
        return Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)))
    }

    private static calculateBalanceScore(records: MasturbationRecord[]): number {
        // 基于心情和精力的平衡性
        const moodRecords = records.filter(r => r.mood)
        const energyRecords = records.filter(r => r.energy)
        
        if (moodRecords.length === 0 || energyRecords.length === 0) return 50
        
        const avgMood = moodRecords.reduce((sum, r) => sum + r.mood!, 0) / moodRecords.length
        const avgEnergy = energyRecords.reduce((sum, r) => sum + r.energy!, 0) / energyRecords.length
        
        const balance = 1 - Math.abs(avgMood - avgEnergy) / 5
        return Math.round(balance * 100)
    }

    private static calculateWellbeingScore(records: MasturbationRecord[]): number {
        // 基于整体心情和精力水平
        const moodRecords = records.filter(r => r.mood)
        const energyRecords = records.filter(r => r.energy)
        
        if (moodRecords.length === 0 && energyRecords.length === 0) return 50
        
        const avgMood = moodRecords.length > 0 
            ? moodRecords.reduce((sum, r) => sum + r.mood!, 0) / moodRecords.length 
            : 3
        const avgEnergy = energyRecords.length > 0 
            ? energyRecords.reduce((sum, r) => sum + r.energy!, 0) / energyRecords.length 
            : 3
        
        return Math.round(((avgMood + avgEnergy) / 2) * 20) // 转换为0-100分
    }

    private static calculateModerationScore(records: MasturbationRecord[]): number {
        // 基于频率的适度性
        const avgFreq = this.getAverageFrequency(records)
        
        // 假设理想频率为每周2-4次
        const idealMin = 2
        const idealMax = 4
        
        if (avgFreq >= idealMin && avgFreq <= idealMax) {
            return 100
        } else if (avgFreq < idealMin) {
            return Math.round((avgFreq / idealMin) * 100)
        } else {
            return Math.round(Math.max(0, 100 - ((avgFreq - idealMax) / idealMax) * 50))
        }
    }

    private static calculateHealthTrend(records: MasturbationRecord[]): 'improving' | 'stable' | 'declining' {
        if (records.length < 10) return 'stable'
        
        const recentRecords = records.slice(-Math.floor(records.length / 2))
        const earlierRecords = records.slice(0, Math.floor(records.length / 2))
        
        const recentScore = this.calculateWellbeingScore(recentRecords)
        const earlierScore = this.calculateWellbeingScore(earlierRecords)
        
        const diff = recentScore - earlierScore
        
        if (diff > 10) return 'improving'
        if (diff < -10) return 'declining'
        return 'stable'
    }

    private static generateHealthRecommendations(overall: number, components: any): string[] {
        const recommendations: string[] = []
        
        if (overall < 60) {
            recommendations.push('建议关注整体健康状况')
        }
        
        if (components.consistency < 60) {
            recommendations.push('尝试建立更规律的生活作息')
        }
        
        if (components.balance < 60) {
            recommendations.push('关注心情和精力的平衡')
        }
        
        if (components.wellbeing < 60) {
            recommendations.push('重视心理健康和情绪管理')
        }
        
        if (components.moderation < 60) {
            recommendations.push('考虑调整活动频率以达到更好的平衡')
        }
        
        return recommendations
    }

    private static getMoodTrend(records: MasturbationRecord[]): number {
        const moodRecords = records.filter(r => r.mood).slice(-20) // 最近20条记录
        if (moodRecords.length < 5) return 0
        
        const moods = moodRecords.map(r => r.mood!)
        return this.calculateLinearTrend(moods)
    }
}
