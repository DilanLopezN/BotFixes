import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditInterceptor } from '../../../common/interceptors/audit.interceptor';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { EntityTypePipe } from '../../../common/pipes/entity-type.pipe';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { FlowAction } from '../../flow/interfaces/flow.interface';
import {
  Appointment,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../interfaces/appointment.interface';
import { ConfirmationSchedule } from '../../interfaces/confirmation-schedule.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityType, EntityTypes } from '../../interfaces/entity.interface';
import { OnDutyMedicalScale } from '../../interfaces/on-duty-medical-scale.interface';
import { Patient } from '../../interfaces/patient.interface';
import {
  AppointmentValueDto,
  CancelAppointmentDto,
  ConfirmAppointmentDto,
  CreateAppointmentDto,
  CreatePatientDto,
  EntityListByTextDto,
  EntityListDto,
  ExternalInsuranceDto,
  GetPatientQueryDto,
  ListAvailableSchedulesDto,
  ListReasonsDto,
  ListSchedulesToConfirmDto,
  MatchFlowsDto,
  MultipleEntitiesFilterDto,
  PatientFollowUpSchedulesQueryDto,
  PatientSchedulesDto,
  RescheduleDto,
  UpdatePatientDto,
  ListPatientSuggestedDataDto,
  RecoverAccessProtocolDto,
} from '../dto';
import { EntityListResponse, EntityListTextResponse } from '../interfaces/entities-list.interface';
import { IntegratorService } from '../service/integrator.service';
import { OmitAudit } from '../../../common/decorators/audit.decorator';
import { GetPatientByCodeQueryDto } from '../dto/get-patient-by-code.dto';
import { ValidatePatientRecoverAccessProtocol } from '../../integrations/matrix-integration/interfaces/recover-password.interface';
import { PatientSuggestedDoctors, PatientSuggestedInsurances } from '../interfaces';
import { RecoverAccessProtocolResponse } from 'kissbot-health-core';
import { ValidateCpfOrCode } from '../decorators/get-patient.decorator';

@UseInterceptors(AuditInterceptor)
@Controller({
  path: 'integration/:integrationId/health',
})
export class IntegratorController {
  private logger = new Logger(IntegratorController.name);
  private readonly debug = process.env.NODE_ENV === 'local' && false;

  constructor(private readonly integratorService: IntegratorService) {}

  private debugRequest(data: any) {
    if (this.debug) {
      this.logger.debug(JSON.stringify(data));
    }
  }

  @ApiTags('Status')
  @OmitAudit()
  @Get('status')
  async getStatus(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<OkResponse> {
    return await this.integratorService.getStatus(integrationId);
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Get('patient')
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  @ApiResponse({ status: HttpStatus.OK })
  async getPatient(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @ValidateCpfOrCode()
    @Query()
    queryDto: GetPatientQueryDto,
  ): Promise<Patient> {
    this.debugRequest(queryDto);
    return await this.integratorService.getPatient(integrationId, {
      bornDate: queryDto.bornDate,
      code: queryDto.code,
      cpf: queryDto.cpf,
      name: queryDto?.name,
      phone: queryDto?.phone,
      motherName: queryDto?.motherName,
      cache: queryDto?.cache ?? true,
    });
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Get('patient-by-code')
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  @ApiResponse({ status: HttpStatus.OK })
  async getPatientByCode(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query() queryDto: GetPatientByCodeQueryDto,
  ): Promise<Patient> {
    this.debugRequest(queryDto);
    return await this.integratorService.getPatientByCode(integrationId, {
      code: queryDto.code,
    });
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Post('patient')
  async createPatient(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: CreatePatientDto,
  ): Promise<Patient> {
    this.debugRequest(dto);
    return await this.integratorService.createPatient(integrationId, {
      organizationUnit: dto.organizationUnit,
      patient: dto.patient,
    });
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Get('patient-follow-up-appointments')
  async getPatientFollowUpSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query() dto: PatientFollowUpSchedulesQueryDto,
  ): Promise<FollowUpAppointment[]> {
    this.debugRequest(dto);
    return await this.integratorService.getPatientFollowUpSchedules(integrationId, {
      patientCode: dto.patientCode,
    });
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('patient-appointments')
  async getPatientSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body() dto: PatientSchedulesDto,
  ): Promise<Appointment[]> {
    this.debugRequest(dto);
    return await this.integratorService.getPatientSchedules(integrationId, {
      patientCode: dto.patient.code,
      patientCpf: dto.patient.cpf,
      patientName: dto.patient.name,
      patientPhone: dto.patient.phone,
      patientBornDate: dto.patient.bornDate,
      ...dto,
    });
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Put('patient/:patientCode')
  async updatePatient(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Param('patientCode') patientCode: string,
    @Body(new ValidationPipe()) dto: UpdatePatientDto,
  ): Promise<Patient> {
    this.debugRequest(dto);
    return await this.integratorService.updatePatient(integrationId, patientCode, {
      patient: dto.patient,
    });
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('minified-patient-appointments')
  async minifiedPatientSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body() dto: PatientSchedulesDto,
  ): Promise<MinifiedAppointments> {
    this.debugRequest(dto);
    return await this.integratorService.getMinifiedPatientSchedules(integrationId, {
      patientCode: dto.patient.code,
      patientCpf: dto.patient.cpf,
      patientName: dto.patient.name,
      patientPhone: dto.patient.phone,
      patientBornDate: dto.patient.bornDate,
      ...dto,
    });
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @Post('appointment')
  async createSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    this.debugRequest(dto);
    return await this.integratorService.createSchedule(integrationId, dto);
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @Post('appointments')
  async listAvailableSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListAvailableSchedulesDto,
  ) {
    this.debugRequest(dto);
    return await this.integratorService.getAvailableSchedules(integrationId, dto);
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('cancel-appointment')
  async cancelSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: CancelAppointmentDto,
  ): Promise<OkResponse> {
    this.debugRequest(dto);
    return await this.integratorService.cancelSchedule(integrationId, dto);
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('confirm-appointment')
  async confirmSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ConfirmAppointmentDto,
  ) {
    this.debugRequest(dto);
    return await this.integratorService.confirmSchedule(integrationId, dto);
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @Post('appointment-value')
  async getScheduleValue(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: AppointmentValueDto,
  ): Promise<AppointmentValue> {
    this.debugRequest(dto);
    return await this.integratorService.getScheduleValue(integrationId, dto);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @Get('integrator/extract/:entityType')
  async extractSingleEntity(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Param('entityType', EntityTypePipe) entityType: EntityType,
  ): Promise<EntityTypes[]> {
    return await this.integratorService.extractSingleEntity(integrationId, entityType);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @Get('integrator/extract-all')
  async extractAllEntities(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<OkResponse> {
    return await this.integratorService.extractAllEntities(integrationId);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @Post('integrator/synchronize-entities')
  async synchronizeEntities(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<OkResponse> {
    return await this.integratorService.synchronizeEntities(integrationId);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @Post('integrator/synchronize-entities/:entityType')
  async synchronizeEntitieByEntityType(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Param('entityType', EntityTypePipe) entityType: EntityType,
  ): Promise<OkResponse> {
    return await this.integratorService.synchronizeEntities(integrationId, entityType);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @Post('integrator/multiple-entities-filter')
  async getMultipleEntitiesByFilter(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) multipleEntitiesFilterDto: MultipleEntitiesFilterDto,
  ): Promise<CorrelationFilter> {
    this.debugRequest(multipleEntitiesFilterDto);
    const { filter } = multipleEntitiesFilterDto;
    return await this.integratorService.getMultipleEntitiesByFilter(integrationId, filter);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @Post('integrator/entity-list-by-text')
  async getEntityListByText(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) entityListByTextDto: EntityListByTextDto,
  ): Promise<EntityListTextResponse> {
    this.debugRequest(entityListByTextDto);

    if (entityListByTextDto.cache === null || entityListByTextDto.cache === undefined) {
      entityListByTextDto.cache = true;
    }

    const { text, patient, cache } = entityListByTextDto;
    return await this.integratorService.getEntityListByText(integrationId, {
      ...entityListByTextDto,
      text: text.trim(),
      patient,
      cache,
    });
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @Post('integrator/entities')
  async listEntities(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) entityListDto: EntityListDto,
  ): Promise<EntityListResponse> {
    this.debugRequest(entityListDto);

    if (entityListDto.cache === null || entityListDto.cache === undefined) {
      entityListDto.cache = true;
    }

    const { patient, cache } = entityListDto;
    return await this.integratorService.getEntityList(integrationId, {
      ...entityListDto,
      patient,
      cache,
    });
  }

  @ApiTags('Entities')
  @OmitAudit()
  @Post('integrator/entities-validate')
  async listEntitiesToValidate(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) entityListDto: EntityListDto,
  ) {
    this.debugRequest(entityListDto);
    const { data: entities } = await this.integratorService.getEntityList(integrationId, {
      ...entityListDto,
      patient: {},
      cache: false,
    });

    if (!entities?.length) {
      throw new BadRequestException('Nenhuma entidade encontrada');
    }

    return [];
  }

  @ApiTags('Eligibility')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @HttpCode(HttpStatus.OK)
  @Post('integrator/insurance/eligibility')
  async getExternalInsurances(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ExternalInsuranceDto,
  ): Promise<CorrelationFilter> {
    const { patient } = dto;
    return await this.integratorService.getEntitiesFromInsurance(integrationId, {
      ...dto,
      patient: {
        bornDate: patient.bornDate,
        cpf: patient.cpf,
        sex: patient.sex,
      },
    });
  }

  @ApiTags('Flow')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @HttpCode(HttpStatus.OK)
  @Post('integrator/match-flows')
  async matchFlowsFromFilters(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: MatchFlowsDto,
  ): Promise<FlowAction[]> {
    this.debugRequest(dto);
    const { filter: filters, patient, periodOfDay } = dto;
    return await this.integratorService.matchFlowsFromFilters(integrationId, {
      ...dto,
      filters,
      patientBornDate: patient?.bornDate,
      patientSex: patient?.sex,
      periodOfDay,
      patientCpf: patient?.cpf,
    });
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @Post('reschedule')
  async reschedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: RescheduleDto,
  ): Promise<Appointment> {
    this.debugRequest(dto);
    return await this.integratorService.reschedule(integrationId, {
      ...dto,
      patient: {
        code: dto.patient.code,
        bornDate: dto.patient.bornDate,
        insuranceNumber: dto.patient.insuranceNumber,
      },
    });
  }

  @ApiTags('Cache')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @HttpCode(HttpStatus.OK)
  @Post('clear-cache')
  async clearCache(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<OkResponse> {
    return await this.integratorService.clearCache(integrationId);
  }

  @ApiTags('Erp')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('listOnDutyMedicalScale')
  async listOnDutyMedicalScale(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
  ): Promise<OnDutyMedicalScale[]> {
    return await this.integratorService.listOnDutyMedicalScale(integrationId);
  }

  @ApiTags('Schedule')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('listSchedulesToConfirm')
  async listSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListSchedulesToConfirmDto,
  ): Promise<ConfirmationSchedule> {
    return await this.integratorService.listSchedulesToConfirm(integrationId, dto);
  }

  @ApiTags('Entities')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @HttpCode(HttpStatus.OK)
  @Post('integrator/listReasonsForNotScheduling')
  async listReasonsForNotScheduling(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListReasonsDto,
  ): Promise<EntityListResponse> {
    return await this.integratorService.listReasonsForNotScheduling(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Post('listPatientSuggestedInsurances')
  async listPatientSuggestedInsurances(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListPatientSuggestedDataDto,
  ): Promise<PatientSuggestedInsurances> {
    this.debugRequest(dto);
    return await this.integratorService.listPatientSuggestedInsurances(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @Post('listPatientSuggestedDoctors')
  async listPatientSuggestedDoctors(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: ListPatientSuggestedDataDto,
  ): Promise<PatientSuggestedDoctors> {
    this.debugRequest(dto);
    return await this.integratorService.listPatientSuggestedDoctors(integrationId, dto);
  }

  @ApiTags('Patient')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('patient/validatePatientRecoverAccessProtocol')
  async validateRecoverPassword(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body() dto: ValidatePatientRecoverAccessProtocol,
  ): Promise<{ ok: boolean }> {
    this.debugRequest(dto);
    return await this.integratorService.validateRecoverAccessProtocol(integrationId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiTags('Protocol')
  @UseGuards(AuthGuard)
  @Post('recoverAccessProtocol')
  async recoverAccessProtocol(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: RecoverAccessProtocolDto,
  ): Promise<RecoverAccessProtocolResponse> {
    this.debugRequest(dto);
    return this.integratorService.recoverAccessProtocol(integrationId, dto);
  }

  @ApiTags('Import')
  @UseGuards(AuthGuard)
  @OmitAudit()
  @HttpCode(HttpStatus.OK)
  @Post('importProceduresEmbeddings')
  async importProceduresEmbeddings(@Param('integrationId', ObjectIdPipe) integrationId: string): Promise<OkResponse> {
    return await this.integratorService.importProceduresEmbeddings(integrationId);
  }
}
