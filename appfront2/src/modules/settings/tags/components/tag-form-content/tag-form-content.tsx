import { Col, ColorPicker, Form, Input, Row, Switch } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { TagFormContentProps } from './interfaces';

export const TagFormContent = ({
  form,
  selectedColor,
  setSelectedColor,
  isSystemAdmin,
  isSaving,
  isDeleting,
  isFetchingTags,
  onFinish,
}: TagFormContentProps) => {
  const tagFormContentLocaleKeys = localeKeys.settings.tags.components.TagFormContent;
  const { t } = useTranslation();

  return (
    <Form
      form={form}
      layout='vertical'
      initialValues={{ active: true }}
      onFinish={onFinish}
      disabled={isSaving || isDeleting || isFetchingTags}
    >
      <Form.Item
        name='name'
        label={t(tagFormContentLocaleKeys.fieldNameLabel)}
        rules={[{ required: true, message: t(tagFormContentLocaleKeys.fieldNameRequiredMessage) }]}
      >
        <Input
          disabled={!isSystemAdmin}
          placeholder={t(tagFormContentLocaleKeys.fieldNamePlaceholder)}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col flex='1'>
          <Form.Item
            name='active'
            valuePropName='checked'
            label={t(tagFormContentLocaleKeys.fieldStatusLabel)}
          >
            <Switch
              checkedChildren={t(tagFormContentLocaleKeys.statusActive)}
              unCheckedChildren={t(tagFormContentLocaleKeys.statusInactive)}
            />
          </Form.Item>
        </Col>

        <Col flex='1'>
          <Form.Item label={t(tagFormContentLocaleKeys.fieldColorLabel)}>
            <ColorPicker
              value={selectedColor}
              onChange={(_value: Color, hex: string) => setSelectedColor(hex)}
              showText
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
