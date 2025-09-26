import { Checkbox, Dropdown, MenuProps, Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { HealthEntitySource, HealthEntityType } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import styled from 'styled-components';
import { HealthEntity, HealthIntegration } from '../../../../../../model/Integrations';
import { LabelWithTooltip } from '../../../../../../shared-v2/LabelWithToltip';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../services/HealthService';
import { FiltersPagination } from '../Flow';
import { Sorter, TableHealthEntity } from './props';

const Col = styled('div')`
    display: flex;
    font-size: 13px;
    align-items: center;
`;

const Parent = styled(Col)`
    font-size: 13px;

    span {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
`;

const OptionsCol = styled(Col)`
    display: flex;
    justify-content: center;
`;

const OptionsIcon = styled(HiDotsVertical)`
    color: #777;
    font-size: 18px;
    cursor: pointer;

    &:hover {
        color: #444;
    }
`;

const TableHealth = styled(Table)`
    td {
        background: #fff !important;
    }

    .ant-table-column-title {
        font-size: 14px;
    }

    .ant-table-thead {
        .columnHeaderTableHealth {
            font-weight: 600;
            color: #696969;
        }

        th {
            background-color: #f5f5f5;
            padding: 8px !important;
        }
    }

    .activeErp > .ant-table-selection-column {
        border-left: 3px solid #ff0000;
    }

    .notPublished > .ant-table-selection-column {
        border-left: 3px solid #e0ae00;
    }
`;

interface Props {
    entityType: HealthEntityType;
    parentTitle?: string;
    entityList: HealthEntity[];
    workspaceId: string;
    integration: HealthIntegration;
    onEntityChange: (entity: HealthEntity) => any;
    onEntityDelete: (entityId: string) => any;
    onEntityUpdateClick: (entity: HealthEntity) => any;
    onDoctorDebug?: (entity: HealthEntity) => any;
    setEntityList: Function;
    loading: boolean;
    entityListSelected: any[];
    setEntityListSelected: Function;
    fetchEntityList: (pagination: FiltersPagination, hideInactive: boolean, sorter?: Sorter) => Promise<void>;
    setPaginationState: React.Dispatch<React.SetStateAction<FiltersPagination>>;
    hideInactive: boolean;
}

const TableHealthEntityList = ({
    getTranslation,
    entityType,
    parentTitle,
    entityList,
    integration,
    onEntityChange,
    onEntityDelete,
    onEntityUpdateClick,
    onDoctorDebug,
    workspaceId,
    setEntityList,
    loading,
    entityListSelected,
    setEntityListSelected,
    fetchEntityList,
    hideInactive,
    setPaginationState,
}: Props & I18nProps) => {
    const [dataSource, setDataSource] = useState<any[]>([]);

    useEffect(() => {
        data(entityList);
    }, [entityList, integration.lastSinglePublishEntities]);

    const getEntityName = () => {
        switch (entityType) {
            case HealthEntityType.appointmentType:
                return getTranslation('Appointment type');
            case HealthEntityType.doctor:
                return getTranslation('Doctor');
            case HealthEntityType.insurance:
                return getTranslation('Insurance');
            case HealthEntityType.organizationUnit:
                return getTranslation('Organization unit');
            case HealthEntityType.procedure:
                return getTranslation('Procedure');
            case HealthEntityType.planCategory:
                return getTranslation('Categories');
            case HealthEntityType.insurancePlan:
                return getTranslation('Plans');
            case HealthEntityType.speciality:
                return getTranslation('Speciality');
            case HealthEntityType.insuranceSubPlan:
                return getTranslation('Subplans');
            case HealthEntityType.organizationUnitLocation:
                return getTranslation('Location');
            case HealthEntityType.occupationArea:
                return getTranslation('Occupation area');
            case HealthEntityType.typeOfService:
                return getTranslation('typeOfService');
            case HealthEntityType.typeOfService:
                return getTranslation('Lateralidade');
            case HealthEntityType.reason:
                return getTranslation('Motivos não agendamento');
        }
    };

    const defaultCheckBox = (field: string, entity: any) => {
        return (
            <Checkbox
                style={{ visibility: 'visible' }}
                checked={entity?.[field]}
                disabled={entity.activeErp === false}
                onChange={(ev) => {
                    const updatedEntity = {
                        ...entity,
                        [field]: ev.target.checked,
                        draft: entity.draft ? entity.draft : { ...entity },
                    };
                    onEntityChange(updatedEntity);
                }}
            />
        );
    };

    const getColumns = () => {
        const columns: ColumnProps<any>[] = [
            {
                className: 'columnHeaderTableHealth',
                width: '250px',
                title: getEntityName(),
                dataIndex: 'entityName',
                key: 'entityName',
                fixed: 'left',
                ellipsis: true,
                render: (text) => <Col>{text}</Col>,
            },
            {
                className: 'columnHeaderTableHealth',
                width: '250px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Friendly name')}
                        tooltipText={getTranslation('Name to be displayed in the bot')}
                    />
                ),
                ellipsis: true,
                dataIndex: 'friendlyName',
                key: 'friendlyName',
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
                render: (text) => <Col>{text}</Col>,
            },
            {
                className: 'columnHeaderTableHealth',
                width: '90px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('To view')}
                        tooltipText={getTranslation('Allows visualization of the entity.')}
                    />
                ),
                dataIndex: 'canView',
                key: 'canView',
                align: 'center',
                render: (entity) => <>{defaultCheckBox('canView', entity)}</>,
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
            },
            {
                className: 'columnHeaderTableHealth',
                width: '100px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('To schedule')}
                        tooltipText={getTranslation(
                            "Enables automatic scheduling of this entity within the bot's flow."
                        )}
                    />
                ),
                dataIndex: 'canSchedule',
                key: 'canSchedule',
                align: 'center',
                render: (entity) => <>{defaultCheckBox('canSchedule', entity)}</>,
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
            },
            {
                className: 'columnHeaderTableHealth',
                width: '90px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Reschedule')}
                        tooltipText={getTranslation(
                            "Enables automatic rescheduling of this entity within the bot's flow."
                        )}
                    />
                ),
                dataIndex: 'canReschedule',
                key: 'canReschedule',
                align: 'center',
                render: (entity) => <>{defaultCheckBox('canReschedule', entity)}</>,
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
            },
            {
                className: 'columnHeaderTableHealth',
                width: '90px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation('Cancel')}
                        tooltipText={getTranslation(
                            "Enables automatic cancellation of this entity within the bot's flow."
                        )}
                    />
                ),
                dataIndex: 'canCancel',
                key: 'canCancel',
                align: 'center',
                render: (entity) => <>{defaultCheckBox('canCancel', entity)}</>,
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
            },
            {
                className: 'columnHeaderTableHealth',
                width: '90px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={`${getTranslation('Confirm')} (A)`}
                        tooltipText={getTranslation('Allow push active commit for this entity')}
                    />
                ),
                dataIndex: 'canConfirmActive',
                key: 'canConfirmActive',
                align: 'center',
                render: (entity) => <>{defaultCheckBox('canConfirmActive', entity)}</>,
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
            },
            {
                className: 'columnHeaderTableHealth',
                width: '90px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={`${getTranslation('Confirm')} (P)`}
                        tooltipText={getTranslation('Allow the patient to confirm their appointment through the bot')}
                    />
                ),
                dataIndex: 'canConfirmPassive',
                key: 'canConfirmPassive',
                align: 'center',
                render: (entity) => <>{defaultCheckBox('canConfirmPassive', entity)}</>,
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
            },
            {
                className: 'columnHeaderTableHealth',
                width: '150px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={`${getTranslation('Order')} / ${getTranslation('Source')}`}
                        tooltipText={getTranslation('The higher the number, the closer to the beginning it will be.')}
                    />
                ),
                dataIndex: 'order',
                key: 'order',
                align: 'center',
                sorter: true,
                sortDirections: ['ascend', 'descend', 'ascend'],
                render: (text) => <Col style={{ justifyContent: 'center' }}>{text}</Col>,
            },
            {
                className: 'columnHeaderTableHealth',
                width: '50px',
                title: '',
                dataIndex: 'actions',
                key: 'actions',
                align: 'center',
                fixed: 'right',
                render: (entity: HealthEntity) => {
                    const items: MenuProps['items'] = [
                        {
                            key: '1',
                            label: getTranslation('Delete'),
                            onClick: () => {
                                if (entity?.source === HealthEntitySource.user || !entity.activeErp) {
                                    onEntityDelete(entity._id);
                                }
                            },
                        },
                        {
                            key: '2',
                            label: getTranslation('Edit'),
                            onClick: () => onEntityUpdateClick(entity),
                        },
                        {
                            key: '3',
                            label: getTranslation('Debug Doctor'),
                            onClick: () => {
                                if (entityType === HealthEntityType.doctor && onDoctorDebug) {
                                    onDoctorDebug(entity);
                                }
                            },
                        },
                        {
                            key: '4',
                            label: getTranslation('Revert changes'),
                            onClick: () => {
                                if (entity?.draft) {
                                    reverseChanges(entity.draft);
                                }
                            },
                        },
                    ].filter((item) => {
                        if (item.key === '1') {
                            return entity?.source === HealthEntitySource.user || !entity.activeErp;
                        }
                        if (item.key === '3') {
                            return entityType === HealthEntityType.doctor;
                        }
                        if (item.key === '4') {
                            return !!entity?.draft;
                        }
                        return true;
                    });

                    return (
                        <OptionsCol>
                            <Dropdown menu={{ items }} placement='topRight' trigger={['click']}>
                                <OptionsIcon onClick={() => {}} />
                            </Dropdown>
                        </OptionsCol>
                    );
                },
            },
        ];

        if (parentTitle) {
            columns.splice(columns.length - 2, 0, {
                className: 'columnHeaderTableHealth',
                width: '280px',
                title: (
                    <LabelWithTooltip
                        placementText='top'
                        color='primary'
                        label={getTranslation(parentTitle)}
                        tooltipText={getTranslation(parentTitle)}
                    />
                ),
                dataIndex: 'parentTitle',
                key: 'parentTitle',
                render: (parent) => (
                    <Parent title={!!parent ? `${parent.code} - ${parent.name}` : ' '}>
                        <span>{!!parent ? `${parent.code} - ${parent.name}` : '-'}</span>
                    </Parent>
                ),
            });
        }

        return columns;
    };

    const data = (entityList: any[]) => {
        enum Source {
            'source_0' = 'erp',
            'source_1' = 'user',
            'source_2' = 'api',
            'source_3' = 'default',
        }
        const data: TableHealthEntity[] = entityList?.map((entity) => {
            return {
                key: `${entity._id} - ${entity?.updatedAt}`,
                entityName: `${entity.code} - ${entity.name}`,
                activeErp: entity.activeErp,
                friendlyName: entity.friendlyName,
                scheduling: entity,
                canCancel: entity,
                canConfirmActive: entity,
                canConfirmPassive: entity,
                canView: entity,
                canReschedule: entity,
                canSchedule: entity,
                order: `${entity.order || '-'} / ${Source[`source_${entity.source}`]}`,
                parentTitle: entity.parent,
                actions: entity,
            };
        });

        return setDataSource(data);
    };

    const reverseChanges = async (entity) => {
        if (!integration._id) {
            return;
        }
        const entityDraft = await HealthService.updateReverseChangesHealthEntity(
            workspaceId,
            integration._id,
            entity,
            (err) => console.log(err)
        );

        if (entityDraft) {
            const newEntityList = entityList.map((element) => {
                if (element._id === entityDraft._id) {
                    return entityDraft;
                }

                return element;
            });
            setEntityList(newEntityList);
        }
    };

    const determinePublicationStatus = (record) => {
        const isActiveErp = record.actions.activeErp === false;

        if (isActiveErp) {
            return 'activeErp';
        } else if (record.actions?.draft) {
            return 'notPublished';
        } else if (
            record.actions?.source === HealthEntitySource.user &&
            (integration?.lastSinglePublishEntities?.[entityType] || 0) < record.actions?.createdAt
        ) {
            return 'notPublished';
        } else if (
            (record.actions?.source === HealthEntitySource.erp &&
                !integration?.lastSinglePublishEntities?.[entityType]) ||
            (record?.actions?.createdAt &&
                record?.actions?.createdAt < (integration?.lastSyncEntities || 0) &&
                (record?.actions?.createdAt > integration?.lastSinglePublishEntities?.[entityType] || 0))
        ) {
            return 'notPublished';
        }

        return '';
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        setPaginationState(newPagination);
        fetchEntityList(newPagination, hideInactive, sorter);
    };

    return (
        <>
            <TableHealth
                loading={loading}
                scroll={{
                    x: 1200,
                    y: 'calc(100vh - 310px)',
                }}
                rowSelection={{
                    selectedRowKeys: entityListSelected.map((element) => {
                        return element.key;
                    }),
                    onSelect: (record: any, selected) => {
                        let list = [...entityListSelected];
                        if (selected) {
                            list.push(record);
                            return setEntityListSelected(list);
                        }

                        const newList = list.filter((element) => element?.key !== record?.key);
                        setEntityListSelected(newList);
                    },
                    columnWidth: '28px',
                    fixed: true,
                    onSelectAll: (selected, selectedRows, changeRows) =>
                        selected ? setEntityListSelected(selectedRows) : setEntityListSelected([]),
                    getCheckboxProps: (record: any) => ({
                        disabled: record.activeErp === false,
                    }),
                }}
                rowClassName={(record: any, index) => {
                    return determinePublicationStatus(record);
                }}
                columns={getColumns()}
                dataSource={dataSource}
                style={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderBottom: 'none',
                    borderRadius: '3px',
                    height: 'auto',
                }}
                pagination={false}
                onChange={handleTableChange}
            />
        </>
    );
};

export default i18n(TableHealthEntityList) as FC<Props>;
