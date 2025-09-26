import { useTranslation } from 'react-i18next';
import { EyeOutlined } from '@ant-design/icons';
import { Button, Col, Form, Modal, Row, Select, Tooltip } from 'antd';
import { useMemo } from 'react';
import { localeKeys } from '~/i18n';
import { TemplateMessage } from '~/interfaces/template-message';
import { ActivityPreview } from '../activity-preview';
import { TemplateSelectProps } from './interfaces';

export const TemplateSelect = ({
  officialTemplateList,
  selectedActiveMessage,
  canEdit,
  isLoading,
  activeMessageSettingId,
  selectedTemplate,
}: TemplateSelectProps) => {
  const officialTemplateOptions = useMemo(() => {
    if (!officialTemplateList) return [];

    return officialTemplateList.data.map((officialTemplate) => ({
      value: officialTemplate._id,
      name: officialTemplate.name,
      label: officialTemplate.name,
    }));
  }, [officialTemplateList]);

  const { t } = useTranslation();

  const templateSelectListLocaleKeys = localeKeys.campaign.broadcastList.components.templateSelect;

  const showConfirm = (template: TemplateMessage) => {
    if (!template) return;

    Modal.info({
      icon: null,
      title: t(templateSelectListLocaleKeys.modalInfoTitle),
      width: 500,
      content: (
        <ActivityPreview
          message={template.message}
          buttons={template.buttons}
          variables={template.variables}
          file={
            template.fileUrl
              ? {
                  type: template.fileContentType || '',
                  url: template.fileUrl,
                  name: template.fileOriginalName || '',
                  size: template.fileSize || 0,
                }
              : undefined
          }
        />
      ),
      okText: 'Fechar',
      okButtonProps: { type: 'default' },
    });
  };

  const handlePreviewClick = () => {
    if (selectedTemplate) {
      showConfirm(selectedTemplate);
    }
  };

  return (
    <Row>
      <Col span={22}>
        <Form.Item
          name='templateId'
          label={t(templateSelectListLocaleKeys.labelForItemTemplate)}
          rules={[
            { required: true, message: t(templateSelectListLocaleKeys.rulesMessageTemplate) },
          ]}
        >
          <Select
            loading={isLoading}
            options={officialTemplateOptions}
            disabled={
              !canEdit || !selectedActiveMessage || Boolean(selectedActiveMessage.templateId)
            }
            placeholder={
              activeMessageSettingId
                ? t(templateSelectListLocaleKeys.placeholderMessageSettingId)
                : t(templateSelectListLocaleKeys.placeholderMessageTemplate)
            }
            showSearch
            filterOption={(search, option) => {
              if (!option) {
                return false;
              }
              return option.name.toLowerCase().includes(search.toLowerCase());
            }}
            allowClear
          />
        </Form.Item>
      </Col>
      <Col span={2}>
        <Form.Item label=' '>
          <Tooltip title={t(templateSelectListLocaleKeys.titleViewMessage)}>
            <Button
              type='link'
              icon={<EyeOutlined />}
              onClick={handlePreviewClick}
              disabled={!selectedTemplate}
            />
          </Tooltip>
        </Form.Item>
      </Col>
    </Row>
  );
};
