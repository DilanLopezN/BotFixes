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
import { ApiTags } from '@nestjs/swagger';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { IntegratorService } from '.././service/integrator.service';
import { AuditInterceptor } from '../../../common/interceptors/audit.interceptor';
import { ListDoctorSchedulesDto } from '../dto/list-doctor-schedules.dto';
import { FindDoctorResponse, ListDoctorSchedulesResponse } from 'kissbot-health-core';
import { FindDoctorDto } from '../dto/find-doctor-params.dto';

@UseGuards(AuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller({
  path: 'integration/:integrationId/health/doctors',
})
export class DoctorController {
  constructor(private readonly integratorService: IntegratorService) {}

  @ApiTags('Doctor')
  @HttpCode(HttpStatus.OK)
  @Post('listDoctorSchedules')
  async listDoctorSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListDoctorSchedulesDto,
  ): Promise<ListDoctorSchedulesResponse[]> {
    return await this.integratorService.listDoctorSchedules(integrationId, dto);
  }

  @ApiTags('Doctor')
  @HttpCode(HttpStatus.OK)
  @Post('findDoctor')
  async findDoctor(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: FindDoctorDto,
  ): Promise<FindDoctorResponse> {
    return await this.integratorService.findDoctor(integrationId, dto);
  }
}
