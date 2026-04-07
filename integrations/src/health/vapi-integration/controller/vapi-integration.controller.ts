import { Controller, Post, Get, Param, Body, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { VapiIntegrationService } from '../services/vapi-integration.service';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { ListAvailableSchedulesInputDto, ListAvailableSchedulesOutputDto } from '../dto/list-available-schedules.dto';
import { ListAvailableSchedulesOutput } from '../interfaces/available-schedules.interface';
import { ListDoctorOutputDto } from '../dto/list-doctor.dto';
import { ListOrganizationUnitOutputDto } from '../dto/list-organization-unit.dto';
import { ListInsuranceOutputDto } from '../dto/list-insurance.dto';
import { SearchPatientInputDto, SearchPatientOutputDto } from '../dto/search-patient.dto';
import { CreateScheduleOutputDto } from '../dto/create-schedule.dto';
import { SaveVapiDataInputDto, SaveVapiDataOutputDto } from '../dto/save-vapi-data.dto';
import { SendMessageInputDto, SendMessageOutputDto } from '../dto/send-message.dto';
import { CallIdDto } from '../dto/call-id-body.dto';
import { GenerateCallIdOutputDto } from '../dto/generate-call-id.dto';
import { GetVapiDataOutputDto, GetVapiDataQueryDto } from '../dto/get-vapi-data.dto';
import { DoctorOutput, InsuranceOutput, OrganizationUnitOutput } from '../interfaces/entities-output.interface';
import { Patient } from '../../interfaces/patient.interface';
import { CreateScheduleOutput } from '../interfaces/create-schedule.interface';

@Controller({
  path: 'integration/:integrationId/vapi-integration',
})
export class VapiIntegrationController {
  constructor(private readonly vapiIntegrationService: VapiIntegrationService) {}

  @Get('generateCallId')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: GenerateCallIdOutputDto })
  async generateCallId(): Promise<GenerateCallIdOutputDto> {
    const callId = this.vapiIntegrationService.generateCallId();
    return {
      callId: callId,
    };
  }

  @Get('getData')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: GetVapiDataOutputDto })
  async getVapiData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query(new ValidationPipe()) query: GetVapiDataQueryDto,
  ): Promise<GetVapiDataOutputDto> {
    const data = await this.vapiIntegrationService.getVapiData(integrationId, query.callId);
    return { data };
  }

  @Post('saveData')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: SaveVapiDataOutputDto })
  async saveVapiData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) saveVapiDataDto: SaveVapiDataInputDto,
  ): Promise<SaveVapiDataOutputDto> {
    const { callId, ...dataToSave } = saveVapiDataDto;
    await this.vapiIntegrationService.saveVapiData(integrationId, callId, dataToSave);
    return {
      message: 'Data saved successfully',
      integrationId: integrationId,
    };
  }

  @Post('availableSchedules')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: ListAvailableSchedulesOutputDto })
  async listAvailableSchedules(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe({ transform: true })) listAvailableSchedulesDto: ListAvailableSchedulesInputDto,
  ): Promise<ListAvailableSchedulesOutput> {
    const { callId, ...input } = listAvailableSchedulesDto;
    return this.vapiIntegrationService.listAvailableSchedules(integrationId, callId, input);
  }

  @Post('doctors')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: true, status: 200, type: ListDoctorOutputDto })
  async listDoctors(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) callIdDto: CallIdDto,
  ): Promise<DoctorOutput[]> {
    return this.vapiIntegrationService.listDoctors(integrationId, callIdDto.callId);
  }

  @Post('organizationUnits')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: true, status: 200, type: ListOrganizationUnitOutputDto })
  async listOrganizationUnits(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) callIdDto: CallIdDto,
  ): Promise<OrganizationUnitOutput[]> {
    return this.vapiIntegrationService.listOrganizationUnits(integrationId, callIdDto.callId);
  }

  @Post('insurances')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: true, status: 200, type: ListInsuranceOutputDto })
  async listInsurances(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) callIdDto: CallIdDto,
  ): Promise<InsuranceOutput[]> {
    return this.vapiIntegrationService.listInsurances(integrationId, callIdDto.callId);
  }

  @Post('searchPatient')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: SearchPatientOutputDto })
  async searchPatient(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) searchPatientDto: SearchPatientInputDto,
  ): Promise<Patient> {
    const { callId, ...filters } = searchPatientDto;
    return this.vapiIntegrationService.searchPatient(integrationId, filters);
  }

  @Post('createSchedule')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: CreateScheduleOutputDto })
  async createSchedule(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) callIdDto: CallIdDto,
  ): Promise<CreateScheduleOutput> {
    return this.vapiIntegrationService.createSchedule(integrationId, callIdDto.callId);
  }

  @Post('sendMessage')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({ isArray: false, status: 200, type: SendMessageOutputDto })
  async sendMessage(
    @Param('integrationId') integrationId: string,
    @Body(new ValidationPipe()) sendMessageDto: SendMessageInputDto,
  ): Promise<SendMessageOutputDto> {
    await this.vapiIntegrationService.sendMessage(integrationId, sendMessageDto);
    return { ok: true, message: 'Message enqueued successfully' };
  }

  @Post('runSendMessageCron')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Vapi Integration')
  @ApiResponse({
    status: 200,
    description:
      'Força a execução do job do cron que enfileira mensagens VAPI pendentes (considera todas as integrações).',
    schema: { properties: { enqueued: { type: 'number' } } },
  })
  async runSendMessageCron(): Promise<{ enqueued: number }> {
    return this.vapiIntegrationService.enqueuePendingVapiMessages();
  }
}
