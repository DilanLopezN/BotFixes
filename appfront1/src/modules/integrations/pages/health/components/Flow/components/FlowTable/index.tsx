import { Checkbox, Divider, Dropdown, Form, Input, InputNumber, MenuProps, Popconfirm } from 'antd';
import {
    FlowAction,
    FlowPeriodOfDay,
    FlowTriggerType,
    FlowType,
    HealthEntityType,
    HealthFlow,
    HealthFlowSteps,
} from 'kissbot-core';
import omit from 'lodash/omit';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { IconBaseProps } from 'react-icons';
import { AiOutlineSearch } from 'react-icons/ai';
import { MdOutlineTimer } from 'react-icons/md';
import { v4 } from 'uuid';
import { ModalConfirm } from '../../../../../../../../shared/ModalConfirm/ModalConfirm';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import i18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../../../services/HealthService';
import EntitySelector from '../EntitySelector';
import FlowPeriodOfDaySelector from '../FlowPeriodOfDaySelector';
import FlowStepSelector from '../FlowStepSelector';
import FlowTriggerSelector from '../FlowTriggerSelector';
import FlowTypeSelector from '../FlowTypeSelector';
import FlowTypeSelectorMulti from '../FlowTypeSelectorMulti';
import ModalEditFlow from '../ModalEditFlow';
import ModalEditFlowAction from '../ModalEditFlowAction';
import { FlowTableProps } from './props';
import {
    ActionsIcon,
    ButtonStyled,
    CancelIcon,
    CustomTable,
    EditIcon,
    OptionsIcon,
    SaveIcon,
    SortIcon,
} from './styles';

const entityToId = (entityType: HealthEntityType) => `${entityType}Id`;
const columnWidth = '220px';

const FlowTable: FC<FlowTableProps & I18nProps> = ({
    getTranslation,
    flows,
    setFlows,
    entities,
    onUpdateFlow,
    onCreateFlow,
    integration,
    workspaceId,
    creatingFlow,
    handleAddFlow,
    cancelCreatingFlow,
    deleteFlow,
    getFlows,
    filters,
    loading,
    setFilters,
}) => {
    interface SearchFilter {
        $and:
            | [
                  {
                      [key: string]: {
                          $in: string[];
                      };
                  }
              ]
            | any;
    }

    const [editingKey, setEditingKey] = useState<string | undefined>(undefined);
    const [data, setData] = useState<any[]>([]);
    const [modalActionOpen, setModalActionOpen] = useState(false);
    const [modalEditFlowOpen, setModalEditFlowOpen] = useState(false);
    const [flowActionsEdit, setFlowActionsEdit] = useState<HealthFlow | undefined>(undefined);
    const [modalDeleteFlow, setModalDeleteFlow] = useState<string | undefined>(undefined);
    const [searchedEntities, setSearchedEntities] = useState<any[]>([]);
    const [searchFilterFlow, setSearchFilterFlow] = useState<{ [key: string]: any[] }>({});

    const [form] = Form.useForm();
    const pageSizeOptions = [10, 20, 30, 40, 50];

    const EditableCell: FC<any> = (props) => {
        const { editing, dataIndex, title, inputType, record, index, children, entities, ...restProps } = props;
        return <td {...restProps}>{editing ? getEditableComponent(props) : children}</td>;
    };

    const getEditableComponent = (props) => {
        const { dataIndex, record, entities } = props;

        const getDefaultProps = (dataIndex) => ({
            initialValue: record[dataIndex],
            style: { margin: 0 },
            name: dataIndex,
        });

        switch (dataIndex) {
            case 'typeText': {
                const validDataIndex = dataIndex.replace('Text', '');

                return (
                    <Form.Item {...getDefaultProps(validDataIndex)}>
                        <FlowTypeSelector
                            integrationType={integration.type}
                            onChange={(value) => (record.type = value)}
                            initialValue={record[validDataIndex]}
                        />
                    </Form.Item>
                );
            }

            case 'opposeStepText':
            case 'stepText': {
                const validDataIndex = dataIndex.replace('Text', '');
                return (
                    <Form.Item {...getDefaultProps(validDataIndex)}>
                        <FlowStepSelector
                            disabled={record?.type === FlowType.correlation}
                            maxTagCount={1}
                            initialValue={record[validDataIndex]}
                        />
                    </Form.Item>
                );
            }

            case 'minimumAge':
            case 'maximumAge': {
                return (
                    <Form.Item {...getDefaultProps(dataIndex)}>
                        <InputNumber min={0} max={200} style={{ width: '100%' }} />
                    </Form.Item>
                );
            }

            case 'periodOfDayText': {
                const validDataIndex = dataIndex.replace('Text', '');

                return (
                    <Form.Item {...getDefaultProps(validDataIndex)}>
                        <FlowPeriodOfDaySelector initialValue={record[validDataIndex]} onChange={() => {}} />
                    </Form.Item>
                );
            }

            case 'description': {
                return (
                    <Form.Item {...getDefaultProps(dataIndex)}>
                        <Input />
                    </Form.Item>
                );
            }

            case 'triggerText': {
                const validDataIndex = dataIndex.replace('Text', '');

                return (
                    <Form.Item {...getDefaultProps(validDataIndex)}>
                        <FlowTriggerSelector
                            maxTagCount={1}
                            initialValue={record[validDataIndex]}
                            onChange={() => {}}
                        />
                    </Form.Item>
                );
            }

            default: {
                const validDataIndex = dataIndex + 'Id';

                return (
                    <Form.Item {...getDefaultProps(validDataIndex)}>
                        <EntitySelector
                            maxTagCount={1}
                            initialValue={record[validDataIndex]}
                            entities={[...entities]}
                            onChange={() => {}}
                        />
                    </Form.Item>
                );
            }
        }
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                {dataIndex === 'stepText' || dataIndex === 'opposeStepText' ? (
                    <Wrapper margin='0 0 10px 0' width='250px'>
                        <FlowStepSelector
                            key={`${dataIndex} ${searchFilterFlow[dataIndex]?.length}`}
                            initialValue={searchFilterFlow[dataIndex] ?? []}
                            onChange={(value) => {
                                const newSearchFilter = {
                                    ...searchFilterFlow,
                                    [dataIndex]: value,
                                };

                                setSearchFilterFlow(newSearchFilter);
                            }}
                        />
                    </Wrapper>
                ) : dataIndex === 'typeText' ? (
                    <Wrapper margin='0 0 10px 0' width='250px'>
                        <FlowTypeSelectorMulti
                            key={`${dataIndex} ${searchFilterFlow[dataIndex]?.length}`}
                            initialValue={searchFilterFlow[dataIndex] ?? []}
                            onChange={(value) => {
                                const newSearchFilter = {
                                    ...searchFilterFlow,
                                    [dataIndex]: value,
                                };

                                setSearchFilterFlow(newSearchFilter);
                            }}
                        />
                    </Wrapper>
                ) : (
                    <>
                        <Input.Search
                            placeholder={`${getTranslation('Search')} ${getTranslation(dataIndex)}`}
                            value={selectedKeys[0]}
                            key={selectedKeys[0]}
                            allowClear
                            autoFocus
                            enterButton
                            onSearch={(value) => searchEntities(dataIndex, value)}
                            onChange={(e) => {
                                setSelectedKeys(e.target.value ? [e.target.value] : []);
                                if (!e.target.value) {
                                    confirm({ closeDropdown: false });
                                }
                            }}
                            onPressEnter={() => searchEntities(dataIndex, selectedKeys)}
                            style={{ width: 288, marginBottom: 10, display: 'block' }}
                        />

                        {selectedKeys[0] && searchedEntities.length ? (
                            <Wrapper
                                flexBox
                                flexDirection='column'
                                maxHeight='100px'
                                overflowY='auto'
                                margin='0 8px'
                                padding='3px 0'
                            >
                                {searchedEntities.map((entitie) => {
                                    const entitieSelected =
                                        searchFilterFlow[dataIndex] &&
                                        searchFilterFlow[dataIndex].find((value) => value.value === entitie._id);
                                    if (entitieSelected) {
                                        return;
                                    }
                                    return (
                                        <Checkbox
                                            style={{ margin: 0, display: 'flex', alignItems: 'center' }}
                                            onChange={() => {
                                                const newSearchEntities = searchFilterFlow[dataIndex] || [];
                                                const newSearchFilter = {
                                                    ...searchFilterFlow,
                                                    [dataIndex]: [
                                                        ...newSearchEntities,
                                                        {
                                                            name: entitie?.friendlyName || entitie.name,
                                                            value: entitie._id,
                                                        },
                                                    ],
                                                };

                                                setSearchFilterFlow(newSearchFilter);
                                            }}
                                        >
                                            <div
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    width: '200px',
                                                }}
                                                title={entitie?.friendlyName || entitie.name}
                                            >
                                                {entitie?.friendlyName || entitie.name}
                                            </div>
                                        </Checkbox>
                                    );
                                })}
                            </Wrapper>
                        ) : null}

                        <Divider
                            style={{
                                margin: '8px 0',
                                width: 'max-content',
                                fontSize: '13px',
                                fontWeight: 'bold',
                            }}
                            orientation={'left'}
                        >{`${searchFilterFlow[dataIndex]?.length ?? 0} ${getTranslation(
                            dataIndex
                        )} selecionados`}</Divider>

                        {searchFilterFlow && searchFilterFlow[dataIndex]?.length ? (
                            <Wrapper
                                flexBox
                                flexDirection='column'
                                maxHeight='100px'
                                overflowY='auto'
                                margin='0 8px 8px'
                            >
                                {searchFilterFlow[dataIndex]?.map((entitie) => {
                                    return (
                                        <Checkbox
                                            checked
                                            style={{ margin: 0, display: 'flex', alignItems: 'center' }}
                                            onChange={() => {
                                                const newSearchFilter = searchFilterFlow[dataIndex].filter(
                                                    (value) => value.value !== entitie.value
                                                );
                                                setSearchFilterFlow({
                                                    ...searchFilterFlow,
                                                    [dataIndex]: newSearchFilter,
                                                });
                                            }}
                                        >
                                            <div
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    width: '200px',
                                                }}
                                                title={entitie.name}
                                            >
                                                {entitie.name}
                                            </div>
                                        </Checkbox>
                                    );
                                })}
                            </Wrapper>
                        ) : null}
                    </>
                )}
                <ButtonStyled
                    onClick={() => handleReset(clearFilters, dataIndex, confirm)}
                    size='small'
                    style={{ width: 90 }}
                >
                    <span style={{ color: '#696969' }}>{getTranslation('Reset')}</span>
                </ButtonStyled>
                <ButtonStyled
                    type='primary'
                    disabled={searchFilterFlow[dataIndex]?.length ? false : true}
                    onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    size='small'
                    color={!searchFilterFlow[dataIndex]?.length}
                    style={{ width: 90, marginLeft: 8 }}
                >
                    {getTranslation('Apply')}
                </ButtonStyled>
            </div>
        ),
        filterIcon: (filtered) => (
            <AiOutlineSearch
                style={{
                    fontSize: '15px',
                    color:
                        filtered ||
                        (dataIndex === 'stepText' && filters.search?.includes('step')) ||
                        (dataIndex === 'opposeStepText' && filters.search?.includes('opposeStep')) ||
                        (dataIndex === 'typeText' && filters.search?.includes('type')) ||
                        filters.search?.includes(dataIndex)
                            ? '#1890ff'
                            : undefined,
                }}
            />
        ),
        onFilterDropdownVisibleChange: (visible) => {
            if (!visible) {
                setSearchedEntities([]);
            }
        },
    });

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchedEntities([]);
        let search: SearchFilter = {
            $and: [],
        };
        Object.keys(searchFilterFlow)?.forEach((key) => {
            if (!searchFilterFlow[key].length) return;

            if (key === 'stepText') {
                search.$and.push({
                    step: {
                        $in: searchFilterFlow[key].map((value) => `${value}`),
                    },
                });
                return;
            }
            if (key === 'opposeStepText') {
                search.$and.push({
                    opposeStep: {
                        $in: searchFilterFlow[key].map((value) => `${value}`),
                    },
                });
                return;
            }
            if (key === 'typeText') {
                search.$and.push({
                    type: {
                        $in: searchFilterFlow[key].map((value) => `${value}`),
                    },
                });
                return;
            }
            search.$and.push({
                [`${key}Id`]: {
                    $in: searchFilterFlow[key].map((value) => `${value.value}`),
                },
            });
        });

        if (!search.$and.length) {
            return setFilters({ ...filters, skip: 0, search: undefined });
        }
        setFilters({ ...filters, skip: 0, search: JSON.stringify(search) });
    };

    const handleReset = (clearFilters, dataIndex, confirm) => {
        clearFilters();
        confirm({ closeDropdown: false });
        if (searchFilterFlow[dataIndex]) {
            const newSearchFilter = { ...searchFilterFlow, [dataIndex]: [] };
            setSearchFilterFlow({ ...searchFilterFlow, [dataIndex]: [] });
            let search: SearchFilter = {
                $and: [],
            };
            Object.keys(newSearchFilter)?.forEach((key, index, array) => {
                if (!newSearchFilter[key].length) return;

                if (key === 'stepText') {
                    search.$and.push({
                        step: {
                            $in: newSearchFilter[key].map((value) => `${value}`),
                        },
                    });
                    return;
                }
                if (key === 'opposeStepText') {
                    search.$and.push({
                        opposeStep: {
                            $in: newSearchFilter[key].map((value) => `${value}`),
                        },
                    });
                    return;
                }
                if (key === 'typeText') {
                    search.$and.push({
                        type: {
                            $in: newSearchFilter[key].map((value) => `${value}`),
                        },
                    });
                    return;
                }
                search.$and.push({
                    [`${key}Id`]: {
                        $in: newSearchFilter[key].map((value) => `${value.value}`),
                    },
                });
            });

            if (!search.$and.length) {
                return setFilters({ ...filters, search: undefined });
            }

            setFilters({ ...filters, search: JSON.stringify(search) });
        }
    };

    const searchEntities = async (entityType, search) => {
        if (!search) {
            setSearchedEntities([]);
            return;
        }

        const response = await HealthService.getHealthEntities({
            workspaceId: workspaceId,
            integrationId: integration._id as string,
            entityType: entityType,
            search: search,
            skip: 0,
            sort: 'name, friendlyName',
        });

        if (response) {
            setSearchedEntities(response.data);
        }
    };

    const getEntityName = (entityType: HealthEntityType, ids: string[] | undefined) => {
        if (!ids?.length || !Object.values(entities).length) {
            return '-';
        }
        const filterIds = ids.filter((id) => id === entities[entityType]?.find((entity) => entity._id === id)?._id);

        const firstEntity = entities[entityType]?.find((entity) => entity._id === filterIds[0]);

        if (!firstEntity) {
            return '-';
        }

        if (filterIds?.length > 1) {
            return `${firstEntity?.name} ..+${filterIds.length - 1}`;
        }

        return `${firstEntity?.name}`;
    };

    const getStepsName = (entityTypes: HealthFlowSteps[] | undefined) => {
        if (!entityTypes?.length) {
            return '-';
        }

        const firstEntityName = getTranslation(entityTypes[0]);

        if (entityTypes?.length > 1) {
            return `${firstEntityName} ..+${entityTypes.length - 1}`;
        }

        return `${firstEntityName}`;
    };

    const getTriggerName = (entityTypes: FlowTriggerType[] | undefined) => {
        if (!entityTypes?.length) {
            return '-';
        }

        const firstEntityName = getTranslation(entityTypes[0]);

        if (entityTypes?.length > 1) {
            return `${firstEntityName} ..+${entityTypes.length - 1}`;
        }

        return `${firstEntityName}`;
    };

    const getPeriodOfDayText = (value: number | undefined) => {
        return value === undefined ? undefined : getTranslation(FlowPeriodOfDay?.[value] ?? '');
    };

    const cpfsText = (value?: string[]) => {
        if (!value?.length || !value) {
            return '';
        }

        if (value.length === 1) {
            return value[0];
        }

        return value[0] + ' ..+' + (value.length - 1);
    };

    const notPublishedFlow = (createdAt: number = 0, updatedAt: number = 0) => {
        const { lastPublishFlow, lastPublishFlowDraft } = integration;
        return (
            (lastPublishFlowDraft || 0) > (lastPublishFlow || 0) &&
            ((lastPublishFlow || 0) < updatedAt || (lastPublishFlow || 0) < createdAt)
        );
    };

    const notPublishedDraftFlow = (createdAt: number = 0, updatedAt: number = 0) => {
        const { lastPublishFlow, lastPublishFlowDraft } = integration;
        return (
            (lastPublishFlowDraft || lastPublishFlow || 0) < updatedAt ||
            (lastPublishFlowDraft || lastPublishFlow || 0) < createdAt
        );
    };

    useEffect(() => {
        setData(
            flows.reduce<any[]>((acc, flow) => {
                const data: { [key: string]: any } = {
                    ...flow,
                    key: flow._id,
                    _id: flow._id,
                    stepText: getStepsName(flow.step),
                    opposeStepText: getStepsName(flow.opposeStep),
                    triggerText: getTriggerName(flow.trigger),
                    typeText: {
                        type: getTranslation(flow.type),
                        inactive: flow?.inactive,
                    },
                    periodOfDayText: getPeriodOfDayText(flow.periodOfDay),
                    sex: flow?.sex,
                    cpfsText: cpfsText(flow.cpfs),
                    description: flow?.description,
                };

                integration.entitiesFlow.forEach((entityType) => {
                    data[entityType] = getEntityName(entityType, flow[entityToId(entityType)]);
                    const dataEntityId = flow[entityToId(entityType)]?.filter(
                        (id) => id === entities[entityType]?.find((entity) => entity._id === id)?._id
                    );
                    data[entityToId(entityType)] = dataEntityId;
                });

                return [...acc, data];
            }, [])
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flows, entities]);

    const isEditing = (record) => record.key === editingKey;

    const getExecutingFlowIcon = (record) => {
        const props: IconBaseProps = {};
        let flowTimeText = '';

        if (record.executeUntil) {
            if (record.runBetweenStart && record.runBetweenEnd) {
                const startTime = moment.utc(0).add(record.runBetweenStart, 'ms').format('HH:mm');
                const endTime = moment.utc(0).add(record.runBetweenEnd, 'ms').format('HH:mm');
                flowTimeText = `, ${getTranslation('with execution time of')} ${startTime} ${getTranslation(
                    'to'
                )} ${endTime}`;
            }

            if (record.executeUntil > Date.now()) {
                props.style = { color: '#2bbb2b' };
                props.title = `${getTranslation('Flow executing until')} ${moment(record.executeUntil).format(
                    'DD/MM/YYYY [às] HH:mm'
                )}${flowTimeText}`;
            } else {
                props.style = { color: '#f8892a' };
                props.title = `${getTranslation('Flow executed until')} ${moment(record.executeUntil).format(
                    'DD/MM/YYYY [às] HH:mm'
                )}${flowTimeText}`;
            }

            return <MdOutlineTimer {...props} />;
        }

        if (record.runBetweenStart && record.runBetweenEnd) {
            const startTime = moment.utc(0).add(record.runBetweenStart, 'ms').format('HH:mm');
            const endTime = moment.utc(0).add(record.runBetweenEnd, 'ms').format('HH:mm');

            flowTimeText = `${getTranslation('Flow with execution time of')} ${startTime} ${getTranslation(
                'to'
            )} ${endTime}`;

            props.style = { color: '#1276b9' };
            props.title = flowTimeText;

            return <MdOutlineTimer {...props} />;
        }

        return null;
    };

    const columns: any[] = [
        {
            title: (
                <Wrapper>
                    {getTranslation('Type')}{' '}
                    <SortIcon
                        active={filters?.sort === '-type'}
                        onClick={() => {
                            if (filters?.sort) {
                                setFilters({ ...filters, skip: 0, sort: '' });
                                return;
                            }
                            setFilters({ ...filters, skip: 0, sort: '-type' });
                        }}
                    />
                </Wrapper>
            ),
            dataIndex: 'typeText',
            width: '90px',
            editable: true,
            ...getColumnSearchProps('typeText'),
            render(obj, record) {
                const notPublishedDraft = notPublishedDraftFlow(record.createdAt, record.updatedAt);
                const notPublished = notPublishedFlow(record.createdAt, record.updatedAt);

                return {
                    props: {
                        style: {
                            borderLeft: notPublishedDraft
                                ? '3px solid #e0ae00'
                                : notPublished
                                ? '3px solid #ff8000'
                                : record?.inactive
                                ? '3px solid #555'
                                : 'none',
                            background: '#fbfbfb',
                        },
                    },
                    children: (
                        <div>
                            {obj?.type} {getExecutingFlowIcon(record)}
                        </div>
                    ),
                };
            },
        },
        {
            title: getTranslation('Step'),
            dataIndex: 'stepText',
            width: '190px',
            editable: true,
            ...getColumnSearchProps('stepText'),
            render(text) {
                return {
                    props: {
                        style: {
                            background: '#fbfbfb',
                        },
                    },
                    children: <div>{text}</div>,
                };
            },
        },
        {
            title: getTranslation('opposeStepText'),
            dataIndex: 'opposeStepText',
            width: '190px',
            editable: true,
            ...getColumnSearchProps('opposeStepText'),
            render(text) {
                return {
                    props: {
                        style: {
                            background: '#fbfbfb',
                        },
                    },
                    children: <div>{text}</div>,
                };
            },
        },
        ...integration.entitiesFlow.map((entityType) => ({
            title: getTranslation(entityType),
            dataIndex: entityType,
            width: entityType === HealthEntityType.appointmentType ? '160px' : columnWidth,
            editable: true,
            ...getColumnSearchProps(entityType),
        })),
        {
            title: getTranslation('Trigger'),
            dataIndex: 'triggerText',
            width: '190px',
            editable: true,
        },
        {
            title: getTranslation('Minimum age'),
            dataIndex: 'minimumAge',
            width: '110px',
            editable: true,
        },
        {
            title: getTranslation('Maximum age'),
            dataIndex: 'maximumAge',
            width: '110px',
            editable: true,
        },
        {
            title: getTranslation('Period of day'),
            dataIndex: 'periodOfDayText',
            width: '120px',
            editable: true,
        },
        {
            title: getTranslation('Genre'),
            dataIndex: 'sex',
            width: '120px',
        },
        {
            title: (
                <div
                    style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    title={getTranslation('Blocked patient cpfs')}
                >
                    {getTranslation('Blocked patient cpfs')}
                </div>
            ),
            dataIndex: 'cpfsText',
            width: '130px',
        },
        {
            title: getTranslation('Description'),
            dataIndex: 'description',
            width: '160px',
            ellipsis: true,
            editable: true,
        },
        {
            fixed: 'right',
            width: '70px',
            dataIndex: 'operation',
            render: (_, record) => {
                const editable = isEditing(record);
                const dataItem = data.find((item) => item._id === record.key || item.key === record.key);

                const items: MenuProps['items'] = [
                    {
                        key: '1',
                        label: getTranslation('Delete'),
                        onClick: () => setModalDeleteFlow(record.key),
                    },
                    {
                        key: '2',
                        label: record?.inactive ? getTranslation('Active flow') : getTranslation('Inactivate flow'),
                        onClick: () => {
                            updateFlowOnModal({
                                ...record,
                                inactive: !record?.inactive || false,
                            });
                        },
                    },
                    {
                        key: '3',
                        label: getTranslation('Clone flow'),
                        onClick: () => {
                            setFlowActionsEdit({
                                ...record,
                                updatedAt: undefined,
                                createdAt: undefined,
                                _id: undefined,
                                key: undefined,
                            } as HealthFlow);
                            handleAddFlow();
                        },
                    },
                    {
                        key: '4',
                        label: getTranslation('Edit in modal'),
                        onClick: () => {
                            const flow = flows.find((flow) => flow._id === record._id);
                            if (!flow) return;

                            setFlowActionsEdit(flow);
                            setModalEditFlowOpen(true);
                        },
                    },
                ];

                return editable ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Popconfirm title={getTranslation('Confirm cancellation')} onConfirm={() => cancel()}>
                            <CancelIcon
                                title={getTranslation('cancel')}
                                onClick={() => {
                                    if (record.iid) {
                                        setData((prevState) => [
                                            ...prevState.filter((item) => item.key !== record.key),
                                        ]);
                                    }
                                    cancel();
                                }}
                            />
                        </Popconfirm>
                        <SaveIcon
                            title={getTranslation('Save')}
                            onClick={() => {
                                save(record);
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <EditIcon title={getTranslation('Edit')} onClick={() => edit(record.key)} />
                        {dataItem?.type === FlowType.action && (
                            <ActionsIcon
                                title={getTranslation('Edit actions')}
                                onClick={() => {
                                    setFlowActionsEdit(record);
                                    setModalActionOpen(true);
                                }}
                            />
                        )}
                        <Dropdown menu={{ items }} placement='topRight' trigger={['click']}>
                            <OptionsIcon onClick={() => {}} />
                        </Dropdown>
                    </div>
                );
            },
        },
    ];

    const edit = (key: string) => setEditingKey(key);

    const handleDelete = (key: string) => {
        const item = data.find((item) => key === item.key);

        setData((prevState) => [...prevState.filter((item) => item.key !== key)]);
        setFilters({ ...filters, total: filters.total - 1 });
        setModalDeleteFlow(undefined);
        deleteFlow(item._id);
    };

    const cancel = () => {
        setEditingKey('');
        creatingFlow && cancelCreatingFlow();
    };

    const save = async (record) => {
        const row = await form.getFieldsValue();

        if (row?.type === FlowType.correlation) {
            delete row?.step;
            delete row?.opposeStep;
        }

        if (Object.values(omit(row, ['type'])).every((value) => !value || !value.length)) {
            addNotification({
                message: getTranslation('At least one of the fields must be filled in!'),
                title: getTranslation('Error'),
                type: 'warning',
            });
            return;
        }

        const newData = [...data];
        const index = newData.findIndex((item) => record.key === item.key);
        const item = newData[index];
        let newFlow = flows;

        if (index > -1) {
            // se existe id temporario deve criar o flow
            if (!!newData[index].iid) {
                const createdFlow = await onCreateFlow({
                    ...row,
                    actions: item.actions,
                });

                if (createdFlow) {
                    item._id = createdFlow._id;
                    item.iid = undefined;

                    newFlow.splice(index, 1, createdFlow);
                    setFlows(newFlow);
                    setFilters({ ...filters, total: filters.total + 1 });
                }
            } else {
                onUpdateFlow({
                    ...row,
                    _id: item._id,
                    actions: item.actions,
                    updatedAt: +new Date(),
                });
                let updatedFlow = newFlow.find((flow) => flow?._id === item?._id);
                if (updatedFlow) {
                    newFlow.splice(index, 1, { ...updatedFlow, ...row, updatedAt: +new Date() });
                    setFlows(newFlow);
                }
            }

            newData.splice(index, 1, {
                ...item,
                ...row,
                ...integration.entitiesFlow.reduce((acc, entityType) => {
                    acc[entityType] = getEntityName(entityType, row[entityToId(entityType)]);
                    return acc;
                }, {}),
                typeText: {
                    type: getTranslation(row.type),
                    inactive: false,
                },
                stepText: getStepsName(row.step),
                opposeStepText: getStepsName(row.opposeStep),
                triggerText: getTriggerName(row.trigger),
                periodOfDayText: getPeriodOfDayText(row.periodOfDay),
                sex: row.sex,
                cpfsText: cpfsText(row.cpfs),
                description: row.description,
                updatedAt: +new Date(),
            });
            setData([...newData]);
            setEditingKey('');
            cancelCreatingFlow();
        }
    };

    const updateFlowOnModal = (values) => {
        const newData = [...data];
        const index = newData.findIndex((item) => values._id === item._id);
        const item = newData[index];
        let newFlow = flows;

        newData.splice(index, 1, {
            ...item,
            ...values,
            ...integration.entitiesFlow.reduce((acc, entityType) => {
                acc[entityType] = getEntityName(entityType, values[entityToId(entityType)]);
                return acc;
            }, {}),
            typeText: {
                type: getTranslation(values.type),
                inactive: false,
            },
            stepText: getStepsName(values.step),
            opposeStepText: getStepsName(values.opposeStep),
            triggerText: getTriggerName(values.trigger),
            periodOfDayText: getPeriodOfDayText(values.periodOfDay),
            sex: values.sex,
            cpfsText: cpfsText(values.cpfs),
            description: values.description,
            updatedAt: +new Date(),
        });
        onUpdateFlow(values);

        let updatedFlow = newFlow.find((flow) => flow?._id === item?._id);
        if (updatedFlow) {
            newFlow.splice(index, 1, { ...updatedFlow, ...values, updatedAt: +new Date() });
            setFlows(newFlow);
        }

        setData([...newData]);
        setModalEditFlowOpen(false);
        setFlowActionsEdit(undefined);
    };

    const components = {
        body: {
            cell: EditableCell,
        },
    };

    const renderedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => {
                return {
                    record,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: isEditing(record),
                    entities: entities[col.dataIndex] ?? [],
                };
            },
        };
    });

    // adicionar no inicio da pagina
    const handleAdd = (clone?: boolean) => {
        const tempKey = v4();

        if (clone) {
            setData((prevState) => {
                if (prevState?.length === 10) {
                    prevState.splice(9, 1);
                }
                return [
                    {
                        ...flowActionsEdit,
                        key: tempKey,
                        iid: tempKey,
                    },
                    ...prevState,
                ];
            });
            setFlowActionsEdit(undefined);
        } else {
            setData((prevState) => {
                if (prevState?.length === 10) {
                    prevState.splice(9, 1);
                }
                return [
                    {
                        key: tempKey,
                        integrationId: integration._id,
                        workspaceId,
                        iid: tempKey,
                        type: FlowType.action,
                        actions: [],
                        minimumAge: null,
                        maximumAge: null,
                        cpfs: [],
                    },
                    ...prevState,
                ];
            });
        }
        setEditingKey(tempKey);
    };

    useEffect(() => {
        if (creatingFlow) {
            if (flowActionsEdit) {
                return handleAdd(true);
            }
            handleAdd();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creatingFlow]);

    const handleUpdateActions = (id: string, actions: FlowAction[]) => {
        const flow = flows.find((flow) => flow._id === id);

        if (!flow) return;

        updateFlowOnModal({ ...flow, actions });
    };

    return (
        <Form form={form} preserve={false} component={false}>
            <ModalConfirm
                isOpened={modalDeleteFlow ? true : false}
                onAction={(action: any) => {
                    if (action) {
                        handleDelete(modalDeleteFlow as string);
                    }
                    setModalDeleteFlow(undefined);
                }}
            >
                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                <p style={{ margin: '10px 0px 17px' }}>{getTranslation('Are you sure you want to delete the flow?')}</p>
            </ModalConfirm>
            {modalActionOpen && !modalEditFlowOpen && (
                <ModalEditFlowAction
                    isOpened={modalActionOpen}
                    onClose={() => {
                        setModalActionOpen(false);
                        setFlowActionsEdit(undefined);
                    }}
                    flow={flowActionsEdit as HealthFlow}
                    onActionsChanged={handleUpdateActions}
                    workspaceId={workspaceId}
                />
            )}
            {modalEditFlowOpen && !modalActionOpen && (
                <ModalEditFlow
                    integrationType={integration.type}
                    isOpened={modalEditFlowOpen}
                    onClose={() => {
                        setModalEditFlowOpen(false);
                        setFlowActionsEdit(undefined);
                    }}
                    flow={flowActionsEdit as HealthFlow}
                    updateFlow={updateFlowOnModal}
                    entities={entities}
                    fields={columns.filter((field) => field.dataIndex !== 'operation').map((field) => field.dataIndex)}
                />
            )}
            <>
                <CustomTable
                    scroll={{ x: 1400 }}
                    components={components}
                    expandable={{
                        expandedRowRender: (record: any) => (
                            <p style={{ margin: 0 }}>{`${getTranslation('Description')}: ${
                                record?.description ?? ''
                            }`}</p>
                        ),
                        rowExpandable: (record: any) => !!(record?.description || ''),
                    }}
                    rowClassName={(record: any, index) => {
                        const notPublishedDraft = notPublishedDraftFlow(record.createdAt, record.updatedAt);
                        const notPublished = notPublishedFlow(record.createdAt, record.updatedAt);
                        return (notPublishedDraft || notPublished) && record.inactive ? 'inactiveFlow' : '';
                    }}
                    bordered
                    loading={loading}
                    dataSource={data}
                    columns={renderedColumns}
                    pagination={
                        filters.total > 10 && {
                            total: filters.total,
                            pageSize: filters.limit,
                            current: filters.currentPage,
                            onChange: (page, pageSize) => {
                                if (page === 1 && filters.skip === 0) {
                                    return;
                                }
                                // remove itens em criação se mudar a página
                                getFlows({
                                    ...filters,
                                    limit: pageSize,
                                    skip: (page - 1) * pageSize,
                                });
                                cancel();
                            },
                            showSizeChanger: true,
                            pageSizeOptions: pageSizeOptions.map(String),
                            onShowSizeChange: (_current, size) => {
                                getFlows({
                                    ...filters,
                                    limit: size,
                                    skip: 0,
                                });
                                cancel();
                            },
                        }
                    }
                />
                <Wrapper flexBox alignItems='center'>
                    <Wrapper borderLeft='3px solid #555' padding='0 0 0 10px' margin='10px 0 5px 0'>
                        {getTranslation('Flow inactive.')}
                    </Wrapper>
                    <Wrapper borderLeft='3px solid #e0ae00' padding='0 0 0 10px' margin='5px 0 5px 15px'>
                        {getTranslation('Unpublished change')}
                    </Wrapper>
                    <Wrapper borderLeft='3px solid #ff8000' padding='0 0 0 10px' margin='5px 0 5px 15px'>
                        {getTranslation('Change not published for production')}
                    </Wrapper>
                </Wrapper>
            </>
        </Form>
    );
};

export default i18n(FlowTable) as FC<FlowTableProps>;
