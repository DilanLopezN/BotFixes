import { Injectable, Logger } from '@nestjs/common';
import {
  FieldToValidate,
  MatrixPatientV2,
  PatientRecoverPassword,
  ValidatePatientRecoverAccessProtocol,
} from '../interfaces/recover-password.interface';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { Patient } from '../../../interfaces/patient.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { RecoverAccessProtocolResponse } from 'kissbot-health-core';
import { MatrixApiService } from './matrix-api.service';

@Injectable()
export class MatrixRecoverPasswordService {
  private readonly logger = new Logger(MatrixRecoverPasswordService.name);

  constructor(private readonly matrixApiService: MatrixApiService) {}

  async recoverPassword(
    integration: IntegrationDocument,
    data: PatientRecoverPassword,
    patient: MatrixPatientV2,
  ): Promise<RecoverAccessProtocolResponse> {
    if (!data.cpf || !data.bornDate) {
      return null;
    }

    try {
      const payload = {
        cpf: patient.cpf,
        usuarioNet: patient.data?.usuarioNet || patient.code,
        nome: patient.name,
        dataNascimento: patient.bornDate,
      };
      const { senhaProvisoria } = await this.matrixApiService.recoverPassword(integration, payload);
      return {
        password: senhaProvisoria,
        protocol: patient.data?.usuarioNet || patient.code,
        data: { portalLinkAccess: 'https://meuexame.tecnolab.com.br' },
      };
    } catch (error) {
      this.logger.error(`MatrixRecoverPasswordService.${this.recoverPassword.name}`, error);
    }
  }

  validateRecoverPassword(data: ValidatePatientRecoverAccessProtocol, patient: Patient): { ok: boolean } {
    let result: boolean = false;

    for (const field of data?.fieldsToValidate || []) {
      switch (field) {
        case FieldToValidate.zipCode: {
          result = data?.zipCode && data.zipCode === (patient.code || patient?.['zipCode']);
          break;
        }

        case FieldToValidate.insuranceNumber: {
          result = data?.insuranceNumber && data.insuranceNumber === patient?.['insuranceNumber'];
          break;
        }

        case FieldToValidate.email: {
          result = data?.email && data.email === patient.email;
          break;
        }

        case FieldToValidate.motherName: {
          const motherNameFirstName = data?.motherName?.split(' ')?.[0];
          const patientMotherNameFirstName = patient?.motherName?.split(' ')?.[0];

          if (motherNameFirstName === patient.motherName || motherNameFirstName === patientMotherNameFirstName) {
            result = true;
          } else {
            result = data?.motherName && data.motherName === patient.motherName;
          }

          break;
        }

        case FieldToValidate.phone: {
          const receivedPhone = formatPhone(convertPhoneNumber(data.phone));
          const patientPhone = formatPhone(convertPhoneNumber(patient.cellPhone || patient.phone));

          result = receivedPhone === patientPhone;
          break;
        }
      }

      if (!result) {
        break;
      }
    }

    return { ok: result };
  }
}
