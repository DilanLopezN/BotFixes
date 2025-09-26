import { Button, Dropdown, MenuProps, Modal, Skeleton, Tooltip } from 'antd';
import { HealthEntityType, HealthFlow } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { HiOutlineExclamation } from 'react-icons/hi';
import { BsArrowLeft } from 'react-icons/bs';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { HealthEntity } from '../../../../../../model/Integrations';
import Header from '../../../../../../shared-v2/Header/Header';
import { addNotification } from '../../../../../../utils/AddNotification';
import { isSystemAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { useIntegrationContext } from '../../../../integration.context';
import { HealthService } from '../../../../services/HealthService';
import FlowTable from './components/FlowTable';
import { FlowProps } from './props';
import { Content } from './styles';

const { confirm } = Modal;
const ButtonSelect = Dropdown.Button;

export type EntitiesType = { [key in HealthEntityType]?: HealthEntity[] };

export interface FiltersPagination {
    skip: number;
    currentPage: number;
    total: number;
    limit: number;
    sort?: string;
    search?: string;
}

const Flow: FC<FlowProps & I18nProps> = ({ getTranslation, integration, workspaceId, setSelectedIntegration }) => {
    const history = useHistory();
    const [flows, setFlows] = useState<HealthFlow[]>([]);
    const [entities, setEntities] = useState<EntitiesType>({});
    const [fetchedEntities, setFetchedEntities] = useState<boolean>(false);
    const [errorFetchEntities, setErrorFetchEntities] = useState<boolean>(false);
    const [creatingFlow, setCreatingFlow] = useState(false);
    const [filters, setFilters] = useState<FiltersPagination>({ skip: 0, total: 0, limit: 10, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [syncFlow, setSyncFlow] = useState(false);
    const [acount, setAcount] = useState<{ pendingFlows: number; pendingFlowsDraft: number }>({
        pendingFlows: 0,
        pendingFlowsDraft: 0,
    });

    const { setIntegrations } = useIntegrationContext();
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const isAdmin = isSystemAdmin(loggedUser);

    useEffect(() => {
        if (!integration._id) {
            setErrorFetchEntities(true);
            return;
        }

        getEntities();
    }, []);

    useEffect(() => {
        getFlows(filters);
    }, [filters.search, filters.sort]);

    const getEntities = async () => {
        let error: any;

        const responses = await Promise.all([
            ...(integration.entitiesFlow ?? []).map((entityType) =>
                HealthService.getHealthAllEntities(
                    workspaceId,
                    integration._id as string,
                    entityType,
                    {
                        _id: 1,
                        name: 1,
                        code: 1,
                        canView: 1,
                        canSchedule: 1,
                        activeErp: 1,
                        enableAppointment: 1,
                        visible: 1,
                        workspaceId: 1,
                        entityType: 1,
                        specialityCode: 1,
                        friendlyName: 1,
                        integrationId: 1,
                    },
                    (err) => (error = err)
                )
            ),
        ]);

        if (!!error) {
            setErrorFetchEntities(true);
            return addNotification({
                message: getTranslation('Error loading entities'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        }

        setEntities(
            responses.reduce((acc, cur) => {
                if (!!cur?.data?.[0]?.entityType) {
                    acc[cur.data[0].entityType] = cur.data ?? [];
                }
                return acc;
            }, {})
        );
        if (!responses.length) {
            setErrorFetchEntities(true);
        }
        setFetchedEntities(true);
    };

    const getFlows = async (filter?: FiltersPagination) => {
        setLoading(true);
        let error: any;
        const response = await HealthService.getHealthFlows(
            workspaceId,
            integration._id as string,
            filter,
            (err: any) => (error = err)
        );

        if (!!error) {
            setLoading(false);
            return addNotification({
                message: getTranslation('Error loading flows'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        }

        setFilters({ ...filters, ...filter, total: response.count, currentPage: Math.round(response.currentPage) });
        setLoading(false);
        setFlows([...response.data]);
    };

    const updateFlow = async (flow) => {
        if (!integration._id) {
            return;
        }
        let error: any;

        const response = await HealthService.updateHealthFlow(
            workspaceId,
            integration._id as string,
            {
                ...flow,
            },
            (err: any) => (error = err)
        );

        if (!error) {
            addNotification({
                message: getTranslation('Flow updated successfully'),
                title: getTranslation('Success'),
                type: 'success',
            });
            return response;
        }
    };

    const createFlow = async (flow) => {
        if (!integration._id) {
            return;
        }
        return await HealthService.createHealthFlow(workspaceId, integration._id, {
            ...flow,
            workspaceId,
            integrationId: integration._id,
            _id: undefined,
            inactive: false,
        });
    };

    const handleAddFlow = () => setCreatingFlow(true);

    const handleSyncFlows = async (force?: boolean) => {
        if (!integration._id) {
            return;
        }
        setSyncFlow(true);
        let error: any;

        if (force) {
            await HealthService.syncForceHealthFlows(workspaceId, integration._id, (err: any) => (error = err));
        } else {
            await HealthService.syncHealthFlows(workspaceId, integration._id, (err: any) => (error = err));
        }
        setSyncFlow(false);

        if (!error) {
            const date = +new Date();
            setIntegrations((prev) => {
                return prev.map((currentIntegration) => {
                    if (currentIntegration._id === integration._id) {
                        return {
                            ...integration,
                            lastPublishFlowDraft: force ? date - 1000 : integration.lastPublishFlowDraft,
                            lastPublishFlow: date,
                        };
                    }
                    return currentIntegration;
                });
            });
            setSelectedIntegration({
                ...integration,
                lastPublishFlowDraft: force ? date - 1000 : integration.lastPublishFlowDraft,
                lastPublishFlow: date,
            });
            return addNotification({
                message: getTranslation('Flow synchronized successfully'),
                title: getTranslation('Success'),
                type: 'success',
            });
        } else {
            if (error.error === 'NO_DATA_TO_PUBLISH') {
                return addNotification({
                    message: getTranslation('All streams are already published in production.'),
                    title: getTranslation('Success'),
                    type: 'success',
                });
            }
            if (error.error === 'CANT_PUBLISH_PRODUCTION_FLOWS') {
                return addNotification({
                    message: getTranslation('There are flows that have not yet been published for approval.'),
                    title: getTranslation('Error'),
                    type: 'warning',
                });
            }
            return addNotification({
                message: getTranslation('We get an error, try again'),
                title: getTranslation('Error'),
                type: 'warning',
            });
        }
    };

    const showConfirmSyncFlows = () => {
        confirm({
            title: getTranslation('Publish flow'),
            content: getTranslation('Are you sure you want to publish the flow to production?'),
            onCancel: () => {},
            cancelText: getTranslation('Cancel'),
            onOk: () => {
                handleSyncFlows();
            },
            cancelButtonProps: {
                className: 'antd-span-default-color',
            },
            okButtonProps: {
                className: 'antd-span-default-color',
            },
        });
    };

    const handleSyncFlowsDraft = async () => {
        if (!integration._id) {
            return;
        }
        setSyncFlow(true);

        let error: any;

        await HealthService.syncHealthDraftFlows(workspaceId, integration._id, (err: any) => {
            error = err;
        });

        setSyncFlow(false);

        if (error?.error === 'NO_DATA_TO_SYNC') {
            return addNotification({
                message: getTranslation('All flows are already published in homologation.'),
                title: getTranslation('Success'),
                type: 'success',
            });
        }
        setIntegrations((prev) => {
            return prev.map((currentIntegration) => {
                if (currentIntegration._id === integration._id) {
                    return {
                        ...integration,
                        lastPublishFlowDraft: +new Date(),
                    };
                }
                return currentIntegration;
            });
        });
        setSelectedIntegration({
            ...integration,
            lastPublishFlowDraft: +new Date(),
        });
        return addNotification({
            message: getTranslation('Flow synchronized successfully'),
            title: getTranslation('Success'),
            type: 'success',
        });
    };

    const deleteFlow = (flowId: string) => {
        if (!integration._id) {
            return;
        }
        return HealthService.deleteHealthFlow(workspaceId, integration._id, flowId);
    };

    const getRender = () => {
        if (errorFetchEntities) {
            if (!Object.keys(entities)?.length) {
                return getTranslation('Nenhuma entidade cadastrada no fluxo desta integração');
            }
            return getTranslation('No flows registered');
        }
        if (fetchedEntities && !Object.keys(entities)?.length) {
            return getTranslation('Nenhuma entidade cadastrada no fluxo desta integração');
        }

        return fetchedEntities && Object.keys(entities)?.length ? (
            <FlowTable
                flows={flows}
                setFlows={setFlows}
                entities={entities}
                onUpdateFlow={(flow) => updateFlow(flow)}
                onCreateFlow={createFlow}
                integration={integration}
                workspaceId={workspaceId}
                creatingFlow={creatingFlow}
                handleAddFlow={handleAddFlow}
                cancelCreatingFlow={() => setCreatingFlow(false)}
                deleteFlow={deleteFlow}
                getFlows={(value: FiltersPagination) => getFlows(value)}
                filters={filters}
                setFilters={(value: FiltersPagination) => setFilters(value)}
                loading={loading}
            />
        ) : (
            <div style={{ background: '#fff', padding: '10px' }}>
                <Skeleton paragraph={{ width: '100%' }} active />
            </div>
        );
    };

    const getPendingPublication = async () => {
        const response = await HealthService.getPendingPublicationsFlows(
            workspaceId,
            integration._id as string,
            (error) => {
                console.log('getPendingPublicationsFlows: ', error);
            }
        );
        setAcount({
            pendingFlows: response?.pendingFlows.count,
            pendingFlowsDraft: response?.pendingFlowsDraft.count,
        });
    };

    useEffect(() => {
        getPendingPublication();
    }, [creatingFlow]);

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('Publish flow production'),
            disabled: syncFlow,
            onClick: showConfirmSyncFlows,
        },
    ];

    return (
        <>
            <Header
                title={
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>
                            {getTranslation('Flow')}
                        </div>
                        {integration?.name && (
                            <div style={{ 
                                fontSize: '14px', 
                                color: '#666', 
                                fontWeight: 400, 
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <BsArrowLeft 
                                    style={{ 
                                        cursor: 'pointer', 
                                        fontSize: '12px',
                                        color: '#1890ff'
                                    }}
                                    onClick={() => {
                                        history.push('/integrations');
                                    }}
                                />
                                {integration.name}
                            </div>
                        )}
                    </div>
                }
                action={
                    <>
                        {integration?._id && Object.keys(entities)?.length ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {(acount?.pendingFlows > 0 || acount?.pendingFlowsDraft > 0) && (
                                    <Tooltip
                                        placement='bottom'
                                        title={`Existem ${acount?.pendingFlows} pendências para produção e ${acount?.pendingFlowsDraft} para a homlogação`}
                                    >
                                        <div style={{ fontSize: '26px', color: '#ec6f34', margin: '0 15px' }}>
                                            <HiOutlineExclamation />
                                        </div>
                                    </Tooltip>
                                )}
                                <ButtonSelect
                                    onClick={handleSyncFlowsDraft}
                                    type={'primary'}
                                    menu={{ items }}
                                    loading={syncFlow}
                                    style={{ marginRight: '10px' }}
                                    className='antd-span-default-color'
                                    children={getTranslation('Publish approval flow')}
                                />
                                <Button
                                    className='antd-span-default-color'
                                    type='primary'
                                    disabled={creatingFlow}
                                    onClick={handleAddFlow}
                                    children={getTranslation('New flow')}
                                />{' '}
                            </div>
                        ) : null}
                    </>
                }
            />
            <Content key={integration?._id}>{getRender()}</Content>
        </>
    );
};

export default i18n(Flow) as FC<FlowProps>;
