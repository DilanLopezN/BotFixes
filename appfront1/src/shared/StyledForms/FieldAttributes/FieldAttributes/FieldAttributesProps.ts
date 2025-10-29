import { IPart } from "../../../../model/Interaction";

export interface FieldAttributesProps{
    onChange: (...params) => any;
    onBlur?: (...params) => any;
    /**
     * Valores possíveis : CREATE, USE_VALUE
     */
    type: string;
    value: string | Array<IPart>;
}

export interface FieldAttributesState{
    value: any;
    isSomeModalOpened: boolean;
}

export interface FieldAttributesPart extends IPart{
    isHandlebars?: boolean;
}