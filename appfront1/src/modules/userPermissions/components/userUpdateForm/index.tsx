import { FC, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { PermissionResources, UserLanguage, UserRoles } from 'kissbot-core';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Wrapper, Card } from '../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import UserRolesCard from './components/UserRolesCard';
import {
    isAnySystemAdmin,
    isOwnProfile,
    isWorkspaceAdmin,
    removeUserWorkspaceRoles,
} from '../../../../utils/UserPermission';
import { UserUpdateFormProps } from './props';
import { ModalConfirm } from '../../../../shared/ModalConfirm/ModalConfirm';
import moment from 'moment';
import { Spin, Button } from 'antd';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import ChangeUserPassword from '../changeUserPassword';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import { isSSOUser } from '../../../../helpers/user';
import { SettingsService } from '../../../settings/service/SettingsService';

const initialUser = {
    _id: undefined,
    name: '',
    email: '',
    language: UserLanguage.pt,
};

const validationSchema = Yup.object({
    name: Yup.string().required('This field is required'),
    email: Yup.string().email('Email not valid').required(),
    password: Yup.string(),
});

const UserUpdateForm: FC<UserUpdateFormProps & I18nProps> = ({
    targetUser,
    selectedWorkspace,
    loggedUser,
    onRemove,
    getTranslation,
    addNotification,
    onCancel,
    location,
    loadingRequest,
}) => {
    const [user, setUser] = useState<any>({ ...initialUser });
    const [role, setRole] = useState<UserRoles | undefined>(undefined);
    const [delUser, setDelUser] = useState<boolean>(false);
    const [modalChangeOpen, setModalChangeOpen] = useState(false);
    const [passwordModalIsVisible, setPasswordModalIsVisible] = useState(false);
    const [messageUserLimit, setMessageUserLimit] = useState<{ planUserLimit: any; userCount: any }>({
        planUserLimit: 1,
        userCount: 0,
    });
    const [isFormChanged, setIsFormChanged] = useState(false);

    const updateUserRole = async (): Promise<void> => {
        if (role) {
            await removeUserWorkspaceRoles(user, selectedWorkspace._id);

            const requestData = {
                role,
                resource: PermissionResources.WORKSPACE,
                resourceId: selectedWorkspace._id,
            };

            await WorkspaceUserService.createRole(selectedWorkspace._id, requestData, user._id as string, () => {
                console.error(`Error on add user role ${JSON.stringify(requestData)}`);
            });
        }
    };

    const handleSubmit = async (data): Promise<void> => {
        const requestData = { ...data, timezone: moment.tz.guess(true) };
        const responseData = await WorkspaceUserService.update(selectedWorkspace._id, user._id as string, {
            ...requestData,
            avatar: undefined,
            passwordExpires: undefined,
        });
        setIsFormChanged(false);

        if (responseData) {
            addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('User successfully saved'),
                duration: 3000,
            });
            if (loggedUser._id !== user._id) {
                await updateUserRole();
            }
        } else {
            return addNotification({
                message: getTranslation('Error updating user data. Try again'),
                type: 'warning',
                duration: 3000,
            });
        }
    };

    const handleFormChange = () => {
        setIsFormChanged(true);
    };

    useEffect(() => {
        setIsFormChanged(false);
    }, [targetUser]);

    const cancelEdit = (values) => {
        if (!user) return;

        if (!isFormChanged || (values.name === user.name && values.email === user.email)) {
            onCancel();
        } else {
            setModalChangeOpen(true);
        }
    };

    const handleRemove = async (): Promise<void> => {
        await removeUserWorkspaceRoles(user, selectedWorkspace._id);

        onRemove();
    };

    const getPlanUserLimit = async () => {
        const response = await SettingsService.checkPlanUserLimit(selectedWorkspace._id);

        if (!response) return;

        setMessageUserLimit({ planUserLimit: response.planUserLimit, userCount: response.userCount });
    };

    useEffect(() => {
        getPlanUserLimit();
    }, []);

    useEffect(() => {
        setUser(targetUser);
    }, [targetUser]);

    const permissions = () => {
        const isAnyAdmin = isAnySystemAdmin(loggedUser);
        const userIsWorkspaceAdmin = isWorkspaceAdmin(loggedUser, selectedWorkspace._id);
        const isUserAnyAdmin = isAnySystemAdmin(user);

        if (isAnyAdmin) {
            return false;
        } else if (userIsWorkspaceAdmin && isUserAnyAdmin) {
            return true;
        } else {
            return false;
        }
    };

    const showChangePassword = () => {
        return isAnySystemAdmin(loggedUser)
            ? true
            : isWorkspaceAdmin(loggedUser, selectedWorkspace._id) && !isAnySystemAdmin(user);
    };

    const showMessageUserLimit = () => {
        if (
            user.roles.find(
                (r) =>
                    r.resource === PermissionResources.WORKSPACE &&
                    r.resourceId === selectedWorkspace._id &&
                    r.role === UserRoles.WORKSPACE_INACTIVE
            ) &&
            role !== UserRoles.WORKSPACE_INACTIVE &&
            messageUserLimit.userCount >= Number(messageUserLimit.planUserLimit) &&
            selectedWorkspace?.featureFlag?.showMessageUserLimit
        ) {
            return true;
        }
        return false;
    };

    return (
        <>
            <ModalConfirm
                isOpened={delUser}
                onAction={(action) => {
                    if (action) {
                        handleRemove();
                        setDelUser(false);
                    } else {
                        setDelUser(false);
                    }
                }}
            >
                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                <p style={{ margin: '10px 0px 17px' }}>
                    {getTranslation('Are you sure you want to delete the user? The action cannot be undone')}
                </p>
            </ModalConfirm>
            <div className='ModalContainer'>
                <ModalConfirm
                    height='150px'
                    width='390px'
                    isOpened={modalChangeOpen}
                    position={ModalPosition.center}
                    onConfirmText={getTranslation('Yes')}
                    onCancelText={getTranslation('No')}
                    onAction={(action) => {
                        if (action) {
                            onCancel();
                            setModalChangeOpen(false);
                        } else {
                            setModalChangeOpen(false);
                        }
                    }}
                >
                    <div className='modal-change-close'>
                        <h5>{getTranslation('Unsaved changes')}</h5>
                        <p>
                            {getTranslation('You have unsaved changes. Are you sure you want to leave')}
                            <span>{getTranslation('without saving')}?</span>
                        </p>
                    </div>
                </ModalConfirm>
            </div>
            {passwordModalIsVisible && !!user && (
                <ChangeUserPassword
                    setUser
                    onClose={() => setPasswordModalIsVisible(false)}
                    visible={passwordModalIsVisible}
                    workspaceId={selectedWorkspace._id}
                    addNotification={addNotification}
                    user={user}
                />
            )}

            <Wrapper>
                {user?._id && (
                    <Formik
                        enableReinitialize
                        initialValues={{ ...user }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        render={({ values, errors, touched, submitForm, submitCount }) => (
                            <>
                                <Wrapper flexBox justifyContent='space-between' alignItems='center' margin='0 0 10px 0'>
                                    <Wrapper justifyContent='flex-end' alignItems='center' flexBox>
                                        {!isOwnProfile(loggedUser, user) && (
                                            <>
                                                {isAnySystemAdmin(loggedUser) && (
                                                    <Button
                                                        className='antd-span-default-color'
                                                        type='primary'
                                                        danger
                                                        disabled={permissions()}
                                                        onClick={() => setDelUser(true)}
                                                    >
                                                        {getTranslation('Delete')}
                                                    </Button>
                                                )}
                                                {showChangePassword() && targetUser && !isSSOUser(targetUser) && (
                                                    <Button
                                                        style={{ margin: '0 20px 0 10px' }}
                                                        className='antd-span-default-color'
                                                        onClick={() => setPasswordModalIsVisible(true)}
                                                    >
                                                        {getTranslation('Change password')}
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </Wrapper>
                                    <Wrapper flexBox justifyContent='flex-end' alignItems='center' margin='0 0 10px 0'>
                                        <Button
                                            className='antd-span-default-color'
                                            type='link'
                                            onClick={() => cancelEdit(values)}
                                        >
                                            {getTranslation('Cancel')}
                                        </Button>

                                        <Button
                                            className='antd-span-default-color'
                                            type='primary'
                                            disabled={permissions()}
                                            onClick={submitForm}
                                        >
                                            {getTranslation('Save')}
                                        </Button>
                                    </Wrapper>
                                </Wrapper>
                                <Spin spinning={loadingRequest}>
                                    <Card header={getTranslation('Profile')}>
                                        <Form onChange={handleFormChange}>
                                            <LabelWrapper
                                                label={getTranslation('Email')}
                                                validate={{
                                                    errors,
                                                    touched,
                                                    isSubmitted: !!submitCount,
                                                    fieldName: 'email',
                                                }}
                                            >
                                                <StyledFormikField
                                                    disabled
                                                    name='email'
                                                    placeholder={getTranslation('Email')}
                                                />
                                            </LabelWrapper>
                                            <LabelWrapper
                                                label={getTranslation('Name')}
                                                validate={{
                                                    errors,
                                                    touched,
                                                    isSubmitted: !!submitCount,
                                                    fieldName: 'name',
                                                }}
                                            >
                                                <StyledFormikField
                                                    autoFocus
                                                    name='name'
                                                    placeholder={getTranslation('Name')}
                                                />
                                            </LabelWrapper>
                                        </Form>
                                        {showMessageUserLimit() && (
                                            <Wrapper color='red' margin='15px 0 5px 0'>
                                                {getTranslation(
                                                    "When changing the user's permission, the user limit will be exceeded, resulting in an increase for the next invoice."
                                                )}
                                            </Wrapper>
                                        )}
                                    </Card>

                                    <UserRolesCard
                                        user={user}
                                        role={role}
                                        selectedWorkspace={selectedWorkspace}
                                        loggedUser={loggedUser}
                                        onChange={(role) => setRole(role)}
                                    />
                                </Spin>
                            </>
                        )}
                    />
                )}
            </Wrapper>
        </>
    );
};

export default I18n(UserUpdateForm) as FC<UserUpdateFormProps>;
