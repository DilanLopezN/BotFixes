import { BotAttributesService } from '../../botAttributes/botAttributes.service';
import { Injectable, forwardRef, Inject, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Interaction } from '../interfaces/interaction.interface';
import { castObjectId, castObjectIdToString } from '../../../common/utils/utils';
import { get, isEqual, omit, pick } from 'lodash';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Model } from 'mongoose';
import { FixedResponsesWelcome, InteractionType } from '../interfaces/response.interface';
import { MoveInteractionDto } from '../dtos/moveInteractionDto.dto';
import { InteractionModel } from '../schemas/interaction.schema';
import { ILanguageInteraction } from '../interfaces/language.interface';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { CacheService } from '../../_core/cache/cache.service';
import { InteractionUpdateService } from './interactionUpdate.service';
import { InteractionSharedService } from './interactionShared.service';
import { Exceptions } from '../../auth/exceptions';
import { CommentDto, InteractionDto } from '../dtos/interactionDto.dto';
import { User } from '../../users/interfaces/user.interface';
import { Comment } from '../interfaces/comment.interface';
import { EventsService } from './../../events/events.service';
import {
    KissbotEventType,
    KissbotEventDataType,
    IBotPublishedEvent,
    KissbotEventSource,
    ResponseType,
    ButtonType,
    IPart,
    IResponseElementMedicalAppointment,
    IResponseElementBDMedicalAppointment,
    ElementType,
    IResponseElementBDPatientIdentification,
    IResponseElementBDReasonForNotScheduling,
    IResponseElementBDMedicalScale,
    IResponseElementBDAppointmentList,
    IResponseElementBDPatientCreation,
    IResponseElementBDPatientRecoverPassword,
    IResponseElementBDCheckAccount,
} from 'kissbot-core';
import { isSystemUxAdmin } from '../../../common/utils/roles';
import * as moment from 'moment';
import { InteractionHistoryService } from './interactionHistory.service';
import { BotsPublicationsHistoryService } from '../../bot-publication-history/bot-publication-history.service';
import { CopyInteraction } from '../interfaces/copyInteraction.interface';
import { EntitiesService } from '../../../modules/entities/entities.service';
import { BotsService } from '../../..//modules/bots/bots.service';
import { FilterOperator } from '../interfaces/filter.interface';
import { ExternalDataService } from './external-data.service';

interface InteractionError {
    name: string;
    _id: string;
    withoutAnyParent?: boolean;
}

@Injectable()
export class InteractionsService extends MongooseAbstractionService<Interaction> {
    isProduction: boolean;

    constructor(
        @InjectModel('Interaction') protected model: Model<Interaction>,
        @InjectModel('InteractionPublished') protected readonly modelPublished: Model<Interaction>,
        private readonly interactionHistoryService: InteractionHistoryService,
        @Inject(forwardRef(() => WorkspacesService))
        private readonly workspacesService: WorkspacesService,
        @Inject(forwardRef(() => BotAttributesService))
        private readonly botAttributesService: BotAttributesService,
        @Inject(forwardRef(() => BotsService))
        private readonly botService: BotsService,
        private readonly interactionUpdateService: InteractionUpdateService,
        private readonly interactionSharedService: InteractionSharedService,
        private readonly externalDataService: ExternalDataService,
        readonly eventsService: EventsService,
        cacheService: CacheService,
        private readonly botsPublicationsHistoryService: BotsPublicationsHistoryService,
        private readonly entitiesService: EntitiesService,
    ) {
        super(model, cacheService, eventsService);
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    private getCacheKey(paramId: any, published: boolean): string {
        return published ? `published.${paramId}` : paramId.toString();
    }

    public async getOne(paramId: any, published?: boolean): Promise<Interaction> {
        let result: Interaction = null;

        if (this.cacheService && paramId) {
            const cacheKey = this.getCacheKey(paramId, published);
            result = await this.cacheService.get(cacheKey);

            if (result) {
                return result;
            }
        }

        if (typeof paramId === 'string') {
            paramId = castObjectId(paramId);
        }

        result = await this.resolveContextualModel(published)
            .findOne({
                _id: paramId,
                deletedAt: null,
            })
            .exec();

        if (this.cacheService && result) {
            const cacheKey = this.getCacheKey(result._id, published);
            this.cacheService.set(result, cacheKey).then().catch(console.log);
        }

        return result;
    }

    getSearchFilter(search: string): any {}

    getEventsData() {
        return {
            dataType: KissbotEventDataType.INTERACTION,
            create: KissbotEventType.INTERACTION_CREATED,
            delete: KissbotEventType.INTERACTION_DELETED,
        };
    }

    public async initBotInteraction(workspaceId: any, botId: string): Promise<void> {
        await Promise.all([
            this.createInteraction(
                new InteractionModel({
                    workspaceId,
                    botId,
                    name: 'Welcome',
                    type: InteractionType.welcome,
                }),
            ),
            this.createInteraction(
                new InteractionModel({
                    workspaceId,
                    botId,
                    name: 'Fallback',
                    type: InteractionType.fallback,
                }),
            ),
        ]);
    }

    getPath(interaction) {
        return this.interactionSharedService.getPath(interaction);
    }

    public async getInteractionChildrens(interactionId, published?: boolean) {
        return this.resolveContextualModel(published).find({ parentId: interactionId }).exec();
    }

    public async getInteractionsByIds(interactionsById: string, published?: boolean) {
        const arrayInteractionId = interactionsById.split(',').map((id) => castObjectId(id));

        return await this.resolveContextualModel(published).find({ _id: { $in: arrayInteractionId } });
    }

    public async getWelcomeInteraction(botId: string, published?: boolean): Promise<Interaction> {
        const interaction = await this.findOne({ botId, type: InteractionType.welcome }, {}, published);

        if (!interaction) {
            throw Exceptions.WELCOME_INTERACTION_NOT_FOUND;
        }

        return interaction;
    }

    public async getFallbackInteraction(
        botId: string,
        interactionId: string,
        published?: boolean,
    ): Promise<Interaction> {
        const interaction = await this.resolveContextualModel(published)
            .findOne({
                $or: [
                    {
                        $and: [{ parentId: interactionId }, { type: InteractionType.contextFallback }],
                    },
                    { $and: [{ botId }, { type: InteractionType.fallback }] },
                ],
            })
            .sort({ _id: -1 });

        if (!interaction) {
            throw Exceptions.FALLBACK_INTERACTION_NOT_FOUND;
        }

        return interaction;
    }

    public async getInteractionContextFallback(
        botId: string,
        interactionId: string,
        published?: boolean,
    ): Promise<Interaction> {
        let fallback = await this.resolveContextualModel(published)
            .findOne({
                $and: [
                    { botId },
                    { parentId: interactionId },
                    { type: InteractionType.contextFallback },
                    { deletedAt: { $eq: null } },
                ],
            })
            .sort({ _id: -1 });

        if (!fallback) {
            const interaction = await this.getOne(interactionId, published);

            for (let i = interaction.completePath.length - 1; i >= 0; i--) {
                let parentId = interaction.completePath[i];

                fallback = await this.model
                    .findOne({
                        $and: [
                            { botId },
                            { type: InteractionType.contextFallback },
                            { parentId },
                            { deletedAt: { $eq: null } },
                        ],
                    })
                    .sort({ _id: -1 });

                if (fallback) {
                    break;
                }
            }
        }

        if (!fallback) {
            fallback = await this.resolveContextualModel(published)
                .findOne({
                    $and: [{ botId }, { type: InteractionType.fallback }],
                })
                .sort({ _id: -1 });
        }

        return fallback;
    }

    public async filterInteractionsByArgs(botId, args: any, published?: boolean): Promise<Interaction[]> {
        return await this.resolveContextualModel(published).find({ botId }).sort({ position: -1 }).exec();
    }

    public async getAll(objectParams = {}): Promise<Interaction[]> {
        return await this.model
            .find({ ...objectParams, deletedAt: { $eq: null } })
            .sort({ position: 1 })
            .exec();
    }

    public async findOne(params: any, args?: any, published?: boolean) {
        return await this.resolveContextualModel(published)
            .findOne({ ...params }, { ...args })
            .exec();
    }

    public async getAllWelcomeInteractionByWorkspaceId(workspaceId: string): Promise<Interaction[]> {
        const interactions = await this.getAll({ workspaceId, type: InteractionType.welcome });

        return interactions;
    }

    // Função que adiciona responses que seram fixas no inicio de todas as interactions do tipo Welcome
    // Motivo: fizemos desta forma para facilitar alterações sem envolver um UX para alteração de determinadas responses no fluxo.
    public async updateWelcomeInteractionWithFixedResponse(
        workspaceId: string,
        fixedResponseType: FixedResponsesWelcome,
        element?: any,
    ): Promise<{ ok: Boolean }> {
        if (!ResponseType?.[fixedResponseType]) {
            return { ok: false };
        }
        const fixedResponses: {
            [key: string]: {
                position: number;
                response: any;
            };
        } = {
            [ResponseType[FixedResponsesWelcome.REASSIGN_CONVERSATION]]: {
                position: 0,
                response: {
                    type: ResponseType.REASSIGN_CONVERSATION,
                    elements: [
                        element
                            ? element
                            : ({
                                  teamId: '',
                              } as ElementType),
                    ],
                    _id: undefined,
                    delay: 1000,
                    filter: {
                        operator: FilterOperator.and,
                        conditions: [],
                    },
                    sendTypping: true,
                },
            },
            [ResponseType[FixedResponsesWelcome.PRIVACY_POLICY]]: {
                position: 1,
                response: {
                    type: ResponseType.PRIVACY_POLICY,
                    elements: [element ? element : ({} as ElementType)],
                    _id: undefined,
                    delay: 1000,
                    filter: {
                        operator: FilterOperator.and,
                        conditions: [],
                    },
                    sendTypping: true,
                },
            },
        };

        try {
            const interactions = await this.getAllWelcomeInteractionByWorkspaceId(workspaceId);

            if (interactions.length) {
                for (let interaction of interactions) {
                    const newLanguages = interaction.languages?.map((language) => {
                        if (language.language === 'pt-BR') {
                            // pega todas responses fixas menos a que vai ser adicionada
                            const responseFixedFiltered = Object.keys(fixedResponses)?.filter(
                                (key) => key !== String(ResponseType[fixedResponseType]),
                            );
                            const existOthersFixedResponse = language.responses.filter((response) => {
                                return !!responseFixedFiltered?.find(
                                    (keyFixedResponse) => keyFixedResponse === response.type,
                                );
                            });
                            const indexFixedResponse = language.responses.findIndex(
                                (response) => response.type === ResponseType?.[fixedResponseType],
                            );
                            // Caso não exista outras responses fixas na interaction e a response não esteja na interaction pode adicionar no inicio
                            if (!existOthersFixedResponse.length && indexFixedResponse < 0) {
                                language.responses.unshift(fixedResponses[ResponseType[fixedResponseType]].response);
                            } else if (indexFixedResponse < 0) {
                                // Se não irá adicionar ela na posição especifica que esta response deve ficar
                                language.responses.splice(
                                    fixedResponses[ResponseType[fixedResponseType]].position,
                                    0,
                                    fixedResponses[ResponseType[fixedResponseType]].response,
                                );
                            } else {
                                // atualiza a response fixa, removendo a antiga e adicionando a nova
                                language.responses.splice(
                                    indexFixedResponse,
                                    1,
                                    fixedResponses[ResponseType[fixedResponseType]].response,
                                );
                            }
                        }
                        return language;
                    });

                    await this.model
                        .updateOne(
                            { _id: interaction._id },
                            {
                                $set: {
                                    languages: newLanguages,
                                },
                            },
                        )
                        .exec();
                    await this.modelPublished
                        .updateOne(
                            { _id: interaction._id },
                            {
                                $set: {
                                    languages: newLanguages,
                                },
                            },
                        )
                        .exec();

                    const cacheKey = this.getCacheKey(interaction._id, false);
                    const cacheKeyPublished = this.getCacheKey(interaction._id, true);
                    this.cacheService.remove(cacheKey);
                    this.cacheService.remove(cacheKeyPublished);
                }
            }

            return { ok: true };
        } catch (e) {
            console.error('ERROR ON Function updateWelcomeInteractionWithFixedResponse:', JSON.stringify(e));
            return { ok: false };
        }
    }

    public async updateInteraction(interaction: Interaction, forceUpdateOnDialogFlow?: boolean, loggedUserId?: string) {
        const { data } = await this.queryPaginate({
            filter: {
                workspaceId: interaction.workspaceId,
                botId: interaction.botId,
            },
        });
        await this.interactionSharedService.checkValidIntentContextInteraction(interaction, data);
        const newInteraction = await this.interactionUpdateService.updateInteraction(
            interaction,
            forceUpdateOnDialogFlow,
            loggedUserId,
        );
        await this.interactionHistoryService.create(loggedUserId, newInteraction);

        await this.updateBotUpdatedAt(newInteraction);
        return newInteraction;
    }

    private async updateBotUpdatedAt(interaction: Interaction): Promise<void> {
        if (process.env.NODE_ENV != 'production') {
            // console.log('update', interaction.botId);
        }
        await this.botService.updateBotUpdatedAt(interaction.botId, moment().valueOf());
    }

    private async moveInteraction(interaction: Interaction): Promise<void> {
        try {
            const interactionPrevParent = await this.model.findOne({
                botId: castObjectId(interaction.botId),
                children: { $in: [interaction._id] },
            });
            if (interactionPrevParent) {
                // remove new children of previous parent
                await this.model.updateOne(
                    { _id: castObjectId(get(interactionPrevParent, '_id')) },
                    { $pull: { children: { $in: [interaction._id] } } },
                );
                await this.model.updateOne({ _id: interaction._id }, { parentId: undefined });
            }
            if (interaction.parentId && interaction.parentId !== 'undefined') {
                await this.model.updateOne(
                    { _id: castObjectId(interaction.parentId) },
                    { $push: { children: interaction._id } },
                );
                await this.model.updateOne(
                    { _id: interaction._id },
                    { parentId: interaction.parentId, position: interaction.position },
                );
            }
        } catch (e) {
            throw Exceptions.BAD_REQUEST;
        }
    }

    public async moveParent(interactionId: string, parentInteractionId: string, moveDto?: MoveInteractionDto) {
        try {
            const interaction = await this.getOne(interactionId);
            interaction.parentId = parentInteractionId;
            interaction.position = moveDto.position || interaction.position;
            await this.moveInteraction(interaction);
            return { message: 'Moved' };
        } catch (e) {
            throw Exceptions.BAD_REQUEST;
        }
    }

    private async validateParent(interaction: Interaction): Promise<Interaction> {
        let parent: Interaction = null;

        if (
            (interaction.type === InteractionType.interaction ||
                interaction.type === InteractionType.contextFallback) &&
            interaction.parentId
        ) {
            parent = await this.getOne(interaction.parentId);
            if (parent?.deletedAt) {
                throw new Error('Parent interactions could not be deleted');
            }
            if (parent?.type === InteractionType.fallback) {
                throw new Error('Interaction could be fallback as a parent');
            }

            if (parent?.reference) {
                throw Exceptions.CANNOT_CREATE_ON_PARENT_REFERENCE;
            }
        }

        return parent;
    }

    private async validateDuplicateWelcomeAndFallback(interaction: Interaction): Promise<void> {
        let is_unique = null;

        if (
            interaction.type === InteractionType.welcome ||
            interaction.type === InteractionType.fallback ||
            interaction.type === InteractionType.contextFallback
        ) {
            const _with_parent_query = [];

            if (interaction.parentId) {
                _with_parent_query.push({ parentId: interaction.parentId });
            }

            is_unique = await this.model
                .findOne({
                    $and: [
                        { botId: interaction.botId },
                        { deletedAt: { $eq: null } },
                        {
                            $or: [
                                {
                                    $and: [..._with_parent_query, { type: interaction.type }],
                                },
                            ],
                        },
                    ],
                })
                .limit(1);
        }

        if (is_unique) {
            throw Exceptions.NOT_UNIQUE_CONTEXT_INTERACTION;
        }
    }

    /**
     * Função para chekar se o pai de uma interaction é uma referencia
     * @param interaction
     */
    private async checkParentIsReference(interaction: Interaction) {
        if (interaction.type == InteractionType.fallback || interaction.type == InteractionType.welcome) {
            return;
        }
        if (!interaction.parentId) return;

        const parent = await this.getOne(interaction.parentId);
        if (parent.reference) {
            throw Exceptions.CANNOT_CREATE_ON_PARENT_REFERENCE;
        }
    }

    /**
     * função para criar uma interaction
     * @param interaction
     */
    public async createInteraction(interaction: Interaction, loggedUserId?: string, updateBot?: boolean) {
        const parent = await this.validateParent(interaction);
        // await this.checkParentIsReference(interaction);

        await this.validateDuplicateWelcomeAndFallback(interaction);
        interaction = this.interactionSharedService.generateResponseElementsUUID(interaction);

        if (!interaction.languages || interaction.languages.length == 0) {
            interaction.languages = [];
            interaction.languages.push({ language: 'pt-BR', responses: [], userSays: [] } as ILanguageInteraction);
            interaction.languages.push({ language: 'en', responses: [], userSays: [] } as ILanguageInteraction);
            interaction.languages.push({ language: 'es', responses: [], userSays: [] } as ILanguageInteraction);
        }

        if (interaction.reference) {
            const position = interaction.position;
            interaction = await this.getReferenceInteraction(interaction.reference, interaction);
            interaction.position = position;
            interaction.params = null;
        }

        if (parent) {
            interaction.path = await this.interactionSharedService.getPath(parent);
            interaction.completePath = await this.interactionSharedService.getCompletePath(parent);
        }

        const interactionWithHighestPosition = await this.model
            .findOne({ workspaceId: interaction.workspaceId, botId: interaction.botId })
            .sort({ position: -1 })
            .limit(1);

        const position = interactionWithHighestPosition?.position ?? interaction.position;
        interaction.position = Number(position) + 1000;

        if (loggedUserId) {
            interaction.lastUpdateBy = {
                userId: loggedUserId,
                updatedAt: moment().valueOf(),
            };
        }

        const newInteraction: Interaction = await this.create(interaction);
        const dialogFlowInstance = await this.workspacesService.dialogFlowInstance(newInteraction.workspaceId);

        if (dialogFlowInstance) {
            const dialogFlowIntent = await dialogFlowInstance.newIntent(newInteraction);
            if (dialogFlowIntent && dialogFlowIntent.length > 0) {
                newInteraction.params = { dialogFlow: { intent: dialogFlowIntent[0] } };

                await newInteraction.save();
            }
        }

        if (updateBot) {
            await this.updateBotUpdatedAt(newInteraction);
        }
        return newInteraction;
    }

    /**
     * Função para buscar uma interaction e retornar uma cópia que será referência
     * @param toReferenceInteractionId
     */
    private async getReferenceInteraction(referencedInteractionId: string, referencerInteraction: Interaction) {
        const interactionToReference: Interaction = await this.getOne(referencedInteractionId);

        return this.getReferencedInteractionBody(interactionToReference, referencerInteraction);
    }

    /**
     * Função para criar um POJO de um interaction para cria-la como referencia
     * @param referencedInteraction
     * @param referencerInteraction
     */
    private getReferencedInteractionBody(referencedInteraction: Interaction, referencerInteraction: Interaction) {
        return {
            name: referencedInteraction.name,
            description: referencedInteraction.description,
            type: referencedInteraction.type,
            parameters: referencedInteraction.parameters,
            languages: referencedInteraction.languages,
            botId: referencerInteraction.botId,
            parentId: referencerInteraction.parentId,
            params: referencedInteraction.params,
            reference: referencedInteraction._id,
            triggers: referencedInteraction.triggers,
        } as Interaction;
    }

    public async deleteInteraction(interactionId: string, user?: User): Promise<void> {
        const interactionDelete = await this.getOne(interactionId);
        const isUxAdmin = isSystemUxAdmin(user);

        if (
            !isUxAdmin &&
            (interactionDelete.type === InteractionType.welcome || interactionDelete.type === InteractionType.fallback)
        ) {
            throw Exceptions.CANNOT_DELETE_WELCOME_AND_FALLBACK;
        }

        const interactions = [interactionDelete];

        const childrens = await this.model.find({
            $and: [
                { botId: interactionDelete.botId },
                {
                    completePath: {
                        $in: [interactionDelete._id],
                    },
                },
            ],
        });

        interactions.push(...childrens);

        const dialogFlowInstance = await this.workspacesService.dialogFlowInstance(interactionDelete.workspaceId);

        for (let i = 0; i < interactions.length; i++) {
            const interaction = interactions[i];
            try {
                if (!!dialogFlowInstance) {
                    await dialogFlowInstance.deleteIntent(interaction);
                }
            } catch (err) {
                console.log('error delete interaction', err);
            }
            await this.botAttributesService.deleteByInteractionIdAndBotId(interaction._id, interaction.botId);
            await this.delete(castObjectIdToString(interaction._id));
        }

        await this.updateBotUpdatedAt(interactionDelete);
    }

    public async getInteractionByTriggerAndBotId(
        botId: string,
        trigger: string,
        interactionId: string,
        published?: boolean,
    ): Promise<Interaction> {
        let beforeEndConversation: Interaction = null;

        if (interactionId) {
            const $and: any[] = [
                { botId: castObjectId(botId) },
                { type: InteractionType.interaction },
                { triggers: trigger },
                { deletedAt: { $eq: null } },
                { parentId: castObjectId(interactionId) },
            ];

            beforeEndConversation = await this.resolveContextualModel(published)
                .findOne({
                    $and,
                })
                .sort({ _id: -1 });
        }

        let interaction = null;
        if (!beforeEndConversation && interactionId) {
            interaction = await this.resolveContextualModel(published).findById(interactionId).sort({ _id: -1 });
            for (let i = interaction.completePath.length - 1; i >= 0; i--) {
                let parentId = interaction.completePath[i];
                if (parentId) {
                    beforeEndConversation = await this.model
                        .findOne({
                            $and: [
                                { botId: castObjectId(botId) },
                                { type: InteractionType.interaction },
                                { triggers: trigger },
                                { parentId: parentId },
                                { deletedAt: { $eq: null } },
                            ],
                        })
                        .sort({ _id: -1 });

                    if (beforeEndConversation) {
                        break;
                    }
                }
            }
        }

        if (!beforeEndConversation) {
            let _query = {
                $and: [
                    { botId: castObjectId(botId) },
                    { type: InteractionType.interaction },
                    { triggers: trigger },
                    { $or: [{ parentId: null }, { path: [botId] }] },
                ],
            };

            beforeEndConversation = await this.resolveContextualModel(published).findOne(_query).sort({ _id: -1 });
        }

        return beforeEndConversation;
    }

    public async existsInteractionByTriggers(workspaceId: string, trigger: string) {
        let query = {
            $and: [
                { workspaceId: castObjectId(workspaceId) },
                { type: InteractionType.interaction },
                { triggers: trigger },
                { deletedAt: { $eq: null } },
            ],
        };

        const modelPublished = await this.resolveContextualModel(true);
        const modelNotPublished = await this.resolveContextualModel(false);

        const interactionsPublished = await modelPublished.findOne(query);
        const interactionsNotPublished = await modelNotPublished.findOne(query);

        return !!interactionsNotPublished || !!interactionsPublished;
    }

    public getInteractionByBotId(botId: string): Promise<Array<Interaction>> {
        return this.model
            .find({
                botId: castObjectId(botId),
            })
            .exec();
    }

    public async createComment(interactionId: string, commentDto: CommentDto, user: User) {
        const comment: Comment = { ...commentDto, userId: user._id, createdAt: new Date().toISOString() } as Comment;
        const interaction: Interaction = await this.getOne(interactionId);
        if (!interaction.comments) interaction.comments = [];
        interaction.comments.push(comment);
        return this.update(interactionId, interaction);
    }

    public async setBotInteractionToCache(botId) {
        const interactions: Array<Interaction> = await this.getAll({
            botId,
        });
        interactions.forEach((interaction) => {
            this.cacheService.set(interaction, interaction._id.toString());
        });
    }

    private async validateInteractionResponses(
        interaction: Interaction,
        triggers: { [key: string]: string[] },
        workspaceId: string,
        botId: string,
        interactions: Interaction[],
    ) {
        const err_token = 'Invalid response';
        const createError = (data: any) => `${err_token}:${interaction._id}:${interaction.name}:${data}`;

        const errosGoTo: {
            _id: string;
            name: string;
            responses: string[];
        }[] = [];

        const addError = (responseId: string) => {
            const existing = errosGoTo.find((e) => e._id === interaction._id);
            if (existing) {
                existing.responses.push(responseId);
            } else {
                errosGoTo.push({
                    _id: interaction._id as string,
                    name: interaction.name,
                    responses: [responseId],
                });
            }
        };

        for (const language of interaction.languages) {
            for (const userSay of language.userSays) {
                for (const part of userSay.parts) {
                    if ((part as IPart).type == '@sys.any') {
                        throw createError('userSays');
                    }
                }
            }
            for (const response of language.responses) {
                if (response.type === ResponseType.BOT_DESIGNER_MEDICAL_APPOINTMENT) {
                    for (const element of response.elements) {
                        const ma: IResponseElementBDMedicalAppointment =
                            element as IResponseElementBDMedicalAppointment;
                        if (ma.isEmptyGoto && ma.isEmptyGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(ma.isEmptyGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                        if (ma.isErrorGoto && ma.isErrorGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(ma.isErrorGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                        if (ma.isAgendamentoNaoConfirmadoGoto && ma.isAgendamentoNaoConfirmadoGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(
                                    castObjectId(ma.isAgendamentoNaoConfirmadoGoto),
                                ),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                        if (ma.checkAccountGoto && ma.checkAccountGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(ma.checkAccountGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                    }
                } else if (response.type === ('MEDICAL_APPOINTMENT' as any)) {
                    for (const element of response.elements) {
                        const ma: IResponseElementMedicalAppointment = element as IResponseElementMedicalAppointment;
                        if (ma.isEmptyGoto && ma.isEmptyGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(ma.isEmptyGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                        if (ma.isErrorGoto && ma.isErrorGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(ma.isErrorGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                        if (ma.notAccountGoto && ma.notAccountGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(ma.notAccountGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }
                    }
                } else if (response.type === ResponseType.CARD || response.type === ResponseType.CAROUSEL) {
                    for (const element of response.elements) {
                        (element as any)?.buttons?.forEach((button) => {
                            switch (button.type) {
                                case ButtonType.goto: {
                                    if (!button?.value || button?.value === '') {
                                        addError(response._id);
                                    }

                                    const interactionExist = !!interactions.find((currInteraction) =>
                                        castObjectId(currInteraction._id)?.equals?.(castObjectId(button.value)),
                                    );
                                    if (!interactionExist) {
                                        addError(response._id);
                                    }
                                    break;
                                }
                                case ButtonType.postback: {
                                    if (
                                        !button?.value ||
                                        button?.value === '' ||
                                        !Object.values(triggers).find((triggers) => triggers.includes(button?.value))
                                    ) {
                                        throw createError(`CardButtonPostback:${button.title}`);
                                    }
                                    break;
                                }
                                default:
                                    break;
                            }
                        });
                    }
                } else if (response.type === ResponseType.GOTO) {
                    for (const element of response.elements as any[]) {
                        if (!element.value || element.value == '') {
                            addError(response._id);
                        }
                        const interactionExist = !!interactions.find((currInteraction) =>
                            castObjectId(currInteraction._id)?.equals?.(castObjectId(element.value)),
                        );
                        if (!interactionExist) {
                            addError(response._id);
                        }
                    }
                } else if (response.type === ResponseType.CONVERSATION_ASSIGNED) {
                    for (const element of response.elements) {
                        const elCopy = element as any;

                        if (!elCopy.version || elCopy.version != 2) {
                            throw createError(`INVALID_RESPONSE:empty`);
                        }

                        if (!elCopy.teamId) {
                            throw createError(`CONVERSATION_ASSIGNED:empty`);
                        }

                        if (elCopy.cannotAssignGoto && elCopy.cannotAssignGoto !== '') {
                            const interactionExist = !!interactions.find((currInteraction) =>
                                castObjectId(currInteraction._id)?.equals?.(castObjectId(elCopy.cannotAssignGoto)),
                            );
                            if (!interactionExist) {
                                addError(response._id);
                            }
                        }

                        // assim pode estar no cache
                        const team = await this.externalDataService.getTeamById(elCopy.teamId);
                        if (castObjectIdToString(team?.workspaceId) !== workspaceId) {
                            throw createError(`CONVERSATION_ASSIGNED:inexistent`);
                        }

                        if (team?.inactivatedAt) {
                            throw createError(`CONVERSATION_ASSIGNED:inactivated`);
                        }
                    }
                } else if (
                    response.type === ResponseType.BOT_DESIGNER_CHECK_ACCOUNT ||
                    response.type === ResponseType.BOT_DESIGNER_RECOVER_PASSWORD ||
                    response.type === ResponseType.BOT_DESIGNER_PATIENT_CREATION ||
                    response.type === ResponseType.BOT_DESIGNER_APPOINTMENT_LIST ||
                    response.type === ResponseType.BOT_DESIGNER_MEDICAL_SCALE ||
                    response.type === ResponseType.BOT_DESIGNER_REASON_FOR_NOT_SCHEDULING ||
                    response.type === ResponseType.BOT_DESIGNER_PATIENT_IDENTIFICATION
                ) {
                    const verifyResponses = {
                        [ResponseType.BOT_DESIGNER_CHECK_ACCOUNT]: {
                            isErrorGoto: '',
                            accountExistsGoto: '',
                            accountNotExistsGoto: '',
                            accountMismatchGoto: '',
                            accountExistsDataMismatchGoto: '',
                        } as Partial<IResponseElementBDCheckAccount>,
                        [ResponseType.BOT_DESIGNER_RECOVER_PASSWORD]: {
                            isErrorGoto: '',
                        } as Partial<IResponseElementBDPatientRecoverPassword>,
                        [ResponseType.BOT_DESIGNER_PATIENT_CREATION]: {
                            isEmptyGoto: '',
                            isErrorGoto: '',
                            accountCreatedGoto: '',
                        } as Partial<IResponseElementBDPatientCreation>,
                        [ResponseType.BOT_DESIGNER_APPOINTMENT_LIST]: {
                            isEmptyGoto: '',
                            isErrorGoto: '',
                            isSheduledGoto: '',
                            actionIgnoredGoto: '',
                            isRescheduledGoto: '',
                            cannotDoActionGoto: '',
                            accountNotExistsGoto: '',
                        } as Partial<IResponseElementBDAppointmentList>,
                        [ResponseType.BOT_DESIGNER_MEDICAL_SCALE]: {
                            isEmptyGoto: '',
                            isErrorGoto: '',
                        } as Partial<IResponseElementBDMedicalScale>,
                        [ResponseType.BOT_DESIGNER_REASON_FOR_NOT_SCHEDULING]: {
                            isEmptyGoto: '',
                            isErrorGoto: '',
                        } as Partial<IResponseElementBDReasonForNotScheduling>,
                        [ResponseType.BOT_DESIGNER_PATIENT_IDENTIFICATION]: {
                            isErrorGoto: '',
                        } as Partial<IResponseElementBDPatientIdentification>,
                    };

                    const validFieldResponse = verifyResponses?.[response.type];
                    if (validFieldResponse) {
                        for (const element of response.elements) {
                            for (const field of Object.keys(validFieldResponse)) {
                                const gotoId = element[field];
                                if (gotoId && gotoId !== '') {
                                    const interactionExist = !!interactions.find((currInteraction) =>
                                        castObjectId(currInteraction._id)?.equals?.(castObjectId(gotoId)),
                                    );
                                    if (!interactionExist) {
                                        addError(response._id);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (errosGoTo.length > 0) {
            throw {
                statusCode: 400,
                message: errosGoTo,
                error: 'INTERACTIONS_PUBLISH_FAILED',
            };
        }
    }

    private getTriggers(interactions: Interaction[]) {
        return interactions.reduce((acc, cur) => {
            cur.triggers?.length > 0 && (acc[castObjectIdToString(cur._id)] = cur.triggers);
            return acc;
        }, {});
    }

    public async publishErrors(botId: string, workspaceId: string): Promise<void | never> {
        const devInteractions = await this.model.find({ workspaceId, botId, deletedAt: null }).exec();
        const failedInteractionNames: { _id: string; name: string; responses: string[] }[] = [];
        const triggers: { [key: string]: string[] } = this.getTriggers(devInteractions);
        const failedInteractions: Interaction[] = [];

        for (const devInteraction of devInteractions) {
            try {
                await this.validateInteractionResponses(devInteraction, triggers, workspaceId, botId, devInteractions);
            } catch (e) {
                if (!devInteraction?.deletedAt) {
                    if (e?.message?.length) {
                        e?.message?.map((ob) => {
                            failedInteractionNames.push({
                                _id: castObjectIdToString(ob?._id) || castObjectIdToString(devInteraction._id),
                                name: ob?.name || devInteraction.name || devInteraction.type,
                                responses: ob?.responses,
                            });
                        });
                    } else {
                        failedInteractions.push(devInteraction);
                    }
                }
            }
        }

        if (failedInteractions.length) {
            const withErrorInteractions = failedInteractions.map(async (interaction) => {
                const obj: InteractionError = {
                    _id: castObjectIdToString(interaction._id),
                    name: interaction.name,
                };

                const parentInteractions = await this.model.find({
                    workspaceId,
                    botId,
                    _id: { $in: [...interaction.completePath] },
                    deletedAt: { $not: { $eq: null } },
                });

                if (parentInteractions.length) {
                    obj.withoutAnyParent = true;
                }

                return obj;
            });
            const errors = await Promise.all(withErrorInteractions);
            throw new BadRequestException(errors, 'INTERACTIONS_PUBLISH_FAILED');
        }

        if (failedInteractionNames.length) {
            throw new BadRequestException(failedInteractionNames, 'INTERACTIONS_PUBLISH_FAILED');
        }
    }

    public async interactionsPendingPublication(botId: string, workspaceId: string): Promise<void | never> {
        const bot = await this.botService.findOne({ _id: castObjectId(botId) });
        const botPublicationDate = bot?.publishedAt ? new Date(bot.publishedAt) : null;
        const devInteractions = await this.model
            .find({
                workspaceId,
                botId,
                type: { $in: [InteractionType.welcome, InteractionType.interaction, InteractionType.fallback] },
                $or: [
                    { $expr: { $gt: [{ $toDate: '$deletedAt' }, { $literal: botPublicationDate }] } },
                    { $expr: { $gt: [{ $toDate: '$updatedAt' }, { $literal: botPublicationDate }] } },
                    { $expr: { $gt: [{ $toDate: '$createdAt' }, { $literal: botPublicationDate }] } },
                ],
            })
            .exec();

        const interactionsResult = await Promise.all(
            devInteractions.map(async (interaction) => {
                const interactionOldVersion =
                    await this.interactionHistoryService.getInteractionBeforeLastChangesAndLastPublication(
                        workspaceId,
                        botId,
                        interaction,
                    );
                const interactionName =
                    interaction.name || (interaction.type === InteractionType.fallback ? 'Fallback' : 'not_name');
                return {
                    name: interactionName,
                    _id: interaction._id,
                    interactionNewVersion: interaction,
                    interactionOldVersion: interactionOldVersion?.interaction || null,
                };
            }),
        );

        const triggers = ['before_end_conversation'];

        const validInteractionsChanged = interactionsResult.filter((result) => {
            const keysToInclude = [
                'labels',
                'children',
                'languages',
                'comments',
                'parameters',
                'triggers',
                'deletedAt',
            ];

            if (result.interactionNewVersion && result.interactionOldVersion) {
                if (result.interactionNewVersion?.triggers?.find((trigger) => triggers.includes(trigger))) {
                    keysToInclude.push(...['path', 'completePath']);
                }

                const currInteractionNew = pick({ ...result.interactionNewVersion?.toJSON?.() }, keysToInclude);
                const currInteractionOld = pick({ ...result.interactionOldVersion?.toJSON?.() }, keysToInclude);

                return !isEqual(currInteractionNew, currInteractionOld);
            }
            return true;
        });

        if (validInteractionsChanged.length) {
            throw new BadRequestException(validInteractionsChanged, 'INTERACTIONS_PENDING_PUBLICATION');
        }
    }

    public async getInteractionsBeforeLastChanges(workspaceId: string, botId: string): Promise<any> {
        const bot = await this.botService.getOne(botId);
        const devInteractions = await this.model
            .find({
                workspaceId,
                botId,
                type: { $in: [InteractionType.welcome, InteractionType.interaction, InteractionType.fallback] },
                $or: [
                    {
                        $expr: {
                            $gt: ['$deletedAt', { $ifNull: ['$publishedAt', bot.publishedAt] }],
                        },
                    },
                    {
                        $expr: {
                            $gt: ['$updatedAt', { $ifNull: ['$publishedAt', bot.publishedAt] }],
                        },
                    },
                    {
                        $expr: {
                            $gt: ['$createdAt', { $ifNull: ['$publishedAt', bot.publishedAt] }],
                        },
                    },
                ],
            })
            .exec();

        if (!devInteractions.length) {
            return [];
        }

        return await Promise.all(
            devInteractions.map(async (interaction: Interaction) => {
                return await this.interactionHistoryService.getInteractionBeforeLastChangesAndLastPublication(
                    workspaceId,
                    botId,
                    interaction,
                );
            }),
        );
    }

    public async publish(botId: string, workspaceId: string, userId: string, comment?: string): Promise<void | never> {
        const devInteractions = await this.model.find({ workspaceId, botId, deletedAt: null }).exec();

        const publishedInteractionsMap = await this.getPublishedInteractionsMap(botId);
        const publishedInteractionsIds: string[] = [];
        const failedInteractionNames: { _id: string; name: string; responses: string[] }[] = [];
        const triggers: { [key: string]: string[] } = this.getTriggers(devInteractions);

        for (const devInteraction of devInteractions) {
            try {
                await this.validateInteractionResponses(devInteraction, triggers, workspaceId, botId, devInteractions);
            } catch (e) {
                if (!devInteraction?.deletedAt) {
                    if (e?.message?.length) {
                        e?.message?.map((ob) => {
                            const existing = failedInteractionNames.find(
                                (e) => e._id === castObjectIdToString(devInteraction._id),
                            );
                            if (!existing) {
                                failedInteractionNames.push({
                                    _id: castObjectIdToString(ob?._id) || castObjectIdToString(devInteraction._id),
                                    name: ob?.name || devInteraction.name || devInteraction.type,
                                    responses: ob?.responses,
                                });
                            } else {
                                existing.responses.push(...ob?.responses);
                            }
                        });
                    } else {
                        const existing = failedInteractionNames.find(
                            (e) => e._id === castObjectIdToString(devInteraction._id),
                        );
                        if (!existing) {
                            failedInteractionNames.push({
                                _id: castObjectIdToString(devInteraction._id),
                                name: devInteraction.name || devInteraction.type,
                                responses: [],
                            });
                        }
                    }
                }
            }
        }

        if (failedInteractionNames.length) {
            throw new BadRequestException(failedInteractionNames, 'INTERACTIONS_PUBLISH_FAILED');
        }

        for (const devInteraction of devInteractions) {
            try {
                if (publishedInteractionsMap.has(String(devInteraction._id))) {
                    const data = omit(
                        { ...devInteraction.toJSON({ minimize: false }), publishedAt: moment().toISOString() },
                        ['createdAt', 'updatedAt'],
                    );
                    const cacheKey = this.getCacheKey(devInteraction._id, true);

                    await this.model.updateOne({ _id: devInteraction._id }, data);
                    await this.modelPublished.updateOne({ _id: devInteraction._id }, data);
                    if (!devInteraction.deletedAt) {
                        publishedInteractionsMap.delete(String(devInteraction._id));
                    }

                    this.cacheService.remove(cacheKey);
                    publishedInteractionsIds.push(castObjectIdToString(devInteraction._id));
                } else {
                    const data = omit(
                        { ...devInteraction.toJSON({ minimize: false }), publishedAt: moment().toISOString() },
                        ['createdAt'],
                    ) as Interaction;
                    await this.model.updateOne({ _id: devInteraction._id }, data);
                    if (!devInteraction.deletedAt) {
                        await this.modelPublished.create(data);
                    }
                    const cacheKey = this.getCacheKey(devInteraction._id, true);
                    this.cacheService.remove(cacheKey);
                    publishedInteractionsIds.push(castObjectIdToString(devInteraction._id));
                }
            } catch (e) {
                failedInteractionNames.push({
                    _id: castObjectIdToString(devInteraction._id),
                    name: devInteraction.name || devInteraction.type,
                    responses: e.responses,
                });
            }
        }

        const interactionsToDelete = [...publishedInteractionsMap.keys()];

        await this.modelPublished.deleteMany({
            _id: { $in: interactionsToDelete },
        });

        this.eventsService.sendEvent({
            data: {
                deletedInteractionIds: interactionsToDelete,
                interactionIds: publishedInteractionsIds,
                botId,
                workspaceId,
            } as IBotPublishedEvent,
            dataType: KissbotEventDataType.ANY,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.BOT_PUBLISHED,
        });

        if (failedInteractionNames.length) {
            throw new BadRequestException(failedInteractionNames, 'INTERACTIONS_PUBLISH_FAILED');
        }

        await this.botsPublicationsHistoryService.create(userId, workspaceId, botId, comment);
    }

    private async getPublishedInteractionsMap(botId: string): Promise<Map<string, Interaction>> {
        const interactionsMap = new Map();
        const interactions = await this.modelPublished.find({ botId });

        interactions.forEach((interaction) => interactionsMap.set(String(interaction._id), interaction));

        return interactionsMap;
    }

    public async publishInteraction(
        botId: string,
        workspaceId: string,
        user: User,
        interactionId: string,
        comment?: string,
    ): Promise<void> {
        await this.botService.validateBotPublication(botId, workspaceId, user?.toJSON?.() as User);

        const devInteraction = await this.model.findOne({ _id: castObjectId(interactionId) }).exec();
        const devInteractions = await this.model.find({ workspaceId, botId, deletedAt: null }).exec();
        const failedInteractionNames: { _id: string; name: string; responses: string[] }[] = [];
        if (!devInteraction) {
            throw Exceptions.INTERACTION_NOT_FOUND;
        }

        const triggers: { [key: string]: string[] } = this.getTriggers([devInteraction]);
        try {
            await this.validateInteractionResponses(devInteraction, triggers, workspaceId, botId, devInteractions);
        } catch (e) {
            if (!devInteraction?.deletedAt) {
                if (e?.message?.length) {
                    e?.message?.map((ob) => {
                        const existing = failedInteractionNames.find(
                            (e) => e._id === castObjectIdToString(devInteraction._id),
                        );
                        if (!existing) {
                            failedInteractionNames.push({
                                _id: castObjectIdToString(ob?._id) || castObjectIdToString(devInteraction._id),
                                name: ob?.name || devInteraction.name || devInteraction.type,
                                responses: ob?.responses,
                            });
                        } else {
                            existing.responses.push(...ob?.responses);
                        }
                    });
                } else {
                    const existing = failedInteractionNames.find(
                        (e) => e._id === castObjectIdToString(devInteraction._id),
                    );
                    if (!existing) {
                        failedInteractionNames.push({
                            _id: castObjectIdToString(devInteraction._id),
                            name: devInteraction.name || devInteraction.type,
                            responses: [],
                        });
                    }
                }
            }
        }

        if (failedInteractionNames.length) {
            throw new BadRequestException(failedInteractionNames, 'INTERACTIONS_PUBLISH_FAILED');
        }

        const publishedInteraction = await this.modelPublished.findOne({ _id: castObjectId(interactionId) }).exec();
        try {
            if (publishedInteraction) {
                const data = omit(
                    { ...devInteraction.toJSON({ minimize: false }), publishedAt: moment().toISOString() },
                    ['createdAt', 'updatedAt'],
                );
                const cacheKey = this.getCacheKey(devInteraction._id, true);
                await this.model.updateOne({ _id: devInteraction._id }, data);
                await this.modelPublished.updateOne({ _id: devInteraction._id }, data);
                this.cacheService.remove(cacheKey);
            } else {
                const data = omit(
                    { ...devInteraction.toJSON({ minimize: false }), publishedAt: moment().toISOString() },
                    ['createdAt'],
                ) as Interaction;
                await this.model.updateOne({ _id: devInteraction._id }, data);
                const interaction = await this.modelPublished.create(data);
                const cacheKey = this.getCacheKey(interaction._id, true);
                this.cacheService.remove(cacheKey);
            }
        } catch (e) {
            throw new BadRequestException(
                {
                    _id: devInteraction._id,
                    name: devInteraction.name || devInteraction.type,
                },
                'INTERACTION_PUBLISH_FAILED',
            );
        }

        this.eventsService.sendEvent({
            data: {
                deletedInteractionIds: [],
                interactionIds: [devInteraction.id],
                botId,
                workspaceId,
            } as IBotPublishedEvent,
            dataType: KissbotEventDataType.ANY,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.BOT_PUBLISHED,
        });
    }

    private resolveContextualModel(published?: boolean): Model<Interaction> {
        if (published) {
            return this.modelPublished;
        }

        return this.model;
    }

    public async getInteractionByContextAndContainIntent(
        botId: string,
        context: string,
        intent: string,
        published?: boolean,
    ) {
        let interactionWithIntent: Interaction = null;

        if (context) {
            const $and: any[] = [
                { botId: castObjectId(botId) },
                { type: InteractionType.interaction },
                {
                    languages: { $elemMatch: { intents: { $in: [intent] } } },
                },
                { deletedAt: { $eq: null } },
                { parentId: castObjectId(context) },
                { _id: { $ne: castObjectId(context) } },
            ];

            interactionWithIntent = await this.resolveContextualModel(published)
                .findOne({
                    $and,
                })
                .sort({ _id: -1 });
        }

        let interaction = null;
        if (!interactionWithIntent && context) {
            interaction = await this.resolveContextualModel(published).findById(context).sort({ _id: -1 });
            for (let i = interaction.completePath.length - 1; i >= 0; i--) {
                let parentId = interaction.completePath[i];
                if (parentId) {
                    interactionWithIntent = await this.model
                        .findOne({
                            $and: [
                                { botId: castObjectId(botId) },
                                { type: InteractionType.interaction },
                                {
                                    languages: { $elemMatch: { intents: { $in: [intent] } } },
                                },
                                { parentId: parentId },
                                { _id: { $ne: castObjectId(context) } },
                                { deletedAt: { $eq: null } },
                            ],
                        })
                        .sort({ _id: -1 });

                    if (interactionWithIntent) {
                        break;
                    }
                }
            }
        }

        if (!interactionWithIntent) {
            let _query = {
                $and: [
                    { botId: castObjectId(botId) },
                    { type: InteractionType.interaction },
                    {
                        languages: { $elemMatch: { intents: { $in: [intent] } } },
                    },
                    { _id: { $ne: castObjectId(context) } },
                    { $or: [{ parentId: null }, { path: [botId] }] },
                ],
            };

            interactionWithIntent = await this.resolveContextualModel(published).findOne(_query).sort({ _id: -1 });
        }

        return interactionWithIntent;
    }

    public async checkInteractionIsPublishedByTrigger(workspaceId: string, trigger: string): Promise<boolean> {
        const interaction = await this.resolveContextualModel(true).exists({
            $and: [
                { workspaceId: castObjectId(workspaceId) },
                { type: InteractionType.interaction },
                { triggers: trigger },
                { deletedAt: { $eq: null } },
            ],
        });
        return !!interaction;
    }
}
