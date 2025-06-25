import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Interaction } from '../interfaces/interaction.interface';
import { ILanguageInteraction } from '../interfaces/language.interface';
import { IResponse, InteractionType } from '../interfaces/response.interface';
import { v4 } from 'uuid';
import { castObjectId } from '../../../common/utils/utils';
import { isEmpty } from 'lodash';
import { CacheService } from './../../_core/cache/cache.service';
import { Exceptions } from '../../auth/exceptions';
import { ExternalDataService } from './external-data.service';
import * as Sentry from '@sentry/node';

@Injectable()
export class InteractionSharedService extends MongooseAbstractionService<Interaction> {
    constructor(
        @InjectModel('Interaction') protected readonly model: Model<Interaction>,
        cacheService: CacheService,
        private readonly externalDataService: ExternalDataService,
    ) {
        super(model, cacheService);
    }

    getSearchFilter(search: string) {}
    getEventsData() {}

    /**
     * Função para criar Ids únicos para cada element de cada response
     * @param interaction
     */
    generateResponseElementsUUID(interaction: Interaction): Interaction {
        if (interaction.languages) {
            interaction.languages = interaction.languages.map((language: ILanguageInteraction) => {
                if (language.responses) {
                    language.responses = language.responses.map((response: IResponse) => {
                        if (response.elements) {
                            response.elements = response.elements.map((element: any) => {
                                if (!element._id) {
                                    element = { ...element, _id: v4() };
                                }
                                return element;
                            });
                        }
                        return response;
                    });
                }
                return language;
            });
        }
        return interaction;
    }

    /**
     * Retorna o path completo incluindo o path com
     * @param interactionId Id do interaction parent da interaction que quer pegar o path
     */
    public async getCompletePath(parent: Interaction) {
        let completePath = [];

        if (parent) {
            const path = await this.model.aggregate([
                { $match: { _id: castObjectId(parent._id) } },
                {
                    $graphLookup: {
                        from: 'interactions',
                        startWith: '$parentId',
                        connectFromField: 'parentId',
                        connectToField: '_id',
                        as: 'path',
                    },
                },
                {
                    $project: {
                        path: '$path._id',
                    },
                },
            ]);
            completePath = !isEmpty(path) ? path[0].path : [];
            completePath.push(parent._id);
        }

        return completePath;
    }

    /**
     * Retorna o path ignorando as interaction do tipo container
     * @param interactionId : Id do interaction parent da interaction que quer pegar o path
     */
    public async getPath(parent: Interaction) {
        let results: Array<{ interactions: Array<Interaction> }> = [];

        const pathFiltered = [];

        if (parent) {
            results = await this.model.aggregate([
                { $match: { _id: castObjectId(parent._id) } },
                {
                    $graphLookup: {
                        from: 'interactions',
                        startWith: '$parentId',
                        connectFromField: 'parentId',
                        connectToField: '_id',
                        as: 'interaction',
                    },
                },
                {
                    $project: {
                        interactions: '$interaction',
                    },
                },
            ]);

            pathFiltered.push(parent.botId);

            if (results[0] && results[0].interactions) {
                results[0].interactions.forEach((int) => {
                    if (int.type != InteractionType.container && int.type != InteractionType.welcome) {
                        pathFiltered.push(int._id);
                    }
                });
            }

            if (parent.type != InteractionType.container && parent.type != InteractionType.welcome) {
                pathFiltered.push(parent._id);
            }
        }

        return pathFiltered;
    }

    async getInteractionChildrens(interactionId) {
        return this.model.find({ parentId: interactionId }).exec();
    }

    private async updateBotUpdatedAt(interaction: Interaction): Promise<void> {}

    // Função verifica se as intents que vieram em currInteraction já estão sendo usadas no mesmo contexto da árvore
    public async checkValidIntentContextInteraction(
        currInteraction: Interaction,
        interactions: Interaction[],
    ): Promise<string[]> {
        let result: string[] = [];

        let uniqueIntentsCurrInteraction: { [key: string]: string } = {};
        currInteraction.languages?.forEach((lang) => {
            lang?.intents?.forEach((intent) => {
                uniqueIntentsCurrInteraction[intent] = intent;
            });
        });
        const intentsCurrInteraction = Object.values(uniqueIntentsCurrInteraction).map((intent) => intent);

        if (!intentsCurrInteraction.length) {
            return;
        }

        const workspaceIntents = await this.externalDataService.getIntentsByWorkspaceIdAndBotId(
            currInteraction.workspaceId,
            currInteraction.botId,
        );

        // uniqueIntentsByContext = intenções que não podem se repetir no mesmo contexto mas pode repetir no bot
        const uniqueIntentsByContext = {};
        // uniqueIntentsOfBot = intenções que só podem existir uma no bot
        const uniqueIntentsOfBot = {};
        for (const intent of intentsCurrInteraction) {
            const existIntent = workspaceIntents?.find((currIntent) => currIntent.name === intent);

            if (!existIntent) {
                throw Exceptions.ERROR_INTENT_NOT_FOUND;
            }

            if (!existIntent?.canDuplicateContext) {
                uniqueIntentsOfBot[intent] = intent;
            } else {
                uniqueIntentsByContext[intent] = intent;
            }
        }

        let validParentIdByCurrInteraction = null;

        if (currInteraction.path.length > 1) {
            for (const path of currInteraction.path.reverse()) {
                const context = interactions.find((interaction) => String(interaction?._id) === String(path));
                if (context && context.type === InteractionType.interaction) {
                    validParentIdByCurrInteraction = String(context._id);
                    break;
                }
            }
        }

        // filtro para que verifique o contexto apenas das interactions que possuem intenções cadastradas
        const interactionsWithIntents = interactions.filter((interaction) => {
            return !!interaction?.languages?.find((lang) => !!lang?.intents?.length);
        });

        // verifica se alguma das interactions com intenções possui alguma intenção que não pode se repetir na árvore do bot
        if (Object.values(uniqueIntentsOfBot)?.length && interactionsWithIntents) {
            const uniqueIntentInUse = interactionsWithIntents.find((interaction) => {
                if (String(interaction._id) === String(currInteraction._id)) {
                    return false;
                }
                return !!interaction.languages.find((lang) => {
                    return !!lang?.intents?.some((el) => Object.values(uniqueIntentsOfBot).includes(el));
                });
            });

            if (uniqueIntentInUse) {
                throw new BadRequestException([String(uniqueIntentInUse._id)], 'ERROR_DUPLICATED_UNIQUE_INTENT');
            }
        }

        let interactionsSameContext: Interaction[] = [];
        let breaked: boolean = false;
        for (const interaction of interactionsWithIntents) {
            if (breaked) {
                break;
            }
            // primeiro parametro para continuar recursividade,
            // segundo parametro para caso a proxima interaction a ser consultada seja um container que não possua parent,
            // dai o contexto valido proximo será a interaction do tipo 'InteractionType.interaction' que será adicionado
            const getValidParentSameContext = (interactionContext: Interaction, count: number, lastValidContext?: Interaction) => {
                count = count + 1;
                if (count > 1000) {
                    Sentry.captureEvent({
                        message: `Error loop checkValidIntentContextInteraction workspaceId: ${currInteraction.workspaceId} - botId: ${currInteraction.botId}`,
                    });
                    breaked = true;
                    return;
                }
                if (String(interactionContext._id) !== String(currInteraction._id)) {
                    if (
                        (interactionContext.type === InteractionType.interaction ||
                            interactionContext.type === InteractionType.contextFallback ||
                            interactionContext.type === InteractionType.welcome ||
                            interactionContext.type === InteractionType.fallback) &&
                        String(interactionContext.parentId) === String(validParentIdByCurrInteraction)
                    ) {
                        interactionsSameContext.push(interactionContext);
                    } else {
                        if (interactionContext.parentId === null) {
                            return;
                        }
                        if (String(interactionContext.parentId) !== String(validParentIdByCurrInteraction)) {
                            const context = interactions.find(
                                (interaction) =>
                                    String(interaction?._id) === String(interactionContext.parentId) &&
                                    String(interaction._id) !== String(validParentIdByCurrInteraction),
                            );

                            if (context && context.type === InteractionType.interaction) {
                                if (String(context._id) === String(validParentIdByCurrInteraction)) {
                                    interactionsSameContext.push(context);
                                }
                            } else if (context && context.type === InteractionType.container) {
                                if (!context.parentId) {
                                    if (interactionContext.type === InteractionType.container) {
                                        interactionsSameContext.push(lastValidContext);
                                    } else {
                                        interactionsSameContext.push(interactionContext);
                                    }
                                } else {
                                    if (context.type === InteractionType.container && !lastValidContext) {
                                        if (interactionContext.type === InteractionType.interaction) {
                                            getValidParentSameContext(context, count, interactionContext);
                                        } else {
                                            getValidParentSameContext(context, count);
                                        }
                                    } else {
                                        getValidParentSameContext(context, count, lastValidContext);
                                    }
                                }
                            }
                        } else {
                            if (lastValidContext) {
                                interactionsSameContext.push(lastValidContext);
                            }
                        }
                    }
                }
            };
            getValidParentSameContext(interaction, 0);
        }

        if (!interactionsSameContext.length) {
            return;
        }

        for (const interactionContext of interactionsSameContext) {
            let uniqueIntentsOfInteraction: { [key: string]: string } = {};
            interactionContext.languages?.forEach((lang) => {
                lang?.intents?.forEach((intent) => {
                    uniqueIntentsOfInteraction[intent] = intent;
                });
            });
            if (Object.values(uniqueIntentsOfInteraction).length) {
                Object.values(uniqueIntentsOfInteraction).forEach((intent) => {
                    const existIntent = !!uniqueIntentsByContext?.[intent];
                    if (existIntent) {
                        result.push(String(interactionContext._id));
                        return;
                    }
                });
            }
        }

        if (result.length) {
            throw new BadRequestException(result, 'ERROR_DUPLICATED_INTENT_IN_CONTEXT');
        }
    }
}
