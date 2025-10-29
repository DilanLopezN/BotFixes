import { User } from 'kissbot-core';
import { I18nProps } from './../../../../../i18n/interface/i18n.interface';

export interface FilterConversationsProps extends I18nProps {
    onFiltersApply: (...args: any) => any;
    onClose: () => any;
    appliedFilters?: any;
    workspaceId: string;
    loggedUser: User;
}