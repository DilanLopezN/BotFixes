import { FC, useState } from 'react';
import './BotCreateButton.scss';
import { WorkspaceService } from '../../services/WorkspaceService';
import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import I18n from '../../../i18n/components/i18n';
import { withRouter } from 'react-router';
import BlockUi from '../../../../shared-v2/BlockUi/BlockUi';
import { connect } from 'react-redux';
import { Button, Dropdown, Input } from 'antd';
import styled from 'styled-components';
import { ModalCloneBot } from '../modalCloneBot';
import { BotCreateButtonProps } from './BotCreateButtonProps';
import { addNotification } from '../../../../utils/AddNotification';

const ButtonSelect = styled(Dropdown.Button)``;

const BotCreateButton: FC<BotCreateButtonProps> = (props) => {
    const { getTranslation, onCreate, selectedWorkspace, workspaceId, history, className, setNameBotFromWorkspace } =
        props;

    const [isOpenedForm, setIsOpenedForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpenedModal, setIsOpenedModal] = useState(false);

    const validationSchema = Yup.object().shape({
        name: Yup.string().required(getTranslation('This field is required')),
    });

    const botCreateForm = () => {
        return (
            <Formik
                initialValues={{ name: '' }}
                onSubmit={(values) => {
                    onSubmit(values);
                }}
                validationSchema={validationSchema}
                render={({ submitCount, values, touched, errors, submitForm, setFieldValue }) => {
                    return (
                        <Form className='bot-create-form'>
                            <LabelWrapper
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: 'name',
                                    isSubmitted: submitCount > 1,
                                }}
                            >
                                <Input
                                    className='form-control form-control-sm'
                                    type='text'
                                    name='name'
                                    onChange={(e) => setFieldValue('name', e.target.value)}
                                    placeholder={getTranslation('Bot name')}
                                    autoFocus
                                    size='small'
                                    value={values.name}
                                />
                            </LabelWrapper>
                            <Button type='primary' className='antd-span-default-color' onClick={submitForm}>
                                {getTranslation('Create bot')}
                            </Button>
                        </Form>
                    );
                }}
            />
        );
    };

    const onSubmit = async (values) => {
        if (!selectedWorkspace?.dialogFlowAccount) {
            addNotification({
                type: 'warning',
                title: getTranslation('Error'),
                message: getTranslation(
                    'It is not possible to create a bot in this workspace because there is no DialogFlow account.'
                ),
                duration: 3000,
            });
            setIsSubmitting(false);
            setIsOpenedForm(false);
            return;
        }

        setIsSubmitting(true);
        values.workspaceId = workspaceId;
        const botCreated = await WorkspaceService.createBot(values, workspaceId);

        if (botCreated) {
            history.push(`/workspace/${botCreated.workspaceId}/bot/${botCreated._id}`);
            setIsSubmitting(false);
            setIsOpenedForm(false);
            onCreate();
        }
        setIsSubmitting(false);
        setIsOpenedForm(false);
    };

    const disableCreateBot = !selectedWorkspace?.dialogFlowAccount;

    const cardClass = 'BotCreateButton ' + className;

    const items = [
        {
            key: '1',
            label: getTranslation('Clone bot'),
            onClick: () => {
                setIsOpenedModal(true);
            },
        },
    ];
    const closeModal = (botName?: string) => {
        if (botName) {
            setNameBotFromWorkspace(botName);
        }
        setIsOpenedModal(false);
    };

    return (
        <BlockUi blocking={isSubmitting}>
            <ModalCloneBot
                workspaceId={workspaceId}
                getTranslation={getTranslation}
                onClose={closeModal}
                visible={isOpenedModal}
            />
            <div className={cardClass}>
                {isOpenedForm ? (
                    botCreateForm()
                ) : (
                    <ButtonSelect
                        className='antd-span-default-color'
                        type='primary'
                        onClick={() => setIsOpenedForm(true)}
                        style={{ marginRight: '10px' }}
                        disabled={disableCreateBot}
                        menu={{ items }}
                    >
                        {getTranslation('New bot')}
                    </ButtonSelect>
                )}
            </div>
        </BlockUi>
    );
};

const mapStateToProps = (state, ownProps) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default I18n(withRouter(connect(mapStateToProps, null)(BotCreateButton)));
