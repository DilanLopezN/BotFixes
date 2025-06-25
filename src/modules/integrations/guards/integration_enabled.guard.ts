import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from '../../auth/exceptions';
import { HealthIntegrationService } from '../services/health/health-integration.service';

@Injectable()
export class IntegrationEnabledGuard implements CanActivate {
    constructor(readonly reflector: Reflector, readonly healthIntegrationService: HealthIntegrationService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { workspaceId, integrationId, healthIntegrationId } = request.params;

        const integration = await this.healthIntegrationService.findOne({
            workspaceId,
            _id: integrationId || healthIntegrationId,
            deletedAt: { $exists: false },
        });
        if (!integration.enabled) {
            throw Exceptions.ERROR_DISABLED_INTEGRATION;
        }

        return true;
    }
}
