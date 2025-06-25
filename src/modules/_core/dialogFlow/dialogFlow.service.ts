import { protos, SessionsClient, EntityTypesClient, IntentsClient } from '@google-cloud/dialogflow';
import { Entity } from '../../entities/interfaces/entity.interface';
import { get } from 'lodash';
import {
    InteractionType,
} from '../../interactions/interfaces/response.interface';
import { IUserSay } from '../../interactions/interfaces/userSay.interface';
import { Interaction } from '../../interactions/interfaces/interaction.interface';
import { ILanguageInteraction } from '../../interactions/interfaces/language.interface';
import { IPart } from '../../interactions/interfaces/part.interface';
import { DialogFlowAccount } from '../../workspaces/interfaces/dialogflowAccount.interface';
import { concat } from 'lodash';
import { Workspace } from '../../workspaces/interfaces/workspace.interface';
import { v4 } from 'uuid';
import { castObjectIdToString } from '../../../common/utils/utils';

export class DialogFlowService {

    sessionClient: SessionsClient;
    workspace: Workspace;
    entityTypesClient: EntityTypesClient;
    intentClient: IntentsClient;
    projectId: string; // https://dialogflow.com/docs/agents#settings
    sessionId = '-';
    languageCode = 'pt-br';
    client_email: string;
    private_key: string;

    constructor(dialogFlowAccount: DialogFlowAccount, workspace: Workspace) {
        this.workspace = workspace;
        this.projectId = dialogFlowAccount != null ? dialogFlowAccount.project_id : process.env.DIALOGFLOW_PROJECT_ID;
        const credentials = {
            credentials: {
                client_email: dialogFlowAccount != null ? dialogFlowAccount.client_email : process.env.DIALOGFLOW_CLIENT_EMAIL,
                private_key: dialogFlowAccount != null ? dialogFlowAccount.private_key : process.env.DIALOGFLOW_PRIVATE_KEY,
            },
        };

        this.sessionClient = new SessionsClient(credentials);
        this.entityTypesClient = new EntityTypesClient(credentials);
        this.intentClient = new IntentsClient(credentials);
    }

    public async newEntity(entity: Entity) {
        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return;
        }
        const agentPath = this.entityTypesClient.projectAgentPath(this.projectId);

        const createEntityTypeRequest: protos.google.cloud.dialogflow.v2.ICreateEntityTypeRequest = {
            parent: agentPath,
            languageCode: 'pt-Br',
            entityType: {
                displayName: entity.name,
                entities: this._transformEntity(entity),
                kind: 'KIND_MAP',
                autoExpansionMode: 'AUTO_EXPANSION_MODE_UNSPECIFIED',
            },
        };
        return await this.entityTypesClient.createEntityType(
            createEntityTypeRequest,
        );
    }

    public async deleteEntity(entity: Entity) {
        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return;
        }
        const deleteEntityType: protos.google.cloud.dialogflow.v2.IDeleteEntityTypeRequest = {
            name: get(entity, 'params.dialogFlow.entity.name'),
        };
        return await this.entityTypesClient.deleteEntityType(deleteEntityType);
    }

    public async newIntent(interaction: Interaction): Promise<protos.google.cloud.dialogflow.v2.IIntent[]> {
        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return null;
        }

        if (interaction.type === InteractionType.container ||
            interaction.type === InteractionType.fallback ||
            interaction.type === InteractionType.contextFallback) {
            return null;
        }

        let result = [];

        const agentPath = this.intentClient.projectAgentPath(this.projectId);

        if (interaction.languages) {

            const parameters = {};

            for (let i = 0; i < interaction.languages.length; i++) {
                const lang: ILanguageInteraction = interaction.languages[i];
                const createIntentRequest: protos.google.cloud.dialogflow.v2.ICreateIntentRequest = {
                    parent: agentPath,
                    intent: this._convertToIntentV2(lang, interaction, agentPath, parameters),
                    intentView: 'INTENT_VIEW_FULL',
                    languageCode: lang.language,
                };
                let intent;
                if (i == 0) {
                    intent = await this.intentClient.createIntent(createIntentRequest);
                } else {
                    interaction.params = { dialogFlow: { intent: result[0] } };
                    intent = await this.updateIntentLanguage(interaction, lang, agentPath, parameters);
                }

                if (intent) {
                    result = concat(result, intent);
                }
            }
        }
        return result;
    }

    public async updateIntent(interaction: Interaction) {

        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return null;
        }

        if (interaction.type === InteractionType.container ||
            interaction.type === InteractionType.fallback ||
            interaction.type === InteractionType.contextFallback) {
            return null;
        }

        let intentName = get(interaction, 'params.dialogFlow.intent.name')
        if (!intentName) {
            return this.newIntent(interaction);
        } else {
            let result = [];
            const parameters = {};
            const agentPath = this.intentClient.projectAgentPath(this.projectId);
            for (let i = 0; i < interaction.languages.length; i++) {
                const lang: ILanguageInteraction = interaction.languages[i];
                try {
                    const intent = await this.updateIntentLanguage(interaction, lang, agentPath, parameters);
                    if (intent) {
                        result = concat(result, intent);
                    }
                } catch (error) {
                    console.log("error.code", error.code);
                    if (error.code == 5) {
                        interaction.params = null;
                        const intent = this.newIntent(interaction);
                        result = concat(result, intent);
                    }
                }
            }
            return result;
        }
    }

    private async updateIntentLanguage(
        interaction: Interaction,
        lang: ILanguageInteraction,
        agentPath: string,
        parameters: any,
    ): Promise<protos.google.cloud.dialogflow.v2.IIntent> {
        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return;
        }
        if (!interaction.params) {
            return;
        }

        const updateIntentRequest: protos.google.cloud.dialogflow.v2.IUpdateIntentRequest = {
            intent: this._convertToIntentV2(lang, interaction, agentPath, parameters),
            intentView: 'INTENT_VIEW_FULL',
            languageCode: lang.language,
        };

        const intents = await this.intentClient.updateIntent(updateIntentRequest);
        if (intents && intents.length > 0)
            return intents[0];

        return null;
    }

    public async deleteIntent(interaction: Interaction) {
        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return;
        }
        if (!interaction.params) {
            return;
        }
        const deleteIntentRequest: protos.google.cloud.dialogflow.v2.IDeleteIntentRequest = {
            name: get(interaction, 'params.dialogFlow.intent.name'),
        };
        return await this.intentClient.deleteIntent(deleteIntentRequest);
    }

    public updateEntity(entity: Entity) {
        if (this.workspace.settings && !this.workspace.settings.dialogflowWritable) {
            return;
        }
        let dialogFlowEntityName = get(entity, 'params.dialogFlow.entity.name')

        const agentPath = this.intentClient.projectAgentPath(this.projectId);
        if (dialogFlowEntityName) {
            const updateEntityType: protos.google.cloud.dialogflow.v2.IUpdateEntityTypeRequest = {
                languageCode: 'pt-Br',
                entityType: {
                    name: get(entity, 'params.dialogFlow.entity.name'),
                    displayName: entity.name,
                    entities: this._transformEntity(entity),
                    kind: 'KIND_MAP',
                    autoExpansionMode: 'AUTO_EXPANSION_MODE_UNSPECIFIED',
                },
            };
            return this.entityTypesClient.updateEntityType(updateEntityType);

        }
        const createEntityTypeRequest: protos.google.cloud.dialogflow.v2.ICreateEntityTypeRequest = {
            parent: agentPath,
            languageCode: 'pt-Br',
            entityType: {
                displayName: entity.name,
                entities: this._transformEntity(entity),
                kind: 'KIND_MAP',
                autoExpansionMode: 'AUTO_EXPANSION_MODE_UNSPECIFIED',
            },
        };
        return this.entityTypesClient.createEntityType(createEntityTypeRequest);
    }

    public listIntents() {
        const agentPath = this.intentClient.projectAgentPath(this.projectId);
        return this.intentClient.listIntents({
            parent: agentPath,
        });
    }

    public listEntities() {
        const agentPath = this.intentClient.projectAgentPath(this.projectId);
        return this.entityTypesClient.listEntityTypes({
            parent: agentPath,
        });
    }

    private _transformEntity(entity: Entity) {
        return entity.entries.map(e => {
            return { value: e.name, synonyms: e.synonyms };
        });
    }

    private _convertToIntentV2(
        lang: ILanguageInteraction,
        interaction: Interaction,
        projectAgentPath: string,
        parameters: any,
    ): protos.google.cloud.dialogflow.v2.IIntent {
        const path = interaction.path;
        const _inputContextNames = [];
        if (!this.workspace.settings || !this.workspace.settings.dialogflowTemplate) {
        }
        if (!path || path.length <= 0) {
            _inputContextNames.push(projectAgentPath + '/sessions/-/contexts/' + interaction.botId);
        } else {
            _inputContextNames.push(projectAgentPath + '/sessions/-/contexts/' + path.slice(-1).pop());
        }

        const intent: protos.google.cloud.dialogflow.v2.IIntent = {
            name: get(interaction, 'params.dialogFlow.intent.name') || '',
            displayName: castObjectIdToString(interaction._id),
            isFallback:
                interaction.type === InteractionType.fallback ||
                interaction.type === InteractionType.contextFallback,
            mlDisabled: false,
            inputContextNames: _inputContextNames,
            events: [],
            resetContexts: false,
            webhookState: 'WEBHOOK_STATE_UNSPECIFIED',
            rootFollowupIntentName: '',
            parentFollowupIntentName: '',
            parameters: [],
            action: interaction.action,
            messages: [
                {
                    text: {
                        text: ['ok'],
                    }
                } as protos.google.cloud.dialogflow.v2.Intent.IMessage
            ],
        };

        const trainingPhrases: protos.google.cloud.dialogflow.v2beta1.Intent.ITrainingPhrase[] = [];

        if (lang.userSays) {
            lang.userSays.forEach((userSay: IUserSay, i: number) => {
                if (userSay.parts && userSay.parts.length > 0) {
                    const trainingPhrase = { name: v4().toString() } as protos.google.cloud.dialogflow.v2beta1.Intent.ITrainingPhrase;
                    let trainingPhraseParts: protos.google.cloud.dialogflow.v2beta1.Intent.TrainingPhrase.IPart[] = [];
                    const spacePart: protos.google.cloud.dialogflow.v2beta1.Intent.TrainingPhrase.IPart = { text: " ", userDefined: false };

                    // Entity name should start with a letter and can contain only the following: A-Z, a-z, 0-9, _ (underscore), - (dash).

                    let lastPart = null;
                    userSay.parts.forEach((part: IPart, index) => {

                        if (part.value && part.value.trim().length == 0) {
                            //frist part is empty
                        } else if (part.value) {
                            const userDefined = (part.type && part.type.indexOf("@") > -1 && part.type.indexOf("@sys.") == -1) ? true : false;
                            const _alias = part.type != null ? part.value : null;
                            let _part: protos.google.cloud.dialogflow.v2beta1.Intent.TrainingPhrase.IPart = {
                                entityType: part.type,
                                text: part.value,
                                alias: _alias,
                                userDefined: userDefined
                            };

                            trainingPhraseParts.push(_part);
                            lastPart = _part;

                            if (part.type) {
                                // parameters[part.value] = <Parameter>{
                                //   isList: false,
                                //   dataType: part.type,
                                //   name: '',
                                //   mandatory: true,
                                //   entityTypeDisplayName : part.type,
                                //   //mandatory: part.mandatory,
                                //   displayName: convertNameAndTypeToParameterName(part.type, part.value),
                                //   value: '$' + part.value
                                // };
                            }
                        }
                    });

                    if (trainingPhraseParts.length > 1) {
                        trainingPhraseParts = trainingPhraseParts.reduce((result, element, index, array) => {
                            result.push(element);
                            if (index < array.length - 1) {
                                result.push(spacePart);
                            }
                            return result;
                        }, []);
                    }

                    trainingPhrase.parts = trainingPhraseParts;
                    trainingPhrases.push(trainingPhrase);
                }
            });
        }

        if (interaction.parameters && interaction.parameters.length > 0) {
            interaction.parameters.forEach(parameter => {
                parameters[parameter.name] = {
                    isList: false,
                    dataType: parameter.type,
                    name: '',
                    mandatory: true,
                    entityTypeDisplayName: parameter.type,
                    // mandatory: part.mandatory,
                    displayName: parameter.name, // convertNameAndTypeToParameterName(part.type, part.value),
                    value: '$' + parameter.name,
                } as protos.google.cloud.dialogflow.v2beta1.Intent.IParameter;
            });
        }

        Object.keys(parameters).map(key => {
            intent.parameters.push(parameters[key]);
        });

        intent.trainingPhrases = trainingPhrases;
        return intent;
    }
}
