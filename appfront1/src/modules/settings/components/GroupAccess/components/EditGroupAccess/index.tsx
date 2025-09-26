import { FC, useState, useEffect } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { EditGroupAccessProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import * as Yup from 'yup';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import orderBy from 'lodash/orderBy';
import { ModalPosition } from '../../../../../../shared/ModalPortal/ModalPortalProps';
import { WorkspaceAccessControl } from '../GroupsAccessWrapper/interface';
import { SettingsService } from '../../../../service/SettingsService';
import { useFormik } from 'formik-latest';
import { Spin, Button } from 'antd';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';

const EditGroupAccess: FC<EditGroupAccessProps & I18nProps> = ({
    group,
    workspaceId,
    getTranslation,
    addNotification,
    onCancel,
    onUpdatedGroup,
    onCreatedGroup,
    userList,
    onDeletedGroup,
    loadingRequest,
    editing,
    selectedTab,
    setCurrentComponent,
}) => {
    const emptyGroupAccess = {
        name: '',
        accessSettings: { userList: [], ipListData: [''] },
        workspaceId: workspaceId,
    };
    const [currentGroup, setCurrentGroup] = useState<WorkspaceAccessControl>(group || emptyGroupAccess);
    const [withError, setWithError] = useState<any>(undefined);
    const [submitted, setSubmitted] = useState(false);
    const [deleteGroup, setDeleteGroup] = useState<boolean>(false);
    const [modalChangeOpen, setModalChangeOpen] = useState(false);
    const [reinitialize, setReinitialize] = useState(group ? true : false);

    useEffect(() => {
        if (group) {
            setReinitialize(true);
            setCurrentGroup(group);
        }
    }, [group]);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            name: Yup.string().required('This field is required'),
            accessSettings: Yup.object(),
        });
    };

    const updateGroup = async (group: WorkspaceAccessControl) => {
        if (!group) {
            return;
        }

        const updatedGroup = await SettingsService.updateGroupAccess(workspaceId, group, (err: any) => {
            setWithError(err);
        });

        if (!withError && updatedGroup) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Group access updated successfully'),
            });

            setSubmitted(false);
            return onUpdatedGroup();
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const createGroup = async (group: WorkspaceAccessControl) => {
        if (!group) {
            return;
        }

        const createdGroup = await SettingsService.createGroupAccess(workspaceId, group, (err: any) => {
            setWithError(err);
        });

        if (!withError && createdGroup) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Group access successfully created'),
            });

            setSubmitted(false);
            return onCreatedGroup();
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const save = (values: WorkspaceAccessControl) => {
        group ? updateGroup(values) : createGroup(values);

        setCurrentGroup(values);
    };

    const onDeleteGroup = async () => {
        if (!currentGroup._id || !workspaceId) {
            return;
        }

        await SettingsService.deleteGroupAccess(workspaceId, currentGroup._id, (err: any) => {
            setWithError(err);
        });

        if (!withError) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onDeletedGroup(currentGroup._id);
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const cancelEdit = (values) => {
        if (!values._id) {
            onCancel();
        }

        let newValues: any = {};
        let newGroup: any = {};
        orderBy(Object.keys(values)).map((value) => {
            newValues[value] = values[value];
        });

        if (!group) return;

        orderBy(Object.keys(group)).map((value) => {
            newGroup[value] = group[value];
        });

        if (JSON.stringify(newGroup) === JSON.stringify(newValues)) {
            onCancel();
        } else {
            setCurrentGroup(values);
            setModalChangeOpen(true);
        }
    };

    const formik = useFormik({
        enableReinitialize: reinitialize,
        validationSchema: getValidationSchema(),
        initialValues: {
            ...currentGroup,
            accessSettings: {
                userList: [...currentGroup.accessSettings.userList],
                ipListData: (currentGroup.accessSettings.ipListData.length > 0 &&
                    currentGroup.accessSettings.ipListData) || [''],
            },
        },
        onSubmit: () => {
            setSubmitted(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    const IPs = formik.values.accessSettings.ipListData.filter((ip) => ip !== '');
                    const newValues = {
                        ...formik.values,
                        accessSettings: { ...formik.values.accessSettings, ipListData: IPs },
                    };
                    save(newValues as WorkspaceAccessControl);

                    if (withError) {
                        formik.resetForm();
                    }
                }
            });
        },
    });

    const Component = selectedTab.component;
    return (
        <form>
            <div className='ModalContainer'>
                <ModalConfirm
                    height='150px'
                    width='390px'
                    isOpened={modalChangeOpen}
                    position={ModalPosition.center}
                    onConfirmText={getTranslation('Yes')}
                    onCancelText={getTranslation('No')}
                    onAction={(action: any) => {
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
                            <span> {getTranslation('without saving')}?</span>
                        </p>
                    </div>
                </ModalConfirm>
            </div>
            <ModalConfirm
                isOpened={deleteGroup}
                onAction={(action: any) => {
                    if (action) {
                        onDeleteGroup();
                    }
                    setDeleteGroup(false);
                }}
            >
                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                <p style={{ margin: '10px 0px 17px' }}>
                    {getTranslation('Are you sure you want to delete the group access?')}
                </p>
            </ModalConfirm>
            <Wrapper
                flexBox
                justifyContent={`${group ? 'space-between' : 'flex-end'}`}
                alignItems='center'
                margin='0 10px 15px 10px'
                maxWidth='1040px'
            >
                {group && (
                    <Button
                        className='antd-span-default-color'
                        type='primary'
                        danger
                        onClick={(event: any) => {
                            event.stopPropagation();
                            setDeleteGroup(true);
                        }}
                    >
                        {getTranslation('Delete')}
                    </Button>
                )}

                <Wrapper flexBox justifyContent='flex-end' alignItems='center'>
                    <Button
                        className='antd-span-default-color'
                        type='link'
                        onClick={() => {
                            setCurrentComponent(ComponentManagerEnum.LIST);
                            cancelEdit(formik.values);
                        }}
                    >
                        {getTranslation('Cancel')}
                    </Button>

                    <Button className='antd-span-default-color' type='primary' onClick={() => formik.handleSubmit()}>
                        {getTranslation('Save')}
                    </Button>
                </Wrapper>
            </Wrapper>
            <Spin spinning={editing ? loadingRequest : false}>
                <Component
                    formik={formik}
                    userList={userList}
                    group={{ ...currentGroup }}
                    onChange={(value) => setCurrentGroup(value)}
                    submitted={submitted}
                />
            </Spin>
        </form>
    );
};

export default i18n(EditGroupAccess) as FC<EditGroupAccessProps>;
