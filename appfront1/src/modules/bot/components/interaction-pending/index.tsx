import { FC, useEffect, useState } from 'react';
import { Interaction } from '../../../../model/Interaction';
import { useLanguageContext } from '../../../i18n/context';
import { useInteractionsPendingPublicationContext } from '../../contexts/interactionsPendingPublication';
import { BotService } from '../../services/BotService';
import { IconPendingPublication } from '../interaction-errors/styled';
import ModalPendingList from './components/ModalPendingList';

export interface InteractionPendingProps {
    _id: string;
    name: string;
    interactionNewVersion: Interaction;
    interactionOldVersion: Interaction;
}

interface InteractionPendingPublicationProps {
    workspaceId: string;
    botId: string;
    viewPending: boolean;
    closeView: () => void;
}

const InteractionPending: FC<InteractionPendingPublicationProps> = ({ workspaceId, botId, viewPending, closeView }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { getTranslation } = useLanguageContext();
    const { interactionsPendingPublication, setInteractionsPendingPublication } =
        useInteractionsPendingPublicationContext();

    useEffect(() => {
        setModalVisible(viewPending);
    }, [viewPending]);

    const getInteractionPending = async () => {
        let error: any;
        await BotService.getInteractionsPendingPublication(
            workspaceId,
            botId,
            (responseError) => (error = responseError)
        );

        if (error?.error === 'INTERACTIONS_PENDING_PUBLICATION') {
            setInteractionsPendingPublication(error.message);
        }
        setModalVisible(true);
    };

    if (interactionsPendingPublication?.length > 0) {
        return (
            <>
                <ModalPendingList
                    close={() => {
                        setModalVisible(false);
                        closeView();
                    }}
                    open={modalVisible}
                    interactionsPending={interactionsPendingPublication}
                />
                <IconPendingPublication
                    title={`${interactionsPendingPublication?.length} ${getTranslation(
                        'interactions found pending publication'
                    )}`}
                    onClick={() => {
                        getInteractionPending();
                    }}
                />
            </>
        );
    }
    return <></>;
};

export default InteractionPending;
