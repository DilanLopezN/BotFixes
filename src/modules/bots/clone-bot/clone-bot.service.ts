import { Injectable } from '@nestjs/common';
import { Exceptions } from './../../auth/exceptions';
import * as mongoose from 'mongoose';
import { BotsService } from '../bots.service';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { BotAttributesService } from '../../../modules/botAttributes/botAttributes.service';
import { EntitiesService } from '../../entities/entities.service';
import { TeamService } from '../../team/services/team.service';
import { InteractionsService } from '../../interactions/services/interactions.service';
import { castObjectId, castObjectIdToString } from '../../../common/utils/utils';
import { BotModel } from '../schemas/bot.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import * as Sentry from '@sentry/node';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';

@Injectable()
export class CloneBotService {
    constructor(
        private readonly botsService: BotsService,
        private readonly workspaceService: WorkspacesService,
        private readonly botAttributesService: BotAttributesService,
        private readonly entitiesService: EntitiesService,
        private readonly teamService: TeamService,
        private readonly interactionService: InteractionsService,
    ) {}

    private isObjectIdValid(id) {
        return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id) == id;
    }

    private recursiveReplace(ids, o, scope = []) {
        for (let i in o) {
            if (
                (o[i] instanceof mongoose.Types.ObjectId || this.isObjectIdValid(o[i])) &&
                ids[castObjectId(o[i]).toHexString()]
            ) {
                const id = castObjectId(o[i]);
                o[i] = ids[id.toHexString()];
            } else if (o[i] !== null && typeof o[i] === 'object') {
                this.recursiveReplace(ids, o[i], scope.concat(i));
            }
        }
    }

    private async filterByCompletePathAndParent(interactions, parents) {
        let result = [];

        for (let i = 0; i < interactions.length; i++) {
            let interaction = interactions[i];
            for (let j = 0; j < parents.length; j++) {
                if (
                    interaction._id == parents[j] ||
                    interaction.parentId == parents[j] ||
                    (interaction.completePath && interaction.completePath.includes(parents[j])) ||
                    (interaction.path && interaction.path.includes(parents[j]))
                ) {
                    result.push(interaction);
                    break;
                }
            }
        }

        return result;
    }

    private async createEntities(workspaceId, entities) {
        try {
            for (let entity of entities) {
                entity['params'] = null;
                await this.entitiesService.createEntity(entity, workspaceId);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log('ERRO AO CRIAR ENTIDADES NO CLONE DO BOT: ', error);
            Sentry.captureEvent({
                message: 'CloneBotService: error createEntities',
                extra: {
                    error,
                    workspaceId,
                },
            });
            // throw error;
        }
    }

    private async createAttributes(botId, attributes) {
        try {
            for (let attribute of attributes) {
                if (attribute._id) {
                    await this.botAttributesService._create(attribute, botId);
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        } catch (error) {
            console.log('ERRO AO CRIAR ATRIBUTOS NO CLONE DO BOT: ', error);
            Sentry.captureEvent({
                message: 'CloneBotService: error createAttributes',
                extra: {
                    error,
                    botId,
                },
            });
            // throw error;
        }
    }

    private async createTeams(workspaceId, teams) {
        try {
            for (let entity of teams) {
                entity.roleUsers = [];
                await this.teamService.createTeam(workspaceId, entity);
            }
        } catch (error) {
            console.log('ERRO AO CRIAR TIMES NO CLONE DO BOT: ', error);
            Sentry.captureEvent({
                message: 'CloneBotService: error createTeams',
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    private async createInteractions(interactions, updateBot = true) {
        try {
            for (let i = 0; i < interactions.length; i++) {
                let interaction: any = interactions[i];
                interaction['params'] = null;
                interaction['comments'] = [];
                await this.interactionService.createInteraction(interaction, undefined, updateBot);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log('ERRO AO CRIAR INTERACTIONS NO CLONE DO BOT: ', error);
            Sentry.captureEvent({
                message: 'CloneBotService: error createInteractions',
                extra: {
                    error,
                },
            });
            // throw error;
        }
    }

    async clonePartialBot(
        cloneFromWorkspaceId: string,
        cloneFromBotId: string,
        workspaceId: string,
        ids: { [id: string]: string },
        parents: { [id: string]: string },
        createTeams?: boolean,
    ) {
        return await this.cloneBot(
            cloneFromWorkspaceId,
            cloneFromBotId,
            workspaceId,
            '',
            false,
            createTeams,
            ids,
            parents,
        );
    }

    @Cron(CronExpression.EVERY_6_HOURS)
    async consumeQueueAck() {
        if (!shouldRunCron()) return;

        await this.botsService.getModel().updateMany(
            {
                cloning: true,
                cloningStartedAt: { $lt: moment().subtract(2, 'hour').valueOf() },
            },
            {
                deletedAt: new Date(),
            },
        );
    }

    async cloneBot(
        cloneFromWorkspaceId: string,
        cloneFromBotId: string,
        workspaceId: string,
        botName: string,
        shouldCreateBot: boolean,
        createTeams?: boolean,
        ids?: { [id: string]: string },
        parents?: { [id: string]: string },
    ) {
        let botId = null;
        let canCreateEntities = true;
        let fathers = parents || {};

        try {
            console.log(
                `INICIO CLONE BOT NO WORKSPACE: ${workspaceId} DO (WORKSPACE: ${cloneFromWorkspaceId} - BOT: ${cloneFromBotId})`,
            );
            if (!ids) {
                ids = {};
            }

            const fromWorkspace = await this.workspaceService.getOne(cloneFromWorkspaceId);

            if (!fromWorkspace) {
                throw Exceptions.WORKSPACE_ID_DONT_MATCH_FOR_CLONE_BOT;
            }
            const fromBot = await this.botsService.findOne({
                _id: castObjectId(cloneFromBotId),
                workspaceId: castObjectId(cloneFromWorkspaceId),
            });

            if (!fromBot) {
                throw Exceptions.BOT_FOR_CLONE_NOT_FOUND;
            }

            // Caso esteja clonando um bot do mesmo workspace não é necessarios criar algumas entidades
            if (String(workspaceId) === String(cloneFromWorkspaceId)) {
                createTeams = false;
                canCreateEntities = false;
            }

            if (ids[cloneFromBotId]) {
                botId = ids[cloneFromBotId];
            }

            ids[cloneFromWorkspaceId] = workspaceId;

            if (shouldCreateBot) {
                const newBot = new BotModel({
                    name: botName,
                    createdAt: new Date(),
                    params: [],
                    label: [],
                    languages: [],
                    cloning: true,
                    cloningStartedAt: +new Date(),
                    workspaceId: castObjectId(workspaceId),
                });
                const bot = await this.botsService.createBot(newBot, true);
                botId = bot._id;
                ids[cloneFromBotId] = castObjectIdToString(bot._id);
            }

            const responseAttributes = await this.botAttributesService._getAll(
                cloneFromBotId,
                { filter: { search: undefined, botId: castObjectId(cloneFromBotId) } },
                cloneFromWorkspaceId,
            );

            let attributes: any = responseAttributes.data;
            const queryWorkspace: any = { filter: { $and: [{ workspaceId: castObjectId(cloneFromWorkspaceId) }] } };

            let entities: any = [];

            if (canCreateEntities) {
                const responseEntities = await this.entitiesService.queryPaginate(queryWorkspace, 'GET_ENTITIES');
                entities = responseEntities.data;
            }

            let teams: any = [];

            if (createTeams) {
                const responseTeams = await this.teamService._queryPaginate(
                    queryWorkspace,
                    undefined,
                    cloneFromWorkspaceId,
                );
                teams = responseTeams.data;
            }

            const queryBot: any = {
                filter: {
                    $and: [
                        { workspaceId: castObjectId(cloneFromWorkspaceId) },
                        { botId: castObjectId(cloneFromBotId) },
                    ],
                },
            };
            let responseInteractions = await this.interactionService.queryPaginate(queryBot, 'GET_INTERACTIONS');
            let interactions: any = responseInteractions.data;

            if (!interactions) {
                throw Exceptions.NOT_FOUND;
            } else {
                interactions = interactions.sort((a, b) => {
                    if (a.parentId && !b.parentId) {
                        return 1;
                    } else {
                        return a.completePath?.length > b.completePath?.length ? 1 : -1;
                    }
                });
            }

            attributes = attributes.map((document) => {
                if (document._id) {
                    ids[document._id] = new mongoose.Types.ObjectId().toString();
                }
                return document.toJSON ? document.toJSON() : document;
            });

            if (entities.length) {
                entities = entities.map((document) => {
                    if (document._id) {
                        ids[document._id] = new mongoose.Types.ObjectId().toString();
                    }
                    return document.toJSON ? document.toJSON() : document;
                });
            }

            if (teams.length) {
                teams = teams.map((document) => {
                    if (document._id) {
                        ids[document._id] = new mongoose.Types.ObjectId().toString();
                    }
                    return document.toJSON ? document.toJSON() : document;
                });
            }

            interactions = interactions.map((document) => {
                if (document._id) {
                    ids[document._id] = new mongoose.Types.ObjectId().toString();
                }
                return document.toJSON ? document.toJSON() : document;
            });

            if (Object.keys(fathers ?? {}).length > 0) {
                interactions = await this.filterByCompletePathAndParent(interactions, fathers);
            }

            this.recursiveReplace(ids, attributes, []);
            if (entities.length) {
                this.recursiveReplace(ids, entities, []);
            }

            if (teams.length) {
                this.recursiveReplace(ids, teams, []);
            }

            this.recursiveReplace(ids, interactions, []);

            if (canCreateEntities) {
                await this.createEntities(workspaceId, entities);
            }

            await this.createAttributes(botId, attributes);

            if (createTeams) {
                await this.createTeams(workspaceId, teams);
            }

            await this.createInteractions(interactions, false);

            if (shouldCreateBot) {
                await this.botsService.update(botId, { cloning: false, cloningStartedAt: null });
            }

            console.log('BOT CLONADO COM SUCESSO');
            return { ok: true };
        } catch (error) {
            console.log('ERRO AO CLONAR BOT: ', error);
            Sentry.captureEvent({
                message: 'CloneBotService: error cloneBot',
                extra: {
                    error,
                },
            });
            if (shouldCreateBot) {
                await this.botsService.update(botId, { cloning: false, cloningStartedAt: null });
            }

            throw error;
        }
    }
}
