import { getDatabase } from '../database/init';
import { Dose, Medication, getDosesByDateRange, getMedications, updateMedication } from '../database/helpers';
import { scheduleMedicationNotifications, cancelMedicationNotifications } from './notificationService';

export interface ReminderPattern {
    medication_id: number;
    time_slot: string; // "HH:MM"
    on_time_rate: number;
    miss_rate: number;
    snooze_rate: number;
    avg_delay_minutes: number;
    recommended_time?: string | null;
    sample_size: number;
}

export interface ScheduleRecommendation {
    medication: Medication & { id: number };
    currentTime: string;
    recommendedTime: string;
    reason: string;
    pattern: ReminderPattern;
}

const ANALYSIS_DAYS = 21; // Look back 3 weeks
const MIN_SAMPLES = 5;    // Require at least 5 doses for a slot

/**
 * Recompute reminder patterns for all medications and time slots.
 * Call this periodically (e.g. app start, once per day).
 */
export async function recomputeReminderPatterns(): Promise<void> {
    const db = await getDatabase();

    // Check if adaptive behavior is enabled
    const setting = await db.getFirstAsync<{ setting_value: string }>(
        'SELECT setting_value FROM user_settings WHERE setting_key = ?',
        'adaptive_enabled'
    );
    if (setting && setting.setting_value !== 'true') {
        console.log('Adaptive reminders disabled via settings; skipping pattern recompute.');
        return;
    }

    const medications = await getMedications();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - ANALYSIS_DAYS);

    const allDoses = await getDosesByDateRange(startDate, endDate);

    for (const med of medications) {
        if (!med.id || !med.times || med.times.length === 0) continue;

        for (const time of med.times) {
            const pattern = computePatternForSlot(med.id, time, allDoses);
            if (!pattern || pattern.sample_size < MIN_SAMPLES) {
                // Not enough data: clear any existing pattern
                await db.runAsync(
                    `DELETE FROM reminder_patterns WHERE medication_id = ? AND time_slot = ?`,
                    med.id,
                    time
                );
                continue;
            }

            const recommendedTime = getRecommendedTime(time, pattern);

            await db.runAsync(
                `INSERT INTO reminder_patterns (
                    medication_id, time_slot, on_time_rate, miss_rate, snooze_rate,
                    avg_delay_minutes, recommended_time, sample_size, last_computed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
                ON CONFLICT(medication_id, time_slot) DO UPDATE SET
                    on_time_rate = excluded.on_time_rate,
                    miss_rate = excluded.miss_rate,
                    snooze_rate = excluded.snooze_rate,
                    avg_delay_minutes = excluded.avg_delay_minutes,
                    recommended_time = excluded.recommended_time,
                    sample_size = excluded.sample_size,
                    last_computed_at = excluded.last_computed_at`,
                med.id,
                time,
                pattern.on_time_rate,
                pattern.miss_rate,
                pattern.snooze_rate,
                pattern.avg_delay_minutes,
                recommendedTime,
                pattern.sample_size
            );
        }
    }
}

/**
 * Compute statistics for one medication/time-slot over the given doses.
 */
function computePatternForSlot(
    medicationId: number,
    timeSlot: string,
    allDoses: Dose[]
): ReminderPattern | null {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);

    const relevant = allDoses.filter(d => {
        if (d.medication_id !== medicationId) return false;
        const date = new Date(d.scheduled_time * 1000);
        return date.getHours() === slotHour && date.getMinutes() === slotMinute;
    });

    if (relevant.length === 0) {
        return null;
    }

    let onTime = 0;
    let missed = 0;
    let snoozed = 0;
    let takenCount = 0;
    let totalDelayMinutes = 0;

    for (const dose of relevant) {
        if (dose.status === 'missed') missed++;
        if (dose.status === 'snoozed') snoozed++;

        if (dose.status === 'taken' && dose.actual_time) {
            takenCount++;
            const delaySec = dose.actual_time - dose.scheduled_time;
            totalDelayMinutes += delaySec / 60;

            // Consider "on time" within ±10 minutes
            if (Math.abs(delaySec) <= 10 * 60) {
                onTime++;
            }
        }
    }

    const total = relevant.length;
    if (total === 0) return null;

    const on_time_rate = onTime / total;
    const miss_rate = missed / total;
    const snooze_rate = snoozed / total;
    const avg_delay_minutes = takenCount > 0 ? totalDelayMinutes / takenCount : 0;

    return {
        medication_id: medicationId,
        time_slot: timeSlot,
        on_time_rate,
        miss_rate,
        snooze_rate,
        avg_delay_minutes,
        sample_size: total,
    };
}

/**
 * Decide a recommended time based on pattern.
 * Returns null if no change is warranted.
 */
function getRecommendedTime(currentTime: string, pattern: ReminderPattern): string | null {
    const { miss_rate, snooze_rate, avg_delay_minutes } = pattern;

    // If performance is already good, don't change
    if (miss_rate < 0.15 && snooze_rate < 0.3) {
        return null;
    }

    const [hour, minute] = currentTime.split(':').map(Number);

    // If user usually takes later (positive avg delay), push reminder later a bit
    if (avg_delay_minutes > 10) {
        const delta = Math.min(Math.max(Math.round(avg_delay_minutes), 10), 60); // clamp 10–60
        const newMinutesTotal = hour * 60 + minute + delta;
        const newHour = Math.floor(newMinutesTotal / 60) % 24;
        const newMinute = newMinutesTotal % 60;
        return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    }

    // If they often snooze but take earlier (negative delay), optionally pull earlier
    if (avg_delay_minutes < -10) {
        const delta = Math.min(Math.max(Math.round(Math.abs(avg_delay_minutes)), 10), 60);
        const newMinutesTotal = hour * 60 + minute - delta;
        const newHour = ((Math.floor(newMinutesTotal / 60) % 24) + 24) % 24;
        const newMinute = ((newMinutesTotal % 60) + 60) % 60;
        return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    }

    return null;
}

/**
 * Fetch schedule change recommendations that are safe to show to the user.
 */
export async function getScheduleRecommendations(cachedMedications?: Medication[]): Promise<ScheduleRecommendation[]> {
    const db = await getDatabase();
    // Use cached medications if provided, otherwise fetch them
    const meds = cachedMedications || await getMedications();

    const rows = await db.getAllAsync<ReminderPattern & { medication_name: string }>(
        `SELECT rp.*, m.name as medication_name
         FROM reminder_patterns rp
         JOIN medications m ON rp.medication_id = m.id
         WHERE rp.recommended_time IS NOT NULL
         ORDER BY rp.miss_rate DESC, rp.snooze_rate DESC`
    );

    const medById = new Map<number, Medication & { id: number }>();
    meds.forEach(m => {
        if (m.id) medById.set(m.id, m as Medication & { id: number });
    });

    const recommendations: ScheduleRecommendation[] = [];

    for (const row of rows) {
        const med = medById.get(row.medication_id);
        if (!med || !med.times?.includes(row.time_slot)) continue;
        if (!row.recommended_time) continue;

        const reason = buildReason(row);
        recommendations.push({
            medication: med,
            currentTime: row.time_slot,
            recommendedTime: row.recommended_time,
            reason,
            pattern: row,
        });
    }

    return recommendations;
}

function buildReason(pattern: ReminderPattern): string {
    const missPercent = Math.round(pattern.miss_rate * 100);
    const snoozePercent = Math.round(pattern.snooze_rate * 100);
    const delay = Math.round(pattern.avg_delay_minutes);

    if (missPercent >= 30) {
        return `You miss this dose about ${missPercent}% of the time at this hour.`;
    }
    if (snoozePercent >= 40 && delay > 0) {
        return `You often snooze and end up taking this about ${delay} minutes later.`;
    }
    if (delay > 15) {
        return `You usually take this around ${delay} minutes after the reminder.`;
    }
    return 'We noticed a pattern that might work better for you.';
}

/**
 * Apply a single schedule recommendation:
 * - update medication.times
 * - reschedule notifications
 * - log adjustment
 */
export async function applyScheduleRecommendation(rec: ScheduleRecommendation): Promise<void> {
    const db = await getDatabase();
    const med = rec.medication;

    const newTimes = med.times.map(t => (t === rec.currentTime ? rec.recommendedTime : t));

    // Cancel existing notifications and reschedule with new times
    const notificationIds = (med.notification_ids || []) as string[];
    if (notificationIds.length > 0) {
        await cancelMedicationNotifications(notificationIds);
    }

    await updateMedication(med.id, { times: newTimes });

    // Re-schedule notifications
    await scheduleMedicationNotifications({
        ...med,
        times: newTimes,
    } as Medication & { id: number });

    // Log adjustment
    await db.runAsync(
        `INSERT INTO schedule_adjustments (medication_id, old_time, new_time, reason)
         VALUES (?, ?, ?, ?)`,
        med.id,
        rec.currentTime,
        rec.recommendedTime,
        rec.reason
    );
}


