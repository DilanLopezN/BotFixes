import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditInterceptor } from '../../../common/interceptors/audit.interceptor';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { SendAuthorizationInsuranceDataDto } from '../dto/send-authorization-insurance-data.dto';
import { AuthorizatorService } from '../services/authorizator.service';

@UseInterceptors(AuditInterceptor)
@Controller({
  path: 'integration/:integrationId/authorization',
})
export class AuthorizatorController {
  private logger = new Logger(AuthorizatorController.name);

  constructor(private readonly authorizatorService: AuthorizatorService) {}

  @ApiTags('Authorization')
  @UseGuards(AuthGuard)
  @Post('sendAuthorizationInsuranceData')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.NOT_IMPLEMENTED })
  async sendAuthorizationInsuranceData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body() body: SendAuthorizationInsuranceDataDto,
  ): Promise<OkResponse> {
    return await this.authorizatorService.sendAuthorizationInsuranceData(integrationId, body);
  }
}
