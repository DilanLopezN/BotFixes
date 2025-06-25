import { Types } from 'mongoose';
import { Interaction } from './interaction.interface';

export interface InteractionHistory {
    interactionId: Types.ObjectId;
    updatedByUserId: Types.ObjectId;
    interaction: Interaction;
    botId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    createdAt: number;
}
