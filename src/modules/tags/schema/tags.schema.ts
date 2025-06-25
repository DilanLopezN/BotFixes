import * as mongoose from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { Tags } from '../interface/tags.interface';

export const TagsSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String,
    },
    workspaceId: {
        required: true,
        type: String,
    },
    color: {
        required: true,
        type: String,
    },
    inactive: {
        required: false,
        type: Boolean,
        default: false,
    },
},
    { versionKey: false, collection: 'tags', strictQuery: true },
);

TagsSchema.plugin(AfterFindSoftDeletePlugin)

export const TagsModel: mongoose.Model<Tags> = mongoose.model<Tags>(
    'Tags',
    TagsSchema,
);
