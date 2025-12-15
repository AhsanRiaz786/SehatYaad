import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, getDatabase } from '../database/init';

export interface AdherenceStats {
    overall: number;          // Overall adherence % over selected period
    weeklyAverage: number;    // Last 7 days average
    monthlyAverage: number;   // This month's average (currently same as overall window)
    trend: 'up' | 'down' | 'stable';
    streakDays: number;       // Current streak
    longestStreak: number;    // Best streak ever
    missedDoses: number;      // Total missed doses in selected period
    bestDay?: {
        date: string;
        percentage: number;
    };
    worstDay?: {
        date: string;
        percentage: number;
    };
}

export interface MedicationStats {
    medicationId: number;
    name: string;
    adherence: number;        // %
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    skippedDoses: number;
}

export interface DailyAdherence {
    date: string;             // YYYY-MM-DD
    percentage: number;
    taken: number;
    total: number;
    missed: number;
}

export interface TimeBlockStats {
    morning: number;
    noon: number;
    evening: number;
    night: number;
}

/**
 * Calculate overall adherence statistics for a given time period
 */
export async function getAdherenceStats(days: number = 30): Promise<AdherenceStats> {
    try {
        const db = await getDatabase();
        const now = Math.floor(Date.now() / 1000);
        const startTime = now - (days * 24 * 60 * 60);

        // Get overall stats
        const overallResult = await db.getFirstAsync<{ taken: number; total: number; missed: number }>(
            `SELECT 
        COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
        COUNT(*) as total
      FROM doses
      WHERE scheduled_time >= ? AND scheduled_time <= ?`,
            [startTime, now]
        );

        const overall = overallResult?.total
            ? Math.round((overallResult.taken / overallResult.total) * 100)
            : 0;
        const missedDoses = overallResult?.missed ?? 0;

        // Get weekly stats (last 7 days)
        const weekStart = now - (7 * 24 * 60 * 60);
        const weekResult = await db.getFirstAsync<{ taken: number; total: number }>(
            `SELECT 
        COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
        COUNT(*) as total
      FROM doses
      WHERE scheduled_time >= ? AND scheduled_time <= ?`,
            [weekStart, now]
        );

        const weeklyAverage = weekResult?.total
            ? Math.round((weekResult.taken / weekResult.total) * 100)
            : 0;

        // Get previous week for trend
        const prevWeekStart = weekStart - (7 * 24 * 60 * 60);
        const prevWeekResult = await db.getFirstAsync<{ taken: number; total: number }>(
            `SELECT 
        COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
        COUNT(*) as total
      FROM doses
      WHERE scheduled_time >= ? AND scheduled_time < ?`,
            [prevWeekStart, weekStart]
        );

        const prevWeekAvg = prevWeekResult?.total
            ? Math.round((prevWeekResult.taken / prevWeekResult.total) * 100)
            : 0;

        const trend = weeklyAverage > prevWeekAvg + 5 ? 'up'
            : weeklyAverage < prevWeekAvg - 5 ? 'down'
                : 'stable';

        // Calculate streaks
        const streaks = await calculateStreak();

        // Get daily adherence to determine best and worst days within the window
        const daily = await getDailyAdherence(days);
        let bestDay: { date: string; percentage: number } | undefined;
        let worstDay: { date: string; percentage: number } | undefined;

        if (daily.length > 0) {
            bestDay = daily.reduce((best, current) =>
                current.percentage > best.percentage ? current : best
            );

            // Only consider days that actually had doses scheduled (total > 0 -> percentage > 0 or could be 0)
            worstDay = daily.reduce((worst, current) =>
                current.percentage < worst.percentage ? current : worst
            );
        }

        return {
            overall,
            weeklyAverage,
            monthlyAverage: overall, // For now, same as overall
            trend,
            streakDays: streaks.current,
            longestStreak: streaks.longest,
            missedDoses,
            bestDay,
            worstDay,
        };
    } catch (error) {
        console.error('Error calculating adherence stats:', error);
        return {
            overall: 0,
            weeklyAverage: 0,
            monthlyAverage: 0,
            trend: 'stable',
            streakDays: 0,
            longestStreak: 0,
            missedDoses: 0,
        };
    }
}

/**
 * Get per-medication adherence statistics
 */
export async function getMedicationStats(days: number = 30): Promise<MedicationStats[]> {
    try {
        const db = await getDatabase();
        const now = Math.floor(Date.now() / 1000);
        const startTime = now - (days * 24 * 60 * 60);

        const results = await db.getAllAsync<{
            id: number;
            name: string;
            taken: number;
            missed: number;
            skipped: number;
            total: number;
        }>(
            `SELECT 
        m.id,
        m.name,
        COUNT(CASE WHEN d.status = 'taken' THEN 1 END) as taken,
        COUNT(CASE WHEN d.status = 'missed' THEN 1 END) as missed,
        COUNT(CASE WHEN d.status = 'skipped' THEN 1 END) as skipped,
        COUNT(*) as total
      FROM medications m
      LEFT JOIN doses d ON m.id = d.medication_id
      WHERE d.scheduled_time >= ? AND d.scheduled_time <= ?
      GROUP BY m.id
      ORDER BY m.name`,
            [startTime, now]
        );

        return results.map(row => ({
            medicationId: row.id,
            name: row.name,
            adherence: row.total ? Math.round((row.taken / row.total) * 100) : 0,
            totalDoses: row.total,
            takenDoses: row.taken,
            missedDoses: row.missed,
            skippedDoses: row.skipped,
        }));
    } catch (error) {
        console.error('Error getting medication stats:', error);
        return [];
    }
}

/**
 * Get daily adherence data for chart
 */
export async function getDailyAdherence(days: number = 30): Promise<DailyAdherence[]> {
    try {
        const db = await getDatabase();
        const now = Math.floor(Date.now() / 1000);
        const startTime = now - (days * 24 * 60 * 60);

        const results = await db.getAllAsync<{
            date: string;
            taken: number;
            missed: number;
            total: number;
        }>(
            `SELECT 
        DATE(scheduled_time, 'unixepoch') as date,
        COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
        COUNT(*) as total
      FROM doses
      WHERE scheduled_time >= ? AND scheduled_time <= ?
      GROUP BY date
      ORDER BY date`,
            [startTime, now]
        );

        return results.map(row => ({
            date: row.date,
            percentage: row.total ? Math.round((row.taken / row.total) * 100) : 0,
            taken: row.taken,
            total: row.total,
            missed: row.missed,
        }));
    } catch (error) {
        console.error('Error getting daily adherence:', error);
        return [];
    }
}

/**
 * Calculate current and longest adherence streak
 */
export async function calculateStreak(): Promise<{ current: number; longest: number }> {
    try {
        const db = await getDatabase();
        const now = Math.floor(Date.now() / 1000);

        // Get all days with doses (going back 90 days max)
        const startTime = now - (90 * 24 * 60 * 60);
        const results = await db.getAllAsync<{
            date: string;
            taken: number;
            total: number;
        }>(
            `SELECT 
        DATE(scheduled_time, 'unixepoch') as date,
        COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
        COUNT(*) as total
      FROM doses
      WHERE scheduled_time >= ? AND scheduled_time <= ?
      GROUP BY date
      ORDER BY date DESC`,
            [startTime, now]
        );

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (const row of results) {
            const adherence = row.total ? (row.taken / row.total) : 0;

            // Consider a day "successful" if adherence >= 80%
            if (adherence >= 0.8) {
                tempStreak++;
                if (currentStreak === 0 || tempStreak === currentStreak + 1) {
                    currentStreak = tempStreak;
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        return { current: currentStreak, longest: longestStreak };
    } catch (error) {
        console.error('Error calculating streak:', error);
        return { current: 0, longest: 0 };
    }
}

/**
 * Get time block performance statistics
 */
export async function getTimeBlockStats(days: number = 30): Promise<TimeBlockStats> {
    try {
        const db = await getDatabase();
        const now = Math.floor(Date.now() / 1000);
        const startTime = now - (days * 24 * 60 * 60);

        const results = await db.getAllAsync<{
            time: string;
            taken: number;
            total: number;
        }>(
            `SELECT 
        m.times as time,
        COUNT(CASE WHEN d.status = 'taken' THEN 1 END) as taken,
        COUNT(*) as total
      FROM medications m
      JOIN doses d ON m.id = d.medication_id
      WHERE d.scheduled_time >= ? AND d.scheduled_time <= ?
      GROUP BY m.times`,
            [startTime, now]
        );

        // Aggregate taken/total per time block
        const blockTotals = {
            morning: { taken: 0, total: 0 },
            noon: { taken: 0, total: 0 },
            evening: { taken: 0, total: 0 },
            night: { taken: 0, total: 0 },
        };

        results.forEach(row => {
            const hour = parseInt(row.time.split(':')[0]);
            let block: keyof typeof blockTotals;
            if (hour >= 6 && hour < 12) {
                block = 'morning';
            } else if (hour >= 12 && hour < 17) {
                block = 'noon';
            } else if (hour >= 17 && hour < 21) {
                block = 'evening';
            } else {
                block = 'night';
            }
            blockTotals[block].taken += row.taken;
            blockTotals[block].total += row.total;
        });

        const stats: TimeBlockStats = {
            morning: blockTotals.morning.total ? Math.round((blockTotals.morning.taken / blockTotals.morning.total) * 100) : 0,
            noon: blockTotals.noon.total ? Math.round((blockTotals.noon.taken / blockTotals.noon.total) * 100) : 0,
            evening: blockTotals.evening.total ? Math.round((blockTotals.evening.taken / blockTotals.evening.total) * 100) : 0,
            night: blockTotals.night.total ? Math.round((blockTotals.night.taken / blockTotals.night.total) * 100) : 0,
        };
        return stats;
    } catch (error) {
        console.error('Error getting time block stats:', error);
        return { morning: 0, noon: 0, evening: 0, night: 0 };
    }
}
