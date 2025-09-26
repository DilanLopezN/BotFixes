import { Bot, ChannelConfig } from '../../../model/Bot';
import { Interaction } from '../../../model/Interaction';
import { BotAttribute } from '../../../model/BotAttribute';

export enum LANGUAGE {
    'pt-BR',
    'es',
    'en',
}

export enum fieldSearchType {
    'name' = 'name',
    'team' = 'team',
    'tag' = 'tag',
    'goto' = 'goto',
    'text' = 'text',
}

export interface ReduxInterface {
    currentBot: undefined | Bot;
    channelList: ChannelConfig[];
    currentChannel: undefined | ChannelConfig;
    interactionList: Array<Interaction | any>;
    currentInteraction: Interaction | undefined;
    unchangedInteraction: Interaction | undefined;
    currentExecutingInteraction: string[] | undefined;
    validateInteraction: Interaction | undefined;
    selectedLanguage: LANGUAGE;
    modalInteractionSubmitted: boolean;
    botAttributes: Array<BotAttribute>;
    botList: Array<Bot>;
    interactionSearch: { value: string; field: fieldSearchType };
}
