import { FC, useEffect } from 'react';
import { Card, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import Header from '../../../../../newChannelConfig/components/Header';
import { WorkspaceBillingProps } from './props';
import I18n from '../../../../../i18n/components/i18n';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { useFormik } from 'formik-latest';
import * as Yup from 'yup';
import { WorkspaceBilling, WorkspaceChannelSpecification } from './interface';
import { useState } from 'react';
import { CustomersService } from '../../../../../customers/service/BillingService';
import BillingSpecificationForm from '../BillingSpecificationForm';
import { defaultChannelSpecification, emptyWorkspaceBilling } from './utils/defaultVariables';
import orderBy from 'lodash/orderBy';
import { Button } from 'antd';
import { useSelector } from 'react-redux';
import { isSystemAdmin } from '../../../../../../utils/UserPermission';

const WorkspaceBillingSpecification: FC<WorkspaceBillingProps> = (props) => {
    const { menuSelected, selectedWorkspace, getTranslation, addNotification } = props;
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const notAdmin = !isSystemAdmin(loggedUser);
    const [workspaceBilling, setWorkspaceBilling] = useState<WorkspaceBilling | undefined>(undefined);
    const [channelSpecifications, setChannelSpecifications] = useState<WorkspaceChannelSpecification[]>(
        orderBy(defaultChannelSpecification(selectedWorkspace?._id), 'channelId')
    );
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (selectedWorkspace) {
            getWorkspaceBillingSpecification();
            getAccounts();
            return;
        }
        setWorkspaceBilling(undefined);
    }, [selectedWorkspace]);

    const getAccounts = async () => {
        const response = await CustomersService.getAccounts(true);

        if (!response) return;
        setAccounts(response);
    };

    const getWorkspaceBillingSpecification = async () => {
        const response = await CustomersService.getWorkspaceBillingSpecification(selectedWorkspace._id);

        if (!response) return;
        setWorkspaceBilling(response.workspace);
        if (response?.channelSpecifications?.length) {
            setChannelSpecifications(orderBy(response.channelSpecifications, 'channelId'));
        }
    };

    const getValidationSchema = (): Yup.ObjectSchema => {
        return Yup.object().shape({
            name: Yup.string().required(getTranslation('This field is required')),
            accountId: Yup.number().min(1).required(getTranslation('This field is required')),
            dueDate: Yup.number().required(getTranslation('This field is required')),
        });
    };

    const formik = useFormik({
        enableReinitialize: workspaceBilling ? true : false,
        validationSchema: getValidationSchema(),
        initialValues: workspaceBilling || emptyWorkspaceBilling(selectedWorkspace._id, selectedWorkspace.name),
        onSubmit: () => {
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    if (!workspaceBilling) {
                        return createWorkspaceBillingSpecification(formik.values);
                    }
                    updateWorkspaceBillingSpecification(formik.values);
                }
            });
        },
    });

    const channelFormik = useFormik({
        enableReinitialize: true,
        initialValues: channelSpecifications,
        onSubmit: () => {},
    });

    const createWorkspaceBillingSpecification = async (workspaceBilling: WorkspaceBilling) => {
        const newWorkspaceBilling: WorkspaceBilling = {
            ...workspaceBilling,
            accountId: Number(workspaceBilling.accountId),
            dueDate: Number(workspaceBilling?.dueDate),
            planPrice: Number(workspaceBilling?.planPrice),
            planUserLimit: Number(workspaceBilling?.planUserLimit),
            planMessageLimit: Number(workspaceBilling?.planMessageLimit),
            planHsmMessageLimit: Number(workspaceBilling?.planHsmMessageLimit),
            planExceededMessagePrice: Number(workspaceBilling?.planExceededMessagePrice),
            planHsmExceedMessagePrice: Number(workspaceBilling?.planHsmExceedMessagePrice),
            planUserExceedPrice: Number(workspaceBilling?.planUserExceedPrice),
            startAt: Number(workspaceBilling?.startAt),
            planConversationExceedPrice: Number(workspaceBilling?.planConversationExceedPrice),
            planConversationLimit: Number(workspaceBilling?.planConversationLimit),
            active: workspaceBilling?.active,
            hasIntegration: workspaceBilling?.hasIntegration,
            segment: workspaceBilling?.segment,
            observations: workspaceBilling?.observations,
        };

        let error: any;
        await CustomersService.createWorkspaceBillingSpecification(
            newWorkspaceBilling,
            channelFormik.values,
            (err) => (error = err)
        );

        if (!error) {
            setWorkspaceBilling(newWorkspaceBilling);
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

    const updateWorkspaceBillingSpecification = async (workspaceBilling: WorkspaceBilling) => {
        const newWorkspaceBilling: WorkspaceBilling = {
            ...workspaceBilling,
            accountId: Number(workspaceBilling.accountId),
            dueDate: Number(workspaceBilling?.dueDate),
            planPrice: Number(workspaceBilling?.planPrice),
            planUserLimit: Number(workspaceBilling?.planUserLimit),
            planMessageLimit: Number(workspaceBilling?.planMessageLimit),
            planHsmMessageLimit: Number(workspaceBilling?.planHsmMessageLimit),
            planExceededMessagePrice: Number(workspaceBilling?.planExceededMessagePrice),
            planHsmExceedMessagePrice: Number(workspaceBilling?.planHsmExceedMessagePrice),
            planUserExceedPrice: Number(workspaceBilling?.planUserExceedPrice),
            startAt: Number(workspaceBilling?.startAt),
            planConversationExceedPrice: Number(workspaceBilling?.planConversationExceedPrice),
            planConversationLimit: Number(workspaceBilling?.planConversationLimit),
            active: workspaceBilling?.active,
            hasIntegration: workspaceBilling?.hasIntegration,
            segment: workspaceBilling?.segment,
            observations: workspaceBilling?.observations,
        };

        let error: any;
        await CustomersService.updateWorkspaceBillingSpecification(
            selectedWorkspace._id,
            newWorkspaceBilling,
            channelFormik.values,
            (err) => (error = err)
        );

        if (!error) {
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
            <Wrapper overflowY='auto' height='calc(100vh - 70px)' padding={'20px 30px'}>
                {selectedWorkspace && (
                    <Wrapper maxWidth='1100px' margin='0 auto'>
                        <Wrapper flexBox justifyContent='flex-end' alignItems='center' margin='0 0 15px 0'>
                            <Button
                                disabled={notAdmin}
                                onClick={formik.submitForm}
                                className='antd-span-default-color'
                                type='primary'
                            >
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
                            header={getTranslation('Workspace billing specification')}
                        >
                            <form>
                                <BillingSpecificationForm
                                    formik={formik}
                                    accounts={accounts}
                                    channelFormik={channelFormik}
                                />
                            </form>
                        </Card>
                    </Wrapper>
                )}
            </Wrapper>
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default I18n(withRouter(connect(mapStateToProps, null)(WorkspaceBillingSpecification)));
