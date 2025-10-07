import { GlobalOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Checkbox, Form, Select, Space } from 'antd';
import { useWatch } from 'antd/lib/form/Form';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { ApplicationScopeSectionProps } from './interfaces';

export const ApplicationScopeSection = ({
  form,
  isLoading,
  isLoadingChannelConfigList,
  teamOptions,
}: ApplicationScopeSectionProps) => {
  const { t } = useTranslation();
  const { applicationScopeSection: remiKeys } = localeKeys.settings.remi.components;

  const applyToAllChecked = useWatch('applyToAll', form);
  const selectTeamsChecked = useWatch('selectTeams', form);

  return (
    <Card title={`2. ${t(remiKeys.cardTitle)}`}>
      <Space>
        <Form.Item
          name='selectTeams'
          valuePropName='checked'
          style={{
            marginBottom: 16,
            padding: 12,
            border: selectTeamsChecked ? '2px solid #52c41a' : '1px solid #f0f0f0',
            borderRadius: 6,
            backgroundColor: selectTeamsChecked ? '#f6ffed' : 'transparent',
          }}
        >
          <Checkbox
            disabled={isLoading}
            onChange={(e) => {
              if (e.target.checked) {
                form.setFieldsValue({ applyToAll: false });
              }
            }}
          >
            <TeamOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            {t(remiKeys.selectTeamsCheckbox)}
          </Checkbox>
        </Form.Item>
        <Form.Item
          name='applyToAll'
          valuePropName='checked'
          style={{
            marginBottom: 16,
            padding: 12,
            border: applyToAllChecked ? '2px solid #1890ff' : '1px solid #f0f0f0',
            borderRadius: 6,
            backgroundColor: applyToAllChecked ? '#f0f8ff' : 'transparent',
          }}
        >
          <Checkbox
            disabled={isLoading}
            onChange={(e) => {
              if (e.target.checked) {
                form.setFieldsValue({ selectTeams: false, selectedTeamIds: [] });
              }
            }}
          >
            <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {t(remiKeys.applyToAllCheckbox)}
          </Checkbox>
        </Form.Item>
      </Space>

      <Form.Item
        name='selectedTeamIds'
        label={t(remiKeys.selectedTeamsLabel)}
        rules={[
          {
            validator: async (_, value) => {
              if (selectTeamsChecked && (!value || value.length === 0)) {
                throw new Error(t(remiKeys.selectedTeamsRequired));
              }
            },
          },
        ]}
      >
        <Select
          mode='multiple'
          placeholder={t(remiKeys.selectTeamsPlaceholder)}
          options={teamOptions}
          loading={isLoadingChannelConfigList}
          disabled={isLoading || !selectTeamsChecked}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          maxTagCount='responsive'
        />
      </Form.Item>
    </Card>
  );
};
