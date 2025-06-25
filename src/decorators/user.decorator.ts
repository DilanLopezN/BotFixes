import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RunnerManagerAuthInfo } from '../modules/runner-manager/interfaces/runner-manager-auth-info.interface';

export const UserDecorator = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
});

export const RunnerManagerAuthInfoDecorator = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.runnerManagerAuthInfo as RunnerManagerAuthInfo | undefined;
});

export const TokenDecorator = createParamDecorator((_: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.headers?.['authorization']?.split(' ')?.[1] ?? '';
});

export const AccessTokenDecorator = createParamDecorator((_: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.headers?.['access-token']?.split(' ')?.[1] ?? '';
});
