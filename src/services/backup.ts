/**
 * 数据备份和同步服务
 * 提供本地备份、云端同步和数据恢复功能
 */

import type { MasturbationRecord } from '@/types/record'
import { logger } from '@/utils/logger'
import { StorageService } from './storage'

export interface BackupMetadata {
    version: string
    timestamp: number
    recordCount: number
    checksum: string
    deviceId: string
    appVersion: string
}

export interface BackupData {
    metadata: BackupMetadata
    records: MasturbationRecord[]
    settings?: any
}

export interface SyncStatus {
    lastSync: number
    status: 'synced' | 'pending' | 'error' | 'never'
    conflictCount: number
    errorMessage?: string
}

export class BackupService {
    private static readonly BACKUP_PREFIX = 'backup_'
    private static readonly MAX_LOCAL_BACKUPS = 10
    private static readonly SYNC_STATUS_KEY = 'sync_status'

    /**
     * 创建本地备份
     */
    static async createLocalBackup(description?: string): Promise<string> {
        try {
            logger.info('开始创建本地备份', { description }, 'BackupService')
            
            const records = await StorageService.getRecords()
            const timestamp = Date.now()
            const deviceId = this.getDeviceId()
            
            const metadata: BackupMetadata = {
                version: '1.0',
                timestamp,
                recordCount: records.length,
                checksum: this.calculateChecksum(records),
                deviceId,
                appVersion: '0.1.0'
            }

            const backupData: BackupData = {
                metadata,
                records,
                settings: this.getAppSettings()
            }

            const backupKey = `${this.BACKUP_PREFIX}${timestamp}`
            const backupJson = JSON.stringify(backupData)
            
            // 保存到localStorage
            localStorage.setItem(backupKey, backupJson)
            
            // 清理旧备份
            this.cleanupOldBackups()
            
            logger.info('本地备份创建成功', { 
                backupKey, 
                recordCount: records.length,
                size: backupJson.length 
            }, 'BackupService')
            
            return backupKey
        } catch (error) {
            logger.error('创建本地备份失败', { error }, 'BackupService')
            throw new Error('备份创建失败')
        }
    }

    /**
     * 获取本地备份列表
     */
    static getLocalBackups(): Array<{ key: string; metadata: BackupMetadata }> {
        const backups: Array<{ key: string; metadata: BackupMetadata }> = []
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith(this.BACKUP_PREFIX)) {
                try {
                    const backupData = JSON.parse(localStorage.getItem(key)!)
                    backups.push({
                        key,
                        metadata: backupData.metadata
                    })
                } catch (error) {
                    logger.warn('解析备份数据失败', { key, error }, 'BackupService')
                }
            }
        }
        
        return backups.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
    }

    /**
     * 恢复本地备份
     */
    static async restoreLocalBackup(backupKey: string): Promise<boolean> {
        try {
            logger.info('开始恢复本地备份', { backupKey }, 'BackupService')
            
            const backupJson = localStorage.getItem(backupKey)
            if (!backupJson) {
                throw new Error('备份不存在')
            }

            const backupData: BackupData = JSON.parse(backupJson)
            
            // 验证备份完整性
            const currentChecksum = this.calculateChecksum(backupData.records)
            if (currentChecksum !== backupData.metadata.checksum) {
                throw new Error('备份数据校验失败')
            }

            // 创建当前数据的备份
            await this.createLocalBackup('恢复前自动备份')
            
            // 恢复数据
            await this.restoreRecords(backupData.records)
            
            // 恢复设置
            if (backupData.settings) {
                this.restoreAppSettings(backupData.settings)
            }
            
            logger.info('本地备份恢复成功', { 
                backupKey, 
                recordCount: backupData.records.length 
            }, 'BackupService')
            
            return true
        } catch (error) {
            logger.error('恢复本地备份失败', { backupKey, error }, 'BackupService')
            return false
        }
    }

    /**
     * 导出备份文件
     */
    static async exportBackup(): Promise<Blob> {
        try {
            logger.info('开始导出备份文件', {}, 'BackupService')
            
            const records = await StorageService.getRecords()
            const timestamp = Date.now()
            
            const metadata: BackupMetadata = {
                version: '1.0',
                timestamp,
                recordCount: records.length,
                checksum: this.calculateChecksum(records),
                deviceId: this.getDeviceId(),
                appVersion: '0.1.0'
            }

            const backupData: BackupData = {
                metadata,
                records,
                settings: this.getAppSettings()
            }

            const backupJson = JSON.stringify(backupData, null, 2)
            const blob = new Blob([backupJson], { type: 'application/json' })
            
            logger.info('备份文件导出成功', { 
                recordCount: records.length,
                size: blob.size 
            }, 'BackupService')
            
            return blob
        } catch (error) {
            logger.error('导出备份文件失败', { error }, 'BackupService')
            throw new Error('导出失败')
        }
    }

    /**
     * 导入备份文件
     */
    static async importBackup(fileOrText: File | string): Promise<boolean> {
        let fileName = 'unknown'

        try {
            let text: string

            if (typeof fileOrText === 'string') {
                text = fileOrText
                fileName = 'text_import'
            } else {
                fileName = fileOrText.name
                text = await fileOrText.text()
                logger.info('开始导入备份文件', { fileName, size: fileOrText.size }, 'BackupService')
            }

            const backupData: BackupData = JSON.parse(text)

            // 验证备份格式
            if (!backupData.metadata || !backupData.records) {
                throw new Error('备份文件格式无效')
            }

            // 验证校验和
            const currentChecksum = this.calculateChecksum(backupData.records)
            if (currentChecksum !== backupData.metadata.checksum) {
                throw new Error('备份文件校验失败')
            }

            // 创建当前数据的备份
            await this.createLocalBackup('导入前自动备份')

            // 导入数据
            await this.restoreRecords(backupData.records)

            // 导入设置
            if (backupData.settings) {
                this.restoreAppSettings(backupData.settings)
            }

            logger.info('备份文件导入成功', {
                fileName,
                recordCount: backupData.records.length
            }, 'BackupService')

            return true
        } catch (error) {
            logger.error('导入备份文件失败', { fileName, error }, 'BackupService')
            return false
        }
    }

    /**
     * 自动备份
     */
    static async autoBackup(): Promise<void> {
        try {
            const lastBackup = this.getLastBackupTime()
            const now = Date.now()
            const backupInterval = 24 * 60 * 60 * 1000 // 24小时
            
            if (now - lastBackup > backupInterval) {
                await this.createLocalBackup('自动备份')
                localStorage.setItem('last_auto_backup', now.toString())
                logger.info('自动备份完成', {}, 'BackupService')
            }
        } catch (error) {
            logger.error('自动备份失败', { error }, 'BackupService')
        }
    }

    /**
     * 获取同步状态
     */
    static getSyncStatus(): SyncStatus {
        const stored = localStorage.getItem(this.SYNC_STATUS_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
        
        return {
            lastSync: 0,
            status: 'never',
            conflictCount: 0
        }
    }

    /**
     * 更新同步状态
     */
    static updateSyncStatus(status: Partial<SyncStatus>): void {
        const current = this.getSyncStatus()
        const updated = { ...current, ...status }
        localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(updated))
    }

    /**
     * 计算数据校验和
     */
    private static calculateChecksum(records: MasturbationRecord[]): string {
        const data = JSON.stringify(records.map(r => ({
            id: r.id,
            startTime: r.startTime.getTime(),
            duration: r.duration
        })))
        
        // 简单的哈希函数
        let hash = 0
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // 转换为32位整数
        }
        
        return hash.toString(36)
    }

    /**
     * 获取设备ID
     */
    private static getDeviceId(): string {
        let deviceId = localStorage.getItem('device_id')
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9)
            localStorage.setItem('device_id', deviceId)
        }
        return deviceId
    }

    /**
     * 获取应用设置
     */
    private static getAppSettings(): any {
        const settings: any = {}
        
        // 收集相关设置
        const settingsKeys = ['theme', 'language', 'notifications', 'privacy_mode']
        settingsKeys.forEach(key => {
            const value = localStorage.getItem(key)
            if (value) {
                settings[key] = value
            }
        })
        
        return settings
    }

    /**
     * 恢复应用设置
     */
    private static restoreAppSettings(settings: any): void {
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === 'string') {
                localStorage.setItem(key, value)
            }
        })
    }

    /**
     * 恢复记录数据
     */
    private static async restoreRecords(records: MasturbationRecord[]): Promise<void> {
        // 清空现有数据
        localStorage.removeItem('masturbation_records')
        
        // 批量保存记录
        for (const record of records) {
            await StorageService.saveRecord(record)
        }
    }

    /**
     * 获取最后备份时间
     */
    private static getLastBackupTime(): number {
        const stored = localStorage.getItem('last_auto_backup')
        return stored ? parseInt(stored) : 0
    }

    /**
     * 清理旧备份
     */
    private static cleanupOldBackups(): void {
        const backups = this.getLocalBackups()
        
        if (backups.length > this.MAX_LOCAL_BACKUPS) {
            const toDelete = backups.slice(this.MAX_LOCAL_BACKUPS)
            toDelete.forEach(backup => {
                localStorage.removeItem(backup.key)
                logger.debug('删除旧备份', { key: backup.key }, 'BackupService')
            })
        }
    }

    /**
     * 删除备份
     */
    static deleteBackup(backupKey: string): boolean {
        try {
            localStorage.removeItem(backupKey)
            logger.info('备份已删除', { backupKey }, 'BackupService')
            return true
        } catch (error) {
            logger.error('删除备份失败', { backupKey, error }, 'BackupService')
            return false
        }
    }

    /**
     * 获取备份大小统计
     */
    static getBackupStats(): { totalSize: number; backupCount: number; oldestBackup: number } {
        const backups = this.getLocalBackups()
        let totalSize = 0

        backups.forEach(backup => {
            const data = localStorage.getItem(backup.key)
            if (data) {
                totalSize += data.length
            }
        })

        return {
            totalSize,
            backupCount: backups.length,
            oldestBackup: backups.length > 0 ? backups[backups.length - 1].metadata.timestamp : 0
        }
    }

    /**
     * 获取备份信息
     */
    static async getBackupInfo(): Promise<{ lastBackup: number | null; backupCount: number }> {
        try {
            const backups = this.getLocalBackups()
            const lastBackup = backups.length > 0 ? backups[0].metadata.timestamp : null

            return {
                lastBackup,
                backupCount: backups.length
            }
        } catch (error) {
            logger.error('获取备份信息失败', { error }, 'BackupService')
            return {
                lastBackup: null,
                backupCount: 0
            }
        }
    }
}
