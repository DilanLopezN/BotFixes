import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { Interaction } from "../../../../../model/Interaction";
import { InteractionPendingProps } from '../../interaction-pending';

export interface DropAboveProps extends I18nProps{
    connectDropTarget: (...params) => any;
    canDrop: boolean;
    isOver : boolean;
    interaction: Interaction;
    setInteractionList : (interactionList : Array<Interaction>) => any;
    setInteractionsPendingPublication?: (pendingInteractions: InteractionPendingProps[]) => void;
    interactionList : Array<Interaction>;
    match : any;
}