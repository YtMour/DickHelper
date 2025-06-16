import type { MasturbationRecord, MasturbationStats } from '../types/record'
import CryptoJS from 'crypto-js'
import { logger } from '../utils/logger'
import { validateRecord, validateRecords, DataCleaner } from '../utils/validation'
import { SmartCache } from '../utils/cache'

const STORAGE_KEY = 'masturbation_records'
const BACKUP_KEY = 'masturbation_records_backup'

// 安全的密钥管理
class SecurityManager {
    private static getEncryptionKey(): string {
        // 在浏览器环境中，不使用process.env
        // 直接使用设备唯一密钥
        let deviceKey = localStorage.getItem('device_encryption_key')
        if (!deviceKey) {
            deviceKey = this.generateDeviceKey()
            localStorage.setItem('device_encryption_key', deviceKey)
        }
        return deviceKey
    }

    private static generateDeviceKey(): string {
        const userAgent = navigator.userAgent
        const timestamp = Date.now().toString()
        const random = Math.random().toString(36)
        return CryptoJS.SHA256(userAgent + timestamp + random).toString()
    }

    static encrypt(data: string): string {
        return CryptoJS.AES.encrypt(data, this.getEncryptionKey()).toString()
    }

    static decrypt(encryptedData: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedData, this.getEncryptionKey())
        return bytes.toString(CryptoJS.enc.Utf8)
    }
}

export class StorageService {
    private static encrypt(data: string): string {
        return SecurityManager.encrypt(data)
    }

    private static decrypt(encryptedData: string): string {
        return SecurityManager.decrypt(encryptedData)
    }

    static async exportData(): Promise<string> {
        const startTime = performance.now()
        try {
            logger.info('开始导出数据', {}, 'StorageService')
            const records = await this.getRecords()
            const exportData = this.encrypt(JSON.stringify(records, null, 2))
            const duration = performance.now() - startTime
            logger.info('数据导出完成', { recordCount: records.length, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
            return exportData
        } catch (error) {
            const duration = performance.now() - startTime
            logger.error('数据导出失败', { error, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
            throw error
        }
    }

    static async importData(jsonData: string): Promise<boolean> {
        logger.info('开始导入数据', {}, 'StorageService')

        try {
            const decryptedData = this.decrypt(jsonData)
            const rawRecords = JSON.parse(decryptedData)

            // 使用新的验证系统
            const validatedRecords = validateRecords(rawRecords)

            // 数据清理
            const cleanedRecords = DataCleaner.removeDuplicates(validatedRecords)
            const finalRecords = DataCleaner.cleanAnomalies(cleanedRecords)

            await this.setRecords(finalRecords)

            // 清除缓存
            SmartCache.invalidateRecordCaches()

            logger.info('数据导入完成', {
                originalCount: rawRecords.length,
                validCount: validatedRecords.length,
                finalCount: finalRecords.length
            }, 'StorageService')

            return true
        } catch (error) {
            logger.error('数据导入失败', { error }, 'StorageService')
            return false
        }
    }

    static async saveRecord(record: MasturbationRecord): Promise<void> {
        const startTime = performance.now()
        try {
            logger.debug('保存记录', { id: record.id }, 'StorageService')

            // 验证记录
            const validatedRecord = validateRecord(record)

            const records = await this.getRecords()
            records.push(validatedRecord)

            // 排序并去重
            const cleanedRecords = DataCleaner.removeDuplicates(records)
            const sortedRecords = DataCleaner.sortByTime(cleanedRecords)

            await this.setRecords(sortedRecords)

            // 清除缓存
            SmartCache.invalidateRecordCaches()

            const duration = performance.now() - startTime
            logger.debug('记录保存完成', { id: record.id, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
        } catch (error) {
            const duration = performance.now() - startTime
            logger.error('记录保存失败', { id: record.id, error, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
            throw error
        }
    }

    static async updateRecord(id: string, updates: Partial<MasturbationRecord>): Promise<void> {
        const startTime = performance.now()
        try {
            logger.debug('更新记录', { id, updates }, 'StorageService')

            const records = await this.getRecords()
            const index = records.findIndex(record => record.id === id)
            if (index === -1) {
                throw new Error(`记录不存在: ${id}`)
            }

            // 合并更新数据
            const updatedRecord = {
                ...records[index],
                ...updates,
                startTime: updates.startTime ? new Date(updates.startTime) : records[index].startTime,
                endTime: updates.endTime ? new Date(updates.endTime) : records[index].endTime
            }

            // 验证更新后的记录
            records[index] = validateRecord(updatedRecord)

            await this.setRecords(records)

            // 清除缓存
            SmartCache.invalidateRecordCaches()

            const duration = performance.now() - startTime
            logger.debug('记录更新完成', { id, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
        } catch (error) {
            const duration = performance.now() - startTime
            logger.error('记录更新失败', { id, error, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
            throw error
        }
    }

    static async getRecords(): Promise<MasturbationRecord[]> {
        const startTime = performance.now()
        try {
            // 尝试从缓存获取
            const cachedRecords = SmartCache.getCachedRecords()
            if (cachedRecords) {
                logger.debug('从缓存获取记录', { count: cachedRecords.length }, 'StorageService')
                return cachedRecords
            }

            const encryptedData = localStorage.getItem(STORAGE_KEY)
            if (!encryptedData) {
                logger.debug('未找到存储数据，返回空数组', {}, 'StorageService')
                return []
            }

            const decryptedData = this.decrypt(encryptedData)
            const rawRecords = JSON.parse(decryptedData)

            // 验证和清理数据
            const validatedRecords = validateRecords(rawRecords)
            const cleanedRecords = DataCleaner.cleanAnomalies(validatedRecords)
            const sortedRecords = DataCleaner.sortByTime(cleanedRecords)

            // 缓存结果
            SmartCache.cacheRecords(sortedRecords)

            const duration = performance.now() - startTime
            logger.debug('记录加载完成', {
                count: sortedRecords.length,
                duration: `${duration.toFixed(2)}ms`
            }, 'StorageService')

            return sortedRecords
        } catch (error) {
            const duration = performance.now() - startTime
            logger.error('记录加载失败', { error, duration: `${duration.toFixed(2)}ms` }, 'StorageService')
            return []
        }
    }

    private static async setRecords(records: MasturbationRecord[]): Promise<void> {
        const encryptedData = this.encrypt(JSON.stringify(records))
        localStorage.setItem(STORAGE_KEY, encryptedData)
    }

    static async getStats(): Promise<MasturbationStats> {
        const records = await this.getRecords()
        const now = new Date()
        
        // 计算本周开始时间（过去7天）
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        // 计算本月开始时间（当月1号）
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const totalCount = records.length
        const totalDuration = records.reduce((sum, record) => sum + record.duration, 0)
        const recordsLastWeek = records.filter(record => record.startTime >= oneWeekAgo)
        const recordsCurrentMonth = records.filter(record => record.startTime >= currentMonthStart)

        // 计算更多统计数据
        const durations = records.map(record => record.duration)
        const longestDuration = Math.max(...(durations.length ? durations : [0]))
        const shortestDuration = Math.min(...(durations.length ? durations : [0]))

        // 计算最活跃时间
        const hourCounts = new Array(24).fill(0)
        records.forEach(record => {
            const hour = new Date(record.startTime).getHours()
            hourCounts[hour]++
        })
        const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

        // 计算最活跃星期
        const dayCounts = new Array(7).fill(0)
        records.forEach(record => {
            const day = new Date(record.startTime).getDay()
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
            averageDuration: totalCount > 0 ? totalDuration / totalCount : 0,
            frequencyPerWeek: recordsLastWeek.length,
            frequencyPerMonth: recordsCurrentMonth.length,
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

    static async deleteRecord(id: string): Promise<void> {
        const records = await this.getRecords()
        const filteredRecords = records.filter(record => record.id !== id)
        await this.setRecords(filteredRecords)
    }

    static async backupData(): Promise<void> {
        const records = await this.getRecords()
        localStorage.setItem(BACKUP_KEY, JSON.stringify(records))
    }

    static async restoreData(): Promise<void> {
        const backup = localStorage.getItem(BACKUP_KEY)
        if (!backup) throw new Error('没有可用的备份数据')
        
        const records = JSON.parse(backup)
        await this.setRecords(records.map((record: any) => ({
            ...record,
            startTime: new Date(record.startTime),
            endTime: record.endTime ? new Date(record.endTime) : undefined
        })))
    }
} 