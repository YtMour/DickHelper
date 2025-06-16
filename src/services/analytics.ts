/**
 * 高级数据分析服务
 * 提供深度统计分析、趋势预测和数据洞察
 */

import type { MasturbationRecord, MasturbationStats } from '@/types/record'
import { logger } from '@/utils/logger'
import { SmartCache } from '@/utils/cache'

export interface TrendAnalysis {
    direction: 'increasing' | 'decreasing' | 'stable'
    confidence: number // 0-1
    prediction: number
    changeRate: number // 百分比变化率
}

export interface AdvancedStats extends MasturbationStats {
    trends: {
        frequency: TrendAnalysis
        duration: TrendAnalysis
        mood: TrendAnalysis
        energy: TrendAnalysis
    }
    patterns: {
        weeklyPattern: number[] // 7天的活跃度模式
        monthlyPattern: number[] // 30天的活跃度模式
        seasonalPattern: { [season: string]: number }
    }
    correlations: {
        moodEnergyCorrelation: number
        durationMoodCorrelation: number
        timeOfDayPreference: { hour: number; score: number }[]
    }
    insights: string[]
    healthMetrics: {
        consistencyScore: number // 规律性评分 0-100
        balanceScore: number // 平衡性评分 0-100
        wellbeingTrend: 'improving' | 'declining' | 'stable'
    }
}

export class AnalyticsService {
    /**
     * 生成高级统计分析
     */
    static async generateAdvancedStats(records: MasturbationRecord[]): Promise<AdvancedStats> {
        // const cacheKey = 'advanced_stats'
        const cached = SmartCache.getCachedStats()
        
        if (cached && cached.timestamp > Date.now() - 300000) { // 5分钟缓存
            logger.debug('使用缓存的高级统计数据', {}, 'AnalyticsService')
            return cached.data
        }

        logger.info('开始生成高级统计分析', { recordCount: records.length }, 'AnalyticsService')
        
        const basicStats = this.calculateBasicStats(records)
        const trends = this.analyzeTrends(records)
        const patterns = this.analyzePatterns(records)
        const correlations = this.analyzeCorrelations(records)
        const insights = this.generateInsights(records, trends, patterns, correlations)
        const healthMetrics = this.calculateHealthMetrics(records, trends)

        const advancedStats: AdvancedStats = {
            ...basicStats,
            trends,
            patterns,
            correlations,
            insights,
            healthMetrics
        }

        // 缓存结果
        SmartCache.cacheStats({
            data: advancedStats,
            timestamp: Date.now()
        })

        logger.info('高级统计分析完成', {}, 'AnalyticsService')
        return advancedStats
    }

    /**
     * 计算基础统计数据
     */
    private static calculateBasicStats(records: MasturbationRecord[]): MasturbationStats {
        if (records.length === 0) {
            return {
                totalCount: 0,
                averageDuration: 0,
                frequencyPerWeek: 0,
                frequencyPerMonth: 0,
                longestDuration: 0,
                shortestDuration: 0,
                mostActiveTime: { hour: 0, count: 0 },
                mostActiveDayOfWeek: { day: 0, count: 0 },
                averageMood: undefined,
                averageEnergy: undefined,
                commonTags: []
            }
        }

        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const totalCount = records.length
        const totalDuration = records.reduce((sum, record) => sum + record.duration, 0)
        const recordsLastWeek = records.filter(record => record.startTime >= oneWeekAgo)
        const recordsLastMonth = records.filter(record => record.startTime >= oneMonthAgo)

        const durations = records.map(record => record.duration)
        const longestDuration = Math.max(...durations)
        const shortestDuration = Math.min(...durations)

        // 计算最活跃时间
        const hourCounts = new Array(24).fill(0)
        records.forEach(record => {
            const hour = record.startTime.getHours()
            hourCounts[hour]++
        })
        const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

        // 计算最活跃星期
        const dayCounts = new Array(7).fill(0)
        records.forEach(record => {
            const day = record.startTime.getDay()
            dayCounts[day]++
        })
        const mostActiveDay = dayCounts.indexOf(Math.max(...dayCounts))

        // 计算平均心情和精力
        const moods = records.filter(record => record.mood).map(record => record.mood!)
        const energies = records.filter(record => record.energy).map(record => record.energy!)
        const averageMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : undefined
        const averageEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : undefined

        // 统计标签
        const tagCounts = new Map<string, number>()
        records.forEach(record => {
            record.tags?.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
            })
        })
        const commonTags = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        return {
            totalCount,
            averageDuration: totalDuration / totalCount,
            frequencyPerWeek: recordsLastWeek.length,
            frequencyPerMonth: recordsLastMonth.length,
            longestDuration,
            shortestDuration,
            mostActiveTime: {
                hour: mostActiveHour,
                count: hourCounts[mostActiveHour]
            },
            mostActiveDayOfWeek: {
                day: mostActiveDay,
                count: dayCounts[mostActiveDay]
            },
            averageMood,
            averageEnergy,
            commonTags
        }
    }

    /**
     * 分析趋势
     */
    private static analyzeTrends(records: MasturbationRecord[]): AdvancedStats['trends'] {
        const weeklyData = this.getWeeklyData(records)
        
        return {
            frequency: this.calculateTrend(weeklyData.map(w => w.count)),
            duration: this.calculateTrend(weeklyData.map(w => w.avgDuration)),
            mood: this.calculateTrend(weeklyData.map(w => w.avgMood).filter(m => m > 0)),
            energy: this.calculateTrend(weeklyData.map(w => w.avgEnergy).filter(e => e > 0))
        }
    }

    /**
     * 计算单个指标的趋势
     */
    private static calculateTrend(data: number[]): TrendAnalysis {
        if (data.length < 2) {
            return {
                direction: 'stable',
                confidence: 0,
                prediction: data[0] || 0,
                changeRate: 0
            }
        }

        // 简单线性回归
        const n = data.length
        const x = Array.from({ length: n }, (_, i) => i)
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = data.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0)
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        // 计算R²（决定系数）作为置信度
        const yMean = sumY / n
        const ssTotal = data.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
        const ssRes = data.reduce((sum, yi, i) => {
            const predicted = slope * i + intercept
            return sum + Math.pow(yi - predicted, 2)
        }, 0)
        const rSquared = 1 - (ssRes / ssTotal)

        const direction = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
        const prediction = slope * n + intercept
        const changeRate = data.length > 1 ? ((data[data.length - 1] - data[0]) / data[0]) * 100 : 0

        return {
            direction,
            confidence: Math.max(0, Math.min(1, rSquared)),
            prediction: Math.max(0, prediction),
            changeRate
        }
    }

    /**
     * 获取周数据
     */
    private static getWeeklyData(records: MasturbationRecord[]) {
        const weeks = new Map<string, { count: number; totalDuration: number; moods: number[]; energies: number[] }>()
        
        records.forEach(record => {
            const weekKey = this.getWeekKey(record.startTime)
            const week = weeks.get(weekKey) || { count: 0, totalDuration: 0, moods: [], energies: [] }
            
            week.count++
            week.totalDuration += record.duration
            if (record.mood) week.moods.push(record.mood)
            if (record.energy) week.energies.push(record.energy)
            
            weeks.set(weekKey, week)
        })

        return Array.from(weeks.values()).map(week => ({
            count: week.count,
            avgDuration: week.totalDuration / week.count,
            avgMood: week.moods.length ? week.moods.reduce((a, b) => a + b, 0) / week.moods.length : 0,
            avgEnergy: week.energies.length ? week.energies.reduce((a, b) => a + b, 0) / week.energies.length : 0
        }))
    }

    /**
     * 获取周标识
     */
    private static getWeekKey(date: Date): string {
        const year = date.getFullYear()
        const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
        return `${year}-W${week}`
    }

    /**
     * 分析模式
     */
    private static analyzePatterns(records: MasturbationRecord[]): AdvancedStats['patterns'] {
        // 周模式（7天）
        const weeklyPattern = new Array(7).fill(0)
        records.forEach(record => {
            const day = record.startTime.getDay()
            weeklyPattern[day]++
        })

        // 月模式（30天）
        const monthlyPattern = new Array(30).fill(0)
        records.forEach(record => {
            const day = record.startTime.getDate() - 1
            if (day < 30) monthlyPattern[day]++
        })

        // 季节模式
        const seasonalPattern = { spring: 0, summer: 0, autumn: 0, winter: 0 }
        records.forEach(record => {
            const month = record.startTime.getMonth()
            if (month >= 2 && month <= 4) seasonalPattern.spring++
            else if (month >= 5 && month <= 7) seasonalPattern.summer++
            else if (month >= 8 && month <= 10) seasonalPattern.autumn++
            else seasonalPattern.winter++
        })

        return {
            weeklyPattern,
            monthlyPattern,
            seasonalPattern
        }
    }

    /**
     * 分析相关性
     */
    private static analyzeCorrelations(records: MasturbationRecord[]): AdvancedStats['correlations'] {
        const validRecords = records.filter(r => r.mood && r.energy)
        
        // 心情与精力的相关性
        const moodEnergyCorrelation = validRecords.length > 1 
            ? this.calculateCorrelation(
                validRecords.map(r => r.mood!),
                validRecords.map(r => r.energy!)
            ) : 0

        // 时长与心情的相关性
        const durationMoodRecords = records.filter(r => r.mood)
        const durationMoodCorrelation = durationMoodRecords.length > 1
            ? this.calculateCorrelation(
                durationMoodRecords.map(r => r.duration),
                durationMoodRecords.map(r => r.mood!)
            ) : 0

        // 时间偏好分析
        const hourPreferences = new Array(24).fill(0)
        records.forEach(record => {
            hourPreferences[record.startTime.getHours()]++
        })
        
        const timeOfDayPreference = hourPreferences
            .map((count, hour) => ({ hour, score: count }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)

        return {
            moodEnergyCorrelation,
            durationMoodCorrelation,
            timeOfDayPreference
        }
    }

    /**
     * 计算皮尔逊相关系数
     */
    private static calculateCorrelation(x: number[], y: number[]): number {
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

    /**
     * 生成洞察
     */
    private static generateInsights(
        _records: MasturbationRecord[],
        trends: AdvancedStats['trends'],
        patterns: AdvancedStats['patterns'],
        correlations: AdvancedStats['correlations']
    ): string[] {
        const insights: string[] = []

        // 趋势洞察
        if (trends.frequency.confidence > 0.7) {
            if (trends.frequency.direction === 'increasing') {
                insights.push('频率呈上升趋势，建议关注身心平衡')
            } else if (trends.frequency.direction === 'decreasing') {
                insights.push('频率呈下降趋势，这可能是积极的变化')
            }
        }

        // 模式洞察
        const mostActiveDay = patterns.weeklyPattern.indexOf(Math.max(...patterns.weeklyPattern))
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        insights.push(`${dayNames[mostActiveDay]}是您最活跃的一天`)

        // 相关性洞察
        if (Math.abs(correlations.moodEnergyCorrelation) > 0.5) {
            insights.push(
                correlations.moodEnergyCorrelation > 0 
                    ? '心情与精力呈正相关，保持良好心态有助于精力充沛'
                    : '心情与精力呈负相关，建议关注情绪管理'
            )
        }

        return insights
    }

    /**
     * 计算健康指标
     */
    private static calculateHealthMetrics(
        records: MasturbationRecord[],
        trends: AdvancedStats['trends']
    ): AdvancedStats['healthMetrics'] {
        // 规律性评分：基于频率的标准差
        const weeklyData = this.getWeeklyData(records)
        const frequencies = weeklyData.map(w => w.count)
        const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length
        const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - avgFreq, 2), 0) / frequencies.length
        const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) / avgFreq) * 100)

        // 平衡性评分：基于心情和精力的稳定性
        const moods = records.filter(r => r.mood).map(r => r.mood!)
        const energies = records.filter(r => r.energy).map(r => r.energy!)
        const moodStability = moods.length > 0 ? 100 - (this.calculateStandardDeviation(moods) / 5) * 100 : 50
        const energyStability = energies.length > 0 ? 100 - (this.calculateStandardDeviation(energies) / 5) * 100 : 50
        const balanceScore = (moodStability + energyStability) / 2

        // 整体趋势
        const wellbeingTrend = trends.mood.direction === 'increasing' && trends.energy.direction === 'increasing'
            ? 'improving'
            : trends.mood.direction === 'decreasing' || trends.energy.direction === 'decreasing'
            ? 'declining'
            : 'stable'

        return {
            consistencyScore: Math.round(consistencyScore),
            balanceScore: Math.round(balanceScore),
            wellbeingTrend
        }
    }

    /**
     * 计算标准差
     */
    private static calculateStandardDeviation(values: number[]): number {
        if (values.length === 0) return 0
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length
        return Math.sqrt(variance)
    }
}
