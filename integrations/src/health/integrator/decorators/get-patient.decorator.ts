import { createParamDecorator, ExecutionContext, UnprocessableEntityException } from '@nestjs/common';

export const ValidateCpfOrCode = createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const queryDto = request.query;
  const { cpf, code } = queryDto;

  if (!cpf && !code) {
    throw new UnprocessableEntityException('Either CPF or code must be provided.');
  }
});
