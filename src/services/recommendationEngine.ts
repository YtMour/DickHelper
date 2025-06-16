/**
 * 智能推荐引擎
 * 基于用户行为数据提供个性化建议和优化方案
 */

import type { MasturbationRecord } from '@/types/record'
import { logger } from '@/utils/logger'
import { IntelligentAnalyticsEngine } from './intelligentAnalytics'

export interface Recommendation {
    id: string
    type: 'lifestyle' | 'timing' | 'wellness' | 'goal' | 'habit'
    category: 'health' | 'productivity' | 'balance' | 'improvement'
    title: string
    description: string
    reasoning: string
    actionSteps: string[]
    expectedBenefit: string
    difficulty: 'easy' | 'medium' | 'hard'
    timeframe: string
    priority: number // 1-10
    confidence: number // 0-1
    tags: string[]
    relatedMetrics: string[]
}

export interface GoalSuggestion {
    id: string
    title: string
    description: string
    targetValue: number
    currentValue: number
    timeframe: number // days
    milestones: Array<{
        day: number
        target: number
        description: string
    }>
    strategies: string[]
    successIndicators: string[]
}

export interface PersonalizedPlan {
    id: string
    name: string
    description: string
    duration: number // days
    goals: GoalSuggestion[]
    dailyRecommendations: Array<{
        day: number
        recommendations: Recommendation[]
        focus: string
    }>
    weeklyCheckpoints: Array<{
        week: number
        objectives: string[]
        assessments: string[]
    }>
}

export class RecommendationEngine {
    /**
     * 生成个性化推荐
     */
    static async generateRecommendations(records: MasturbationRecord[]): Promise<Recommendation[]> {
        logger.info('生成个性化推荐', { recordCount: records.length }, 'RecommendationEngine')
        
        const recommendations: Recommendation[] = []
        
        // 分析用户模式
        const patterns = await this.analyzeUserPatterns(records)
        
        // 生成不同类型的推荐
        recommendations.push(...this.generateLifestyleRecommendations(records, patterns))
        recommendations.push(...this.generateTimingRecommendations(records, patterns))
        recommendations.push(...this.generateWellnessRecommendations(records, patterns))
        recommendations.push(...this.generateHabitRecommendations(records, patterns))
        
        // 按优先级排序
        return recommendations.sort((a, b) => b.priority - a.priority)
    }

    /**
     * 生成目标建议
     */
    static generateGoalSuggestions(records: MasturbationRecord[]): GoalSuggestion[] {
        const goals: GoalSuggestion[] = []
        
        // 频率优化目标
        const currentFreq = this.calculateWeeklyFrequency(records)
        if (currentFreq > 7) { // 每天超过1次
            goals.push({
                id: 'goal_frequency_reduction',
                title: '频率优化',
                description: '逐步调整到更健康的频率范围',
                targetValue: 4, // 目标每周4次
                currentValue: currentFreq,
                timeframe: 30,
                milestones: [
                    { day: 7, target: currentFreq * 0.8, description: '减少20%' },
                    { day: 14, target: currentFreq * 0.6, description: '减少40%' },
                    { day: 21, target: currentFreq * 0.4, description: '减少60%' },
                    { day: 30, target: 4, description: '达到目标频率' }
                ],
                strategies: [
                    '建立新的日常习惯',
                    '增加体育锻炼',
                    '培养其他兴趣爱好',
                    '改善睡眠质量'
                ],
                successIndicators: [
                    '频率稳定在目标范围',
                    '心情和精力保持良好',
                    '生活更加充实平衡'
                ]
            })
        }
        
        // 规律性改善目标
        const consistency = IntelligentAnalyticsEngine.calculateHealthScore(records).components.consistency
        if (consistency < 70) {
            goals.push({
                id: 'goal_consistency_improvement',
                title: '规律性提升',
                description: '建立更稳定的生活节奏',
                targetValue: 85,
                currentValue: consistency,
                timeframe: 21,
                milestones: [
                    { day: 7, target: consistency + 5, description: '初步改善' },
                    { day: 14, target: consistency + 10, description: '明显进步' },
                    { day: 21, target: 85, description: '达到良好水平' }
                ],
                strategies: [
                    '制定固定的作息时间',
                    '建立晨间和晚间例行程序',
                    '使用提醒工具',
                    '记录日常活动'
                ],
                successIndicators: [
                    '作息时间更加规律',
                    '生活节奏更加稳定',
                    '整体健康状况改善'
                ]
            })
        }
        
        // 心情改善目标
        const avgMood = this.calculateAverageMood(records)
        if (avgMood < 3.5) {
            goals.push({
                id: 'goal_mood_enhancement',
                title: '心情提升',
                description: '改善整体心理状态和情绪健康',
                targetValue: 4.0,
                currentValue: avgMood,
                timeframe: 28,
                milestones: [
                    { day: 7, target: avgMood + 0.2, description: '情绪稍有改善' },
                    { day: 14, target: avgMood + 0.4, description: '心情明显好转' },
                    { day: 21, target: avgMood + 0.6, description: '保持积极状态' },
                    { day: 28, target: 4.0, description: '达到良好心情水平' }
                ],
                strategies: [
                    '练习冥想和正念',
                    '增加社交活动',
                    '保持感恩日记',
                    '寻求专业心理支持'
                ],
                successIndicators: [
                    '心情评分持续提升',
                    '压力水平降低',
                    '生活满意度增加'
                ]
            })
        }
        
        return goals
    }

    /**
     * 创建个性化计划
     */
    static createPersonalizedPlan(records: MasturbationRecord[], selectedGoals: string[]): PersonalizedPlan {
        const goals = this.generateGoalSuggestions(records)
        const selectedGoalObjects = goals.filter(g => selectedGoals.includes(g.id))
        
        const plan: PersonalizedPlan = {
            id: `plan_${Date.now()}`,
            name: '个人改善计划',
            description: '基于您的数据分析制定的个性化改善方案',
            duration: Math.max(...selectedGoalObjects.map(g => g.timeframe)),
            goals: selectedGoalObjects,
            dailyRecommendations: [],
            weeklyCheckpoints: []
        }
        
        // 生成每日推荐
        for (let day = 1; day <= plan.duration; day++) {
            const dayRecommendations = this.generateDailyRecommendations(day, selectedGoalObjects, records)
            plan.dailyRecommendations.push({
                day,
                recommendations: dayRecommendations,
                focus: this.getDayFocus(day, selectedGoalObjects)
            })
        }
        
        // 生成周检查点
        const weeks = Math.ceil(plan.duration / 7)
        for (let week = 1; week <= weeks; week++) {
            plan.weeklyCheckpoints.push({
                week,
                objectives: this.getWeeklyObjectives(week, selectedGoalObjects),
                assessments: this.getWeeklyAssessments(week, selectedGoalObjects)
            })
        }
        
        return plan
    }

    /**
     * 分析用户模式
     */
    private static async analyzeUserPatterns(records: MasturbationRecord[]) {
        const patterns = {
            timePreferences: this.analyzeTimePreferences(records),
            frequencyPattern: this.analyzeFrequencyPattern(records),
            moodCorrelations: this.analyzeMoodCorrelations(records),
            durationTrends: this.analyzeDurationTrends(records),
            weeklyDistribution: this.analyzeWeeklyDistribution(records)
        }
        
        return patterns
    }

    /**
     * 生成生活方式推荐
     */
    private static generateLifestyleRecommendations(records: MasturbationRecord[], patterns: any): Recommendation[] {
        const recommendations: Recommendation[] = []
        
        // 基于频率的生活方式建议
        const weeklyFreq = this.calculateWeeklyFrequency(records)
        if (weeklyFreq > 10) {
            recommendations.push({
                id: 'lifestyle_activity_diversification',
                type: 'lifestyle',
                category: 'balance',
                title: '丰富生活活动',
                description: '增加多样化的生活活动来平衡日常节奏',
                reasoning: '当前频率较高，增加其他活动可以帮助建立更平衡的生活方式',
                actionSteps: [
                    '每天安排30分钟的体育锻炼',
                    '培养一个新的兴趣爱好',
                    '增加社交活动频率',
                    '尝试冥想或瑜伽练习'
                ],
                expectedBenefit: '更平衡的生活节奏，提升整体生活质量',
                difficulty: 'medium',
                timeframe: '2-4周见效',
                priority: 8,
                confidence: 0.85,
                tags: ['生活平衡', '健康习惯', '多样化'],
                relatedMetrics: ['频率', '心情', '精力']
            })
        }
        
        // 基于时间模式的建议
        if (patterns.timePreferences.lateNight > 0.3) {
            recommendations.push({
                id: 'lifestyle_sleep_optimization',
                type: 'lifestyle',
                category: 'health',
                title: '优化睡眠作息',
                description: '调整晚间活动时间以改善睡眠质量',
                reasoning: '数据显示您经常在深夜活跃，这可能影响睡眠质量',
                actionSteps: [
                    '设定固定的就寝时间',
                    '睡前1小时避免刺激性活动',
                    '建立放松的睡前例行程序',
                    '保持卧室环境舒适'
                ],
                expectedBenefit: '改善睡眠质量，提升白天精力水平',
                difficulty: 'medium',
                timeframe: '1-2周见效',
                priority: 7,
                confidence: 0.8,
                tags: ['睡眠健康', '作息调整', '精力管理'],
                relatedMetrics: ['时间分布', '精力', '睡眠质量']
            })
        }
        
        return recommendations
    }

    /**
     * 生成时间管理推荐
     */
    private static generateTimingRecommendations(_records: MasturbationRecord[], patterns: any): Recommendation[] {
        const recommendations: Recommendation[] = []

        if (patterns.weeklyDistribution.weekendSpike > 2) {
            recommendations.push({
                id: 'timing_weekend_planning',
                type: 'timing',
                category: 'productivity',
                title: '周末时间规划',
                description: '更好地规划周末时间，增加有意义的活动',
                reasoning: '周末活动频率明显高于工作日，建议增加其他安排',
                actionSteps: [
                    '制定周末活动计划',
                    '安排户外活动或社交聚会',
                    '学习新技能或爱好',
                    '进行家务整理或个人项目'
                ],
                expectedBenefit: '更充实的周末生活，减少单一活动依赖',
                difficulty: 'easy',
                timeframe: '立即见效',
                priority: 6,
                confidence: 0.75,
                tags: ['时间管理', '周末规划', '生活充实'],
                relatedMetrics: ['周分布', '生活满意度']
            })
        }
        
        return recommendations
    }

    /**
     * 生成健康推荐
     */
    private static generateWellnessRecommendations(records: MasturbationRecord[], _patterns: any): Recommendation[] {
        const recommendations: Recommendation[] = []
        
        const avgMood = this.calculateAverageMood(records)
        if (avgMood < 3.0) {
            recommendations.push({
                id: 'wellness_mood_improvement',
                type: 'wellness',
                category: 'health',
                title: '情绪健康提升',
                description: '采取措施改善整体心理健康状态',
                reasoning: '心情评分偏低，建议关注心理健康',
                actionSteps: [
                    '每日进行10分钟冥想练习',
                    '保持感恩日记',
                    '增加阳光照射时间',
                    '考虑寻求专业心理咨询'
                ],
                expectedBenefit: '改善心情状态，提升生活幸福感',
                difficulty: 'medium',
                timeframe: '2-4周见效',
                priority: 9,
                confidence: 0.9,
                tags: ['心理健康', '情绪管理', '幸福感'],
                relatedMetrics: ['心情', '整体健康']
            })
        }
        
        return recommendations
    }

    /**
     * 生成习惯建立推荐
     */
    private static generateHabitRecommendations(records: MasturbationRecord[], _patterns: any): Recommendation[] {
        const recommendations: Recommendation[] = []
        
        const consistency = IntelligentAnalyticsEngine.calculateHealthScore(records).components.consistency
        if (consistency < 60) {
            recommendations.push({
                id: 'habit_consistency_building',
                type: 'habit',
                category: 'improvement',
                title: '建立规律习惯',
                description: '通过小步骤建立更规律的生活习惯',
                reasoning: '当前生活规律性较低，建议逐步建立稳定习惯',
                actionSteps: [
                    '设定固定的起床和就寝时间',
                    '建立晨间例行程序',
                    '使用习惯追踪应用',
                    '从小习惯开始逐步建立'
                ],
                expectedBenefit: '提升生活规律性，增强自控能力',
                difficulty: 'hard',
                timeframe: '4-8周见效',
                priority: 7,
                confidence: 0.8,
                tags: ['习惯建立', '规律性', '自控力'],
                relatedMetrics: ['一致性', '整体健康']
            })
        }
        
        return recommendations
    }

    // 辅助方法
    private static analyzeTimePreferences(records: MasturbationRecord[]) {
        const hourCounts = new Array(24).fill(0)
        records.forEach(record => {
            hourCounts[record.startTime.getHours()]++
        })
        
        const total = records.length
        return {
            morning: (hourCounts.slice(6, 12).reduce((a, b) => a + b, 0)) / total,
            afternoon: (hourCounts.slice(12, 18).reduce((a, b) => a + b, 0)) / total,
            evening: (hourCounts.slice(18, 22).reduce((a, b) => a + b, 0)) / total,
            lateNight: (hourCounts.slice(22, 24).concat(hourCounts.slice(0, 6)).reduce((a, b) => a + b, 0)) / total
        }
    }

    private static analyzeFrequencyPattern(records: MasturbationRecord[]) {
        const weeklyFreq = this.calculateWeeklyFrequency(records)
        const variance = this.calculateVariance(records.map(_r => 1)) // 简化计算
        
        return {
            average: weeklyFreq,
            stability: 1 / (1 + variance),
            trend: this.calculateTrend(records)
        }
    }

    private static analyzeMoodCorrelations(records: MasturbationRecord[]) {
        const moodRecords = records.filter(r => r.mood && r.energy)
        if (moodRecords.length < 5) return { moodEnergyCorr: 0 }
        
        const moods = moodRecords.map(r => r.mood!)
        const energies = moodRecords.map(r => r.energy!)
        
        return {
            moodEnergyCorr: this.calculateCorrelation(moods, energies)
        }
    }

    private static analyzeDurationTrends(records: MasturbationRecord[]) {
        const durations = records.map(r => r.duration)
        return {
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            trend: this.calculateTrend(records),
            variance: this.calculateVariance(durations)
        }
    }

    private static analyzeWeeklyDistribution(records: MasturbationRecord[]) {
        const weekdayCounts = new Array(7).fill(0)
        records.forEach(record => {
            weekdayCounts[record.startTime.getDay()]++
        })
        
        const weekdays = weekdayCounts.slice(1, 6).reduce((a, b) => a + b, 0)
        const weekends = weekdayCounts[0] + weekdayCounts[6]
        
        return {
            weekendSpike: weekends / Math.max(1, weekdays) * 5 / 2, // 标准化比较
            distribution: weekdayCounts
        }
    }

    private static calculateWeeklyFrequency(records: MasturbationRecord[]): number {
        if (records.length === 0) return 0
        const daySpan = (Date.now() - records[0].startTime.getTime()) / (1000 * 60 * 60 * 24)
        return records.length / Math.max(1, daySpan) * 7
    }

    private static calculateAverageMood(records: MasturbationRecord[]): number {
        const moodRecords = records.filter(r => r.mood)
        return moodRecords.length > 0 
            ? moodRecords.reduce((sum, r) => sum + r.mood!, 0) / moodRecords.length 
            : 3
    }

    private static calculateVariance(data: number[]): number {
        const mean = data.reduce((a, b) => a + b, 0) / data.length
        return data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length
    }

    private static calculateTrend(records: MasturbationRecord[]): number {
        // 简化的趋势计算
        if (records.length < 2) return 0
        const recent = records.slice(-Math.floor(records.length / 3))
        const earlier = records.slice(0, Math.floor(records.length / 3))
        return recent.length - earlier.length
    }

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

    private static generateDailyRecommendations(day: number, _goals: GoalSuggestion[], _records: MasturbationRecord[]): Recommendation[] {
        // 根据目标和天数生成每日推荐
        const recommendations: Recommendation[] = []
        
        // 这里可以根据具体的目标和进度生成个性化的每日建议
        // 简化实现
        if (day % 7 === 1) { // 每周一
            recommendations.push({
                id: `daily_${day}_planning`,
                type: 'habit',
                category: 'productivity',
                title: '周计划制定',
                description: '为新的一周制定具体计划',
                reasoning: '周一是制定计划的好时机',
                actionSteps: ['回顾上周进展', '设定本周目标', '安排具体行动'],
                expectedBenefit: '更有条理的一周',
                difficulty: 'easy',
                timeframe: '立即',
                priority: 5,
                confidence: 0.8,
                tags: ['计划', '目标'],
                relatedMetrics: ['进展']
            })
        }
        
        return recommendations
    }

    private static getDayFocus(day: number, _goals: GoalSuggestion[]): string {
        const focuses = ['建立习惯', '保持动力', '自我反思', '调整策略', '庆祝进步']
        return focuses[day % focuses.length]
    }

    private static getWeeklyObjectives(week: number, goals: GoalSuggestion[]): string[] {
        return goals.map(goal => {
            const milestone = goal.milestones.find(m => Math.floor(m.day / 7) + 1 === week)
            return milestone ? milestone.description : `继续朝着${goal.title}努力`
        })
    }

    private static getWeeklyAssessments(_week: number, _goals: GoalSuggestion[]): string[] {
        return [
            '回顾本周的进展情况',
            '评估目标完成度',
            '识别遇到的挑战',
            '调整下周的策略',
            '记录学到的经验'
        ]
    }
}
