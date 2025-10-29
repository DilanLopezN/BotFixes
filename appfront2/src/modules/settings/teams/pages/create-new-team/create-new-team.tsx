import { Button, Col, Form, Row, Space } from 'antd';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, generatePath, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { Prompt } from '~/components/prompt';
import { localeKeys } from '~/i18n';
import type { DayOff } from '~/interfaces/day-off';
import type { AttendancePeriods, Team, TeamUser } from '~/interfaces/team';
import { routes } from '~/routes';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { scrollToInputWithError } from '~/utils/scroll-to-input-with-error';
import { ServicePeriods } from '../../components/service-periods';
import { TeamInfo } from '../../components/team-info';
import { UserTable } from '../../components/user-table';
import { useCreateNewTeam } from '../../hooks/use-create-new-team';
import type { TeamFormValues } from '../../interfaces';
import { createNewFormId, formInitialValues } from './constants';

export const CreateNewTeam = () => {
  const { t } = useTranslation();
  const { createNewTeamPage } = localeKeys.settings.teams.pages;
  const [form] = Form.useForm<TeamFormValues>();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [teamUserList, setTeamUserList] = useState<TeamUser[]>([]);
  const [dayOffList, setDayOffList] = useState<DayOff[]>([]);
  const [shouldBlockNavigate, setShouldBlockNavigate] = useState(false);
  const { createNewTeam, isCreating, error: createNewTeamError } = useCreateNewTeam();
  const { children: teamsModules } = routes.modules.children.settings.children.teams;

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

  const handleSubmit = async (values: TeamFormValues) => {
    if (isCreating) return;

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
      workspaceId: String(workspaceId),
      offDays: dayOffList,
      roleUsers: teamUserList,
      attendancePeriods: normalizedAttendancePeriods,
    };

    const currentShouldBlockNavigate = shouldBlockNavigate;

    setShouldBlockNavigate(false);
    const response = await createNewTeam(newTeam);

    if (response) {
      const teamListPath = generatePath(teamsModules.teamList.fullPath, { workspaceId });
      notifySuccess({ message: 'Sucesso', description: 'O time foi adicionado!' });
      navigate(teamListPath);
      return;
    }

    setShouldBlockNavigate(currentShouldBlockNavigate);
  };

  useEffect(() => {
    if (createNewTeamError) {
      notifyError(createNewTeamError);
    }
  }, [createNewTeamError]);

  const renderActionButtons = () => {
    const teamListPath = generatePath(teamsModules.teamList.fullPath, { workspaceId });

    return (
      <Space>
        <Link to={teamListPath} replace>
          <Button disabled={isCreating}>{t(createNewTeamPage.buttonBack)}</Button>
        </Link>
        <Button type='primary' form={createNewFormId} htmlType='submit' loading={isCreating}>
          {t(createNewTeamPage.buttonSave)}
        </Button>
      </Space>
    );
  };

  return (
    <PageTemplate title='Novo time' actionButtons={renderActionButtons()}>
      <Form<TeamFormValues>
        id={createNewFormId}
        layout='vertical'
        onFinish={handleSubmit}
        onFinishFailed={scrollToInputWithError}
        form={form}
        style={{ paddingBottom: 40 }}
        initialValues={formInitialValues}
        onValuesChange={handleFormChange}
      >
        <Row gutter={[16, 32]}>
          <Col span={24}>
            <TeamInfo />
          </Col>
          <Col span={24}>
            <UserTable teamUserList={teamUserList} setTeamUserList={handleChangeTeamUserList} />
          </Col>
          <Col span={24}>
            <ServicePeriods
              form={form}
              dayOffList={dayOffList}
              setDayOffList={handleChangeDayOffList}
            />
          </Col>
        </Row>
      </Form>
      <Prompt when={shouldBlockNavigate} />
    </PageTemplate>
  );
};
