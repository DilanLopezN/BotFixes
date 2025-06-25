import { Request } from 'express';

export class RatingExternalRequest extends Request {
    conversationId?: string;
}
