import * as mongoose from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import {
    HealthIntegrationMessages,
    IntegrationMessageType,
} from '../../interfaces/health/health-integration-messages.interface';

const { ObjectId } = mongoose.Types;

export const HealthIntegrationMessagesSchema = new mongoose.Schema(
    {
        integrationId: {
            type: ObjectId,
            required: true,
        },
        workspaceId: {
            type: ObjectId,
            required: true,
        },
        createdAt: Number,
        createdByUserId: {
            required: false,
            type: String,
        },
        type: {
            type: String,
            required: false,
            enum: [...Object.values(IntegrationMessageType)],
        },
        message: {
            required: false,
            type: String,
        },
    },
    { versionKey: false, collection: 'health_integration_messages', autoIndex: true, strictQuery: true },
);

HealthIntegrationMessagesSchema.index({
    workspaceId: 1,
    integrationId: 1,
});

HealthIntegrationMessagesSchema.plugin(AfterFindSoftDeletePlugin);

export const HealthIntegrationMessagesModel: mongoose.Model<HealthIntegrationMessages & mongoose.Document> =
    mongoose.model<HealthIntegrationMessages & mongoose.Document>(
        'health_integration_messages',
        HealthIntegrationMessagesSchema,
    );
