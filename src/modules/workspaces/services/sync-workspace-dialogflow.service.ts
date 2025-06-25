import { Injectable } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { Promise as BBPromise } from 'bluebird';
import { protos } from '@google-cloud/dialogflow'
import { Interaction } from '../../interactions/interfaces/interaction.interface';
import { EntitiesService } from '../../entities/entities.service';
import { Entity } from '../../entities/interfaces/entity.interface';
import { castObjectIdToString } from '../../../common/utils/utils';

interface IntentAndInteraction {
    intents: protos.google.cloud.dialogflow.v2.IIntent[][];
    interactions: Interaction[];
}
interface EntitiesAndEntitiesDF {
    entitiesDF: protos.google.cloud.dialogflow.v2.IEntityType[][];
    entities: Entity[];
}

@Injectable()
export class SyncWorkspacesDialogflowService {
    constructor(
        private readonly workspaceService: WorkspacesService,
        private readonly interactionService: InteractionsService,
        private readonly entityService: EntitiesService,
    ) { }

    public async sync(workspaceId: string, type: string = 'all') {
        const dialogFlowinstance = await this.workspaceService.dialogFlowInstance(workspaceId);
        if (dialogFlowinstance) {
            return await this.runSync(workspaceId, dialogFlowinstance, type);
        }
        return null;
    }

    private async getIntentsAndInteraction(workspaceId, dialogFlowinstance): Promise<IntentAndInteraction> {
        return await new Promise<IntentAndInteraction>((resolve) => {
            BBPromise.join(
                dialogFlowinstance.listIntents(),
                this.interactionService.getAll({ workspaceId }),
                (intents: protos.google.cloud.dialogflow.v2.IIntent[][], interactions: Interaction[]) => {
                    resolve({ intents, interactions } as IntentAndInteraction);
                },
            );
        });
    }

    private async getEntitiesLocalAndDF(workspaceId, dialogFlowinstance): Promise<EntitiesAndEntitiesDF> {
        return await new Promise<EntitiesAndEntitiesDF>((resolve) => {
            BBPromise.join(
                dialogFlowinstance.listEntities(),
                this.entityService.getAll({ workspaceId }),
                (entitiesDF: protos.google.cloud.dialogflow.v2.IEntityType[][], entities: Entity[]) => {
                    resolve({ entitiesDF, entities } as EntitiesAndEntitiesDF);
                },
            );
        });
    }

    private async runSync(workspaceId, dialogFlowinstance, type) {
        try {
            let entitiesToDeleteOnDF = null;
            if (type == "all" || type == "entities") {
                entitiesToDeleteOnDF = await this.updateEntities(workspaceId, dialogFlowinstance);
            }
            if (type == "all" || type == "interations") {
                const intentsToDeleteOnDF = await this.updateIntents(workspaceId, dialogFlowinstance);
                await this.deleteAllIntents(workspaceId, dialogFlowinstance);
                await this.deleteIntents(intentsToDeleteOnDF, workspaceId, dialogFlowinstance);
            }

            if (entitiesToDeleteOnDF)
                await this.deleteEntities(entitiesToDeleteOnDF, workspaceId, dialogFlowinstance);
        } catch (err) {
            console.log('sync err', err);
            throw err;
        }
    }

    /**
     *
     * @param intents
     * @param workspaceId
     */
    private async deleteAllIntents(workspaceId, dialogFlowinstance) {
        const result: IntentAndInteraction = await this.getIntentsAndInteraction(workspaceId, dialogFlowinstance);
        const { intents } = result;
        // Por algum motivo a lib do dialogflow retorna um array de array de intents,
        // mas precisamos sempre da position 0 do primeiro array, por isso pegamos a intents[0]
        let intentAtZeroPosition: protos.google.cloud.dialogflow.v2.IIntent[] = intents[0];
        for (let i = 0; i < intentAtZeroPosition.length; i++) {
            const intent = intentAtZeroPosition[0];
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1100);
            });
            await dialogFlowinstance.intentClient.deleteIntent({ name: intent.name });
        }
    }

    /**
     *
     * @param intents
     * @param workspaceId
     */
    private async deleteIntents(intents: protos.google.cloud.dialogflow.v2.IIntent[], _, dialogFlowinstance) {
        return await Promise.all(
            intents.map(async intent => {
                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1500);
                });
                return dialogFlowinstance.intentClient.deleteIntent({ name: intent.name });
            }),
        );
    }

    private async deleteEntities(entities: protos.google.cloud.dialogflow.v2.IEntityType[], _, dialogFlowinstance) {
        return await Promise.all(
            entities.map(async entity => {
                dialogFlowinstance.entityTypesClient.deleteEntityType({ name: entity.name })
                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1500);
                });
            }),
        );
    }

    /**
     * para cara interation
     * -verificar se Interaction.params.dialogFlow.id está contindo no Intents
     * -se estiver contido
     * --updateInteraction()
     * --remove o intent encontrado da lista de intents
     * -se nao estiver contido
     * --seta Interaction.params.dialogFlow = null
     * --updateInteraction
     * -delete intents
     */
    private async updateIntents(workspaceId, dialogFlowinstance) {
        const result: IntentAndInteraction = await this.getIntentsAndInteraction(workspaceId, dialogFlowinstance);
        const { intents, interactions } = result;
        // Por algum motivo a lib do dialogflow retorna um array de array de intents,
        // mas precisamos sempre da position 0 do primeiro array, por isso pegamos a intents[0]
        let intentAtZeroPosition: protos.google.cloud.dialogflow.v2.IIntent[] = intents[0];

        for (let i = 0; i < interactions.length; i++) {
            const interaction = interactions[i];
            const findedIntent = interaction.params
                && interaction.params.dialogFlow != null
                ? intentAtZeroPosition.find(intent => intent.name == interaction.params.dialogFlow.intent.name)
                : null;
            if (findedIntent) {
                interaction.params.dialogFlow.intent = findedIntent;
                intentAtZeroPosition = intentAtZeroPosition.filter(intent => intent.name !== findedIntent.name);
            } else {
                interaction.params = null;
            }
            if (!interaction.params) {
                const findedIntent = interaction.params
                    && interaction.params.dialogFlow != null
                    ? intentAtZeroPosition.find(intent => intent.displayName == interaction._id)
                    : null;
                if (findedIntent) {
                    interaction.params.dialogFlow.intent = findedIntent;
                    intentAtZeroPosition = intentAtZeroPosition.filter(intent => intent.name !== findedIntent.name);
                }
            }
            await new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 1500);
            });
            console.log("interaction", interaction._id, interaction.params);
            await this.interactionService.updateInteraction(interaction, true);
        }

        return intentAtZeroPosition;
    }

    private async updateEntities(workspaceId, dialogFlowinstance) {
        const result = await this.getEntitiesLocalAndDF(workspaceId, dialogFlowinstance);
        const { entities, entitiesDF } = result;
        let entityAtZeroPosition: protos.google.cloud.dialogflow.v2.IEntityType[] = entitiesDF[0];
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            let findedEntityDF = !entityAtZeroPosition
                ? null
                : entityAtZeroPosition.find(entityDF => entity.params
                    && entity.params.dialogFlow
                    && entity.params.dialogFlow.entity
                    && entity.params.dialogFlow.entity.name
                    && entityDF
                    && entity.params.dialogFlow.entity.name == entityDF.name);

            if (!findedEntityDF) {
                findedEntityDF = entityAtZeroPosition.find(entityDF =>
                    entityDF
                    && entity.name == entityDF.displayName);
            }

            if (findedEntityDF) {
                if (!entity.params) {
                    entity.params = { dialogFlow: { entity: null } };
                }
                entity.params.dialogFlow.entity = findedEntityDF;
                entityAtZeroPosition = entityAtZeroPosition.filter(entityDF => entityDF.name != findedEntityDF.name);
            } else {
                if (!entity.params) {
                    entity.params = { dialogFlow: { entity: null } };
                } else {
                    entity.params.dialogFlow.entity = null;
                }
            }

            await new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 1500);
            });
            await this.entityService.updateEntity(castObjectIdToString(entity._id), entity);
        }
        return entityAtZeroPosition;
    }
}