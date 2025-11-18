import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment';
import { Appointment } from 'kissbot-entities';
import { ANALYTICS_CONNECTION_NAME } from '../../ormconfig';
import { ListPreviousInsurances, PreviousInsurances } from './interfaces/list-previous-insurances.interface';
import { PatientDataService } from '../../patient-data/patient-data.service';
import { AuditDataType, AuditIdentifier } from '../../audit/audit.interface';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectRepository(Appointment, ANALYTICS_CONNECTION_NAME)
    private appointmentRepository: Repository<Appointment>,
    private readonly patientDataService: PatientDataService,
    private readonly auditService: AuditService,
  ) {}

  public async listPreviousInsurances({
    integrationId,
    patientPhone,
    patientBornDate,
    patientCode,
    patientCpf,
    insuranceCodesToIgnore,
  }: ListPreviousInsurances): Promise<PreviousInsurances[]> {
    const defaultAuditData = {
      dataType: AuditDataType.code,
      integrationId: integrationId,
      identifier: AuditIdentifier.listPreviousInsurances,
    };

    try {
      const patient = await this.patientDataService.getPatientByCodeOrCpfOrPhoneAndBornDate(integrationId, {
        phone: patientPhone,
        bornDate: moment.utc(patientBornDate).startOf('day').valueOf(),
        erpCode: patientCode,
        cpf: patientCpf,
      });

      this.auditService.sendAuditEvent({
        ...defaultAuditData,
        data: {
          msg: 'Busca de paciente na sugestão de convênio',
          data: patient,
        },
      });

      const schedulesQuery = this.appointmentRepository
        .createQueryBuilder('appointment')
        .select([
          'appointment.insuranceCode as "insuranceCode"',
          'appointment.insurancePlanCode as "insurancePlanCode"',
          'appointment.insuranceSubPlanCode as "insuranceSubPlanCode"',
          'appointment.insuranceCategoryCode as "insuranceCategoryCode"',
          'appointment.appointmentCode as "appointmentCode"',
          'appointment.appointmentStatus as "appointmentStatus"',
        ])
        .where('appointment.integrationId = :integrationId', { integrationId })
        .andWhere('appointment.timestamp >= :timestamp', { timestamp: moment().subtract(1, 'year').valueOf() })
        .andWhere('appointment.insuranceCode IS NOT NULL');

      if (insuranceCodesToIgnore?.length) {
        schedulesQuery.andWhere('appointment.insuranceCode NOT IN(:...insuranceCodes)', {
          insuranceCodes: insuranceCodesToIgnore,
        });
      }

      if (patient?.erpCode) {
        schedulesQuery.andWhere('appointment.patientCode = :patientCode', { patientCode: patient.erpCode });
      } else {
        return [];
      }

      const schedules = await schedulesQuery
        .take(2)
        .orderBy({
          'CASE WHEN appointment.appointmentStatus IN (1) THEN 0 ELSE 1 END': 'ASC',
          'appointment.appointmentStatus': 'ASC',
          "NULLIF(appointment.insurancePlanCode, '')": 'ASC',
          "NULLIF(appointment.insuranceSubPlanCode, '')": 'ASC',
          "NULLIF(appointment.insuranceCategoryCode, '')": 'ASC',
          'appointment.timestamp': 'DESC',
        })
        .getRawMany();

      this.auditService.sendAuditEvent({
        ...defaultAuditData,
        data: {
          msg: 'Agendamentos do paciente na sugestão de convênio',
          data: schedules,
        },
      });

      return schedules;
    } catch (error) {
      console.error(error);
      this.logger.error('AppointmentService.listPreviousInsurances', error);
    }
  }
}
