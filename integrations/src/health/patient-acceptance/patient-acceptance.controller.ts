import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { PatientAcceptanceService } from './patient-acceptance.service';
import { ObjectIdPipe } from '../../common/pipes/objectId.pipe';
import { DoAcceptDto } from './dto/do-accept.dto';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { DefaultPatient, GetRequestAcceptanceResponse } from './interfaces/get-request-acceptance.interface';
import { DoRemoveAcceptanceDto } from './dto/do-remove-acceptance.dto';
import { GetAcceptanceDto } from './dto/get-acceptance.dto';
import { DoPreloadDataDto } from './dto/do-preload-data.dto';
import { GetPatientDataFromAcceptanceDto } from './dto/get-patient-data-from-acceptance.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

@UseInterceptors(AuditInterceptor)
@Controller('integration/:integrationId/health/patient-acceptance')
@ApiTags('Patient acceptance')
@UseGuards(AuthGuard)
export class PatientAcceptanceController {
  constructor(private readonly patientAcceptanceService: PatientAcceptanceService) {}

  @HttpCode(HttpStatus.OK)
  @Post('doAccept')
  async doAccept(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: DoAcceptDto,
  ): Promise<OkResponse> {
    return await this.patientAcceptanceService.accept(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('doPreloadData')
  async doPreloadData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: DoPreloadDataDto,
  ): Promise<OkResponse> {
    return await this.patientAcceptanceService.doPreloadData(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('doRemoveAccept')
  async doRemoveAccept(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: DoRemoveAcceptanceDto,
  ): Promise<OkResponse> {
    return await this.patientAcceptanceService.removeAcceptance(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('getAcceptance')
  async getAcceptance(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: GetAcceptanceDto,
  ): Promise<GetRequestAcceptanceResponse> {
    return await this.patientAcceptanceService.getAcceptance(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('getPatientDataFromAcceptance')
  async getPatientDataFromAcceptance(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: GetPatientDataFromAcceptanceDto,
  ): Promise<DefaultPatient[]> {
    return await this.patientAcceptanceService.getPatientDataFromAcceptance(integrationId, dto);
  }
}
