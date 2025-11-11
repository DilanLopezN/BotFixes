import { Button, Checkbox, Col, Drawer, Dropdown, Form, Input, MenuProps, Pagination, Popconfirm, Row } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { HealthEntitySource, HealthEntityType } from 'kissbot-core';
import debounce from 'lodash/debounce';
import { FC, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { HealthEntity, IntegrationsType } from '../../../../../../model/Integrations';
import { PaginatedModel } from '../../../../../../model/PaginatedModel';
import { ModalPosition } from '../../../../../../shared/Modal/ModalProps';
import { ModalPortal } from '../../../../../../shared/ModalPortal/ModalPortal';
import { addNotification } from '../../../../../../utils/AddNotification';
import { isSystemAdmin, isSystemCsAdmin, isSystemSupportAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../services/HealthService';
import { FiltersPagination } from '../Flow';
import HealthEntitiesForm from '../HealthEntitiesForm';
import HealthEntityForm from '../HealthEntityForm';
import DeleteEntityModal from './DeleteEntityModal';
import ListHeader from './ListHeader';
import { HealthEntityListProps, Sorter, TableHealthEntity } from './props';
import { Container, PaginationContainer } from './Styled';
import TableHealthEntityList from './TableHealthEntityList';
import DoctorDebugModal from './DoctorDebugModal';

const ButtonSelect = Dropdown.Button;

const errorToken = 'ERR';

enum FieldUpdate {
    canView = 'canView',
    canSchedule = 'canSchedule',
    canConfirmActive = 'canConfirmActive',
    canConfirmPassive = 'canConfirmPassive',
    disableAllViewOptions = 'disableAllViewOptions',
}

const HealthEntityList = ({
    getTranslation,
    loggedUser,
    entityType,
    workspaceId,
    integration,
    setSelectedIntegration,
}: HealthEntityListProps & I18nProps) => {
    const [entityList, setEntityList] = useState<HealthEntity[] | undefined>(undefined);
    const [editingEntity, setEditingEntity] = useState<HealthEntity | undefined>(undefined);
    const [deletingEntityId, setDeletingEntityId] = useState<string | undefined>(undefined);
    const [debuggingDoctor, setDebuggingDoctor] = useState<HealthEntity | undefined>(undefined);
    
    const canDebug =
        loggedUser && (isSystemAdmin(loggedUser) || isSystemCsAdmin(loggedUser) || isSystemSupportAdmin(loggedUser));
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [modalCreateEntities, setModalCreateEntities] = useState(false);
    const [entityListSelected, setEntityListSelected] = useState<TableHealthEntity[]>([]);
    const [isDeletingDisabled, setDeletingDisabled] = useState(false);
    const [sortState, setSortState] = useState<Sorter>({
        field: '-activeErp',
        order: 'ascend',
    });
    const [filters, setFilters] = useState<FiltersPagination>({ skip: 0, total: 0, limit: 10, currentPage: 1 });

    const [hideInactive, setHideInactive] = useState(false);
    const parentRef = {
        [HealthEntityType.insurancePlan]: {
            ref: HealthEntityType.insurance,
            parentTitle: getTranslation('Insurance'),
        },
        [HealthEntityType.procedure]: {
            ref: HealthEntityType.insurance,
            parentTitle: getTranslation('Speciality'),
        },
        [HealthEntityType.planCategory]: {
            ref: HealthEntityType.insurance,
            parentTitle: getTranslation('Insurance'),
        },
        [HealthEntityType.insuranceSubPlan]: {
            ref: HealthEntityType.insurancePlan,
            parentTitle: getTranslation('Plan'),
        },
    } as {
        [key: string]: {
            ref: HealthEntityType;
            parentTitle: string;
        };
    };

    const fetchEntityList = useCallback(
        async (filters: FiltersPagination, hideInactiveOverride: boolean, sorter: Sorter = sortState) => {
            setLoading(true);
            let sort: string = '';
            const checkedFilterList = [
                'activeErp',
                'canView',
                'canSchedule',
                'canReschedule',
                'canConfirmActive',
                'canConfirmPassive',
                'canCancel',
            ];

            if (sorter.field && sorter.order) {
                const userSort = sorter.order === 'ascend' ? sorter.field : `-${sorter.field}`;
                sort = userSort;
                setSortState(sorter);
            }
            const sortFields = sort.split(',');
            const validatedSortFields = sortFields.map((field) => {
                const cleanField = field.replace('-', '');
                return checkedFilterList.includes(cleanField) ? `${field},friendlyName` : field;
            });
            sort = validatedSortFields.join(',');
            if (!integration._id) {
                setLoading(false);
                return;
            }
            const response: any | PaginatedModel<HealthEntity> = await HealthService.getHealthEntities({
                workspaceId: workspaceId,
                integrationId: integration._id,
                entityType: entityType,
                search: search,
                skip: filters.skip,
                sort: sort,
                hideInactive: hideInactiveOverride,
                cb: () => errorToken,
                limit: filters.limit,
            });

            if (response === errorToken) {
                addNotification({
                    message: getTranslation('Error on load entities'),
                    title: getTranslation('Error'),
                    type: 'danger',
                });
                setEntityList([]);
            } else {
                const paginatedResponse = response as PaginatedModel<HealthEntity>;
                const filteredEntities = paginatedResponse.data.filter((entity) => !hideInactive || entity.activeErp);

                setEntityList(filteredEntities);
                setFilters({
                    total: paginatedResponse.count,
                    skip: paginatedResponse.currentPage,
                    currentPage: filters.currentPage,
                    limit: filters.limit,
                });
            }
            setLoading(false);
        },
        [entityType, getTranslation, hideInactive, integration._id, search, sortState, workspaceId]
    );

    const updateEntity = async (changedEntity: HealthEntity) => {
        if (!entityList || !integration._id) {
            return;
        }

        const response = await HealthService.updateHealthEntity(
            workspaceId,
            integration._id,
            changedEntity,
            () => errorToken
        );

        if (response === errorToken) {
            addNotification({
                message: getTranslation('Error on update entity'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        } else {
            let newEntityList = entityList.map((entity) => {
                if (entity._id === changedEntity._id) {
                    return { ...response, updatedAt: +new Date() };
                }
                return { ...entity };
            });
            setEntityList(newEntityList);
            setEditingEntity(undefined);
        }
    };

    const createEntity = async (entity: HealthEntity) => {
        if (!entityList || !integration._id) {
            return;
        }
        // ao criar entidade não tem draft
        entity.draft = undefined;
        const response = await HealthService.createHealthEntity(
            workspaceId,
            integration._id,
            [entity],
            () => errorToken
        );

        if (response === errorToken) {
            addNotification({
                message: getTranslation('Error on create entity'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        } else {
            addNotification({
                message: getTranslation('Entity saved'),
                title: getTranslation('Success'),
                type: 'success',
            });

            let newEntityList = [...entityList, ...response];
            setEntityList(newEntityList);
            setEditingEntity(undefined);
        }
    };

    const deleteEntity = async (entityId) => {
        if (!integration._id) {
            return;
        }
        const oldEntityList = entityList && [...entityList];
        let newEntityList = entityList && entityList.filter((entity) => entity._id !== entityId);
        setEntityList(newEntityList);

        const response: any = await HealthService.deleteHealthEntity(
            workspaceId,
            integration._id,
            entityId,
            () => errorToken
        );
        if (response === errorToken) {
            setEntityList(oldEntityList);
            addNotification({
                message: getTranslation('Error on delete entity'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        }
        setDeletingEntityId(undefined);
    };

    const deleteEntityBatch = async () => {
        if (!integration._id) {
            return;
        }

        const entityToDelete = entityListSelected?.map((entity) => entity?.actions?._id);

        let error;
        await HealthService.deleteHealthEntityBatch(
            workspaceId,
            integration._id,
            entityToDelete,
            (err) => (error = err)
        );
        if (error) {
            return addNotification({
                message: getTranslation('Error on delete entity'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        }
        let newEntityList =
            entityList && entityList.filter((entity) => entity._id !== entityToDelete.find((id) => id === entity._id));
        setEntityList(newEntityList);
        setEntityListSelected([]);
    };

    const updateFieldEntityBatch = async (field: FieldUpdate, action: boolean) => {
        if (!integration._id || !entityList?.length) {
            return;
        }

        const listFiltered = entityListSelected.filter((entity) => entity.actions?.[field] !== action);

        if (!listFiltered.length) {
            setEntityListSelected([]);
            return;
        }
        let newEntities: HealthEntity[];

        if (field === FieldUpdate.disableAllViewOptions) {
            newEntities = listFiltered.map((entity) => {
                return {
                    ...entity.actions,
                    canCancel: false,
                    canConfirmActive: false,
                    canConfirmPassive: false,
                    canView: false,
                    canReschedule: false,
                    canSchedule: false,
                };
            });
        } else {
            newEntities = listFiltered.map((entity) => ({ ...entity.actions, [field]: action }));
        }
        let error;
        await HealthService.updateHealthEntityBatch(workspaceId, integration._id, newEntities, (err) => (error = err));
        if (error) {
            return addNotification({
                message: getTranslation('Error on updated entity'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        }

        let newEntityList = entityList.map((entity) => {
            const changedEntity = newEntities.find((newEntity) => newEntity._id === entity._id);
            if (changedEntity) {
                const draft = entity?.draft ? { ...entity.draft } : { ...entity };
                return { ...changedEntity, draft: draft, updatedAt: +new Date() };
            }
            return { ...entity };
        });
        setEntityList(newEntityList);
        setEntityListSelected([]);
        addNotification({
            message: getTranslation('Action performed successfully'),
            title: getTranslation('Success'),
            type: 'success',
            duration: 2000,
        });
    };

    const onRequestEntitySync = async () => {
        let error: any;
        await HealthService.synchronizeHealthEntitieByEntityType(workspaceId, integration, entityType, (err: any) => {
            error = err;
        });

        if (error) {
            if (error?.error === 'CANT_SYNC_ALL_ENTITIES_DISABLED') {
                return addNotification({
                    title: getTranslation('Não possivel sincronizar'),
                    message: getTranslation('Todas as entidades estão desativadas. Não é possível sincronizar.'),
                    type: 'danger',
                });
            }
            return addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Error. Try again'),
                type: 'danger',
            });
        }

        addNotification({
            title: getTranslation('Success'),
            message: getTranslation('Sincronização efetuada com sucesso'),
            type: 'success',
        });

        setSelectedIntegration({
            ...integration,
            lastSinglePublishEntities: {
                ...integration.lastSinglePublishEntities,
                [entityType]: +new Date(),
            },
        });
        const newEntityList = entityList?.map((entity) => {
            return {
                ...entity,
                draft: undefined,
            };
        });
        setEntityList(newEntityList);
    };

    const deleteDisabledEntities = async () => {
        setDeletingDisabled(true);

        const result = await HealthService.deleteDisabledEntities(
            workspaceId as string,
            integration._id as string,
            entityType
        );

        setDeletingDisabled(false);

        if (!result) {
            addNotification({
                message: getTranslation('Error on delete disabled entities'),
                title: getTranslation('Error'),
                type: 'danger',
            });

            return;
        }

        const newEntityList = entityList?.filter((entity) => entity.activeErp !== false);
        setEntityList(newEntityList);

        addNotification({
            type: 'success',
            duration: 3000,
            title: getTranslation('Successfully deleted'),
            message: getTranslation('Successfully deleted'),
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debounceChangeSearch = useCallback(
        debounce((text: string) => {
            return setSearch(text);
        }, 600),
        []
    );

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('Disable view'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canView, false),
        },
        {
            key: '2',
            label: getTranslation('Enable reschedule'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canSchedule, true),
        },
        {
            key: '3',
            label: getTranslation('Disable reschedule'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canSchedule, false),
        },
        {
            key: '4',
            label: getTranslation('Enable Actively confirm'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canConfirmActive, true),
        },
        {
            key: '5',
            label: getTranslation('Disable Actively confirm'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canConfirmActive, false),
        },
        {
            key: '6',
            label: getTranslation('Enable Confirm passively'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canConfirmPassive, true),
        },
        {
            key: '7',
            label: getTranslation('Disable Confirm passively'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.canConfirmPassive, false),
        },
        {
            key: '8',
            label: getTranslation('Disable all options'),
            onClick: () => updateFieldEntityBatch(FieldUpdate.disableAllViewOptions, true),
        },
    ];

    const handleToggleHideInactive = (e: CheckboxChangeEvent) => {
        const newHideInactive = e.target.checked;
        setHideInactive(newHideInactive);
    };

    const handlePaginationChange = (page: number, pageSize: number) => {
        if (pageSize !== filters.limit) {
            // Quando o pageSize mudar, você deve atualizar o limite
            const updatedFilters: FiltersPagination = {
                ...filters,
                limit: pageSize,
                skip: (page - 1) * pageSize,
                currentPage: page,
            };

            setFilters(updatedFilters);
            fetchEntityList(updatedFilters, hideInactive);
        } else {
            // Quando apenas a página mudar, só atualize a página
            const updatedFilters: FiltersPagination = {
                ...filters,
                skip: (page - 1) * filters.limit,
                currentPage: page,
            };

            setFilters(updatedFilters);
            fetchEntityList(updatedFilters, hideInactive);
        }
    };

    useEffect(() => {
        setFilters({ skip: 0, total: 0, limit: 10, currentPage: 1 });
        fetchEntityList({ total: 0, skip: 0, limit: 10, currentPage: 1 }, hideInactive);
    }, [entityType, search, hideInactive, fetchEntityList]);

    useEffect(() => {
        setSearch('');
    }, [entityType]);

    return (
        <div className='HealthEntityList' style={{ position: 'relative' }}>
            {editingEntity && (
                <Drawer
                    bodyStyle={{ padding: 0 }}
                    open={!!editingEntity}
                    onClose={() => setEditingEntity(undefined)}
                    placement='right'
                    title={null}
                    width={800}
                    closable={false}
                >
                    {!!editingEntity && (
                        <HealthEntityForm
                            entity={editingEntity}
                            workspaceId={workspaceId}
                            integrationType={integration.type}
                            integrationId={integration._id as string}
                            onEntitySaved={(entity) => {
                                if (entity._id) {
                                    return updateEntity(entity);
                                }
                                return createEntity(entity);
                            }}
                            onClose={() => setEditingEntity(undefined)}
                        />
                    )}
                </Drawer>
            )}
            {modalCreateEntities && (
                <Drawer
                    bodyStyle={{ padding: 0 }}
                    open={!!modalCreateEntities}
                    onClose={() => setModalCreateEntities(false)}
                    placement='right'
                    title={null}
                    width={800}
                    closable={false}
                >
                    {!!modalCreateEntities && (
                        <Container>
                            <HealthEntitiesForm
                                entityType={entityType}
                                entityList={entityList || []}
                                setEntityList={(value) => setEntityList(value)}
                                workspaceId={workspaceId}
                                integrationId={integration._id as string}
                                onClose={() => setModalCreateEntities(false)}
                            />
                        </Container>
                    )}
                </Drawer>
            )}
            <ModalPortal
                height='auto'
                minWidth='300px'
                isOpened={!!deletingEntityId}
                position={ModalPosition.center}
                onClickOutside={() => setDeletingEntityId(undefined)}
            >
                <DeleteEntityModal
                    onClose={() => setDeletingEntityId(undefined)}
                    onDelete={() => deleteEntity(deletingEntityId)}
                />
            </ModalPortal>
            <ListHeader
                integrationId={integration._id}
                integrationType={integration.type}
                integrationName={integration.name}
                key={entityType}
                setModalCreateEntities={setModalCreateEntities}
                entityType={entityType}
                onNewEntityClick={() =>
                    setEditingEntity({
                        canSchedule: true,
                        canCancel: true,
                        canConfirmActive: true,
                        canConfirmPassive: true,
                        canReschedule: true,
                        entityType,
                        friendlyName: '',
                        integrationId: integration._id,
                        name: '',
                        source: HealthEntitySource.user,
                        workspaceId,
                        canView: true,
                        synonyms: [] as string[],
                    } as HealthEntity)
                }
                syncEntity={onRequestEntitySync}
            />
            <div style={{ overflowY: 'auto', minWidth: '1100px' }}>
                <div style={{ padding: '20px' }}>
                    {
                        <>
                            <Row>
                                <Col span={24}>
                                    <Row align='top' justify={'end'} gutter={8}>
                                        {entityListSelected.length ? (
                                            <>
                                                {integration?.type === IntegrationsType.CUSTOM_IMPORT && (
                                                    <Col>
                                                        <Popconfirm
                                                            title={getTranslation(
                                                                'Are you sure you want to delete the selected entities?'
                                                            )}
                                                            onConfirm={() => deleteEntityBatch()}
                                                            cancelText={getTranslation('No')}
                                                            okButtonProps={{
                                                                className: 'antd-span-default-color',
                                                            }}
                                                            okText={getTranslation('Yes')}
                                                            placement={'bottomRight'}
                                                        >
                                                            <Button
                                                                className='antd-span-default-color'
                                                                type='primary'
                                                                onClick={() => {}}
                                                            >
                                                                {getTranslation('Delete')}
                                                            </Button>
                                                        </Popconfirm>
                                                    </Col>
                                                )}
                                                <Col>
                                                    <ButtonSelect
                                                        className='antd-span-default-color'
                                                        type={'primary'}
                                                        onClick={() => {
                                                            updateFieldEntityBatch(FieldUpdate.canView, true);
                                                        }}
                                                        menu={{ items }}
                                                    >
                                                        {getTranslation('Enable view')}
                                                    </ButtonSelect>
                                                </Col>
                                            </>
                                        ) : null}
                                        <Col>
                                            <Form.Item
                                                style={{ marginBottom: 0 }}
                                                label={getTranslation('Hide inactive')}
                                            >
                                                <Checkbox checked={hideInactive} onChange={handleToggleHideInactive} />
                                            </Form.Item>
                                        </Col>
                                        {loggedUser && isSystemAdmin(loggedUser) ? (
                                            <Col>
                                                <Popconfirm
                                                    title='Deletar todas as entidades inativas?'
                                                    onConfirm={() => {
                                                        deleteDisabledEntities();
                                                    }}
                                                    onCancel={() => {}}
                                                    okText='Sim'
                                                    cancelText='Não'
                                                >
                                                    <Button
                                                        className='antd-span-default-color'
                                                        type='default'
                                                        loading={isDeletingDisabled}
                                                    >
                                                        {getTranslation('Delete Disabled Entities')}
                                                    </Button>
                                                </Popconfirm>
                                            </Col>
                                        ) : null}
                                        <Col>
                                            <Input.Search
                                                disabled={!integration._id}
                                                key={`${entityType}`}
                                                autoFocus
                                                style={{
                                                    height: '43px',
                                                    width: '350px',
                                                }}
                                                placeholder={getTranslation('Search')}
                                                onChange={(ev) => debounceChangeSearch(ev.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24} style={{ paddingBottom: 10 }}>
                                    <Row gutter={16}>
                                        <Col>
                                            <div
                                                style={{
                                                    borderLeft: '3px solid #ff0000',
                                                    padding: '0 0 0 10px',
                                                    margin: '5px 0',
                                                }}
                                            >
                                                {getTranslation('Disabled in ERP')}
                                            </div>
                                        </Col>
                                        <Col>
                                            <div
                                                style={{
                                                    borderLeft: '3px solid #e0ae00',
                                                    padding: '0 0 0 10px',
                                                    margin: '5px 0',
                                                }}
                                            >
                                                {getTranslation('Unpublished change')}
                                            </div>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <TableHealthEntityList
                                entityList={entityList || []}
                                entityType={entityType}
                                integration={integration}
                                onEntityChange={updateEntity}
                                onEntityDelete={(id) => {
                                    setDeletingEntityId(id);
                                }}
                                onEntityUpdateClick={(entity) => {
                                    setEditingEntity(entity);
                                }}
                                onDoctorDebug={(entity) => {
                                    setDebuggingDoctor(entity);
                                }}
                                workspaceId={workspaceId}
                                parentTitle={!!parentRef[entityType] && parentRef[entityType].parentTitle}
                                setEntityList={(entityList: HealthEntity[]) => setEntityList(entityList)}
                                loading={loading}
                                entityListSelected={entityListSelected}
                                setEntityListSelected={setEntityListSelected}
                                fetchEntityList={fetchEntityList}
                                hideInactive={hideInactive}
                                setPaginationState={setFilters}
                            />
                        </>
                    }
                    {filters && filters.total > 10 ? (
                        <PaginationContainer>
                            <Pagination
                                defaultCurrent={1}
                                total={filters.total}
                                showSizeChanger={true}
                                onChange={handlePaginationChange}
                            />
                        </PaginationContainer>
                    ) : null}
                </div>
            </div>
            {debuggingDoctor && canDebug && (
                <DoctorDebugModal
                    doctor={debuggingDoctor}
                    workspaceId={workspaceId}
                    integrationId={integration._id as string}
                    isOpen={!!debuggingDoctor}
                    onClose={() => setDebuggingDoctor(undefined)}
                />
            )}
        </div>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export default connect(mapStateToProps)(i18n(HealthEntityList)) as FC<HealthEntityListProps>;
