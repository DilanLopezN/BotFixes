import { Injectable } from '@nestjs/common';
import { InsuranceResponseData } from '../interfaces/data-response.interface';
import { IInsuranceImplementorService } from '../interfaces/insurance-service.interface';

interface Insurance {
  codigoRede: number;
  situacao: string;
  nomePlanoCartao: string;
  nomeDoPlano: string;
  registroAns: string;
  classificacao: string;
  beneficiarioStatus: string;
  contexto: string;
  operadora: string;
  modalidade: string;
  numeroCarterinha: string;
  unidade: string;
}

@Injectable()
export class AmilApiService implements IInsuranceImplementorService {
  public async getData(cpf: string): Promise<InsuranceResponseData> {
    try {
      const data: Insurance[] = await new Promise((resolve, reject) => {
        fetch(`https://www.amil.com.br/institucional/api/InstitucionalMiddleware/RedeCredenciadaSimples/${cpf}`, {
          method: 'GET',
        })
          .then((response) => {
            if (!response) {
              throw new Error();
            }
            return response?.json?.();
          })
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      });

      const insuranceCard = data?.find((item) => item.situacao === 'ATIVO' && item.modalidade === 'SAUDE');

      if (!insuranceCard) {
        return null;
      }

      return {
        insuranceSubPlan: {
          identifierCode: String(insuranceCard.codigoRede),
          name: [insuranceCard.nomePlanoCartao, insuranceCard.nomeDoPlano],
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
