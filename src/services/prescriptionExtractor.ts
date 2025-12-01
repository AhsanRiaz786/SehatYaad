import { model } from '../config/gemini';
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

const GEMINI_PROMPT = `
You are an expert medical prescription analyzer with deep knowledge of:
- Common medication names and their variants
- Standard dosage formats and units  
- Prescription abbreviations (Latin and common)
- Typical prescription layouts

TASK: Extract structured medication data from this prescription image.

IMPORTANT CONTEXT:
- Prescriptions may be handwritten or printed
- Common abbreviations to recognize:
  * Dosing: OD/QD(once), BID/BD(twice), TID/TD(3x), QID(4x), PRN(as needed)
  * Units: mg(milligram), ml(milliliter), IU(units), mcg(microgram), gm(gram), tab(tablet), cap(capsule)
  * Routes: PO(oral), IV(intravenous), IM(intramuscular), TOP(topical)
  * Timing: HS(bedtime), AC(before meals), PC(after meals), STAT(immediately)

EXTRACTION RULES:
1. Medication Name: Use generic name if available, otherwise brand name
2. Dosage: Extract numeric value only (without unit)
3. Dosage Unit: Extract unit separately (mg, ml, IU, tab, cap, etc.)
4. Frequency: Convert ALL abbreviations to plain English:
   - "OD"/"QD"/"Once" → "once daily"
   - "BID"/"BD"/"Twice" → "twice daily"
   - "TID"/"TD" → "three times daily"
   - "QID" → "four times daily"
   - "HS" → "at bedtime"
   - "PRN" → "as needed"
5. Times: Suggest appropriate times based on frequency:
   - once daily → ["08:00"]
   - twice daily → ["08:00", "20:00"]
   - three times daily → ["08:00", "14:00", "20:00"]
   - four times daily → ["08:00", "12:00", "16:00", "20:00"]
   - at bedtime → ["22:00"]
6. Instructions: Extract any special notes (with food, avoid alcohol, etc.)
7. Confidence: 
   - "high" if text is very clear and complete
   - "medium" if readable but some uncertainty
   - "low" if hard to read or incomplete

OUTPUT FORMAT (JSON only, NO markdown, NO explanations):
{
  "medications": [
    {
      "name": "medication name",
      "dosage": "100",
      "dosageUnit": "mg",
      "frequency": "once daily",
      "times": ["08:00"],
      "instructions": "take with food",
      "confidence": "high"
    }
  ],
  "doctorName": "Dr. Name (if visible)",
  "date": "YYYY-MM-DD (if visible)",
  "pharmacyName": "Pharmacy name (if visible)"
}

CRITICAL: Return ONLY valid JSON. No markdown code blocks, no extra text.

Now analyze this prescription image carefully:
`;

export async function extractPrescriptionData(
    imageUri: string
): Promise<PrescriptionData> {
    try {
        console.log('📸 Starting Gemini prescription extraction...');

        // Convert image to base64
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('🔄 Image converted to base64, calling Gemini...');

        // Prepare image part for Gemini
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
            },
        };

        // Call Gemini API
        const result = await model.generateContent([GEMINI_PROMPT, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini response received');
        console.log('📝 Raw response:', text.substring(0, 200) + '...');

        // Parse JSON response (remove markdown if present)
        const jsonText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const data: PrescriptionData = JSON.parse(jsonText);

        console.log('✅ Gemini extracted medications:', data.medications.length);
        console.log('📊 Extraction data:', JSON.stringify(data, null, 2));

        // Validate that we have at least some data
        if (!data.medications || data.medications.length === 0) {
            console.warn('⚠️ No medications extracted from prescription');
        }

        return data;

    } catch (error) {
        console.error('❌ Gemini extraction error:', error);

        if (error instanceof SyntaxError) {
            console.error('❌ JSON parsing failed - Gemini returned invalid format');
        }

        throw new Error('Failed to extract prescription data. Please try again or enter details manually.');
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
