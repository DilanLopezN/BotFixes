import { CopyOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Popover, Space } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { Period } from '~/modules/settings/teams/interfaces';
import { DaysOfTheWeek } from '../../constants';
import type { CopyPeriodPopoverProps } from './interfaces';

export const CopyPeriodPopover = ({ isDisabled, day, form }: CopyPeriodPopoverProps) => {
  const { t } = useTranslation();
  const { copyPeriodPopover } = localeKeys.settings.teams.components;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<DaysOfTheWeek[]>([]);

  const handleCopy = () => {
    const periods = form.getFieldValue('attendancePeriods');
    const currentPeriod = periods[day];

    const newPeriods = selectedCheckboxes.reduce((previousValue, currentValue) => {
      const isSelectedPeriodDisabled = previousValue[currentValue][0].isDisabled;

      if (isSelectedPeriodDisabled) {
        return {
          ...previousValue,
          [currentValue]: currentPeriod.map((period: Period) => ({ ...period, isDisabled: true })),
        };
      }

      return { ...previousValue, [currentValue]: currentPeriod };
    }, periods);

    form.setFieldValue('attendancePeriods', newPeriods);
    setSelectedCheckboxes([]);
    setIsPopoverOpen(false);
  };

  const handleClickChange = (open: boolean) => {
    setIsPopoverOpen(open);
  };

  const handleClosePopover = () => {
    setIsPopoverOpen(false);
  };

  const getPopoverContent = () => {
    return (
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        <Checkbox.Group
          value={selectedCheckboxes}
          onChange={(newSelectedCheckboxes) => {
            setSelectedCheckboxes(newSelectedCheckboxes as DaysOfTheWeek[]);
          }}
        >
          <Space direction='vertical'>
            <Checkbox disabled={day === DaysOfTheWeek.sun} value={DaysOfTheWeek.sun}>
              {t(copyPeriodPopover.days.sun)}
            </Checkbox>
            <Checkbox disabled={day === DaysOfTheWeek.mon} value={DaysOfTheWeek.mon}>
              {t(copyPeriodPopover.days.mon)}
            </Checkbox>
            <Checkbox disabled={day === DaysOfTheWeek.tue} value={DaysOfTheWeek.tue}>
              {t(copyPeriodPopover.days.tue)}
            </Checkbox>
            <Checkbox disabled={day === DaysOfTheWeek.wed} value={DaysOfTheWeek.wed}>
              {t(copyPeriodPopover.days.wed)}
            </Checkbox>
            <Checkbox disabled={day === DaysOfTheWeek.thu} value={DaysOfTheWeek.thu}>
              {t(copyPeriodPopover.days.thu)}
            </Checkbox>
            <Checkbox disabled={day === DaysOfTheWeek.fri} value={DaysOfTheWeek.fri}>
              {t(copyPeriodPopover.days.fri)}
            </Checkbox>
            <Checkbox disabled={day === DaysOfTheWeek.sat} value={DaysOfTheWeek.sat}>
              {t(copyPeriodPopover.days.sat)}
            </Checkbox>
          </Space>
        </Checkbox.Group>
        <Flex justify='flex-end'>
          <Space direction='horizontal' align='center'>
            <Button onClick={handleClosePopover}>{t(copyPeriodPopover.close)}</Button>
            <Button onClick={handleCopy} type='primary'>
              {t(copyPeriodPopover.copy)}
            </Button>
          </Space>
        </Flex>
      </Space>
    );
  };

  return (
    <Popover
      title={t(copyPeriodPopover.title)}
      trigger='click'
      content={getPopoverContent()}
      open={isPopoverOpen}
      placement='right'
      onOpenChange={handleClickChange}
    >
      <Button disabled={isDisabled} icon={<CopyOutlined style={{ color: '#1677ff' }} />}>
        {t(copyPeriodPopover.copyTime)}
      </Button>
    </Popover>
  );
};
