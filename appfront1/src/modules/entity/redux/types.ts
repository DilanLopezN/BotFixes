import { ReduxType } from "../../../interfaces/ReduxTypes";

export class EntityTypesClass implements ReduxType{
    prefix = "ENTITIES__";
    GET_LIST_ENTITIES = this.prefix + "GET_LIST_ENTITIES";
    GET_ENTITY_CURRENT = this.prefix + "GET_ENTITY_CURRENT";
    ADD_ENTITY = this.prefix + "ADD_ENTITY";
    REMOVE_ENTITY = this.prefix + "REMOVE_ENTITY";
    RESET_STORE = this.prefix + "RESET_STORE";
}

export const EntityTypes = new EntityTypesClass();
