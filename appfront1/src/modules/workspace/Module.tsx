import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import { WorkspaceDetail } from './pages/WorkspaceDetail/WorkspaceDetail';
import { BotModule } from '../bot/Module';
import { Entities } from '../entity/pages/Entities/Entities';
import { EntityCreate } from '../entity/pages/EntityCreate/EntityCreate';

class WorkspaceModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        { path: '/:workspaceId', isAuth: true, exact: true, component: WorkspaceDetail, title: 'Workspace' },
        { path: '/:workspaceId/bot', isAuth: true, exact: false, component: BotModule },
        { path: '/:workspaceId/entities', isAuth: true, exact: true, component: Entities },
        { path: '/:workspaceId/entities/:id', isAuth: true, exact: true, component: EntityCreate },
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const WorkspaceModule = withRouter(connect(mapStateToProps, {})(WorkspaceModuleClass));
