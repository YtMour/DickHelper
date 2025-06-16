/**
 * 缓存管理系统
 * 提供内存缓存、持久化缓存和缓存策略管理
 */

import { logger } from './logger'

export interface CacheItem<T> {
    data: T
    timestamp: number
    ttl: number // 生存时间（毫秒）
    hits: number // 命中次数
}

export interface CacheStats {
    totalItems: number
    totalHits: number
    totalMisses: number
    hitRate: number
    memoryUsage: number
}

class CacheManager {
    private static instance: CacheManager
    private cache = new Map<string, CacheItem<any>>()
    private stats = {
        hits: 0,
        misses: 0
    }

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager()
        }
        return CacheManager.instance
    }

    private constructor() {
        // 定期清理过期缓存
        setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
    }

    /**
     * 设置缓存
     */
    set<T>(key: string, data: T, ttl = 300000): void { // 默认5分钟
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            hits: 0
        }
        
        this.cache.set(key, item)
        logger.debug('缓存已设置', { key, ttl }, 'CACHE')
    }

    /**
     * 获取缓存
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key)
        
        if (!item) {
            this.stats.misses++
            logger.debug('缓存未命中', { key }, 'CACHE')
            return null
        }

        // 检查是否过期
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key)
            this.stats.misses++
            logger.debug('缓存已过期', { key }, 'CACHE')
            return null
        }

        item.hits++
        this.stats.hits++
        logger.debug('缓存命中', { key, hits: item.hits }, 'CACHE')
        return item.data
    }

    /**
     * 删除缓存
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key)
        if (deleted) {
            logger.debug('缓存已删除', { key }, 'CACHE')
        }
        return deleted
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear()
        this.stats.hits = 0
        this.stats.misses = 0
        logger.info('所有缓存已清空', {}, 'CACHE')
    }

    /**
     * 清理过期缓存
     */
    private cleanup(): void {
        const now = Date.now()
        let cleanedCount = 0

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key)
                cleanedCount++
            }
        }

        if (cleanedCount > 0) {
            logger.debug('清理过期缓存', { cleanedCount }, 'CACHE')
        }
    }

    /**
     * 获取缓存统计
     */
    getStats(): CacheStats {
        const totalRequests = this.stats.hits + this.stats.misses
        return {
            totalItems: this.cache.size,
            totalHits: this.stats.hits,
            totalMisses: this.stats.misses,
            hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
            memoryUsage: this.estimateMemoryUsage()
        }
    }

    /**
     * 估算内存使用量（字节）
     */
    private estimateMemoryUsage(): number {
        let size = 0
        for (const [key, item] of this.cache.entries()) {
            size += key.length * 2 // 字符串按UTF-16计算
            size += JSON.stringify(item.data).length * 2
            size += 32 // 元数据大小估算
        }
        return size
    }

    /**
     * 获取热点数据（访问次数最多的缓存项）
     */
    getHotData(limit = 10): Array<{ key: string; hits: number }> {
        return Array.from(this.cache.entries())
            .map(([key, item]) => ({ key, hits: item.hits }))
            .sort((a, b) => b.hits - a.hits)
            .slice(0, limit)
    }
}

// 导出单例实例
export const cache = CacheManager.getInstance()

/**
 * 缓存装饰器
 */
export function cached(ttl = 300000, keyGenerator?: (...args: any[]) => string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value

        descriptor.value = async function (...args: any[]) {
            // 生成缓存键
            const cacheKey = keyGenerator 
                ? keyGenerator(...args)
                : `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`

            // 尝试从缓存获取
            const cached = cache.get(cacheKey)
            if (cached !== null) {
                return cached
            }

            // 执行原方法
            const result = await method.apply(this, args)
            
            // 缓存结果
            cache.set(cacheKey, result, ttl)
            
            return result
        }
    }
}

/**
 * 智能缓存策略
 */
export class SmartCache {
    private static readonly STATS_CACHE_KEY = 'stats_cache'
    private static readonly RECORDS_CACHE_KEY = 'records_cache'

    /**
     * 缓存统计数据
     */
    static cacheStats(data: any): void {
        cache.set(this.STATS_CACHE_KEY, data, 60000) // 1分钟缓存
    }

    /**
     * 获取缓存的统计数据
     */
    static getCachedStats(): any | null {
        return cache.get(this.STATS_CACHE_KEY)
    }

    /**
     * 缓存记录数据
     */
    static cacheRecords(data: any[]): void {
        cache.set(this.RECORDS_CACHE_KEY, data, 300000) // 5分钟缓存
    }

    /**
     * 获取缓存的记录数据
     */
    static getCachedRecords(): any[] | null {
        return cache.get(this.RECORDS_CACHE_KEY)
    }

    /**
     * 清除相关缓存
     */
    static invalidateRecordCaches(): void {
        cache.delete(this.STATS_CACHE_KEY)
        cache.delete(this.RECORDS_CACHE_KEY)
        logger.info('记录相关缓存已失效', {}, 'SMART_CACHE')
    }

    /**
     * 预热缓存
     */
    static async warmup(dataLoader: () => Promise<any[]>): Promise<void> {
        try {
            logger.info('开始预热缓存', {}, 'SMART_CACHE')
            const data = await dataLoader()
            this.cacheRecords(data)
            logger.info('缓存预热完成', { recordCount: data.length }, 'SMART_CACHE')
        } catch (error) {
            logger.error('缓存预热失败', { error }, 'SMART_CACHE')
        }
    }
}

/**
 * 持久化缓存（使用localStorage）
 */
export class PersistentCache {
    private static readonly PREFIX = 'app_cache_'

    /**
     * 设置持久化缓存
     */
    static set(key: string, data: any, ttl = 86400000): void { // 默认24小时
        const item = {
            data,
            timestamp: Date.now(),
            ttl
        }
        
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(item))
            logger.debug('持久化缓存已设置', { key, ttl }, 'PERSISTENT_CACHE')
        } catch (error) {
            logger.error('设置持久化缓存失败', { key, error }, 'PERSISTENT_CACHE')
        }
    }

    /**
     * 获取持久化缓存
     */
    static get<T>(key: string): T | null {
        try {
            const stored = localStorage.getItem(this.PREFIX + key)
            if (!stored) return null

            const item = JSON.parse(stored)
            
            // 检查是否过期
            if (Date.now() - item.timestamp > item.ttl) {
                this.delete(key)
                return null
            }

            return item.data
        } catch (error) {
            logger.error('获取持久化缓存失败', { key, error }, 'PERSISTENT_CACHE')
            return null
        }
    }

    /**
     * 删除持久化缓存
     */
    static delete(key: string): void {
        localStorage.removeItem(this.PREFIX + key)
        logger.debug('持久化缓存已删除', { key }, 'PERSISTENT_CACHE')
    }

    /**
     * 清理所有持久化缓存
     */
    static clear(): void {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX))
        keys.forEach(key => localStorage.removeItem(key))
        logger.info('所有持久化缓存已清空', { count: keys.length }, 'PERSISTENT_CACHE')
    }
}
