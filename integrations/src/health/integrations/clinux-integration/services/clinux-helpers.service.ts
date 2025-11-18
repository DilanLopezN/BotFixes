import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import * as sanitizeHtml from 'sanitize-html';
import { formatCPF } from '../../../../common/helpers/format-cpf';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import { ClinuxGetPatientResponse, ClinuxPatient } from '../interfaces/patient.interface';
import { ClinuxListPatientSchedulesResponse } from '../interfaces/schedule.interface';
import { ClinuxApiService } from './clinux-api.service';
import { SchedulingLinksService } from '../../../scheduling/services/scheduling-links.service';
import { PatientSchedules } from '../../../integrator/interfaces';
import { EntityDocument, SpecialityEntity } from '../../../entities/schema';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class ClinuxHelpersService {
  private readonly logger = new Logger(ClinuxHelpersService.name);

  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly clinuxApiService: ClinuxApiService,
    private readonly schedulingLinksService: SchedulingLinksService,
  ) {}

  public convertStartDate(appointmentTimestamp: number, startAppointmentHour: string): string {
    const formatAppointmentDate = 'YYYY-MM-DDTHH:mm:ss';

    const startTime = startAppointmentHour.split(':');
    return moment(appointmentTimestamp)
      .set('hour', Number(startTime[0]))
      .set('minute', Number(startTime[1]))
      .format(formatAppointmentDate);
  }

  public getPatientGender(gender: string): 'M' | 'F' | 'I' {
    if (gender === 'M') {
      return 'M';
    }

    if (gender === 'F') {
      return 'F';
    }

    return 'I';
  }

  public getFormattedPatientPhone(phone: string): string {
    return phone?.replace(/[^0-9]/g, '');
  }

  public replacePatientToClinuxPatient(patient: Patient): ClinuxPatient {
    const clinuxPatient: ClinuxPatient = {
      ds_email: patient.email,
      cd_funcionario: 0,
      cd_paciente: 0,
      ds_paciente: patient.name,
      sn_ativo: true,
      sn_web: false,
      dt_nascimento: moment(patient.bornDate).format('DD/MM/YYYY'),
      ds_sexo: this.getPatientGender(patient.sex),
      ds_cpf: formatCPF(patient.cpf),
      ds_celular: this.getFormattedPatientPhone(patient.cellPhone ?? patient.phone),
    };

    return clinuxPatient;
  }

  public getClinuxProceduresCodes(procedures: string): string[] {
    return Array.from(new Set(procedures.split(/[,;]/).map((codigo: string) => codigo.trim())));
  }

  private getClinuxScheduleStatus(appointment: ClinuxListPatientSchedulesResponse): AppointmentStatus {
    switch (appointment.ds_status) {
      case 'MARCADO':
        return AppointmentStatus.scheduled;

      case 'CANCELADO':
        return AppointmentStatus.canceled;

      default:
        return AppointmentStatus.scheduled;
    }
  }

  public async createPatientAppointmentObject(
    integration: IntegrationDocument,
    schedule: ClinuxListPatientSchedulesResponse,
    patientSchedules?: PatientSchedules,
  ): Promise<RawAppointment> {
    const dateFormat = 'DD/MM/YYYY';
    const appointmentDate = moment(schedule.dt_data, dateFormat);

    const scheduleHours = schedule.dt_hora.split(' - ')[0];

    const proceduresCodes: string[] = this.getClinuxProceduresCodes(schedule.cd_procedimento);

    let validProcedures: EntityDocument[] = [];

    let procedureNameToConcatenate: string[] = [];
    let procedureFriendlyNameToConcatenate: string[] = [];

    // @TODO: fazer isso de outra forma
    let defaultOrganizationId = '-1';
    const organizationUnits = await this.entitiesService.getValidEntities(EntityType.organizationUnit, integration._id);

    if (organizationUnits.length === 1) {
      defaultOrganizationId = organizationUnits[0].code;
    }

    // -1 porque não retorna na request
    const createdPatientObject: RawAppointment = {
      appointmentCode: String(schedule.cd_atendimento),
      appointmentDate: this.convertStartDate(appointmentDate.valueOf(), scheduleHours),
      duration: '-1',
      doctorId: '-1',
      organizationUnitId: defaultOrganizationId,
      specialityId: String(schedule.cd_modalidade),
      insuranceId: '-1',
      status: this.getClinuxScheduleStatus(schedule),
      guidance: null,
      guidanceLink: null,
    };

    if (patientSchedules?.returnGuidance) {
      let completeGuidance: string = '';

      for (const procedureCode of proceduresCodes) {
        const dataGuidance = await this.clinuxApiService.getProcedureGuidance(integration, {
          cd_procedimento: Number(procedureCode),
        });
        if (dataGuidance[0]?.bb_preparo) {
          completeGuidance += this.sanitizeGuidanceText(dataGuidance[0].bb_preparo);
        }
      }

      createdPatientObject.guidance = completeGuidance;

      const { scheduleResumeLink } =
        await this.schedulingLinksService.createSchedulingLinkGroupedByPatientErpCodeAndScheduleCode(integration, {
          integrationId: castObjectIdToString(integration._id),
          patientErpCode: patientSchedules.patientCode,
          patientCpf: patientSchedules.patientCpf,
          scheduleCode: schedule.cd_atendimento.toString(),
          link: `resume/${schedule.cd_atendimento.toString()}`,
        });

      createdPatientObject.guidanceLink = scheduleResumeLink?.shortLink || null;
    }

    try {
      const defaultData: Partial<EntityDocument> = {
        canSchedule: false,
        canReschedule: false,
        canCancel: true,
        canConfirmActive: false,
        canConfirmPassive: true,
        canView: true,
      };

      if (proceduresCodes.length > 0) {
        validProcedures = await this.entitiesService.getValidEntitiesbyCode(
          integration._id,
          proceduresCodes,
          EntityType.procedure,
        );

        let count = 0;
        const limitProceduresToExibit = 3;

        proceduresCodes.forEach((procedureCode: string) => {
          if (count < limitProceduresToExibit) {
            const validatedProcedure = validProcedures.find(
              (procedure: EntityDocument) => procedure.code === procedureCode,
            );

            if (validatedProcedure) {
              procedureNameToConcatenate.push(validatedProcedure.name);
              procedureFriendlyNameToConcatenate.push(validatedProcedure.friendlyName);
              count++;
            }
          }
        });

        if (proceduresCodes.length > limitProceduresToExibit) {
          const remaining = proceduresCodes.length - limitProceduresToExibit;
          procedureNameToConcatenate.push(`e outros ${remaining}`);
          procedureFriendlyNameToConcatenate.push(`e outros ${remaining}`);
        }

        createdPatientObject.procedureDefault = {
          code: proceduresCodes[0],
          name: procedureNameToConcatenate.join(', ') || schedule?.ds_modalidade,
          friendlyName: procedureFriendlyNameToConcatenate.join(', ') || schedule?.ds_modalidade,
          ...defaultData,
        };
      }

      if (schedule.cd_modalidade) {
        const specialityCode = String(schedule.cd_modalidade);
        const specialityType = '-1';

        createdPatientObject.specialityDefault = {
          code: specialityCode,
          specialityType,
          friendlyName: schedule?.ds_modalidade,
          ...defaultData,
        } as Partial<SpecialityEntity>;
      }

      if (schedule?.ds_empresa) {
        createdPatientObject.organizationUnitDefault = {
          code: '-1',
          name: schedule?.ds_empresa,
          friendlyName: schedule?.ds_empresa,
          ...defaultData,
        };
      }
    } catch (err) {
      this.logger.error('ClinuxHelpersService.createPatientApointmentObject', err);
    }

    return createdPatientObject;
  }

  public replaceClinuxPatientToPatient(clinuxPatient: ClinuxGetPatientResponse): Patient {
    return {
      name: clinuxPatient.ds_nome,
      cellPhone: clinuxPatient.ds_celular,
      code: String(clinuxPatient.cd_paciente),
      sex: 'I',
      bornDate: moment(clinuxPatient.dt_nascimento, 'DD/MM/YYYY').format('YYYY-MM-DD'),
      cpf: clinuxPatient.ds_cpf,
    };
  }

  public isBase64(stringToVerify: string): boolean {
    const base64Pattern = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
    return base64Pattern.test(stringToVerify);
  }

  public sanitizeGuidanceText(guidanceText: string): string {
    if (typeof guidanceText === 'string') {
      let guidanceBase64Decoded = null;

      if (this.isBase64(guidanceText)) {
        guidanceBase64Decoded = Buffer.from(guidanceText, 'base64').toString('utf-8');
      }

      return sanitizeHtml(guidanceBase64Decoded, { allowedTags: [], allowedAttributes: {} });
    }
  }
}
