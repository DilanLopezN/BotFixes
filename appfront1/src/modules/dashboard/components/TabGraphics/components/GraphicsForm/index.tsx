import { Button, Col, Drawer, Input, Row, Select, Space, Switch, Tag, TimePicker, Tooltip } from 'antd';
import { useFormik } from 'formik-latest';
import orderBy from 'lodash/orderBy';
import moment from 'moment';
import { FC, useEffect, useMemo } from 'react';
import { BsPlus } from 'react-icons/bs';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { channelToLabel } from '../../../../../../utils/ChannelToLabel';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { SelectableOption } from '../../../../../liveAgent/components/ClosingMessageModal/closing-modal-with-categorization/interfaces';
import { DashboardService } from '../../../../services/DashboardService';
import {
    ChartInterval,
    ChartType,
    ConversationTemplate,
    FixedClosedBy,
    Operator,
    TemplateGroupField,
    TemplateGroupInterface,
    TemplateMetrics,
} from '../../interfaces/conversation-template-interface';
import { GraphicsFormProps } from './props';
import {
    AddCondition,
    BodyStyle,
    CloseDrawer,
    DeleteIcon,
    DividerAnd,
    GraphicBar,
    GraphicLine,
    GraphicPie,
    GraphicTable,
    GraphicTypeStyle,
    Line,
    PrivateIcon,
    PublicIcon,
    TitleStyle,
    WrapperFormStyle,
} from './style';

const { Option, OptGroup } = Select;

const GraphicsForm: FC<GraphicsFormProps & I18nProps> = ({
    getTranslation,
    closeForm,
    conversationTemplate,
    selectedWorkspace,
    loggedUser,
    teams,
    getConversationTemplates,
    users,
    tags,
    setConversationTemplate,
    templateGroup,
    setTemplateGroup,
    getTemplateGroups,
    dashboardSelected,
    workspaceChannelConfigs,
    workspaceReferrals,
    conversationObjectives,
    conversationOutcomes,
}) => {
    const conversationOutcomeOptions = useMemo(() => {
        if (!conversationOutcomes) {
            return [];
        }

        const activeOptions: SelectableOption[] = [];
        const deletedOptions: SelectableOption[] = [];

        conversationOutcomes.data.forEach((outcome) => {
            const option = {
                value: outcome.id,
                label: (
                    <Space>
                        <span>{outcome.name}</span>
                        {outcome.deletedAt && <Tag color='red'>Inativo</Tag>}
                    </Space>
                ),
                name: outcome.name,
                disabled: !!outcome.deletedAt,
            };
            if (outcome.deletedAt) {
                deletedOptions.push(option);
            } else {
                activeOptions.push(option);
            }
        });

        return [...activeOptions, ...deletedOptions];
    }, [conversationOutcomes]);

    const conversationObjectivesOptions = useMemo(() => {
        if (!conversationObjectives) {
            return [];
        }

        const activeOptions: SelectableOption[] = [];
        const deletedOptions: SelectableOption[] = [];

        conversationObjectives.data.forEach((objective) => {
            const option = {
                value: objective.id,
                label: (
                    <Space>
                        <span>{objective.name}</span>
                        {objective.deletedAt && <Tag color='red'>Inativo</Tag>}
                    </Space>
                ),
                name: objective.name,
                disabled: !!objective.deletedAt,
            };
            if (objective.deletedAt) {
                deletedOptions.push(option);
            } else {
                activeOptions.push(option);
            }
        });

        return [...activeOptions, ...deletedOptions];
    }, [conversationObjectives]);

    const getOptionsByField = (field: string, index: number) => {
        switch (field) {
            case TemplateGroupField.assigned_to_team_id:
                return teams.map((team) => {
                    return <Option value={team._id}>{team.name}</Option>;
                });

            case TemplateGroupField.tags:
                return tags.map((tag) => {
                    return <Option value={tag.name}>{tag.name}</Option>;
                });

            case TemplateGroupField.closed_by:
                const includesBot = formik.values?.conditions[index].values.includes(FixedClosedBy.bot);
                const includesNotClosed = formik.values?.conditions[index].values.includes(FixedClosedBy.not_closed);
                const includesAllAgents = formik.values?.conditions[index].values.includes(FixedClosedBy.all_agents);
                return [
                    <OptGroup label={'System'}>
                        <Option disabled={includesNotClosed} value={FixedClosedBy.bot}>
                            Bot
                        </Option>
                        <Option disabled={includesBot || includesAllAgents} value={FixedClosedBy.not_closed}>
                            {getTranslation('unfinished')}
                        </Option>
                        <Option disabled={includesNotClosed} value={FixedClosedBy.all_agents}>
                            {getTranslation('Todos os agentes')}
                        </Option>
                    </OptGroup>,
                    <OptGroup label={getTranslation('Agents')}>
                        {users.map((user) => {
                            return (
                                <Option
                                    disabled={includesBot || includesNotClosed || includesAllAgents}
                                    value={user._id}
                                >
                                    {user.name}
                                </Option>
                            );
                        })}
                    </OptGroup>,
                ];

            case TemplateGroupField.created_by_channel:
                return orderBy(channelToLabel(selectedWorkspace, loggedUser), 'label').map((channel) => {
                    return <Option value={channel.value}>{channel.label}</Option>;
                });

            case TemplateGroupField.rating:
                const ratings = [1, 2, 3, 4, 5];
                return ratings.map((value) => {
                    return <Option value={value}>{value}</Option>;
                });

            case TemplateGroupField.token:
                return workspaceChannelConfigs.map((channelConfig) => {
                    return <Option value={channelConfig.token}>{channelConfig.name}</Option>;
                });

            case TemplateGroupField.referral_source_id:
                return workspaceReferrals.map((referral) => {
                    return <Option value={referral.source_id}>{referral.source_id}</Option>;
                });
            case TemplateGroupField.categorization_objective:
                return conversationObjectivesOptions.map((objective) => {
                    return (
                        <Option key={objective.value} value={objective.value}>
                            {objective.name}
                        </Option>
                    );
                });
            case TemplateGroupField.categorization_outcome:
                return conversationOutcomeOptions.map((outcome) => {
                    return (
                        <Option key={outcome.value} value={outcome.value}>
                            {outcome.name}
                        </Option>
                    );
                });

            default:
                break;
        }
    };

    const save = async (value: ConversationTemplate) => {
        if (!dashboardSelected) return;

        const conditions = value.conditions.filter((condition) => condition.field !== TemplateGroupField.no_field);
        value.conditions = conditions;

        if (value.chartType === ChartType.pizza) {
            value.interval = ChartInterval.none;
        }

        if (value._id) {
            try {
                const response = await DashboardService.updateConversationTemplate(
                    selectedWorkspace._id,
                    value._id,
                    value
                );

                if (response) {
                    return closeForm(value);
                }
            } catch (e) {
                console.log('fail update conversationTemplate', e);
            }
        } else {
            try {
                const response = await DashboardService.createConversationTemplate(selectedWorkspace._id, {
                    ...value,
                    groupId: dashboardSelected._id as string,
                });

                if (response) {
                    closeForm();
                    getConversationTemplates();
                    return formik.resetForm();
                }
            } catch (e) {
                console.log('fail create conversationTemplate', e);
            }
        }
    };

    const saveTemplateGroup = async (value: TemplateGroupInterface) => {
        if (value._id) {
            try {
                const response = await DashboardService.updateTemplateGroup(selectedWorkspace._id, value._id, value);

                if (response) {
                    formikTemplateGroup.resetForm();
                    return closeForm(undefined, value);
                }
            } catch (e) {
                console.log('fail update TemplateGroup', e);
            }
        } else {
            try {
                const response = await DashboardService.createTemplateGroup(selectedWorkspace._id, {
                    ...value,
                    ownerId: loggedUser._id as string,
                    workspaceId: selectedWorkspace._id,
                });

                if (response) {
                    closeForm();
                    getTemplateGroups();
                    return formikTemplateGroup.resetForm();
                }
            } catch (e) {
                console.log('fail create TemplateGroup', e);
            }
        }
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: conversationTemplate as ConversationTemplate,
        validate: (event) => {
            if (!formik.isSubmitting) {
                setConversationTemplate(event);
            }
        },
        onSubmit: () => {
            formik.setSubmitting(true);
            formik.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formik.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    save(formik.values);
                }
            });
        },
    });

    const formikTemplateGroup = useFormik({
        enableReinitialize: true,
        initialValues: {
            ...templateGroup,
            ownerId: templateGroup?.ownerId || (loggedUser._id as string),
        } as TemplateGroupInterface,
        onSubmit: () => {
            formikTemplateGroup.setSubmitting(true);
            formikTemplateGroup.validateForm().then((validatedValues: any) => {
                if (validatedValues.isCanceled) {
                    return formikTemplateGroup.handleSubmit();
                }

                if (Object.keys(validatedValues).length === 0) {
                    saveTemplateGroup(formikTemplateGroup.values);
                }
            });
        },
    });

    useEffect(() => {
        if (!templateGroup) return;

        if (!formikTemplateGroup.values) {
            return setTemplateGroup(undefined);
        }
        setTemplateGroup(formikTemplateGroup.values);
    }, [formikTemplateGroup.values]);

    return (
        <Drawer
            title={
                <Wrapper flexBox alignItems='center'>
                    <CloseDrawer onClick={() => closeForm()} />
                    {conversationTemplate ? getTranslation('Graphic') : getTranslation('Dashboard')}
                </Wrapper>
            }
            placement='right'
            closable={false}
            visible={conversationTemplate || templateGroup ? true : false}
            width='394'
            mask={false}
            headerStyle={{
                background: '#f2f4f8',
            }}
            bodyStyle={{
                background: '#f2f4f8',
                overflowY: 'auto',
                height: 'calc(100% - 50px)',
            }}
            drawerStyle={{
                overflow: 'hidden',
            }}
        >
            <form>
                {conversationTemplate && dashboardSelected ? (
                    <>
                        <WrapperFormStyle>
                            <TitleStyle>{getTranslation('Graphic')}</TitleStyle>
                            <BodyStyle padding='10px 15px 20px 15px !important'>
                                <LabelWrapper label={getTranslation('Name')}>
                                    <Input
                                        placeholder={getTranslation('Name')}
                                        value={formik.values?.name}
                                        onChange={(event) => {
                                            formik.setFieldValue('name', event.target.value);
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper label={getTranslation('Group by')}>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={formik.values?.interval}
                                        onChange={(value) => {
                                            formik.setFieldValue('interval', value);
                                        }}
                                    >
                                        <Option value={ChartInterval.none}>{getTranslation('None')}</Option>
                                        <Option value={ChartInterval.hours}>{getTranslation('Hour')}</Option>
                                        <Option value={ChartInterval.days}>{getTranslation('Day')}</Option>
                                        <Option value={ChartInterval.weeks}>{getTranslation('Week')}</Option>
                                        <Option value={ChartInterval.months}>{getTranslation('Months')}</Option>
                                    </Select>
                                </LabelWrapper>
                            </BodyStyle>
                        </WrapperFormStyle>

                        <WrapperFormStyle>
                            <TitleStyle>{getTranslation('Type of chart')}</TitleStyle>
                            <BodyStyle padding='5px 15px 5px 15px !important'>
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Tooltip placement='bottom' title={getTranslation('Columns')}>
                                            <GraphicTypeStyle
                                                className={
                                                    formik.values?.chartType === ChartType.bar ? 'selectedType' : ''
                                                }
                                                onClick={() => formik.setFieldValue('chartType', ChartType.bar)}
                                            >
                                                <GraphicBar />
                                            </GraphicTypeStyle>
                                        </Tooltip>
                                    </Col>
                                    <Col span={6}>
                                        <Tooltip placement='bottom' title={getTranslation('Line')}>
                                            <GraphicTypeStyle
                                                className={
                                                    formik.values?.chartType === ChartType.line ? 'selectedType' : ''
                                                }
                                                onClick={() => formik.setFieldValue('chartType', ChartType.line)}
                                            >
                                                <GraphicLine />
                                            </GraphicTypeStyle>
                                        </Tooltip>
                                    </Col>
                                    <Col span={6}>
                                        <Tooltip placement='bottom' title={getTranslation('Table')}>
                                            <GraphicTypeStyle
                                                className={
                                                    formik.values?.chartType === ChartType.table ? 'selectedType' : ''
                                                }
                                                onClick={() => formik.setFieldValue('chartType', ChartType.table)}
                                            >
                                                <GraphicTable />
                                            </GraphicTypeStyle>
                                        </Tooltip>
                                    </Col>
                                    <Col span={6}>
                                        <Tooltip placement='bottom' title={getTranslation('Pizza')}>
                                            <GraphicTypeStyle
                                                className={
                                                    formik.values?.chartType === ChartType.pizza ? 'selectedType' : ''
                                                }
                                                onClick={() => formik.setFieldValue('chartType', ChartType.pizza)}
                                            >
                                                <GraphicPie />
                                            </GraphicTypeStyle>
                                        </Tooltip>
                                    </Col>
                                </Row>
                            </BodyStyle>
                        </WrapperFormStyle>

                        <WrapperFormStyle>
                            <TitleStyle>{getTranslation('Category')}</TitleStyle>
                            <BodyStyle padding='10px 15px 20px 15px !important'>
                                <LabelWrapper
                                    label={getTranslation('Category')}
                                    tooltipStyle={{ maxWidth: '250px', wordBreak: 'break-word' }}
                                    tooltip={getTranslation(
                                        'It will show service data according to the selected category'
                                    )}
                                >
                                    <Select
                                        style={{ width: '100%' }}
                                        placeholder={getTranslation('Category')}
                                        value={formik.values?.groupField}
                                        onChange={(value) => {
                                            formik.setFieldValue('groupField', value);
                                        }}
                                    >
                                        <Option value={TemplateGroupField.referral_source_id}>
                                            {getTranslation('Ads')}
                                        </Option>
                                        <Option value={TemplateGroupField.agents}>
                                            {getTranslation('Agents (assumed)')}
                                        </Option>
                                        <Option value={TemplateGroupField.closed_by}>
                                            {getTranslation('Agents (finalized)')}
                                        </Option>
                                        <Option value={TemplateGroupField.created_by_channel}>
                                            {getTranslation('Channels')}
                                        </Option>
                                        <Option value={TemplateGroupField.tags}>{getTranslation('Hang tags')}</Option>
                                        <Option value={TemplateGroupField.no_field}>{getTranslation('None')}</Option>
                                        <Option value={TemplateGroupField.categorization_objective}>
                                            {getTranslation('Objectives')}
                                        </Option>
                                        <Option value={TemplateGroupField.categorization_outcome}>
                                            {getTranslation('Outcomes')}
                                        </Option>
                                        <Option value={TemplateGroupField.rating}>{getTranslation('Rating')}</Option>
                                        <Option value={TemplateGroupField.assigned_to_team_id}>
                                            {getTranslation('Teams')}
                                        </Option>
                                        {workspaceChannelConfigs.length > 1 ? (
                                            <Option value={TemplateGroupField.token}>
                                                {getTranslation('Whatsapp number')}
                                            </Option>
                                        ) : null}
                                    </Select>
                                </LabelWrapper>
                                <LabelWrapper
                                    label={getTranslation('Dimension')}
                                    tooltipStyle={{ maxWidth: '250px', wordBreak: 'break-word' }}
                                    tooltip={getTranslation('Type of data about calls that appears in the graph')}
                                >
                                    <Select
                                        style={{ width: '100%' }}
                                        placeholder={getTranslation('Dimension')}
                                        value={formik.values?.metric}
                                        onChange={(value) => {
                                            formik.setFieldValue('metric', value);
                                        }}
                                    >
                                        <Option value={TemplateMetrics.total}>
                                            {getTranslation('Total attendances')}
                                        </Option>
                                        <Option value={TemplateMetrics.time_to_close}>
                                            {getTranslation('Attendance average time')}
                                        </Option>
                                        <Option value={TemplateMetrics.first_agent_reply_avg}>
                                            {getTranslation('Waiting average time')}
                                        </Option>
                                        <Option value={TemplateMetrics.metrics_median_time_to_agent_reply}>
                                            {getTranslation('Average agent response time')}
                                        </Option>
                                        <Option value={TemplateMetrics.metrics_median_time_to_user_reply}>
                                            {getTranslation('Average Patient Response Time')}
                                        </Option>
                                        <Option value={TemplateMetrics.total_assumed_by_agent}>
                                            {getTranslation('Total assumed by agent')}
                                        </Option>
                                        <Option value={TemplateMetrics.awaiting_working_time_avg}>
                                            {getTranslation('Average wait time in active hours')}
                                        </Option>
                                        <Option value={TemplateMetrics.rating_avg}>
                                            {getTranslation('Evaluation average')}
                                        </Option>
                                    </Select>
                                </LabelWrapper>
                            </BodyStyle>
                        </WrapperFormStyle>

                        <WrapperFormStyle>
                            <TitleStyle>{getTranslation('Filters')}</TitleStyle>
                            <BodyStyle padding='5px 15px 15px 15px !important'>
                                {formik.values?.conditions.map((conditionFilters, index) => {
                                    return (
                                        <>
                                            {index > 0 && (
                                                <Line>
                                                    <DividerAnd>{getTranslation('And')}</DividerAnd>
                                                </Line>
                                            )}
                                            <Wrapper
                                                flexBox
                                                justifyContent='space-between'
                                                alignItems='center'
                                                margin={`${index === 0 ? '5px 0 0 0' : '20px 0 0 0'}`}
                                            >
                                                <Select
                                                    value={conditionFilters.operator || Operator.in}
                                                    style={{ width: '150px' }}
                                                    onChange={(value) => {
                                                        formik.setFieldValue(`conditions[${index}].operator`, value);
                                                    }}
                                                >
                                                    <Option value={Operator.in}>{getTranslation('Include')}</Option>
                                                    <Option value={Operator.not_in}>{getTranslation('Delete')}</Option>
                                                </Select>
                                                <DeleteIcon
                                                    title={getTranslation('Delete')}
                                                    onClick={() => {
                                                        let conditions = formik.values?.conditions;
                                                        if (formik.values.conditions.length > 1) {
                                                            conditions.splice(index, 1);

                                                            return formik.setFieldValue('conditions', conditions);
                                                        }
                                                        formik.setFieldValue('conditions[0]', {
                                                            field: TemplateGroupField.no_field,
                                                            values: [],
                                                            operator: Operator.in,
                                                        });
                                                    }}
                                                />
                                            </Wrapper>
                                            <LabelWrapper
                                                label={getTranslation('Field')}
                                                tooltip={getTranslation('By which field the filter will be applied')}
                                            >
                                                <Select
                                                    style={{ width: '100%' }}
                                                    placeholder={getTranslation('Field')}
                                                    value={conditionFilters.field}
                                                    onChange={(value) => {
                                                        const condition = {
                                                            field: value,
                                                            values: [],
                                                            operator:
                                                                formik.values?.conditions[index]?.operator ||
                                                                Operator.in,
                                                        };
                                                        formik.setFieldValue(`conditions[${index}]`, condition);
                                                    }}
                                                >
                                                    <Option value={TemplateGroupField.referral_source_id}>
                                                        {getTranslation('Ads')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.assigned_to_team_id}>
                                                        {getTranslation('Teams')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.categorization_objective}>
                                                        {getTranslation('Objectives')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.categorization_outcome}>
                                                        {getTranslation('Outcomes')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.created_by_channel}>
                                                        {getTranslation('Channels')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.closed_by}>
                                                        {getTranslation('Closed by')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.hour_interval}>
                                                        {getTranslation('Hour range')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.tags}>
                                                        {getTranslation('Hang tags')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.no_field}>
                                                        {getTranslation('None')}
                                                    </Option>
                                                    <Option value={TemplateGroupField.rating}>
                                                        {getTranslation('Rating')}
                                                    </Option>
                                                    {workspaceChannelConfigs.length > 1 ? (
                                                        <Option value={TemplateGroupField.token}>
                                                            {getTranslation('Whatsapp number')}
                                                        </Option>
                                                    ) : null}
                                                </Select>
                                            </LabelWrapper>
                                            <LabelWrapper
                                                label={getTranslation('Value')}
                                                tooltipStyle={{ maxWidth: '250px', wordBreak: 'break-word' }}
                                                tooltip={getTranslation(
                                                    'Which values ​​will be filtered according to the selected field'
                                                )}
                                            >
                                                {conditionFilters.field === TemplateGroupField.hour_interval ? (
                                                    <Wrapper flexBox alignItems='center' justifyContent='space-between'>
                                                        <TimePicker
                                                            format='HH:mm'
                                                            value={moment(
                                                                conditionFilters.values[0] ?? '00:00:00',
                                                                'HH:mm'
                                                            )}
                                                            onChange={(date) => {
                                                                let newValues = conditionFilters.values;
                                                                if (!newValues.length) {
                                                                    newValues = ['00:00:00', '23:59:59'];
                                                                }
                                                                if (!newValues[1]) {
                                                                    newValues[1] = '23:59:59';
                                                                }
                                                                if (date === null) {
                                                                    newValues[0] = '00:00:00';
                                                                    return formik.setFieldValue(
                                                                        `conditions[${index}].values`,
                                                                        [...newValues]
                                                                    );
                                                                }
                                                                const toFormat = moment(date).format('HH:mm:00');
                                                                newValues[0] = toFormat;

                                                                return formik.setFieldValue(
                                                                    `conditions[${index}].values`,
                                                                    [...newValues]
                                                                );
                                                            }}
                                                        />
                                                        <Wrapper>{getTranslation('At')}</Wrapper>
                                                        <TimePicker
                                                            format='HH:mm'
                                                            value={moment(
                                                                conditionFilters.values[1] ?? '23:59:59',
                                                                'HH:mm'
                                                            )}
                                                            onChange={(date) => {
                                                                let newValues = conditionFilters.values;
                                                                if (!newValues.length) {
                                                                    newValues = ['00:00:00', '23:59:59'];
                                                                }
                                                                if (!newValues[0]) {
                                                                    newValues[0] = '00:00:00';
                                                                }
                                                                if (date === null) {
                                                                    newValues[1] = '23:59:59';
                                                                    return formik.setFieldValue(
                                                                        `conditions[${index}].values`,
                                                                        [...newValues]
                                                                    );
                                                                }
                                                                const toFormat = moment(date).format('HH:mm:00');
                                                                newValues[1] = toFormat;

                                                                return formik.setFieldValue(
                                                                    `conditions[${index}].values`,
                                                                    [...newValues]
                                                                );
                                                            }}
                                                        />
                                                    </Wrapper>
                                                ) : (
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        mode={
                                                            conditionFilters.field === TemplateGroupField.tags
                                                                ? 'tags'
                                                                : 'multiple'
                                                        }
                                                        placeholder={getTranslation('Value')}
                                                        allowClear
                                                        value={
                                                            conditionFilters.field ===
                                                                TemplateGroupField.categorization_outcome ||
                                                            conditionFilters.field ===
                                                                TemplateGroupField.categorization_objective
                                                                ? conditionFilters.values.map((id) => {
                                                                      const optionList =
                                                                          conditionFilters.field ===
                                                                          TemplateGroupField.categorization_outcome
                                                                              ? conversationOutcomeOptions
                                                                              : conversationObjectivesOptions;

                                                                      const matchedOption = optionList.find(
                                                                          (opt) => String(opt.value) === String(id)
                                                                      );
                                                                      return matchedOption ? matchedOption.value : id;
                                                                  })
                                                                : conditionFilters.values
                                                        }
                                                        onChange={(values) => {
                                                            if (
                                                                conditionFilters.field ===
                                                                    TemplateGroupField.categorization_outcome ||
                                                                conditionFilters.field ===
                                                                    TemplateGroupField.categorization_objective
                                                            ) {
                                                                const newValues = values?.map((v) => Number(v));
                                                                return formik.setFieldValue(
                                                                    `conditions[${index}].values`,
                                                                    newValues
                                                                );
                                                            }
                                                            if (values?.includes(FixedClosedBy.bot)) {
                                                                const newValues = values?.filter(
                                                                    (value) =>
                                                                        value === FixedClosedBy.all_agents ||
                                                                        value === FixedClosedBy.bot
                                                                );
                                                                return formik.setFieldValue(
                                                                    `conditions[${index}].values`,
                                                                    [...newValues]
                                                                );
                                                            } else if (values?.includes(FixedClosedBy.not_closed)) {
                                                                return formik.setFieldValue(
                                                                    `conditions[${index}].values`,
                                                                    [FixedClosedBy.not_closed]
                                                                );
                                                            } else if (values?.includes(FixedClosedBy.all_agents)) {
                                                                const newValues = values?.filter(
                                                                    (value) =>
                                                                        value === FixedClosedBy.all_agents ||
                                                                        value === FixedClosedBy.bot
                                                                );
                                                                return formik.setFieldValue(
                                                                    `conditions[${index}].values`,
                                                                    [...newValues]
                                                                );
                                                            }
                                                            formik.setFieldValue(`conditions[${index}].values`, values);
                                                        }}
                                                    >
                                                        {getOptionsByField(conditionFilters.field, index)}
                                                    </Select>
                                                )}
                                            </LabelWrapper>
                                        </>
                                    );
                                })}
                            </BodyStyle>
                            <AddCondition
                                onClick={() => {
                                    let newConditions = [...formik.values.conditions];
                                    newConditions.push({
                                        field: TemplateGroupField.no_field,
                                        values: [],
                                        operator: Operator.in,
                                    });
                                    formik.setFieldValue('conditions', newConditions);
                                }}
                            >
                                <BsPlus />
                                <Wrapper>{getTranslation('Add filter')}</Wrapper>
                            </AddCondition>
                        </WrapperFormStyle>
                    </>
                ) : (
                    <>
                        <WrapperFormStyle>
                            <TitleStyle>{getTranslation('Dashboard')}</TitleStyle>
                            <BodyStyle padding='10px 15px 20px 15px !important'>
                                {formikTemplateGroup.values._id && (
                                    <LabelWrapper
                                        label={`${getTranslation('Created by:')} ${
                                            users.find((user) => user._id === formikTemplateGroup.values.ownerId)
                                                ?.name || 'Botdesigner'
                                        }`}
                                    />
                                )}
                                <LabelWrapper label={getTranslation('Title')}>
                                    <Input
                                        placeholder={getTranslation('Title')}
                                        value={formikTemplateGroup.values.name}
                                        onChange={(event) => {
                                            formikTemplateGroup.setFieldValue('name', event.target.value);
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper label={getTranslation('Visibility')}>
                                    <Select
                                        style={{ width: '100%' }}
                                        optionLabelProp='label'
                                        value={formikTemplateGroup.values.shared ? 1 : 2}
                                        onChange={(value) => {
                                            if (value === 1) {
                                                formikTemplateGroup.setFieldValue('shared', true);
                                            } else {
                                                formikTemplateGroup.setFieldValue('shared', false);
                                            }
                                        }}
                                    >
                                        <Option
                                            value={1}
                                            label={
                                                <Wrapper flexBox alignItems='center'>
                                                    <PublicIcon />
                                                    {getTranslation('Public')}
                                                </Wrapper>
                                            }
                                        >
                                            <Wrapper flexBox>
                                                <PublicIcon />
                                                <Wrapper flexBox flexDirection='column'>
                                                    <Wrapper margin='-3px 0 -2px 0'>{getTranslation('Public')}</Wrapper>
                                                    <Wrapper fontSize='12px'>
                                                        {getTranslation('Everyone can see your Dashboard')}
                                                    </Wrapper>
                                                </Wrapper>
                                            </Wrapper>
                                        </Option>
                                        <Option
                                            value={2}
                                            label={
                                                <Wrapper flexBox alignItems='center'>
                                                    <PrivateIcon />
                                                    {getTranslation('Private')}
                                                </Wrapper>
                                            }
                                        >
                                            <Wrapper flexBox>
                                                <PrivateIcon />
                                                <Wrapper flexBox flexDirection='column'>
                                                    <Wrapper margin='-3px 0 -2px 0'>
                                                        {getTranslation('Private')}
                                                    </Wrapper>
                                                    <Wrapper fontSize='12px'>
                                                        {getTranslation('Only you can see your Dashboard')}
                                                    </Wrapper>
                                                </Wrapper>
                                            </Wrapper>
                                        </Option>
                                    </Select>
                                </LabelWrapper>
                                <Wrapper margin='16px 0 0 0'>
                                    <LabelWrapper label={getTranslation('Editable')}>
                                        <Wrapper flexBox alignItems='center'>
                                            <Switch
                                                checked={formikTemplateGroup.values.globalEditable}
                                                onChange={() => {
                                                    formikTemplateGroup.setFieldValue(
                                                        'globalEditable',
                                                        !formikTemplateGroup.values.globalEditable
                                                    );
                                                }}
                                            />
                                            <Wrapper margin='0 10px'>
                                                {getTranslation('Allow changes by other users.')}
                                            </Wrapper>
                                        </Wrapper>
                                    </LabelWrapper>
                                </Wrapper>
                            </BodyStyle>
                        </WrapperFormStyle>
                    </>
                )}

                <Wrapper flexBox justifyContent='flex-end'>
                    <Button
                        type='link'
                        onClick={() => {
                            closeForm();
                            if (conversationTemplate) {
                                formik.resetForm();
                            }
                            if (templateGroup) {
                                formikTemplateGroup.resetForm();
                            }
                        }}
                    >
                        {getTranslation('Cancel')}
                    </Button>
                    <Button
                        type='primary'
                        onClick={() => {
                            if (conversationTemplate) {
                                formik.submitForm();
                            }
                            if (templateGroup) {
                                formikTemplateGroup.submitForm();
                            }
                        }}
                    >
                        <Wrapper color='#fff'>{getTranslation('Save')}</Wrapper>
                    </Button>
                </Wrapper>
            </form>
        </Drawer>
    );
};

export default i18n(GraphicsForm) as FC<GraphicsFormProps>;
