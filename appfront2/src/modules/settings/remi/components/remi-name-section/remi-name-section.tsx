import { Card, Form, Input, Radio, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { RemiNameSectionProps } from './interfaces';

export const RemiNameSection = ({ isLoading, isSaving }: RemiNameSectionProps) => {
  const { t } = useTranslation();
  const { remiNameSection: remiKeys } = localeKeys.settings.remi.components;

  return (
    <Card title={`1. ${t(remiKeys.nameSectionTitle)}`}>
      <Form.Item
        label={t(remiKeys.nameInputLabel)}
        name='name'
        rules={[
          { required: true },
          {
            max: 100,
            message: t(remiKeys.nameInputMaxLengthError),
          },
        ]}
      >
        <Input disabled={isLoading || isSaving} />
      </Form.Item>
      <Form.Item
        label={t(remiKeys.activationModeLabel)}
        name='automaticReactivate'
        tooltip={t(remiKeys.activationModeTooltip)}
      >
        <Radio.Group>
          <Space direction='vertical'>
            <Radio value={false}>
              <>
                <strong>{t(remiKeys.activationModeTooltipName)}</strong> -
                {t(remiKeys.immediateActivation)}
              </>
            </Radio>

            <Radio value>
              <>
                <strong>{t(remiKeys.smartMonitoringActivationName)}</strong> -
                {t(remiKeys.smartMonitoringActivation)}
              </>
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
    </Card>
  );
};
