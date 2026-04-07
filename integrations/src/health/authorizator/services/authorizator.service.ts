import { Injectable, Logger } from '@nestjs/common';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { IntegratorService } from '../../integrator/service/integrator.service';
import { SendAuthorizationInsuranceDataDto } from '../dto/send-authorization-insurance-data.dto';
import * as Sentry from '@sentry/node';

@Injectable()
export class AuthorizatorService {
  private readonly logger = new Logger(AuthorizatorService.name);

  constructor(private readonly integratorService: IntegratorService) {}

  async sendAuthorizationInsuranceData(
    integrationId: string,
    data: SendAuthorizationInsuranceDataDto,
  ): Promise<OkResponse> {
    return await this.integratorService.sendAuthorizationInsuranceData(integrationId, data);
  }
}
