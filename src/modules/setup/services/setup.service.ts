import { Injectable } from '@nestjs/common';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { CreateInitialSetup } from '../interfaces/create-initial-setup.interface';
import { SetupSetting } from '../models/setup-setting.entity';
import { SetupBillingService } from './setup-billing.service';
import { SetupSettingService } from './setup-setting.service';
import { SetupWorkspaceService } from './setup-workspace.service';

@Injectable()
export class SetupService {
    constructor(
        private readonly setupBillingService: SetupBillingService,
        private readonly setupWorkspaceService: SetupWorkspaceService,
        private readonly setupSettingService: SetupSettingService,
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
            const newAccount = account ? 
            {
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

        return {
            workspace,
            account,
            billingSpecification,
        };
    }
}
