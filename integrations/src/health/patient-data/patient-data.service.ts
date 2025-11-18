import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientData } from './patient-data.entity';
import * as moment from 'moment';
import { CreatePatient } from './interfaces/create-patient.interface';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { convertPhoneNumber, getNumberWith9, getNumberWithout9 } from '../../common/helpers/format-phone';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';

@Injectable()
export class PatientDataService {
  constructor(
    @InjectRepository(PatientData, INTEGRATIONS_CONNECTION_NAME)
    private patientRepository: Repository<PatientData>,
  ) {}

  public async createPatient(integration: IntegrationDocument, data: CreatePatient): Promise<OkResponse> {
    try {
      const patient: Omit<PatientData, 'id'> = {
        ...data,
        createdAt: moment().valueOf(),
        integrationId: castObjectIdToString(integration._id),
        bornDate: data.bornDate ? moment(data.bornDate).valueOf() : null,
        email: data.email,
      };

      if (!patient.erpCode || !patient.bornDate || !patient.cpf) {
        return;
      }

      await this.patientRepository
        .createQueryBuilder()
        .insert()
        .values(patient)
        .orUpdate({
          conflict_target: ['cpf', 'erp_code', 'integration_id', 'phone'],
          overwrite: ['name'],
        })
        .execute();

      return {
        ok: true,
      };
    } catch (error) {
      console.error('PatientService.createPatient', error);
    }
  }

  public async getPatientByCode(integrationId: string, data: Pick<PatientData, 'erpCode'>): Promise<PatientData> {
    const { erpCode } = data;

    const query = this.patientRepository
      .createQueryBuilder()
      .where('integration_id = :integrationId', { integrationId });

    if (!erpCode) {
      return null;
    }

    return await query.andWhere('erp_code = :erpCode', { erpCode }).getOne();
  }

  public async getPatientByCpfOrPhone(
    integrationId: string,
    data: Pick<PatientData, 'cpf' | 'phone' | 'erpCode'>,
  ): Promise<PatientData> {
    const { cpf, phone, erpCode } = data;

    const query = this.patientRepository
      .createQueryBuilder()
      .where('integration_id = :integrationId', { integrationId });

    if (!phone && erpCode) {
      return await query.andWhere('erp_code = :erpCode', { erpCode }).getOne();
    } else if (!phone && cpf) {
      return await query.andWhere('cpf = :cpf', { cpf }).getOne();
    }

    const validPhoneNumber = convertPhoneNumber(phone);
    const phone1 = getNumberWithout9(validPhoneNumber);
    const phone2 = getNumberWith9(validPhoneNumber);

    if (erpCode && phone) {
      query.andWhere('(erp_code = :erpCode OR phone = :phone1 OR phone = :phone2)', { erpCode, phone1, phone2 });
    } else if (cpf && phone) {
      query.andWhere('(cpf = :cpf OR phone = :phone1 OR phone = :phone2)', { cpf, phone1, phone2 });
    } else {
      query.andWhere('(phone = :phone1 OR phone = :phone2)', { cpf, phone1, phone2 });
    }

    return await query.getOne();
  }

  public async getPatientByCodeOrCpfOrPhoneAndBornDate(
    integrationId: string,
    data: Pick<PatientData, 'bornDate' | 'phone' | 'erpCode' | 'cpf'>,
  ): Promise<PatientData> {
    const { bornDate, phone, erpCode, cpf } = data;

    const query = this.patientRepository
      .createQueryBuilder()
      .where('integration_id = :integrationId', { integrationId });

    if (bornDate) {
      query.andWhere("date_trunc('day', to_timestamp(born_date / 1000)) = :bornDate", {
        bornDate: moment(bornDate).toISOString(),
      });
    }

    if (phone || cpf || erpCode) {
      if (erpCode) {
        query.andWhere('erp_code = :erpCode', { erpCode });
      } else if (cpf) {
        query.andWhere('cpf = :cpf', { cpf });
      } else if (phone) {
        const validPhoneNumber = convertPhoneNumber(phone);
        const phone1 = getNumberWithout9(validPhoneNumber);
        const phone2 = getNumberWith9(validPhoneNumber);

        query.andWhere('(phone = :phone1 OR phone = :phone2)', { phone1, phone2 });
      }
      return await query.getOne();
    }

    return null;
  }

  public async getPatientByPhone(
    integrationId: string,
    data: Pick<PatientData, 'phone' | 'bornDate'>,
  ): Promise<PatientData[]> {
    const { phone, bornDate } = data;

    const query = this.patientRepository
      .createQueryBuilder()
      .where('integration_id = :integrationId', { integrationId });

    if (!phone) {
      return [];
    }

    if (bornDate) {
      query.andWhere("date_trunc('day', to_timestamp(born_date / 1000)) = :bornDate", {
        bornDate: moment(bornDate).toISOString(),
      });
    }

    const validPhoneNumber = convertPhoneNumber(phone);
    const phone1 = getNumberWithout9(validPhoneNumber);
    const phone2 = getNumberWith9(validPhoneNumber);

    return await query.andWhere('(phone = :phone1 OR phone = :phone2)', { phone1, phone2 }).getMany();
  }
}
