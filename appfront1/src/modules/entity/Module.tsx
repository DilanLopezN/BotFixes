import React, { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Entities } from './pages/Entities/Entities';
import { AppRouter } from '../../Routes';
import I18n from '../i18n/components/i18n';

class EntitiesClass extends Component<any> {
    routes: Array<BotDesignerRoute> = [
        { path: '', isAuth: true, exact: true, component: Entities, title: this.props.getTranslation('Entities') },
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const EntitiesModule = I18n(withRouter(connect(mapStateToProps, {})(EntitiesClass)));
