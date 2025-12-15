import { addMedication, logDose } from './helpers';
import { getDatabase } from './init';

export const seedDatabase = async () => {
    try {
        const medId = await addMedication({
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice Daily',
            times: ['08:00', '20:00'],
            notes: 'Take after food',
            color: '#FF5733'
        });

        console.log('Added sample medication with ID:', medId);

        await logDose({
            medication_id: medId,
            scheduled_time: Date.now(),
            status: 'taken',
            actual_time: Date.now()
        });

        console.log('Logged sample dose');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

/**
 * Seed the database with "bad" adherence history for testing Adaptive Reminder AI.
 *
 * This creates (or reuses) a test medication and logs doses over the last 10 days
 * with a pattern of frequent misses and late takes, so that:
 * - miss_rate and snooze_rate are high
 * - avg_delay_minutes is positive (takes are late)
 */
export const seedAdaptiveTestData = async () => {
    try {
        const db = await getDatabase();

        // Find or create a dedicated test medication
        const existing = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM medications WHERE name = ?',
            'Adaptive Test Med'
        );

        let medId: number;
        if (existing?.id) {
            medId = existing.id;
            console.log('Using existing Adaptive Test Med with ID:', medId);
        } else {
            medId = await addMedication({
                name: 'Adaptive Test Med',
                dosage: '500mg',
                frequency: 'Once Daily',
                times: ['08:00'],
                notes: 'DEV adaptive test medication',
                color: '#2563EB',
            });
            console.log('Created Adaptive Test Med with ID:', medId);
        }

        // Create 10 days of history at 08:00 with mostly bad behavior
        const now = new Date();

        for (let i = 1; i <= 10; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(8, 0, 0, 0);
            const scheduledTimeSec = Math.floor(date.getTime() / 1000);

            // Pattern:
            // - Days 1-4: missed
            // - Days 5-7: snoozed (but not taken)
            // - Days 8-10: taken ~30 minutes late
            if (i <= 4) {
                await logDose({
                    medication_id: medId,
                    scheduled_time: scheduledTimeSec,
                    status: 'missed',
                    notes: 'Seeded missed dose for adaptive test',
                });
            } else if (i <= 7) {
                await logDose({
                    medication_id: medId,
                    scheduled_time: scheduledTimeSec,
                    status: 'snoozed',
                    notes: 'Seeded snoozed dose for adaptive test',
                });
            } else {
                const actualTimeSec = scheduledTimeSec + 30 * 60; // 30 minutes late
                await logDose({
                    medication_id: medId,
                    scheduled_time: scheduledTimeSec,
                    actual_time: actualTimeSec,
                    status: 'taken',
                    notes: 'Seeded late taken dose for adaptive test',
                });
            }
        }

        console.log('Seeded adaptive test data for Adaptive Test Med');
    } catch (error) {
        console.error('Error seeding adaptive test data:', error);
    }
};

