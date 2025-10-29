import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Alert, Space, Tabs, type TabsProps } from 'antd';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { PageTemplate } from '~/components/page-template';
import { routes } from '~/routes';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { EnableCategorizationSwitch } from '../../components/enable-categorization-switch';
import { ObjectiveTab } from '../../components/objective-tab';
import { OutcomeTab } from '../../components/outcome-tab';

export const CategorizationList = () => {
  const { workspaceId, categorizationType } = useParams<{
    workspaceId: string;
    categorizationType: string;
  }>();
  const navigate = useNavigate();
  const { children: categorizationModules } =
    routes.modules.children.settings.children.categorization;
  const { userFeatureFlag } = useSelectedWorkspace();
  const [featureFlag, setFeatureFlag] = useState(userFeatureFlag?.enableConversationCategorization);

  const { t } = useTranslation();

  const categorizationListLocaleKeys = localeKeys.settings.categorization.pages.categorizationList;

  const items: TabsProps['items'] = [
    {
      key: 'objectives',
      label: t(categorizationListLocaleKeys.labelObjectives),
      children: <ObjectiveTab />,
    },
    {
      key: 'outcomes',
      label: t(categorizationListLocaleKeys.labelOutcomes),
      children: <OutcomeTab />,
    },
  ];

  const handleChangeTab = (tabKey: string) => {
    const path = generatePath(categorizationModules.categorizationList.fullPath, {
      workspaceId,
      categorizationType: tabKey,
    });
    navigate(path, { replace: true });
  };

  const handleActive = (isActive: boolean) => {
    setFeatureFlag(isActive);
  };

  const pageTitle = (
    <Space align='center' size='large'>
      <span>{t(categorizationListLocaleKeys.pageTitle)}</span>
      <EnableCategorizationSwitch onActive={handleActive} />
      {!featureFlag && <Alert message={t(categorizationListLocaleKeys.alertMessage)} />}
    </Space>
  );

  useEffect(() => {
    setFeatureFlag(userFeatureFlag?.enableConversationCategorization);
  }, [userFeatureFlag]);

  return (
    <PageTemplate title={pageTitle}>
      <Tabs
        defaultActiveKey={categorizationType}
        items={items}
        onChange={handleChangeTab}
        animated
        destroyInactiveTabPane
      />
    </PageTemplate>
  );
};
