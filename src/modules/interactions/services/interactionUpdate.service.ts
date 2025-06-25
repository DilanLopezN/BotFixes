import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Interaction } from '../interfaces/interaction.interface';
import { ILanguageInteraction } from '../interfaces/language.interface';
import { castObjectId, castObjectIdToString } from './../../../common/utils/utils';
import { InteractionModel } from '../schemas/interaction.schema';
import { InteractionSharedService } from './interactionShared.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { CacheService } from './../../_core/cache/cache.service';
import { CreateAttributesService } from './createAttributes.service';
import { KissbotEventDataType, KissbotEventType } from 'kissbot-core';
import { EventsService } from './../../events/events.service';
import * as moment from 'moment';
import { InteractionType } from '../interfaces/response.interface';
import { BotsService } from '../../../modules/bots/bots.service';
import * as Sentry from '@sentry/node';
import { hasChangedFields } from '../../../common/utils/changeTracker';

@Injectable()
export class InteractionUpdateService extends MongooseAbstractionService<Interaction> {
    constructor(
        @InjectModel('Interaction') protected readonly model: Model<Interaction>,
        private readonly interactionSharedService: InteractionSharedService,
        @Inject(forwardRef(() => WorkspacesService))
        private readonly workspacesService: WorkspacesService,
        @Inject(forwardRef(() => BotsService))
        private readonly botService: BotsService,
        private readonly createAttributes: CreateAttributesService,
        readonly eventsService: EventsService,
        cacheService: CacheService,
    ) {
        super(model, cacheService);
    }

    getSearchFilter(search: string) {}
    getEventsData() {
        return {
            dataType: KissbotEventDataType.INTERACTION,
            update: KissbotEventType.INTERACTION_UPDATED,
        };
    }

    /**
     * Função para atualizar uma interaction
     * Se for referencia chama função para atualizar referencia
     * Senão atualiza como sendo uma interaction parent(que dá origem a referencias)
     * @param interaction
     * @param forceUpdateOnDialogFlow : Parâmetro para atualizar o dialogflow, caso true a interaction e suas
     *      referencias serão atualizada no dialogflow, independente se teve alteração no userSays ou languages
     */
    async updateInteraction(interaction: Interaction, forceUpdateOnDialogFlow?: boolean, loggedUserId?: string) {
        interaction = this.interactionSharedService.generateResponseElementsUUID(interaction);
        if (interaction.reference) {
            return this.updateInteractionReference(interaction, forceUpdateOnDialogFlow);
        }
        const result = await this.updateInteractionParent(interaction, forceUpdateOnDialogFlow, loggedUserId);
        await this.updateBotUpdatedAt(interaction);
        return result;
    }

    /**
     * Função para atualizar as referencia filhas de uma interaction
     * Usada somente quando a interaction a ser atualizada for uma referencia pai
     * @param interaction
     */
    private async updateReferenceChildren(interaction: Interaction) {
        const referenceChilds = await this.model.find({ reference: interaction._id });
        const newChildsPromises: Array<Promise<Interaction>> = referenceChilds.map(
            async (interactionChild: Interaction) => {
                const newChildInteraction: Interaction = new InteractionModel({
                    name: interaction.name,
                    description: interaction.description,
                    type: interaction.type,
                    parameters: interaction.parameters,
                    languages: interaction.languages,
                    triggers: interaction.triggers,
                    params: interaction.params,
                    _id: castObjectId(interactionChild._id),
                    parentId: castObjectId(interactionChild.parentId),
                    position: interactionChild.position,
                    botId: castObjectId(interactionChild.botId),
                } as Interaction);
                return await this.updateDialogFlow(newChildInteraction, interactionChild);
            },
        );

        return await Promise.all(newChildsPromises);
    }

    /**
     * Função para atualizar o path dos filhos de um interaction
     * @param parentInteraction
     */
    private async updateChildrenPath(parentInteraction: Interaction, limit = 0) {
        if (limit > 50) {
            try {
                Sentry.captureEvent({
                    message: 'InteractionUpdateService.updateChildrenPath limit50', extra: {
                        workspaceId: parentInteraction.workspaceId,
                        interactionId: parentInteraction._id
                    }
                });
            } catch (e) {
                Sentry.captureEvent({
                    message: 'InteractionUpdateService.updateChildrenPath limit50 try', extra: {
                        e
                    }
                });
            }
            return;
        }
        const childrenInteraction: Array<Interaction> = await this.interactionSharedService.getInteractionChildrens(
            parentInteraction._id,
        );
        for (let i = 0; i < childrenInteraction.length; i++) {
            const childInteraction: Interaction = childrenInteraction[i];
            if (parentInteraction.type != InteractionType.container) {
                childInteraction.path = parentInteraction.path;
                childInteraction.path.push(castObjectIdToString(parentInteraction._id));
                await this._update(childInteraction);
            }
            limit++
            await this.updateChildrenPath(childInteraction, limit);
        }
    }

    private async _update(interaction: Interaction) {
        if (this.cacheService) {
            this.cacheService.remove(castObjectIdToString(interaction._id)).then();
        }

        const data: any = {
            name: interaction.name,
            action: interaction.action,
            description: interaction.description,
            type: interaction.type,
            parameters: interaction.parameters,
            comments: interaction.comments,
            languages: interaction.languages,
            isCollapsed: interaction.isCollapsed,
            triggers: interaction.triggers,
            children: interaction.children,
            path: interaction.path,
            completePath: interaction.completePath,
            labels: interaction.labels,
            position: interaction.position,
            parentId: interaction.parentId,
            params: interaction.params,
            reference: interaction.reference,
        };

        if (interaction.lastUpdateBy) {
            data.lastUpdateBy = interaction.lastUpdateBy;
        }

        if (interaction.updatedAt) {
            data.updatedAt = interaction.updatedAt;
        }

        await this.model.updateOne(
            { _id: interaction._id },
            {
                $set: data,
            },
        );
        const newObject = await this.model.findById(interaction._id);
        return newObject;
    }

    /**
     * Função para atualizar uma interaction reference child, ou seja um interaction clone de outra
     * @param interaction
     */
    private async updateInteractionReference(interaction: Interaction, forceUpdateOnDialogFlow?: boolean) {
        const referenceParent = await this.getOne(interaction.reference);
        const referenceChilds = await this.model.find({ reference: interaction.reference });
        const getNewBody = (): Interaction =>
            ({
                name: interaction.name,
                description: interaction.description,
                type: interaction.type,
                parameters: interaction.parameters,
                languages: interaction.languages,
                params: interaction.params,
                triggers: interaction.triggers,
            } as Interaction);
        const newParentObj: Interaction = new InteractionModel({
            ...getNewBody(),
            _id: castObjectId(referenceParent._id),
            parentId: castObjectId(referenceParent.parentId),
            position: referenceParent.position,
            botId: castObjectId(referenceParent.botId),
        } as Interaction);
        const newChildsPromises: Array<Promise<Interaction>> = referenceChilds.map(
            async (interactionChild: Interaction) => {
                const newChildInteraction: Interaction = new InteractionModel({
                    ...getNewBody(),
                    _id: castObjectId(interactionChild._id),
                    parentId: castObjectId(interactionChild.parentId),
                    position: interactionChild.position,
                    botId: castObjectId(interactionChild.botId),
                } as Interaction);
                if (castObjectId(interactionChild._id).toString() == castObjectId(interaction._id).toString()) {
                    const olderInteraction = interactionChild;
                    newChildInteraction.parentId = castObjectId(interaction.parentId);
                    newChildInteraction.position = interaction.position;
                    newChildInteraction.path = [];
                    if (!this.ObjectIdIsEquals(olderInteraction.parentId, newChildInteraction.parentId)) {
                        if (newChildInteraction.parentId) {
                            const parent = await this.getOne(newChildInteraction.parentId);
                            newChildInteraction.path = await this.interactionSharedService.getPath(parent);
                            newChildInteraction.completePath = await this.interactionSharedService.getCompletePath(
                                parent,
                            );
                        }
                    }
                }
                return await this.updateDialogFlow(newChildInteraction, interactionChild, forceUpdateOnDialogFlow);
            },
        );

        newChildsPromises.push(this.updateDialogFlow(newParentObj, referenceParent, forceUpdateOnDialogFlow));

        const newInteractions = await Promise.all(newChildsPromises);

        return newInteractions.find((newInteraction: Interaction) => newInteraction._id == interaction._id);
    }

    /**
     * Função para atualizar uma interaction que é uma referencia pai
     * @param interaction
     */
    private async updateInteractionParent(
        interaction: Interaction,
        forceUpdateOnDialogFlow?: boolean,
        loggedUserId?: string,
    ) {
        const olderInteraction = await this.model.findOne({ _id: interaction._id });

        interaction.path = [];
        interaction.completePath = [];

        if (interaction.parentId) {
            const parent = await this.getOne(interaction.parentId);
            interaction.path = await this.interactionSharedService.getPath(parent);
            interaction.completePath = await this.interactionSharedService.getCompletePath(parent);
        }
        await this.updateChildrenPath(interaction);

        await this.createAttributes.createBotAttributes(interaction);
        await this.updateReferenceChildren(interaction);
        return await this.updateDialogFlow(interaction, olderInteraction, forceUpdateOnDialogFlow, loggedUserId);
    }

    isEqual = (value, other) => {
        const type = Object.prototype.toString.call(value);

        if (type !== Object.prototype.toString.call(other)) return false;
        if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;
        const valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
        const otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
        if (valueLen !== otherLen) return false;
        const compare = (item1, item2) => {
            const itemType = Object.prototype.toString.call(item1);
            if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
                if (!this.isEqual(item1, item2)) return false;
            } else {
                if (itemType !== Object.prototype.toString.call(item2)) return false;

                if (itemType === '[object Function]') {
                    if (item1.toString() !== item2.toString()) return false;
                } else {
                    if (item1 !== item2) return false;
                }
            }
        };

        if (type === '[object Array]') {
            for (let i = 0; i < valueLen; i++) {
                if (compare(value[i], other[i]) === false) return false;
            }
        } else {
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    if (compare(value[key], other[key]) === false) return false;
                }
            }
        }
        return true;
    };

    ObjectIdIsEquals(idReference: string, idToCompare: string) {
        let result;
        if (!idReference && !idToCompare) {
            result = true;
        } else {
            result = new Types.ObjectId(idToCompare).equals(new Types.ObjectId(idReference));
        }
        return result;
    }

    /**
     * Função para verificar se um userSays de alguma linguagem foi alterado
     * Se foi alterado deve ser alterado também no DialogFlow senão apenas na interaction
     * @param interaction
     */
    private async updateDialogFlow(
        newInteraction: Interaction,
        oldInteraction: Interaction,
        forceUpdateOnDialogFlow?: boolean,
        loggedUserId?: string,
    ): Promise<Interaction> {
        // Precisa fazer um toJSON pois na comparação do usersays a função
        // this.isEqual não funciona para objetos do mongoose
        const newInteractionJSON = newInteraction.toJSON && (newInteraction.toJSON({ minimize: false }) as Interaction);
        const oldInteractionJSON = oldInteraction.toJSON && (oldInteraction.toJSON({ minimize: false }) as Interaction);

        let isLanguageEqual = true;
        for (let i = 0; i < newInteractionJSON.languages.length; i++) {
            const newLanguage = newInteractionJSON.languages[i] as any;
            const oldLanguage = (oldInteractionJSON.languages as any).find(
                (oldLanguageItem: ILanguageInteraction) => oldLanguageItem.language == newLanguage.language,
            );
            if (!oldLanguage) {
                isLanguageEqual = false;
                break;
            }
            try {
                // Tem que tirar o _id de cada usersay pois a função isEqual não funciona com tipo ObjectId
                newLanguage.userSays = newLanguage.userSays.map((userSay) => ({ parts: userSay.parts }));
                oldLanguage.userSays = oldLanguage.userSays.map((userSay) => ({ parts: userSay.parts }));
            } catch (e) {}

            if (!this.isEqual(newLanguage.userSays, oldLanguage.userSays)) {
                isLanguageEqual = false;
                break;
            }
        }
        if (newInteraction.languages.length !== oldInteraction.languages.length) {
            isLanguageEqual = false;
        }

        if (
            !isLanguageEqual ||
            forceUpdateOnDialogFlow ||
            !this.ObjectIdIsEquals(newInteraction.parentId, oldInteraction.parentId)
        ) {
            const dialogFlowInstance = await this.workspacesService.dialogFlowInstance(oldInteraction.workspaceId);
            if (dialogFlowInstance) {
                let dialogFlowIntent;
                if (oldInteraction.params) {
                    if (!forceUpdateOnDialogFlow) {
                        newInteraction.params = oldInteraction.params;
                    }

                    try {
                        dialogFlowIntent = await dialogFlowInstance.updateIntent(newInteraction);
                    } catch (error) {
                        console.log('error', JSON.stringify(error));
                        if (forceUpdateOnDialogFlow && error.code == 5) {
                            dialogFlowIntent = await dialogFlowInstance.newIntent(newInteraction);
                        }
                    }
                } else {
                    dialogFlowIntent = await dialogFlowInstance.newIntent(newInteraction);
                }
                if (dialogFlowIntent) {
                    newInteraction.params = {
                        dialogFlow: { intent: dialogFlowIntent[0] },
                    };
                }
            }
        }
        if (!newInteraction.parentId) {
            newInteraction.set('parentId', null);
        }

        const hasChanges = hasChangedFields(newInteraction, oldInteraction, [
            'languages',
            'triggers',
            'action',
            'position',
            'comments',
            'name',
        ]);

        if (hasChanges) {
            newInteraction.updatedAt = moment().toISOString();
            if (loggedUserId) {
                newInteraction.lastUpdateBy = {
                    userId: loggedUserId,
                    updatedAt: moment().valueOf(),
                };
            }
        }

        return await this._update(newInteraction);
    }

    private async  updateBotUpdatedAt(interaction: Interaction) : Promise<void> {
        await this.botService.updateBotUpdatedAt(interaction.botId, moment().valueOf());
    }
}
