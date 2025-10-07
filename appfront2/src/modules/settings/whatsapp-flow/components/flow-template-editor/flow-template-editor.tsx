import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router-dom';
import { PageTemplate } from '~/components/page-template';
import { localeKeys } from '~/i18n';
import { Flow } from '~/interfaces/flow';
import { FlowVariable } from '~/interfaces/flow-libraries';
import { useChannelConfigList } from '~/modules/campaigns/broadcast-list/hooks/use-channel-config-list';
import { routes } from '~/routes';
import { flowCategoryLabelMap } from '../../constants';
import { useActivateFlow } from '../../hooks/use-activate-flow';
import { useCreateFlow } from '../../hooks/use-create-flow';
import { useDeactivateFlow } from '../../hooks/use-deactivate-flow';
import { useFlowLibraryById } from '../../hooks/use-flow-library-by-id';
import { useUpdateFlow } from '../../hooks/use-update-flow';
import { FlowSaveButton } from '../flow-save-button';
import { PreviewCovered } from '../preview-covered';

const { Title, Text } = Typography;

export const FlowTemplateEditor = () => {
  const [form] = Form.useForm();
  const { workspaceId = '', flowId = '' } = useParams<{
    workspaceId: string;
    flowId: string | undefined;
  }>();
  const { children: whatsAppModule } = routes.modules.children.settings.children.whatsAppFlow;
  const whatsAppPath = generatePath(whatsAppModule.home.fullPath, { workspaceId });
  const { handleDeactivateFlow, isDeactivatingFlow } = useDeactivateFlow();
  const { handleActivateFlow, isActivatingFlow } = useActivateFlow();
  const { handleCreateFlow, isCreatingFlow } = useCreateFlow();
  const { handleUpdateFlow, isUpdatingFlow } = useUpdateFlow();
  const { flowLibraryDetail, fetchFlowLibraryDetail } = useFlowLibraryById();
  const { channelConfigList, fetchChannelConfigList, isLoadingChannelConfigList } =
    useChannelConfigList();

  const { t } = useTranslation();

  const whatsAppFlowLocaleKeys = localeKeys.settings.whatsAppFlow.components;

  const [selectedChannelConfigId, setSelectedChannelConfigId] = useState<string>('');
  const [tabChanges, setTabChanges] = useState<Record<string, boolean>>({});

  const isSaveEnabled = useMemo(() => {
    const hasNoVariables = (flowLibraryDetail?.variablesOfFlowData?.length ?? 0) === 0;
    return hasNoVariables || !!tabChanges[selectedChannelConfigId];
  }, [tabChanges, selectedChannelConfigId, flowLibraryDetail]);

  const selectedFlow = useMemo(() => {
    return flowLibraryDetail?.flows.find(
      (f) => String(f.channelConfigId) === selectedChannelConfigId
    );
  }, [selectedChannelConfigId, flowLibraryDetail]);

  const isCurrentChannelEnabled = useMemo(() => {
    return selectedFlow?.active ?? false;
  }, [selectedFlow]);

  const toggleChannelStatus = async () => {
    if (!selectedFlow) return;

    const { channelConfigId, id, active } = selectedFlow;

    const response = active
      ? await handleDeactivateFlow({ channelConfigId, flowId: id })
      : await handleActivateFlow({ channelConfigId, flowId: id });

    if (response) {
      fetchFlowLibraryDetail();
    }
  };

  const onFinish = async (values: Record<string, Record<string, string>>) => {
    const currentKey = selectedChannelConfigId;
    const flowData = values[currentKey] || {};

    const payload = {
      channelConfigId: selectedFlow?.channelConfigId ?? selectedChannelConfigId,
      flowLibraryId: flowLibraryDetail?.id,
      flowData,
    };
    const payloadUpdate = {
      flowData,
    };
    let response: any;
    if (!selectedFlow) {
      response = await handleCreateFlow(payload);
    } else {
      response = await handleUpdateFlow(selectedFlow.id, payloadUpdate);
    }

    if (response) {
      setTabChanges((prev) => ({
        ...prev,
        [selectedChannelConfigId]: false,
      }));
      fetchFlowLibraryDetail();
    }
  };

  const mergedChannelFlows = useMemo(() => {
    if (!channelConfigList?.data) return [];

    return channelConfigList.data.map((channelConfig) => {
      const flow = flowLibraryDetail?.flows?.find(
        (flowItem) => flowItem.channelConfigId === channelConfig._id
      );

      return {
        channelConfig,
        flow,
      };
    });
  }, [channelConfigList, flowLibraryDetail]);

  useEffect(() => {
    if (workspaceId && flowId) {
      fetchFlowLibraryDetail();
      fetchChannelConfigList();
    }
  }, [workspaceId, flowId, fetchFlowLibraryDetail, fetchChannelConfigList]);

  useEffect(() => {
    const flow = flowLibraryDetail?.flows.find((f) => String(f.id) === selectedChannelConfigId);
    if (flow) {
      const flowDataObject = flow.flowsData[0]?.data || {};
      Object.entries(flowDataObject).forEach(([key, value]) => {
        form.setFieldValue([selectedChannelConfigId, key], value);
      });
    }
  }, [selectedChannelConfigId, flowLibraryDetail, form]);

  useEffect(() => {
    if (mergedChannelFlows.length > 0 && !selectedChannelConfigId) {
      const firstWithFlow = mergedChannelFlows.find(({ flow }) => flow);
      const defaultKey = firstWithFlow?.flow?.id
        ? String(firstWithFlow.flow.id)
        : String(mergedChannelFlows[0].channelConfig._id);
      setSelectedChannelConfigId(defaultKey);
    }
  }, [mergedChannelFlows, selectedChannelConfigId]);

  const renderChannelTabTitle = (
    configId: string,
    name: string,
    isActive: boolean,
    isFirst: boolean
  ) => {
    const flow = flowLibraryDetail?.flows.find((f) => f.channelConfigId === configId);
    const isEnabled = flow?.active ?? false;
    const icon = isEnabled ? (
      <CheckCircleOutlined
        title={t(whatsAppFlowLocaleKeys.editor.flowActive)}
        style={{ color: '#52c41a' }}
      />
    ) : (
      <ExclamationCircleOutlined
        title={t(whatsAppFlowLocaleKeys.editor.flowInactive)}
        style={{ color: '#faad14' }}
      />
    );

    return (
      <Space style={{ marginLeft: isFirst ? 24 : 0 }} size={4} align='center'>
        {icon}
        <Text ellipsis={!isActive} style={isActive ? undefined : { maxWidth: 100 }} title={name}>
          {name}
        </Text>
      </Space>
    );
  };

  const renderVariableInputs = (
    flow: Flow | undefined,
    channelConfigId: string,
    isActiveTab: boolean
  ) => {
    const variables = flowLibraryDetail?.variablesOfFlowData || [];

    if (variables.length === 0) {
      return <Text type='secondary'>{t(whatsAppFlowLocaleKeys.editor.noFlowsCreated)}</Text>;
    }

    const existingData = flow?.flowsData?.[0]?.data ?? {};

    const getComponent = (variable: FlowVariable) => {
      switch (variable?.type) {
        case 'boolean': {
          return <Switch title={variable.name} />;
        }
        case 'number': {
          return <InputNumber />;
        }
        default: {
          return <Input placeholder={variable.description} />;
        }
      }
    };
    return variables.map((variable: FlowVariable) => {
      return (
        <Form.Item
          key={variable.value}
          name={[channelConfigId, variable.value]}
          label={variable.name}
          tooltip={variable.description}
          initialValue={existingData[variable.value] ?? undefined}
          rules={
            isActiveTab
              ? [{ required: true, message: t(whatsAppFlowLocaleKeys.editor.requiredField) }]
              : []
          }
        >
          {getComponent(variable)}
        </Form.Item>
      );
    });
  };

  return (
    <PageTemplate
      title={t(whatsAppFlowLocaleKeys.editor.title)}
      actionButtons={
        <Link to={whatsAppPath} replace>
          <Button>{t(whatsAppFlowLocaleKeys.editor.backButton)}</Button>
        </Link>
      }
    >
      <Card
        extra={[
          <Space key='actions'>
            {selectedFlow && (
              <Button
                type='default'
                loading={isActivatingFlow || isDeactivatingFlow}
                onClick={toggleChannelStatus}
              >
                {isCurrentChannelEnabled
                  ? t(whatsAppFlowLocaleKeys.editor.deactivateChannel)
                  : t(whatsAppFlowLocaleKeys.editor.activateChannel)}
              </Button>
            )}
            <FlowSaveButton
              selectedFlow={selectedFlow}
              isSaveEnabled={isSaveEnabled}
              isLoading={!selectedFlow ? isCreatingFlow : isUpdatingFlow}
            />
          </Space>,
        ]}
        title={
          <Space direction='horizontal' size='small' style={{ width: '100%' }}>
            {flowLibraryDetail?.friendlyName}
            <Space size='small' style={{ width: '100%' }}>
              {flowLibraryDetail?.flowCategories && flowLibraryDetail.flowCategories.length > 0 ? (
                <Space wrap size={[0, 8]}>
                  {flowLibraryDetail?.flowCategories.map((cat) => (
                    <Tag key={cat}>{t(flowCategoryLabelMap[cat])}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type='secondary'>{t(whatsAppFlowLocaleKeys.editor.noCategory)}</Text>
              )}
            </Space>
          </Space>
        }
      >
        {isLoadingChannelConfigList ? (
          <Skeleton active />
        ) : (
          <Row gutter={24}>
            <Col span={13}>
              <Tabs
                activeKey={selectedChannelConfigId}
                onChange={(key) => setSelectedChannelConfigId(key)}
                style={{ marginBottom: 24 }}
                items={mergedChannelFlows.map(({ channelConfig, flow }, index) => {
                  const key = String(channelConfig._id);
                  return {
                    key,
                    label: renderChannelTabTitle(
                      channelConfig._id || '',
                      channelConfig.name,
                      selectedChannelConfigId === key,
                      index === 0
                    ),
                    children: (
                      <Form
                        layout='vertical'
                        form={form}
                        id='whats-flow-form'
                        onFinish={onFinish}
                        onValuesChange={(changedValues) => {
                          const isChangeInActiveTab = Object.keys(changedValues).some(
                            (item) => item === selectedChannelConfigId
                          );
                          if (isChangeInActiveTab) {
                            setTabChanges((prev) => ({
                              ...prev,
                              [selectedChannelConfigId]: true,
                            }));
                          }
                        }}
                      >
                        <div style={{ padding: '0 24px' }}>
                          <Title style={{ marginTop: '4px' }} level={5}>
                            {t(whatsAppFlowLocaleKeys.editor.flowVariablesTitle)}
                          </Title>
                          {renderVariableInputs(
                            flow,
                            channelConfig._id ?? '',
                            selectedChannelConfigId === key
                          )}
                        </div>
                      </Form>
                    ),
                  };
                })}
              />
            </Col>
            <Col span={11} style={{ padding: 0 }}>
              <PreviewCovered
                selectedFlow={selectedFlow}
                iframeUrl={flowLibraryDetail?.flowPreviewUrl}
              />
            </Col>
          </Row>
        )}
      </Card>
    </PageTemplate>
  );
};
