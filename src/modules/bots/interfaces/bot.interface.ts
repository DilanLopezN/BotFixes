import { Document, Schema } from 'mongoose';

export interface Language {
    lang: string;
    flag: string;
}

export interface Bot extends Document {
    name: string;
    workspaceId: Schema.Types.ObjectId;
    organizationId: Schema.Types.ObjectId;
    params: any;
    languages: Array<Language>;
    labels?: Array<BotLabel>;
    publishedAt: Date;
    publishDisabled?: PublishDisabled;
    updatedAt?: Date;
    cloningStartedAt?: number;
    cloning?: boolean; // Caso esteja em processo de clonagem recebera true ao ser criado e após a conclusão false para informar que o clone terminou
}

export interface PublishDisabled {
    disabled: boolean;
    disabledAt: number;
    user?: {
        id: string;
        name: string;
    };
}

export interface BotLabel extends Document {
    name: string;
    color: BotLabelColor;
}

export interface BotLabelColor {
    name: string;
    hexColor: string;
}
