import { FC, useEffect } from 'react';
import { CommonFilterProps } from './props';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { Formik, Form } from 'formik';
import { StyledFieldSmallCustomSearch } from '../../../../shared/StyledForms/StyledFieldSmallCustomSearch';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useLanguageContext } from '../../../i18n/context';

const CommonFilter: FC<CommonFilterProps> = ({
    initialValue,
    onKeyPress,
    onChange,
    submitted,
    placeholder,
    autofocus,
    disabled,
    allowClear = false,
}) => {
    const fieldId = 'search-input-filter';
    const { getTranslation } = useLanguageContext();
    useEffect(() => {
        if (!autofocus) return;

        const field = document.getElementById(fieldId);
        field?.focus();
    }, []);

    return (
        <Wrapper width='100%'>
            <Formik
                initialValues={{ filter: initialValue || '' }}
                // enableReinitialize
                onSubmit={() => {}}
                render={({ values, setFieldValue }) => (
                    <Form>
                        <StyledFieldSmallCustomSearch
                            as={'input'}
                            disabled={disabled}
                            autoComplete='false'
                            className='form-control form-control-sm'
                            name='filter'
                            id={fieldId}
                            type='search'
                            placeholder={placeholder}
                            value={disabled ? '' : values.filter}
                            onChange={(ev) => {
                                const value = ev.target.value;
                                let phone = value.match(/^\(?\d{2}\)?[\s-]?[\s9]?\d{4,5}-?\d{4}/g);
                                setFieldValue(
                                    'filter',
                                    value == phone?.[0] ? phone[0].replace(/[\(\)\.\s-]+/g, '') : value
                                );
                                onChange &&
                                    onChange(value == phone?.[0] ? phone[0].replace(/[\(\)\.\s-]+/g, '') : value);
                            }}
                            onKeyDown={(event) => {
                                onKeyPress && onKeyPress(event.key);
                                if (event.key === 'Enter') {
                                    submitted && submitted(values);
                                }
                            }}
                        />
                        {allowClear && values.filter && (
                            <CloseCircleOutlined
                                title={getTranslation('Clear filter')}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '52%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#aaa',
                                }}
                                onClick={() => {
                                    setFieldValue('filter', '');
                                    onChange && onChange('');
                                }}
                            />
                        )}
                    </Form>
                )}
            />
        </Wrapper>
    );
};

export default CommonFilter;
