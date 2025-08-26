import { BadRequestException } from '@nestjs/common';

export class InvalidMessageException extends BadRequestException {
    constructor(message: string) {
        super(`Mensagem inválida: ${message}. A mensagem não contém contexto suficiente para detectar a intenção.`);
    }
}
