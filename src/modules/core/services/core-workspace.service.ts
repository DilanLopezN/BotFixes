import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'bluebird';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { PaginatedModel } from '../../../common/interfaces/paginated';
import { CatchError } from '../../auth/exceptions';
import { WorkspaceService } from '../../billing/services/workspace.service';
import { CoreFilterInterface } from '../interfaces/core-filter.interface';
import { CountryState } from '../interfaces/country-state.interface';
import { CustomerErp } from '../interfaces/customer-erp.interface';
import { CustomerStep } from '../interfaces/customer-step.interface';
import { IntegrationProvider } from '../interfaces/integration_provider.interface';
import { InternalEmployee } from '../interfaces/internal-employee.interface';
import { Workspace } from '../interfaces/workspace.interface';
import { CoreWorkspace, CreateCoreWorkspaceData, UpdateCoreWorkspaceData } from '../models/core-workspace.entity';
import { Functionality } from '../models/functionality.entity';
import { Segment } from '../models/segment.entity';
import { CORE_CONNECTION } from '../ormconfig';
import { CountryStateService } from './country-state.service';
import { CustomerErpService } from './customer-erp.service';
import { CustomerStepService } from './customer-step.service';
import { FunctionalityService } from './functionality.service';
import { IntegrationProviderService } from './integration-provider.service';
import { InternalEmployeeService } from './internal-employee.service';
import { SegmentService } from './segment.service';

@Injectable()
export class CoreWorkspaceService {
    constructor(
        @InjectRepository(CoreWorkspace, CORE_CONNECTION)
        private coreWorkspaceRepository: Repository<CoreWorkspace>,
        private readonly CustomerErpService: CustomerErpService,
        private readonly CustomerStepService: CustomerStepService,
        private readonly CountryStateService: CountryStateService,
        private readonly InternalEmployeeService: InternalEmployeeService,
        private readonly IntegrationProviderService: IntegrationProviderService,
        private readonly SegmentService: SegmentService,
        private readonly FunctionalityService: FunctionalityService,
        private readonly moduleRef: ModuleRef,
    ) {}

    @CatchError()
    async create(data: CreateCoreWorkspaceData) {
        const dates = {
            botActivedAt: data.botActivedAt ? moment(data.botActivedAt).startOf('day').toDate() : undefined,
            churnAt: data.churnAt ? moment(data.churnAt).startOf('day').toDate() : undefined,
            contractSignedAt: data.contractSignedAt ? moment(data.contractSignedAt).startOf('day').toDate() : undefined,
            integrationDoneAt: data.integrationDoneAt
                ? moment(data.integrationDoneAt).startOf('day').toDate()
                : undefined,
            kickoffAt: data.kickoffAt ? moment(data.kickoffAt).startOf('day').toDate() : undefined,
            lastMeetingAt: data.lastMeetingAt ? moment(data.lastMeetingAt).startOf('day').toDate() : undefined,
            implantationDoneAt: data.implantationDoneAt
                ? moment(data.implantationDoneAt).startOf('day').toDate()
                : undefined,
        };

        return await this.coreWorkspaceRepository.save({
            ...data,
            ...dates,
        });
    }

    @CatchError()
    async update(data: UpdateCoreWorkspaceData) {
        const dates = {
            botActivedAt: data.botActivedAt ? moment(data.botActivedAt).startOf('day').toDate() : undefined,
            churnAt: data.churnAt ? moment(data.churnAt).startOf('day').toDate() : undefined,
            contractSignedAt: data.contractSignedAt ? moment(data.contractSignedAt).startOf('day').toDate() : undefined,
            integrationDoneAt: data.integrationDoneAt
                ? moment(data.integrationDoneAt).startOf('day').toDate()
                : undefined,
            kickoffAt: data.kickoffAt ? moment(data.kickoffAt).startOf('day').toDate() : undefined,
            lastMeetingAt: data.lastMeetingAt ? moment(data.lastMeetingAt).startOf('day').toDate() : undefined,
            implantationDoneAt: data.implantationDoneAt
                ? moment(data.implantationDoneAt).startOf('day').toDate()
                : undefined,
        };

        return await this.coreWorkspaceRepository.update(
            { id: data.id },
            {
                ...data,
                ...dates,
            },
        );
    }

    @CatchError()
    async list(query?: {
        skip?: number;
        limit?: number;
        filter?: CoreFilterInterface;
    }): Promise<PaginatedModel<CoreWorkspace>> {
        const skip = query?.skip || 0;
        const limit = query?.limit || 10;

        let qb = this.coreWorkspaceRepository.createQueryBuilder('core');

        if (query.filter) {
            if (query.filter?.id) {
                qb = qb.andWhere('core.id = :id', { id: query.filter.id });
            }

            if (query.filter?.countryStateId) {
                qb = qb.andWhere('core.countryStateId = :countryStateId', {
                    countryStateId: query.filter.countryStateId,
                });
            }

            if (query.filter?.customerErpId) {
                qb = qb.andWhere('core.customerErpId = :customerErpId', {
                    customerErpId: query.filter.customerErpId,
                });
            }

            if (query.filter?.customerStepId) {
                qb = qb.andWhere('core.customerStepId = :customerStepId', {
                    customerStepId: query.filter.customerStepId,
                });
            }

            if (query.filter?.integrationProviderId) {
                qb = qb.andWhere('core.integrationProviderId = :integrationProviderId', {
                    integrationProviderId: query.filter.integrationProviderId,
                });
            }

            if (query.filter?.csEmployeeId) {
                qb = qb.andWhere('core.csEmployeeId = :csEmployeeId', {
                    csEmployeeId: query.filter.csEmployeeId,
                });
            }

            if (query.filter?.uxEmployeeId) {
                qb = qb.andWhere('core.uxEmployeeId = :uxEmployeeId', {
                    uxEmployeeId: query.filter.uxEmployeeId,
                });
            }
        }

        if (query.skip) {
            qb = qb.skip(skip);
        }
        if (query.limit) {
            qb = qb.take(limit);
        }

        const [data, count] = await qb.getManyAndCount();

        return {
            count: count,
            data: data,
            currentPage: null,
            nextPage: null,
        };
    }

    @CatchError()
    async getCoreById(coreId: string): Promise<CoreWorkspace> {
        return await this.coreWorkspaceRepository.findOne({ id: coreId });
    }

    @CatchError()
    async getWorkspaceNameAndId(): Promise<Workspace[]> {
        const workspaceService = this.moduleRef.get<WorkspaceService>(WorkspaceService, { strict: false });
        const workspaces = await workspaceService.getWorkspacesNameAndId();
        return workspaces as Workspace[];
    }

    @CatchError()
    async getTableInfo(): Promise<{
        customerErp: CustomerErp[];
        customerStep: CustomerStep[];
        countryState: CountryState[];
        internalEmployee: InternalEmployee[];
        integrationProvider: IntegrationProvider[];
        workspaces: Workspace[];
        segments: Segment[];
        functionalities: Functionality[];
    }> {
        const promises = await new Promise<{
            customerErp: CustomerErp[];
            customerStep: CustomerStep[];
            countryState: CountryState[];
            internalEmployee: InternalEmployee[];
            integrationProvider: IntegrationProvider[];
        }>((resolve) => {
            join(
                this.CustomerErpService.listCustomerErp(),
                this.CustomerStepService.listCustomerStep(),
                this.CountryStateService.listCountryState(),
                this.InternalEmployeeService.listInternalEmployee(),
                this.IntegrationProviderService.listIntegrationProvider(),
                (customerErp, customerStep, countryState, internalEmployee, integrationProvider) => {
                    resolve({
                        customerErp,
                        customerStep,
                        countryState,
                        internalEmployee,
                        integrationProvider,
                    });
                },
            );
        });

        const promises2 = await new Promise<{
            workspaces: Workspace[];
            segments: Segment[];
            functionalities: Functionality[];
        }>((resolve) => {
            join(
                this.getWorkspaceNameAndId(),
                this.SegmentService.listSegment(),
                this.FunctionalityService.listFunctionality(),
                (workspaces, segments, functionalities) => {
                    resolve({
                        workspaces,
                        segments,
                        functionalities,
                    });
                },
            );
        });

        return { ...promises, ...promises2 };
    }

    async getUnusedWorkspaces(): Promise<Workspace[]> {
        const query = `
        SELECT billing.workspace.id, billing.workspace.name
        FROM billing.workspace
        LEFT JOIN core.core_workspace ON billing.workspace.id = core.core_workspace.id
        WHERE core.core_workspace.id IS NULL
        `;

        return await this.coreWorkspaceRepository.query(query);
    }
}
