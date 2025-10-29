export interface BotAttribute {
  name: string;
  interactionId?: string;
  botId: string;
  type: string;
  fromEntity?: boolean;
  _id?: string;
  label?: string;
  interactions?: string[];
}