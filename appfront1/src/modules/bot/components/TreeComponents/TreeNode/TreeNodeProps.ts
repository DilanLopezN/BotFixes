import { Interaction } from '../../../../../model/Interaction';
import { MessageEntryError } from '../../../pages/BotDetail/BotDetailProps';
import { fieldSearchType, LANGUAGE } from '../../../redux/redux-interface';

export interface TreeNodeProps {
    interaction: Interaction | any;
    interactionList: Array<Interaction>;
    setInteractionList: (...params: any) => any;
    match: any;
    currentExecutingInteraction: string[];
    interactionSearch: { value: string; field: fieldSearchType };
    selectedLanguage: LANGUAGE;
    failedResponseIds?: MessageEntryError[];
}

export interface TreeNodeState {
    interactionList: Array<Interaction>;
}
