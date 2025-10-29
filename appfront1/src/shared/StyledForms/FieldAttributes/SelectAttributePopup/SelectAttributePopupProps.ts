import { BotAttribute } from "../../../../model/BotAttribute";

export interface SelectAttributePopupProps{
    onChange: (...params) => any;
    botAttributes: Array<BotAttribute>;
    data: string;
}
export interface SelectAttributePopupExposedProps{
    onChange: (attrName: string) => any;
}