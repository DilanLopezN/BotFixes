import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import { Profile } from './pages/Profile/Profile';
import I18n from '../i18n/components/i18n';

class ProfileModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        { path: '', isAuth: true, exact: true, component: Profile, title: this.props.getTranslation('Profile') },
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const ProfileModule = I18n(withRouter(connect(mapStateToProps, {})(ProfileModuleClass)));
