import { Body, Controller, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { IntegrationPrivateService } from '../services/integration-private.service';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('private/integration/:integrationId')
@UseGuards(AuthGuard)
export class IntegrationPrivateController {
  constructor(private readonly runnerService: IntegrationPrivateService) {}

  @Post('getContainerLogs')
  async getContainerLogs(
    @Param('integrationId') integrationId: string,
    @Body(new ValidationPipe()) body: { runnerId: number; env: string; logsSize: number },
  ) {
    return await this.runnerService.getContainerLogs(integrationId, body.runnerId, body.env, body.logsSize);
  }

  @Post('doSql')
  async doSql(@Param('integrationId') integrationId: string, @Body(new ValidationPipe()) body: { sql: string }) {
    return await this.runnerService.doSql(integrationId, body.sql);
  }

  @Post('doDeploy')
  async doDeploy(
    @Param('integrationId') integrationId: string,
    @Body(new ValidationPipe()) body: { tag: string; env: string; runnerId: number },
  ) {
    return await this.runnerService.doDeploy(integrationId, body.runnerId, body.env, body.tag);
  }

  @Post('integratorPing')
  async integratorPing(@Param('integrationId') integrationId: string) {
    return await this.runnerService.integratorPing(integrationId);
  }

  @Post('/runner/:runnerId/ping')
  async runnerPing(@Param('integrationId') integrationId: string, @Param('runnerId') runnerId: string) {
    return await this.runnerService.runnerPing(integrationId, runnerId);
  }
}
