import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { IFilter, ICondition, FilterOperator } from "../../../../../model/Interaction";

export interface FilterProps extends I18nProps {
    filter: IFilter;
    submitted: boolean;
    onConditionsChange: (conditions: Array<ICondition>) => any;
    onOperatorChange: (operator: FilterOperator) => any;
}

export interface FilterState {
    filters?: IFilter;
    createdNewFilter: boolean;
}