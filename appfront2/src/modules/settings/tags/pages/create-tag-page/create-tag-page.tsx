import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { generateRandomColor } from '~/utils/generate-random-color/generate-random-color';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useCreateTag } from '../../hooks/use-create-tag/use-create-tag';
import { TagFormValues } from './interfaces';

const { Paragraph } = Typography;

export const CreateTagPage = () => {
  const { t } = useTranslation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<TagFormValues>();
  const [selectedColor, setSelectedColor] = useState<string>(generateRandomColor());

  const { createTag, isCreating: isLoadingPage, error: createTagError } = useCreateTag();

  const createTagLocaleKeys = localeKeys.settings.tags.pages.createTagPage;
  const { children: tagModules } = routes.modules.children.settings.children.tags;
  const tagsListPath = generatePath(tagModules.tagsList.fullPath, { workspaceId });

  const handleFormSubmit = useCallback(
    async (values: TagFormValues) => {
      if (!workspaceId) {
        notifyError(t(createTagLocaleKeys.workspaceIdNotFound));
        return;
      }

      const result = await createTag({
        name: values.name.trim(),
        color: selectedColor,
        inactive: !values.active,
        workspaceId,
      });

      if (result) {
        notifySuccess({
          message: t(createTagLocaleKeys.successTitle),
          description: t(createTagLocaleKeys.createSuccess),
        });
        navigate(tagsListPath, { replace: true });
      }
    },
    [
      workspaceId,
      createTag,
      selectedColor,
      t,
      createTagLocaleKeys.workspaceIdNotFound,
      createTagLocaleKeys.successTitle,
      createTagLocaleKeys.createSuccess,
      navigate,
      tagsListPath,
    ]
  );

  const handleAddNewTag = useCallback(async () => {
    if (!workspaceId) {
      notifyError(t(createTagLocaleKeys.workspaceIdNotFound));
      return;
    }

    try {
      const values = await form.validateFields();
      const result = await createTag({
        name: values.name.trim(),
        color: selectedColor,
        inactive: !values.active,
        workspaceId,
      });

      if (result) {
        form.resetFields();
        form.setFieldsValue({ active: true });
        setSelectedColor(generateRandomColor());
        notifySuccess({
          message: t(createTagLocaleKeys.successTitle),
          description: t(createTagLocaleKeys.addAnotherSuccess),
        });
      }
    } catch (validationError) {
      notifyError(t(createTagLocaleKeys.messageErrorNewTag));
    }
  }, [
    workspaceId,
    t,
    createTagLocaleKeys.workspaceIdNotFound,
    createTagLocaleKeys.successTitle,
    createTagLocaleKeys.addAnotherSuccess,
    createTagLocaleKeys.messageErrorNewTag,
    form,
    createTag,
    selectedColor,
  ]);

  useEffect(() => {
    if (createTagError) {
      const errorMessage = createTagError?.response?.data?.message;
      if (errorMessage) {
        notifyError(t(createTagLocaleKeys.tagExistsWarning));
      } else {
        notifyError(t(createTagLocaleKeys.createError));
      }
    }
  }, [createTagError, createTagLocaleKeys.createError, createTagLocaleKeys.tagExistsWarning, t]);

  const renderActionButtons = () => (
    <Space style={{ width: '100%', justifyContent: 'flex-start' }}>
      <Button
        icon={<PlusOutlined />}
        onClick={handleAddNewTag}
        loading={isLoadingPage}
        disabled={isLoadingPage}
      >
        {t(createTagLocaleKeys.addAnotherButton)}
      </Button>
      <Space size='small'>
        <Link to={tagsListPath} replace>
          <Button disabled={isLoadingPage}>{t(createTagLocaleKeys.cancelButton)}</Button>
        </Link>
        <Button type='primary' form='submit-tag' htmlType='submit' loading={isLoadingPage}>
          {t(createTagLocaleKeys.saveButton)}
        </Button>
      </Space>
    </Space>
  );

  return (
    <PageTemplate title={t(createTagLocaleKeys.pageTitle)} actionButtons={renderActionButtons()}>
      <Form
        id='submit-tag'
        form={form}
        layout='vertical'
        onFinish={handleFormSubmit}
        initialValues={{ active: true }}
      >
        <Spin spinning={isLoadingPage}>
          <Card>
            <Space direction='vertical' size='middle' style={{ width: '100%' }}>
              <Paragraph>{t(createTagLocaleKeys.sectionTitle)}</Paragraph>
              <Divider style={{ margin: '0px' }} />

              <Row gutter={16} align='top'>
                <Col xs={24} sm={24} md={12} lg={10}>
                  <Form.Item
                    name='name'
                    label={t(createTagLocaleKeys.fieldNameLabel)}
                    rules={[{ required: true, message: t(createTagLocaleKeys.fieldNameRequired) }]}
                  >
                    <Input
                      placeholder={t(createTagLocaleKeys.fieldNamePlaceholder)}
                      maxLength={100}
                      disabled={isLoadingPage}
                    />
                  </Form.Item>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Item
                    name='active'
                    label={t(createTagLocaleKeys.fieldStatusLabel)}
                    valuePropName='checked'
                  >
                    <Switch
                      checkedChildren={t(createTagLocaleKeys.statusActive)}
                      unCheckedChildren={t(createTagLocaleKeys.statusInactive)}
                      disabled={isLoadingPage}
                    />
                  </Form.Item>
                </Col>
                <Col md={8} lg={7}>
                  <Form.Item label={t(createTagLocaleKeys.fieldColorLabel)}>
                    <ColorPicker
                      value={selectedColor}
                      onChange={(_color: Color, hex: string) => setSelectedColor(hex)}
                      size='middle'
                      showText
                      disabled={isLoadingPage}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Space>
          </Card>
        </Spin>
      </Form>
    </PageTemplate>
  );
};
