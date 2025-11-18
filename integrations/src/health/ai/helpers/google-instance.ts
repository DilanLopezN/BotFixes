import { GoogleGenerativeAI } from '@google/generative-ai';

export const clientGoogle = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });
};
