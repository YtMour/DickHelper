/**
 * 日志管理系统
 * 提供统一的日志记录、错误处理和性能监控
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: Date
    level: LogLevel
    message: string
    data?: any
    stack?: string
    component?: string
}

class Logger {
    private static instance: Logger
    private logs: LogEntry[] = []
    private maxLogs = 1000
    private currentLevel = LogLevel.INFO

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger()
        }
        return Logger.instance
    }

    private constructor() {
        // 从localStorage恢复日志级别设置
        const savedLevel = localStorage.getItem('log_level')
        if (savedLevel) {
            this.currentLevel = parseInt(savedLevel)
        }
    }

    setLevel(level: LogLevel): void {
        this.currentLevel = level
        localStorage.setItem('log_level', level.toString())
    }

    private log(level: LogLevel, message: string, data?: any, component?: string): void {
        if (level < this.currentLevel) return

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            data,
            component,
            stack: level === LogLevel.ERROR ? new Error().stack : undefined
        }

        this.logs.push(entry)
        
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
        }

        // 控制台输出
        this.consoleOutput(entry)
    }

    private consoleOutput(entry: LogEntry): void {
        const prefix = `[${entry.timestamp.toISOString()}] ${entry.component || 'APP'}`
        
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(prefix, entry.message, entry.data)
                break
            case LogLevel.INFO:
                console.info(prefix, entry.message, entry.data)
                break
            case LogLevel.WARN:
                console.warn(prefix, entry.message, entry.data)
                break
            case LogLevel.ERROR:
                console.error(prefix, entry.message, entry.data, entry.stack)
                break
        }
    }

    debug(message: string, data?: any, component?: string): void {
        this.log(LogLevel.DEBUG, message, data, component)
    }

    info(message: string, data?: any, component?: string): void {
        this.log(LogLevel.INFO, message, data, component)
    }

    warn(message: string, data?: any, component?: string): void {
        this.log(LogLevel.WARN, message, data, component)
    }

    error(message: string, data?: any, component?: string): void {
        this.log(LogLevel.ERROR, message, data, component)
    }

    getLogs(level?: LogLevel): LogEntry[] {
        if (level !== undefined) {
            return this.logs.filter(log => log.level >= level)
        }
        return [...this.logs]
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2)
    }

    clearLogs(): void {
        this.logs = []
    }
}

// 导出单例实例
export const logger = Logger.getInstance()

/**
 * 错误处理装饰器
 */
export function handleErrors(component: string) {
    return function (_target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value

        descriptor.value = async function (...args: any[]) {
            try {
                const result = await method.apply(this, args)
                logger.debug(`${propertyName} 执行成功`, { args }, component)
                return result
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '未知错误'
                logger.error(`${propertyName} 执行失败: ${errorMessage}`, { args, error }, component)
                throw error
            }
        }
    }
}

/**
 * 性能监控装饰器
 */
export function measurePerformance(component: string) {
    return function (_target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value

        descriptor.value = async function (...args: any[]) {
            const startTime = performance.now()
            try {
                const result = await method.apply(this, args)
                const endTime = performance.now()
                const duration = endTime - startTime
                
                if (duration > 100) { // 超过100ms记录警告
                    logger.warn(`${propertyName} 执行耗时较长: ${duration.toFixed(2)}ms`, { args }, component)
                } else {
                    logger.debug(`${propertyName} 执行耗时: ${duration.toFixed(2)}ms`, { args }, component)
                }
                
                return result
            } catch (error) {
                const endTime = performance.now()
                const duration = endTime - startTime
                logger.error(`${propertyName} 执行失败，耗时: ${duration.toFixed(2)}ms`, { args, error }, component)
                throw error
            }
        }
    }
}

/**
 * 全局错误处理
 */
export function setupGlobalErrorHandling(): void {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
        logger.error('未处理的Promise拒绝', {
            reason: event.reason,
            promise: event.promise
        }, 'GLOBAL')
        event.preventDefault()
    })

    // 捕获全局错误
    window.addEventListener('error', (event) => {
        logger.error('全局错误', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        }, 'GLOBAL')
    })
}
