import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, getDatabase } from './init';

const getDB = async () => await getDatabase();

export interface Medication {
    id?: number;
    name: string;
    dosage: string;
    frequency: string;
    times: string[]; // stored as JSON
    notes?: string;
    color?: string;
    notification_ids?: string[]; // stored as JSON
    notification_sound?: string;
    created_at?: number;
}

export interface Dose {
    id?: number;
    medication_id: number;
    scheduled_time: number;
    actual_time?: number;
    status: 'taken' | 'missed' | 'snoozed' | 'skipped' | 'pending';
    notes?: string;
}

// Medications CRUD
export const addMedication = async (medication: Medication) => {
    const db = await getDB();
    const timesJson = JSON.stringify(medication.times);
    const notificationIdsJson = medication.notification_ids ? JSON.stringify(medication.notification_ids) : null;
    const result = await db.runAsync(
        'INSERT INTO medications (name, dosage, frequency, times, notes, color, notification_ids, notification_sound) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        medication.name, medication.dosage, medication.frequency, timesJson, medication.notes || '', medication.color || '', notificationIdsJson, medication.notification_sound || 'default'
    );
    return result.lastInsertRowId;
};

export const getMedications = async (): Promise<Medication[]> => {
    const db = await getDB();
    const result = await db.getAllAsync<any>('SELECT * FROM medications ORDER BY created_at DESC');
    return result.map(row => ({
        ...row,
        times: JSON.parse(row.times),
        notification_ids: row.notification_ids ? JSON.parse(row.notification_ids) : []
    }));
};

export const getMedicationById = async (id: number): Promise<Medication | null> => {
    const db = await getDB();
    const result = await db.getFirstAsync<any>('SELECT * FROM medications WHERE id = ?', id);
    if (!result) return null;
    return {
        ...result,
        times: JSON.parse(result.times),
        notification_ids: result.notification_ids ? JSON.parse(result.notification_ids) : []
    };
};

export const updateMedication = async (id: number, medication: Partial<Medication>) => {
    const db = await getDB();

    const fields = [];
    const values = [];

    if (medication.name) { fields.push('name = ?'); values.push(medication.name); }
    if (medication.dosage) { fields.push('dosage = ?'); values.push(medication.dosage); }
    if (medication.frequency) { fields.push('frequency = ?'); values.push(medication.frequency); }
    if (medication.times) { fields.push('times = ?'); values.push(JSON.stringify(medication.times)); }
    if (medication.notes !== undefined) { fields.push('notes = ?'); values.push(medication.notes); }
    if (medication.color) { fields.push('color = ?'); values.push(medication.color); }
    if (medication.notification_sound) { fields.push('notification_sound = ?'); values.push(medication.notification_sound); }
    if (medication.notification_ids) { fields.push('notification_ids = ?'); values.push(JSON.stringify(medication.notification_ids)); }

    if (fields.length === 0) return;

    values.push(id);

    await db.runAsync(
        `UPDATE medications SET ${fields.join(', ')} WHERE id = ?`,
        ...values
    );
};

export const deleteMedication = async (id: number) => {
    const db = await getDB();
    await db.runAsync('DELETE FROM medications WHERE id = ?', id);
};

// Doses
export const logDose = async (dose: Dose) => {
    const db = await getDB();
    const result = await db.runAsync(
        'INSERT INTO doses (medication_id, scheduled_time, actual_time, status, notes) VALUES (?, ?, ?, ?, ?)',
        dose.medication_id, dose.scheduled_time, dose.actual_time || null, dose.status, dose.notes || null
    );
    return result.lastInsertRowId;
};

export const getDosesForMedication = async (medicationId: number): Promise<Dose[]> => {
    const db = await getDB();
    return await db.getAllAsync<Dose>('SELECT * FROM doses WHERE medication_id = ? ORDER BY scheduled_time DESC', medicationId);
};

export const getTodaysDoses = async (): Promise<(Dose & { medication: Medication })[]> => {
    const db = await getDB();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const doses = await db.getAllAsync<any>(
        `SELECT d.*, m.* FROM doses d 
         JOIN medications m ON d.medication_id = m.id 
         WHERE d.scheduled_time >= ? AND d.scheduled_time <= ?
         ORDER BY d.scheduled_time ASC`,
        Math.floor(startOfDay.getTime() / 1000),
        Math.floor(endOfDay.getTime() / 1000)
    );

    return doses.map(row => ({
        id: row.id,
        medication_id: row.medication_id,
        scheduled_time: row.scheduled_time,
        actual_time: row.actual_time,
        status: row.status,
        notes: row.notes,
        medication: {
            id: row.medication_id,
            name: row.name,
            dosage: row.dosage,
            frequency: row.frequency,
            times: JSON.parse(row.times),
            notes: row.notes,
            color: row.color,
            notification_ids: row.notification_ids ? JSON.parse(row.notification_ids) : [],
            notification_sound: row.notification_sound,
            created_at: row.created_at
        }
    }));
};

export const updateDoseStatus = async (doseId: number, status: Dose['status'], actualTime?: number, notes?: string) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE doses SET status = ?, actual_time = ?, notes = ? WHERE id = ?',
        status,
        actualTime || null,
        notes || null,
        doseId
    );
};

export const getConsecutiveMisses = async (medicationId: number): Promise<number> => {
    const db = await getDB();
    const doses = await db.getAllAsync<Dose>(
        'SELECT status FROM doses WHERE medication_id = ? ORDER BY scheduled_time DESC LIMIT 10',
        medicationId
    );

    let count = 0;
    for (const dose of doses) {
        if (dose.status === 'missed') {
            count++;
        } else if (dose.status === 'taken') {
            break;
        }
        // snoozed/skipped don't break or count in this simple model
    }
    return count;
};

export const getDosesByDateRange = async (startDate: Date, endDate: Date): Promise<Dose[]> => {
    const db = await getDB();
    return await db.getAllAsync<Dose>(
        'SELECT * FROM doses WHERE scheduled_time >= ? AND scheduled_time <= ? ORDER BY scheduled_time DESC',
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000)
    );
};

export const getDailySummary = async (date: Date = new Date()) => {
    const db = await getDB();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all medications
    const medications = await getMedications();
    console.log(`Checking ${medications.length} medications for today`);

    // Get all logged doses for today
    const loggedDoses = await db.getAllAsync<Dose>(
        'SELECT * FROM doses WHERE scheduled_time >= ? AND scheduled_time <= ?',
        Math.floor(startOfDay.getTime() / 1000),
        Math.floor(endOfDay.getTime() / 1000)
    );
    console.log(`Found ${loggedDoses.length} logged doses in database`);

    let total = 0;
    let taken = 0;
    let missed = 0;
    let pending = 0;

    // Calculate scheduled doses for today
    const now = Date.now() / 1000;

    for (const med of medications) {
        if (!med.times || med.times.length === 0) continue;

        console.log(`Processing medication: ${med.name} with ${med.times.length} times`);

        for (const time of med.times) {
            const [hours, minutes] = time.split(':').map(Number);
            const scheduledDate = new Date(date);
            scheduledDate.setHours(hours, minutes, 0, 0);
            const scheduledTime = Math.floor(scheduledDate.getTime() / 1000);

            // Only count doses that are scheduled for today
            if (scheduledTime >= Math.floor(startOfDay.getTime() / 1000) &&
                scheduledTime <= Math.floor(endOfDay.getTime() / 1000)) {

                total++;

                // Check if this dose has been logged
                const loggedDose = loggedDoses.find(d =>
                    d.medication_id === med.id &&
                    Math.abs(d.scheduled_time - scheduledTime) < 300 // Within 5 minutes
                );

                if (loggedDose) {
                    console.log(`  ${time} - Logged as ${loggedDose.status}`);
                    if (loggedDose.status === 'taken') {
                        taken++;
                    } else if (loggedDose.status === 'missed') {
                        missed++;
                    }
                    // snoozed and skipped don't count as taken or missed
                } else {
                    // Dose not logged yet - check if it's pending or missed
                    const timeDiff = scheduledTime - now;
                    const hoursUntil = timeDiff / 3600;

                    if (timeDiff > -1800) { // Within past 30 minutes or in future
                        pending++;
                        console.log(`  ${time} - Pending (in ${hoursUntil.toFixed(1)}h)`);
                    } else {
                        missed++;
                        console.log(`  ${time} - Missed (${hoursUntil.toFixed(1)}h ago)`);
                    }
                }
            }
        }
    }

    console.log(`Final Summary: Total=${total}, Taken=${taken}, Pending=${pending}, Missed=${missed}`);
    return { total, taken, missed, pending };
};

// Adherence
export const getAdherenceHistory = async () => {
    const db = await getDB();
    return await db.getAllAsync('SELECT * FROM adherence_log ORDER BY date DESC');
};

// Prescription Images
export const savePrescriptionImage = async (imagePath: string, medicationsJson: any) => {
    const db = await getDB();
    const jsonStr = JSON.stringify(medicationsJson);
    const result = await db.runAsync(
        'INSERT INTO prescription_images (image_path, medications_json) VALUES (?, ?)',
        imagePath, jsonStr
    );
    return result.lastInsertRowId;
};

// Settings
export const getSetting = async (key: string, defaultValue: string = ''): Promise<string> => {
    const db = await getDB();
    const result = await db.getFirstAsync<{ setting_value: string }>(
        'SELECT setting_value FROM user_settings WHERE setting_key = ?',
        key
    );
    return result ? result.setting_value : defaultValue;
};

export const updateSetting = async (key: string, value: string) => {
    const db = await getDB();
    await db.runAsync(
        'INSERT OR REPLACE INTO user_settings (setting_key, setting_value) VALUES (?, ?)',
        key, value
    );
};
