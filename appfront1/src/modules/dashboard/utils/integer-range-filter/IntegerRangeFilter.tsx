import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Row } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { useEffect } from 'react';
import { useLanguageContext } from '../../../i18n/context';
import { RangeFilterProps } from '../duration-range-filter/interfaces';

export const IntegerRangeFilter = <T extends { [key: string]: [number | null, number | null] }>({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
    setFilterValues,
    close,
    initialFilters,
    dataIndex,
}: RangeFilterProps<T>) => {
    const [form] = useForm();
    const { getTranslation } = useLanguageContext();

    const handleFilter = () => {
        const minValue = Number(form.getFieldValue('min')) || 0;
        const maxValue = Number(form.getFieldValue('max')) || 0;

        if (minValue > maxValue) {
            form.setFields([
                { name: 'min', errors: [''] },
                { name: 'max', errors: [''] },
            ]);
            return;
        }

        setSelectedKeys([minValue, maxValue]);
        setFilterValues(minValue, maxValue);
        confirm();
    };

    const handleClear = () => {
        form.resetFields();
        setSelectedKeys([]);
        setFilterValues(null, null);
        if (clearFilters) {
            clearFilters();
            confirm();
        }
    };

    useEffect(() => {
        const savedFilters = initialFilters?.[dataIndex] || [null, null];
        form.setFieldsValue({
            min: savedFilters[0] ?? null,
            max: savedFilters[1] ?? null,
        });
    }, [form, initialFilters, dataIndex]);

    return (
        <Card
            style={{ maxWidth: 240 }}
            title={getTranslation('Value Filter')}
            extra={<CloseOutlined onClick={close} style={{ cursor: 'pointer' }} />}
        >
            <Form form={form} layout='horizontal' labelCol={{ span: 12 }} wrapperCol={{ span: 11 }}>
                <Row justify={'space-between'}>
                    <Form.Item
                        label={getTranslation('Minimum value')}
                        name='min'
                        rules={[
                            {
                                validator(_, value) {
                                    const max = Number(form.getFieldValue('max'));
                                    const min = Number(value);
                                    if (min && max && min > max) {
                                        return Promise.reject(new Error());
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input type='number' min={0} max={99999} style={{ width: '100%', marginBottom: 8 }} />
                    </Form.Item>
                    <Form.Item
                        label={getTranslation('Maximum value')}
                        name='max'
                        rules={[
                            {
                                validator(_, value) {
                                    const min = Number(form.getFieldValue('min'));
                                    const max = Number(value);
                                    if (min && max && min > max) {
                                        return Promise.reject(new Error());
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input type='number' min={0} max={99999} style={{ width: '100%', marginBottom: 8 }} />
                    </Form.Item>
                </Row>
                <Row justify={'space-between'}>
                    <Button onClick={handleClear} type='link' size='small'>
                        {getTranslation('Clear')}
                    </Button>
                    <Button onClick={handleFilter} type='primary' size='small'>
                        {getTranslation('Filter')}
                    </Button>
                </Row>
            </Form>
        </Card>
    );
};
