import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WHATSAPP_FLOW_CONNECTION } from '../ormconfig';
import { WhatsappFlowLibrary } from '../models/whatsapp-flow-library.entity';
import { FlowCategoryService } from './flow-category.service';
import { CustomBadRequestException, Exceptions, INTERNAL_ERROR_THROWER } from '../../auth/exceptions';
import { WhatsappFlowLibraryDto } from '../dto/whatsapp-flow-library.dto';
import { Flow } from '../models/flow.entity';
import { DefaultResponse } from '../../../common/interfaces/default';
import { FlowCategory } from '../models/flow-category.entity';
import { FilterWhatsappFlowLibraryDto } from '../dto/filter-whatsapp-flow-library.dto';
import { ExternalDataService } from './external-data.service';
import { FlowData } from '../models/flow-data.entity';

@Injectable()
export class WhatsappFlowLibraryService {
    private readonly logger = new Logger(WhatsappFlowLibraryService.name);

    constructor(
        @InjectRepository(WhatsappFlowLibrary, WHATSAPP_FLOW_CONNECTION)
        private repository: Repository<WhatsappFlowLibrary>,
        private readonly flowCategoryService: FlowCategoryService,
        private readonly externalDataServiceByFlow: ExternalDataService,
    ) {}

    async create(data: WhatsappFlowLibraryDto) {
        const existingCategories = await this.flowCategoryService.getFlowCategoryByIds(data.flowCategoryIds);

        // Se o número de categorias encontradas for diferente do número de categorias fornecidas, algumas categorias não existem
        if (existingCategories?.length !== data.flowCategoryIds.length) {
            throw INTERNAL_ERROR_THROWER(
                'Algumas categorias não existem',
                new CustomBadRequestException('Algumas categorias não existem', 'CATEGORIES_NOT_FOUND'),
            );
        }
        return await this.repository.save({
            name: data.name,
            friendlyName: data.friendlyName,
            flowCategoryIds: data.flowCategoryIds,
            flowJSON: data.flowJSON,
            templateMessageData: data.templateMessageData,
            variablesOfFlowData: data.variablesOfFlowData,
            flowFields: data.flowFields,
            flowPreviewData: data.flowPreviewData,
        });
    }

    async update(id: number, data: WhatsappFlowLibraryDto) {
        const library = await this.repository.findOne(id);

        if (!library) {
            throw Exceptions.NOT_FOUND_FLOW_LIBRARY;
        }

        const existingCategories = await this.flowCategoryService.getFlowCategoryByIds(data.flowCategoryIds);

        // Se o número de categorias encontradas for diferente do número de categorias fornecidas, algumas categorias não existem
        if (existingCategories?.length !== data.flowCategoryIds.length) {
            throw INTERNAL_ERROR_THROWER(
                'Algumas categorias não existem',
                new CustomBadRequestException('Algumas categorias não existem', 'CATEGORIES_NOT_FOUND'),
            );
        }
        return await this.repository.update(
            { id },
            {
                name: data.name,
                friendlyName: data.friendlyName,
                flowCategoryIds: data.flowCategoryIds,
                flowJSON: data.flowJSON,
                templateMessageData: data.templateMessageData,
                variablesOfFlowData: data.variablesOfFlowData,
                flowFields: data.flowFields,
                flowPreviewData: data.flowPreviewData,
            },
        );
    }

    async getAll() {
        const result = await this.repository.find();

        return { data: result };
    }

    async getAllFlowLibraryWithVinculedFlows(
        workspaceId: string,
        filter?: FilterWhatsappFlowLibraryDto,
    ): Promise<DefaultResponse<WhatsappFlowLibrary[]>> {
        let query = this.repository
            .createQueryBuilder('flowLibrary')
            .leftJoinAndMapMany(
                'flowLibrary.flows',
                Flow,
                'flow',
                'flow.flow_library_id = flowLibrary.id AND flow.workspace_id = :workspaceId',
                {
                    workspaceId,
                },
            )
            .leftJoinAndMapMany(
                'flowLibrary.flowCategories',
                FlowCategory,
                'flow_category',
                'flow_category.id = ANY(flowLibrary.flow_category_ids)',
            )
            .select([
                'flowLibrary.id',
                'flowLibrary.friendlyName',
                'flow.channelConfigId',
                'flow.status',
                'flow.active',
                'flow.workspaceId',
                'flow.id',
                'flow_category.category',
            ]);

        if (filter) {
            if (filter.search) {
                query = query.andWhere('LOWER(flowLibrary.friendlyName) LIKE LOWER(:friendlyName)', {
                    friendlyName: `%${filter.search}%`,
                });
            }

            if (filter.flowCategoryIds && filter.flowCategoryIds.length > 0) {
                query = query.andWhere('flowLibrary.flow_category_ids && ARRAY[:...flowCategoryIds]::numeric[]', {
                    flowCategoryIds: filter.flowCategoryIds,
                });
            }

            if (filter.channels && filter.channels.length > 0) {
                query = query.andWhere('flow.channelConfigId IN (:...channels)', {
                    channels: filter.channels,
                });
            }

            if (filter.channelStatus && filter.channelStatus.length > 0) {
                switch (filter.channelStatus?.[0]) {
                    case 'active':
                        query = query.andWhere('flow.active = true');
                        break;
                    case 'inactive':
                        query = query.andWhere('flow.active = false');
                        break;
                    // case 'available':
                    //     query = query.andWhere('flow.active = true');
                    //     break;
                }
                // query = query.andWhere('flow.status IN (:...channelStatus)', {
                //     channelStatus: filter.channelStatus,
                // });
            }
        }

        const result = await query.getMany();

        const flowsLibrary = result.map((currLibrary) => {
            return {
                ...currLibrary,
                flowCategories: currLibrary.flowCategories.map((flowCat) => flowCat.category),
            };
        });

        return { data: flowsLibrary };
    }

    async getWhatsappFlowLibraryById(id: number) {
        const result = await this.repository.findOne(id);

        return { data: result || null };
    }

    async getWhatsappFlowLibraryByIdAndworkspaceId(
        workspaceId: string,
        id: number,
    ): Promise<DefaultResponse<WhatsappFlowLibrary>> {
        let query = this.repository
            .createQueryBuilder('flowLibrary')
            .where('flowLibrary.id = :id', { id: id })
            .leftJoinAndMapMany(
                'flowLibrary.flows',
                Flow,
                'flow',
                'flow.flow_library_id = flowLibrary.id AND flow.workspace_id = :workspaceId',
                {
                    workspaceId,
                },
            )
            .leftJoinAndMapMany(
                'flowLibrary.flowCategories',
                FlowCategory,
                'flow_category',
                'flow_category.id = ANY(flowLibrary.flow_category_ids)',
            )
            .leftJoinAndMapMany('flow.flowsData', FlowData, 'flow_data', 'flow.id = flow_data.flow_id')
            .select([
                'flowLibrary.id',
                'flowLibrary.friendlyName',
                'flowLibrary.variablesOfFlowData',
                'flow.channelConfigId',
                'flow.flowId',
                'flow.status',
                'flow.active',
                'flow.workspaceId',
                'flow.id',
                'flow.createdAt',
                'flow.updatedAt',
                'flow_category.category',
                'flow_data',
            ]);
        const result = await query.getOne();

        let flowPreviewUrl = null;
        const channelConfigId = result?.flows?.[0]?.channelConfigId || result?.flowPreviewData?.channelConfigId;
        const flowId = result?.flows?.[0]?.flowId || result?.flowPreviewData?.flowId;
        if (channelConfigId && flowId) {
            const resultPreview = await this.externalDataServiceByFlow.getPreviewFlowURL(channelConfigId, flowId);
            flowPreviewUrl = resultPreview?.preview;
        }

        const flowLibrary = {
            ...result,
            flowCategories: result.flowCategories.map((flowCat) => flowCat.category),
            flowPreviewUrl,
        };
        return { data: flowLibrary || null };
    }
}
