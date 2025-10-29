import { BotAttribute } from '../../../../../../../model/BotAttribute';
import { BotResponseProps } from "../../../interfaces";
import { Interaction } from '../../../../../../../model/Interaction';

export interface BotResponseSearchSupplierProps extends BotResponseProps {
    botAttributes: BotAttribute[];
    interactionList: Interaction[];
}