import { Document, Schema } from 'mongoose';

export interface BotAttribute extends Document {
  name: string;
  interactionId: Schema.Types.ObjectId;
  botId: Schema.Types.ObjectId;
  type: string;
  label: string;
  interactions: string[];
}

export interface EntityAttribute{
  name: String;
  type: String;
  fromEntity: boolean;
}
