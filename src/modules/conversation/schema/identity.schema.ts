import { IdentityType } from './../interfaces/conversation.interface';
import * as mongoose from 'mongoose';

export const IdentitySchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    avatar: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    channelId: String,
    contactId: String,
    type: {
      type: String,
      enum: [...Object.keys(IdentityType)],
    },
    createdAt: {
      type: Date,
      required: false,
    },
    removedAt: {
      type: Date,
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    track: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ddi: {
      type: String,
      required: false,
    },
  },
  { versionKey: false, _id: false },
);
