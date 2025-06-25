import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { CatchError } from "../../auth/exceptions";
import { AccountData, BillingSpecificationData } from "../interfaces/create-initial-setup.interface";
import { AccountService } from "../../billing/services/account.service";
import { WorkspaceService } from "../../billing/services/workspace.service";
import { CreateWorkspaceChannelSpecification } from "../../billing/dto/workspace-channel-specification.dto";

@Injectable()
export class SetupBillingService {
    constructor(private readonly moduleRef: ModuleRef) {}

    @CatchError()
    async createAccount(accountData: AccountData) {
        const accountService = this.moduleRef.get<AccountService>(AccountService, { strict: false });
        const account = await accountService.create(accountData);
        return account;
    }

    @CatchError()
    async getAccountById(accountId: number) {
        const accountService = this.moduleRef.get<AccountService>(AccountService, { strict: false });
        const account = await accountService.getOneById(accountId);
        return account;
    }

    @CatchError()
    async getAccountByGatewayClientId(gatewayClientId: string) {
        const accountService = this.moduleRef.get<AccountService>(AccountService, { strict: false });
        const account = await accountService.getOneByGatewayClientId(gatewayClientId);
        return account;
    }

    @CatchError()
    async createSpecification(
        specData: BillingSpecificationData,
        workspaceId: string,
        accountId: number,
        workspaceName: string,
        createWorkspaceChannelSpecifications?: CreateWorkspaceChannelSpecification[],
    ) {
        const specificationService = this.moduleRef.get<WorkspaceService>(WorkspaceService, { strict: false });
        const spec = await specificationService.createWorkspaceBillingSpecification(
            {
                ...specData,
                id: workspaceId,
                accountId,
                name: workspaceName,
            },
            createWorkspaceChannelSpecifications,
        );

        return spec;
    }
}
