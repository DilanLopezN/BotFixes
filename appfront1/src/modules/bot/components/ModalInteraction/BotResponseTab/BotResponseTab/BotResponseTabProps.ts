import { I18nProps } from './../../../../../i18n/interface/i18n.interface';
import { Interaction } from "../../../../../../model/Interaction";
import { RouteComponentProps } from "react-router";
import { BotAttribute } from "../../../../../../model/BotAttribute";

export interface BotResponseTabProps extends RouteComponentProps, I18nProps {
    currentInteraction: Interaction;
    unchangedInteraction?: Interaction;
    interactionList: Interaction[];
    selectedLanguage: string;
    modalInteractionSubmitted: boolean;
    setCurrentInteraction: (interactio: Interaction) => any;
    setInteractionList: (interactio: Interaction[]) => any;
    botAttributes: Array<BotAttribute>
    setBotAttributes: (...params) => any;
    updateTree: () => any;
    children?: React.ReactNode;
}

export interface BotResponseTabState {
    currentInteraction?: Interaction;
    isOpenedModalDelete: boolean;
    responseIndex: any;
    responseCurrent: any;
    idResponseList: string[];
    checkBoxAll: boolean;

    isCopyModalOpened: boolean;
    isCopyToItModalOpened: boolean;
    idInteractionCopy: string;
    workspaceId: string;
    botId: string;
    interactionList: Interaction[];
}
