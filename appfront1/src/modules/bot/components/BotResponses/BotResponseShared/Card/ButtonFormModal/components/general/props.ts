import { IButton } from 'kissbot-core';
import { Interaction } from './../../../../../../../../../model/Interaction';
import { I18nProps } from './../../../../../../../../i18n/interface/i18n.interface';

export interface GeneralProps extends I18nProps {
    interactionList: Interaction[];
    values: IButton;
    touched: Function;
    errors: any;
    isSubmitted: boolean;
    setFieldValue: Function;
    buildAsQuickReply?: boolean;
    buildAsList?: boolean;
    buttonTitleLimit?: number;
}
