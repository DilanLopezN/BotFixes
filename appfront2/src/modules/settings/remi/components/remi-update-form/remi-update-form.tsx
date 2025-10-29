import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Form, Row, Space, Spin, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { Prompt } from '~/components/prompt';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { remiConfigFormId } from '../../constants';
import { useRemiSettingById } from '../../hooks/use-remi-setting-by-id';
import { useTeamList } from '../../hooks/use-team-list';
import { useUpdateRemiSetting } from '../../hooks/use-update-remi-setting';
import { RemiFormDataForm } from '../../pages/remi-list/interfaces';
import { convertConfigDataToFormData } from '../../utils/convert-config-data-to-form-data';
import { convertFormDataToCreateData } from '../../utils/convert-form-data-to-create-data';
import { ApplicationScopeSection } from '../application-scope-section';
import { RemiCategorizationSection } from '../remi-categorization-section';
import { RemiIntervalMessageSection } from '../remi-interval-message-section';
import { RemiNameSection } from '../remi-name-section/remi-name-section';

export const RemiUpdateForm = () => {
  const { t } = useTranslation();
  const { remiForm: remiKeys } = localeKeys.settings.remi.components;
  const { remiId, workspaceId } = useParams<{ remiId: string; workspaceId: string }>();

  const [form] = Form.useForm<RemiFormDataForm>();

  const { userFeatureFlag } = useSelectedWorkspace();
  const [featureFlag, setFeatureFlag] = useState(userFeatureFlag?.enableConversationCategorization);
  const [shouldBlockNavigate, setShouldBlockNavigate] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    data: remiConfigData,
    isLoading: isLoadingRemiConfig,
    error: fetchRemiError,
  } = useRemiSettingById();
  const { updateRemiSetting, isUpdating, updateError } = useUpdateRemiSetting();
  const { teamList, isFetchingTeamList: isLoadingChannelConfigList } = useTeamList();

  const isLoading = isLoadingRemiConfig || isUpdating || isLoadingChannelConfigList;

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
    if (isUpdating || !remiId) return;

    const updateData = convertFormDataToCreateData(values);
    const result = await updateRemiSetting(updateData, remiId);

    if (result) {
      setShouldBlockNavigate(false);

      notifySuccess({
        message: t(remiKeys.updateSuccessTitle),
        description: t(remiKeys.updateSuccessMessage),
      });
    }
  };

  useEffect(() => {
    if (remiId && !remiConfigData && !isLoadingRemiConfig && !fetchRemiError) {
      return;
    }

    if (remiConfigData) {
      const formData = convertConfigDataToFormData(remiConfigData);
      form.setFieldsValue(formData);
      setShouldBlockNavigate(false);
    }
  }, [remiConfigData, form, remiId, isLoadingRemiConfig, fetchRemiError]);

  useEffect(() => {
    if (fetchRemiError) {
      notifyError({ message: t(remiKeys.fetchError) });
    }
  }, [fetchRemiError, t, remiKeys.fetchError]);

  useEffect(() => {
    if (updateError) {
      notifyError({ message: t(remiKeys.updateError) });
    }
  }, [updateError, t, remiKeys.updateError]);

  useEffect(() => {
    setFeatureFlag(userFeatureFlag?.enableConversationCategorization);
  }, [userFeatureFlag]);

  if (!remiConfigData && isLoadingRemiConfig) {
    return <Spin tip={t(remiKeys.loadingConfig)} />;
  }
  if (!remiConfigData && fetchRemiError) {
    return <Alert message={t(remiKeys.loadError)} type='error' />;
  }
  const { children: remiModules } = routes.modules.children.settings.children.remi;

  const handleBackToList = () => {
    const state = location.state as { queryStrings?: string } | undefined;
    const teamListPath = generatePath(remiModules.home.fullPath, { workspaceId });
    const queryString = state?.queryStrings;
    navigate(teamListPath + queryString, { replace: true });
  };

  const renderActionButtons = () => {
    return (
      <Space>
        <Button disabled={false} onClick={handleBackToList}>
          {t(remiKeys.buttonBack)}
        </Button>
        <Button type='primary' form={remiConfigFormId} htmlType='submit' loading={false}>
          {t(remiKeys.saveButton)}
        </Button>
      </Space>
    );
  };

  const pageTitle = (
    <Space align='center'>
      <span>{t(remiKeys.pageTitleUpdate)}</span>
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
          disabled={false || isUpdating || isLoadingRemiConfig}
        >
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <RemiNameSection
                isLoading={false || isLoadingRemiConfig}
                isSaving={isUpdating}
              />{' '}
            </Col>
            <Col span={12}>
              <ApplicationScopeSection
                form={form}
                isLoading={false || isLoadingRemiConfig}
                isLoadingChannelConfigList={false || isLoadingRemiConfig}
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
                isSaving={isUpdating}
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
                isSaving={isUpdating}
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
                isSaving={isUpdating}
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
