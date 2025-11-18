import { HttpStatus, Injectable } from '@nestjs/common';
import { convertPhoneNumber } from 'kissbot-core';
import * as moment from 'moment';
import { OkResponse } from 'common/interfaces/ok-response.interface';
import { HTTP_ERROR_THROWER } from 'common/exceptions.service';
import { formatPhone } from 'common/helpers/format-phone';
import { AuditService } from 'health/audit/services/audit.service';
import { AuditDataType } from 'health/audit/audit.interface';
import { SapApiService } from './sap-api.service';
import { SapCacheService } from './sap-cache.service';
import {
  MessageStatus,
  TABLE,
  ZMMF_CB_CONTRATO,
  ZMMF_CB_ENVIO,
  ZMMF_CB_LOGON,
} from '../../sap-integration/sap.interface';
import { SapDynamoDB } from './sap-dynamodb.service';
import { Message, ApiQueueService } from '../../health/api/services/api-queue.service';

enum TableType {
  ZMMF_CB_CONTRATO = 'ZMMF_CB_CONTRATO',
  ZMMF_CB_LOGON = 'ZMMF_CB_LOGON',
  ZMMF_CB_ENVIO = 'ZMMF_CB_ENVIO',
}

enum TableName {
  LOGON = 'LOGON',
  CONTRACT = 'CONTRACT',
  REQUISITION = 'REQUISITION',
  ORDER = 'ORDER',
}

enum RCType {
  ZREG = 'ZREG',
  NB = 'NB',
  ZATI = 'ZATI',
  ZSTQ = 'ZSTQ',
  ZSER = 'ZSER',
  ZSCO = 'ZSCO',
  ZNB = 'ZNB',
  ZCON = 'ZCON',
}

@Injectable()
export class SapService {
  constructor(
    private readonly sapApiService: SapApiService,
    private readonly sapCacheService: SapCacheService,
    private readonly sapDynamoDB: SapDynamoDB,
    private readonly auditService: AuditService,
    private readonly apiQueueService: ApiQueueService,
  ) {}
  async getAwsFiles(): Promise<OkResponse> {
    try {
      const files = await this.sapApiService.getUrlFilesFromAws();

      const promises = Object.entries(files).map(async ([key, value]) => {
        const tableName = key.replace(/_table$/, '');
        const dataTable: TABLE = await this.sapApiService.get(value);

        const mountData = (key: string, dataValue: any[]): [string, any[]][] => {
          const requisitionNumberValues = {};
          dataValue.forEach((el) => {
            if (!el[key]) return;
            return requisitionNumberValues[el[key]]
              ? requisitionNumberValues[el[key]].push(el)
              : (requisitionNumberValues[el[key]] = [el]);
          });
          return Object.entries(requisitionNumberValues);
        };

        const data = [];
        switch (tableName) {
          case TableType.ZMMF_CB_ENVIO:
            data.push(mountData('BANFN', dataTable.ET_DATA));
            data.push(mountData('EBELN', dataTable.ET_DATA));
            break;
          case TableType.ZMMF_CB_CONTRATO:
            data.push(mountData('EBELN', dataTable.ET_DATA));
            break;
          case TableType.ZMMF_CB_LOGON:
            data.push(dataTable.ET_DATA);
            break;
        }

        await this.sapCacheService.clearCache(tableName);
        const promiseTables = data.map(async (newTable, index) => {
          const promiseTable = newTable.map((el) => {
            switch (tableName) {
              case TableType.ZMMF_CB_ENVIO:
                switch (index) {
                  case 0:
                    return this.sapCacheService.setCache(TableName.REQUISITION, el[0], el[1]);
                  case 1:
                    return this.sapCacheService.setCache(TableName.ORDER, el[0], el[1]);
                }
              case TableType.ZMMF_CB_CONTRATO:
                return this.sapCacheService.setCache(TableName.CONTRACT, el[0], el[1]);
              case TableType.ZMMF_CB_LOGON:
                return this.sapCacheService.setCache(
                  TableName.LOGON,
                  formatPhone(convertPhoneNumber(el.TEL_NUMBER), true),
                  el,
                );
            }
          });
          return Promise.allSettled(promiseTable);
        });
        await this.sapCacheService.setCache(
          'sap_config',
          'timestamp',
          moment().utcOffset('-0300').format('DD/MM/YYYY HH:mm'),
        );
        await Promise.allSettled(promiseTables);
      });
      await Promise.allSettled(promises);
      return { ok: true };
    } catch (err) {
      this.auditService.sendAuditEvent({
        dataType: AuditDataType.internalResponse,
        integrationId: null,
        data: err,
        identifier: this.getAwsFiles.name,
      });
    }
  }

  async getStatus(inputNumber: string, userPhoneNumber: string): Promise<MessageStatus> {
    try {
      if (!inputNumber || !userPhoneNumber) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'userPhoneNumber and inputNumber are required');
      }

      const allowedPhoneNumbers = ['5182030882', '32999876075'];

      const isAllowedNumber = allowedPhoneNumbers.includes(userPhoneNumber);

      if (!isAllowedNumber) {
        const user = (await this.sapCacheService.getCache(TableName.LOGON, userPhoneNumber)) as ZMMF_CB_LOGON;
        if (!user) {
          return {
            status: [
              'Desculpe, o chatbot de suprimentos está disponível somente para usuários SAP com o número de telefone celular cadastrado e não identifiquei telefone nesta base.\n\n Isso pode acontecer quando o seu número de telefone não está cadastrado no seu usuário SAP. Para fazer este cadastro e poder começar a usar este canal de comunicação, por favor abra um chamado no Qualitor através do caminho: Tecnologia e Inovação > Gestão de Acessos > SAP > Cadastro ou Atualização de Celular para acesso ao Chatbot Suprimentos \n\n Obrigado.',
            ],
          };
        }
      }

      if (inputNumber.startsWith('45') && inputNumber.length == 10) {
        return this.getOrderStatus(inputNumber);
      } else if (inputNumber.startsWith('46') && inputNumber.length == 10) {
        return this.getContractInfo(inputNumber);
      } else if (inputNumber.length == 8 || (inputNumber.startsWith('00') && inputNumber.length == 10)) {
        return this.getRequisitionStatus(inputNumber);
      } else {
        return { status: ['A informação passada está inválida'] };
      }
    } catch (error) {}
  }

  async getOrderStatus(orderNumber: string): Promise<MessageStatus> {
    try {
      const time = await this.sapCacheService.getCache('sap_config', 'timestamp');

      const order = (await this.sapCacheService.getCache(
        TableName.ORDER,
        orderNumber.padStart(10, '0'),
      )) as ZMMF_CB_ENVIO[];
      if (!order) {
        return {
          status: [
            `Me desculpe mas este pedido de compra, desde a última atualização *${time}*, não está no parâmetro de pesquisa, por favor acione o departamento de suprimentos`,
          ],
        };
      }

      let statusText = [
        `✅ Perfeito! Localizei o processo com sucesso.\n Identifiquei que se trata de um *pedido de compras*.\n Abaixo, segue o status detalhado:\n\n Data da última atualização: *${time}*\n Dados do pedido *${orderNumber.padStart(10, '0')}*\n\n`,
      ];

      const data = order[0] as ZMMF_CB_ENVIO;
      const type = data.BSART as unknown as RCType;
      const itemText = this.getStatusText(type, data);
      if (statusText[statusText.length - 1].length + itemText.length >= 4000) {
        statusText.push(itemText);
      } else {
        statusText[statusText.length - 1] += itemText;
      }
      return { status: statusText };
    } catch (e) {
      this.auditService.sendAuditEvent({
        dataType: AuditDataType.internalResponse,
        integrationId: null,
        data: e,
        identifier: this.getStatus.name,
      });
    }
  }

  async getRequisitionStatus(requisitionNumber: string): Promise<MessageStatus> {
    try {
      const time = await this.sapCacheService.getCache('sap_config', 'timestamp');

      const requisition = (await this.sapCacheService.getCache(
        TableName.REQUISITION,
        requisitionNumber.padStart(10, '0'),
      )) as ZMMF_CB_ENVIO[];
      if (!requisition) {
        return {
          status: [
            `Me desculpe mas esta requisição, desde a última atualização *${time}*, não está no parâmetro de pesquisa, por favor acione o departamento de suprimentos`,
          ],
        };
      }

      let statusText = [
        `✅ Perfeito! Localizei o processo com sucesso.\n Identifiquei que se trata de uma *requisição de compras*.\n Abaixo, segue o status detalhado:\n\n Data da última atualização: *${time}*\n Dados da requisição *${requisitionNumber.padStart(10, '0')}*\n\n`,
      ];

      const data = requisition as ZMMF_CB_ENVIO[];
      let contract: ZMMF_CB_CONTRATO[] = null;
      if (requisition[0].BSART === RCType.ZCON && requisition[0].EBELN) {
        contract = (await this.sapCacheService.getCache(
          TableName.CONTRACT,
          requisition[0].EBELN,
        )) as unknown as ZMMF_CB_CONTRATO[];
        if (!contract) {
          return { status: ['O contrato existente na requisição de compra está inválido'] };
        }
      }
      data
        .sort((a, b) => {
          return Number(a.BNFPO) - Number(b.BNFPO);
        })
        .forEach(async (requisitionItem) => {
          const type = requisitionItem.BSART as unknown as RCType;
          const itemText = this.getStatusText(
            type,
            requisitionItem,
            contract?.find((contractItem) => contractItem.EBELP === requisitionItem.EBELP),
          );
          if (statusText[statusText.length - 1].length + itemText.length >= 4000) {
            statusText.push(itemText);
          } else {
            statusText[statusText.length - 1] += itemText;
          }
        });
      return { status: statusText };
    } catch (e) {
      this.auditService.sendAuditEvent({
        dataType: AuditDataType.internalResponse,
        integrationId: null,
        data: e,
        identifier: this.getStatus.name,
      });
    }
  }

  getStatusText(type: RCType, requisition: ZMMF_CB_ENVIO, contract?: ZMMF_CB_CONTRATO): string {
    const statusReturn = { status: '' };
    switch (type) {
      case RCType.ZREG:
      case RCType.NB:
      case RCType.ZATI:
      case RCType.ZSTQ:
      case RCType.ZSER:
      case RCType.ZSCO:
      case RCType.ZNB:
      case RCType.ZCON:
        statusReturn.status += `Item *${requisition.BNFPO}*: ${requisition.TXZ01 || ''}\n`;
        break;
      default:
        statusReturn.status += `Item *${requisition.BNFPO}*:\n`;
        break;
    }

    if (!RCType[type]) {
      return (statusReturn.status += `Status: O tipo *${type}* está indiponivel para verificação de status\n\n`);
    }

    if (!requisition.LOEKZ_RC && requisition.LOEKZ_PO) {
      switch (type) {
        case RCType.ZREG:
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
        case RCType.ZSER:
        case RCType.ZSCO:
        case RCType.ZNB:
          return (statusReturn.status += `Status: Vi que o departamento de Compras havia gerado um pedido para seu produto que foi eliminado, seu pedido foi eliminado por ${requisition.ZNAME_ELIM_PO || requisition.ZUSER_ELIM_PO}. Agora ele voltou para a fila de processamento de requisições de compras. Se necessário, por favor entre em contato com o comprador ${requisition.EKNAM_GRP}.\n\n`);
      }
    }

    if (requisition.LOEKZ_RC) {
      switch (type) {
        case RCType.ZREG:
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
          return (statusReturn.status += `Status: O processo de regularização deste item foi encerrado pois ele foi eliminado por ${requisition.ZNAME_ELIM_RC || requisition.ZUSER_ELIM_RC || 'uma ação de eliminação em massa, entre em contato com o departamento de Compras'} ${requisition.ZDATS_ELIM_RC ? `na data de ${moment(requisition.ZDATS_ELIM_RC).format('DD/MM/YYYY')}` : ''}\n\n`);
        case RCType.ZSER:
        case RCType.ZCON:
          return (statusReturn.status += `Status: O processo de contratação deste serviço foi encerrado pois ele foi eliminado por ${requisition.ZNAME_ELIM_RC || requisition.ZUSER_ELIM_RC || 'uma ação de eliminação em massa, entre em contato com o departamento de Compras'} ${requisition.ZDATS_ELIM_RC ? `na data de ${moment(requisition.ZDATS_ELIM_RC).format('DD/MM/YYYY')}` : ''}\n\n`);
        case RCType.ZSCO:
        case RCType.ZNB:
          return (statusReturn.status += `Status: O processo de compra deste serviço foi encerrado pois ele foi eliminado por ${requisition.ZNAME_ELIM_RC || requisition.ZUSER_ELIM_RC || 'uma ação de eliminação em massa, entre em contato com o departamento de Compras'} ${requisition.ZDATS_ELIM_RC ? `na data de ${moment(requisition.ZDATS_ELIM_RC).format('DD/MM/YYYY')}` : ''}\n\n`);
      }
    }

    if (type === RCType.ZCON) {
      if (!requisition.EBELN && (requisition.FRGKZ == '' || requisition.FRGKZ == '2' || requisition.FRGKZ == 'L')) {
        return (statusReturn.status += `Status: Fique tranquilo pois o comprador ${requisition.EKNAM_GRP} já está trabalhando na implementação de seu contrato.\n\n`);
      }

      if (requisition.EBELN && contract.LOEKZ) {
        return (statusReturn.status += `Status: Vi que o departamento de Compras havia gerado um contrato para sua demanda que foi eliminado. Agora ele voltou para a fila de processamento de requisições de compras. Se necessário, por favor entre em contato com o comprador ${requisition.EKNAM_GRP}.\n\n`);
      }

      if (requisition.EBELN && (contract.FRGKE == '1' || contract.FRGKE == '')) {
        return (statusReturn.status += `Status: O contrato ${requisition.EBELN} (prestador ${contract.NAME1}), que contém este item, está aprovado e pronto para ser consumido. \n\n`);
      }

      if (requisition.EBELN && contract.FRGKE == '0') {
        return (statusReturn.status += `Status: Quase lá, o comprador ${requisition.EKNAM_GRP} já cadastrou o contrato SAP ${requisition.EBELN}, assim que aprovado ele estará pronto para ser consumido.\n\n`);
      }
    }

    if (requisition.MENGE_PO === requisition.MENGE_RC && requisition.LFBNR) {
      switch (type) {
        case RCType.ZREG:
          return (statusReturn.status += `Status: Seu produto foi comprado através do pedido ${requisition.EBELN}, todas as unidades *deste item* já foram recebidas no SAP através da nota fiscal ${requisition.LFBNR} da empresa ${requisition.NAME1}.\n\n`);
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
        case RCType.ZSER:
          return (statusReturn.status += `Status: Seu produto foi comprado através do pedido ${requisition.EBELN} e de acordo com o SAP, todas as unidades *deste item* já foram recebidas através da nota fiscal ${requisition.LFBNR} da empresa ${requisition.NAME1}.\n\n`);
        case RCType.ZSCO:
        case RCType.ZNB:
          return (statusReturn.status += `Status: O pedido ${requisition.EBELN} foi gerado e todas as unidades *deste item* já foram recebidas no SAP através da nota fiscal ${requisition.LFBNR} da empresa ${requisition.NAME1}.\n\n`);
      }
    }

    if (requisition.MENGE_PO < requisition.MENGE_RC && requisition.LFBNR) {
      switch (type) {
        case RCType.ZREG:
          return (statusReturn.status += `Status: Seu produto foi comprado através do pedido ${requisition.EBELN} para regularizar a compra deste produto foi, ${Number(requisition.MENGE_PO)} unidades *deste item* já foram recebidas através da nota fiscal ${requisition.LFBNR} da empresa ${requisition.NAME1}. Favor seguir o trâmite de entrada da nota das demais unidades *deste item*.\n\n`);
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
        case RCType.ZSER:
          return (statusReturn.status += `Status: Seu produto foi comprado através do pedido ${requisition.EBELN} para regularizar a compra deste produto foi gerado, ${Number(requisition.MENGE_PO)} unidades *deste item* já foram recebidas através da nota fiscal ${requisition.LFBNR} da empresa ${requisition.NAME1}. ${moment(requisition.EINDT).isSameOrAfter(moment()) ? `O restante das unidades *deste item* pendentes está com previsão de entrega para ${moment(requisition.EINDT).format('DD/MM/YYYY')}` : `As unidades restantes *deste item* estão em atraso, deveriam ter chegado em até ${moment(requisition.EINDT).format('DD/MM/YYYY')}, por favor entre em contato com o comprador ${requisition.ERNAM} para saber mais detalhes`}.\n\n`);
        case RCType.ZSCO:
        case RCType.ZNB:
          return (statusReturn.status += `Status: O pedido ${requisition.EBELN} foi gerado, ${Number(requisition.MENGE_PO)} unidades *deste item* já foram recebidos através da nota fiscal ${requisition.LFBNR} da empresa ${requisition.NAME1},  por favor siga o trâmite de entrada das demais notas.\n\n`);
      }
    }

    if ((requisition.FRGKE == '1' || requisition.FRGKE == '') && requisition.EBELN) {
      switch (type) {
        case RCType.ZREG:
          return (statusReturn.status += `Status: Boa notícia, o pedido ${requisition.EBELN}${requisition.NAME1 ? ` (fornecedor ${requisition.NAME1})` : ''}, que contém este item, está aprovado. Favor seguir o trâmite de entrada da nota.\n\n`);
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
        case RCType.ZSER:
        case RCType.ZSCO:
        case RCType.ZNB:
          return (statusReturn.status += `Status: Boa notícia, o pedido ${requisition.EBELN}${requisition.NAME1 ? ` (fornecedor ${requisition.NAME1})` : ''}, que contém este item, está aprovado.  ${moment(requisition.EINDT).isSameOrAfter(moment()) ? `As unidades *deste item* estão com previsão de entrega para ${moment(requisition.EINDT).format('DD/MM/YYYY')}` : `As unidades *deste item*, deveriam ter chegado em até ${moment(requisition.EINDT).format('DD/MM/YYYY')}, por favor entre em contato com o comprador ${requisition.ERNAM} para saber mais detalhes`}.\n\n`);
      }
    }

    if (requisition.FRGKE == '0' && requisition.EBELN) {
      switch (type) {
        case RCType.ZREG:
          return (statusReturn.status += `Status: Quase lá, o pedido ${requisition.EBELN}${requisition.NAME1 ? `do fornecedor ${requisition.NAME1}` : ''}, que contém este produto, foi emitido e está na fila de aprovação.\n\n`);
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
          return (statusReturn.status += `Status: Quase lá, o comprador ${requisition.EKNAM_GRP} já encontrou a melhor condição comercial e emitiu o pedido de compra ${requisition.EBELN}${requisition.NAME1 ? `do fornecedor ${requisition.NAME1}` : ''}. Assim que o pedido for aprovado ele será enviado ao fornecedor e daí será só aguardar a sua entrega.\n\n`);
        case RCType.ZSER:
          return (statusReturn.status += `Status: Quase lá, o comprador ${requisition.EKNAM_GRP} já encontrou a melhor condição comercial e emitiu o pedido de compra ${requisition.EBELN}${requisition.NAME1 ? `do fornecedor ${requisition.NAME1}` : ''}. Assim que o pedido for aprovado ele será enviado ao fornecedor.\n\n`);
      }
    }

    if (requisition.FRGKZ == '' || requisition.FRGKZ == '2' || requisition.FRGKZ == 'L') {
      switch (type) {
        case RCType.ZREG:
          return (statusReturn.status += `Status: Seu produto já está sendo tratado pelo departamento de suprimentos. Em breve ${requisition.EKNAM_GRP} emitirá o pedido ou entrarão em contato caso necessário algum esclarecimento.\n\n`);
        case RCType.NB:
        case RCType.ZATI:
        case RCType.ZSTQ:
          return (statusReturn.status += `Status: Seu produto já está sendo tratado pelo departamento de suprimentos, fique tranquilo pois em breve ${requisition.EKNAM_GRP} encontrará a melhor condição comercial disponível no mercado e efetuará a compra do seu produto.\n\n`);
        case RCType.ZSER:
          return (statusReturn.status += `Status: Sua demanda já está sendo tratada pelo departamento de suprimentos, fique tranquilo pois em breve ${requisition.EKNAM_GRP} encontrará a melhor condição comercial disponível no mercado e efetuará a contratação do seu serviço.\n\n`);
        case RCType.ZSCO:
        case RCType.ZNB:
          return (statusReturn.status += `Status: O pedido não foi criado automaticamente. Isso normalmente acontece quando há alguma divergência entre requisição e contrato. Por favor entre em contato com o comprador ${requisition.EKNAM_GRP} para ação corretiva.\n\n`);
      }
    }

    if (requisition.FRGKZ == '0') {
      return (statusReturn.status += `Status: A requisição de compra deste item foi criada e está em processo de aprovação por ${requisition.NAME_USR_A_RC} e a última atualização foi em ${moment(requisition.ZDATE).format('DD/MM/YYYY')} \n\n`);
    }

    return (statusReturn.status +=
      'Status: Indisponível, favor entrar em contato com o departamento de suprimentos \n\n');
  }

  async getContractInfo(contractNumber: string): Promise<{ status: string[]; contractNumber?: string }> {
    const time = await this.sapCacheService.getCache('sap_config', 'timestamp');

    const contracts = (await this.sapCacheService.getCache(TableName.CONTRACT, contractNumber)) as ZMMF_CB_CONTRATO[];
    if (!contracts) {
      return {
        status: [
          `Me desculpe mas este contrato, desde a última atualização *${time}*, não está no parâmetro de pesquisa, por favor acione o departamento de suprimentos`,
        ],
      };
    }

    let contract = undefined;
    let isEliminated = true;
    contracts.forEach((contractItem, index) => {
      if (!contractItem.LOEKZ) {
        isEliminated = false;
        contract = contracts[index];
      }
    });

    let status = `✅ Perfeito! Localizei o processo com sucesso.\n Identifiquei que se trata de um *contrato*.\n Abaixo, segue o status detalhado:\n\n Data da última atualização: *${time}*\n Dados do contrato *${contractNumber.padStart(10, '0')}*\n\n`;

    if (isEliminated) {
      return {
        status: [
          status +
            `Localizei o contrato *${contractNumber}*, segue status deste contrato:
          - Seu contrato está eliminado.`,
        ],
      };
    }

    const startContractDate = moment(contract.KDATB);
    const endContractDate = moment(contract.KDATE);
    const isActive = endContractDate.isAfter(moment());

    const total = parseFloat(contract.KTWRT);
    const balance = parseFloat(contract.FORMULA);
    const consumed = parseFloat(contract.KTWRT) - parseFloat(contract.FORMULA);

    let manager = '';
    switch (contract['FRGZU']) {
      case 'X':
        manager = 'comprador';
        break;
      case 'XX':
        manager = 'coordenador de compras';
        break;
      case 'XXX':
        manager = 'gerente';
        break;
      case 'XXXX':
        manager = 'diretor';
        break;
      case 'XXXXX':
        manager = 'diretor executivo de operações';
        break;
      default:
        if (isActive && balance > 0) {
          status += `A validade do seu contrato vai de ${startContractDate.format('DD/MM/YYYY')} até ${endContractDate.format('DD/MM/YYYY')}, portanto ele está vigente.
          O saldo total dele é de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, e como ${consumed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} já foi consumido, este contrato ainda possui saldo para ser consumido de ${(balance > 0 ? balance : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
        } else {
          status +=
            '⚠️ Seu contrato está inoperante, pois está vencido ou sem saldo disponível. \n\n Verificamos que este contrato *não passa por alçada de aprovação*.\n\n *Próximos Passos:*\n 👤 Para mais detalhes ou ações necessárias, recomendamos entrar em contato com o *comprador responsável pela categoria*.\n 📎 *Acesse a planilha com os contatos dos compradores:* [Clique aqui para acessar a planilha](https://hospitalcarebr-my.sharepoint.com/:x:/g/personal/fabricio_oliveira_hospitalcare_com_br/EQ1-lZqbqKBJjXNLp5QvfgsB7HNRmtlI2FzR0pFoYcbb7A?e=8H5Thw)';
        }
        return {
          status: [status],
        };
    }

    return {
      contractNumber,
      status: [
        status +
          `Seu contrato está ${isActive ? 'ativo' : 'inoperante'}.
        ${manager ? 'Seu contrato está liberado desde ' + startContractDate.format('DD/MM/YYYY') : 'Seu contrato está na fila de liberação, atualmente está em ' + manager} 
        A validade do seu contrato vai de ${startContractDate.format('DD/MM/YYYY')} até ${endContractDate.format('DD/MM/YYYY')}, portanto ele está ${isActive ? 'vigente' : 'vencido'}.
        O saldo total dele é de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, e como ${consumed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} já foi consumido, este contrato ainda possui saldo para ser consumido de ${(balance > 0 ? balance : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      ],
    };
  }

  async addUserToNotify(data: { userPhoneNumber: string; contractNumber: string }): Promise<MessageStatus> {
    try {
      const { userPhoneNumber, contractNumber } = data;
      const id = `${userPhoneNumber}-${contractNumber}`;
      const existItem = await this.sapDynamoDB.getItem(id);
      if (existItem) {
        return {
          status: [`Você já  está sendo notificado para receber atualizações sobre o contrato ${contractNumber}!`],
        };
      }
      await this.sapDynamoDB.addItem({
        id,
        userPhoneNumber,
        contractNumber,
      });
      return {
        status: [
          `🎉 Tudo certo! As notificações do contrato nº ${contractNumber} 📄 serão enviadas diretamente para este número 📱. Fique de olho e não perca nenhuma novidade! 😉`,
        ],
      };
    } catch (error) {}
  }

  async removeUserToNotify(data: { userPhoneNumber: string; contractNumber: string }): Promise<MessageStatus> {
    try {
      const { userPhoneNumber, contractNumber } = data;
      const id = `${userPhoneNumber}-${contractNumber}`;
      const existItem = await this.sapDynamoDB.getItem(id);
      if (!existItem) {
        return {
          status: [`Você não está sendo notificado para receber atualizações sobre o contrato ${contractNumber}`],
        };
      }
      await this.sapDynamoDB.removeItem(id);
      return {
        status: [
          `🔕 Notificações canceladas! Você optou por não receber mais atualizações sobre o contrato nº ${contractNumber} 📄. Se quiser ativá-las novamente no futuro, estaremos por aqui! 😉`,
        ],
      };
    } catch (error) {}
  }

  async sendUserMessages() {
    try {
      const items = await this.sapDynamoDB.getAllItems();

      const messagesPromise = items.map(async (item) => {
        const contracts = (await this.sapCacheService.getCache(
          TableName.CONTRACT,
          item.contractNumber,
        )) as ZMMF_CB_CONTRATO[];

        const message: Message = {
          messageBody: {
            attributes: [
              { name: 'numero_contrato', value: item.contractNumber },
              { name: 'nome_fornecedor', value: contracts[0].NAME1 },
            ],
            id: item.id,
            integrationId: ''.toString(),
            internalId: item.id,
            phone: item.userPhoneNumber,
            token: '',
          },
          callback: () => ({ ok: true }),
        };

        if (!moment().isSame(moment(item.notificationDate, 'DD/MM/YYYY'))) return;

        let contract: ZMMF_CB_CONTRATO = undefined;
        let isEliminated = true;
        contracts.forEach((contractItem, index) => {
          if (!contractItem.LOEKZ) {
            isEliminated = false;
            contract = contracts[index];
          }
        });

        const consumedPercent = parseFloat(contract.FORMULA) / parseFloat(contract.KTWRT);
        const endContractDate = moment(contract.KDATE);

        // ELIMINADO OU SALDO EXPIRADO OU CONTRATO EXPIRADO
        if (isEliminated || consumedPercent >= 1 || moment().isAfter(endContractDate, 'day')) {
          await this.sapDynamoDB.removeItem(item.id);
          message.messageBody.templateId = '68306b7a727562e6625c8afb';
          message.messageBody.attributes.push({
            name: 'nome_usuario',
            value: contract.EKNAM,
          });

          return message;
        }

        // 3 MESES FINALIZAR
        if (moment().add(3, 'month').isAfter(endContractDate, 'day') && !item.warningExpiration) {
          await this.sapDynamoDB.updateItem(item.id, { key: 'warningExpiration', value: true });
          message.messageBody.templateId = '68306bc8ef66ff7c3d5e8504';
          return message;
        }

        const balance = parseFloat(contract.FORMULA).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const consumed = (parseFloat(contract.KTWRT) - parseFloat(contract.FORMULA)).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        // 80% DO TOTAL CONSUMIDO
        if (consumedPercent >= 0.8 && !item.warningBalance) {
          await this.sapDynamoDB.updateItem(item.id, { key: 'warningBalance', value: true });
          message.messageBody.templateId = '68306a7ee2a2622906d266ed';
          message.messageBody.attributes.push(
            ...[
              { name: 'data_vigencia', value: moment(contract.KDATE).format('DD/MM/YYYY') },
              { name: 'saldo_disponivel', value: consumed },
            ],
          );
          return message;
        }

        // ENVIO PADRÃO
        if (moment(item.notificationDate, 'DD/MM/YYYY').day() === moment().day()) {
          message.messageBody.templateId = '68306ac88013a149a515c909';
          message.messageBody.attributes.push(
            ...[
              { name: 'data_inicio_vigencia', value: moment(contract.KDATB).format('DD/MM/YYYY') },
              { name: 'data_vigencia', value: moment(contract.KDATE).format('DD/MM/YYYY') },
              { name: 'saldo_utilizado', value: balance },
              { name: 'saldo_disponivel', value: consumed },
            ],
          );
          return message;
        }

        return undefined;
      });
      const messages = await Promise.allSettled(messagesPromise);
      const messagesOk = messages
        .filter((el) => el.status === 'fulfilled')
        .map((el: PromiseFulfilledResult<Message>) => el.value)
        .filter((el) => !!el);
      await this.apiQueueService.enqueue(messagesOk);
    } catch (error) {
      console.error('error:', error);
    }
  }
}
