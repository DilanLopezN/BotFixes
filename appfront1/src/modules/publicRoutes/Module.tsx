import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import PublicDashboard from './pages/publicDashboardRealTime/Public-dashboard-real-time';

class PublicModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        { path: '/real-time', isAuth: false, component: PublicDashboard, exact: true },
        
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

export const PublicModule = PublicModuleClass;
