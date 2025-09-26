import { Interaction } from '../../../../../../../model/Interaction';
import { IResponseElementCard } from '../../../../../../../model/ResponseElement';
import { I18nProps } from './../../../../../../i18n/interface/i18n.interface';

export interface CardProps extends I18nProps {
    card: IResponseElementCard;
    isSubmitted: boolean;
    onChange: (card: IResponseElementCard, isValid: boolean) => any;
    interactionList: Array<Interaction>;
}

export interface CardState {
    openedButtonIndex: number | undefined;
}
