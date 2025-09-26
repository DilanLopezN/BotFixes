import { EntityTypes } from './types';
import { Entity } from 'kissbot-core';
import { AnyAction } from 'redux';


const initialState: any = {
    entitiesList: [],
    entityCurrent: {}
};

export const entityReducer = (state = initialState, action: AnyAction) => {
    switch (action.type) {
        case EntityTypes.GET_LIST_ENTITIES: {
            return {
                ...state,
                entitiesList: <Entity>action.payload
            }
        }
        case EntityTypes.GET_ENTITY_CURRENT: {
            return {
                ...state,
                entityCurrent: <Entity>action.payload
            }
        }
        case EntityTypes.ADD_ENTITY: {
            return {
                ...state,
                entitiesList: [...state.entitiesList, action.payload],
            }
        }
        case EntityTypes.REMOVE_ENTITY: {
            return {
                ...state,
                entitiesList: [...state.entitiesList.filter((entity: Entity) =>
                    entity._id !== action.payload),
                ],
            }
        }
        case EntityTypes.RESET_STORE: {
            state = initialState
            return state
        }
        default:
            return state;
    }
};
