import * as soap from 'soap';
import { Injectable } from '@nestjs/common';
import { uniq } from 'lodash';
import {
  DEFAULTS_MATRIX_SOAP_URL,
  DEFAULTS_MATRIX_SOAP_USER,
  DEFAULTS_MATRIX_SOAP_PASSWORD,
  DEFAULTS_MATRIX_SOAP_TOKEN,
} from '../defaults';

@Injectable()
export class MatrixDownloadService {
  async downloadGuidancePdf(procedures: string[]): Promise<Buffer> {
    if (!procedures.length) {
      return null;
    }

    const url = DEFAULTS_MATRIX_SOAP_URL;
    const args = {
      Senha: DEFAULTS_MATRIX_SOAP_PASSWORD,
      Token: DEFAULTS_MATRIX_SOAP_TOKEN,
      Usuario: DEFAULTS_MATRIX_SOAP_USER,
      procedimentos: uniq(procedures)?.join(','),
    };

    try {
      return await new Promise((resolve, reject) => {
        soap.createClient(url, (error, client) => {
          if (error) {
            console.error('MatrixDownloadService.downloadGuidancePdf', error);
            reject(error);
            return;
          }

          client.DownloadInstrucoesPreparoPDF(args, (error, response) => {
            if (error || response?.Message.includes('Senha inválida')) {
              console.error('MatrixDownloadService.downloadGuidancePdf', error);
              reject(error);
              return;
            }

            if (response?.instrucoes) {
              var buffer = Buffer.from(response?.instrucoes, 'base64');
            } else {
              error.message = 'No file has been generated';
              console.error('MatrixDownloadService.downloadGuidancePdf', error);
              reject(error);
            }
            resolve(buffer);
          });
        });
      });
    } catch (error) {
      console.error('MatrixDownloadService.downloadGuidancePdf', error);
      throw error;
    }
  }
}
