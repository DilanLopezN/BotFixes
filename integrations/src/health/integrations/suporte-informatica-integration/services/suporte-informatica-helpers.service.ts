import { Injectable } from '@nestjs/common';
import { convertPhoneNumber } from '../../../../common/helpers/format-phone';
import { normalize } from '../../../../common/helpers/normalize-text.helper';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CreatePatient } from '../../../integrator/interfaces/create-patient.interface';
import { UpdatePatient } from '../../../integrator/interfaces/update-patient.interface';
import { AppointmentStatus } from '../../../interfaces/appointment.interface';
import { EntityType, IAppointmentTypeEntity } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { RawAppointment } from '../../../shared/appointment.service';
import {
  SICreatePatientRequest,
  SICreatePatientResponse,
  SIDoPatientLoginResponse,
  SIGetPatientDataResponse,
} from '../interfaces/patient.interface';
import { SIPatientScheduleDetails } from '../interfaces/schedule.interface';

interface CompositeProcedureCodeData {
  code: string;
  specialityType: string;
}

@Injectable()
export class SuporteInformaticaHelpersService {
  constructor(private readonly entitiesService: EntitiesService) {}

  public createPatientPayload({ patient }: CreatePatient | UpdatePatient): SICreatePatientRequest {
    const payload: SICreatePatientRequest = {
      Nome: normalize(patient.name, true),
      DataNascimento: patient.bornDate,
      CPF: patient.cpf,
      Sexo: patient.sex,
      Telefone: '',
      TipoTelefone: null,
    };

    // @TODO
    // Tipo 3 por algum motivo não espera o DDD, vou tirar para testarem depois questiono a integração
    if (patient.cellPhone) {
      const formattedPhone = convertPhoneNumber(patient.cellPhone.match(/\d+/g)?.join(''));
      const cellPhone = formattedPhone.slice(2, 99);
      payload.Telefone = cellPhone;
      payload.TipoTelefone = 3;
    }

    if (patient.email) {
      payload.Email = patient.email;
    }

    return payload;
  }

  public replaceSIPatientFromTokenLogin(result: SICreatePatientResponse | SIDoPatientLoginResponse): Patient {
    const {
      COD_PESSOA,
      DES_EMAIL,
      COD_SEXO,
      DES_NOMEPESSOA,
      DAT_NASCIMENTO,
      DES_CPF,
      NUM_DDDRESIDENCIAL,
      NUM_TELEFONERESIDENCIAL,
      NUM_DDDCELULAR,
      NUM_TELEFONECELULAR,
    } = result.PessoaLogin;

    const { COD_USUARIO } = result.UsuarioLogin;

    const patient: Patient = {
      code: String(COD_PESSOA),
      email: DES_EMAIL,
      sex: COD_SEXO,
      name: DES_NOMEPESSOA,
      bornDate: DAT_NASCIMENTO,
      cpf: DES_CPF,
      // tipo telefone 1 no cadastro retorna neste campo
      cellPhone: '',
      phone: '',
      data: {
        codUsuario: String(COD_USUARIO),
      },
    };

    if (NUM_DDDRESIDENCIAL && NUM_TELEFONERESIDENCIAL) {
      const phone = `${String(NUM_DDDRESIDENCIAL)}${String(NUM_TELEFONERESIDENCIAL)}`;
      patient.phone = phone;
    }

    if (NUM_DDDCELULAR && NUM_TELEFONECELULAR) {
      const phone = `${NUM_DDDCELULAR}${NUM_TELEFONECELULAR}`;
      patient.cellPhone = phone;
    }

    return patient;
  }

  public replaceSIPatient(result: SIGetPatientDataResponse): Patient {
    const { DES_EMAIL, COD_PESSOA, COD_SEXO, DES_NOMEPESSOA, DAT_NASCIMENTO, DES_CPF } = result.DadosPessoa;

    const patient: Patient = {
      code: String(COD_PESSOA),
      email: DES_EMAIL,
      sex: COD_SEXO,
      name: DES_NOMEPESSOA,
      bornDate: DAT_NASCIMENTO,
      cpf: DES_CPF,
    };

    const { NUM_DDDCELULAR, NUM_TELEFONECELULAR } = result.DadosPessoa;

    if (NUM_DDDCELULAR && NUM_TELEFONECELULAR) {
      const phone = `${NUM_DDDCELULAR}${NUM_TELEFONECELULAR}`;
      patient.cellPhone = phone;
    }

    return patient;
  }

  public async createPatientScheduleObject(
    integration: IntegrationDocument,
    siSchedule: SIPatientScheduleDetails,
  ): Promise<RawAppointment> {
    const { Agendamento } = siSchedule;

    const schedule: RawAppointment = {
      appointmentCode: String(Agendamento.ID_HORARIO),
      appointmentDate: String(Agendamento.HOR_ATENDIMENTO),
      doctorId: String(Agendamento.Profissional.COD_PROFISSIONAL),
      organizationUnitId: String(Agendamento.Local.COD_LOCAL),
      specialityId: undefined,
      insuranceId: String(Agendamento.COD_CONVENIO),
      procedureId: undefined,
      appointmentTypeId: String(Agendamento.TipoAtendimento.COD_TIPOATENDIMENTO),
      status: AppointmentStatus.scheduled,
    };

    // @TODO: se tiver mais de um criar 2 retornos na api???
    if (Agendamento.InformacoesHorarioExame?.length) {
      schedule.procedureId = String(Agendamento.InformacoesHorarioExame[0].COD_PROCEDIMENTO);
    }

    if (Agendamento.Especialidade?.COD_ESPECIALIDADE && Agendamento.TipoAtendimento?.COD_TIPOATENDIMENTO) {
      const appointmentType = (await this.entitiesService.getEntityByCode(
        String(Agendamento.TipoAtendimento.COD_TIPOATENDIMENTO),
        EntityType.appointmentType,
        integration._id,
      )) as IAppointmentTypeEntity;
      schedule.specialityId = this.createCompositeSpecialityCode(
        String(Agendamento.Especialidade.COD_ESPECIALIDADE),
        appointmentType.params.referenceScheduleType,
      );
    }

    return schedule;
  }

  private getCompositeProcedureIdentifiers(): string[] {
    return ['c', 'st'];
  }

  public createCompositeSpecialityCode(code: string, specialityType: string): string {
    const [i0, i1] = this.getCompositeProcedureIdentifiers();
    const stCode = `${specialityType}`;

    return `${i0}${code}:${i1}${stCode}`;
  }

  public getCompositeProcedureCode(code: string): CompositeProcedureCodeData {
    const identifiers = this.getCompositeProcedureIdentifiers();
    const parts = code.split(':').map((occ, index) => {
      const identifier = identifiers[index];
      return occ.replace(identifier, '');
    });

    return {
      code: parts?.[0],
      specialityType: parts?.[1],
    };
  }
}
