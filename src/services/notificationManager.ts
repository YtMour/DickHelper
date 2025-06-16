/**
 * 智能通知管理系统
 * 提供个性化提醒、激励消息和重要通知功能
 */

import { logger } from '@/utils/logger'

export interface Notification {
    id: string
    type: 'reminder' | 'achievement' | 'goal' | 'insight' | 'warning' | 'celebration'
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    category: 'health' | 'progress' | 'motivation' | 'system'
    
    // 时间相关
    createdAt: Date
    scheduledAt?: Date
    expiresAt?: Date
    
    // 状态
    read: boolean
    dismissed: boolean
    actionTaken: boolean
    
    // 交互
    actions?: NotificationAction[]
    data?: any
    
    // 显示设置
    persistent: boolean
    sound: boolean
    vibration: boolean
    
    // 元数据
    source: string
    tags: string[]
}

export interface NotificationAction {
    id: string
    label: string
    type: 'primary' | 'secondary' | 'danger'
    action: string
    data?: any
}

export interface NotificationSettings {
    enabled: boolean
    quietHours: {
        enabled: boolean
        start: string // HH:MM
        end: string // HH:MM
    }
    categories: {
        [key: string]: {
            enabled: boolean
            sound: boolean
            vibration: boolean
            priority: 'low' | 'medium' | 'high'
        }
    }
    frequency: {
        dailyReminders: boolean
        weeklyReports: boolean
        goalUpdates: boolean
        achievements: boolean
    }
    customMessages: {
        enabled: boolean
        motivational: string[]
        warnings: string[]
        celebrations: string[]
    }
}

export class NotificationManager {
    private static readonly STORAGE_KEY = 'notifications'
    private static readonly SETTINGS_KEY = 'notification_settings'
    private static readonly MAX_NOTIFICATIONS = 100
    
    private static notifications: Notification[] = []
    private static settings: NotificationSettings | null = null
    private static listeners: Array<(notification: Notification) => void> = []
    
    /**
     * 初始化通知管理器
     */
    static async initialize(): Promise<void> {
        await this.loadNotifications()
        await this.loadSettings()
        this.setupPeriodicTasks()
        
        logger.info('通知管理器初始化完成', {}, 'NotificationManager')
    }
    
    /**
     * 创建通知
     */
    static async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
        const notification: Notification = {
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: notificationData.type || 'reminder',
            title: notificationData.title || '',
            message: notificationData.message || '',
            priority: notificationData.priority || 'medium',
            category: notificationData.category || 'system',
            createdAt: new Date(),
            scheduledAt: notificationData.scheduledAt,
            expiresAt: notificationData.expiresAt,
            read: false,
            dismissed: false,
            actionTaken: false,
            actions: notificationData.actions || [],
            data: notificationData.data,
            persistent: notificationData.persistent || false,
            sound: notificationData.sound !== false,
            vibration: notificationData.vibration !== false,
            source: notificationData.source || 'system',
            tags: notificationData.tags || []
        }
        
        // 检查是否应该显示通知
        if (!this.shouldShowNotification(notification)) {
            return notification
        }
        
        this.notifications.unshift(notification)
        
        // 限制通知数量
        if (this.notifications.length > this.MAX_NOTIFICATIONS) {
            this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS)
        }
        
        await this.saveNotifications()
        this.notifyListeners(notification)
        
        // 如果是即时通知，立即显示
        if (!notification.scheduledAt || notification.scheduledAt <= new Date()) {
            this.displayNotification(notification)
        }
        
        logger.debug('通知已创建', { 
            notificationId: notification.id, 
            type: notification.type,
            title: notification.title 
        }, 'NotificationManager')
        
        return notification
    }
    
    /**
     * 创建目标提醒
     */
    static async createGoalReminder(goalId: string, goalTitle: string, message: string): Promise<void> {
        await this.createNotification({
            type: 'goal',
            title: '目标提醒',
            message: `${goalTitle}: ${message}`,
            category: 'progress',
            priority: 'medium',
            source: 'goal_manager',
            data: { goalId },
            actions: [
                {
                    id: 'view_goal',
                    label: '查看目标',
                    type: 'primary',
                    action: 'navigate',
                    data: { route: '/goals', goalId }
                },
                {
                    id: 'dismiss',
                    label: '稍后提醒',
                    type: 'secondary',
                    action: 'snooze',
                    data: { minutes: 60 }
                }
            ],
            tags: ['goal', 'reminder']
        })
    }
    
    /**
     * 创建成就通知
     */
    static async createAchievementNotification(achievementTitle: string, description: string): Promise<void> {
        await this.createNotification({
            type: 'achievement',
            title: '🎉 新成就解锁！',
            message: `${achievementTitle}: ${description}`,
            category: 'motivation',
            priority: 'high',
            source: 'achievement_system',
            persistent: true,
            actions: [
                {
                    id: 'view_achievements',
                    label: '查看所有成就',
                    type: 'primary',
                    action: 'navigate',
                    data: { route: '/achievements' }
                }
            ],
            tags: ['achievement', 'celebration']
        })
    }
    
    /**
     * 创建洞察通知
     */
    static async createInsightNotification(insight: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
        await this.createNotification({
            type: 'insight',
            title: '💡 数据洞察',
            message: insight,
            category: 'health',
            priority,
            source: 'analytics_engine',
            actions: [
                {
                    id: 'view_analytics',
                    label: '查看详细分析',
                    type: 'primary',
                    action: 'navigate',
                    data: { route: '/analytics' }
                }
            ],
            tags: ['insight', 'analytics']
        })
    }
    
    /**
     * 创建警告通知
     */
    static async createWarningNotification(warning: string, data?: any): Promise<void> {
        await this.createNotification({
            type: 'warning',
            title: '⚠️ 需要关注',
            message: warning,
            category: 'health',
            priority: 'high',
            source: 'health_monitor',
            persistent: true,
            data,
            actions: [
                {
                    id: 'view_recommendations',
                    label: '查看建议',
                    type: 'primary',
                    action: 'navigate',
                    data: { route: '/recommendations' }
                },
                {
                    id: 'dismiss_warning',
                    label: '我知道了',
                    type: 'secondary',
                    action: 'dismiss'
                }
            ],
            tags: ['warning', 'health']
        })
    }
    
    /**
     * 创建庆祝通知
     */
    static async createCelebrationNotification(message: string, data?: any): Promise<void> {
        const celebrations = [
            '🎊 太棒了！',
            '🌟 做得很好！',
            '🎯 目标达成！',
            '💪 继续保持！',
            '🏆 优秀表现！'
        ]
        
        const randomTitle = celebrations[Math.floor(Math.random() * celebrations.length)]
        
        await this.createNotification({
            type: 'celebration',
            title: randomTitle,
            message,
            category: 'motivation',
            priority: 'medium',
            source: 'motivation_system',
            data,
            tags: ['celebration', 'motivation']
        })
    }
    
    /**
     * 标记通知为已读
     */
    static async markAsRead(notificationId: string): Promise<void> {
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification && !notification.read) {
            notification.read = true
            await this.saveNotifications()
            
            logger.debug('通知已标记为已读', { notificationId }, 'NotificationManager')
        }
    }
    
    /**
     * 标记所有通知为已读
     */
    static async markAllAsRead(): Promise<void> {
        let changed = false
        this.notifications.forEach(notification => {
            if (!notification.read) {
                notification.read = true
                changed = true
            }
        })
        
        if (changed) {
            await this.saveNotifications()
            logger.debug('所有通知已标记为已读', {}, 'NotificationManager')
        }
    }
    
    /**
     * 忽略通知
     */
    static async dismissNotification(notificationId: string): Promise<void> {
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification) {
            notification.dismissed = true
            notification.read = true
            await this.saveNotifications()
            
            logger.debug('通知已忽略', { notificationId }, 'NotificationManager')
        }
    }
    
    /**
     * 删除通知
     */
    static async deleteNotification(notificationId: string): Promise<void> {
        this.notifications = this.notifications.filter(n => n.id !== notificationId)
        await this.saveNotifications()
        
        logger.debug('通知已删除', { notificationId }, 'NotificationManager')
    }
    
    /**
     * 清理过期通知
     */
    static async cleanupExpiredNotifications(): Promise<void> {
        const now = new Date()
        const beforeCount = this.notifications.length
        
        this.notifications = this.notifications.filter(notification => {
            return !notification.expiresAt || notification.expiresAt > now
        })
        
        const removedCount = beforeCount - this.notifications.length
        if (removedCount > 0) {
            await this.saveNotifications()
            logger.debug('清理过期通知', { removedCount }, 'NotificationManager')
        }
    }
    
    /**
     * 获取通知列表
     */
    static getNotifications(filter?: {
        unreadOnly?: boolean
        type?: Notification['type']
        category?: Notification['category']
        limit?: number
    }): Notification[] {
        let filtered = [...this.notifications]
        
        if (filter?.unreadOnly) {
            filtered = filtered.filter(n => !n.read)
        }
        
        if (filter?.type) {
            filtered = filtered.filter(n => n.type === filter.type)
        }
        
        if (filter?.category) {
            filtered = filtered.filter(n => n.category === filter.category)
        }
        
        if (filter?.limit) {
            filtered = filtered.slice(0, filter.limit)
        }
        
        return filtered
    }
    
    /**
     * 获取未读通知数量
     */
    static getUnreadCount(): number {
        return this.notifications.filter(n => !n.read && !n.dismissed).length
    }
    
    /**
     * 添加通知监听器
     */
    static addListener(callback: (notification: Notification) => void): void {
        this.listeners.push(callback)
    }
    
    /**
     * 移除通知监听器
     */
    static removeListener(callback: (notification: Notification) => void): void {
        this.listeners = this.listeners.filter(listener => listener !== callback)
    }
    
    /**
     * 更新通知设置
     */
    static async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
        this.settings = { ...this.getDefaultSettings(), ...this.settings, ...newSettings }
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings))
        
        logger.info('通知设置已更新', {}, 'NotificationManager')
    }
    
    /**
     * 获取通知设置
     */
    static getSettings(): NotificationSettings {
        return this.settings || this.getDefaultSettings()
    }
    
    // 私有方法
    private static async loadNotifications(): Promise<void> {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY)
            if (stored) {
                const notifications = JSON.parse(stored)
                this.notifications = notifications.map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt),
                    scheduledAt: n.scheduledAt ? new Date(n.scheduledAt) : undefined,
                    expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
                }))
            }
        } catch (error) {
            logger.error('加载通知失败', { error }, 'NotificationManager')
            this.notifications = []
        }
    }
    
    private static async saveNotifications(): Promise<void> {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications))
        } catch (error) {
            logger.error('保存通知失败', { error }, 'NotificationManager')
        }
    }
    
    private static async loadSettings(): Promise<void> {
        try {
            const stored = localStorage.getItem(this.SETTINGS_KEY)
            if (stored) {
                this.settings = { ...this.getDefaultSettings(), ...JSON.parse(stored) }
            } else {
                this.settings = this.getDefaultSettings()
            }
        } catch (error) {
            logger.error('加载通知设置失败', { error }, 'NotificationManager')
            this.settings = this.getDefaultSettings()
        }
    }
    
    private static getDefaultSettings(): NotificationSettings {
        return {
            enabled: true,
            quietHours: {
                enabled: true,
                start: '22:00',
                end: '08:00'
            },
            categories: {
                health: { enabled: true, sound: true, vibration: true, priority: 'high' },
                progress: { enabled: true, sound: true, vibration: false, priority: 'medium' },
                motivation: { enabled: true, sound: false, vibration: false, priority: 'low' },
                system: { enabled: true, sound: false, vibration: false, priority: 'low' }
            },
            frequency: {
                dailyReminders: true,
                weeklyReports: true,
                goalUpdates: true,
                achievements: true
            },
            customMessages: {
                enabled: true,
                motivational: [
                    '今天是新的开始！',
                    '每一步都是进步！',
                    '相信自己的力量！',
                    '坚持就是胜利！'
                ],
                warnings: [
                    '请注意保持平衡',
                    '建议关注健康状况',
                    '考虑调整当前习惯'
                ],
                celebrations: [
                    '太棒了！继续保持！',
                    '你做得很好！',
                    '这是一个重要的里程碑！'
                ]
            }
        }
    }
    
    private static shouldShowNotification(notification: Notification): boolean {
        const settings = this.getSettings()
        
        if (!settings.enabled) return false
        
        const categorySettings = settings.categories[notification.category]
        if (!categorySettings?.enabled) return false
        
        // 检查静音时间
        if (settings.quietHours.enabled) {
            const now = new Date()
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
            
            if (this.isInQuietHours(currentTime, settings.quietHours.start, settings.quietHours.end)) {
                return false
            }
        }
        
        return true
    }
    
    private static isInQuietHours(currentTime: string, start: string, end: string): boolean {
        const current = this.timeToMinutes(currentTime)
        const startMinutes = this.timeToMinutes(start)
        const endMinutes = this.timeToMinutes(end)
        
        if (startMinutes <= endMinutes) {
            return current >= startMinutes && current <= endMinutes
        } else {
            return current >= startMinutes || current <= endMinutes
        }
    }
    
    private static timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }
    
    private static displayNotification(notification: Notification): void {
        // 在实际应用中，这里会显示系统通知或应用内通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/icon.png',
                silent: !notification.sound
            })
        }
    }
    
    private static notifyListeners(notification: Notification): void {
        this.listeners.forEach(listener => {
            try {
                listener(notification)
            } catch (error) {
                logger.error('通知监听器执行失败', { error }, 'NotificationManager')
            }
        })
    }
    
    private static setupPeriodicTasks(): void {
        // 每小时清理过期通知
        setInterval(() => {
            this.cleanupExpiredNotifications()
        }, 60 * 60 * 1000)
        
        // 每天发送激励消息
        setInterval(() => {
            this.sendDailyMotivation()
        }, 24 * 60 * 60 * 1000)
    }
    
    private static async sendDailyMotivation(): Promise<void> {
        const settings = this.getSettings()
        if (!settings.frequency.dailyReminders || !settings.customMessages.enabled) return
        
        const messages = settings.customMessages.motivational
        if (messages.length === 0) return
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        
        await this.createNotification({
            type: 'reminder',
            title: '每日激励',
            message: randomMessage,
            category: 'motivation',
            priority: 'low',
            source: 'daily_motivation',
            tags: ['daily', 'motivation']
        })
    }
}
