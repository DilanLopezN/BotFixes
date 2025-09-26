import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import { BotDetail } from './pages/BotDetail/BotDetail';
import { AppRouter } from '../../Routes';
import ChannelConfig from '../newChannelConfig';
import I18n from '../i18n/components/i18n';

class BotModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        {
            path: '/:botId',
            isAuth: true,
            exact: true,
            component: BotDetail,
            title: 'Bot - Workspace',
        },
        { path: '/:botId/settings', isAuth: true, exact: true, component: ChannelConfig },
        {
            path: '/:botId/settings/:category',
            isAuth: true,
            exact: true,
            component: ChannelConfig,
            title: this.props.getTranslation('Settings') + ' - Bot',
        },
        {
            path: '/:botId/settings/:category/:channelId',
            isAuth: true,
            exact: true,
            component: ChannelConfig,
        },
        { path: '/:botId/interaction/:interactionId', isAuth: true, exact: true, component: BotDetail },
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotModule = I18n(withRouter(connect(mapStateToProps, {})(BotModuleClass)));
