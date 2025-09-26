import { IResponse } from "../../../../model/Interaction";
import { Component } from "react";
import { BotAttribute } from "../../../../model/BotAttribute";

export interface BotResponseProps{
    response: IResponse | any;
    onChange: (response: IResponse) => any;
    submitted: boolean;
    onCreateAttribute: (...params)=> any;
    botAttributes?: BotAttribute[];
}

export class BotResponse extends Component<BotResponseProps>{}
