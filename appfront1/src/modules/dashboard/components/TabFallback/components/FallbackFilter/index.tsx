import { FC, useState } from 'react';
import moment from 'moment';
import { Formik, Form } from 'formik';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { CreatableSelectTags } from '../../../../../../shared/StyledForms/CreatableSelectTags/CreatableSelectTags';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { FiltersProps, FallbackFilterInterface } from './props';
import { timeout } from '../../../../../../utils/Timer';
import locale from 'rsuite/locales/pt_BR';

import DateRangePicker from 'rsuite/DateRangePicker';
import 'rsuite/dist/rsuite.css';

export const getDefaultFallbackFilter = (): FallbackFilterInterface => {
    return {
        rangeDate: undefined,
        status: undefined,
        tags: undefined,
    };
};

const FallbackFilter: FC<FiltersProps & I18nProps> = (props) => {
    const { getTranslation, onSubmit, initialFilter, disable } = props;

    const [filter, setFilter] = useState<FallbackFilterInterface>(initialFilter);

    const saveFilters = (filters: FallbackFilterInterface) => {
        onSubmit(filters);
    };

    const clearFilter = () => {
        setFilter({ ...initialFilter });
        onSubmit(filter);
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

    const disabledDate = (current) => {
        return current && current > moment().endOf('day');
    };

    return (
        <Wrapper margin='0 0 10px 0'>
            {filter && (
                <Formik
                    initialValues={filter}
                    onSubmit={(values) => {
                        saveFilters(values);
                    }}
                    enableReinitialize
                    render={({ values, submitForm, setFieldValue, setFieldTouched, setValues }) => {
                        return (
                            <Form>
                                <Wrapper flexBox alignItems='self-end'>
                                    <Wrapper flex maxWidth='150px' minWidth='150px'>
                                        <LabelWrapper label={getTranslation('Status')}>
                                            <StyledFormikField
                                                className='form-control form-control-sm'
                                                component='select'
                                                name='status'
                                                value={values.status ?? ''}
                                                onChange={(event) => {
                                                    event.preventDefault();
                                                    if (!event.target.value) {
                                                        setFieldValue('status', undefined);
                                                        values.status = undefined;
                                                        return saveFilters(values);
                                                    }
                                                    setFieldValue('status', event.target.value);
                                                    values.status = event.target.value;
                                                    saveFilters(values);
                                                }}
                                            >
                                                <option value=''>{getTranslation('All')}</option>
                                                <option value='new'>{getTranslation('New')}</option>
                                                <option value='ignored'>{getTranslation('Ignored')}</option>
                                                <option value='solved'>{getTranslation('Solved')}</option>
                                            </StyledFormikField>
                                        </LabelWrapper>
                                    </Wrapper>

                                    <Wrapper flex margin='0 10px' maxWidth='250px' minWidth='250px'>
                                        <LabelWrapper label={getTranslation('Select period')}>
                                            <DateRangePicker
                                                size='lg'
                                                ranges={[]}
                                                style={{ width: '100%' }}
                                                cleanable
                                                format={'dd/MM/yy'}
                                                placeholder={getTranslation('Select period')}
                                                character=' - '
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
                                                        setFieldValue('rangeDate', undefined);
                                                        values.rangeDate = undefined;
                                                        saveFilters(values);
                                                    } else {
                                                        const dates = [
                                                            moment(date[0]).format('YYYY-MM-DDT00:00:00'),
                                                            moment(date[1]).format('YYYY-MM-DDT23:59:59'),
                                                        ];
                                                        setFieldValue('rangeDate', dates);
                                                        values.rangeDate = dates;
                                                        saveFilters(values);
                                                    }
                                                }}
                                            />
                                        </LabelWrapper>
                                    </Wrapper>

                                    <Wrapper flex margin='0 10px' minWidth='310px' maxWidth='310px'>
                                        <LabelWrapper label={getTranslation('Tags')}>
                                            <CreatableSelectTags
                                                isDisabled={disable}
                                                onChange={(value) => {
                                                    if (!value) {
                                                        setFieldValue('tags', []);
                                                        values.tags = [];

                                                        saveFilters(values);
                                                    }
                                                    setFieldValue('tags', adjustmentValues(value, false));
                                                    values.tags = adjustmentValues(value, false);

                                                    timeout(() => {
                                                        saveFilters(values);
                                                    }, 500);
                                                }}
                                                placeholder={getTranslation('Filter tags')}
                                                value={
                                                    Array.isArray(values.tags)
                                                        ? values.tags.map((element: any) => {
                                                              return { value: element, label: element };
                                                          })
                                                        : []
                                                }
                                                onBlur={() => setFieldTouched('tags')}
                                            />
                                        </LabelWrapper>
                                    </Wrapper>

                                    <Wrapper flexBox alignItems='flex-end' margin='0 10px'>
                                        <span
                                            className='mdi mdi-filter-remove-outline mdi-24px pointer'
                                            onClick={() => {
                                                clearFilter();
                                                const newFilters = getDefaultFallbackFilter();
                                                setValues(newFilters);
                                                onSubmit(newFilters);
                                            }}
                                        />
                                    </Wrapper>
                                </Wrapper>
                            </Form>
                        );
                    }}
                />
            )}
        </Wrapper>
    );
};

export default i18n(FallbackFilter) as FC<FiltersProps>;
