import { Alert, Card, Dropdown, Input, MenuProps, notification, Select, Upload } from 'antd';
import { useFormik } from 'formik-latest';
import moment from 'moment';
import { FC } from 'react';
import { MdOutlinePhotoCamera } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import * as Yup from 'yup';
import { cognitoLogout } from '../../../../helpers/amplify-instance';
import { apiInstance } from '../../../../utils/Http';
import { isSSOUser } from '../../../../helpers/user';
import Toggle from '../../../../shared-v2/Toggle/Toggle';
import HelpCenterLink from '../../../../shared/HelpCenterLink';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { UserAvatar, Wrapper } from '../../../../ui-kissbot-v2/common';
import { Constants } from '../../../../utils/Constants';
import { timeout } from '../../../../utils/Timer';
import { isAnySystemAdmin, isUserAgent, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import { BotActions } from '../../../bot/redux/actions';
import { EntityActions } from '../../../entity/redux/actions';
import { useLanguageContext } from '../../../i18n/context';
import { Languages } from '../../../i18n/interface/i18n.interface';
import { LoginActions } from '../../../login/redux/actions';
import Header from '../../../newChannelConfig/components/Header';
import { UserService } from '../../../settings/service/UserService';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { useAvatarUpload } from '../../hooks/use-avatar-upload';
import { EditInformationsProps } from './props';
import {
    ButtonExitStyled,
    ButtonStyled,
    Content,
    ContentBody,
    ContentChangePassword,
    ContentServiceSettings,
    IconPhoto,
    LabelServiceSettings,
    WidgetPhoto,
} from './styles';

const EditInformations: FC<EditInformationsProps> = () => {
    const { getTranslation } = useLanguageContext();
    const { loggedUser, settings } = useSelector((state: any) => state.loginReducer);
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { url, fileAvatar, saveAvatar, previewUrl, selectAvatar, removeAvatar } = useAvatarUpload();

    const history = useHistory();
    const dispatch = useDispatch();

    const shouldRestrictEditProfile = (() => {
        if (isAnySystemAdmin(loggedUser) || isWorkspaceAdmin(loggedUser, selectedWorkspace?._id)) {
            return false;
        }

        const flagEnabledEditProfile = selectedWorkspace?.generalConfigs?.enableEditProfileAllUsers;

        return flagEnabledEditProfile && isUserAgent(loggedUser, selectedWorkspace?._id);
    })();

    const isEnableEditProfile: boolean = shouldRestrictEditProfile;

    const getValidationSchema = () => {
        return Yup.object({
            name: Yup.string().required(),
            language: Yup.string().required(),
        });
    };

    const save = async (values: any) => {
        const newValues = {
            name: values.name,
            language: values.language,
            avatar: values.avatar,
            liveAgentParams: {
                notifications: {
                    emitSoundNotifications: values.sound,
                    notificationNewAttendance: values?.notificationNewAttendance,
                },
            },
            timezone: moment.tz.guess(true),
        };

        if (!loggedUser._id) {
            return;
        }

        let error: any;
        let avatarError: any;
        let hasAvatarUpload = false;

        if (fileAvatar) {
            hasAvatarUpload = true;
            try {
                await saveAvatar();
            } catch (err) {
                avatarError = err;
            }
        }

        const data = await UserService.update(
            loggedUser._id,
            {
                ...newValues,
                avatar: undefined,
            },
            selectedWorkspace?._id,
            (err: any) => {
                error = err;
            }
        );

        if (error || avatarError) {
            notification.warning({
                message: getTranslation('Error'),
                description: getTranslation('Error updating the user. Try again'),
                duration: 2,
            });
            return;
        }

        if (data) {
            if (!hasAvatarUpload) {
                notification.success({
                    message: getTranslation('Success'),
                    description: getTranslation('User updated successfully'),
                    duration: 2,
                });
            }

            timeout(() => {
                dispatch(
                    LoginActions.update({
                        ...data,
                        avatar: data.avatar?.length > 1 ? `${data.avatar}?c=${+new Date()}` : '',
                    })
                );
            }, 3000);
        }
    };

    const resetRedux = () => {
        dispatch(LoginActions.login({} as any));
        dispatch(WorkspaceActions.OnResetStore());
        dispatch(EntityActions.OnResetStore());
        dispatch(BotActions.OnResetStore());
    };

    const logout = async () => {
        try {
            if (selectedWorkspace?._id) {
                await apiInstance.post(`workspaces/${selectedWorkspace?._id}/agentStatus/workingTimeDisconnect`);
            }
        } catch (e) {
        } finally {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.CURRENT_WORKSPACE);
            resetRedux();
            cognitoLogout();
            return history.push('/users/login');
        }
    };

    const formik = useFormik({
        validationSchema: getValidationSchema(),
        initialValues: {
            avatar: loggedUser.avatar || '',
            name: loggedUser.name,
            language: loggedUser.language || 'en',
            sound: loggedUser.liveAgentParams?.notifications?.emitSoundNotifications,
            notificationNewAttendance: loggedUser.liveAgentParams?.notifications?.notificationNewAttendance,
        },
        onSubmit: () => {
            formik.setSubmitting(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    save(formik.values);
                }
            });
        },
    });

    const items: MenuProps['items'] = [
        {
            key: '0',
            label: (
                <Upload
                    accept='image/jpg,image/jpeg,image/png'
                    showUploadList={false}
                    beforeUpload={(file) => {
                        selectAvatar(file);
                        return false;
                    }}
                >
                    <Wrapper flexBox alignItems='center' color='#262626'>
                        <MdOutlinePhotoCamera style={{ marginRight: '10px' }} />
                        {!!fileAvatar ? getTranslation('Change photo') : getTranslation('Add photo')}
                    </Wrapper>
                </Upload>
            ),
        },
        url && {
            key: '1',
            label: (
                <div onClick={() => removeAvatar()}>
                    <Wrapper flexBox alignItems='center' color='#262626'>
                        <Wrapper margin={'0 13px 0 3px'} color='#262626'>
                            x
                        </Wrapper>
                        {getTranslation('Remove photo')}
                    </Wrapper>
                </div>
            ),
        },
    ];

    return (
        <Wrapper margin='-20px 0 -25px 0'>
            <Header title={getTranslation('Profile')}></Header>
            <Content>
                <Card
                    className='contentEditInformations'
                    bordered={false}
                    style={{
                        width: '410px',
                        borderRadius: '8px',
                    }}
                >
                    <form>
                        <Wrapper flexBox justifyContent='center' position='relative'>
                            <UserAvatar
                                id='user-profile-avatar'
                                user={{ ...loggedUser, avatar: previewUrl || url }}
                                hashColor={`${loggedUser._id}${loggedUser._id}`}
                                size={150}
                            />
                            {!isEnableEditProfile && (
                                <WidgetPhoto>
                                    <Dropdown trigger={['click']} menu={{ items }}>
                                        <IconPhoto />
                                    </Dropdown>
                                </WidgetPhoto>
                            )}
                        </Wrapper>
                        <ContentBody>
                            {isEnableEditProfile && (
                                <Alert
                                    message={getTranslation('You cannot edit profile information.')}
                                    type='warning'
                                />
                            )}
                            <LabelWrapper
                                label={getTranslation('Name')}
                                validate={{
                                    errors: formik.errors,
                                    fieldName: 'name',
                                    isSubmitted: formik.submitCount > 0,
                                    touched: true,
                                }}
                            >
                                <Input
                                    disabled={isEnableEditProfile}
                                    value={formik.values.name}
                                    onChange={(event) => {
                                        formik.setFieldValue('name', event.target.value);
                                    }}
                                />
                            </LabelWrapper>
                            <LabelWrapper label={getTranslation('Language')}>
                                <Select
                                    style={{ width: '100%' }}
                                    value={formik.values.language}
                                    onChange={(value) => {
                                        formik.setFieldValue('language', value);
                                    }}
                                >
                                    <Select.Option value={'pt'}>{getTranslation(Languages.pt)}</Select.Option>
                                    <Select.Option value={'en'}>{getTranslation(Languages.en)}</Select.Option>
                                </Select>
                                {!isSSOUser(loggedUser) && (
                                    <ContentChangePassword
                                        title={getTranslation('Change password')}
                                        onClick={() => history.push('/users/password-reset')}
                                    >
                                        {getTranslation('Change password')}
                                    </ContentChangePassword>
                                )}
                            </LabelWrapper>
                        </ContentBody>
                        <ContentServiceSettings>
                            <LabelServiceSettings>{getTranslation('Service settings')}</LabelServiceSettings>
                            <Toggle
                                checked={formik.values.sound}
                                onChange={() => {
                                    formik.setFieldValue('sound', !formik.values.sound);
                                }}
                                label={getTranslation('Enable message notification sound.')}
                            />
                            <br />

                            <Wrapper flexBox>
                                <Toggle
                                    checked={formik.values?.notificationNewAttendance}
                                    onChange={() => {
                                        formik.setFieldValue(
                                            'notificationNewAttendance',
                                            !formik.values.notificationNewAttendance
                                        );
                                    }}
                                    label={`${getTranslation('Show notification of new attendance')}.`}
                                />
                                <HelpCenterLink
                                    article={'69000869595-como-habilitar-notificacão-de-um-novo-atendimento-'}
                                />
                            </Wrapper>
                        </ContentServiceSettings>

                        <ButtonStyled type='primary' block onClick={() => formik.submitForm()}>
                            {getTranslation('Save')}
                        </ButtonStyled>

                        <ButtonExitStyled type='primary' className='ant-btn-danger' block onClick={logout}>
                            {getTranslation('Disconnect')}
                        </ButtonExitStyled>
                    </form>
                </Card>
            </Content>
        </Wrapper>
    );
};

export { EditInformations };
