import { Action } from "../../../interfaces/ReduxAction";
import { EntityTypes } from "./types";
import { Entity } from "kissbot-core";
import { AnyAction } from "redux";

export const EntityActions = {
    setCurrentEntities(Entities: Entity[]): Action {
        return {
            type: EntityTypes.GET_LIST_ENTITIES,
            payload: <Array<Entity>>Entities
        }
    },
    setCurrentEntity(entity: Entity): Action {
        return {
            type: EntityTypes.GET_ENTITY_CURRENT,
            payload: entity
        }
    },
    addEntity(entity: Entity): Action {
        return {
            type: EntityTypes.ADD_ENTITY,
            payload: entity
        }
    },
    removeEntity(entityId: string): Action {
        return {
            type: EntityTypes.REMOVE_ENTITY,
            payload: entityId,
        }
    },
    OnResetStore(): AnyAction {
        return {
            type: EntityTypes.RESET_STORE,
            payload: {}
        }
    }
}
