import { combineReducers } from 'redux';
import { loginReducer } from '../modules/login/redux/reducer';
import { workspaceReducer } from '../modules/workspace/redux/reducer';
import { botReducer } from '../modules/bot/redux/reducer';
import { entityReducer } from '../modules/entity/redux/reducer';

export const AppReducers = combineReducers({
   loginReducer,
   workspaceReducer,
   botReducer,
   entityReducer,
});
