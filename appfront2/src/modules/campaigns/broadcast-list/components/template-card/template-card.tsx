import { useTranslation } from 'react-i18next';
import { Card, Col, Flex, Form, Row, Select, Tag } from 'antd';
import { useEffect, useMemo } from 'react';
import { localeKeys } from '~/i18n';
import { normalizeText } from '~/utils/normalize-text';
import { useActiveMessageList } from '../../hooks/use-active-message-list';
import { useChannelConfigList } from '../../hooks/use-channel-config-list';
import { useOfficialTemplateList } from '../../hooks/use-official-template-list';
import type { BroadcastListFormValues } from '../../pages/create-broadcast-list/interfaces';
import { TemplateSelect } from '../template-select';
import type { TemplateCardProps } from './interfaces';

export const TemplateCard = ({
  canEdit = true,
  setSelectedTemplate,
  setSelectedActiveMessage,
}: TemplateCardProps) => {
  const form = Form.useFormInstance<BroadcastListFormValues>();
  const activeMessageSettingId = Form.useWatch('activeMessageSettingId', form);
  const templateId = Form.useWatch('templateId', form);
  const { activeMessageList, isLoadingActiveMessageList, fetchActiveMessageList } =
    useActiveMessageList();
  const { channelConfigList, isLoadingChannelConfigList, fetchChannelConfigList } =
    useChannelConfigList();

  const selectedActiveMessage = useMemo(() => {
    if (!activeMessageList) {
      return undefined;
    }

    return activeMessageList.find((activeMessage) => {
      return activeMessage.id === activeMessageSettingId;
    });
  }, [activeMessageList, activeMessageSettingId]);

  const selectedChannelConfig = useMemo(() => {
    if (!channelConfigList || !selectedActiveMessage) {
      return undefined;
    }

    return channelConfigList.data.find((channelConfig) => {
      return channelConfig.token === selectedActiveMessage.channelConfigToken;
    });
  }, [channelConfigList, selectedActiveMessage]);

  const { officialTemplateList, isLoadingOfficialTemplateList, fetchOfficialTemplateList } =
    useOfficialTemplateList({ channelConfigId: selectedChannelConfig?._id });

  const selectedTemplate = useMemo(() => {
    if (!officialTemplateList) {
      return undefined;
    }

    return officialTemplateList.data.find(
      (officialTemplate) => officialTemplate._id === templateId
    );
  }, [officialTemplateList, templateId]);

  const handleChangeActiveMessage = () => {
    form.setFieldsValue({ templateId: undefined });
  };

  const activeMessageOptions = useMemo(() => {
    if (!activeMessageList) {
      return [];
    }

    return activeMessageList.map((activeMessage) => {
      return { value: activeMessage.id, label: activeMessage.settingName };
    });
  }, [activeMessageList]);

  const { t } = useTranslation();

  const templateCardLocaleKeys = localeKeys.campaign.broadcastList.components.templateCard;

  useEffect(() => {
    setSelectedTemplate(selectedTemplate);
  }, [selectedTemplate, setSelectedTemplate]);

  useEffect(() => {
    if (selectedActiveMessage?.templateId) {
      form.setFieldsValue({ templateId: selectedActiveMessage?.templateId });
    }

    setSelectedActiveMessage(selectedActiveMessage);
  }, [form, selectedActiveMessage, setSelectedActiveMessage]);

  useEffect(() => {
    fetchOfficialTemplateList();
  }, [fetchOfficialTemplateList]);

  useEffect(() => {
    fetchActiveMessageList();
  }, [fetchActiveMessageList]);

  useEffect(() => {
    fetchChannelConfigList();
  }, [fetchChannelConfigList]);

  useEffect(() => {
    if (activeMessageList && activeMessageList.length === 1) {
      form.setFieldsValue({ activeMessageSettingId: activeMessageList[0].id });
    }
  }, [activeMessageList, form]);

  useEffect(() => {
    if (officialTemplateList && officialTemplateList.data.length === 1) {
      form.setFieldsValue({ templateId: officialTemplateList.data[0]._id });
    }
  }, [officialTemplateList, form]);

  const cardTitle = (
    <Flex justify='space-between'>
      <span>{t(templateCardLocaleKeys.cardTitleSpanMessage)}</span>
      {activeMessageSettingId && templateId ? (
        <Tag color='green'>{t(templateCardLocaleKeys.tagFilled)}</Tag>
      ) : (
        <Tag color='gold'>{t(templateCardLocaleKeys.tagWaiting)}</Tag>
      )}
    </Flex>
  );

  return (
    <Card title={cardTitle}>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name='activeMessageSettingId'
            label={t(templateCardLocaleKeys.formItemLabelActiveMessage)}
            rules={[
              {
                required: true,
                message: t(templateCardLocaleKeys.formItemRulesMessage),
              },
            ]}
          >
            <Select
              onChange={handleChangeActiveMessage}
              loading={isLoadingActiveMessageList || isLoadingChannelConfigList}
              options={activeMessageOptions}
              placeholder={t(templateCardLocaleKeys.selectPlaceholderMessage)}
              showSearch
              allowClear
              disabled={!canEdit}
              filterOption={(search, option) => {
                return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
              }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <TemplateSelect
            officialTemplateList={officialTemplateList}
            selectedActiveMessage={selectedActiveMessage}
            canEdit={canEdit}
            isLoading={isLoadingOfficialTemplateList || isLoadingChannelConfigList}
            activeMessageSettingId={activeMessageSettingId}
            selectedTemplate={selectedTemplate}
          />
        </Col>
      </Row>
    </Card>
  );
};
