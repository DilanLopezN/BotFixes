import * as soap from 'soap';
import { Injectable } from '@nestjs/common';
import { DEFAULTS_MATRIX_SOAP_CHECK_CRM_URL, DEFAULTS_MATRIX_SOAP_CHECK_CRM_CODE } from '../defaults';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';

@Injectable()
export class MatrixDoctorService {
  async validateDoctorCrm(crm: number, uf: string): Promise<OkResponse> {
    if (!crm || !uf) {
      return { ok: false, message: 'CRM e UF são obrigatórios' };
    }

    // o endpoint só aceita strings maíusculas
    uf = uf.toUpperCase();

    const url = DEFAULTS_MATRIX_SOAP_CHECK_CRM_URL;
    const args = {
      crm,
      uf,
      chave: DEFAULTS_MATRIX_SOAP_CHECK_CRM_CODE,
    };

    try {
      return await new Promise((resolve, reject) => {
        soap.createClient(url, (error, client) => {
          if (error) {
            console.error('MatrixDoctorService.validateDoctorCrm', error);
            reject(error);
            return;
          }

          client.Consultar(args, (error, response) => {
            if (error) {
              console.error('MatrixDoctorService.validateDoctorCrm', error);
              reject(error);
              return;
            }

            const dadosMedico = response?.dadosMedico;

            if (!dadosMedico) {
              resolve({ ok: false });
            }

            if (dadosMedico?.codigoErro) {
              reject(new Error(`Erro retornado da API de código: ${dadosMedico.codigoErro}`));
              return;
            }

            // O médico está apto apenas com a situação 'A' = Regular
            if (dadosMedico?.situacao === 'A') {
              resolve({ ok: true });
            }

            resolve({ ok: false });
          });
        });
      });
    } catch (error) {
      console.error('MatrixDoctorService.validateDoctor', error);
      throw error;
    }
  }
}
