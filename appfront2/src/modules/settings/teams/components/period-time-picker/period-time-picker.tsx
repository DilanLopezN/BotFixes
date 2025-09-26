import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Space, TimePicker } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import _ from 'lodash';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { DaysOfTheWeek } from '~/modules/settings/teams/constants';
import type { Period } from '~/modules/settings/teams/interfaces';
import { CopyPeriodPopover } from '../copy-period-popover';
import type { PeriodTimePickedProps } from './interface';

export const PeriodTimePicker = ({ label, name, form, isTeamInactive }: PeriodTimePickedProps) => {
  const { t } = useTranslation();
  const { periodTimePicker } = localeKeys.settings.teams.components;
  const periods = Form.useWatch(name, form);
  const isDisabled = periods?.some((period: Period) => period.isDisabled);

  const handleCheck = (event: CheckboxChangeEvent) => {
    const { checked } = event.target;
    const newPeriods = periods.map((period: Period) => ({
      ...period,
      isDisabled: checked,
    }));
    form.setFieldValue(name, newPeriods);

    if (checked) {
      form.setFields([
        {
          name: [...name, 0, 'start'],
          errors: [],
        },
        {
          name: [...name, 0, 'end'],
          errors: [],
        },
        {
          name: [...name, 1, 'start'],
          errors: [],
        },
        {
          name: [...name, 1, 'end'],
          errors: [],
        },
      ]);
    }
  };

  useEffect(() => {
    const periodValue = form.getFieldValue(name);
    if (_.isEmpty(periodValue)) {
      form.setFieldValue(name, [
        {
          start: undefined,
          end: undefined,
          isDisabled: true,
        },
      ]);
    }
  }, [form, name]);
  return (
    <Form.List name={name}>
      {(fields, actions) => {
        return (
          <Form.Item label={label} noStyle={!fields.length}>
            <Space>
              <Space split='-' direction='horizontal' size='middle' align='center'>
                {fields.map((field) => {
                  return (
                    <Space key={field.key}>
                      <Form.Item
                        name={[field.name, 'start']}
                        noStyle
                        dependencies={[[...name, field.name, 'isDisabled']]}
                        rules={[
                          ({ getFieldValue }) => ({
                            async validator(__, value) {
                              const isDisabledFormValue = getFieldValue([
                                ...name,
                                field.name,
                                'isDisabled',
                              ]);

                              if (!value && !isDisabledFormValue) {
                                throw new Error('');
                              }
                            },
                          }),
                        ]}
                      >
                        <TimePicker
                          disabled={isDisabled || isTeamInactive}
                          placeholder='00:00'
                          showNow={false}
                          showSecond={false}
                          format='HH:mm'
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'end']}
                        noStyle
                        dependencies={[[...name, field.name, 'isDisabled']]}
                        rules={[
                          ({ getFieldValue }) => ({
                            async validator(__, value) {
                              const isDisabledFormValue = getFieldValue([
                                ...name,
                                field.name,
                                'isDisabled',
                              ]);
                              if (!value && !isDisabledFormValue) {
                                throw new Error('');
                              }
                            },
                          }),
                        ]}
                      >
                        <TimePicker
                          disabled={isDisabled || isTeamInactive}
                          placeholder='00:00'
                          showNow={false}
                          showSecond={false}
                          format='HH:mm'
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'isDisabled']}
                        style={{ display: 'none' }}
                        valuePropName='checked'
                      >
                        <Checkbox disabled={isTeamInactive} />
                      </Form.Item>
                    </Space>
                  );
                })}
              </Space>
              {fields.length === 1 && (
                <Button
                  disabled={isDisabled || isTeamInactive}
                  icon={<PlusOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => {
                    actions.add({
                      start: undefined,
                      end: undefined,
                    });
                  }}
                >
                  {t(periodTimePicker.addPeriod)}
                </Button>
              )}
              {fields.length > 1 && (
                <Button
                  disabled={isDisabled || isTeamInactive}
                  icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                  onClick={() => {
                    actions.remove(1);
                  }}
                >
                  {t(periodTimePicker.removePeriod)}
                </Button>
              )}
              <CopyPeriodPopover
                isDisabled={isDisabled || isTeamInactive}
                day={name[1] as DaysOfTheWeek}
                form={form}
              />
              <Checkbox
                checked={isDisabled}
                disabled={isTeamInactive}
                onChange={(event) => {
                  handleCheck(event);
                }}
              >
                {t(periodTimePicker.closed)}
              </Checkbox>
            </Space>
          </Form.Item>
        );
      }}
    </Form.List>
  );
};
