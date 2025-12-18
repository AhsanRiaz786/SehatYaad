/**
 * Formatting utilities for SehatYaad
 * Currency: Rs. format
 * Dates: DD/MM/YYYY format
 */

/**
 * Format currency in Pakistani Rupees
 * @param amount - Amount to format
 * @returns Formatted string like "Rs. 1,500"
 */
export function formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
}

/**
 * Format date as DD/MM/YYYY
 * @param date - Date object or timestamp
 * @returns Formatted string like "25/12/2024"
 */
export function formatDate(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date * 1000) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format time as HH:MM (24-hour format)
 * @param date - Date object or timestamp
 * @returns Formatted string like "14:30"
 */
export function formatTime(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date * 1000) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format date and time together
 * @param date - Date object or timestamp
 * @returns Formatted string like "25/12/2024 14:30"
 */
export function formatDateTime(date: Date | number): string {
    return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 30 minutes")
 * @param timestamp - Unix timestamp in seconds
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    const absDiff = Math.abs(diff);
    
    if (absDiff < 60) {
        return diff > 0 ? 'in a moment' : 'just now';
    } else if (absDiff < 3600) {
        const minutes = Math.floor(absDiff / 60);
        return diff > 0 ? `in ${minutes} min` : `${minutes} min ago`;
    } else if (absDiff < 86400) {
        const hours = Math.floor(absDiff / 3600);
        return diff > 0 ? `in ${hours} hr` : `${hours} hr ago`;
    } else {
        return formatDate(timestamp);
    }
}


