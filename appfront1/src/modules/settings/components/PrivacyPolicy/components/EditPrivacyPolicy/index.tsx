import { EditPrivacyPolicyProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { FC, useEffect, useState } from 'react';
import { useHistory, useParams, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Header from '../../../../../../shared-v2/Header/Header';
import CardWrapperForm from '../../../../../../shared-v2/CardWrapperForm/CardWrapperForm';
import {
    CreatePrivacyPolicy,
    PrivacyPolicyInterface,
    UpdatePrivacyPolicy,
} from '../../../../interfaces/privacy-policy';
import { ChannelConfig } from '../../../../../../model/Bot';
import { PrivacyPolicyService } from '../../../../service/PrivacyPolicyService';
import { FormikProps, useFormik } from 'formik-latest';
import * as Yup from 'yup';
import { addNotification } from '../../../../../../utils/AddNotification';
import { ScrollView } from '../../../ScrollView';
import { Alert, Button, Col, Input, Menu, Modal, Row, Select } from 'antd';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import TextArea from 'antd/lib/input/TextArea';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import ActivityPreview from '../../../../../../shared-v2/ActivityPreview/ActivityPreview';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';
import { TemplateButtonType } from '../../../../../liveAgent/components/TemplateMessageList/interface';

const EditPrivacyPolicy: FC<EditPrivacyPolicyProps & I18nProps> = (props) => {
    const { getTranslation, selectedWorkspace, channelConfigList } = props;
    const history = useHistory();
    const params: any = useParams();

    const defaultPrivacyPolicy: PrivacyPolicyInterface = {
        channelConfigIds: [],
        text: '',
        workspaceId: selectedWorkspace._id,
        createdAt: new Date(),
        createdBy: '',
    };

    const [loading, setLoading] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [channels, setChannels] = useState<ChannelConfig[]>(channelConfigList || []);
    const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicyInterface>(defaultPrivacyPolicy);

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            text: Yup.string()
                .required(getTranslation('This field is required'))
                .max(1000, getTranslation('Character max length is 1000')),
            channelConfigIds: Yup.array()
                .required(getTranslation('This field is required'))
                .min(1, getTranslation('Channel is required'))
                .of(Yup.string().required()),
        });
    };

    const formik: FormikProps<PrivacyPolicyInterface> = useFormik({
        enableReinitialize: true,
        initialValues: privacyPolicy,
        validationSchema: getValidationSchema(),
        onSubmit: (values) => savePrivacyPolicy(values),
    });

    const getPrivacyPolicy = async (privacyPolicyId: number) => {
        setLoading(true);
        const response = await PrivacyPolicyService.getPrivacyPolicy(selectedWorkspace._id, privacyPolicyId);
        if (response) {
            setPrivacyPolicy(response);
        }
        setTimeout(() => setLoading(false), 300);
    };

    const getChannelConfigs = async () => {
        const filter = {
            workspaceId: selectedWorkspace._id,
            enable: true,
        };

        const data = await ChannelConfigService.getChannelsConfig(filter);
        return setChannels(data);
    };

    useEffect(() => {
        const privacyPolicyId = params?.privacyPolicyId;
        if (privacyPolicyId) {
            getPrivacyPolicy(Number(privacyPolicyId));
        }
        if (!channelConfigList?.length) {
            getChannelConfigs();
        }
    }, []);

    const onCancel = () => {
        history.push(`/settings/privacy-policy`);
    };

    const createPrivacyPolicy = async (data: CreatePrivacyPolicy) => {
        setLoadingSubmit(true);
        setLoading(true);
        let error: any;

        const result = await PrivacyPolicyService.createPrivacyPolicy(selectedWorkspace._id, data, (err) => {
            error = err;
        });

        setLoading(false);
        setLoadingSubmit(false);

        if (result && !error) {
            addNotification({
                type: 'success',
                title: getTranslation('Success'),
                message: getTranslation('Privacy policy created successfully'),
                duration: 3000,
            });

            return formik.setValues({ ...formik.values, id: result.id });
        } else if (error.statusCode === 400 && error.error === 'ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY') {
            addNotification({
                type: 'danger',
                duration: 5000,
                title: getTranslation('Error'),
                message: getTranslation(
                    'It was not possible to save, as it has channels that are already being used in another privacy policy.'
                ),
            });
        } else {
            addNotification({
                type: 'danger',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Try again'),
            });
        }
    };

    const updatePrivacyPolicy = async (data: UpdatePrivacyPolicy) => {
        setLoadingSubmit(true);
        setLoading(true);
        let error: any;

        const result = await PrivacyPolicyService.updatePrivacyPolicy(selectedWorkspace._id, data, (err) => {
            error = err;
        });

        setLoading(false);
        setLoadingSubmit(false);

        if (result && !error) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Privacy policy updated successfully'),
            });
        } else if (error.statusCode === 400 && error.error === 'ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY') {
            addNotification({
                type: 'danger',
                duration: 5000,
                title: getTranslation('Error'),
                message: getTranslation(
                    'It was not possible to save, as it has channels that are already being used in another privacy policy.'
                ),
            });
        } else {
            addNotification({
                type: 'danger',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Try again'),
            });
        }
    };

    const restartPrivacyPolicyAcceptance = async () => {
        setLoadingSubmit(true);
        setLoading(true);
        let error: any;

        if (!formik.values.id) {
            return;
        }

        const result = await PrivacyPolicyService.restartPrivacyPolicyAcceptance(
            selectedWorkspace._id,
            formik.values.id as number,
            (err) => {
                error = err;
            }
        );

        setLoading(false);
        setLoadingSubmit(false);

        if (result && !error) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Privacy policy updated successfully'),
            });
        } else {
            addNotification({
                type: 'danger',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('Try again'),
            });
        }
    };

    const onDeletePrivacyPolicy = async () => {
        const { values } = formik;
        if (!values.id || !selectedWorkspace._id) {
            return;
        }
        let error: any;

        await PrivacyPolicyService.deletePrivacyPolicy(selectedWorkspace._id, values.id, (err) => {
            error = err;
        });

        if (!error) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Success'),
                message: getTranslation('Successfully deleted'),
            });

            return onCancel();
        } else {
            addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });
        }
    };

    const savePrivacyPolicy = async (values: PrivacyPolicyInterface) => {
        if (!values.id) {
            return createPrivacyPolicy(values);
        }
        return updatePrivacyPolicy(values as UpdatePrivacyPolicy);
    };

    const getChannelsOptions = () => {
        const options = (channels || []).map((channelConfig) => {
            return {
                label: channelConfig.name,
                value: channelConfig._id,
            };
        });

        return options;
    };

    const confirmModal = (type: 'delete' | 'updateAcepttance') => {
        const configs = {
            delete: {
                title: 'Confirm delete',
                message: 'Are you sure you want to delete this privacy policy?',
            },
            updateAcepttance: {
                title: 'Confirm new acceptance request',
                message:
                    'Are you sure you want to request acceptance of the privacy policy, this action will cause the privacy policy to be accepted again!',
            },
        };
        return Modal.confirm({
            title: <h5 style={{ textAlign: 'center' }}>{getTranslation(configs[type].title)}</h5>,
            content: <p style={{ margin: '10px 0px 17px' }}>{getTranslation(configs[type].message)}</p>,
            icon: false,
            okButtonProps: {
                className: 'antd-span-default-color',
            },
            cancelButtonProps: {
                className: 'antd-span-default-color',
            },
            cancelText: getTranslation('Cancel'),
            onOk() {
                if (type === 'delete') {
                    onDeletePrivacyPolicy();
                } else if (type === 'updateAcepttance') {
                    restartPrivacyPolicyAcceptance();
                }
            },
            onCancel() {},
        });
    };

    const menu = (
        <Menu onClick={() => {}}>
            <Menu.Item disabled={loading} onClick={() => confirmModal('updateAcepttance')}>
                {getTranslation('Request accept again')}
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <Header
                title={`${getTranslation(formik.values.id ? 'Edit' : 'Register')} ${getTranslation(
                    'Privacy policy'
                ).toLowerCase()}`}
                buttonBack={{ visible: true, onClick: onCancel }}
                buttonDelete={{
                    visible: !!formik.values.id,
                    onClick: () => {
                        return confirmModal('delete');
                    },
                }}
                buttonMenu={
                    !!formik.values.id
                        ? {
                              visible: true,
                              onClick: formik.submitForm,
                              loading: loadingSubmit || loading,
                              menu: menu,
                          }
                        : undefined
                }
                buttonSave={
                    !formik.values.id
                        ? { visible: true, onClick: formik.submitForm, loading: loadingSubmit }
                        : undefined
                }
            />
            <ScrollView minWidth='950px' id='content-privacy-policy-form'>
                <CardWrapperForm
                    title={getTranslation('Privacy policy')}
                    loading={loading}
                    linkHelpCenter='como-cadastrar-e-configurar-a-mensagem-de-política-de-privacidade'
                    textLinkHelpCenter={getTranslation('How to register your privacy policy')}
                    children={
                        <form>
                            {formik.values.id && formik.initialValues.text !== formik.values.text && (
                                <Alert
                                    style={{ marginBottom: '10px' }}
                                    message={getTranslation(
                                        'Changing the text of the privacy policy will result in a new request for acceptance by all again!'
                                    )}
                                    type='warning'
                                    showIcon
                                />
                            )}
                            <Row style={{ width: '100%' }}>
                                <Col flex={'1 1 200px'}>
                                    <LabelWrapper
                                        validate={{
                                            errors: formik.errors,
                                            fieldName: 'text',
                                            isSubmitted: formik.submitCount > 0,
                                            touched: true,
                                        }}
                                        label={getTranslation('Privacy policy text')}
                                    >
                                        <TextArea
                                            key='text'
                                            name='text'
                                            placeholder={getTranslation('Privacy policy text')}
                                            autoFocus
                                            showCount
                                            size='large'
                                            autoSize={{ minRows: 8, maxRows: 8 }}
                                            style={{ width: '100%' }}
                                            maxLength={1000}
                                            onChange={(event) => {
                                                formik.setFieldValue('text', event.target.value);
                                            }}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.text}
                                        />
                                    </LabelWrapper>
                                    <Row gutter={16} style={{ width: '101%' }}>
                                        <Col span={12}>
                                            <LabelWrapper
                                                validate={{
                                                    errors: formik.errors,
                                                    fieldName: 'acceptButtonText',
                                                    isSubmitted: formik.submitCount > 0,
                                                    touched: true,
                                                }}
                                                label={getTranslation('Accept button text')}
                                            >
                                                <Input
                                                    key='acceptButtonText'
                                                    name='acceptButtonText'
                                                    type='acceptButtonText'
                                                    placeholder={getTranslation('Accept')}
                                                    maxLength={20}
                                                    onChange={(event) => {
                                                        formik.setFieldValue('acceptButtonText', event.target.value);
                                                    }}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.acceptButtonText}
                                                />
                                            </LabelWrapper>
                                        </Col>
                                        <Col style={{ paddingRight: 3 }} span={12}>
                                            <LabelWrapper
                                                validate={{
                                                    errors: formik.errors,
                                                    fieldName: 'rejectButtonText',
                                                    isSubmitted: formik.submitCount > 0,
                                                    touched: true,
                                                }}
                                                label={getTranslation('Decline button text')}
                                            >
                                                <Input
                                                    key='rejectButtonText'
                                                    name='rejectButtonText'
                                                    type='rejectButtonText'
                                                    placeholder={getTranslation('Refuse')}
                                                    maxLength={20}
                                                    onChange={(event) => {
                                                        formik.setFieldValue('rejectButtonText', event.target.value);
                                                    }}
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.rejectButtonText}
                                                />
                                            </LabelWrapper>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col style={{ display: 'flex' }} flex={5}>
                                            <LabelWrapper
                                                validate={{
                                                    errors: formik.errors,
                                                    fieldName: 'channelConfigIds',
                                                    isSubmitted: formik.submitCount > 0,
                                                    touched: true,
                                                }}
                                                label={getTranslation('Shipping channels')}
                                            >
                                                <Select
                                                    key='channelConfigIds'
                                                    style={{ width: '100%' }}
                                                    placeholder={getTranslation('Select channels')}
                                                    onChange={(value) =>
                                                        formik.setFieldValue('channelConfigIds', value)
                                                    }
                                                    onBlur={formik.handleBlur}
                                                    value={formik.values.channelConfigIds}
                                                    mode='multiple'
                                                    maxTagCount={3}
                                                    maxTagTextLength={20}
                                                    allowClear
                                                    options={getChannelsOptions()}
                                                />
                                            </LabelWrapper>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col flex={'0 1 300px'}>
                                    <Wrapper
                                        style={{
                                            maxHeight: '362px',
                                            width: '400px',
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            marginLeft: '10px',
                                            marginTop: '30px',
                                        }}
                                    >
                                        <ActivityPreview
                                            message={formik.values.text}
                                            buttons={[
                                                { text: formik.values.acceptButtonText || getTranslation('Accept'), type: TemplateButtonType.QUICK_REPLY },
                                                { text: formik.values.rejectButtonText || getTranslation('Refuse'), type: TemplateButtonType.QUICK_REPLY },
                                            ]}
                                        />
                                    </Wrapper>
                                </Col>
                            </Row>
                        </form>
                    }
                />
            </ScrollView>
        </>
    );
};
const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});
export default i18n(withRouter(connect(mapStateToProps, null)(EditPrivacyPolicy))) as FC<EditPrivacyPolicyProps>;
