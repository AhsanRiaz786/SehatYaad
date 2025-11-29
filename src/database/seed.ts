import { addMedication, logDose } from './helpers';

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
