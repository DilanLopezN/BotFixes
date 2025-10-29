import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Checkbox, Col, Form, Input, Row, Select, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NumberInput } from '~/components/number-input';
import { localeKeys } from '~/i18n';
import type { TeamInfoProps } from './interfaces';

export const TeamInfo = ({ isTeamInactive }: TeamInfoProps) => {
  const { t } = useTranslation();
  const { teamInfo } = localeKeys.settings.teams.components;

  return (
    <Card title={t(teamInfo.nameCard)}>
      <Row gutter={16}>
        <Col span={11}>
          <Form.Item
            name='name'
            label={t(teamInfo.labelTeam)}
            rules={[{ required: true, message: t(teamInfo.requiredFieldMessage) }]}
          >
            <Input disabled={isTeamInactive} />
          </Form.Item>
        </Col>
        <Col span={3}>
          <Form.Item
            name='priority'
            label={
              <Space>
                <span>{t(teamInfo.labelPriority)}</span>
                <Tooltip title={t(teamInfo.tooltipPriority)}>
                  <InfoCircleOutlined style={{ color: '#1677ff' }} />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: t(teamInfo.requiredFieldMessage) }]}
          >
            <NumberInput allowNegativeValue showArrows disabled={isTeamInactive} />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item
            name='reassignConversationInterval'
            label={
              <Space>
                <span>{t(teamInfo.labelReassignService)}</span>
                {/* <Tooltip title='Navegar para o artigo'>
                  <Link to='https://botdesigner.tawk.help/' target='_blank'>
                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
                  </Link>
                </Tooltip> */}
              </Space>
            }
            rules={[{ required: true, message: t(teamInfo.requiredFieldMessage) }]}
          >
            <Select disabled={isTeamInactive}>
              <Select.Option value={0}>{t(teamInfo.neverAllowOption)}</Select.Option>
              <Select.Option value={60000}>{t(teamInfo.oneMinuteOption)}</Select.Option>
              <Select.Option value={120000}>{t(teamInfo.twoMinutesOption)}</Select.Option>
              <Select.Option value={180000}>{t(teamInfo.threeMinutesOption)}</Select.Option>
              <Select.Option value={300000}>{t(teamInfo.fiveMinutesOption)}</Select.Option>
              <Select.Option value={600000}>{t(teamInfo.tenMinutesOption)}</Select.Option>
              <Select.Option value={900000}>{t(teamInfo.fifteenMinutesOption)}</Select.Option>
              <Select.Option value={1800000}>{t(teamInfo.thirtyMinutesOption)}</Select.Option>
              <Select.Option value={3600000}>{t(teamInfo.oneHourOption)}</Select.Option>
              <Select.Option value={7200000}>{t(teamInfo.twoHoursOption)}</Select.Option>
              <Select.Option value={18000000}>{t(teamInfo.fiveHoursOption)}</Select.Option>
              <Select.Option value={36000000}>{t(teamInfo.tenHoursOption)}</Select.Option>
              <Select.Option value={72000000}>{t(teamInfo.twentyHoursOption)}</Select.Option>
              <Select.Option value={86400000}>{t(teamInfo.oneDayOption)}</Select.Option>
              <Select.Option value={172800000}>{t(teamInfo.twoDaysOption)}</Select.Option>
              <Select.Option value={259200000}>{t(teamInfo.threeDaysOption)}</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Form.Item noStyle name='notificationNewAttendance' valuePropName='checked'>
            <Checkbox disabled={isTeamInactive}>
              <Space>
                <span>{t(teamInfo.notificationNewAttendance)}</span>
                <Tooltip title={t(teamInfo.navigateToArticle)}>
                  <Link
                    to='https://botdesigner.tawk.help/article/como-habilitar-notifica%C3%A7%C3%A3o-de-um-novo-atendimento'
                    target='_blank'
                  >
                    <InfoCircleOutlined style={{ color: '#1677ff' }} />
                  </Link>
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item noStyle name='canReceiveTransfer' valuePropName='checked'>
            <Checkbox disabled={isTeamInactive}>{t(teamInfo.canReceiveTransfer)}</Checkbox>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item noStyle name='viewPublicDashboard' valuePropName='checked'>
            <Checkbox disabled={isTeamInactive}>{t(teamInfo.viewPublicDashboard)}</Checkbox>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item noStyle name='requiredConversationCategorization' valuePropName='checked'>
            <Checkbox disabled={isTeamInactive}>
              <Space>
                {t(teamInfo.categorizationRequired)}
                <Tooltip title={t(teamInfo.categorizationTooltip)}>
                  <InfoCircleOutlined style={{ color: '#1677ff' }} />
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
