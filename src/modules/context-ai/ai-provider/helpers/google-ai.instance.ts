import { GoogleGenerativeAI } from '@google/generative-ai';

export const clientGoogle = (modelName?: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    return genAI.getGenerativeModel({
        model: modelName || 'gemini-2.0-flash',
    });
};
