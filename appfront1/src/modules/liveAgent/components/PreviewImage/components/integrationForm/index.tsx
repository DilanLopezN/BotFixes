import { FC, useState } from 'react';
import { Input } from 'antd';
import { PrimaryButton } from '../../../../../../ui-kissbot-v2/common';
import { ManagerService } from '../modalIntegration/integration.service';
import { IntegrationFormProps } from './props';
import { Content, Actions } from './styled';
import Cookies from 'universal-cookie';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import moment from 'moment';

const cookies = new Cookies();

export const MANAGER_TOKEN = '@manager.token';
export const MANAGER_DEFAULT_USER = '@manager.user';

const IntegrationForm: FC<IntegrationFormProps & I18nProps> = ({
    onAuthenticated,
    getTranslation,
    addNotification,
    workspaceId,
}) => {
    const getDefaultValue = () => {
        const data = localStorage.getItem(MANAGER_DEFAULT_USER);

        if (typeof data === 'string') {
            return data;
        }
    };

    const [form, setForm] = useState({
        password: '',
        username: getDefaultValue() || '',
    });

    const auth = async () => {
        if (!form.password || !form.username) {
            return;
        }

        localStorage.setItem(MANAGER_DEFAULT_USER, form.username);

        try {
            const response = await ManagerService.auth(workspaceId, { ...form });
            if (response.data) {
                const expires = moment();
                expires.add(2, 'hours');
                cookies.set(MANAGER_TOKEN, response.data.token, {
                    expires: expires.toDate(),
                });

                onAuthenticated();
            }
        } catch (error) {
            cookies.remove(MANAGER_TOKEN);
            localStorage.removeItem(MANAGER_DEFAULT_USER);

            if (!!error?.response?.data) {
                return addNotification({
                    title: getTranslation('Error'),
                    message: error.response.data.message,
                    type: 'warning',
                    duration: 4000,
                });
            }

            addNotification({
                title: getTranslation('Error'),
                message: 'Ocorreu um erro. Verifique suas credenciais',
                type: 'warning',
                duration: 4000,
            });
        }
    };

    const handleFormChanged = (field: string, value: any) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <Content>
            <p>{getTranslation('Enter the platform')}</p>
            <Input
                autoFocus={!form.username}
                placeholder={getTranslation('Username')}
                value={form.username}
                onChange={(ev) => handleFormChanged('username', ev.target.value)}
            />
            <Input.Password
                style={{
                    margin: '6px 0 10px 0',
                }}
                autoFocus={!!form.username}
                placeholder={getTranslation('Password')}
                value={form.password}
                onKeyPress={(event) => {
                    if (event.key === 'Enter') {
                        auth();
                    }
                }}
                onChange={(ev) => handleFormChanged('password', ev.target.value)}
            />

            <Actions>
                <PrimaryButton onClick={auth}>{getTranslation('Login')}</PrimaryButton>
            </Actions>
        </Content>
    );
};

export default i18n(IntegrationForm);
