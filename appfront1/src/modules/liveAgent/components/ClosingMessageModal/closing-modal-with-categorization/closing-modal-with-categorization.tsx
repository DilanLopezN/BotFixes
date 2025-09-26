import { Form, Modal } from 'antd';
import { useState } from 'react';
import { Constants } from '../../../../../utils/Constants';
import I18n from '../../../../i18n/components/i18n';
import { useDeactivateReengagement } from '../../../hooks/use-deactivate-reengagement';
import { TemplateMessage } from '../../TemplateMessageList/interface';
import { ClosingConversationSteps } from '../constants';
import type { DefaultClosingMessageModalComponentProps } from '../interfaces';
import { CategorizationStep } from './categorization-step';
import { useCreateCategorization } from './hooks/use-create-categorization';
import type { FinishConversationFormValues } from './interfaces';
import { MessageStep } from './message-step';
import { TemplateVariablesStep } from './template-variables-step';

const ClosingModalWithCategorizationComponent = ({
    opened,
    setOpened,
    getTranslation,
    workspaceId,
    loggedUser,
    conversation,
    channels,
    onUpdatedConversationSelected,
    teams,
}: DefaultClosingMessageModalComponentProps) => {
    const [form] = Form.useForm<FinishConversationFormValues>();
    const [generateMessageForm] = Form.useForm<FinishConversationFormValues>();
    const [isDescriptionEnabled, setIsDescriptionEnabled] = useState(false);
    const { createCategorization, isCreatingCategorization } = useCreateCategorization(getTranslation);
    const [currentStep, setCurrentStep] = useState(ClosingConversationSteps.Message);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateMessage>();
    const { deactivateReengagement } = useDeactivateReengagement();

    const handleCloseModal = () => {
        if (isCreatingCategorization) return;
        setOpened(false);
        generateMessageForm.resetFields();
    };

    const handleValuesChange = () => {
        const objectiveId = form.getFieldValue('objectiveId');
        const outcomeId = form.getFieldValue('outcomeId');

        if (objectiveId && outcomeId) {
            form.setFields([
                { name: 'objectiveId', errors: [] },
                { name: 'outcomeId', errors: [] },
            ]);
        }

        setIsDescriptionEnabled(!!objectiveId && !!outcomeId);
    };

    const handleGenerateMessage = async (variables: any) => {
        const generatedMessage = Object.keys(variables).reduce((message, variableKey) => {
            if (!message) return '';

            const regex = new RegExp(`{{${variableKey}}}`, 'g');
            return message.replace(regex, variables[variableKey]);
        }, selectedTemplate?.message);

        form.setFieldsValue({ message: generatedMessage });
        generateMessageForm.resetFields();
        setCurrentStep(ClosingConversationSteps.Categorization);
    };

    const handleFinishConversation = async (values: FinishConversationFormValues) => {
        if (!workspaceId || !loggedUser || isCreatingCategorization) return;

        const message = values.message;

        if (message) {
            localStorage.setItem(Constants.LOCAL_STORAGE_MAP.END_CONVERSATION_TEXT, message);
        }
        if (values.objectiveId && !values.outcomeId) {
            return form.setFields([
                {
                    name: 'outcomeId',
                    errors: [getTranslation('The outcome is required when the objective is filled out!')],
                },
            ]);
        }

        if (!values.objectiveId && values.outcomeId) {
            return form.setFields([
                {
                    name: 'objectiveId',
                    errors: [getTranslation('The objective is required when the outcome is filled in!')],
                },
            ]);
        }

        const result = await createCategorization({
            conversationId: conversation._id,
            objectiveId: values.objectiveId,
            outcomeId: values.outcomeId,
            userId: loggedUser._id,
            conversationTags: values.conversationTags,
            description: values.description,
            message: values.message,
        });

        if (result) {
            if (conversation?.smtReId) {
                await deactivateReengagement(conversation._id, conversation.smtReId);
            }

            setOpened(false);
        }
    };

    const getModalHeight = () => {
        if (currentStep === ClosingConversationSteps.Message) {
            return 344;
        }

        return 0;
    };

    const renderFooter = () => {
        if (currentStep === ClosingConversationSteps.Message) {
            return (
                <MessageStep.Footer
                    handleOk={() => {
                        setCurrentStep(ClosingConversationSteps.Categorization);
                    }}
                    handleClose={handleCloseModal}
                    getTranslation={getTranslation}
                />
            );
        }

        if (currentStep === ClosingConversationSteps.TemplateVariables) {
            return (
                <TemplateVariablesStep.Footer
                    handleClose={() => {
                        setCurrentStep(ClosingConversationSteps.Message);
                        generateMessageForm.resetFields();
                    }}
                    getTranslation={getTranslation}
                />
            );
        }

        return (
            <CategorizationStep.Footer
                isFinishing={isCreatingCategorization}
                handleClose={() => {
                    setCurrentStep(ClosingConversationSteps.Message);
                }}
                getTranslation={getTranslation}
            />
        );
    };

    return (
        <Modal
            title={getTranslation('End attendance')}
            style={{ maxWidth: '490px', marginBottom: getModalHeight() }}
            bodyStyle={{ overflow: 'hidden', overflowY: 'auto', maxHeight: '70vh' }}
            open={opened}
            maskClosable={false}
            keyboard={false}
            onCancel={handleCloseModal}
            footer={renderFooter()}
        >
            <Form
                form={form}
                onFinish={handleFinishConversation}
                onValuesChange={handleValuesChange}
                layout='vertical'
                id='finish-message-form'
            >
                <div style={currentStep === ClosingConversationSteps.Message ? undefined : { display: 'none' }}>
                    <MessageStep
                        form={form}
                        conversation={conversation}
                        channels={channels}
                        selectedTemplate={selectedTemplate}
                        setCurrentStep={setCurrentStep}
                        setSelectedTemplate={setSelectedTemplate}
                    />
                </div>
                <div style={currentStep === ClosingConversationSteps.Categorization ? undefined : { display: 'none' }}>
                    <CategorizationStep
                        conversation={conversation}
                        teams={teams}
                        isDescriptionEnabled={isDescriptionEnabled}
                    />
                </div>
            </Form>
            <Form
                form={generateMessageForm}
                layout='vertical'
                id='generate-message-form'
                onFinish={handleGenerateMessage}
            >
                <div
                    style={currentStep === ClosingConversationSteps.TemplateVariables ? undefined : { display: 'none' }}
                >
                    <TemplateVariablesStep conversation={conversation} selectedTemplate={selectedTemplate} />
                </div>
            </Form>
        </Modal>
    );
};

export const ClosingModalWithCategorization = I18n(ClosingModalWithCategorizationComponent);
