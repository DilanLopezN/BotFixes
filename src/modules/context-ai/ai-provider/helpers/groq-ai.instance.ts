import Groq from 'groq-sdk';
// rodar: npm install --save groq-sdk -f
export const clientGroq = (): Groq => {
    return new Groq({
        //precisa add a chave
        apiKey: process.env.GROQ_API_KEY,
    });
};
