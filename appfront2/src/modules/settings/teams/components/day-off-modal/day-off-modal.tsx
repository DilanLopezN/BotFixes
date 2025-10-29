import { Checkbox, Col, DatePicker, Form, Input, Modal } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { DayOffFormValues, DayOffModalProps } from './interfaces';

export const DayOffModal = ({
  isVisible,
  selectedDayOff,
  selectedDayOffIndex,
  setDayOffList,
  onClose,
}: DayOffModalProps) => {
  const { t } = useTranslation();
  const { dayOffModal } = localeKeys.settings.teams.components;
  const [form] = Form.useForm<DayOffFormValues>();

  const handleFinish = (values: DayOffFormValues) => {
    setDayOffList((previousState) => {
      const now = dayjs();
      const currentDayOffList = previousState.slice();
      const startDateTimestamp = values.period[0].isBefore(now)
        ? now.valueOf()
        : values.period[0].valueOf();
      const endDateTimestamp = values.period[1].valueOf();

      const newDayOff = {
        name: values.name,
        message: values.message,
        cannotAssignEndConversation: Boolean(values.cannotAssignEndConversation),
        start: startDateTimestamp,
        end: endDateTimestamp,
      };

      if (selectedDayOffIndex !== undefined) {
        currentDayOffList[selectedDayOffIndex] = newDayOff;
        return currentDayOffList;
      }

      return [...previousState, newDayOff];
    });
    onClose();
  };

  const handleModalAfterClose = () => {
    form.setFieldsValue({
      name: undefined,
      message: undefined,
      period: undefined,
      cannotAssignEndConversation: undefined,
    });
  };

  useEffect(() => {
    if (selectedDayOff) {
      const normalizedStartDate = dayjs(selectedDayOff.start);
      const normalizedEndDate = dayjs(selectedDayOff.end);

      form.setFieldsValue({
        name: selectedDayOff.name,
        message: selectedDayOff.message,
        period: [normalizedStartDate, normalizedEndDate],
        cannotAssignEndConversation: selectedDayOff.cannotAssignEndConversation,
      });
    }
  }, [form, selectedDayOff]);

  return (
    <Modal
      open={isVisible}
      onCancel={onClose}
      title={t(dayOffModal.title)}
      width={500}
      keyboard={false}
      maskClosable={false}
      closable={false}
      okText={t(dayOffModal.save)}
      okButtonProps={{ htmlType: 'submit', form: 'day-off-modal-form' }}
      cancelText={t(dayOffModal.close)}
      afterClose={handleModalAfterClose}
    >
      <Form id='day-off-modal-form' form={form} layout='vertical' onFinish={handleFinish}>
        <Col span={24}>
          <Form.Item
            name='name'
            label={t(dayOffModal.fields.name.label)}
            rules={[{ required: true, message: t(dayOffModal.requiredFieldMessage) }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name='period'
            label={t(dayOffModal.fields.period.label)}
            rules={[
              { required: true, message: t(dayOffModal.requiredFieldMessage) },
              {
                validator: async (_, value) => {
                  if (value && value[0] && (value[0] as Dayjs).isBefore(dayjs(), 'day')) {
                    throw new Error(t(dayOffModal.fields.period.pastDateError));
                  }
                },
              },
            ]}
          >
            <DatePicker.RangePicker
              allowClear={false}
              format='DD/MM/YYYY HH:mm'
              placeholder={[
                t(dayOffModal.fields.period.placeholderStart),
                t(dayOffModal.fields.period.placeholderEnd),
              ]}
              disabledTime={(current) => {
                if (!current) return {};
                const now = dayjs();
                if (current.isSame(now, 'day')) {
                  const disabledHours = Array.from({ length: now.hour() }, (_, index) => index);
                  const disabledMinutes = (selectedHour: number) => {
                    if (selectedHour === now.hour()) {
                      return Array.from({ length: now.minute() }, (_, index) => index);
                    }
                    return [];
                  };
                  return {
                    disabledHours: () => disabledHours,
                    disabledMinutes,
                  };
                }
                return {};
              }}
              showTime={{ defaultValue: [dayjs('00:00', 'HH:mm'), dayjs('23:59', 'HH:mm')] }}
              disabledDate={(current) => current.isBefore(dayjs(), 'day')}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              onOk={(dates) => {
                if (!dates || !dates[0] || !dates[1]) return;

                const [start, end] = dates;
                const now = dayjs();

                let adjustedStart = start;
                let adjustedEnd = end;

                if (start.isBefore(now)) {
                  adjustedStart = now;
                }

                if (!end.isAfter(adjustedStart)) {
                  adjustedEnd = adjustedStart.add(1, 'minute');
                }

                form.setFieldsValue({
                  period: [adjustedStart, adjustedEnd],
                });
              }}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name='message'
            label={t(dayOffModal.fields.message.label)}
            rules={[{ required: true, message: t(dayOffModal.requiredFieldMessage) }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name='cannotAssignEndConversation' valuePropName='checked' noStyle>
            <Checkbox>{t(dayOffModal.fields.cannotAssignEndConversation)}</Checkbox>
          </Form.Item>
        </Col>
      </Form>
    </Modal>
  );
};
