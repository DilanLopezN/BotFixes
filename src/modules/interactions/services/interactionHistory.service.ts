import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model, Types } from 'mongoose';
import { BotsPublicationsHistoryService } from '../../bot-publication-history/bot-publication-history.service';
import { InteractionHistory } from '../interfaces/interaction.history';
import { Interaction } from '../interfaces/interaction.interface';
import { castObjectIdToString } from '../../../common/utils/utils';

@Injectable()
export class InteractionHistoryService {
    constructor(
        @InjectModel('InteractionHistory') protected readonly model: Model<InteractionHistory>,
        private readonly botsPublicationsHistoryService: BotsPublicationsHistoryService,
    ) {}

    public getModel() {
        return this.model;
    }

    public async create(whoUserId: string, interaction: Interaction) {
        const lastPublicationBot = await this.botsPublicationsHistoryService.getLastPublicationByBotId(
            interaction.botId,
        );

        const interactionPublishedDate = interaction.publishedAt ? new Date(interaction.publishedAt) : null;
        const lastBotPublicationDate = lastPublicationBot?.publishedAt ? new Date(lastPublicationBot.publishedAt) : null;

        const comparisonDate = interactionPublishedDate || lastBotPublicationDate

        const interactionHistory = await this.model.findOne({
            interactionId: interaction._id,
            createdAt: {
                $gt: comparisonDate,
            },
        });

        //se existe alguma interaction maior q a data da ultima publicação atualiza essa interaction
        if (interactionHistory) {
            return await this.updateInteractionHistoryById(interactionHistory._id, whoUserId, interaction);
        } else {
            //se não existe nenhuma publicação, verifica se já existe historico da interaction e atualiza, se não cria o historico
            if (!lastPublicationBot) {
                const interactionHistory = await this.model.findOne({
                    interactionId: interaction._id,
                });

                if (interactionHistory) {
                    return await this.updateInteractionHistoryById(interactionHistory._id, whoUserId, interaction);
                }
            }
            return await this.model.create({
                interaction,
                interactionId: interaction._id,
                updatedByUserId: whoUserId,
                botId: interaction.botId,
                workspaceId: interaction.workspaceId,
                createdAt: moment().valueOf(),
            });
        }
    }

    public async updateInteractionHistoryById(interactionId: Types.ObjectId, userId: string, interaction: Interaction) {
        return await this.model.updateOne(
            {
                _id: interactionId,
            },
            [
                {
                    $set: {
                        interaction,
                        updatedByUserId: userId,
                    },
                },
            ],
        );
    }

    public async getInteractionBeforeLastChangesAndLastPublication(
        workspaceId: string,
        botId: string,
        interaction: Interaction,
    ) {
        const lastPublicationBot = await this.botsPublicationsHistoryService.getLastPublicationByBotId(botId);

        const interactionPublishedDate = interaction.publishedAt ? new Date(interaction.publishedAt) : null;
        const lastBotPublicationDate = lastPublicationBot?.publishedAt ? new Date(lastPublicationBot.publishedAt) : null;
        
        const comparisonDate = interactionPublishedDate || lastBotPublicationDate

        const interactionHistory = await this.model
            .findOne({
                botId,
                workspaceId,
                interactionId: interaction._id,
                createdAt: {
                    $lte: comparisonDate,
                },
            })
            .sort({ createdAt: 'desc' });

        return interactionHistory;
    }
}
