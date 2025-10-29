import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Checkbox, Col, Form, Input, Row, Space, Tooltip, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { DayOffTable } from '../day-off-table';
import { PeriodTimePicker } from '../period-time-picker';
import type { ServicePeriosProps } from './interfaces';

export const ServicePeriods = ({
  form,
  dayOffList,
  isTeamInactive,
  setDayOffList,
}: ServicePeriosProps) => {
  const { t } = useTranslation();
  const { servicePeriods } = localeKeys.settings.teams.components;

  return (
    <Card title={t(servicePeriods.title)}>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Typography.Title style={{ margin: 0 }} level={5}>
            {t(servicePeriods.workingHoursTitle)}
          </Typography.Title>
        </Col>
        <Col span={24}>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'sun']}
              label={t(servicePeriods.sunday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'mon']}
              label={t(servicePeriods.monday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'tue']}
              label={t(servicePeriods.tuesday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'wed']}
              label={t(servicePeriods.wednesday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'thu']}
              label={t(servicePeriods.thursday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'fri']}
              label={t(servicePeriods.friday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
          <Col span={24}>
            <PeriodTimePicker
              name={['attendancePeriods', 'sat']}
              label={t(servicePeriods.saturday)}
              form={form}
              isTeamInactive={isTeamInactive}
            />
          </Col>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Typography.Title style={{ margin: 0 }} level={5}>
            {t(servicePeriods.alertMessagesTitle)}
          </Typography.Title>
        </Col>
        <Col span={24}>
          <Col span={24}>
            <Form.Item
              name='assignMessage'
              label={
                <Space>
                  <Typography.Text>{t(servicePeriods.assignMessageLabel.text)}</Typography.Text>
                  <Tooltip title={t(servicePeriods.assignMessageLabel.tooltip)}>
                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Input.TextArea
                rows={5}
                placeholder={t(servicePeriods.placeholder)}
                disabled={isTeamInactive}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name='cannotAssignMessage'
              label={
                <Space>
                  <Typography.Text>
                    {t(servicePeriods.cannotAssignMessageLabel.text)}
                  </Typography.Text>
                  <Tooltip title={t(servicePeriods.cannotAssignMessageLabel.tooltip)}>
                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Input.TextArea
                rows={5}
                placeholder={t(servicePeriods.placeholder)}
                disabled={isTeamInactive}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item valuePropName='checked' name='cannotAssignEndConversation'>
              <Checkbox disabled={isTeamInactive}>
                {t(servicePeriods.endConversationCheckbox)}
              </Checkbox>
            </Form.Item>
          </Col>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <DayOffTable
          dayOffList={dayOffList}
          setDayOffList={setDayOffList}
          isTeamInactive={isTeamInactive}
        />
      </Row>
    </Card>
  );
};
