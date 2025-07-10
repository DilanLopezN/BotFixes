import OpenAI from 'openai';

export const clientOpenAI = (): OpenAI => {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};
