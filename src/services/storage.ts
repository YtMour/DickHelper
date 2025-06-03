import type { MasturbationRecord, MasturbationStats } from '../types/record'
import CryptoJS from 'crypto-js'

const STORAGE_KEY = 'masturbation_records'
const BACKUP_KEY = 'masturbation_records_backup'
const ENCRYPTION_KEY = 'your-secret-key' // 建议使用环境变量

export class StorageService {
    private static encrypt(data: string): string {
        return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
    }

    private static decrypt(encryptedData: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
        return bytes.toString(CryptoJS.enc.Utf8)
    }

    static async exportData(): Promise<string> {
        const records = await this.getRecords()
        return this.encrypt(JSON.stringify(records, null, 2))
    }

    static async importData(jsonData: string): Promise<boolean> {
        try {
            const decryptedData = this.decrypt(jsonData)
            const records = JSON.parse(decryptedData)
            if (!Array.isArray(records)) return false
            
            // 验证数据格式
            const isValid = records.every(record => 
                typeof record.id === 'string' &&
                record.startTime &&
                typeof record.duration === 'number'
            )
            
            if (!isValid) return false
            
            // 转换日期格式
            const formattedRecords = records.map(record => ({
                ...record,
                startTime: new Date(record.startTime),
                endTime: record.endTime ? new Date(record.endTime) : undefined
            }))
            
            await this.setRecords(formattedRecords)
            return true
        } catch (error) {
            return false
        }
    }

    static async saveRecord(record: MasturbationRecord): Promise<void> {
        const records = await this.getRecords()
        records.push(record)
        await this.setRecords(records)
    }

    static async updateRecord(id: string, updates: Partial<MasturbationRecord>): Promise<void> {
        const records = await this.getRecords()
        const index = records.findIndex(record => record.id === id)
        if (index === -1) throw new Error('记录不存在')
        
        records[index] = {
            ...records[index],
            ...updates,
            startTime: updates.startTime ? new Date(updates.startTime) : records[index].startTime,
            endTime: updates.endTime ? new Date(updates.endTime) : records[index].endTime
        }
        
        await this.setRecords(records)
    }

    static async getRecords(): Promise<MasturbationRecord[]> {
        const encryptedData = localStorage.getItem(STORAGE_KEY)
        if (!encryptedData) return []
        
        const decryptedData = this.decrypt(encryptedData)
        return JSON.parse(decryptedData).map((record: any) => ({
            ...record,
            startTime: new Date(record.startTime),
            endTime: record.endTime ? new Date(record.endTime) : undefined
        }))
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