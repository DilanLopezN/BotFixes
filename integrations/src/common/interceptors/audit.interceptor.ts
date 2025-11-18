import { NestInterceptor, ExecutionContext, CallHandler, Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { tap, catchError } from 'rxjs/operators';
import * as contextService from 'request-context';
import { AuditDataType, CreateAuditDefault } from '../../health/audit/audit.interface';
import { requestsIncomingCounter, apiMsgLatency } from '../prom-metrics';
import { Reflector } from '@nestjs/core';
import { OMIT_AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditService } from '../../health/audit/services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request: Request = context.switchToHttp().getRequest();

    const omitAudit = this.reflector.get<boolean>(OMIT_AUDIT_KEY, context.getHandler());
    const canCreateAudit = !omitAudit;

    requestsIncomingCounter.labels(request.route?.path, request.params?.integrationId).inc();
    const timerProm = apiMsgLatency.labels(request.route?.path, request.params?.integrationId).startTimer();

    const identifier = request?.body?.targetEntity || request?.route?.path || null;
    const defaultAudit: CreateAuditDefault = {
      dataType: AuditDataType.internalRequest,
      integrationId: request.params.integrationId,
      identifier,
      data: {},
    };

    const defaultRequestAudit: CreateAuditDefault = {
      ...defaultAudit,
      dataType: AuditDataType.internalRequest,
      data: {
        params: request.params,
        query: request.query,
        body: request.body,
      },
    };

    return next.handle().pipe(
      tap(async (data) => {
        timerProm();

        try {
          if (canCreateAudit) {
            this.auditService.sendAuditEvent(defaultRequestAudit);
            this.auditService.sendAuditEvent({
              ...defaultAudit,
              dataType: AuditDataType.internalResponse,
              data,
            });
          }
        } catch (error) {}
      }),
      catchError(async (err) => {
        timerProm();

        try {
          if (canCreateAudit) {
            await this.auditService.sendAuditEvent(defaultRequestAudit);
            await this.auditService.sendAuditEvent({
              ...defaultAudit,
              dataType: AuditDataType.internalResponse,
              data: err,
            });
          }
        } catch (error) {}
        throw err;
      }),
    );
  }
}
