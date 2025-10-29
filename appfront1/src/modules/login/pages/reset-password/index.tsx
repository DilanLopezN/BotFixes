import React, { FC } from 'react';
import { ResetPasswordProps } from './props';
import { Content, Card, Logo, InfoExpired } from './styles';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import ResetPasswordForm from '../../components/reset-password-form';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Constants } from '../../../../utils/Constants';
import { LoginActions } from '../../redux/actions';
import { cognitoLogout } from '../../../../helpers/amplify-instance';
import { addNotification } from '../../../../utils/AddNotification';

const ResetPassword: FC<ResetPasswordProps & I18nProps> = ({ getTranslation }) => {
    const query = new URLSearchParams(useLocation().search);
    const from = query.get('from');

    const history = useHistory();
    const dispatch = useDispatch();

    const logout = () => {
        localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.CURRENT_WORKSPACE);
        dispatch(LoginActions.setUser(undefined) as any);
        cognitoLogout();
        history.push('/users/login');
    };

    return (
        <Content>
            <Card>
                <Logo width='230px' src={`/assets/img/bot-logo-compressed.jpg`} alt='Logo' />
                {from ? (
                    <InfoExpired>
                        <span>{getTranslation('Your password has expired. Define a new one below')}:</span>
                    </InfoExpired>
                ) : null}
                <ResetPasswordForm addNotification={addNotification} onLogout={logout} />
            </Card>
        </Content>
    );
};

export default i18n(ResetPassword);
