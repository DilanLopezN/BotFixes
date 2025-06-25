import { ActivityType } from "kissbot-core";
import { Identity } from "./../../../conversation/dto/conversation.dto";

export interface CreateWebchatActivity {
    type: ActivityType;
    text?: string;
    attachmentLayout?: string;
    attachments?: any[];    
    attachmentFile?: any;
    name?: string;
    hash?: string;
    quoted?: string;
    timestamp?: string | number;
    from: Identity;
    to?: Identity;
    language?: string;
    data?: any;
    user?: {
        id: string;
        // Nesse caso o channelId que o webchat manda não representa o nome
        // do channel e sim o id do channel que fica dentro do registro do bot
        channelId: string;

        // id do bot
        botId: string;

        // Nome do usuário setado pelo webchat
        name: string;
        data: {
            track: any;
        }
    };
};