import { useState } from 'react';
import { ApiError } from '../../../../../../../interfaces/api-error.interface';
import { useIntegrationContext } from '../../../../../integration.context';
import { HealthService } from '../../../../../services/HealthService';
import { RequestEntityImportParams } from './interfaces';
const useRequestEntityImport = () => {
    const [loading, setLoading] = useState(false);
    let error: ApiError;
    const { setIntegrations } = useIntegrationContext();

    const handleNotification = (error: ApiError, getTranslation: Function, addNotification: Function) => {
        const errorMessages: Record<string, string> = {
            ERROR_IMPORT_ENTITIES_INTEGRATION: 'The import of entities is already being executed',
            OFFLINE_INTEGRATION: 'The integration is offline',
            ERROR_DISABLED_INTEGRATION: 'The integration is disabled',
        };

        setLoading(false);
        const errorMessage = errorMessages[error?.error] || 'An error has occurred';

        addNotification({
            title: getTranslation(error?.error === 'OFFLINE_INTEGRATION' ? 'Error' : 'Warning'),
            message: getTranslation(errorMessage),
            type: error?.error === 'OFFLINE_INTEGRATION' ? 'danger' : 'warning',
        });
    };

    const onRequestEntityImport = async ({
        workspaceId,
        integration,
        addNotification,
        getTranslation,
        integrations,
        setSelectedIntegration,
    }: RequestEntityImportParams) => {
        try {
            setLoading(true);

            let success = false;

            await HealthService.extractAllHealthEntities(workspaceId, integration, (err) => (error = err));

            if (error?.code === 'ECONNABORTED') {
                return;
            }

            if (error) {
                handleNotification(error, getTranslation, addNotification);
                success = false;
            }

            if (success || !error) {
                addNotification({
                    title: getTranslation('Success'),
                    message: getTranslation('Extract request sended'),
                    type: 'success',
                });

                const syncAt = +new Date();
                const updatedIntegration = { ...integration, lastSyncEntities: syncAt };
                const updatedIntegrationList = integrations.map((curr) =>
                    curr._id === updatedIntegration._id ? updatedIntegration : curr
                );
                setSelectedIntegration(updatedIntegration);
                setIntegrations(updatedIntegrationList);
            }
        } catch (error) {
            console.log('Error occurred:', error);
        } finally {
            setLoading(false);
        }
    };

    return { loading, onRequestEntityImport };
};

export default useRequestEntityImport;
