/**
 * 目标管理系统
 * 提供目标创建、跟踪、评估和激励功能
 */

import type { MasturbationRecord } from '@/types/record'
import { logger } from '@/utils/logger'
// import { cache } from '@/utils/cache'

export interface Goal {
    id: string
    title: string
    description: string
    type: 'frequency' | 'duration' | 'consistency' | 'wellness' | 'custom'
    category: 'health' | 'lifestyle' | 'personal' | 'challenge'
    targetValue: number
    currentValue: number
    unit: string
    startDate: Date
    endDate: Date
    status: 'active' | 'completed' | 'paused' | 'failed'
    priority: 'low' | 'medium' | 'high'
    difficulty: 'easy' | 'medium' | 'hard'
    
    // 进度跟踪
    milestones: Milestone[]
    progress: number // 0-100
    streakCount: number
    bestStreak: number
    
    // 策略和支持
    strategies: string[]
    rewards: string[]
    reminders: Reminder[]
    
    // 元数据
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
    tags: string[]
    notes: string
}

export interface Milestone {
    id: string
    title: string
    description: string
    targetDate: Date
    targetValue: number
    completed: boolean
    completedAt?: Date
    reward?: string
}

export interface Reminder {
    id: string
    type: 'daily' | 'weekly' | 'milestone' | 'encouragement'
    message: string
    time: string // HH:MM format
    days: number[] // 0-6, Sunday to Saturday
    enabled: boolean
}

export interface GoalProgress {
    goalId: string
    date: Date
    value: number
    notes?: string
    mood?: number
    confidence?: number
}

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: Date
    goalId?: string
    type: 'milestone' | 'streak' | 'improvement' | 'consistency' | 'special'
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface GoalTemplate {
    id: string
    name: string
    description: string
    type: Goal['type']
    category: Goal['category']
    defaultDuration: number // days
    defaultTargetValue: number
    unit: string
    strategies: string[]
    milestones: Omit<Milestone, 'id' | 'completed' | 'completedAt'>[]
    difficulty: Goal['difficulty']
    tags: string[]
}

export class GoalManager {
    private static readonly STORAGE_KEY = 'user_goals'
    private static readonly PROGRESS_KEY = 'goal_progress'
    private static readonly ACHIEVEMENTS_KEY = 'achievements'
    
    /**
     * 创建新目标
     */
    static async createGoal(goalData: Partial<Goal>): Promise<Goal> {
        const goal: Goal = {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: goalData.title || '新目标',
            description: goalData.description || '',
            type: goalData.type || 'custom',
            category: goalData.category || 'personal',
            targetValue: goalData.targetValue || 0,
            currentValue: 0,
            unit: goalData.unit || '',
            startDate: goalData.startDate || new Date(),
            endDate: goalData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'active',
            priority: goalData.priority || 'medium',
            difficulty: goalData.difficulty || 'medium',
            milestones: goalData.milestones || [],
            progress: 0,
            streakCount: 0,
            bestStreak: 0,
            strategies: goalData.strategies || [],
            rewards: goalData.rewards || [],
            reminders: goalData.reminders || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: goalData.tags || [],
            notes: goalData.notes || ''
        }
        
        const goals = await this.getGoals()
        goals.push(goal)
        await this.saveGoals(goals)
        
        logger.info('目标创建成功', { goalId: goal.id, title: goal.title }, 'GoalManager')
        return goal
    }
    
    /**
     * 从模板创建目标
     */
    static async createGoalFromTemplate(templateId: string, customizations?: Partial<Goal>): Promise<Goal> {
        const template = this.getGoalTemplate(templateId)
        if (!template) {
            throw new Error(`目标模板不存在: ${templateId}`)
        }
        
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + template.defaultDuration)
        
        const goalData: Partial<Goal> = {
            title: template.name,
            description: template.description,
            type: template.type,
            category: template.category,
            targetValue: template.defaultTargetValue,
            unit: template.unit,
            endDate,
            difficulty: template.difficulty,
            strategies: [...template.strategies],
            tags: [...template.tags],
            milestones: template.milestones.map((m, index) => ({
                id: `milestone_${Date.now()}_${index}`,
                title: m.title,
                description: m.description,
                targetDate: new Date(Date.now() + (m.targetDate.getTime() - Date.now())),
                targetValue: m.targetValue,
                completed: false,
                reward: m.reward
            })),
            ...customizations
        }
        
        return this.createGoal(goalData)
    }
    
    /**
     * 更新目标进度
     */
    static async updateGoalProgress(goalId: string, records: MasturbationRecord[]): Promise<void> {
        const goals = await this.getGoals()
        const goal = goals.find(g => g.id === goalId)
        
        if (!goal) {
            throw new Error(`目标不存在: ${goalId}`)
        }
        
        const oldProgress = goal.progress
        const newValue = this.calculateGoalValue(goal, records)
        
        goal.currentValue = newValue
        goal.progress = Math.min(100, (newValue / goal.targetValue) * 100)
        goal.updatedAt = new Date()
        
        // 更新连续记录
        this.updateStreak(goal, records)
        
        // 检查里程碑
        this.checkMilestones(goal)
        
        // 检查目标完成
        if (goal.progress >= 100 && goal.status === 'active') {
            goal.status = 'completed'
            goal.completedAt = new Date()
            await this.unlockAchievement('goal_completed', goal.id)
            logger.info('目标完成', { goalId: goal.id, title: goal.title }, 'GoalManager')
        }
        
        // 检查成就
        await this.checkAchievements(goal, oldProgress)
        
        await this.saveGoals(goals)
        
        // 记录进度
        await this.recordProgress(goalId, newValue)
    }
    
    /**
     * 获取所有目标
     */
    static async getGoals(): Promise<Goal[]> {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY)
            if (!stored) return []
            
            const goals = JSON.parse(stored)
            return goals.map((goal: any) => ({
                ...goal,
                startDate: new Date(goal.startDate),
                endDate: new Date(goal.endDate),
                createdAt: new Date(goal.createdAt),
                updatedAt: new Date(goal.updatedAt),
                completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined,
                milestones: goal.milestones.map((m: any) => ({
                    ...m,
                    targetDate: new Date(m.targetDate),
                    completedAt: m.completedAt ? new Date(m.completedAt) : undefined
                }))
            }))
        } catch (error) {
            logger.error('加载目标失败', { error }, 'GoalManager')
            return []
        }
    }
    
    /**
     * 保存目标
     */
    static async saveGoals(goals: Goal[]): Promise<void> {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(goals))
        } catch (error) {
            logger.error('保存目标失败', { error }, 'GoalManager')
            throw error
        }
    }
    
    /**
     * 删除目标
     */
    static async deleteGoal(goalId: string): Promise<void> {
        const goals = await this.getGoals()
        const filteredGoals = goals.filter(g => g.id !== goalId)
        await this.saveGoals(filteredGoals)
        
        logger.info('目标已删除', { goalId }, 'GoalManager')
    }
    
    /**
     * 暂停/恢复目标
     */
    static async toggleGoalStatus(goalId: string): Promise<void> {
        const goals = await this.getGoals()
        const goal = goals.find(g => g.id === goalId)
        
        if (!goal) return
        
        goal.status = goal.status === 'active' ? 'paused' : 'active'
        goal.updatedAt = new Date()
        
        await this.saveGoals(goals)
        logger.info('目标状态已更新', { goalId, status: goal.status }, 'GoalManager')
    }
    
    /**
     * 获取目标统计
     */
    static async getGoalStatistics(): Promise<{
        total: number
        active: number
        completed: number
        paused: number
        failed: number
        completionRate: number
        averageProgress: number
    }> {
        const goals = await this.getGoals()
        
        const stats = {
            total: goals.length,
            active: goals.filter(g => g.status === 'active').length,
            completed: goals.filter(g => g.status === 'completed').length,
            paused: goals.filter(g => g.status === 'paused').length,
            failed: goals.filter(g => g.status === 'failed').length,
            completionRate: 0,
            averageProgress: 0
        }
        
        if (stats.total > 0) {
            stats.completionRate = (stats.completed / stats.total) * 100
            stats.averageProgress = goals.reduce((sum, g) => sum + g.progress, 0) / stats.total
        }
        
        return stats
    }
    
    /**
     * 获取成就列表
     */
    static async getAchievements(): Promise<Achievement[]> {
        try {
            const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY)
            if (!stored) return []
            
            const achievements = JSON.parse(stored)
            return achievements.map((a: any) => ({
                ...a,
                unlockedAt: new Date(a.unlockedAt)
            }))
        } catch (error) {
            logger.error('加载成就失败', { error }, 'GoalManager')
            return []
        }
    }
    
    /**
     * 解锁成就
     */
    static async unlockAchievement(type: string, goalId?: string): Promise<void> {
        const achievements = await this.getAchievements()
        const achievementDef = this.getAchievementDefinition(type)
        
        if (!achievementDef) return
        
        // 检查是否已解锁
        const existing = achievements.find(a => a.type === type && a.goalId === goalId)
        if (existing) return
        
        const achievement: Achievement = {
            id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: achievementDef.title,
            description: achievementDef.description,
            icon: achievementDef.icon,
            unlockedAt: new Date(),
            goalId,
            type: achievementDef.type,
            rarity: achievementDef.rarity
        }
        
        achievements.push(achievement)
        localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements))
        
        logger.info('成就解锁', { achievementId: achievement.id, type }, 'GoalManager')
    }
    
    // 私有辅助方法
    private static calculateGoalValue(goal: Goal, records: MasturbationRecord[]): number {
        const relevantRecords = records.filter(r => 
            r.startTime >= goal.startDate && r.startTime <= goal.endDate
        )
        
        switch (goal.type) {
            case 'frequency':
                return relevantRecords.length
            case 'duration':
                return relevantRecords.reduce((sum, r) => sum + r.duration, 0)
            case 'consistency':
                return this.calculateConsistencyScore(relevantRecords, goal)
            case 'wellness':
                return this.calculateWellnessScore(relevantRecords)
            default:
                return goal.currentValue
        }
    }
    
    private static calculateConsistencyScore(records: MasturbationRecord[], goal: Goal): number {
        // 计算一致性评分的简化实现
        const days = Math.ceil((goal.endDate.getTime() - goal.startDate.getTime()) / (24 * 60 * 60 * 1000))
        const recordDays = new Set(records.map(r => r.startTime.toDateString())).size
        return (recordDays / days) * 100
    }
    
    private static calculateWellnessScore(records: MasturbationRecord[]): number {
        const moodRecords = records.filter(r => r.mood)
        const energyRecords = records.filter(r => r.energy)
        
        if (moodRecords.length === 0 && energyRecords.length === 0) return 0
        
        const avgMood = moodRecords.length > 0 
            ? moodRecords.reduce((sum, r) => sum + r.mood!, 0) / moodRecords.length 
            : 3
        const avgEnergy = energyRecords.length > 0 
            ? energyRecords.reduce((sum, r) => sum + r.energy!, 0) / energyRecords.length 
            : 3
        
        return ((avgMood + avgEnergy) / 2) * 20 // 转换为0-100分
    }
    
    private static updateStreak(goal: Goal, records: MasturbationRecord[]): void {
        // 简化的连续记录计算
        const today = new Date()
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        
        const hasToday = records.some(r => r.startTime.toDateString() === today.toDateString())
        const hasYesterday = records.some(r => r.startTime.toDateString() === yesterday.toDateString())
        
        if (hasToday) {
            if (hasYesterday || goal.streakCount === 0) {
                goal.streakCount++
                goal.bestStreak = Math.max(goal.bestStreak, goal.streakCount)
            }
        } else {
            goal.streakCount = 0
        }
    }
    
    private static checkMilestones(goal: Goal): void {
        goal.milestones.forEach(milestone => {
            if (!milestone.completed && goal.currentValue >= milestone.targetValue) {
                milestone.completed = true
                milestone.completedAt = new Date()
                logger.info('里程碑达成', { 
                    goalId: goal.id, 
                    milestoneId: milestone.id, 
                    title: milestone.title 
                }, 'GoalManager')
            }
        })
    }
    
    private static async checkAchievements(goal: Goal, oldProgress: number): Promise<void> {
        // 检查各种成就条件
        if (goal.progress >= 50 && oldProgress < 50) {
            await this.unlockAchievement('halfway_there', goal.id)
        }
        
        if (goal.streakCount >= 7) {
            await this.unlockAchievement('week_streak', goal.id)
        }
        
        if (goal.streakCount >= 30) {
            await this.unlockAchievement('month_streak', goal.id)
        }
    }
    
    private static async recordProgress(goalId: string, value: number): Promise<void> {
        try {
            const progressKey = `${this.PROGRESS_KEY}_${goalId}`
            const stored = localStorage.getItem(progressKey)
            const progress: GoalProgress[] = stored ? JSON.parse(stored) : []
            
            progress.push({
                goalId,
                date: new Date(),
                value
            })
            
            // 只保留最近100条记录
            if (progress.length > 100) {
                progress.splice(0, progress.length - 100)
            }
            
            localStorage.setItem(progressKey, JSON.stringify(progress))
        } catch (error) {
            logger.error('记录进度失败', { error, goalId }, 'GoalManager')
        }
    }
    
    private static getGoalTemplate(templateId: string): GoalTemplate | null {
        // 预定义的目标模板
        const templates: { [key: string]: GoalTemplate } = {
            'reduce_frequency': {
                id: 'reduce_frequency',
                name: '减少频率',
                description: '逐步减少活动频率到健康水平',
                type: 'frequency',
                category: 'health',
                defaultDuration: 30,
                defaultTargetValue: 8, // 每月8次
                unit: '次/月',
                strategies: [
                    '建立新的日常习惯',
                    '增加体育锻炼',
                    '培养其他兴趣爱好'
                ],
                milestones: [
                    {
                        title: '第一周目标',
                        description: '减少25%',
                        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        targetValue: 6,
                        reward: '奖励自己一顿美食'
                    }
                ],
                difficulty: 'medium',
                tags: ['健康', '自控']
            }
        }
        
        return templates[templateId] || null
    }
    
    private static getAchievementDefinition(type: string): any {
        const definitions: { [key: string]: any } = {
            'goal_completed': {
                title: '目标达成者',
                description: '成功完成一个目标',
                icon: '🎯',
                type: 'milestone',
                rarity: 'common'
            },
            'halfway_there': {
                title: '半程英雄',
                description: '目标进度达到50%',
                icon: '🏃',
                type: 'milestone',
                rarity: 'common'
            },
            'week_streak': {
                title: '一周坚持',
                description: '连续坚持一周',
                icon: '🔥',
                type: 'streak',
                rarity: 'rare'
            },
            'month_streak': {
                title: '月度冠军',
                description: '连续坚持一个月',
                icon: '👑',
                type: 'streak',
                rarity: 'epic'
            }
        }
        
        return definitions[type]
    }
}
