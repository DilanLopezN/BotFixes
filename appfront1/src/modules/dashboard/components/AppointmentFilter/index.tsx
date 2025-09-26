import { Form as AntdForm, Button, Col, Popover, Row, Space, Switch } from 'antd';
import { Formik, Form as FormikForm } from 'formik';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { TbFilterX } from 'react-icons/tb';
import { connect, useSelector } from 'react-redux';
import { withRouter } from 'react-router';
import DateRangePicker from 'rsuite/DateRangePicker';
import 'rsuite/dist/rsuite.css';
import locale from 'rsuite/locales/pt_BR';
import { Constants } from '../../../../utils/Constants';
import { timeout } from '../../../../utils/Timer';
import { isSystemCsAdmin } from '../../../../utils/UserPermission';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { AppointmentFilterInterface, AppointmentFilterProps, FilterSelect } from './props';

export const getDefaultFilter = (workspaceId: string): AppointmentFilterInterface => {
    const localStorageFilter = getAppliedFilters();
    if (localStorageFilter?.[workspaceId]) {
        return { ...localStorageFilter[workspaceId], workspaceId };
    }

    const startDate = moment().startOf('day').subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss');
    const endDate = moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss');

    return {
        startDate,
        endDate,
        channelIds: [],
        tags: [],
        teamIds: [],
        botId: '',
    };
};

const localStorageAppointmentFilterToken = Constants.LOCAL_STORAGE_MAP.APPOINTMENT_FILTER;

const getAppliedFilters = () => {
    const filterSelected = localStorage.getItem(localStorageAppointmentFilterToken);
    if (typeof filterSelected !== 'string') {
        localStorage.removeItem(localStorageAppointmentFilterToken);
        return {};
    }
    const removeLocal = () => localStorage.removeItem(localStorageAppointmentFilterToken);

    try {
        const obj = JSON.parse(filterSelected);
        if (obj && typeof obj === 'object' && obj !== null) {
            const parsedFilters = JSON.parse(filterSelected);
            return parsedFilters;
        }
    } catch (err) {
        removeLocal();
    }
};

const AppointmentFilter: FC<AppointmentFilterProps & I18nProps> = (props) => {
    const {
        getTranslation,
        selectedWorkspace,
        onSubmit,
        loading,
        initialFilter,
        setInitialConfigState,
        setIsShowAlert,
    } = props;
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const [filter, setFilter] = useState<AppointmentFilterInterface>(getDefaultFilter(selectedWorkspace?._id));
    const [dates, setDates] = useState<any[]>([]);

    const saveFilters = (filters: AppointmentFilterInterface) => {
        if (selectedWorkspace) {
            const replFilter: FilterSelect = {
                ...getAppliedFilters(),
                [selectedWorkspace._id]: {
                    ...filters,
                },
            };
            localStorage.setItem(localStorageAppointmentFilterToken, JSON.stringify(replFilter));
            onSubmit(filters);
        }
    };

    const clearFilter = () => {
        if (selectedWorkspace) {
            const replFilter: FilterSelect = {
                ...getAppliedFilters(),
            };
            delete replFilter[selectedWorkspace._id];
            localStorage.setItem(localStorageAppointmentFilterToken, JSON.stringify(replFilter));
        }
        clearParam();
        setFilter({ ...initialFilter });
        onSubmit(filter);
    };
    const clearParam = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('filters');
        url.searchParams.delete('config');
        window.history.replaceState(null, '', url.pathname);
        setIsShowAlert(false);
    };

    const disabledDate = (current) => {
        if (current && current > moment().endOf('day')) {
            return true;
        }
        const tooLate = dates[0] && moment(current).diff(moment(dates[0]), 'months') > 1;
        const tooLate2 = dates[0] && moment(dates[0]).diff(moment(current), 'months') > 1;
        const tooEarly = dates[1] && moment(dates[1]).diff(moment(current), 'months') > 1;
        return tooEarly || tooLate || tooLate2;
    };

    useEffect(() => {
        try {
            const search = new URLSearchParams(window.location.search);
            const filtersParam = search.get('filters');

            if (filtersParam) {
                const decrypt = window.atob(filtersParam);
                const filterData = JSON.parse(decrypt);
                setFilter(filterData);

                setDates([moment(filterData.startDate), moment(filterData.endDate)]);
            }
        } catch (error) {
            console.error('error on decrypt url params', error);
        }
    }, []);

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
                        const handleDateChange = (date) => {
                            if (!date?.[0] || !date?.[1]) {
                                setDates([]);
                                setInitialConfigState({});
                                clearParam();
                                setFieldValue(
                                    'endDate',
                                    moment().endOf('day').add(0, 'day').format('YYYY-MM-DDTHH:mm:ss')
                                );
                                setFieldValue(
                                    'startDate',
                                    moment().startOf('day').subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss')
                                );
                                timeout(submitForm, 500);
                                return;
                            }
                            const startDate = moment(date[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
                            let endDate = moment(date[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

                            if (moment(endDate).diff(moment(startDate), 'months', true) > 2) {
                                endDate = moment(startDate).add(2, 'months').endOf('day').format('YYYY-MM-DDTHH:mm:ss');
                                setIsShowAlert(true);
                            } else {
                                setIsShowAlert(false);
                            }

                            setFieldValue('endDate', endDate);
                            setFieldValue('startDate', startDate);
                            values['startDate'] = startDate;
                            values['endDate'] = endDate;
                            setDates([moment(startDate), moment(endDate)]);

                            timeout(submitForm, 500);
                        };

                        const handleClearFilters = () => {
                            setInitialConfigState({});
                            clearFilter();
                            const newFilters = getDefaultFilter(selectedWorkspace?._id);
                            setValues(newFilters);
                            setDates([]);
                            onSubmit(newFilters);
                        };
                        return (
                            <FormikForm>
                                <AntdForm>
                                    <Row gutter={[16, 16]}>
                                        <Col>
                                            <AntdForm.Item label={getTranslation('Select period')}>
                                                <DateRangePicker
                                                    size='lg'
                                                    disabled={loading}
                                                    ranges={[]}
                                                    cleanable
                                                    format={'dd/MM/yy'}
                                                    placeholder={getTranslation('Select period')}
                                                    character=' - '
                                                    shouldDisableDate={disabledDate}
                                                    locale={locale.DateRangePicker}
                                                    value={[new Date(values.startDate), new Date(values.endDate)]}
                                                    onChange={handleDateChange}
                                                />
                                            </AntdForm.Item>
                                        </Col>
                                        <Col span={1}>
                                            <AntdForm.Item>
                                                <Popover content={getTranslation('Clear filters')} trigger='hover'>
                                                    <Button
                                                        style={{ height: '5px', width: '5px' }}
                                                        disabled={loading}
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

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export default i18n(withRouter(connect(mapStateToProps, null)(AppointmentFilter)));
