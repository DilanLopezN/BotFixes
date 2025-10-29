import { FC } from 'react';
import { InteractionErrors } from '../..';
import { ModalPosition } from '../../../../../../shared/Modal/ModalProps';
import { ModalPortal } from '../../../../../../shared/ModalPortal/ModalPortal';
import { BotService } from '../../../../services/BotService';
import { Content, DeleteIcon, Row, Arrow } from './styled';

interface ModalErrorsListProps {
    visible: boolean;
    onClose: () => void;
    interactionErrors: InteractionErrors[];
    workspaceId: string;
    botId: string;
    onDeleteInteraction: (interactionId: string) => void;
}

const ModalErrorsList: FC<ModalErrorsListProps> = ({
    visible,
    onClose,
    interactionErrors,
    workspaceId,
    botId,
    onDeleteInteraction,
}) => {
    const deleteInteraction = async (interactionId: string) => {
        let error: any;
        await BotService.deleteInteraction(workspaceId, botId, interactionId, (err) => (error = err));

        if (!error) {
            onDeleteInteraction(interactionId);
        }
    };

    const handleGoToInteraction = (interactionId: string) => {
        window.parent.postMessage(
            {
                type: 'show_info_interaction',
                interactionId,
            },
            '*'
        );

        onClose();
    };

    return (
        <ModalPortal
            height='auto'
            minWidth='500px'
            isOpened={visible}
            position={ModalPosition.center}
            onClickOutside={onClose}
        >
            <Content>
                {interactionErrors.map((interactionError) => {
                    return (
                        <Row key={interactionError._id}>
                            <span
                                style={
                                    interactionError.withoutAnyParent
                                        ? {
                                              textDecoration: 'line-through',
                                          }
                                        : {}
                                }
                            >
                                {interactionError.name ? interactionError.name : 'Fallback'}
                            </span>
                            <div>
                                {interactionError.withoutAnyParent && (
                                    <DeleteIcon
                                        title='Deletar interaction'
                                        onClick={() => deleteInteraction(interactionError._id)}
                                    />
                                )}
                                {!interactionError.withoutAnyParent && (
                                    <Arrow
                                        title='Ir até interaction'
                                        onClick={() => handleGoToInteraction(interactionError._id)}
                                    />
                                )}
                            </div>
                        </Row>
                    );
                })}
            </Content>
        </ModalPortal>
    );
};

export default ModalErrorsList;
