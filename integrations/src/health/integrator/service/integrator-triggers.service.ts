import { Injectable, Logger } from '@nestjs/common';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { IntegrationCacheUtilsService } from '../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { Patient } from '../../interfaces/patient.interface';
import { CreateSchedulePatient } from '../interfaces/create-schedule.interface';
import { IIntegratorService } from '../interfaces/integrator-service.interface';
import * as contextService from 'request-context';
import { PatientDataService } from '../../patient-data/patient-data.service';

export enum TriggerType {
  updatePatientBeforeCreateSchedule = 'updatePatientBeforeCreateSchedule',
  createPatientWhenIdentifyingThem = 'createPatientWhenIdentifyingThem',
}

@Injectable()
export class IntegratorTriggersService {
  private logger = new Logger(IntegratorTriggersService.name);

  constructor(
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly patientDataService: PatientDataService,
  ) {}

  public haveTrigger(integration: IntegrationDocument, trigger: TriggerType): boolean {
    switch (trigger) {
      case TriggerType.updatePatientBeforeCreateSchedule:
        return (
          integration.rules?.updatePatientEmailBeforeCreateSchedule ||
          integration.rules?.updatePatientPhoneBeforeCreateSchedule ||
          integration.rules?.updatePatientSexBeforeCreateSchedule
        );

      default:
        return false;
    }
  }

  public async trigger<T>(
    integration: IntegrationDocument,
    service: IIntegratorService,
    trigger: TriggerType,
    data: any,
  ): Promise<T> {
    switch (trigger) {
      case TriggerType.updatePatientBeforeCreateSchedule:
        return this.updatePatientBeforeCreateSchedule(integration, service, data) as T;

      case TriggerType.createPatientWhenIdentifyingThem:
        return this.createPatientWhenIdentifyingThem(integration, service, data) as T;

      default:
        return { ok: true } as T;
    }
  }

  private async updatePatientBeforeCreateSchedule(
    integration: IntegrationDocument,
    service: IIntegratorService,
    patient: CreateSchedulePatient,
  ): Promise<OkResponse> {
    let patientCache: Patient = await this.integrationCacheUtilsService.getPatientFromCache(
      integration,
      patient.code,
      patient.cpf,
    );

    if (!patientCache) {
      patientCache = await service.getPatient(integration, {
        code: patient.code,
        bornDate: patient.bornDate,
      });
    }

    let canUpdatePatient = false;
    const newPatient: Patient = { ...patientCache };

    if (integration.rules?.updatePatientSexBeforeCreateSchedule && patientCache.sex !== patient.sex && !!patient.sex) {
      canUpdatePatient = true;
      newPatient.sex = patient.sex;
    }

    if (
      integration.rules?.updatePatientEmailBeforeCreateSchedule &&
      patientCache.email !== patient.email &&
      !!patient.email
    ) {
      canUpdatePatient = true;
      newPatient.email = patient.email;
    }

    if (integration.rules?.updatePatientPhoneBeforeCreateSchedule) {
      if (patient.phone !== undefined && patient.phone !== '' && patientCache.phone !== patient.phone) {
        canUpdatePatient = true;
        newPatient.phone = patient.phone;
      }

      if (patient.cellPhone !== undefined && patient.cellPhone !== '' && patientCache.cellPhone !== patient.cellPhone) {
        canUpdatePatient = true;
        newPatient.cellPhone = patient.cellPhone;
      }
    }

    if (!canUpdatePatient) {
      return { ok: true };
    }

    try {
      await service?.updatePatient(integration, patient.code, {
        patient: newPatient,
      });
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  private async createPatientWhenIdentifyingThem(
    integration: IntegrationDocument,
    _: IIntegratorService,
    patient: Patient,
  ) {
    const metadata = contextService.get('req:default-headers');
    const canCreatePatient =
      process.env.NODE_ENV === 'local' || !['emulator', 'webemulator', 'webchat'].includes(metadata?.channelId);

    if (patient && metadata && canCreatePatient) {
      try {
        await this.patientDataService.createPatient(integration, {
          cpf: patient.cpf,
          name: patient.name,
          bornDate: patient.bornDate,
          erpCode: patient.code,
          phone: metadata.memberId,
          erpLegacyCode: patient?.data?.erpId ?? null,
          email: patient.email,
          workspaceId: metadata.workspaceId,
        });
      } catch (error) {
        console.error(error);
        this.logger.error('IntegratorTriggersService.createPatientWhenIdentifyingThem', error);
      }
    }
  }
}
