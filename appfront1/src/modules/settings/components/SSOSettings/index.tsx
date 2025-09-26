import { FC } from 'react';
import { Card, Wrapper } from '../../../../ui-kissbot-v2/common';
import Header from '../../../newChannelConfig/components/Header';
import { SSOSettingsProps } from './props';
import I18n from '../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { useFormik } from 'formik-latest';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import { SimpleSelect } from '../../../../shared/SimpleSelect/SimpleSelect';
import { SSONameInterface, Workspace } from '../../../../model/Workspace';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { Button } from 'antd';

const emptySSO = {
    ssoId: '',
    ssoName: '',
};

const ssoNames = {
    dasa: 'dasa' as SSONameInterface.dasa,
    bot: 'bot' as SSONameInterface.bot,
};

const SSOSettings: FC<SSOSettingsProps> = (props) => {
    const { menuSelected, selectedWorkspace, getTranslation, addNotification, setSelectedWorkspace } = props;

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            ssoId: Yup.string().required(getTranslation('This field is required')),
            ssoName: Yup.string().required(getTranslation('This field is required')),
        });
    };

    const formik = useFormik({
        validationSchema: getValidationSchema(),
        initialValues: { ...(selectedWorkspace?.sso || emptySSO) },
        onSubmit: () => {
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    const workspaceEdited: Workspace = { ...selectedWorkspace, sso: formik.values };
                    updateWorkspace(workspaceEdited);
                }
            });
        },
    });

    const updateWorkspace = async (workspace: Workspace) => {
        let error: any;
        const response = await WorkspaceService.updateWorkspace(
            selectedWorkspace._id,
            workspace,
            (err) => (error = err)
        );

        if (!error) {
            setSelectedWorkspace(response);
            return addNotification({
                title: getTranslation('Success'),
                message: getTranslation('Saved successfully'),
                type: 'success',
                duration: 3000,
            });
        }
        return addNotification({
            title: getTranslation('Error'),
            message: getTranslation('Error. Try again'),
            type: 'warning',
            duration: 3000,
        });
    };

    return (
        <>
            <Wrapper>
                <Header title={menuSelected.title}></Header>
            </Wrapper>
            <Wrapper margin='0 auto' maxWidth='660px' padding={'20px 30px'}>
                {selectedWorkspace && (
                    <>
                        <Wrapper flexBox justifyContent='flex-end' alignItems='center' margin='0 0 15px 0'>
                            <Button onClick={formik.submitForm} className='antd-span-default-color' type='primary'>
                                {getTranslation('Save')}
                            </Button>
                        </Wrapper>
                        <Card
                            styleHeader={{
                                height: '45px',
                                bgColor: '#f2f2f2',
                                padding: '10px',
                                color: '#555',
                                fontSize: 'large',
                                fontWeight: 'normal',
                                textTransform: 'normal',
                            }}
                            header={getTranslation('SSO')}
                        >
                            <form>
                                <Wrapper>
                                    <LabelWrapper
                                        validate={{
                                            touched: formik.touched,
                                            errors: formik.errors,
                                            isSubmitted: formik.isSubmitting,
                                            fieldName: `ssoId`,
                                        }}
                                        label={getTranslation('SSO ID')}
                                    >
                                        <InputSimple
                                            autoFocus
                                            value={formik.values.ssoId}
                                            placeholder='ID'
                                            onChange={(event) => {
                                                formik.setFieldValue('ssoId', event.target.value);
                                            }}
                                        />
                                    </LabelWrapper>
                                    <LabelWrapper
                                        validate={{
                                            touched: formik.touched,
                                            errors: formik.errors,
                                            isSubmitted: formik.isSubmitting,
                                            fieldName: `ssoName`,
                                        }}
                                        label={getTranslation('SSO Name')}
                                    >
                                        <SimpleSelect
                                            onChange={(event) => {
                                                event.preventDefault();
                                                formik.setFieldValue('ssoName', event.target.value);
                                            }}
                                            value={formik.values.ssoName}
                                        >
                                            <option value={''}>{getTranslation('Select option')}</option>
                                            {Object.keys(ssoNames).map((name) => {
                                                return (
                                                    <option value={name} key={name}>
                                                        {name}
                                                    </option>
                                                );
                                            })}
                                        </SimpleSelect>
                                    </LabelWrapper>
                                </Wrapper>
                            </form>
                        </Card>
                    </>
                )}
            </Wrapper>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default I18n(
    withRouter(
        connect(mapStateToProps, {
            setSelectedWorkspace: WorkspaceActions.setSelectedWorkspace,
        })(SSOSettings)
    )
);
