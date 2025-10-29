import { Button, Col, Flex, Form, Modal, Row, Select, Space, Tooltip } from 'antd';
import type { ModalFooterRender } from 'antd/es/modal/interface';
import { BaseOptionType } from 'antd/es/select';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlowCategoryEnum } from '~/constants/flow-category';
import { useQueryString } from '~/hooks/use-query-string';
import { localeKeys } from '~/i18n';
import { normalizeText } from '~/utils/normalize-text';
import { flowCategoryHelpMap, flowCategoryLabelMap } from '../../constants';
import { useFlowCategories } from '../../hooks/use-flow-categories';
import { WhatsAppFlowQueryStrings } from '../../interfaces';
import { FiltersFormValues, FiltersModalProps, FlowCategory } from './interfaces';

export const FiltersModal = ({ isVisible, onClose }: FiltersModalProps) => {
  const [form] = Form.useForm<FiltersFormValues>();
  const { flowCategories, isFetchingFlowCategories } = useFlowCategories();

  const { queryStringAsObj, updateQueryString } = useQueryString<WhatsAppFlowQueryStrings>();
  const { t } = useTranslation();
  const filtersModalLocaleKeys = localeKeys.settings.whatsAppFlow.components.filtersModal;

  const defaultCategoryOptions = Object.entries(flowCategoryLabelMap).map(
    ([category, i18nKey], idx) => ({
      label: t(i18nKey),
      value: idx + 1,
    })
  );

  const categoryOptions = useMemo<BaseOptionType[]>(() => {
    const optionsSource: Array<FlowCategory | { label: string; value: number }> =
      flowCategories?.length ? flowCategories : defaultCategoryOptions;

    if (!Array.isArray(optionsSource) || optionsSource.length === 0) {
      return [];
    }

    return optionsSource.reduce((acc: BaseOptionType[], item: FlowCategory | any) => {
      const categoryKey: FlowCategoryEnum = item.category;
      const optionValue: string | number | null | undefined = item.id ?? item.value;

      if (!categoryKey || optionValue == null) {
        return acc;
      }

      const labelText = t(flowCategoryLabelMap[categoryKey] || categoryKey);
      const tooltipText = t(flowCategoryHelpMap[categoryKey] || categoryKey);

      acc.push({
        label: <Tooltip title={tooltipText}>{labelText}</Tooltip>,
        value: optionValue as string | number,
      });

      return acc;
    }, []);
  }, [defaultCategoryOptions, flowCategories, t]);

  const channelStatusOptions = [
    { label: t(filtersModalLocaleKeys.status.active), value: 'active' },
    { label: t(filtersModalLocaleKeys.status.inactive), value: 'inactive' },
  ];

  const handleFinishConversation = (values: FiltersFormValues) => {
    updateQueryString(values);
    onClose();
  };

  useEffect(() => {
    if (!form || !flowCategories?.length) return;

    const categoriesIds = queryStringAsObj.categoriesIds
      ?.split(',')
      .map((id) => Number(id))
      .filter(Boolean);

    const channelStatus = queryStringAsObj.channelStatus?.split(',');

    form.setFieldsValue({ categoriesIds, channelStatus });
  }, [form, queryStringAsObj.categoriesIds, flowCategories, queryStringAsObj.channelStatus]);

  const renderModalFooter: ModalFooterRender = (_originNode, { OkBtn, CancelBtn }) => {
    return (
      <Flex justify='space-between'>
        <Button onClick={() => form.resetFields()}>{t(filtersModalLocaleKeys.clearButton)}</Button>
        <Space>
          <OkBtn />
          <CancelBtn />
        </Space>
      </Flex>
    );
  };

  return (
    <Modal
      forceRender
      open={isVisible}
      maskClosable={false}
      keyboard={false}
      okButtonProps={{
        htmlType: 'submit',
        form: 'whats-app-flow-filter-form',
      }}
      onCancel={onClose}
      footer={renderModalFooter}
    >
      <Form
        layout='vertical'
        id='whats-app-flow-filter-form'
        form={form}
        onFinish={handleFinishConversation}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='categoriesIds' label={t(filtersModalLocaleKeys.categoriesLabel)}>
              <Select
                allowClear
                mode='multiple'
                loading={isFetchingFlowCategories}
                options={categoryOptions}
                placeholder={t(filtersModalLocaleKeys.selectCategoriesPlaceholder)}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) =>
                  normalizeText(String(option?.label ?? '')).includes(normalizeText(search))
                }
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name='channelStatus' label={t(filtersModalLocaleKeys.channelStatusLabel)}>
              <Select
                allowClear
                options={channelStatusOptions}
                placeholder={t(filtersModalLocaleKeys.selectChannelStatusPlaceholder)}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
