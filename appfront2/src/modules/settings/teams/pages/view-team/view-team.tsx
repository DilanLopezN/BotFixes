import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Form, Row, Space, Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, generatePath, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { Prompt } from '~/components/prompt';
import { localeKeys } from '~/i18n';
import type { DayOff } from '~/interfaces/day-off';
import type { AttendancePeriods, Team, TeamUser } from '~/interfaces/team';
import { routes } from '~/routes';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { scrollToInputWithError } from '~/utils/scroll-to-input-with-error';
import { InactivateTeamModal } from '../../components/inactivate-team-modal';
import { ReactivateTeamModal } from '../../components/reactivate-team-modal';
import { ServicePeriods } from '../../components/service-periods';
import { TeamInfo } from '../../components/team-info';
import { UserTable } from '../../components/user-table';
import { useTeamById } from '../../hooks/use-team-by-id';
import { useUpdateTeam } from '../../hooks/use-update-team';
import type { TeamFormValues } from '../../interfaces';
import { teamFormId } from './constants';

export const ViewTeam = () => {
  const { t } = useTranslation();
  const { teamViewPage } = localeKeys.settings.teams.pages;
  const [form] = Form.useForm<TeamFormValues>();
  const { workspaceId = '', teamId = '' } = useParams<{ workspaceId: string; teamId: string }>();
  const [teamUserList, setTeamUserList] = useState<TeamUser[]>([]);
  const [dayOffList, setDayOffList] = useState<DayOff[]>([]);
  const [shouldBlockNavigate, setShouldBlockNavigate] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const { isFetchingTeam, fetchTeamError, fetchTeamById, data: selectedTeam } = useTeamById();
  const { isUpdating, updateError, updateTeam } = useUpdateTeam();
  const { children: teamsModules } = routes.modules.children.settings.children.teams;

  const isTeamInactive = Boolean(selectedTeam?.inactivatedAt);

  const handleFormChange = () => {
    setShouldBlockNavigate(true);
  };

  const handleChangeTeamUserList: Dispatch<SetStateAction<TeamUser[]>> = (newTeamUserList) => {
    setShouldBlockNavigate(true);
    setTeamUserList(newTeamUserList);
  };

  const handleChangeDayOffList: Dispatch<SetStateAction<DayOff[]>> = (newDayOffList) => {
    setShouldBlockNavigate(true);
    setDayOffList(newDayOffList);
  };

  const handleCloseInactivateModal = () => {
    setIsInactivateModalOpen(false);
  };

  const handleCloseReactivateModal = () => {
    setIsReactivateModalOpen(false);
  };

  const handleSubmit = async (values: TeamFormValues) => {
    if (isUpdating) return;

    const normalizedAttendancePeriods = Object.entries(
      values.attendancePeriods
    ).reduce<AttendancePeriods>((previousValue, currentValue) => {
      const [key, value] = currentValue;

      const normalizedPeriod = value
        .map((period) => {
          if (period.isDisabled) {
            return undefined;
          }

          const startPeriodInMs =
            period.start.hour() * 60 * 60 * 1000 + period.start.minute() * 60 * 1000;
          const endPeriodInMs =
            period.end.hour() * 60 * 60 * 1000 + period.end.minute() * 60 * 1000;

          return { start: startPeriodInMs, end: endPeriodInMs };
        })
        .filter(Boolean);

      return { ...previousValue, [key]: normalizedPeriod };
    }, {} as any);

    const newTeam: Team = {
      ...values,
      teamId,
      workspaceId: String(workspaceId),
      offDays: dayOffList,
      roleUsers: teamUserList,
      attendancePeriods: normalizedAttendancePeriods,
    };

    const response = await updateTeam(newTeam);

    if (response) {
      setShouldBlockNavigate(false);
      notifySuccess({
        message: t(teamViewPage.successTitle),
        description: t(teamViewPage.successMessage),
      });
    }
  };

  const getTeamById = useCallback(async () => {
    const team = await fetchTeamById();
    if (team) {
      const normalizedAttendancePeriods = Object.entries(team.attendancePeriods).reduce<
        TeamFormValues['attendancePeriods']
      >((previousValue, currentValue) => {
        const [key, value] = currentValue;
        const normalizedPeriod = value.map((period: any) => {
          const normalizedStartDate = dayjs().startOf('day').add(period.start, 'millisecond');
          const normalizedEndDate = dayjs().startOf('day').add(period.end, 'millisecond');

          return { start: normalizedStartDate, end: normalizedEndDate };
        });

        return { ...previousValue, [key]: normalizedPeriod };
      }, {} as any);

      form.setFieldsValue({
        ...team,
        reassignConversationInterval: team.reassignConversationInterval || 0,
        attendancePeriods: normalizedAttendancePeriods,
      });
      setTeamUserList(team.roleUsers);
      setDayOffList(team.offDays || []);
    }
  }, [fetchTeamById, form]);

  useEffect(() => {
    getTeamById();
  }, [getTeamById]);

  useEffect(() => {
    if (updateError) {
      notifyError(updateError);
    }
  }, [updateError]);

  useEffect(() => {
    if (fetchTeamError) {
      notifyError(fetchTeamError);
    }
  }, [fetchTeamError]);

  const renderActionButtons = () => {
    const teamListPath = generatePath(teamsModules.teamList.fullPath, { workspaceId });

    return (
      <Space>
        <Link to={teamListPath} replace>
          <Button disabled={isUpdating || isFetchingTeam}>{t(teamViewPage.backToTeamList)}</Button>
        </Link>
        {!isTeamInactive && !isFetchingTeam && (
          <Button
            disabled={isUpdating}
            danger
            onClick={() => {
              setIsInactivateModalOpen(true);
            }}
          >
            {t(teamViewPage.inactivateButton)}
          </Button>
        )}
        {isTeamInactive && !isFetchingTeam && (
          <Button
            disabled={isUpdating}
            onClick={() => {
              setIsReactivateModalOpen(true);
            }}
          >
            {t(teamViewPage.reactivateButton)}
          </Button>
        )}
        {!isTeamInactive && (
          <Button
            type='primary'
            form={teamFormId}
            htmlType='submit'
            loading={isUpdating}
            disabled={isFetchingTeam}
          >
            {t(teamViewPage.save)}
          </Button>
        )}
      </Space>
    );
  };

  return (
    <PageTemplate title={selectedTeam?.name} actionButtons={renderActionButtons()}>
      <Spin spinning={isFetchingTeam}>
        <Form<TeamFormValues>
          id={teamFormId}
          layout='vertical'
          onFinish={handleSubmit}
          onFinishFailed={scrollToInputWithError}
          form={form}
          style={{ paddingBottom: 40 }}
          onValuesChange={handleFormChange}
        >
          <Row gutter={[16, 32]}>
            {isTeamInactive && (
              <Col span={24}>
                <Alert
                  message={
                    <Space>
                      <span>{t(teamViewPage.inactiveTeamAlert)}</span>
                      <Tooltip title={t(teamViewPage.inactivatedTooltip)}>
                        <Link
                          to='https://botdesigner.tawk.help/article/como-inativar-time'
                          target='_blank'
                        >
                          <InfoCircleOutlined style={{ color: '#1677ff' }} />
                        </Link>
                      </Tooltip>
                    </Space>
                  }
                  type='warning'
                />
              </Col>
            )}
            <Col span={24}>
              <TeamInfo isTeamInactive={isTeamInactive} />
            </Col>
            <Col span={24}>
              <UserTable
                teamUserList={teamUserList}
                isTeamInactive={isTeamInactive}
                setTeamUserList={handleChangeTeamUserList}
              />
            </Col>
            <Col span={24}>
              <ServicePeriods
                form={form}
                dayOffList={dayOffList}
                isTeamInactive={isTeamInactive}
                setDayOffList={handleChangeDayOffList}
              />
            </Col>
          </Row>
        </Form>
        <Prompt when={shouldBlockNavigate} />
      </Spin>
      <InactivateTeamModal
        team={selectedTeam}
        isVisible={isInactivateModalOpen}
        getTeamById={getTeamById}
        onClose={handleCloseInactivateModal}
      />
      <ReactivateTeamModal
        team={selectedTeam}
        isVisible={isReactivateModalOpen}
        getTeamById={getTeamById}
        onClose={handleCloseReactivateModal}
      />
    </PageTemplate>
  );
};
