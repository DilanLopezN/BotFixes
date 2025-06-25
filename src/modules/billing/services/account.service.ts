import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { CatchError } from './../../auth/exceptions';
import { Connection, In, Not, Repository } from 'typeorm';

import { Account } from '../models/account.entity';
import { Workspace } from '../models/workspace.entity';
import { isArray } from 'lodash';
import { Payment } from '../models/payment.entity';
import * as moment from 'moment';
import { BILLING_CONNECTION } from '../ormconfig';
import { WorkspaceService } from './workspace.service';
import { AsaasService } from './asaas.service';


@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(Account, BILLING_CONNECTION)
        private accountRepository: Repository<Account>,
        private readonly workspaceService: WorkspaceService,
        @InjectConnection(BILLING_CONNECTION)
        private connection: Connection,
        private readonly asaasService: AsaasService,
    ) {}

    @CatchError()
    async create(account: Partial<Account>, workspaceIds?: string[]) {
        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (!account.gatewayClientId) {
                const costumer = await this.asaasService.createCustomer(
                   await this.getGatewayCustomerFromAccount(account as Account),
                )
                if (costumer) {
                    account.gatewayClientId = costumer.id
                }
            } else {
                await this.asaasService.updateCustomer(account.gatewayClientId,
                    await this.getGatewayCustomerFromAccount(account as Account))
            }
            const createdAccount = await queryRunner.manager.save(Account, account);
            if (!!workspaceIds && workspaceIds.length && isArray(workspaceIds)) {
                for (const wId of workspaceIds) {
                    await queryRunner.manager.update(Workspace, {id: wId}, {
                        accountId: createdAccount.id,
                    })
                }
            }
            await queryRunner.commitTransaction();
            return createdAccount;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }
    @CatchError()
    private async getGatewayCustomerFromAccount(account: Account) {
        return {
            name: account.legalName || account.company,
            email: account.email,
            phone: account.phoneNumber,
            mobilePhone: account.phoneNumber,
            cpfCnpj: account.registrationId,
            postalCode: account.postalCode,
            address: account.addressLine1,
            addressNumber: account.addressLine2,
            complement: account.addressLine3,
            province: account.districtOrCounty,
            notificationDisabled: false,
            // "externalReference": ,
            // "municipalInscription": "46683695908",
            // "stateInscription": "646681195275",
            // "observations": "ótimo pagador, nenhum problema até o momento"
          }
    }

    @CatchError()
    async udpate(account: Partial<Account>, accountId: number, workspaceIds: string[]) {
        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {

            // delete account.registrationId;
            await queryRunner.manager.update(Account, {id: accountId}, account);
            // await queryRunner.manager.update(Workspace, {id: In(workspaceIds)}, { accountId });
            // await queryRunner.manager.update(Workspace, {id: Not(In(workspaceIds)), accountId}, { accountId: null });
            if (!workspaceIds) workspaceIds = [];
            if (!!workspaceIds && workspaceIds.length && isArray(workspaceIds)) {
                for (const wId of workspaceIds) {
                    await queryRunner.manager.update(Workspace, {id: wId}, {
                        accountId: accountId,
                    });
                }
            }
            const oldWorkspaceIds: string[] = await this.workspaceService.getWorkspaceIdsByAccountId(accountId);
            const removingIds = oldWorkspaceIds.filter(x => !workspaceIds.includes(x))
            if (!!removingIds && removingIds.length && isArray(removingIds)) {
                for (const wId of removingIds) {
                    await queryRunner.manager.update(Workspace, {id: wId}, {
                        accountId: null,
                    });
                }
            }
            await queryRunner.commitTransaction();
        
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    @CatchError()
    async getOneById(accountId: number) {
        return await this.accountRepository.findOne(accountId);
    }

    @CatchError()
    async getOneByGatewayClientId(gatewayClientId: string) {
        return await this.accountRepository.createQueryBuilder('ac')
        .where('ac.gatewayClientId = :id', {id: gatewayClientId})
        .getOne();
    }

    @CatchError()
    async getAccountsCount() {
        return this.accountRepository.createQueryBuilder()
        .getCount();
    }

    @CatchError()
    async getAccounts(simpleView?: boolean) {
        let query = this.accountRepository.createQueryBuilder('ac')
        .leftJoinAndMapMany(
            'ac.vinculeToWorkspaceIds',
            Workspace,
            'w',
            `ac.id = w.account_id`,
        )
        .select(['ac', 'w.id', 'w.name', 'w.accountId' ]);

        if (simpleView) {
            query.select(['ac.id', 'ac.company', 'ac.legalName', 'ac.registrationId', 'w.id', 'w.name', 'w.accountId' ]);
        } else {
            query.select(['ac', 'w.id', 'w.name', 'w.accountId' ]);
        }

        return query.getMany();
    }


    /**
     * Pega a quantidade de contas com cobrança em aberto para o mes atual
     */
    @CatchError()
    async getOpenPaymentAccountsCount() {
        return this.accountRepository.createQueryBuilder('ac')
        .innerJoinAndMapOne(
            'ac.openedPayment',
            Payment,
            'payment',
            `ac.id = payment.account_id AND payment.status <> 'paid'`,
        )
        .where('payment.billing_month = :month', { month: moment().format("MM/YY") })
        .getCount()
    }

    /**
     * Pega a quantidade de contas com cobrança pagas para o mes atual
     */
    @CatchError()
    async getPaidPaymentAccountsCount() {
        return this.accountRepository.createQueryBuilder('ac')
        .innerJoinAndMapOne(
            'ac.openedPayment',
            Payment,
            'payment',
            `ac.id = payment.account_id AND payment.status = 'paid'`,
        )
        .where('payment.billing_month = :month', { month: moment().format("MM/YY") })
        .getCount()
    }

    /**
     * Pega a quantidade de contas sem cobranças para o mes atual
     */
    @CatchError()
    async getNotPaymentAccountsCount() {
        return this.accountRepository.createQueryBuilder('ac')
        .leftJoinAndMapOne(
            'ac.openedPayment',
            Payment,
            'payment',
            `ac.id = payment.account_id AND payment.billing_month = '${moment().format("MM/YY")}'`,
        )
        .andWhere('payment.id IS NULL')
        .getCount()
    }

    /**
     * Busca de cnpj 
     * @param cnpj 
     */
    @CatchError()
    async getAccountGateway(cnpj: string): Promise<Partial<Account>> {
        let result: any = {}
        
        try {
            const responseAsaas = await this.asaasService.getCustomerByCnpj(cnpj);

            if (responseAsaas?.data.length) {
                result =  {
                    gatewayClientId: responseAsaas.data[0].id,
                    postalCode: responseAsaas.data[0].postalCode,
                    email: responseAsaas.data[0].email,
                    addressLine1: responseAsaas.data[0].address,
                    addressLine2: responseAsaas.data[0].addressNumber,
                    addressLine3: responseAsaas.data[0].complement,
                    legalName: responseAsaas.data[0].name,
                    phoneNumber: responseAsaas.data[0].phone || responseAsaas.data[0].mobilePhone,
                    state: responseAsaas.data[0].state,
                    districtOrCounty: responseAsaas.data[0].province,
                } as Partial<Account>;
            }

            const responseCnpj = await this.asaasService.cnpj(cnpj);

            if (responseCnpj) {
                result = {
                    ...result,
                    city: responseCnpj.municipio,
                    addressLine1: result.addressLine1 || responseCnpj.logradouro,
                    addressLine2: result.addressLine2 || responseCnpj.numero,
                    addressLine3: result.addressLine3 || responseCnpj.complemento,
                    districtOrCounty: result.districtOrCountry || responseCnpj.bairro,
                    email: result.email || responseCnpj.email,
                    legalName: result.legalName || responseCnpj.nome,
                    state: result.state || responseCnpj.uf,
                    company: responseCnpj.fantasia,
                    phoneNumber: result.phoneNumber || responseCnpj.telefone,
                    postalCode: result.postalCode || responseCnpj.cep
                } as Partial<Account>;
            }

            return result;
        } catch(e){

            console.log('AccountService.getAccountGateway', e)
            throw e;
        }
    }

}
