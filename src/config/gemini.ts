import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Direct access via process.env
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ Missing API Key. check your .env file!');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// 2. Use the correct model for handwriting
export const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro"
});