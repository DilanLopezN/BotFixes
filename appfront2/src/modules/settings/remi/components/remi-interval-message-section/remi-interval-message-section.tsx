import { Card, Col, Form, Input, Space, TimePicker } from 'antd';
import { RuleObject } from 'antd/es/form';
import { StoreValue } from 'antd/es/form/interface';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { totalTimeValidator } from '../../utils/convert-time';
import { intervalNames } from './constants';
import { RemiIntervalMessageSectionProps } from './interfaces';

export const RemiIntervalMessageSection = ({
  sectionNumber,
  titleKey,
  descriptionKey,
  messageLabelKey,
  intervalName,
  messageContentName,
  isLoading,
  isSaving,
}: RemiIntervalMessageSectionProps) => {
  const { t } = useTranslation();

  const { remiIntervalMessageSection: remiKeys } = localeKeys.settings.remi.components;
  const form = Form.useFormInstance();

  const validateThisInterval = (_: RuleObject, value: StoreValue): Promise<void> => {
    const allowZeroTime = sectionNumber === 1;
    return totalTimeValidator(_, value, form, intervalNames, t, allowZeroTime);
  };

  return (
    <Card
      title={
        <>
          {sectionNumber + 2}. {t(titleKey)}
        </>
      }
    >
      <Col span={24}>
        <p>{t(descriptionKey)}</p>
        <Form.Item label={t(remiKeys.intervalLabel)} style={{ marginBottom: 8 }}>
          <Space align='baseline'>
            <Form.Item
              name={intervalName}
              noStyle
              rules={[{ required: true }, { validator: validateThisInterval }]}
              getValueFromEvent={(time: dayjs.Dayjs | null) =>
                time ? time.format('HH:mm') : '00:00'
              }
              getValueProps={(value: string) => ({ value: value ? dayjs(value, 'HH:mm') : null })}
            >
              <TimePicker
                format='HH:mm'
                minuteStep={1}
                style={{ width: 120 }}
                disabled={isLoading || isSaving}
                defaultOpenValue={dayjs('00:05', 'HH:mm')}
                showNow={false}
                disabledTime={() => ({
                  disabledHours: () => {
                    return Array.from({ length: 24 }, (_, i) => i).filter((i) => i > 5);
                  },
                  disabledMinutes: (selectedHour) => {
                    const isFirstSection = sectionNumber === 1;
                    if (selectedHour === 0) {
                      return isFirstSection ? [] : [0, 1];
                    }
                    if (selectedHour === 5) {
                      return Array.from({ length: 59 }, (_, i) => i + 1);
                    }
                    return [];
                  },
                })}
              />
            </Form.Item>
          </Space>
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item
          label={t(messageLabelKey)}
          name={messageContentName}
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={6} disabled={isLoading || isSaving} />
        </Form.Item>
      </Col>
    </Card>
  );
};
