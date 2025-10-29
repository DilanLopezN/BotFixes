import { Form as AntdForm, Button, Col, Popover, Row, Select } from 'antd';
import { Formik, Form as FormikForm } from 'formik';
import { UserRoles } from 'kissbot-core';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { TbFilterX } from 'react-icons/tb';
import DateRangePicker from 'rsuite/DateRangePicker';
import 'rsuite/dist/rsuite.css';
import locale from 'rsuite/locales/pt_BR';
import getDefaultTags from '../../../../../../utils/default-tags';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import { FiltersProps, RatingFilterInterface, feedbackEnum } from './props';

const { Option, OptGroup } = Select;

export const getDefaultRatingFilter = (): RatingFilterInterface => {
    return {
        rangeDate: [
            moment().startOf('day').subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss').valueOf(),
            moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss').valueOf(),
        ],
        note: undefined,
        tags: undefined,
        teamIds: [],
        memberId: undefined,
        feedback: undefined,
    };
};

const RatingFilter: FC<FiltersProps & I18nProps> = (props) => {
    const { getTranslation, onSubmit, filter, disable, teams, users, selectedWorkspace } = props;

    const [workspaceTags, setWorkspaceTags] = useState<any[]>([]);
    const [disableSelectTags, setDisableSelectTags] = useState(true);
    const isDisabledTags = disableSelectTags && disable;

    useEffect(() => {
        getWorkspaceTags();
    }, [selectedWorkspace]);

    const getWorkspaceTags = async () => {
        if (!selectedWorkspace) return;

        const response = await WorkspaceService.workspaceTags(selectedWorkspace._id);
        setWorkspaceTags([...getDefaultTags(selectedWorkspace._id), ...[...(response?.data ?? [])]]);
    };

    const saveFilters = (filters: RatingFilterInterface) => {
        onSubmit(filters);
    };

    const disabledDate = (current) => {
        return current && current > moment().endOf('day');
    };

    const feedbackTypeOptions = () => {
        return [
            {
                label: getTranslation('All'),
                value: feedbackEnum.all,
            },
            {
                label: getTranslation('With feedback'),
                value: feedbackEnum.withFeedback,
            },
            {
                label: getTranslation('No feedback'),
                value: feedbackEnum.noFeedback,
            },
        ];
    };

    return (
        <div>
            {filter && (
                <Formik
                    initialValues={filter}
                    onSubmit={(values) => {
                        saveFilters(values);
                    }}
                    enableReinitialize
                    render={({ values, submitForm, setFieldValue, setFieldTouched, setValues }) => {
                        const handleClearFilters = () => {
                            const newFilters = getDefaultRatingFilter();
                            setValues(newFilters);
                            onSubmit(newFilters);
                        };

                        return (
                            <FormikForm>
                                <AntdForm layout='vertical'>
                                    <Row gutter={[8, 16]} justify='space-between'>
                                        <Col>
                                            <AntdForm.Item label={getTranslation('Teams')}>
                                                <Select
                                                    style={{ width: '200px' }}
                                                    mode='multiple'
                                                    maxTagCount={1}
                                                    allowClear
                                                    showSearch
                                                    placeholder={getTranslation('Select a team')}
                                                    size='large'
                                                    disabled={disable}
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
                                            </AntdForm.Item>
                                        </Col>

                                        <Col span={5}>
                                            <AntdForm.Item label={getTranslation('Select period')}>
                                                <DateRangePicker
                                                    size='lg'
                                                    ranges={[]}
                                                    style={{ width: '100%' }}
                                                    cleanable
                                                    format={'dd/MM/yy'}
                                                    placeholder={getTranslation('Select period')}
                                                    character=' - '
                                                    disabled={disable}
                                                    shouldDisableDate={disabledDate}
                                                    locale={locale.DateRangePicker}
                                                    value={
                                                        values.rangeDate
                                                            ? [
                                                                  moment(values.rangeDate[0]).toDate(),
                                                                  moment(values.rangeDate[1]).toDate(),
                                                              ]
                                                            : null
                                                    }
                                                    onChange={(date) => {
                                                        if (!date?.[0] && !date?.[1]) {
                                                            const rangeDate = getDefaultRatingFilter().rangeDate;
                                                            setFieldValue('rangeDate', rangeDate);
                                                            values.rangeDate = rangeDate;
                                                            saveFilters(values);
                                                        } else {
                                                            const dates = [
                                                                moment(date[0]).format('YYYY/MM/DD'),
                                                                moment(date[1]).format('YYYY/MM/DD'),
                                                            ];
                                                            setFieldValue('rangeDate', dates);
                                                            values.rangeDate = dates;
                                                            saveFilters(values);
                                                        }
                                                    }}
                                                />
                                            </AntdForm.Item>
                                        </Col>

                                        <Col span={4}>
                                            <AntdForm.Item label={getTranslation('Tags')}>
                                                <Select
                                                    maxTagCount={1}
                                                    allowClear
                                                    size='large'
                                                    mode='tags'
                                                    disabled={isDisabledTags}
                                                    placeholder={getTranslation('Filter tags')}
                                                    value={values.tags}
                                                    onChange={(value) => {
                                                        if (!value) {
                                                            setFieldValue('tags', undefined);
                                                            values.tags = undefined;
                                                            saveFilters(values);
                                                        }
                                                        setFieldValue('tags', value);
                                                        values.tags = value;
                                                        setTimeout(() => {
                                                            saveFilters(values);
                                                        }, 500);
                                                    }}
                                                    onBlur={() => setFieldTouched('tags')}
                                                    onDropdownVisibleChange={(open) => {
                                                        setDisableSelectTags(!open);
                                                    }}
                                                >
                                                    {workspaceTags.map((tag) => (
                                                        <Option key={tag.name} value={tag.name}>
                                                            {tag.name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </AntdForm.Item>
                                        </Col>

                                        <Col span={2}>
                                            <AntdForm.Item label={getTranslation('Rating')}>
                                                <Select
                                                    size='large'
                                                    key='notes'
                                                    value={values.note ?? ''}
                                                    disabled={disable}
                                                    onChange={(value) => {
                                                        if (!value) {
                                                            setFieldValue('note', undefined);
                                                            saveFilters({ ...values, note: undefined });
                                                        } else {
                                                            setFieldValue('note', value as feedbackEnum);
                                                            saveFilters({
                                                                ...values,
                                                                note: value as { 1: 1; 2: 2; 3: 3; 4: 4; 5: 5 },
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <Option value=''>{getTranslation('All')}</Option>
                                                    <Option value={1}>1</Option>
                                                    <Option value={2}>2</Option>
                                                    <Option value={3}>3</Option>
                                                    <Option value={4}>4</Option>
                                                    <Option value={5}>5</Option>
                                                </Select>
                                            </AntdForm.Item>
                                        </Col>

                                        <Col span={4}>
                                            <AntdForm.Item label={getTranslation('Agent')}>
                                                <Select
                                                    key={values.memberId}
                                                    placeholder={getTranslation('Select a agent')}
                                                    value={values.memberId}
                                                    disabled={disable}
                                                    size='large'
                                                    onChange={(value) => {
                                                        setFieldValue('memberId', value);
                                                        values.memberId = value;
                                                        saveFilters(values);
                                                    }}
                                                >
                                                    <Option value=''>{getTranslation('All')}</Option>

                                                    <OptGroup label={getTranslation('Active')}>
                                                        {users
                                                            .filter((user) =>
                                                                user.roles?.some((role) =>
                                                                    [
                                                                        UserRoles.WORKSPACE_ADMIN,
                                                                        UserRoles.WORKSPACE_AGENT,
                                                                        UserRoles.SYSTEM_ADMIN,
                                                                    ].includes(role.role)
                                                                )
                                                            )
                                                            .map((user, index) => (
                                                                <Option value={user._id} key={index}>
                                                                    {user.name}
                                                                </Option>
                                                            ))}
                                                    </OptGroup>
                                                    <OptGroup label={getTranslation('Inactive')}>
                                                        {users
                                                            .filter((user) =>
                                                                user.roles?.some(
                                                                    (role) => role.role === UserRoles.WORKSPACE_INACTIVE
                                                                )
                                                            )
                                                            .map((user, index) => (
                                                                <Option value={user._id} key={index}>
                                                                    {user.name}
                                                                </Option>
                                                            ))}
                                                    </OptGroup>
                                                </Select>
                                            </AntdForm.Item>
                                        </Col>

                                        <Col span={3}>
                                            <AntdForm.Item label={getTranslation('Feedback')}>
                                                <Select
                                                    disabled={disable}
                                                    key={values.feedback}
                                                    value={values.feedback}
                                                    size='large'
                                                    defaultValue={feedbackEnum.all}
                                                    onChange={(value) => {
                                                        saveFilters({ ...values, feedback: value });
                                                    }}
                                                >
                                                    {feedbackTypeOptions().map((interval: any, index: number) => (
                                                        <Option value={interval.value} key={index}>
                                                            {interval.label}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </AntdForm.Item>
                                        </Col>

                                        <Col
                                            span={1}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <AntdForm.Item label={' '}>
                                                <Popover content={getTranslation('Clear filters')} trigger='hover'>
                                                    <Button
                                                        disabled={disable}
                                                        type='text'
                                                        icon={<TbFilterX size={24} />}
                                                        onClick={handleClearFilters}
                                                    />
                                                </Popover>
                                            </AntdForm.Item>
                                        </Col>
                                    </Row>
                                </AntdForm>
                            </FormikForm>
                        );
                    }}
                />
            )}
        </div>
    );
};

export default i18n(RatingFilter) as FC<FiltersProps>;
