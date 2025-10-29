import {Interaction} from "../../../../../../model/Interaction";
import {RouteComponentProps} from "react-router";
import {User} from "kissbot-core/lib";
import { I18nProps } from "../../../../../i18n/interface/i18n.interface";

export interface CommentItemProps extends RouteComponentProps, I18nProps{
    currentInteraction: Interaction;
    unchangedInteraction: Interaction;
    onChange: (...params) => any;
    loggedUser: User;
}
