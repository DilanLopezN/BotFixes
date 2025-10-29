import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Card,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Form,
  notification,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { isDateSameOrBeforeNow } from '~/utils/antd-form-validators';
import { normalizeText } from '~/utils/normalize-text';
import { useCampaignActionList } from '../../hooks/use-campaign-action-list';
import type { BroadcastListFormValues } from '../../pages/create-broadcast-list/interfaces';
import type { SchedulingCardProps } from './interfaces';

export const SchedulingCard = ({ canEdit = true, selectedTemplate }: SchedulingCardProps) => {
  const form = Form.useFormInstance<BroadcastListFormValues>();
  const { campaignActionList, isLoadingCampaignActionList, fetchCampaignActionList } =
    useCampaignActionList();

  const sendAt = Form.useWatch('sendAt', form);
  const immediateStart = Form.useWatch('immediateStart', form);

  const campaignActionOptions = useMemo(() => {
    if (!campaignActionList) {
      return [];
    }

    return campaignActionList.map((campaignAction) => {
      return { value: campaignAction.action, label: campaignAction.name };
    });
  }, [campaignActionList]);

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < dayjs().startOf('day');
  };

  const disabledDateTime = (date: Dayjs) => {
    const currentDate = dayjs();
    return {
      disabledHours: () => {
        if (currentDate.isSame(date, 'day')) {
          return Array.from({ length: 24 }, (_, i) => i).filter(
            (hour) => hour < currentDate.hour()
          );
        }
        return [];
      },
      disabledMinutes: (selectedHour: number) => {
        if (currentDate.isSame(date, 'day') && selectedHour === currentDate.hour()) {
          return Array.from({ length: 60 }, (_, i) => i).filter(
            (minute) => minute <= currentDate.minute()
          );
        }
        return [];
      },
    };
  };

  const { t } = useTranslation();

  const schedulingCardLocaleKeys = localeKeys.campaign.broadcastList.components.schedulingCard;

  const handleChangeAction = (checked: any) => {
    if (checked) {
      notification.warning({
        message: t(schedulingCardLocaleKeys.notificationAttentionTitle),
        description: t(schedulingCardLocaleKeys.notificationWarningCustomFlow),
        duration: 10000,
        placement: 'bottomLeft',
      });
    }
  };

  const handleChangeIsTest = (event: CheckboxChangeEvent) => {
    if (event.target.checked) {
      notification.warning({
        message: t(schedulingCardLocaleKeys.notificationAttentionTitle),
        description: t(schedulingCardLocaleKeys.tooltipIsTest),
        duration: 10000,
        placement: 'bottomLeft',
      });
    }
  };

  useEffect(() => {
    fetchCampaignActionList();
  }, [fetchCampaignActionList]);

  useEffect(() => {
    if (selectedTemplate && campaignActionList) {
      const selectedAction = campaignActionList?.find(
        (act) => act.action === selectedTemplate?.action
      );
      if (selectedAction) {
        form.setFieldsValue({
          action: selectedAction.action,
        });
      }
    }
  }, [form, selectedTemplate?.action, campaignActionList, selectedTemplate]);

  const cardTitle = (
    <Flex justify='space-between'>
      <span>{t(schedulingCardLocaleKeys.cardTitleSpanConfigSend)}</span>
      {sendAt || immediateStart ? (
        <Tag color='green'>{t(schedulingCardLocaleKeys.tagFilled)}</Tag>
      ) : (
        <Tag color='gold'>{t(schedulingCardLocaleKeys.tagWaiting)}</Tag>
      )}
    </Flex>
  );

  return (
    <Card title={cardTitle}>
      <Row gutter={16}>
        <Col span={14}>
          <Form.Item
            name='sendAt'
            label={t(schedulingCardLocaleKeys.placeholderDate)}
            dependencies={['immediateStart']}
            rules={
              !immediateStart
                ? [isDateSameOrBeforeNow(t(schedulingCardLocaleKeys.invalidDate))]
                : undefined
            }
          >
            <DatePicker
              disabled={immediateStart || !canEdit}
              style={{ width: '100%' }}
              allowClear
              format='DD/MM/YYYY HH:mm'
              placeholder={t(schedulingCardLocaleKeys.placeholderDate)}
              showTime
              disabledDate={disabledDate}
              disabledTime={disabledDateTime}
            />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item
            name='immediateStart'
            label={
              <Space align='center'>
                <span>{t(schedulingCardLocaleKeys.forItemLabelSend)}</span>
                <Tooltip title={t(schedulingCardLocaleKeys.tooltipImmediateSend)}>
                  <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                </Tooltip>
              </Space>
            }
          >
            <Switch disabled={!canEdit} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name='action'
            label={
              <Space align='center'>
                <span>{t(schedulingCardLocaleKeys.forItemLabelCustomFlow)}</span>
                <Tooltip title={t(schedulingCardLocaleKeys.notificationWarningCustomFlow)}>
                  <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                </Tooltip>
              </Space>
            }
          >
            <Select
              loading={isLoadingCampaignActionList}
              options={campaignActionOptions}
              placeholder={t(schedulingCardLocaleKeys.selectPlaceholderCustomFlow)}
              allowClear
              showSearch
              onChange={handleChangeAction}
              disabled={!canEdit}
              filterOption={(search, option) => {
                return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
              }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name='isTest' label='' valuePropName='checked'>
            <Checkbox onChange={handleChangeIsTest} disabled={!canEdit}>
              <Space align='center'>
                <span>{t(schedulingCardLocaleKeys.checkboxLabelIsTest)}</span>
                <Tooltip title={t(schedulingCardLocaleKeys.notificationWarningIsTest)}>
                  <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
