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
 * Comprehensive demo seed with many medications and historical data
 * Perfect for showcasing all app features
 */
export const seedDemoData = async () => {
    try {
        console.log('Starting comprehensive demo seed...');
        const db = await getDatabase();

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await db.execAsync('DELETE FROM doses');
        // await db.execAsync('DELETE FROM medications');

        // Define comprehensive medication list with realistic data
        const medications = [
            {
                name: 'Paracetamol',
                dosage: '500mg',
                frequency: 'Twice Daily',
                times: ['08:00', '20:00'],
                notes: 'Take with water after meals',
                color: '#FF5733',
            },
            {
                name: 'Amoxicillin',
                dosage: '250mg',
                frequency: 'Three Times Daily',
                times: ['08:00', '14:00', '20:00'],
                notes: 'Complete full course',
                color: '#33C3F0',
            },
            {
                name: 'Ibuprofen',
                dosage: '400mg',
                frequency: 'Three Times Daily',
                times: ['09:00', '15:00', '21:00'],
                notes: 'Take with food to avoid stomach upset',
                color: '#FFC300',
            },
            {
                name: 'Metformin',
                dosage: '500mg',
                frequency: 'Twice Daily',
                times: ['08:00', '20:00'],
                notes: 'Take with meals',
                color: '#50C878',
            },
            {
                name: 'Levothyroxine',
                dosage: '75mcg',
                frequency: 'Once Daily',
                times: ['07:00'],
                notes: 'Take on empty stomach, 30 minutes before breakfast',
                color: '#9B59B6',
            },
            {
                name: 'Omeprazole',
                dosage: '20mg',
                frequency: 'Once Daily',
                times: ['08:00'],
                notes: 'Take before breakfast',
                color: '#E74C3C',
            },
            {
                name: 'Atorvastatin',
                dosage: '20mg',
                frequency: 'Once Daily',
                times: ['22:00'],
                notes: 'Take at bedtime',
                color: '#3498DB',
            },
            {
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'Once Daily',
                times: ['09:00'],
                notes: 'Monitor blood pressure',
                color: '#E67E22',
            },
            {
                name: 'Amlodipine',
                dosage: '5mg',
                frequency: 'Once Daily',
                times: ['08:00'],
                notes: 'Take with or without food',
                color: '#1ABC9C',
            },
            {
                name: 'Metoprolol',
                dosage: '50mg',
                frequency: 'Twice Daily',
                times: ['08:00', '20:00'],
                notes: 'Do not stop suddenly',
                color: '#F39C12',
            },
            {
                name: 'Warfarin',
                dosage: '5mg',
                frequency: 'Once Daily',
                times: ['18:00'],
                notes: 'Take at same time daily. Avoid vitamin K rich foods',
                color: '#E91E63',
            },
            {
                name: 'Furosemide',
                dosage: '40mg',
                frequency: 'Once Daily',
                times: ['10:00'],
                notes: 'Take in morning to avoid frequent urination at night',
                color: '#00BCD4',
            },
            {
                name: 'Losartan',
                dosage: '50mg',
                frequency: 'Once Daily',
                times: ['08:00'],
                notes: 'Monitor blood pressure',
                color: '#FF9800',
            },
            {
                name: 'Gabapentin',
                dosage: '300mg',
                frequency: 'Three Times Daily',
                times: ['08:00', '14:00', '20:00'],
                notes: 'May cause drowsiness',
                color: '#673AB7',
            },
            {
                name: 'Sertraline',
                dosage: '50mg',
                frequency: 'Once Daily',
                times: ['09:00'],
                notes: 'Take with or without food',
                color: '#2196F3',
            },
            {
                name: 'Tramadol',
                dosage: '50mg',
                frequency: 'Four Times Daily',
                times: ['08:00', '12:00', '16:00', '20:00'],
                notes: 'Take as needed for pain',
                color: '#4CAF50',
            },
            {
                name: 'Albuterol',
                dosage: '100mcg',
                frequency: 'As Needed',
                times: ['08:00', '20:00'],
                notes: 'Inhaler - use before exercise or when short of breath',
                color: '#FFEB3B',
            },
            {
                name: 'Vitamin D3',
                dosage: '1000 IU',
                frequency: 'Once Daily',
                times: ['12:00'],
                notes: 'Take with food for better absorption',
                color: '#FF9800',
            },
            {
                name: 'Calcium',
                dosage: '500mg',
                frequency: 'Twice Daily',
                times: ['10:00', '18:00'],
                notes: 'Take with vitamin D',
                color: '#795548',
            },
            {
                name: 'Multivitamin',
                dosage: '1 tablet',
                frequency: 'Once Daily',
                times: ['09:00'],
                notes: 'Take with breakfast',
                color: '#607D8B',
            },
        ];

        const medicationIds: number[] = [];
        const now = new Date();

        // Add all medications
        for (const med of medications) {
            const medId = await addMedication(med);
            medicationIds.push(medId);
            console.log(`Added medication: ${med.name} (ID: ${medId})`);
        }

        // Generate historical dose data for the last 21 days
        console.log('Generating historical dose data...');

        for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
            const date = new Date(now);
            date.setDate(now.getDate() - dayOffset);
            date.setHours(0, 0, 0, 0);

            // For each medication, log doses based on their schedule
            for (let i = 0; i < medicationIds.length; i++) {
                const medId = medicationIds[i];
                const med = medications[i];
                const dayOfWeek = date.getDay();

                // Skip some medications occasionally to show missed doses (for variety)
                // About 10% miss rate for demo purposes
                if (Math.random() < 0.1 && dayOffset > 0) {
                    // Skip this medication for this day
                    continue;
                }

                for (const timeStr of med.times) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const scheduledDate = new Date(date);
                    scheduledDate.setHours(hours, minutes, 0, 0);
                    const scheduledTime = Math.floor(scheduledDate.getTime() / 1000);

                    // Determine status: mostly taken, some late, occasional missed
                    let status: 'taken' | 'missed' | 'snoozed' = 'taken';
                    let actualTime = scheduledTime;
                    let delayMinutes = 0;

                    const rand = Math.random();
                    if (rand < 0.75) {
                        // 75% taken on time or slightly late (within 30 minutes)
                        status = 'taken';
                        delayMinutes = Math.floor(Math.random() * 30); // 0-30 minutes late
                        actualTime = scheduledTime + (delayMinutes * 60);
                    } else if (rand < 0.90) {
                        // 15% taken but late (30-60 minutes)
                        status = 'taken';
                        delayMinutes = 30 + Math.floor(Math.random() * 30); // 30-60 minutes late
                        actualTime = scheduledTime + (delayMinutes * 60);
                    } else if (rand < 0.95) {
                        // 5% snoozed
                        status = 'snoozed';
                        delayMinutes = 10;
                        actualTime = scheduledTime + (delayMinutes * 60);
                    } else {
                        // 5% missed
                        status = 'missed';
                        actualTime = scheduledTime;
                    }

                    await logDose({
                        medication_id: medId,
                        scheduled_time: scheduledTime,
                        actual_time: actualTime,
                        status: status,
                        notes: status === 'taken' && delayMinutes > 0 ? `Taken ${delayMinutes} minutes late` : undefined,
                    });
                }
            }
        }

        console.log(`✅ Demo seed complete! Added ${medicationIds.length} medications with 21 days of history`);
        console.log(`📊 Total medications: ${medicationIds.length}`);
        
        // Count doses
        const doseCount = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM doses'
        );
        console.log(`📈 Total dose logs: ${doseCount?.count || 0}`);

    } catch (error) {
        console.error('Error seeding demo data:', error);
        throw error;
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
