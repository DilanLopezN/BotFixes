import { MenuProps, Select } from 'antd';
import { SelectValue } from 'antd/lib/select';
import { Form, Formik } from 'formik';
import { ConversationStatus, UserRoles } from 'kissbot-core';
import isArray from 'lodash/isArray';
import orderBy from 'lodash/orderBy';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import DateRangePicker from 'rsuite/DateRangePicker';
import 'rsuite/dist/rsuite.css';
import locale from 'rsuite/locales/pt_BR';
import { v4 } from 'uuid';
import { ChannelConfig } from '../../../../../../model/Bot';
import { PrimaryButton, Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { ColorType, ColorVariation, getColor } from '../../../../../../ui-kissbot-v2/theme';
import { channelToLabel } from '../../../../../../utils/ChannelToLabel';
import { Constants } from '../../../../../../utils/Constants';
import { GetFiltersUsersLocal } from '../../../../../../utils/GetFiltersUsersLocal';
import { timeout } from '../../../../../../utils/Timer';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import FormEditingFilters from './components/FormEditingFilters';
import { FilterConversationsFormProps } from './props';
import { ButtonSelect, Container, FieldWrapper } from './styles';

const { Option, OptGroup } = Select;

const FilterConversationsForm: FC<FilterConversationsFormProps & I18nProps> = ({
    onApplyFilters,
    appliedFilters,
    getTranslation,
    workspaceTags,
    workspaceTeams,
    workspaceChannelConfigs,
    users,
    qtdApplyFilters,
    workspaceId,
    userId,
    selectedWorkspace,
}) => {
    const [renderForm, setRenderForm] = useState(false);
    const [renderFormSaveFilter, setRenderFormSaveFilter] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterId, setFilterId] = useState(v4());
    const usersActive = [
        UserRoles.WORKSPACE_ADMIN,
        UserRoles.WORKSPACE_AGENT,
        UserRoles.SYSTEM_ADMIN,
        UserRoles.SYSTEM_CS_ADMIN,
        UserRoles.SYSTEM_UX_ADMIN,
        UserRoles.SYSTEM_DEV_ADMIN,
    ];

    const getFilterName = (values) => {
        const localUserFilters = GetFiltersUsersLocal();

        if (
            JSON.stringify(localUserFilters) === '{}' ||
            localUserFilters?.[workspaceId] === undefined ||
            localUserFilters?.[workspaceId]?.[userId] === undefined
        ) {
            return;
        }
        // eslint-disable-next-line array-callback-return
        const id: any = Object.keys(localUserFilters?.[workspaceId]?.[userId])?.find((id) => {
            if (JSON.stringify(localUserFilters?.[workspaceId]?.[userId]?.[id]?.filter) === JSON.stringify(values)) {
                return id;
            }
        });
        if (id) {
            setRenderFormSaveFilter(true);
            setFilterId(id);
            setFilterName(localUserFilters?.[workspaceId]?.[userId]?.[id]?.name);
            return;
        }
        setFilterName('');
        setFilterId(v4());
        if (!renderFormSaveFilter) {
            setRenderFormSaveFilter(false);
        }
    };
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    let channelIds = channelToLabel(selectedWorkspace, loggedUser);

    useEffect(() => {
        setRenderForm(false);
        getFilterName(appliedFilters.formValues);
        timeout(() => setRenderForm(true), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters, appliedFilters.formValues]);

    const onApply = (values: any) => {
        onApplyFilters(values);
    };

    const renderLabelsView = (values: any) => {
        return isArray(values)
            ? values.map((item) => ({
                  value: item,
                  label: item.charAt(0).toUpperCase() + item.slice(1),
              }))
            : [];
    };

    const renderLabelsViewChannelConfig = (values: ChannelConfig[]) => {
        return values.map((item) => ({
            value: item.token,
            label: item.name,
        }));
    };

    const stateOptions = [
        {
            label: getTranslation('open'),
            value: ConversationStatus.open,
        },
        {
            label: getTranslation('closed'),
            value: ConversationStatus.closed,
        },
    ];

    const suspendedOptions = () => {
        return [
            {
                label: getTranslation('Yes'),
                value: true,
            },
        ];
    };

    const transformTagLabels = () => {
        return workspaceTags
            ? orderBy(workspaceTags, 'name').map((tag) => ({
                  label: tag.name,
                  value: tag.name,
              }))
            : [];
    };

    const transformTeamLabels = () => {
        return workspaceTeams
            ? workspaceTeams.map((team) => ({
                  label: team.name,
                  value: team._id,
              }))
            : [];
    };

    const disabledDate = (current) => {
        return current && current > moment().endOf('day');
    };

    const deleteFilterUsersLocal = () => {
        let replFilter = { ...GetFiltersUsersLocal() };
        delete replFilter?.[workspaceId]?.[userId]?.[filterId];
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.LIVE_AGENT_FILTERS_USERS, JSON.stringify(replFilter));
        setFilterName('');
        setFilterId(v4());
    };

    const filterInactiveUsers = (users) => {
        return users
            .filter((user) => user.roles?.some((role) => role.role === UserRoles.WORKSPACE_INACTIVE))
            .map((user, index) => (
                <Option value={user._id} key={index}>
                    {user.name}
                </Option>
            ));
    };

    const renderInactiveUsersOptGroup = (users) => {
        if (users.some((user) => user.roles?.some((role) => role.role === UserRoles.WORKSPACE_INACTIVE))) {
            return <OptGroup label={getTranslation('Inactive')}>{filterInactiveUsers(users)}</OptGroup>;
        }
        return null;
    };

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('Save'),
            onClick: () => {
                setRenderFormSaveFilter(true);
                setRenderForm(false);
            },
        },
    ];

    return (
        <Wrapper padding='0 15px' overflowY='auto' height='calc(100% - 120px)' style={{ scroolbarwidth: 'thin' }}>
            <Container>
                <Formik
                    enableReinitialize
                    initialValues={appliedFilters.formValues || {}}
                    onSubmit={() => {}}
                    render={({ values, setFieldValue }) => {
                        qtdApplyFilters(Object.keys(values).length);
                        return renderForm ? (
                            <Form>
                                <Wrapper flexBox justifyContent='center' />
                                <Wrapper>
                                    <Wrapper
                                        textAlign='left'
                                        color={getColor(ColorType.text, ColorVariation.dark)}
                                        borderBottom='1px #e8e8e8 solid'
                                        className='py-2'
                                    >
                                        {getTranslation('Filter conversations')}
                                    </Wrapper>
                                    <FieldWrapper>
                                        <Select
                                            allowClear
                                            size='large'
                                            style={{ width: '100%' }}
                                            placeholder={getTranslation('Assumed by')}
                                            value={values.assumedBy}
                                            showSearch
                                            filterOption={(input, option) => {
                                                if (option && option.children) {
                                                    const optionText = option.children.toString().toLowerCase();
                                                    return optionText.indexOf(input.toLowerCase()) >= 0;
                                                }
                                                return false;
                                            }}
                                            onChange={(nameSelected: string) => {
                                                setFieldValue('assumedBy', nameSelected || undefined);
                                                let newValues = { ...values };
                                                if (!nameSelected) {
                                                    delete newValues.assumedBy;
                                                    setFieldValue('assumedBy', undefined);
                                                } else {
                                                    newValues.assumedBy = nameSelected;
                                                }
                                                getFilterName(newValues);
                                            }}
                                        >
                                            <OptGroup label={getTranslation('Active')}>
                                                {users
                                                    .filter((user) =>
                                                        user.roles?.some((role) => usersActive.includes(role.role))
                                                    )
                                                    .map((user) => (
                                                        <Option value={user._id} key={user._id}>
                                                            {user.name}
                                                        </Option>
                                                    ))}
                                            </OptGroup>
                                            {renderInactiveUsersOptGroup(users)}
                                        </Select>
                                    </FieldWrapper>
                                    <FieldWrapper>
                                        <Select
                                            allowClear
                                            style={{ width: '100%' }}
                                            placeholder='Status'
                                            size='large'
                                            value={values.state}
                                            showSearch
                                            filterOption={(input, option) => {
                                                if (option && option.children) {
                                                    const optionText = option.children.toString().toLowerCase();
                                                    return optionText.indexOf(input.toLowerCase()) >= 0;
                                                }
                                                return false;
                                            }}
                                            onChange={(value) => {
                                                if (!value) {
                                                    setFieldValue('state', undefined);
                                                    let newValues = { ...values };
                                                    delete newValues.state;
                                                    getFilterName(newValues);
                                                } else {
                                                    setFieldValue('state', value);
                                                    getFilterName({ ...values, state: value });
                                                }
                                            }}
                                        >
                                            {stateOptions.map((option) => (
                                                <Option key={option.value} value={option.value}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </FieldWrapper>
                                    <FieldWrapper>
                                        <Select
                                            size='large'
                                            mode='tags'
                                            style={{ width: '100%' }}
                                            allowClear
                                            placeholder={getTranslation('Tags')}
                                            onChange={(tags: SelectValue[]) => {
                                                if (!Array.isArray(tags) || tags.length === 0) {
                                                    setFieldValue('tags', undefined);
                                                    let newValues = { ...values };
                                                    delete newValues.tags;
                                                    getFilterName(newValues);
                                                } else {
                                                    const selectedTags = tags.map((tag) => tag?.toString());
                                                    setFieldValue('tags', selectedTags);
                                                    getFilterName({ ...values, tags: selectedTags });
                                                }
                                            }}
                                            value={values.tags}
                                        >
                                            {transformTagLabels().map((tag) => (
                                                <Option key={tag.value} value={tag.value}>
                                                    {tag.label}
                                                </Option>
                                            ))}
                                            {renderLabelsView(values.tags).map((tag) => (
                                                <Option key={tag.value} value={tag.value}>
                                                    {tag.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </FieldWrapper>
                                    <FieldWrapper style={{ position: 'relative' }}>
                                        <Select
                                            mode='multiple'
                                            size='large'
                                            style={{ width: '100%' }}
                                            allowClear
                                            disabled={false}
                                            value={values.teams}
                                            placeholder={getTranslation('Teams')}
                                            filterOption={(input, option) => {
                                                if (option && option.children) {
                                                    const optionText = option.children.toString().toLowerCase();
                                                    return optionText.indexOf(input.toLowerCase()) >= 0;
                                                }
                                                return false;
                                            }}
                                            onChange={(teams) => {
                                                if (!teams || teams.length === 0) {
                                                    setFieldValue('teams', undefined);
                                                    let newValues = { ...values };
                                                    delete newValues.teams;
                                                    getFilterName(newValues);
                                                } else {
                                                    setFieldValue('teams', teams);
                                                    getFilterName({ ...values, teams });
                                                }
                                            }}
                                        >
                                            {transformTeamLabels().map((team) => (
                                                <Option key={team.value} value={team.value}>
                                                    {team.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </FieldWrapper>
                                    <FieldWrapper style={{ position: 'relative' }}>
                                        <DateRangePicker
                                            preventOverflow
                                            size='lg'
                                            ranges={[]}
                                            style={{ width: '100%' }}
                                            title={
                                                values?.rangeDate
                                                    ? `${moment(values?.rangeDate?.[0]).format(
                                                          'DD/MM/YYYY HH:mm'
                                                      )} - ${moment(values?.rangeDate?.[1]).format('DD/MM/YYYY HH:mm')}`
                                                    : undefined
                                            }
                                            cleanable
                                            format={'dd/MM/yy HH:mm'}
                                            placeholder={getTranslation('Select period')}
                                            character=' - '
                                            shouldDisableDate={disabledDate}
                                            locale={locale.DateRangePicker}
                                            defaultValue={
                                                values['rangeDate']
                                                    ? [
                                                          new Date(values['rangeDate'][0]),
                                                          new Date(values['rangeDate'][1]),
                                                      ]
                                                    : undefined
                                            }
                                            onChange={(date) => {
                                                if (!date?.[0] && !date?.[1]) {
                                                    setFieldValue('rangeDate', undefined);
                                                    let newValues = { ...values };
                                                    delete newValues.rangeDate;
                                                    getFilterName(newValues);
                                                } else {
                                                    const dates = [
                                                        moment(date[0]).format('YYYY/MM/DD HH:mm'),
                                                        moment(date[1]).format('YYYY/MM/DD HH:mm'),
                                                    ];
                                                    setFieldValue('rangeDate', dates);
                                                    getFilterName({ ...values, rangeDate: dates });
                                                }
                                            }}
                                        />
                                    </FieldWrapper>
                                    <FieldWrapper>
                                        <Select
                                            mode='multiple'
                                            showSearch
                                            size='large'
                                            style={{ width: '100%' }}
                                            allowClear
                                            disabled={false}
                                            options={channelIds.map((channel) => ({
                                                value: channel.value,
                                                label: channel.label,
                                            }))}
                                            value={values.channels}
                                            placeholder={getTranslation('Channels')}
                                            filterOption={(input, option) => {
                                                if (option && option.label) {
                                                    const optionText = option.label.toString().toLowerCase();
                                                    return optionText.indexOf(input.toLowerCase()) >= 0;
                                                }
                                                return false;
                                            }}
                                            onChange={(selectedChannels: any[]) => {
                                                if (!selectedChannels || selectedChannels.length === 0) {
                                                    setFieldValue('channels', undefined);
                                                    let newValues = { ...values };
                                                    delete newValues.channels;
                                                    getFilterName(newValues);
                                                } else {
                                                    setFieldValue('channels', selectedChannels);
                                                    getFilterName({ ...values, channels: selectedChannels });
                                                }
                                            }}
                                        />
                                    </FieldWrapper>
                                    {workspaceChannelConfigs?.length > 1 && (
                                        <FieldWrapper>
                                            <Select
                                                size='large'
                                                mode='multiple'
                                                style={{ width: '100%' }}
                                                allowClear
                                                showSearch
                                                disabled={false}
                                                options={renderLabelsViewChannelConfig(workspaceChannelConfigs)}
                                                value={values.token}
                                                placeholder={getTranslation('Whatsapp')}
                                                filterOption={(input, option) => {
                                                    if (option && option.label) {
                                                        const optionText = option.label.toString().toLowerCase();
                                                        return optionText.indexOf(input.toLowerCase()) >= 0;
                                                    }
                                                    return false;
                                                }}
                                                onChange={(whatsappSelected: string[]) => {
                                                    setFieldValue('token', whatsappSelected || undefined);
                                                    let newValues = { ...values };
                                                    if (whatsappSelected && whatsappSelected.length <= 0) {
                                                        delete newValues.token;
                                                        setFieldValue('token', undefined);
                                                    } else {
                                                        newValues.token = whatsappSelected;
                                                    }
                                                    getFilterName(newValues);
                                                }}
                                            />
                                        </FieldWrapper>
                                    )}
                                    <FieldWrapper>
                                        <Select
                                            allowClear
                                            style={{ width: '100%' }}
                                            size='large'
                                            value={values.suspended ? 'true' : undefined}
                                            placeholder={getTranslation('Show suspended conversations')}
                                            onChange={(event) => {
                                                if (!event) {
                                                    setFieldValue('suspended', undefined);
                                                    let newValues = { ...values };
                                                    delete newValues.suspended;
                                                    getFilterName(newValues);
                                                } else {
                                                    const isSuspended = event === 'true';
                                                    setFieldValue('suspended', isSuspended);
                                                    getFilterName({ ...values, suspended: isSuspended });
                                                }
                                            }}
                                        >
                                            {suspendedOptions().map((option, index) => (
                                                <Option key={index} value={String(option.value)}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </FieldWrapper>
                                    <Wrapper
                                        flexBox
                                        margin='10px 0'
                                        alignItems='center'
                                        justifyContent={filterName ? 'space-between' : 'flex-end'}
                                    >
                                        {filterName && (
                                            <>
                                                <PrimaryButton
                                                    colorType={ColorType.danger}
                                                    onClick={() => deleteFilterUsersLocal()}
                                                >
                                                    {getTranslation('Delete')}
                                                </PrimaryButton>
                                                <Wrapper
                                                    width='160px'
                                                    position='absolute'
                                                    left='70px'
                                                    color='#444'
                                                    top='20px'
                                                    fontSize='18px'
                                                    fontWeight='500'
                                                    overflowX='hidden'
                                                    style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                                                >
                                                    {`- ${filterName}`}
                                                </Wrapper>
                                            </>
                                        )}
                                        <ButtonSelect
                                            type={'primary'}
                                            style={{ borderRadius: '3px', width: 'auto' }}
                                            onClick={() => onApply(values)}
                                            menu={{ items }}
                                        >
                                            {getTranslation('Apply')}
                                        </ButtonSelect>
                                    </Wrapper>
                                </Wrapper>
                            </Form>
                        ) : (
                            renderFormSaveFilter && (
                                <FormEditingFilters
                                    filterId={filterId}
                                    filterName={filterName}
                                    workspaceId={workspaceId}
                                    userId={userId}
                                    values={values}
                                    onApply={(params) => onApply(params)}
                                    setFilterName={(params) => setFilterName(params)}
                                    onCancel={() => {
                                        setRenderFormSaveFilter(false);
                                        setRenderForm(true);
                                        getFilterName(values);
                                    }}
                                />
                            )
                        );
                    }}
                />
            </Container>
        </Wrapper>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default i18n(withRouter(connect(mapStateToProps, null)(FilterConversationsForm)));
