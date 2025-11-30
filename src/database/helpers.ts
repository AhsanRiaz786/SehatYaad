import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from './init';

const getDB = async () => await SQLite.openDatabaseAsync(DATABASE_NAME);

export interface Medication {
    id?: number;
    name: string;
    dosage: string;
    frequency: string;
    times: string[]; // stored as JSON
    notes?: string;
    color?: string;
    notification_ids?: string[]; // stored as JSON
    created_at?: number;
}

export interface Dose {
    id?: number;
    medication_id: number;
    scheduled_time: number;
    actual_time?: number;
    status: 'taken' | 'missed' | 'snoozed' | 'skipped';
}

// Medications CRUD
export const addMedication = async (medication: Medication) => {
    const db = await getDB();
    const timesJson = JSON.stringify(medication.times);
    const notificationIdsJson = medication.notification_ids ? JSON.stringify(medication.notification_ids) : null;
    const result = await db.runAsync(
        'INSERT INTO medications (name, dosage, frequency, times, notes, color, notification_ids) VALUES (?, ?, ?, ?, ?, ?, ?)',
        medication.name, medication.dosage, medication.frequency, timesJson, medication.notes || '', medication.color || '', notificationIdsJson
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
        'INSERT INTO doses (medication_id, scheduled_time, actual_time, status) VALUES (?, ?, ?, ?)',
        dose.medication_id, dose.scheduled_time, dose.actual_time || null, dose.status
    );
    return result.lastInsertRowId;
};

export const getDosesForMedication = async (medicationId: number) => {
    const db = await getDB();
    return await db.getAllAsync('SELECT * FROM doses WHERE medication_id = ? ORDER BY scheduled_time DESC', medicationId);
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
