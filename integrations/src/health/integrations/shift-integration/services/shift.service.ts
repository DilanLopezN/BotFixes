import { Injectable, Logger, NotImplementedException, BadRequestException, HttpStatus } from '@nestjs/common';
import { Readable } from 'stream';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { Appointment, AppointmentValue, MinifiedAppointments } from '../../../interfaces/appointment.interface';
import { Patient } from '../../../interfaces/patient.interface';
import {
  ListAvailableSchedulesResponse,
  IIntegratorService,
  ListAvailableMedicalReportsTokenData,
  CountAvailableMedicalReportsResponse,
  ListAvailableMedicalReports,
  ListAvailableMedicalReportsByPatientCode,
  AvailableMedicalReportsByScheduleCode,
  ValidPatientReportDownloadRequest,
  HasAvailableMedicalReportsFilterRequest,
  HasAvailableMedicalReportsFilterResponse,
} from '../../../integrator/interfaces';
import { EntityTypes } from '../../../interfaces/entity.interface';
import { EntityDocument } from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { DownloadMedicalReportTokenData } from '../../../scheduling/interfaces/download-token.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { ReportSending } from 'kissbot-health-core';
import { IntegrationService } from '../../../integration/integration.service';
import { SchedulingLinksService } from '../../../scheduling/services/scheduling-links.service';
import { SchedulingDownloadReportService } from '../../../scheduling/services/scheduling-download-report.service';
import { ApiQueueService, EndpointType, Message } from '../../../api/services/api-queue.service';
import { AuditService } from '../../../audit/services/audit.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import * as moment from 'moment';
import { ShiftApiService } from './shift-api.service';
import { HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';

@Injectable()
export class ShiftService implements IIntegratorService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly integrationService: IntegrationService,
    private readonly schedulingLinksService: SchedulingLinksService,
    private readonly schedulingDownloadReportService: SchedulingDownloadReportService,
    private readonly apiQueueService: ApiQueueService,
    private readonly auditService: AuditService,
    private readonly shiftApiService: ShiftApiService,
  ) {}

  // ==================== Required Methods (Mocked) ====================

  async cancelSchedule(): Promise<OkResponse> {
    // TODO: Implement cancelSchedule for Shift ERP
    throw new NotImplementedException('cancelSchedule not implemented yet for Shift integration');
  }

  async confirmSchedule(): Promise<OkResponse> {
    // TODO: Implement confirmSchedule for Shift ERP
    throw new NotImplementedException('confirmSchedule not implemented yet for Shift integration');
  }

  async createSchedule(): Promise<Appointment> {
    // TODO: Implement createSchedule for Shift ERP
    throw new NotImplementedException('createSchedule not implemented yet for Shift integration');
  }

  async createPatient(): Promise<Patient> {
    // TODO: Implement createPatient for Shift ERP
    throw new NotImplementedException('createPatient not implemented yet for Shift integration');
  }

  async extractSingleEntity(): Promise<EntityTypes[]> {
    // TODO: Implement extractSingleEntity for Shift ERP
    return [];
  }

  async getAvailableSchedules(): Promise<ListAvailableSchedulesResponse> {
    // TODO: Implement getAvailableSchedules for Shift ERP
    return {
      schedules: [],
    };
  }

  async getScheduleValue(): Promise<AppointmentValue> {
    // TODO: Implement getScheduleValue for Shift ERP
    return {
      value: 'Consulte a clínica',
      currency: 'R$',
    };
  }

  async getEntityList(): Promise<EntityDocument[]> {
    // TODO: Implement getEntityList for Shift ERP
    return [];
  }

  async getMinifiedPatientSchedules(): Promise<MinifiedAppointments> {
    // TODO: Implement getMinifiedPatientSchedules for Shift ERP
    return {
      appointmentList: [],
      lastAppointment: null,
      nextAppointment: null,
    };
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(): Promise<Patient> {
    // TODO: Implement getPatient for Shift ERP
    return null;
  }

  async getPatientSchedules(): Promise<Appointment[]> {
    // TODO: Implement getPatientSchedules for Shift ERP
    return [];
  }

  async getStatus(): Promise<OkResponse> {
    // TODO: Implement getStatus for Shift ERP
    return { ok: true };
  }

  async reschedule(): Promise<Appointment> {
    // TODO: Implement reschedule for Shift ERP
    throw new NotImplementedException('reschedule not implemented yet for Shift integration');
  }

  async updatePatient(): Promise<Patient> {
    // TODO: Implement updatePatient for Shift ERP
    throw new NotImplementedException('updatePatient not implemented yet for Shift integration');
  }

  // ==================== Medical Report Methods (Optional - Implemented) ====================

  async downloadMedicalReport(
    _integration: IntegrationDocument,
    data: DownloadMedicalReportTokenData,
  ): Promise<Readable> {
    try {
      const url = await this.getMedicalReportUrl(_integration, data);
      return await this.shiftApiService.downloadPdf(url);
    } catch (error) {
      this.logger.error(`Error downloading medical report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMedicalReportUrl(_integration: IntegrationDocument, data: DownloadMedicalReportTokenData): Promise<string> {
    const customData = data.customData as { reportUrl: string };

    if (!customData || !customData.reportUrl) {
      throw new Error('Medical report URL not found in token');
    }
    return customData.reportUrl;
  }

  async listAvailableMedicalReports(): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReports>> {
    // TODO: Implement listAvailableMedicalReports for Shift ERP
    // This should return a list of available medical reports with count
    return {
      count: 0,
      data: [],
    };
  }

  async listAvailableMedicalReportsByPatientCode(
    integration: IntegrationDocument,
    data: ListAvailableMedicalReportsTokenData,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReportsByPatientCode>> {
    try {
      if (!data.patientCpf || !data.patientBirthDate) {
        return { count: 0, data: [] };
      }

      // Consulta os laudos do paciente
      const laudosResponse = await this.shiftApiService.consultaLaudos(
        integration,
        data.patientCpf,
        data.patientBirthDate,
      );

      if (!laudosResponse.atendimento || laudosResponse.atendimento.length === 0) {
        return { count: 0, data: [] };
      }

      // Mapeia os atendimentos para o formato esperado
      const schedulings: AvailableMedicalReportsByScheduleCode[] = [];

      for (const atendimento of laudosResponse.atendimento.filter((a) => a.urlPdfResultado)) {
        const scheduleDate = moment(`${atendimento.dataCadastro} ${atendimento.horaCadastro}`, 'YYYY-MM-DD HH:mm:ss');

        const procName = `Laudo Completo - ${scheduleDate.format('DD/MM/YYYY')}`;
        const modality = `Laudo Completo - ${scheduleDate.format('DD/MM/YYYY')}`;

        // Cria o link de download usando o método do serviço
        const downloadMedicalReportLink = this.schedulingDownloadReportService.createDownloadMedicalReportLink(
          castObjectIdToString(integration._id),
          data.patientCode,
          data.shortId,
          atendimento.codigoOs,
          atendimento.codigoOs,
          modality,
          null,
          {
            patientCpf: data.patientCpf,
            patientBirthDate: data.patientBirthDate,
            reportUrl: atendimento.urlPdfResultado,
          },
          false,
        );

        const reportLinks = [
          {
            modality,
            link: downloadMedicalReportLink,
          },
        ];

        schedulings.push({
          scheduleCode: atendimento.codigoOs,
          groupScheduleCode: atendimento.codigoOs, // Shift não tem conceito de grupo separado
          scheduleDate: scheduleDate.toISOString(),
          procedureName: procName,
          reportLinks,
        });
      }

      const report: ListAvailableMedicalReportsByPatientCode = {
        patientName: laudosResponse.paciente.nome,
        schedulings,
      };

      return {
        count: schedulings.length,
        data: [report],
      };
    } catch (error) {
      // Tratamento específico para erros da API Shift (como data de nascimento divergente)
      if (error instanceof BadRequestException) {
        // this.logger.warn(`Shift API validation error: ${error.message}`);
        // return { count: 0, data: [] };
        throw error;
      }

      this.logger.error(`Error listing medical reports by patient code: ${error.message}`, error.stack);
      return { count: 0, data: [] };
    }
  }

  async validatePatientReportDownload(
    integration: IntegrationDocument,
    body: ValidPatientReportDownloadRequest,
  ): Promise<boolean> {
    // Não tem como validar o usuário pois não existe rota pra isso no shift
    // O body.patientCode vem do token e o body.patientCpf vem da requisição do front
    // No momento do envio da shift a gente popula tanto o patientCode e o patientCpf
    // com o mesmo dado do CPF por isso essa validação vai funcionar.
    if (body.patientCpf !== body.patientCode) {
      throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
    }

    try {
      await this.shiftApiService.consultaLaudos(integration, body.patientCpf, body.patientBirthDate);

      // Se a consulta foi bem-sucedida, os dados estão corretos
      return body.patientCpf == body.patientCode;
    } catch (error) {
      // Se consultaLaudos lançou BadRequestException (erro 200 da API com errorMessage),
      // valida se é erro de data de nascimento divergente
      if (error instanceof BadRequestException) {
        const errorMessage = error.message || '';

        // Verifica se o erro é especificamente sobre data de nascimento divergente
        if (errorMessage.includes('Data de nascimento divergente')) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'Patient Cpf or BornDate is a mismatch',
            undefined,
            true,
          );
        }
      }

      // Para outros tipos de erro, re-lança
      throw error;
    }
  }

  async hasAvailableMedicalReports(
    _integration: IntegrationDocument,
    _data: any,
    filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse> {
    try {
      // Para verificar se há laudos, precisamos ter CPF e data de nascimento
      // Esses dados normalmente vêm do filter ou precisam ser buscados do paciente
      if (!filter.scheduleCode) {
        return { ok: false };
      }

      // Busca informações do paciente através do scheduleCode
      // Nota: Isso requer uma implementação que busque o paciente pelo scheduleCode
      // Por enquanto, vamos retornar false se não tivermos os dados necessários

      // TODO: Implementar busca de paciente por scheduleCode para obter CPF e data de nascimento
      // e então consultar a API do Shift para verificar se há laudos disponíveis

      this.logger.warn('hasAvailableMedicalReports not fully implemented - requires patient lookup');
      return { ok: false };
    } catch (error) {
      this.logger.error(`Error checking available medical reports: ${error.message}`, error.stack);
      return { ok: false };
    }
  }

  // ==================== Report Sending ====================

  /**
   * Processa notificação de envio de laudo do ERP Shift
   * @param payload - Dados do laudo enviado
   * @returns OkResponse
   */
  async reportSending(payload: ReportSending): Promise<OkResponse> {
    try {
      // Envia evento de auditoria
      this.auditService.sendAuditEvent({
        dataType: AuditDataType.internalResponse,
        integrationId: castObjectIdToString(payload.integrationId),
        data: [payload],
        identifier: 'REPORT_SENDING_FROM_SHIFT',
      });

      // Busca a integração
      const integration = await this.integrationService.getOne(payload.integrationId);

      // Valida se tem apiToken e scheduling ativo
      const { apiToken } = integration?.reportConfig || {};
      if (!apiToken || !integration.scheduling?.active) {
        throw Error('Need integration apiToken and scheduling is active');
      }

      // Cria os dados para gerar o link de agendamento
      const data = {
        integrationId: castObjectIdToString(integration._id),
        patientErpCode: payload.patientCode,
        patientCpf: payload.patientCpf,
        scheduleCode: payload.scheduleCode,
        link: 'documents',
      };

      // Cria o link de agendamento
      const { scheduleResumeLink } =
        await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(integration, data);

      // Monta a mensagem para enviar
      const message: Message = {
        messageBody: {
          integrationId: integration._id.toString(),
          id: payload.patientCode,
          phone: payload.phoneNumber,
          token: apiToken,
          internalId: payload.id ? String(payload.id) : null,
          sendType: 'medical_report',
          attributes: [
            {
              name: 'nome_paciente',
              value: payload.patientName,
            },
            {
              name: 'URL_0',
              value: `${scheduleResumeLink.shortPathLink}`,
            },
            {
              name: 'link',
              value: `${scheduleResumeLink.shortPathLink}`,
            },
          ],
        },
        callback: () => ({ ok: true }),
        config: { endpointType: EndpointType.DEFAULT },
      };

      // Enfileira a mensagem
      await this.apiQueueService.enqueue([message]);

      this.logger.log(`Report sending processed successfully for patient: ${payload.patientCode}`);
      return { ok: true };
    } catch (error) {
      this.logger.error('Error processing reportSending:', error);
      throw error;
    }
  }
}
