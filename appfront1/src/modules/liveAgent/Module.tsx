import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { LiveAgentChat } from './page/LiveAgentChat/LiveAgentChat';

class LiveAgentClass extends Component<any> {
    routes: Array<BotDesignerRoute> = [{ path: '/', isAuth: true, exact: true, component: LiveAgentChat }];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const LiveAgentModule = withRouter(connect(mapStateToProps, {})(LiveAgentClass));
