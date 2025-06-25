import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RatingExternalRequest } from '../interfaces/external-request.interface';

export const ExternalRatingConversationIdDecorator = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const req: RatingExternalRequest = ctx.switchToHttp().getRequest();
    return req.conversationId;
});
