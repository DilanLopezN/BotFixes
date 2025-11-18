import OpenAI from 'openai';

export const clientOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};
