import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { ICondition, FilterOperator } from "../../../../../model/Interaction";
import { FormProps } from "../../../../../interfaces/FormProps";
import { Workspace } from "../../../../../model/Workspace";
import { Entity } from "kissbot-core";

export interface FilterFormProps extends FormProps, I18nProps {
    condition: ICondition;
    filterOperator: FilterOperator;
    submitted: boolean;
    onDelete: (...params) => any;
    onOperatorChange: (...params) => any;
    createdNewFilter: boolean;
    selectedWorkspace: Workspace;
    setCurrentEntities: (entitiesList: Array<Entity>) => any;
    setCurrentEntity: (entityId: any) => any;
    entitiesList: Array<Entity>;
}

export interface FilterFormState {
    isFormOpened: boolean;
}