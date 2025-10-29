import { FlowAction, User } from 'kissbot-core';
import { I18nProps } from './../../../../../../../../../i18n/interface/i18n.interface';

export interface FlowRulesCardProps extends I18nProps {
    touched: Function;
    errors: any;
    isSubmitted: boolean;
    setFieldValue: Function;
    values: FlowAction[];
    index: number;
    workspaceId: string;
    bots: any[];
    onDeleteAction: Function;
    validation: [];
    loggedUser: User;
}
