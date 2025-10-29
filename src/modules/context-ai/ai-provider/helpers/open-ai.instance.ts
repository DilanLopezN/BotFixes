import OpenAI from 'openai';

export const clientOpenAI = (): OpenAI => {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};

export const clientOpenRouter = (): OpenAI => {
    return new OpenAI({
        apiKey: process.env.OPEN_ROUTER_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
    });
};

