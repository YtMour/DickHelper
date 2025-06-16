/**
 * 数据验证工具
 * 提供类型安全的数据验证和转换功能
 */

import type { MasturbationRecord, MoodLevel, EnergyLevel } from '@/types/record'
import { logger } from './logger'

export class ValidationError extends Error {
    constructor(message: string, public field?: string, public value?: any) {
        super(message)
        this.name = 'ValidationError'
    }
}

/**
 * 验证心情评分
 */
export function validateMood(value: any): value is MoodLevel {
    return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value)
}

/**
 * 验证精力评分
 */
export function validateEnergy(value: any): value is EnergyLevel {
    return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value)
}

/**
 * 验证时长（秒）
 */
export function validateDuration(value: any): value is number {
    return typeof value === 'number' && value >= 0 && Number.isFinite(value)
}

/**
 * 验证日期
 */
export function validateDate(value: any): value is Date {
    if (value instanceof Date) {
        return !isNaN(value.getTime())
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value)
        return !isNaN(date.getTime())
    }
    return false
}

/**
 * 验证UUID
 */
export function validateUUID(value: any): value is string {
    if (typeof value !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
}

/**
 * 验证标签数组
 */
export function validateTags(value: any): value is string[] {
    if (!Array.isArray(value)) return false
    return value.every(tag => typeof tag === 'string' && tag.trim().length > 0)
}

/**
 * 清理和验证字符串
 */
export function sanitizeString(value: any, maxLength = 1000): string | undefined {
    if (value === null || value === undefined) return undefined
    if (typeof value !== 'string') return undefined
    
    const cleaned = value.trim()
    if (cleaned.length === 0) return undefined
    if (cleaned.length > maxLength) {
        logger.warn('字符串超过最大长度，已截断', { original: cleaned.length, max: maxLength })
        return cleaned.substring(0, maxLength)
    }
    
    return cleaned
}

/**
 * 验证完整的记录对象
 */
export function validateRecord(data: any): MasturbationRecord {
    const errors: string[] = []

    // 验证必需字段
    if (!validateUUID(data.id)) {
        errors.push('无效的记录ID')
    }

    if (!validateDate(data.startTime)) {
        errors.push('无效的开始时间')
    }

    if (!validateDuration(data.duration)) {
        errors.push('无效的时长')
    }

    // 验证可选字段
    if (data.endTime !== undefined && !validateDate(data.endTime)) {
        errors.push('无效的结束时间')
    }

    if (data.mood !== undefined && !validateMood(data.mood)) {
        errors.push('无效的心情评分（应为1-5的整数）')
    }

    if (data.energy !== undefined && !validateEnergy(data.energy)) {
        errors.push('无效的精力评分（应为1-5的整数）')
    }

    if (data.tags !== undefined && !validateTags(data.tags)) {
        errors.push('无效的标签格式')
    }

    if (errors.length > 0) {
        throw new ValidationError(`记录验证失败: ${errors.join(', ')}`, undefined, data)
    }

    // 构建验证后的记录对象
    const record: MasturbationRecord = {
        id: data.id,
        startTime: new Date(data.startTime),
        duration: data.duration,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        mood: data.mood,
        energy: data.energy,
        notes: sanitizeString(data.notes),
        tags: data.tags?.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0),
        location: sanitizeString(data.location, 100),
        isPrivate: Boolean(data.isPrivate)
    }

    // 业务逻辑验证
    if (record.endTime && record.startTime >= record.endTime) {
        throw new ValidationError('结束时间不能早于或等于开始时间')
    }

    if (record.duration > 86400) { // 24小时
        logger.warn('记录时长超过24小时，可能存在异常', { duration: record.duration, id: record.id })
    }

    return record
}

/**
 * 验证记录数组
 */
export function validateRecords(data: any): MasturbationRecord[] {
    if (!Array.isArray(data)) {
        throw new ValidationError('数据必须是数组格式')
    }

    const validRecords: MasturbationRecord[] = []
    const errors: string[] = []

    data.forEach((item, index) => {
        try {
            const record = validateRecord(item)
            validRecords.push(record)
        } catch (error) {
            const message = error instanceof ValidationError ? error.message : '未知验证错误'
            errors.push(`记录 ${index + 1}: ${message}`)
            logger.error('记录验证失败', { index, item, error })
        }
    })

    if (errors.length > 0) {
        throw new ValidationError(`批量验证失败:\n${errors.join('\n')}`)
    }

    return validRecords
}

/**
 * 数据清理工具
 */
export class DataCleaner {
    /**
     * 清理重复记录
     */
    static removeDuplicates(records: MasturbationRecord[]): MasturbationRecord[] {
        const seen = new Set<string>()
        return records.filter(record => {
            if (seen.has(record.id)) {
                logger.warn('发现重复记录，已移除', { id: record.id })
                return false
            }
            seen.add(record.id)
            return true
        })
    }

    /**
     * 按时间排序
     */
    static sortByTime(records: MasturbationRecord[], ascending = false): MasturbationRecord[] {
        return [...records].sort((a, b) => {
            const timeA = a.startTime.getTime()
            const timeB = b.startTime.getTime()
            return ascending ? timeA - timeB : timeB - timeA
        })
    }

    /**
     * 清理异常数据
     */
    static cleanAnomalies(records: MasturbationRecord[]): MasturbationRecord[] {
        const now = new Date()
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        // const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

        return records.filter(record => {
            // 移除未来时间的记录
            if (record.startTime > now) {
                logger.warn('移除未来时间的记录', { id: record.id, startTime: record.startTime })
                return false
            }

            // 移除过于久远的记录（超过1年）
            if (record.startTime < oneYearAgo) {
                logger.info('移除过于久远的记录', { id: record.id, startTime: record.startTime })
                return false
            }

            // 移除异常时长的记录（超过24小时）
            if (record.duration > 86400) {
                logger.warn('移除异常时长的记录', { id: record.id, duration: record.duration })
                return false
            }

            return true
        })
    }
}
