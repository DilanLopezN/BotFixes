import { Injectable } from '@nestjs/common';
import { Exceptions } from '../../../auth/exceptions';

@Injectable()
export class QuestionFiltersValidatorService {
    public isValidQuestion(question: string) {
        const isValid = this.isValidTextLength(question) && this.isValidHasWordsCount(question);
        // this.isValidNotInBlackList(question);

        if (!isValid) {
            throw Exceptions.CONTEXT_AI_INVALID_QUESTION;
        }

        return (
            question
                .trim()
                .toLowerCase()
                // remove vários ??? em sequência
                .replace(/\?+/, '?')
                // remove multiplos espaçoes em branco em sequência
                .replace(/\s{2,}/g, ' ')
        );
    }

    // Tamanho máximo e minímo de uma pergunta
    private isValidTextLength(question: string): boolean {
        const minLength = 3;
        const maxLength = 150;

        return question.length >= minLength && question.length <= maxLength;
    }

    // Quantidade de palavras mínima e máxima de uma pergunta
    private isValidHasWordsCount(question: string, minWords = 1, maxWords = 20): boolean {
        const wordCount = question.trim().split(/\s+/).length;
        return wordCount >= minWords && wordCount <= maxWords;
    }

    // Blacklist de palavras, se possuir qualquer uma delas no texto, a pergunta é inválida
    // Teoricamente isso poderia ser validado por entidades no dialogflow
    // private isValidNotInBlackList(question: string): boolean {
    //     const blackList = ['preço', 'preco', 'quanto custa', 'valor', 'valores'];
    //     return !blackList.some((word) => question.toLowerCase().includes(word.toLowerCase()));
    // }
}
