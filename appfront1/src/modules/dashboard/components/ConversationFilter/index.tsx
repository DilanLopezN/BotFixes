import { InfoCircleOutlined } from '@ant-design/icons';
import { Form as AntdForm, Button, Col, Popover, Row, Select, Space, Switch, Tabs, Tooltip } from 'antd';
import { Form, Formik } from 'formik';
import moment from 'moment';
import { FC, useEffect, useRef, useState } from 'react';
import { TbFilterX } from 'react-icons/tb';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import DateRangePicker from 'rsuite/DateRangePicker';
import 'rsuite/dist/rsuite.css';
import locale from 'rsuite/locales/pt_BR';
import DownloadModal from '../../../../shared/DownloadModal';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { channelToLabel } from '../../../../utils/ChannelToLabel';
import { Constants } from '../../../../utils/Constants';
import getDefaultTags from '../../../../utils/default-tags';
import { timeout } from '../../../../utils/Timer';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import SelectInterval from '../SelectInterval';
import { PatientTable } from '../TabUsers/components/PatientTable';
import { PatientTableRef } from '../TabUsers/components/PatientTable/interfaces';
import UsersDateTable from '../TabUsers/components/UsersDateTable';
import { ConversationFilterInterface, FilterSelect, FiltersProps } from './props';

const { Option } = Select;

export const ConversationFilterIntervals: { [key: string]: { key: string; name: string } } = {
    days: { key: '1d', name: 'Day' },
    weeks: { key: '1w', name: 'Week' },
    months: { key: '1M', name: 'Months' },
};

export const ConversationFilterIntervalsHour: { [key: string]: { key: string; name: string } } = {
    hours: { key: '1h', name: 'Hour' },
    days: { key: '1d', name: 'Day' },
    weeks: { key: '1w', name: 'Week' },
    months: { key: '1M', name: 'Months' },
};

export const ConversationFilterIntervalsGraphics: { [key: string]: { key: string; name: string } } = {
    hours: { key: '1h', name: 'Hour' },
    days: { key: '1d', name: 'Day' },
    weeks: { key: '1w', name: 'Week' },
    months: { key: '1M', name: 'Months' },
    none: { key: '1C', name: 'None' },
};

export const getDefaultFilter = (workspaceId): ConversationFilterInterface => {
    const localStorageFilter = getAppliedFilters();
    const defaultStartDate = moment().startOf('day').subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss');
    const defaultEndDate = moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    if (localStorageFilter?.[workspaceId]) {
        return {
            ...localStorageFilter[workspaceId],
            workspaceId,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
        };
    }
    return {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        interval: '',
        channelId: '',
        conversationsWith: 'all',
        tags: [],
        teamIds: [],
        workspaceId,
        omitInvalidNumber: true,
    };
};

const adjustmentValues = (values, isValid: boolean) => {
    let tags: string[] = [];
    values.map((entity) => {
        if (entity.value) {
            tags.push(entity.value);
        }
    });
    return tags;
};

const localStorageConversationFilterToken = Constants.LOCAL_STORAGE_MAP.DASHBOARD_FILTER;

const getAppliedFilters = () => {
    const filterSelected = localStorage.getItem(localStorageConversationFilterToken);
    if (typeof filterSelected !== 'string') {
        localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.DASHBOARD_FILTER);
        return {};
    }
    const removeLocal = () => localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.DASHBOARD_FILTER);

    try {
        const obj = JSON.parse(filterSelected);
        if (obj && typeof obj === 'object' && obj !== null) {
            const parsedFilters = JSON.parse(filterSelected);
            return parsedFilters;
        }
    } catch (err) {
        removeLocal();
    }
    return {};
};

const ConversationFilter: FC<FiltersProps & I18nProps> = (props) => {
    const {
        getTranslation,
        selectedWorkspace,
        onSubmit,
        initialFilter,
        teams,
        loggedUser,
        disable,
        showAgentsTabs = false,
    } = props;

    const [filter, setFilter] = useState<ConversationFilterInterface>(getDefaultFilter(selectedWorkspace?._id));
    const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
    const [disableSelectTags, setDisableSelectTags] = useState(true);
    const [activeTab, setActiveTab] = useState('1');
    const [shouldDownloadUsersTable, setShouldDownloadUsersTable] = useState(false);
    const [selectedInterval, setSelectedInterval] = useState<string>('1d');
    const [downloadType, setDownloadType] = useState<string>('CSV');
    const patientTableRef = useRef<PatientTableRef>(null);
    const isDisabledTags = disableSelectTags && disable;

    const getWorkspaceTags = async () => {
        if (!selectedWorkspace) return;

        const remiEnabled = selectedWorkspace?.userFeatureFlag?.enableRemi;

        const defaultTags = getDefaultTags(selectedWorkspace._id).filter((tag) => {
            if (['@remi.assume', '@remi.finaliza'].includes(tag.name)) {
                return remiEnabled;
            }
            return true;
        });

        const response = await WorkspaceService.workspaceTags(selectedWorkspace._id);
        const dynamicTags = response?.data ?? [];

        setWorkspaceTags([...defaultTags, ...dynamicTags]);
    };

    const tagsToLabel = () => {
        return workspaceTags.map((tag) => ({
            label: tag.name,
            value: tag.name,
        }));
    };

    const conversationMemberTypeOptions = () => {
        return [
            {
                label: getTranslation('All'),
                value: 'all',
            },
            {
                label: getTranslation('unfinished'),
                value: 'not_closed',
            },
            {
                label: getTranslation('Agent'),
                value: 'agent',
            },
            {
                label: getTranslation('Bot'),
                value: 'bot',
            },
        ];
    };

    const saveFilters = (filters: ConversationFilterInterface) => {
        if (selectedWorkspace) {
            const replFilter: FilterSelect = {
                ...getAppliedFilters(),
                [selectedWorkspace._id]: {
                    ...filters,
                    startDate: undefined,
                    endDate: undefined,
                },
            };
            localStorage.setItem(localStorageConversationFilterToken, JSON.stringify(replFilter));
            onSubmit(filters);
        }
    };

    const clearFilter = () => {
        if (selectedWorkspace) {
            const replFilter: FilterSelect = {
                ...getAppliedFilters(),
            };
            delete replFilter[selectedWorkspace._id];
            localStorage.setItem(localStorageConversationFilterToken, JSON.stringify(replFilter));
        }
        setFilter({ ...initialFilter });
        onSubmit(filter);
    };

    const disabledDate = (current) => {
        return current && current > moment().endOf('day');
    };

    const handleDownload = async (downloadType: string): Promise<void> => {
        requestAnimationFrame(async () => {
            if (activeTab === '1' && patientTableRef.current) {
                await patientTableRef.current.handleDownload(downloadType);
            } else if (activeTab === '2') {
                setDownloadType(downloadType);
                setShouldDownloadUsersTable(true);
            }
        });
    };

    const handleUsersTableDownloadComplete = () => {
        setShouldDownloadUsersTable(false);
    };

    useEffect(() => {
        if (initialFilter) {
            setFilter(initialFilter);
        }
    }, [initialFilter]);

    useEffect(() => {
        getWorkspaceTags();
    }, [selectedWorkspace]);

    return (
        <>
            {filter && (
                <Formik
                    initialValues={filter}
                    onSubmit={(values) => {
                        saveFilters(values);
                    }}
                    enableReinitialize
                    render={({ values, submitForm, setFieldValue, setFieldTouched, setValues }) => {
                        const handleClearFilters = () => {
                            clearFilter();
                            const newFilters = getDefaultFilter(selectedWorkspace?._id);
                            setValues(newFilters);
                            onSubmit(newFilters);
                        };
                        return (
                            <Form>
                                <Row justify={'space-between'} wrap={false}>
                                    <Col span={3}>
                                        <LabelWrapper label={getTranslation('Team')}>
                                            <Select
                                                mode='multiple'
                                                maxTagCount={1}
                                                allowClear
                                                showSearch
                                                style={{ width: '100%' }}
                                                placeholder={getTranslation('Select a team')}
                                                size='large'
                                                key='teamIds'
                                                disabled={!selectedWorkspace || disable}
                                                value={values.teamIds}
                                                filterOption={(input, option) => {
                                                    if (!input) return true;
                                                    const team = teams.find(
                                                        (teamName) => teamName._id === option?.value
                                                    );
                                                    return team
                                                        ? team.name.toLowerCase().includes(input.toLowerCase())
                                                        : false;
                                                }}
                                                onChange={(value) => {
                                                    values.teamIds = value;
                                                    saveFilters(values);
                                                }}
                                            >
                                                {teams.map((team) => (
                                                    <Option value={team._id} key={team._id}>
                                                        {team.name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </LabelWrapper>
                                    </Col>
                                    <Col>
                                        <LabelWrapper label={getTranslation('Select period')}>
                                            <DateRangePicker
                                                size='lg'
                                                ranges={[]}
                                                cleanable
                                                format={'dd/MM/yy'}
                                                placeholder={getTranslation('Select period')}
                                                character=' - '
                                                disabled={disable}
                                                shouldDisableDate={disabledDate}
                                                locale={locale.DateRangePicker}
                                                value={[new Date(values.startDate), new Date(values.endDate)]}
                                                onChange={(date) => {
                                                    if (!date?.[0] && !date?.[1]) {
                                                        date = [moment().toDate(), moment().toDate()];
                                                    }

                                                    const startDate = moment(date[0])
                                                        ?.startOf('day')
                                                        .format('YYYY-MM-DDTHH:mm:ss');
                                                    const endDate = moment(date[1])
                                                        ?.endOf('day')
                                                        .format('YYYY-MM-DDTHH:mm:ss');

                                                    setFieldValue('endDate', endDate);
                                                    setFieldValue('startDate', startDate);
                                                    values['startDate'] = startDate;
                                                    values['endDate'] = endDate;
                                                    timeout(submitForm, 100);
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={4}>
                                        <LabelWrapper label={getTranslation('Tags')}>
                                            <Select
                                                maxTagCount={1}
                                                allowClear
                                                size='large'
                                                mode='tags'
                                                style={{ width: '100%' }}
                                                disabled={isDisabledTags}
                                                placeholder={getTranslation('Filter tags')}
                                                value={values.tags}
                                                onChange={(selectedTags) => {
                                                    setFieldValue('tags', selectedTags);
                                                    values['tags'] = adjustmentValues(selectedTags, false);
                                                    timeout(() => {
                                                        submitForm();
                                                    }, 500);
                                                }}
                                                onBlur={() => setFieldTouched('tags')}
                                                onDropdownVisibleChange={(open) => {
                                                    setDisableSelectTags(!open);
                                                }}
                                            >
                                                {tagsToLabel().map((tag) => (
                                                    <Option key={tag.value} value={tag.value}>
                                                        {tag.label}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={3}>
                                        <LabelWrapper label={getTranslation('Channel')}>
                                            <Select
                                                showSearch
                                                style={{ width: '100%' }}
                                                placeholder={getTranslation('Select a channel')}
                                                size='large'
                                                key='channelId'
                                                disabled={!selectedWorkspace || disable}
                                                value={values.channelId || ''}
                                                onChange={(value) => {
                                                    values.channelId = value;
                                                    submitForm();
                                                }}
                                                filterOption={(input, option) =>
                                                    String(option?.label ?? '')
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase())
                                                }
                                            >
                                                <Select.Option value=''>{getTranslation('All')}</Select.Option>
                                                {channelToLabel(selectedWorkspace, loggedUser).map((item) => (
                                                    <Select.Option
                                                        value={item.value}
                                                        key={item.value}
                                                        label={item.label}
                                                    >
                                                        {item.label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={3}>
                                        <LabelWrapper label={getTranslation('Closed by')}>
                                            <Select
                                                style={{ width: '100%' }}
                                                placeholder={getTranslation('Select an option')}
                                                size='large'
                                                key='conversationsWith'
                                                disabled={!selectedWorkspace || disable}
                                                value={values.conversationsWith}
                                                onChange={(value) => {
                                                    values.conversationsWith = value;
                                                    submitForm();
                                                }}
                                            >
                                                {conversationMemberTypeOptions().map((interval) => (
                                                    <Select.Option value={interval.value} key={interval.value}>
                                                        {interval.label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={2}>
                                        <AntdForm.Item
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            label={getTranslation('Omit invalids')}
                                            tooltip={getTranslation('Omit calls with invalid numbers')}
                                        >
                                            <Switch
                                                onChange={() => {
                                                    if (values?.omitInvalidNumber === undefined) {
                                                        values['omitInvalidNumber'] = false;
                                                    } else {
                                                        values['omitInvalidNumber'] = !values.omitInvalidNumber;
                                                    }
                                                    submitForm();
                                                }}
                                                disabled={!selectedWorkspace || disable}
                                                checked={
                                                    values?.omitInvalidNumber === undefined ||
                                                    !!values?.omitInvalidNumber
                                                }
                                            />
                                        </AntdForm.Item>
                                    </Col>
                                    <Col span={2}>
                                        <LabelWrapper label=' '>
                                            <Popover content={getTranslation('Clear filters')} trigger='hover'>
                                                <Button
                                                    disabled={disable}
                                                    type='text'
                                                    icon={<TbFilterX size={24} />}
                                                    onClick={handleClearFilters}
                                                />
                                            </Popover>
                                        </LabelWrapper>
                                    </Col>
                                </Row>

                                {showAgentsTabs && (
                                    <div style={{ flexDirection: 'column' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '16px',
                                            }}
                                        >
                                            <Tabs defaultActiveKey='1' activeKey={activeTab} onChange={setActiveTab}>
                                                <Tabs.TabPane
                                                    tab={
                                                        <Space align='center'>
                                                            <span>{getTranslation('Performance Agents')}</span>
                                                            <Tooltip title={getTranslation('Navigate to article')}>
                                                                <a
                                                                    href='https://botdesigner.freshdesk.com/support/solutions/articles/69000869581-como-funcionam-as-métricas-do-gráfico-desempenho-agentes-'
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                >
                                                                    <InfoCircleOutlined />
                                                                </a>
                                                            </Tooltip>
                                                        </Space>
                                                    }
                                                    key='1'
                                                ></Tabs.TabPane>
                                                <Tabs.TabPane
                                                    tab={
                                                        <Space align='center'>
                                                            <span>{getTranslation('Attendances')}</span>
                                                            <Tooltip title={getTranslation('Navigate to article')}>
                                                                <a
                                                                    href='https://botdesigner.freshdesk.com/support/solutions/articles/69000869577-o-que-é-o-relatório-de-agentes-'
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                >
                                                                    <InfoCircleOutlined />
                                                                </a>
                                                            </Tooltip>
                                                        </Space>
                                                    }
                                                    key='2'
                                                ></Tabs.TabPane>
                                            </Tabs>

                                            <Space align='center'>
                                                {activeTab === '2' && (
                                                    <div style={{ maxWidth: '200px', minWidth: '200px' }}>
                                                        <SelectInterval
                                                            defaultValue={selectedInterval}
                                                            onChange={setSelectedInterval}
                                                        />
                                                    </div>
                                                )}
                                                <DownloadModal
                                                    isNotClosed={filter?.conversationsWith === 'not_closed'}
                                                    onDownload={handleDownload}
                                                    type='default'
                                                />
                                            </Space>
                                        </div>

                                        <>
                                            {selectedWorkspace && activeTab === '1' && (
                                                <PatientTable
                                                    ref={patientTableRef}
                                                    filters={filter}
                                                    selectedWorkspace={selectedWorkspace}
                                                    teams={teams}
                                                />
                                            )}
                                            {selectedWorkspace && activeTab === '2' && (
                                                <UsersDateTable
                                                    filter={filter}
                                                    selectedWorkspace={selectedWorkspace}
                                                    teams={teams}
                                                    shouldDownload={shouldDownloadUsersTable}
                                                    onDownloadComplete={handleUsersTableDownloadComplete}
                                                    propSelectedInterval={selectedInterval}
                                                    downloadType={downloadType}
                                                />
                                            )}
                                        </>
                                    </div>
                                )}
                            </Form>
                        );
                    }}
                />
            )}
        </>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export default i18n(withRouter(connect(mapStateToProps, null)(ConversationFilter)));
