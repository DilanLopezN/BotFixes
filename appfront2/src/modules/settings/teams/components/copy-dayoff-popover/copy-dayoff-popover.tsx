import { Button, Checkbox, Flex, Popover, Space, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { useCloneDayoff } from '../../hooks/use-clone-dayoff';
import { useTeamList } from '../../hooks/use-team-list';
import type { CopyDayoffPopoverProps } from './interfaces';

export const CopyDayOffPopover = ({ children, selectedDayoff }: CopyDayoffPopoverProps) => {
  const { t } = useTranslation();
  const { copyDayOffPopover } = localeKeys.settings.teams.components;
  const { teamId } = useParams<{ teamId?: string }>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
  const {
    data: paginatedTeamList,
    isLoading,
    error: fetchTeamListError,
    fetchTeamList,
  } = useTeamList({});
  const { cloneDayoff, isCloning, error: cloneDayoffError } = useCloneDayoff();

  const handleCopy = async () => {
    const isSucesfull = await cloneDayoff(selectedDayoff, selectedCheckboxes);
    if (isSucesfull) {
      setSelectedCheckboxes([]);
      setIsPopoverOpen(false);
      notifySuccess({
        message: t(copyDayOffPopover.successMessage.message),
        description: t(copyDayOffPopover.successMessage.description),
      });
    }
  };

  const handleClickChange = (open: boolean) => {
    setIsPopoverOpen(open);
  };

  const handleClosePopover = () => {
    setSelectedCheckboxes([]);
    setIsPopoverOpen(false);
  };

  useEffect(() => {
    if (isPopoverOpen) {
      fetchTeamList();
    }
  }, [fetchTeamList, isPopoverOpen]);

  useEffect(() => {
    if (fetchTeamListError) {
      notifyError(fetchTeamListError);
    }
  }, [fetchTeamListError]);

  useEffect(() => {
    if (cloneDayoffError) {
      notifyError(cloneDayoffError);
    }
  }, [cloneDayoffError]);

  const renderPopoverContent = () => {
    return (
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        <Spin spinning={isLoading}>
          <Checkbox.Group
            style={{ height: 300, overflow: 'auto' }}
            value={selectedCheckboxes}
            onChange={(newSelectedCheckboxes) => {
              setSelectedCheckboxes(newSelectedCheckboxes);
            }}
          >
            <Space direction='vertical'>
              {paginatedTeamList?.data
                .filter((team) => !teamId || team._id !== teamId)
                .map((team) => {
                  return (
                    <Checkbox key={team._id} value={team._id}>
                      {team.name}
                    </Checkbox>
                  );
                })}
            </Space>
          </Checkbox.Group>
        </Spin>
        <Flex justify='flex-end'>
          <Space direction='horizontal' align='center'>
            <Button onClick={handleClosePopover} disabled={isCloning}>
              {t(copyDayOffPopover.close)}
            </Button>
            <Button onClick={handleCopy} type='primary' disabled={isLoading} loading={isCloning}>
              {t(copyDayOffPopover.copy)}
            </Button>
          </Space>
        </Flex>
      </Space>
    );
  };

  return (
    <Popover
      title={t(copyDayOffPopover.title)}
      trigger='click'
      content={renderPopoverContent()}
      open={isPopoverOpen || isCloning}
      placement='right'
      onOpenChange={handleClickChange}
    >
      {children}
    </Popover>
  );
};
