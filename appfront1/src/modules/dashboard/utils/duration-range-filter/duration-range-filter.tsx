import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, InputNumber, Row } from 'antd';
import { useEffect, useState } from 'react';
import { useLanguageContext } from '../../../i18n/context';
import { RangeFilterProps, RangeTime } from './interfaces';
import { ColonWrapper } from './styles';

export const DurationRangeFilter = <T extends { [key: string]: [number | null, number | null] }>({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
    setFilterValues,
    close,
    initialFilters,
    dataIndex,
}: RangeFilterProps<T>) => {
    const [form] = Form.useForm();
    const { getTranslation } = useLanguageContext();
    const [hasErrors, setHasErrors] = useState(false);

    const convertMillisecondsToTime = (milliseconds: number | null): [number, number, number] => {
        const ms = milliseconds || 0;
        const days = Math.floor(ms / 86400000);
        const hours = Math.floor((ms % 86400000) / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return [days, hours, minutes];
    };

    useEffect(() => {
        const savedFilters = initialFilters?.[dataIndex] || [null, null];
        const [savedMin, savedMax] = savedFilters.map(convertMillisecondsToTime);
        form.setFieldsValue({
            'min-days': savedMin[0] === 0 ? null : savedMin[0],
            'min-hrs': savedMin[1] === 0 ? null : savedMin[1],
            'min-min': savedMin[2] === 0 ? null : savedMin[2],
            'max-days': savedMax[0] === 0 ? null : savedMax[0],
            'max-hrs': savedMax[1] === 0 ? null : savedMax[1],
            'max-min': savedMax[2] === 0 ? null : savedMax[2],
        });
    }, [initialFilters, form, dataIndex]);

    const parseTimeToMilliseconds = (days: RangeTime, hours: RangeTime, minutes: RangeTime) => {
        const totalMilliseconds =
            (Number(days) || 0) * 86400000 + (Number(hours) || 0) * 3600000 + (Number(minutes) || 0) * 60000;
        return totalMilliseconds;
    };

    const handleFilter = () => {
        const minDays = form.getFieldValue('min-days');
        const minHours = form.getFieldValue('min-hrs');
        const minMinutes = form.getFieldValue('min-min');
        const maxDays = form.getFieldValue('max-days');
        const maxHours = form.getFieldValue('max-hrs');
        const maxMinutes = form.getFieldValue('max-min');

        const minValue = parseTimeToMilliseconds(minDays, minHours, minMinutes);
        const maxValue = parseTimeToMilliseconds(maxDays, maxHours, maxMinutes);

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

    const validateMaxTime = () => {
        const minDays = form.getFieldValue('min-days');
        const minHours = form.getFieldValue('min-hrs');
        const minMinutes = form.getFieldValue('min-min');
        const maxDays = form.getFieldValue('max-days');
        const maxHours = form.getFieldValue('max-hrs');
        const maxMinutes = form.getFieldValue('max-min');

        const minValue = parseTimeToMilliseconds(minDays, minHours, minMinutes);
        const maxValue = parseTimeToMilliseconds(maxDays, maxHours, maxMinutes);

        if (maxValue < minValue) {
            setHasErrors(true);
            form.setFields([
                { name: 'max-days', errors: [''] },
                { name: 'max-hrs', errors: [''] },
                { name: 'max-min', errors: [''] },
            ]);
        } else {
            setHasErrors(false);
            form.setFields([
                { name: 'max-days', errors: [] },
                { name: 'max-hrs', errors: [] },
                { name: 'max-min', errors: [] },
            ]);
        }
    };

    return (
        <Card
            style={{ maxWidth: 400 }}
            title={getTranslation('Value Filter')}
            extra={<CloseOutlined onClick={close} style={{ cursor: 'pointer' }} />}
        >
            <Form
                form={form}
                layout='horizontal'
                labelCol={{ span: 7 }}
                wrapperCol={{ span: 17 }}
                onValuesChange={validateMaxTime}
            >
                <Row>
                    <Col span={24}>
                        <Form.Item label={getTranslation('Minimum time')}>
                            <Row gutter={8}>
                                <Col span={7}>
                                    <Form.Item noStyle name='min-days'>
                                        <InputNumber
                                            title={getTranslation('Days')}
                                            min={0}
                                            max={9999}
                                            placeholder={getTranslation('Days')}
                                            style={{ width: '100%' }}
                                            type='number'
                                        />
                                    </Form.Item>
                                </Col>
                                <ColonWrapper>:</ColonWrapper>
                                <Col span={7}>
                                    <Form.Item noStyle name='min-hrs'>
                                        <InputNumber
                                            title={getTranslation('Hours')}
                                            min={0}
                                            max={24}
                                            placeholder={getTranslation('Hours')}
                                            style={{ width: '100%' }}
                                            type='number'
                                        />
                                    </Form.Item>
                                </Col>
                                <ColonWrapper>:</ColonWrapper>
                                <Col span={7}>
                                    <Form.Item noStyle name='min-min'>
                                        <InputNumber
                                            title={getTranslation('Minutes')}
                                            min={0}
                                            max={59}
                                            placeholder={getTranslation('Minutes')}
                                            style={{ width: '100%' }}
                                            type='number'
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item label={getTranslation('Maximum time')}>
                            <Row gutter={8}>
                                <Col span={7}>
                                    <Form.Item noStyle name='max-days'>
                                        <InputNumber
                                            title={getTranslation('Days')}
                                            min={0}
                                            max={9999}
                                            placeholder={getTranslation('Days')}
                                            style={{ width: '100%' }}
                                            type='number'
                                        />
                                    </Form.Item>
                                </Col>
                                <ColonWrapper>:</ColonWrapper>
                                <Col span={7}>
                                    <Form.Item noStyle name='max-hrs'>
                                        <InputNumber
                                            title={getTranslation('Hours')}
                                            min={0}
                                            max={24}
                                            placeholder={getTranslation('Hours')}
                                            style={{ width: '100%' }}
                                            type='number'
                                        />
                                    </Form.Item>
                                </Col>
                                <ColonWrapper>:</ColonWrapper>
                                <Col span={7}>
                                    <Form.Item noStyle name='max-min'>
                                        <InputNumber
                                            title={getTranslation('Minutes')}
                                            min={0}
                                            max={59}
                                            placeholder={getTranslation('Minutes')}
                                            style={{ width: '100%' }}
                                            type='number'
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                    </Col>
                </Row>
                <Row justify={'space-between'}>
                    <Button onClick={handleClear} type='link' size='small'>
                        {getTranslation('Clear')}
                    </Button>
                    <Button type='primary' onClick={handleFilter} size='small' disabled={hasErrors}>
                        {getTranslation('Filter')}
                    </Button>
                </Row>
            </Form>
        </Card>
    );
};
