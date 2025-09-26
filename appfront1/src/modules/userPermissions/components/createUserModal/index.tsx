import { FC, useEffect, useState } from 'react';
import * as Yup from 'yup';
import I18n from '../../../i18n/components/i18n';
import { PermissionResources, User, UserRoles } from 'kissbot-core';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Modal } from '../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { UserCreateModalProps } from './props';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import moment from 'moment';
import { useFormik } from 'formik-latest';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import InfoErrorsPassword from '../../../../shared/InfoErrorsPassword';
import InputPassword from '../../../../shared/InputPassword/InputPassword';
import { WorkspaceUserService } from '../../../settings/service/WorkspaceUserService';
import { UserService } from '../../../settings/service/UserService';
import { Button } from 'antd';

const UserCreateModal: FC<UserCreateModalProps & I18nProps> = ({
    isOpened,
    selectedWorkspace,
    onCreate,
    onClose,
    addNotification,
    getTranslation,
    messageUserLimit,
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [foundUserData, setFoundUserData] = useState<any>({});
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return !showPasswordForm
            ? Yup.object().shape({
                  email: Yup.string()
                      .email('Email not valid')
                      .required('This field is required')
                      .matches(/^[aA-zZ0-9@.-]+$/, 'Character invalid'),
              })
            : Yup.object().shape({
                  email: Yup.string()
                      .email('Email not valid')
                      .required('This field is required')
                      .matches(/^[aA-zZ0-9@.-]+$/, 'Character invalid'),
                  password: Yup.string()
                      .required(getTranslation('This field is required'))
                      .min(8, getTranslation('At least 8 characters'))
                      .max(20, getTranslation('Maximum 20 characters'))
                      .matches(
                          /^(?=.*[!@#$%^&*()--__+.?=]){1,}.{0,}$/,
                          getTranslation('Your password must contain at least one special character')
                      ),
              });
    };

    const addInitialUserRole = async (user: User): Promise<any> => {
        const requestData = {
            role: UserRoles.WORKSPACE_AGENT,
            resource: PermissionResources.WORKSPACE,
            resourceId: selectedWorkspace._id,
        };

        let error;
        const role = await WorkspaceUserService.createRole(
            selectedWorkspace._id,
            requestData,
            user._id as string,
            (err) => {
                console.error(`Error on add user role ${JSON.stringify(requestData)}`);
                error = err;
            }
        );

        if (!!error) {
            addNotification({
                title: getTranslation('Error creating user.'),
                message: getTranslation('Error creating user. Try again.'),
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        return role;
    };

    const userAlreadyExistsInWorkspace = (email: string): any => users.find((user) => user.email === email) ?? null;

    const userAlreadyExistsInDb = async (email: string): Promise<any> => {
        const response = await UserService.findByEmail(email);
        return response?.data?.[0] ?? null;
    };

    const createUser = async (values: any): Promise<void> => {
        let error: any;
        const requestData = {
            name: values.email,
            email: values.email,
            timezone: moment.tz.guess(true),
            password: values.password,
        };

        const user = await WorkspaceUserService.create(
            selectedWorkspace._id,
            requestData,
            (responseError) => (error = responseError)
        );

        if (!error) {
            await addInitialUserRole(user);
            return onCreate(user);
        }

        addNotification({
            title: getTranslation('Error creating user.'),
            message: getTranslation('Error creating user. Try again.'),
            type: 'warning',
            duration: 3000,
        });
    };

    const handleSubmit = async (values): Promise<void> => {
        let user: User | undefined = undefined;
        const workspaceUser: User = userAlreadyExistsInWorkspace(values.email);

        if (!workspaceUser) {
            user = await userAlreadyExistsInDb(values.email);
        }

        if (!!workspaceUser || !!user) {
            if (!!workspaceUser) {
                setFoundUserData({
                    isInWorkspace: true,
                    user: workspaceUser,
                });
            }

            if (!!user) {
                setFoundUserData({
                    isInWorkspace: false,
                    user: user,
                });
            }
        } else {
            setFoundUserData({});
            setShowPasswordForm(true);

            if (showPasswordForm) {
                await createUser({ ...values, email: values.email.toLowerCase() });
            }
        }
    };

    const handleUserInvite = async (): Promise<void> => {
        if (foundUserData.user) {
            const role = await addInitialUserRole(foundUserData.user);
            if (!!role) {
                return onCreate(foundUserData.user);
            }
        }
    };

    useEffect(() => {
        async function fetchWorkspaceUsers() {
            const response: PaginatedModel<User> = await WorkspaceUserService.getAll(selectedWorkspace._id);

            if (response?.data.length) {
                setUsers(response.data);
            }
        }

        fetchWorkspaceUsers();
    }, []);

    const formik = useFormik<any>({
        initialValues: {
            password: '',
            email: '',
        },
        validationSchema: getValidationSchema(),
        onSubmit: (values) => {
            handleSubmit(values);
        },
    });

    return (
        <Modal
            width='380px'
            height='auto'
            className='confirmationModal'
            isOpened={isOpened}
            position={ModalPosition.center}
            onClickOutside={onClose}
        >
            <Wrapper padding='10px 15px'>
                <Wrapper fontSize='17px' margin='0 0 15px 0'>
                    {getTranslation('Create user')}
                </Wrapper>
                {messageUserLimit.userCount >= Number(messageUserLimit.planUserLimit) &&
                    selectedWorkspace?.featureFlag?.showMessageUserLimit && (
                        <Wrapper>
                            <Wrapper color='red' margin='-5px 0 5px 0'>
                                {getTranslation(
                                    'User limit of the contracted plan has been reached! \nNew users will be billed on the next invoice.'
                                )}
                            </Wrapper>
                            <Wrapper flexBox alignItems='baseline'>
                                <Wrapper margin='5px 0 0 0'>
                                    {getTranslation('Contracted quantity:')} <b>{messageUserLimit.planUserLimit}</b>
                                </Wrapper>
                                <Wrapper margin='0 0 10px 20px'>
                                    {getTranslation('Active users:')} <b>{messageUserLimit.userCount}</b>
                                </Wrapper>
                            </Wrapper>
                        </Wrapper>
                    )}
                <LabelWrapper
                    label={getTranslation('Email')}
                    validate={{
                        touched: formik.touched,
                        errors: formik.errors,
                        fieldName: 'email',
                        isSubmitted: true,
                    }}
                >
                    <InputSimple
                        autoFocus
                        name='email'
                        value={formik.values.email}
                        onChange={(ev) => {
                            if (!ev) return;
                            formik.setFieldValue('email', ev.target.value.toLowerCase());
                            if (foundUserData.user) {
                                setFoundUserData({});
                            }
                        }}
                    />
                </LabelWrapper>
                {showPasswordForm && (
                    <>
                        <LabelWrapper
                            label={getTranslation('Password')}
                            validate={{
                                touched: formik.touched,
                                errors: formik.errors,
                                fieldName: 'password',
                                isSubmitted: formik.submitCount > 1,
                            }}
                        >
                            <InputPassword
                                value={formik.values.password}
                                name='password'
                                onChange={(ev) => {
                                    if (!ev) return;
                                    formik.setFieldValue('password', ev.target.value.trim());
                                }}
                            />
                        </LabelWrapper>
                        <div style={{ margin: '10px 0' }}>
                            <InfoErrorsPassword
                                errors={getValidationSchema()}
                                fieldName='password'
                                value={formik.values.password}
                            />
                        </div>
                    </>
                )}
                {foundUserData.user ? (
                    foundUserData.isInWorkspace ? (
                        <p className='text-danger'>{getTranslation('User already exists in workspace')}</p>
                    ) : (
                        <p className='text-danger'>{getTranslation('User already exists')}</p>
                    )
                ) : null}
                <Wrapper flexBox margin='10px 0' justifyContent='flex-end'>
                    <Button
                        className='antd-span-default-color'
                        type='primary'
                        ghost
                        style={{ margin: '0 10px' }}
                        onClick={onClose}
                    >
                        {getTranslation('Cancel')}
                    </Button>
                    {foundUserData.user && !foundUserData.isInWorkspace ? (
                        <Button className='antd-span-default-color' type='primary' onClick={handleUserInvite}>
                            {getTranslation('Invite to the workspace')}
                        </Button>
                    ) : null}
                    {!foundUserData.user ? (
                        <Button
                            className='antd-span-default-color'
                            type='primary'
                            disabled={!!formik.errors.email || !formik.values.email}
                            onClick={(event) => {
                                event?.preventDefault();
                                formik.handleSubmit();
                            }}
                        >
                            {getTranslation('Create')}
                        </Button>
                    ) : null}
                </Wrapper>
            </Wrapper>
        </Modal>
    );
};

export default I18n(UserCreateModal) as FC<UserCreateModalProps>;
