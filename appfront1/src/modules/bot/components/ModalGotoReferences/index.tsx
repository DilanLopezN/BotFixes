import { FC, useState } from 'react';
import { Modal, Button, Spin } from 'antd';
import { BotService } from '../../services/BotService';
import { addNotification } from '../../../../utils/AddNotification';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { MdDeleteOutline } from 'react-icons/md';

import { GotoReference } from '../../Interfaces/goto-references.interface';
import { InteractionInfo, InteractionName, NavigateIcon, ReferenceItem, ReferencesList } from './styled';

interface ModalGotoReferencesProps extends I18nProps {
    visible: boolean;
    interactionId: string;
    interactionName: string;
    references: GotoReference[];
    workspaceId: string;
    botId: string;
    onClose: () => void;
    onDeleteSuccess: () => void;
}

const ModalGotoReferencesComponent: FC<ModalGotoReferencesProps> = ({
    visible,
    interactionId,
    interactionName,
    references,
    workspaceId,
    botId,
    onClose,
    onDeleteSuccess,
    getTranslation,
}) => {
    const [loading, setLoading] = useState(false);
    const [deletedReferences, setDeletedReferences] = useState<string[]>([]);

    const handleDeleteWithReferences = async () => {
        setLoading(true);

        try {
            // Deletar todas as referências
            for (const reference of references) {
                if (!deletedReferences.includes(reference.details.interactionId)) {
                    await BotService.deleteInteraction(workspaceId, botId, reference.details.interactionId);
                    setDeletedReferences((prev) => [...prev, reference.details.interactionId]);
                }
            }

            // Tentar deletar a interaction novamente
            try {
                await BotService.deleteInteraction(workspaceId, botId, interactionId);

                // Sucesso
                addNotification({
                    message: getTranslation('Success'),
                    title: getTranslation('Interaction deleted successfully'),
                    type: 'success',
                    container: 'top-center',
                    insert: 'top',
                    duration: 3000,
                });
                onDeleteSuccess();
                onClose();
            } catch (error: any) {
                addNotification({
                    message: getTranslation('Error'),
                    title: getTranslation('Failed to delete interaction'),
                    type: 'danger',
                    container: 'top-center',
                    insert: 'top',
                    duration: 3000,
                });
            }
        } catch (error) {
            addNotification({
                message: getTranslation('Error'),
                title: getTranslation('An error occurred while deleting references'),
                type: 'danger',
                container: 'top-center',
                insert: 'top',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };
    const handleGoToInteraction = (refInteractionId: string) => {
        window.parent.postMessage(
            {
                type: 'show_info_interaction',
                interactionId: refInteractionId,
            },
            '*'
        );
        onClose();
    };

    return (
        <Modal
            title={getTranslation('Cannot delete interaction')}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key='cancel' onClick={onClose} disabled={loading}>
                    {getTranslation('Cancel')}
                </Button>,
                <Button
                    key='delete'
                    type='primary'
                    danger
                    loading={loading}
                    onClick={handleDeleteWithReferences}
                    icon={<MdDeleteOutline />}
                >
                    {getTranslation('Delete references and interaction')}
                </Button>,
            ]}
            width={700}
        >
            <Spin spinning={loading}>
                <p style={{ marginBottom: 16 }}>
                    {getTranslation(
                        'The interaction cannot be deleted because it is being referenced in the following GOTOs:'
                    )}
                </p>

                <ReferencesList>
                    {references?.map((reference) => (
                        <ReferenceItem
                            key={reference.details.interactionId}
                            isDeleted={deletedReferences.includes(reference.details.interactionId)}
                        >
                            <div>
                                <InteractionName
                                    isDeleted={deletedReferences.includes(reference.details.interactionId)}
                                >
                                    {reference.details.interactionName}
                                </InteractionName>
                                <InteractionInfo>
                                    {getTranslation('Language')}: {reference.details.language} •{' '}
                                    {getTranslation('Response Type')}: {reference.details.responseType}
                                </InteractionInfo>
                            </div>
                            <NavigateIcon
                                title={getTranslation('Go to interaction')}
                                onClick={() => handleGoToInteraction(reference.details.interactionId)}
                            />
                        </ReferenceItem>
                    ))}
                </ReferencesList>
            </Spin>
        </Modal>
    );
};

export default i18n(ModalGotoReferencesComponent);
