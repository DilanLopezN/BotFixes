import { Injectable } from '@nestjs/common';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { CreateInitialSetup } from '../interfaces/create-initial-setup.interface';
import { SetupBillingService } from './setup-billing.service';
import { SetupWorkspaceService } from './setup-workspace.service';
import { SetupDefaultFeaturesService } from './setup-default-features.service';

@Injectable()
export class SetupService {
    constructor(
        private readonly setupBillingService: SetupBillingService,
        private readonly setupWorkspaceService: SetupWorkspaceService,
        private readonly setupDefaultFeaturesService: SetupDefaultFeaturesService,
    ) {}

    @CatchError()
    async createInitialSetup(body: CreateInitialSetup) {
        let account;
        const workspace = await this.setupWorkspaceService.createWorkspace(body.workspaceName);
        if (!workspace) {
            throw Exceptions.ERROR_CREATE_WORKSPACE_ON_SETUP;
        }

        if (body.accountData.gatewayClientId) {
            account = await this.setupBillingService.getAccountByGatewayClientId(body.accountData.gatewayClientId);
            const newAccount = account
                ? {
                      ...account,
                      ...body.accountData,
                  }
                : body.accountData;
            try {
                account = await this.setupBillingService.createAccount(newAccount);
            } catch (e) {
                console.error('SetupService.createInitialSetup.A with gatewayClientId', e);
            }
        } else {
            try {
                account = await this.setupBillingService.createAccount(body.accountData);
            } catch (e) {
                console.error('SetupService.createInitialSetup.A', e);
            }
        }

        if (!account) {
            throw Exceptions.ERROR_CREATE_ACCOUNT_ON_SETUP;
        }

        const billingSpecification = await this.setupBillingService.createSpecification(
            {
                ...body.billingSpecificationData,
                name: body.workspaceName,
            },
            workspace._id.toString ? workspace._id.toString() : workspace._id,
            account.id,
            workspace.name,
            body.workspaceChannelSpecifications,
        );

        try {
            await this.setupDefaultFeaturesService.setupDefaultFeatures(
                workspace._id.toString ? workspace._id.toString() : workspace._id,
            );
        } catch (error) {
            console.error(`[SetupDefaultFeatures] Erro ao configurar features padrão: ${error.message}`, error);
        }

        return {
            workspace,
            account,
            billingSpecification,
        };
    }
}
