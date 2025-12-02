import * as FileSystem from 'expo-file-system';

export interface ExtractedMedication {
    name: string;
    dosage: string;
    dosageUnit: string;
    frequency: string;
    times: string[];
    instructions?: string;
    confidence: 'high' | 'medium' | 'low';
}

export interface PrescriptionData {
    medications: ExtractedMedication[];
    doctorName?: string;
    date?: string;
    pharmacyName?: string;
}

// Get backend URL from environment variable
// For local development: http://localhost:5000
// For production: your deployed backend URL
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.7.40.68:8000';

export async function extractPrescriptionData(
    imageUri: string
): Promise<PrescriptionData> {
    try {
        console.log('📸 Starting prescription extraction via backend...');
        console.log('🔗 Backend URL:', BACKEND_URL);

        // Create form data with the image
        const formData = new FormData();

        // Read the image file
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
            throw new Error('Image file not found');
        }

        // Append image to form data
        // @ts-ignore - FormData types don't perfectly match React Native usage
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'prescription.jpg',
        });

        console.log('🔄 Uploading image to backend...');

        // Call backend API
        const response = await fetch(`${BACKEND_URL}/api/process-medication-image`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                // Don't set Content-Type - fetch will set it automatically with boundary
            },
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process prescription');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Processing failed');
        }

        console.log('✅ Backend extracted medications:', result.data.medications.length);
        console.log('📊 Extraction data:', JSON.stringify(result.data, null, 2));

        // Validate that we have at least some data
        if (!result.data.medications || result.data.medications.length === 0) {
            console.warn('⚠️ No medications extracted from prescription');
        }

        return result.data;

    } catch (error) {
        console.error('❌ Prescription extraction error:', error);

        // Provide more specific error messages
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
            throw new Error(
                'Cannot connect to backend server. Make sure the backend is running at ' + BACKEND_URL
            );
        }

        throw new Error(
            error instanceof Error
                ? error.message
                : 'Failed to extract prescription data. Please try again or enter details manually.'
        );
    }
}

/**
 * Validate extracted medication data
 */
export function validateExtractedData(medication: ExtractedMedication): boolean {
    return !!(
        medication.name &&
        medication.dosage &&
        medication.frequency &&
        medication.times &&
        medication.times.length > 0
    );
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
    switch (confidence) {
        case 'high': return '#10b981'; // green
        case 'medium': return '#f59e0b'; // orange
        case 'low': return '#ef4444'; // red
        default: return '#6b7280'; // gray
    }
}
