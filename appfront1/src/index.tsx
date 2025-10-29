import ReactDOM from 'react-dom/client';
import './index.scss';
import { Provider } from 'react-redux';
import store from './redux/store';
import { LanguageContextProvider } from './modules/i18n/context';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const App = lazy(() => import('./App').then((module) => ({ default: module.App })));
const Iframes = lazy(() => import('./iframes').then((module) => ({ default: module.Iframes })));

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <Provider store={store}>
        <Suspense>
            <BrowserRouter>
                <Switch>
                    <Route path='/iframes'>
                        <Iframes />
                    </Route>
                    <Route>
                        <LanguageContextProvider>
                            <App />
                        </LanguageContextProvider>
                    </Route>
                </Switch>
            </BrowserRouter>
        </Suspense>
    </Provider>
);