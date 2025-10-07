import { Form, Modal, Radio, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { CopyConfigModalProps } from './interfaces';
import { StyledRadioButton } from './styles';

export const CopyConfigModal = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  targetOptions,
}: CopyConfigModalProps) => {
  const { t } = useTranslation();
  const { copyConfigModal: remiKeys } = localeKeys.settings.remi.components;
  const [form] = Form.useForm<{ targetRemiId: string }>();

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={t(remiKeys.title)}
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={t(remiKeys.okText)}
      cancelText={t(remiKeys.cancelText)}
    >
      <Form form={form} onFinish={(values) => onConfirm(values.targetRemiId)} layout='vertical'>
        <Form.Item
          name='targetRemiId'
          label={t(remiKeys.targetLabel)}
          rules={[{ required: true, message: t(remiKeys.targetRequired) }]}
        >
          <Radio.Group optionType='button' buttonStyle='solid' disabled={loading}>
            <Space direction='vertical'>
              {targetOptions.map((option) => (
                <Tooltip title={option.label}>
                  <StyledRadioButton key={option.value} value={option.value}>
                    {option.label}
                  </StyledRadioButton>
                </Tooltip>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};
