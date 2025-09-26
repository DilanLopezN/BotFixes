import { createStore, applyMiddleware } from 'redux';
import { AppReducers } from './AppReducers';
import thunk from 'redux-thunk';

const middleware : any[] = [thunk]
export default createStore(
    AppReducers,
        applyMiddleware(...middleware)
);
