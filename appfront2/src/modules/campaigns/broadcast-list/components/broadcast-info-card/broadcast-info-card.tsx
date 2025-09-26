import { useTranslation } from 'react-i18next';
import { Card, Col, Flex, Form, Input, Row, Tag } from 'antd';
import { localeKeys } from '~/i18n';
import { hasOnlyWhitespaces } from '~/utils/antd-form-validators';
import type { BroadcastListFormValues } from '../../pages/create-broadcast-list/interfaces';
import type { BroadcastInfoCardProps } from './interfaces';

export const BroadcastInfoCard = ({ canEdit = true }: BroadcastInfoCardProps) => {
  const form = Form.useFormInstance<BroadcastListFormValues>();
  const name = Form.useWatch('name', form);

  const { t } = useTranslation();

  const broadcastInfoCardLocaleKeys =
    localeKeys.campaign.broadcastList.components.broadcastInfoCard;

  const cardTitle = (
    <Flex justify='space-between'>
      <span>{t(broadcastInfoCardLocaleKeys.labelListName)}</span>
      {name ? (
        <Tag color='green'>{t(broadcastInfoCardLocaleKeys.tagFilled)}</Tag>
      ) : (
        <Tag color='gold'>{t(broadcastInfoCardLocaleKeys.tagWaiting)}</Tag>
      )}
    </Flex>
  );

  return (
    <Card title={cardTitle}>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name='name'
            label={t(broadcastInfoCardLocaleKeys.labelListName)}
            rules={[
              { required: true, message: t(broadcastInfoCardLocaleKeys.rulesMessage) },
              hasOnlyWhitespaces(t(broadcastInfoCardLocaleKeys.rulesWhitespaces)),
            ]}
          >
            <Input
              placeholder={t(broadcastInfoCardLocaleKeys.inputPlaceholder)}
              disabled={!canEdit}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
