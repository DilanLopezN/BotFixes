import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { Interaction } from "../../../../../model/Interaction";
import { InteractionPendingProps } from '../../interaction-pending';

export interface DropAsLastChildProps extends I18nProps{
    interaction: Interaction;
    interactionList: Array<Interaction>;
    connectDropTarget: (...params) => any;
    setInteractionList: (interactionList: Array<Interaction>) => any;
    setInteractionsPendingPublication?: (pendingInteractions: InteractionPendingProps[]) => void;
    canDrop: boolean; 
    isOver: boolean;
    match : any
}