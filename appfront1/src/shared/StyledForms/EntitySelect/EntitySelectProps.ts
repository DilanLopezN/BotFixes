import { I18nProps } from './../../../modules/i18n/interface/i18n.interface';
import { Workspace } from "../../../model/Workspace";
import { Entity } from "kissbot-core";

export interface EntitySelectProps extends EntitySelectExposedProps {
    selectedWorkspace: Workspace;
}

export interface EntitySelectExposedProps extends I18nProps {
    fieldName: string;
    onChange?: (...params) => any;
    handleChange?: (...params) => any;
    disabled?: any;
    match?: any;
    entitiesList: Array<Entity>;
    entitiesListFlow?: Array<Entity>;
    value: any;
}