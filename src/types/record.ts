export interface MasturbationRecord {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    notes?: string;
    mood?: number; // 1-5 表示心情
    energy?: number; // 1-5 表示精力
    tags?: string[]; // 标签
    location?: string; // 位置
    isPrivate?: boolean; // 是否为私密记录
}

export interface MasturbationStats {
    totalCount: number;
    averageDuration: number;
    frequencyPerWeek: number;
    frequencyPerMonth: number;
    longestDuration: number;
    shortestDuration: number;
    mostActiveTime: {
        hour: number;
        count: number;
    };
    mostActiveDayOfWeek: {
        day: number; // 0-6, 0 表示周日
        count: number;
    };
    averageMood?: number;
    averageEnergy?: number;
    commonTags?: Array<{
        tag: string;
        count: number;
    }>;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface RecordFilter {
    startDate?: Date;
    endDate?: Date;
    minDuration?: number;
    maxDuration?: number;
    mood?: MoodLevel;
    energy?: EnergyLevel;
    tags?: string[];
    location?: string;
} 