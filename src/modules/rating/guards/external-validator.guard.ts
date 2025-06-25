import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from './../../auth/exceptions';
import { RatingExternalRequest } from '../interfaces/external-request.interface';

@Injectable()
export class ExternalValidatorGuard {
    constructor(readonly reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: RatingExternalRequest = context.switchToHttp().getRequest();
        if (!!request.conversationId) {
            return true;
        }
        throw Exceptions.EXTERNAL_REQUEST_MISSING_CONVERSATION_ID;
    }
}
