import { EditOutlined } from '@ant-design/icons';
import { Alert, Form, Modal } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isUserAgent } from '../../../../../../utils/UserPermission';
import { useLanguageContext } from '../../../../../i18n/context';
import { useUpdateCategorization } from '../../../ClosingMessageModal/closing-modal-with-categorization/hooks/use-update-categorization';
import { useConversationCategorizations } from '../../../ClosingMessageModal/closing-modal-with-reason/hooks/use-conversation-categorizations';
import CardWrapper from '../CardWrapper';
import { CategorizationUpdater } from '../CategorizationUpdater';
import { Label } from '../Common/common';
import { ConversationCategorizationProps, FinishConversationFormValues } from './interfaces';

export const ConversationCategorization = ({
    workspaceId,
    conversation,
    onUpdatedConversationSelected,
}: ConversationCategorizationProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const { getTranslation } = useLanguageContext();
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const cantUserAgent = isUserAgent(loggedUser, workspaceId);
    const [form] = Form.useForm<FinishConversationFormValues>();

    const { conversationCategorizations, fetchConversationCategorizations } =
        useConversationCategorizations(workspaceId);
    const { updateCategorization, isUpdatingCategorization, updatedCategorization } = useUpdateCategorization();

    const selectedCategorization = useMemo(() => {
        return conversationCategorizations?.find((item) => item.conversationId === conversation._id);
    }, [conversation._id, conversationCategorizations]);

    const handleFinishConversation = async (values: FinishConversationFormValues) => {
        if (!workspaceId || !loggedUser) return;

        const isCategorizationSuccessful = await updateCategorization({
            conversationId: conversation._id,
            objectiveId: values.objectiveId,
            outcomeId: values.outcomeId,
            userId: loggedUser._id,
        });
        if (isCategorizationSuccessful) {
            await fetchConversationCategorizations();
            onUpdatedConversationSelected?.({ _id: conversation._id, state: 'closed' });
            setModalOpen(false);
        }
    };

    useEffect(() => {
        fetchConversationCategorizations();
    }, [conversation._id, fetchConversationCategorizations]);

    useEffect(() => {
        if (updatedCategorization?.data) {
            form.setFieldsValue({
                objectiveId: updatedCategorization.data.objectiveId,
                outcomeId: updatedCategorization.data.outcomeId,
            });
        }
    }, [updatedCategorization, form]);

    return (
        <>
            <CardWrapper>
                <Label title={getTranslation('Categorization')}>
                    {`${getTranslation('Categorization')}: `}
                    <EditOutlined
                        style={{ marginLeft: 8, cursor: 'pointer' }}
                        onClick={async () => {
                            setModalOpen(true);
                            form.setFieldsValue({
                                objectiveId: selectedCategorization?.objectiveId,
                                outcomeId: selectedCategorization?.outcomeId,
                            });
                        }}
                    />
                </Label>
            </CardWrapper>
            <Modal
                title={getTranslation('Update categorization')}
                bodyStyle={{ overflowY: 'auto' }}
                open={modalOpen}
                centered
                maskClosable={false}
                keyboard={false}
                onCancel={() => !isUpdatingCategorization && setModalOpen(false)}
                footer={
                    !cantUserAgent ? (
                        <CategorizationUpdater.Footer
                            isFinishing={isUpdatingCategorization}
                            handleClose={() => !isUpdatingCategorization && setModalOpen(false)}
                            getTranslation={getTranslation}
                        />
                    ) : null
                }
            >
                {!selectedCategorization && (
                    <Alert
                        type='warning'
                        description={getTranslation('This conversation has not been categorized.')}
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Form
                    form={form}
                    onFinish={handleFinishConversation}
                    layout='vertical'
                    id='finish-categorization-form'
                    initialValues={{
                        objectiveId: selectedCategorization?.objectiveId || updatedCategorization?.data?.objectiveId,
                        outcomeId: selectedCategorization?.outcomeId || updatedCategorization?.data?.outcomeId,
                    }}
                >
                    <CategorizationUpdater />
                </Form>
            </Modal>
        </>
    );
};
