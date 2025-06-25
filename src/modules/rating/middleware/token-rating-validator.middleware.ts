import * as jwt from 'jsonwebtoken';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Exceptions } from './../../auth/exceptions';
import { RatingExternalRequest } from '../interfaces/external-request.interface';

@Injectable()
export class TokenRatingValidatorMiddleware implements NestMiddleware {
    async use(req: RatingExternalRequest, res: Response, next: (...params) => any) {
        const request = req;
        const bearerHeader = request.headers['authorization'];

        if (bearerHeader) {
            const headerContent = bearerHeader.split(' ');
            const bearerToken = headerContent[0];
            const token = headerContent[1];
            if (!token || bearerToken != 'Bearer') {
                throw Exceptions.INVALID_RATING_TOKEN;
            }

            const tokenContent = (jwt.verify(token, process.env.JWT_SECRET_KEY)) as any;
            req.conversationId = tokenContent.conversationId;
        }
        next();
    }
}