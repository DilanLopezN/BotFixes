import {RouteComponentProps} from "react-router";
import {Interaction} from "../../../../../../model/Interaction";
import {User} from "kissbot-core";
import { I18nProps } from "../../../../../i18n/interface/i18n.interface";

export interface CommentCreateProps extends RouteComponentProps, I18nProps{
    onChange: (...params) => any;
    currentInteraction: Interaction;
    loggedUser: User;
}
