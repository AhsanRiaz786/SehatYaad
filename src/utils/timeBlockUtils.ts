export type TimeBlock = 'morning' | 'noon' | 'evening' | 'night';

export interface TimeBlockInfo {
    name: string;
    timeRange: string;
    icon: string;
    gradient: string[];
    color: string;
    label: string;
}

/**
 * Get the time block for a given time string (HH:MM format)
 */
export function getTimeBlock(time: string): TimeBlock {
    const [hours] = time.split(':').map(Number);

    if (hours >= 6 && hours < 11) {
        return 'morning';
    } else if (hours >= 11 && hours < 15) {
        return 'noon';
    } else if (hours >= 15 && hours < 20) {
        return 'evening';
    } else {
        return 'night';
    }
}

/**
 * Get display information for a time block
 */
export function getTimeBlockInfo(block: TimeBlock): TimeBlockInfo {
    switch (block) {
        case 'morning':
            return {
                name: 'Morning',
                label: 'Morning',
                timeRange: '6 AM - 11 AM',
                icon: 'sunny',
                color: '#FFB800',
                gradient: ['#FFD93D', '#FF9A3D']
            };
        case 'noon':
            return {
                name: 'Noon',
                label: 'Noon',
                timeRange: '11 AM - 3 PM',
                icon: 'partly-sunny',
                color: '#FF9A3D',
                gradient: ['#FF9A3D', '#FF6B3D']
            };
        case 'evening':
            return {
                name: 'Evening',
                label: 'Evening',
                timeRange: '3 PM - 8 PM',
                icon: 'sunset',
                color: '#FF6B3D',
                gradient: ['#FF6B3D', '#9D50BB']
            };
        case 'night':
            return {
                name: 'Night',
                label: 'Night',
                timeRange: '8 PM - 6 AM',
                icon: 'moon',
                color: '#667eea',
                gradient: ['#667eea', '#764ba2']
            };
    }
}

/**
 * Check if a dose is pending (scheduled time is in the future or within 30 min)
 */
export function isDosePending(scheduledTime: number): boolean {
    const now = Date.now() / 1000;
    const timeDiff = scheduledTime - now;
    // Pending if scheduled time is in the future or within past 30 minutes
    return timeDiff > -1800 && timeDiff <= 3600;
}

/**
 * Check if a dose is missed (scheduled time passed by more than 30 minutes)
 */
export function isDoseMissed(scheduledTime: number): boolean {
    const now = Date.now() / 1000;
    const timeDiff = scheduledTime - now;
    // Missed if scheduled time was more than 30 minutes ago
    return timeDiff < -1800;
}

/**
 * Format a dose timestamp to readable format
 */
export function formatDoseTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get scheduled time in seconds for a given time string (HH:MM) for today
 */
export function getScheduledTimeForToday(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

/**
 * Group medications by their time blocks
 */
export function groupMedicationsByTimeBlock<T extends { times: string[] }>(
    medications: T[]
): Record<TimeBlock, T[]> {
    const grouped: Record<TimeBlock, T[]> = {
        morning: [],
        noon: [],
        evening: [],
        night: [],
    };

    medications.forEach(med => {
        // Add medication to each time block where it has a scheduled dose
        const blocks = new Set(med.times.map(time => getTimeBlock(time)));
        blocks.forEach(block => {
            grouped[block].push(med);
        });
    });

    return grouped;
}
