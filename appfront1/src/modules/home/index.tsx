import { FC } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import Home from './pages/home';

interface HomeProps extends RouteComponentProps {}

const HomeWrapper: FC<HomeProps> = (props) => {
    const routes: BotDesignerRoute[] = [{ path: '/', isAuth: true, exact: true, component: Home, title: 'Home' }];
    return <AppRouter match={props.match.path} routes={routes} />;
};

const mapStateToProps = (state: any, ownProps: any) => ({});
export const HomeModule = withRouter(connect(mapStateToProps, {})(HomeWrapper));
