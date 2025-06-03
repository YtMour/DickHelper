import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MasturbationRecord, MasturbationStats, RecordFilter } from '../types/record'
import { StorageService } from '../services/storage'

export const useRecordStore = defineStore('record', () => {
    const records = ref<MasturbationRecord[]>([])
    const stats = ref<MasturbationStats | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const currentFilter = ref<RecordFilter>({})

    // 计算属性：过滤后的记录
    const filteredRecords = computed(() => {
        return records.value.filter(record => {
            if (currentFilter.value.startDate && new Date(record.startTime) < currentFilter.value.startDate) return false
            if (currentFilter.value.endDate && new Date(record.startTime) > currentFilter.value.endDate) return false
            if (currentFilter.value.minDuration && record.duration < currentFilter.value.minDuration) return false
            if (currentFilter.value.maxDuration && record.duration > currentFilter.value.maxDuration) return false
            if (currentFilter.value.mood && record.mood !== currentFilter.value.mood) return false
            if (currentFilter.value.energy && record.energy !== currentFilter.value.energy) return false
            if (currentFilter.value.location && record.location !== currentFilter.value.location) return false
            if (currentFilter.value.tags?.length) {
                return currentFilter.value.tags.every(tag => record.tags?.includes(tag))
            }
            return true
        })
    })

    // 初始化数据
    async function initializeStore() {
        loading.value = true
        error.value = null
        try {
            records.value = await StorageService.getRecords()
            await updateStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '加载数据失败'
        } finally {
            loading.value = false
        }
    }

    // 更新统计数据
    async function updateStats() {
        try {
            stats.value = await StorageService.getStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '更新统计数据失败'
        }
    }

    // 添加记录
    async function addRecord(record: MasturbationRecord) {
        loading.value = true
        error.value = null
        try {
            await StorageService.saveRecord(record)
            records.value = await StorageService.getRecords()
            await updateStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '添加记录失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 更新记录
    async function updateRecord(id: string, updates: Partial<MasturbationRecord>) {
        loading.value = true
        error.value = null
        try {
            await StorageService.updateRecord(id, updates)
            records.value = await StorageService.getRecords()
            await updateStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '更新记录失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 删除记录
    async function deleteRecord(id: string) {
        loading.value = true
        error.value = null
        try {
            await StorageService.deleteRecord(id)
            records.value = await StorageService.getRecords()
            await updateStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '删除记录失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 批量删除记录
    async function deleteRecords(ids: string[]) {
        loading.value = true
        error.value = null
        try {
            await Promise.all(ids.map(id => StorageService.deleteRecord(id)))
            records.value = await StorageService.getRecords()
            await updateStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '批量删除记录失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 设置过滤器
    function setFilter(filter: RecordFilter) {
        currentFilter.value = filter
    }

    // 清除过滤器
    function clearFilter() {
        currentFilter.value = {}
    }

    // 导出数据
    async function exportData(): Promise<string> {
        try {
            return await StorageService.exportData()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '导出数据失败'
            throw e
        }
    }

    // 导入数据
    async function importData(jsonData: string): Promise<boolean> {
        loading.value = true
        error.value = null
        try {
            const success = await StorageService.importData(jsonData)
            if (success) {
                records.value = await StorageService.getRecords()
                await updateStats()
            }
            return success
        } catch (e) {
            error.value = e instanceof Error ? e.message : '导入数据失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 备份数据
    async function backupData(): Promise<void> {
        loading.value = true
        error.value = null
        try {
            await StorageService.backupData()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '备份数据失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    // 恢复数据
    async function restoreData(): Promise<void> {
        loading.value = true
        error.value = null
        try {
            await StorageService.restoreData()
            records.value = await StorageService.getRecords()
            await updateStats()
        } catch (e) {
            error.value = e instanceof Error ? e.message : '恢复数据失败'
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        records,
        filteredRecords,
        stats,
        loading,
        error,
        currentFilter,
        initializeStore,
        addRecord,
        updateRecord,
        deleteRecord,
        deleteRecords,
        setFilter,
        clearFilter,
        exportData,
        importData,
        backupData,
        restoreData
    }
})