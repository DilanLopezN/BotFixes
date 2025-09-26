import { BotAttribute } from '../../../../../../../model/BotAttribute';
import { BotResponseProps } from "../../../interfaces";

export interface BotResponseSearchIdProps extends BotResponseProps {
    botAttributes: BotAttribute[];
}