import { FC, useEffect, useState } from 'react';
import { sleep, timeout } from '../../../../utils/Timer';
import { BotService } from '../../services/BotService';
import ModalErrorsList from './components/modal-errors-list';
import { SyncButton, SuccessButton, WarningButton } from './styled';

export interface InteractionErrors {
    _id: string;
    name: string;
    withoutAnyParent: boolean;
}

interface InteractionErrorsProps {
    workspaceId: string;
    botId: string;
}

const InteractionErrors: FC<InteractionErrorsProps> = ({ workspaceId, botId }) => {
    const [interactionErrors, setInteractionErrors] = useState<InteractionErrors[]>([]);
    const [fetchingErrors, setFetchingErrors] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [errorsModalVisible, setErrorsModalVisible] = useState(false);

    useEffect(() => {
        timeout(() => getInteractionErrors(), 100);
    }, []);

    const getInteractionErrors = async () => {
        setFetchingErrors(true);
        let error: any;
        await sleep(100);
        await BotService.getInteractionsErrors(workspaceId, botId, (responseError) => (error = responseError));
        setFetchingErrors(false);
        setFetched(true);

        if (error?.error === 'INTERACTIONS_PUBLISH_FAILED') {
            setInteractionErrors(error.message);
        }
    };

    if (fetchingErrors) {
        return <SyncButton infinity title='Validando erros' />;
    }

    if (!fetched) {
        return <SyncButton />;
    }

    if (!fetchingErrors && !interactionErrors.length) {
        return <SuccessButton title='Nenhum erro encontrado' />;
    }

    if (interactionErrors.length > 0) {
        return (
            <>
                <ModalErrorsList
                    interactionErrors={interactionErrors}
                    visible={errorsModalVisible}
                    onClose={() => setErrorsModalVisible(false)}
                    workspaceId={workspaceId}
                    botId={botId}
                    onDeleteInteraction={(interactionId) =>
                        setInteractionErrors((prevState) => [
                            ...prevState.filter((interaction) => interaction._id !== interactionId),
                        ])
                    }
                />
                <WarningButton
                    title={`${interactionErrors.length} encontrados`}
                    onClick={() => setErrorsModalVisible(true)}
                />
            </>
        );
    }

    return <SyncButton />;
};

export default InteractionErrors;
