import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ReportsRequest } from '../interfaces/reports-request.interface';

export const ReportsWorkspaceIdDecorator = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const req: ReportsRequest = ctx.switchToHttp().getRequest();
    return req.workspaceId;
});
