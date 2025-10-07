import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row, Space, Spin, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { Prompt } from '~/components/prompt';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { notifySuccess } from '~/utils/notify-success';
import { remiConfigFormId } from '../../constants';
import { useCreateRemiSetting } from '../../hooks/use-create-remi-settings';
import { useTeamList } from '../../hooks/use-team-list';
import { RemiFormDataForm } from '../../pages/remi-list/interfaces';
import { convertFormDataToCreateData } from '../../utils/convert-form-data-to-create-data';
import { ApplicationScopeSection } from '../application-scope-section';
import { RemiCategorizationSection } from '../remi-categorization-section';
import { RemiIntervalMessageSection } from '../remi-interval-message-section';
import { RemiNameSection } from '../remi-name-section/remi-name-section';

export const RemiCreateForm = () => {
  const { t } = useTranslation();
  const { remiForm: remiKeys } = localeKeys.settings.remi.components;
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [form] = Form.useForm<RemiFormDataForm>();
  const { userFeatureFlag } = useSelectedWorkspace();
  const [featureFlag, setFeatureFlag] = useState(userFeatureFlag?.enableConversationCategorization);
  const [shouldBlockNavigate, setShouldBlockNavigate] = useState(false);

  const { createRemiSetting, isCreating } = useCreateRemiSetting();
  const { teamList, isFetchingTeamList: isLoadingChannelConfigList } = useTeamList();

  const isLoading = isCreating || isLoadingChannelConfigList;

  const teamOptions = useMemo(() => {
    return teamList?.data.map((team) => ({
      value: team._id,
      label: team.name,
    }));
  }, [teamList?.data]);

  const handleFormChange = () => {
    setShouldBlockNavigate(true);
  };

  const handleSubmit = async (values: RemiFormDataForm) => {
    if (isCreating) return;
    const createData = convertFormDataToCreateData(values);
    const currentShouldBlockNavigate = shouldBlockNavigate;

    setShouldBlockNavigate(false);
    const result = await createRemiSetting(createData);

    if (result) {
      notifySuccess({
        message: t(remiKeys.createSuccessTitle),
        description: t(remiKeys.createSuccessMessage),
      });

      const remiListPath = generatePath(
        routes.modules.children.settings.children.remi.children.home.fullPath,
        { workspaceId }
      );
      navigate(remiListPath);
      return;
    }
    setShouldBlockNavigate(currentShouldBlockNavigate);
  };

  useEffect(() => {
    setFeatureFlag(userFeatureFlag?.enableConversationCategorization);
  }, [userFeatureFlag]);

  const initialValues: RemiFormDataForm = {
    name: '',
    interval1: '00:00',
    interval2: '00:00',
    interval3: '00:00',
    message1Content: '',
    message2Content: '',
    message3Content: '',
    applyToAll: true,
    selectTeams: false,
    automaticReactivate: false,
    selectedTeamIds: [],
    objectiveId: undefined,
    outcomeId: undefined,
  };
  const { children: remiModules } = routes.modules.children.settings.children.remi;

  const renderActionButtons = () => {
    const teamListPath = generatePath(remiModules.home.fullPath, { workspaceId });

    return (
      <Space>
        <Link to={teamListPath} replace>
          <Button disabled={false}>{t(remiKeys.buttonBack)}</Button>
        </Link>
        <Button type='primary' form={remiConfigFormId} htmlType='submit' loading={false}>
          {t(remiKeys.saveButton)}
        </Button>
      </Space>
    );
  };

  const pageTitle = (
    <Space align='center'>
      <span>{t(remiKeys.pageTitle)}</span>
      <Tooltip title={t(localeKeys.settings.remi.pages.remiList.infoTooltip)}>
        <Link to='https://botdesigner.tawk.help/' target='_blank'>
          <InfoCircleOutlined style={{ color: '#1677ff' }} />
        </Link>
      </Tooltip>
    </Space>
  );

  return (
    <PageTemplate title={pageTitle} actionButtons={renderActionButtons()}>
      <Spin spinning={isLoading}>
        <Form<RemiFormDataForm>
          id={remiConfigFormId}
          layout='vertical'
          form={form}
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
          initialValues={initialValues}
          disabled={isCreating}
        >
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <RemiNameSection isLoading={false} isSaving={isCreating} />{' '}
            </Col>
            <Col span={12}>
              <ApplicationScopeSection
                form={form}
                isLoading={false}
                isLoadingChannelConfigList={false}
                teamOptions={teamOptions}
              />
            </Col>

            <Col span={24}>
              <RemiIntervalMessageSection
                sectionNumber={1}
                titleKey={remiKeys.section1Title}
                descriptionKey={remiKeys.section1Description}
                messageLabelKey={remiKeys.messageContentLabel}
                intervalName='interval1'
                messageContentName='message1Content'
                isLoading={isLoading}
                isSaving={isCreating}
              />
            </Col>
            <Col span={24}>
              <RemiIntervalMessageSection
                sectionNumber={2}
                titleKey={remiKeys.section3Title}
                descriptionKey={remiKeys.section3Description}
                messageLabelKey={remiKeys.secondMessageContentLabel}
                intervalName='interval2'
                messageContentName='message2Content'
                isLoading={isLoading}
                isSaving={isCreating}
              />
            </Col>
            <Col span={24}>
              <RemiIntervalMessageSection
                sectionNumber={3}
                titleKey={remiKeys.section5Title}
                descriptionKey={remiKeys.section5Description}
                messageLabelKey={remiKeys.finalMessageContentLabel}
                intervalName='interval3'
                messageContentName='message3Content'
                isLoading={isLoading}
                isSaving={isCreating}
              />
            </Col>
            {featureFlag && (
              <Col span={24}>
                <RemiCategorizationSection />
              </Col>
            )}
          </Row>
        </Form>
        <Prompt when={shouldBlockNavigate} />
      </Spin>
    </PageTemplate>
  );
};
