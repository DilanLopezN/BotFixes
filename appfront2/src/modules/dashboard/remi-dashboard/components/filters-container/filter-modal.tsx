import { Button, Col, Form, Modal, Row, Select } from 'antd';
import { useEffect, useMemo } from 'react';
import { useQueryString } from '~/hooks/use-query-string';
import { normalizeText } from '~/utils/normalize-text';
import { useRemiList } from '../../hooks/use-remi-list';
import type { RemiDashboardQueryString } from '../../interfaces';
import type { FilterFormValues, FilterModalProps } from './interfaces';

export const FilterModal = ({ isVisible, onClose }: FilterModalProps) => {
  const [form] = Form.useForm<FilterFormValues>();
  const { remiList, isLoadingRemiList, fetchRemiList } = useRemiList();
  const { queryStringAsObj, updateQueryString } = useQueryString<RemiDashboardQueryString>();

  const remiOptions = useMemo(() => {
    if (!remiList) {
      return [];
    }

    return remiList.map((remi) => {
      return { value: remi.id, label: remi.name };
    });
  }, [remiList]);

  const handleOk = () => {
    const values = form.getFieldsValue();
    updateQueryString({
      remiIdList: values.remiIdList,
    });
    onClose();
  };

  const handleClearFilters = () => {
    form.resetFields();
  };

  useEffect(() => {
    if (!isVisible) return;

    form.setFieldsValue({
      remiIdList: queryStringAsObj.remiIdList ? queryStringAsObj.remiIdList.split(',') : undefined,
    });
  }, [form, isVisible, queryStringAsObj.remiIdList]);

  useEffect(() => {
    if (!isVisible) return;

    fetchRemiList();
  }, [fetchRemiList, isVisible]);

  return (
    <Modal
      title='Filtros'
      maskClosable={false}
      keyboard={false}
      closable={false}
      open={isVisible}
      footer={[
        <Button key='clear' onClick={handleClearFilters} style={{ float: 'left' }}>
          Limpar filtros
        </Button>,
        <Button key='cancel' onClick={onClose}>
          Cancelar
        </Button>,
        <Button key='submit' type='primary' onClick={handleOk}>
          Aplicar
        </Button>,
      ]}
    >
      <Form form={form} layout='vertical'>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name='remiIdList' label='REMIs'>
              <Select
                mode='multiple'
                placeholder='Selecione os remis'
                allowClear
                loading={isLoadingRemiList}
                options={remiOptions}
                showSearch
                autoClearSearchValue={false}
                filterOption={(search, option) => {
                  return Boolean(normalizeText(option?.label).includes(normalizeText(search)));
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
