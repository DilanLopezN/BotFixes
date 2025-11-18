import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientAcceptance } from './patient-acceptance.entity';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { Repository } from 'typeorm';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';
import * as moment from 'moment';
import { GetPatientAccept } from './interfaces/get-patient-accept.interface';
import { IntegrationService } from '../integration/integration.service';
import { DoAccept } from './interfaces/do-accept.interface';
import { DefaultPatient, GetRequestAcceptanceResponse } from './interfaces/get-request-acceptance.interface';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { DoRemoveAcceptance } from './interfaces/remove-acceptance.interface';
import { PatientDataService } from '../patient-data/patient-data.service';
import { IntegratorService } from '../integrator/service/integrator.service';
import { capitalizeText } from '../../common/helpers/capitalize-text';
import { getNumberWith9, getNumberWithout9 } from '../../common/helpers/format-phone';
import { DoPreloadData } from './interfaces/do-preload-data.interface';
import { GetPatientDataFromAcceptance } from './interfaces/get-patient-data-from-acceptance.interface';

export const EXPIRATION_ACCEPT_DAYS = 120;
export const EXPIRATION_RECUSED_DAYS = 30;

@Injectable()
export class PatientAcceptanceService {
  private logger = new Logger(PatientAcceptanceService.name);

  constructor(
    @InjectRepository(PatientAcceptance, INTEGRATIONS_CONNECTION_NAME)
    private patientAcceptanceRepository: Repository<PatientAcceptance>,
    private readonly integrationService: IntegrationService,
    private readonly patientDataService: PatientDataService,
    private readonly integratorService: IntegratorService,
  ) {}

  // se o usuário recusou diminui o período de expiração para perguntar novamente
  // se gostaria de salvar os dados
  public async accept(integrationId: string, data: DoAccept): Promise<OkResponse> {
    const integration = await this.integrationService.getOne(integrationId);
    const { phone } = data;

    const existsAcceptance = await this.patientAcceptanceRepository
      .createQueryBuilder('pAccept')
      .where('pAccept.integration_id = :integrationId', { integrationId: castObjectIdToString(integration._id) })
      .andWhere('pAccept.phone = :phone', { phone })
      .andWhere('pAccept.expiration > :date', { date: moment().valueOf() })
      .getExists();

    if (existsAcceptance) {
      return {
        ok: false,
      };
    }

    const entity: Omit<PatientAcceptance, 'id'> = {
      integrationId: castObjectIdToString(integration._id),
      phone,
    };

    if (data.accept) {
      entity.acceptedAt = moment().valueOf();
      entity.expiration = moment().add(EXPIRATION_ACCEPT_DAYS, 'days').valueOf();
    } else {
      entity.recusedAt = moment().valueOf();
      entity.expiration = moment().add(EXPIRATION_RECUSED_DAYS, 'days').valueOf();
    }

    const result = await this.patientAcceptanceRepository.save(entity);
    return {
      ok: !!result.id,
    };
  }

  // remove aceite do registro que possui expiração em aberto
  // os demais ficam ali para histórico
  public async removeAcceptance(integrationId: string, data: DoRemoveAcceptance): Promise<OkResponse> {
    const { phone } = data;
    const integration = await this.integrationService.getOne(integrationId);

    const result = await this.patientAcceptanceRepository
      .createQueryBuilder()
      .update()
      .set({
        revokedAt: moment().valueOf(),
      })
      .where('integrationId = :integrationId', { integrationId: castObjectIdToString(integration._id) })
      .andWhere('expiration > :date', { date: moment().valueOf() })
      .andWhere('phone = :phone', { phone })
      .execute();

    return {
      ok: result.affected > 0,
    };
  }

  // busca na tabela se existe dados do paciente em questão e se ele tem um aceite
  // caso tenha um aceite lança um evento para pré carregar os dados em redis e retorna os dados parciais na request
  // caso tenha recusado não retorna nada
  // caso não tenha nenhum registro ainda solicita aceite
  public async getAcceptance(integrationId: string, data: GetPatientAccept): Promise<GetRequestAcceptanceResponse> {
    const { phone, bornDate } = data;
    const integration = await this.integrationService.getOne(integrationId);

    const phone1 = getNumberWithout9(phone);
    const phone2 = getNumberWith9(phone);

    await this.accept(integrationId, { accept: true, phone, bornDate });
    const resultAcceptance = await this.patientAcceptanceRepository
      .createQueryBuilder('pAccept')
      .where('pAccept.integrationId = :integrationId', { integrationId: castObjectIdToString(integration._id) })
      .andWhere('(pAccept.phone = :phone1 OR pAccept.phone = :phone2)', {
        phone1,
        phone2,
      })
      .andWhere('pAccept.expiration > :date', { date: moment().valueOf() })
      .getOne();

    const response: GetRequestAcceptanceResponse = {
      requestAcceptance: false,
      patient: [],
    };

    if (!resultAcceptance) {
      return {
        ...response,
        requestAcceptance: true,
      };
    }

    // Talvez possamos solicitar novamente depois de X dias depois do usuário
    // ter desvinculado seus dados (revokedAt)
    if (resultAcceptance.recusedAt || resultAcceptance.revokedAt) {
      return {
        ...response,
        requestAcceptance: false,
      };
    }

    const patientResult = await this.patientDataService.getPatientByPhone(integrationId, {
      phone,
      bornDate: bornDate ? moment.utc(bornDate).startOf('day').valueOf() : null,
    });

    if (resultAcceptance.acceptedAt && patientResult?.length) {
      for (const patient of patientResult) {
        const { bornDate, name, cpf, erpCode } = patient;
        this.integratorService.preloadPatientData(integrationId, { code: erpCode, phone }).then();

        response.requestAcceptance = false;
        response.patient.push({
          name: capitalizeText(name),
          cpf,
          phone,
          bornDate: moment.utc(bornDate).startOf('day').format('YYYY-MM-DD'),
          code: patient.erpCode,
        });
      }
    }

    return response;
  }

  public async getPatientDataFromAcceptance(
    integrationId: string,
    data: GetPatientDataFromAcceptance,
  ): Promise<DefaultPatient[]> {
    const { phone, bornDate } = data;
    const integration = await this.integrationService.getOne(integrationId);

    const phone1 = getNumberWithout9(phone);
    const phone2 = getNumberWith9(phone);

    const resultAcceptance = await this.patientAcceptanceRepository
      .createQueryBuilder('pAccept')
      .where('pAccept.integrationId = :integrationId', { integrationId: castObjectIdToString(integration._id) })
      .andWhere('(pAccept.phone = :phone1 OR pAccept.phone = :phone2)', {
        phone1,
        phone2,
      })
      .andWhere('pAccept.expiration > :date', { date: moment().valueOf() })
      .getOne();

    if (!resultAcceptance) {
      return [];
    }

    const patientResult = await this.patientDataService.getPatientByPhone(integrationId, {
      phone,
      bornDate: bornDate ? moment.utc(bornDate).startOf('day').valueOf() : null,
    });

    const response: DefaultPatient[] = [];

    for (const patient of patientResult) {
      const { bornDate, name, cpf, erpCode } = patient;
      this.integratorService.preloadPatientData(integrationId, { code: erpCode, phone }).then();

      response.push({
        name: capitalizeText(name),
        cpf,
        phone,
        bornDate: moment(bornDate).format('YYYY-MM-DD'),
        code: patient.erpCode,
      });
    }

    return response;
  }

  public async doPreloadData(integrationId: string, data: DoPreloadData): Promise<OkResponse> {
    try {
      const { phone, bornDate } = data;

      const patientResult = await this.patientDataService.getPatientByPhone(integrationId, {
        phone,
        bornDate: bornDate ? moment.utc(bornDate).startOf('day').valueOf() : null,
      });

      Promise.all(
        patientResult.map((patient) => {
          const { erpCode } = patient;
          return this.integratorService.preloadPatientData(integrationId, { phone, code: erpCode });
        }),
      ).then();

      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      this.logger.error('doPreloadData', error);
      return { ok: false };
    }
  }
}
