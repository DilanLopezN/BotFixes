import { Body, Controller, Post } from '@nestjs/common';
import { ServiceStatusService } from '../services/service-status.service';
import { RunnerManagerAuthInfoDecorator } from '../../../decorators/user.decorator';
import { RunnerManagerAuthInfo } from '../interfaces/runner-manager-auth-info.interface';

@Controller('runner-manager')
export class RunnerManagerController {
    constructor(private readonly serviceStatusService: ServiceStatusService) {}

    @Post('createRunnerStatus')
    async createRunnerStatus(@Body() body: any) {
        return;
        // try {
        //     return await this.runnerStatusService.createRunnerStatus(body);
        // } catch (e) {
        //     console.log('error createRunnerStatus', e);
        // }
    }

    @Post('createServiceStatus')
    async createServiceStatus(@Body() body: any, @RunnerManagerAuthInfoDecorator() auth: RunnerManagerAuthInfo) {
        return;
        // try {
        //     await this.serviceStatusService.createServiceStatus({
        //         env: body.env,
        //         integrationId: body.integrationId,
        //         ok: !!body.ok,
        //         workspaceId: body.workspaceId,
        //         version: body.version,
        //         runnerId: body.runnerId,
        //     });
        // } catch (e) {
        //     console.log('error createServiceStatus', e);
        // }
    }
}
