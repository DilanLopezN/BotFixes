import { FC, useState, useEffect } from 'react';
import { Wrapper, Card } from '../../../../../../ui-kissbot-v2/common';
import { EditTagProps } from './props';
import { Formik, Form } from 'formik';
import { FieldCustomFormik } from '../../../../../../shared/StyledForms/FieldCustomFormik';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import * as Yup from 'yup';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import InputColor from '../../../../../../shared/StyledForms/InputColor';
import Toggle from '../../../../../../shared/Toggle/Toggle';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import { Spin, Button } from 'antd';
import { ModalPosition } from '../../../../../../shared/ModalPortal/ModalPortalProps';

const EditTag: FC<EditTagProps & I18nProps> = ({
    tag,
    workspaceId,
    getTranslation,
    addNotification,
    onCancel,
    loggedUser,
    onDeletedTag,
    loadingRequest,
    editing,
}) => {
    const emptyTag = {
        _id: '',
        name: '',
        color: '#df8543',
        inactive: false,
        workspaceId: workspaceId,
    };
    const [currentTag, setCurrentTag] = useState<Tag>(tag || emptyTag);
    const [withError, setWithError] = useState<any>(undefined);
    const [submitted, setSubmitted] = useState(false);
    const [deleteTag, setDeleteTag] = useState<boolean>(false);
    const [modalChangeOpen, setModalChangeOpen] = useState(false);
    const [isFormChanged, setIsFormChanged] = useState(false);

    useEffect(() => {
        if (tag) {
            setCurrentTag(tag);
        }
    }, [tag]);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            name: Yup.string().required('This field is required'),
            color: Yup.string().required('This field is required'),
        });
    };

    const updateTag = async (tag: Tag) => {
        if (!tag) {
            return;
        }

        const updatedTag = await WorkspaceService.updateTagWorkspace(workspaceId, tag, (err: any) => {
            setWithError(err);
        });

        setSubmitted(false);
        if (!withError && updatedTag) {
            setCurrentTag(updatedTag);
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Tag updated successfully'),
            });
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const createTag = async (tag: Tag) => {
        if (!tag) {
            return;
        }

        const createdTag = await WorkspaceService.createTagWorkspace(workspaceId, tag, (err: any) => {
            setWithError(err);
        });

        setSubmitted(false);
        if (!withError && createdTag) {
            setCurrentTag(createdTag);
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Tag successfully created'),
            });
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const save = (updatedTag: Tag) => {
        if (tag?._id || currentTag._id) {
            return updateTag(updatedTag);
        }

        createTag(updatedTag);
    };

    const adminLogged = () => {
        const logged = loggedUser.roles?.filter((e) => {
            return e.role === 'SYSTEM_ADMIN';
        });
        if (logged !== undefined && logged.length > 0) {
            return true;
        }
    };

    const onDeleteTag = async () => {
        if (!currentTag._id || !workspaceId) {
            return;
        }

        await WorkspaceService.deleteTagWorkspace(workspaceId, currentTag._id, (err: any) => {
            setWithError(err);
        });

        if (!withError) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onDeletedTag(currentTag._id);
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

        if (!tag?._id) {
            return onCancel();
        }

        if (!isFormChanged) {
            onCancel();
        } else {
            setCurrentTag(values);
            setModalChangeOpen(true);
        }
    };

    return (
        <Wrapper>
            <Formik
                enableReinitialize
                initialValues={{ ...(currentTag as Tag) }}
                validationSchema={getValidationSchema()}
                onSubmit={() => {}}
                render={({ values, setFieldValue, touched, errors, validateForm, submitForm, resetForm, dirty }) => {
                    const submit = () => {
                        setSubmitted(true);
                        validateForm().then((validatedValues: any) => {
                            if (validatedValues.isCanceled) {
                                return submit();
                            }
                            submitForm();

                            if (Object.keys(validatedValues).length === 0) {
                                save(values as Tag);

                                if (!withError) {
                                    resetForm();
                                }
                            }
                        });
                        setIsFormChanged(false);
                    };

                    return (
                        <>
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
                                isOpened={deleteTag}
                                onAction={(action: any) => {
                                    if (action) {
                                        onDeleteTag();
                                    }
                                    setDeleteTag(false);
                                }}
                            >
                                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                                <p style={{ margin: '10px 0px 17px' }}>
                                    {getTranslation('Are you sure you want to delete the tag?')}
                                </p>
                            </ModalConfirm>
                            <Form
                                onChange={() => setIsFormChanged(true)}
                                style={{
                                    margin: '0 10px 5px',
                                }}
                            >
                                <Wrapper
                                    flexBox
                                    justifyContent={`${tag ? 'space-between' : 'flex-end'}`}
                                    alignItems='center'
                                    margin='0 0 15px 0'
                                    maxWidth='1040px'
                                >
                                    {tag && (
                                        <Button
                                            className='antd-span-default-color'
                                            type='primary'
                                            danger
                                            onClick={(event: any) => {
                                                event.stopPropagation();
                                                setDeleteTag(true);
                                            }}
                                        >
                                            {getTranslation('Delete')}
                                        </Button>
                                    )}

                                    <Wrapper flexBox justifyContent='flex-end' alignItems='center'>
                                        <Button
                                            type='link'
                                            className='antd-span-default-color'
                                            onClick={() => cancelEdit(values)}
                                        >
                                            {getTranslation('Cancel')}
                                        </Button>
                                        <Button
                                            disabled={submitted}
                                            className='antd-span-default-color'
                                            type='primary'
                                            onClick={submit}
                                        >
                                            {getTranslation('Save')}
                                        </Button>
                                    </Wrapper>
                                </Wrapper>
                                <Spin spinning={editing ? loadingRequest : false}>
                                    <Card header={getTranslation('Tag')}>
                                        <Wrapper margin='0 0 5px 0' width='100%' flexBox>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: submitted,
                                                    fieldName: `name`,
                                                }}
                                                label={getTranslation('Name')}
                                            >
                                                <Wrapper flexBox>
                                                    <FieldCustomFormik
                                                        className='form-control form-control-sm'
                                                        name='name'
                                                        autoFocus
                                                        tabIndex='50'
                                                        placeholder={getTranslation('Name')}
                                                        style={{ width: '100%' }}
                                                        onChange={(ev: any) => {
                                                            values.name = ev.target.value;
                                                            setFieldValue('name', ev.target.value);
                                                        }}
                                                        disabled={tag ? (adminLogged() ? false : true) : false}
                                                    />
                                                </Wrapper>
                                            </LabelWrapper>
                                        </Wrapper>

                                        <Wrapper width='20%'>
                                            <LabelWrapper
                                                validate={{
                                                    touched,
                                                    errors,
                                                    isSubmitted: true,
                                                    fieldName: `color`,
                                                }}
                                                label={getTranslation('Color')}
                                            >
                                                <div>
                                                    <InputColor
                                                        name={`color`}
                                                        value={values.color}
                                                        onChange={(color) => {
                                                            const colorful = `#${color}`;
                                                            setFieldValue(`color`, colorful);
                                                            setIsFormChanged(true);
                                                        }}
                                                    />
                                                </div>
                                            </LabelWrapper>
                                        </Wrapper>
                                        <LabelWrapper
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'inactive',
                                                isSubmitted: true,
                                            }}
                                        >
                                            <Toggle
                                                tabIndex='52'
                                                checked={!values.inactive}
                                                onChange={() => {
                                                    setFieldValue('inactive', !values.inactive);
                                                }}
                                                label={getTranslation('Active')}
                                            />
                                        </LabelWrapper>
                                    </Card>
                                </Spin>
                            </Form>
                        </>
                    );
                }}
            />
        </Wrapper>
    );
};

export default i18n(EditTag) as FC<EditTagProps>;
