import { useTranslation } from 'react-i18next';
import { Alert, Button, Col, Form, Modal, Row, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import { groupBy } from 'lodash';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { PageTemplate } from '~/components/page-template';
import { Prompt } from '~/components/prompt';
import { CampaignStatus } from '~/constants/campaign-status';
import type { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import { ApiError } from '~/interfaces/api-error';
import type { TemplateMessage } from '~/interfaces/template-message';
import { routes } from '~/routes';
import type { UpdateCampaignByIdProps } from '~/services/workspace/update-campaign-by-id/interfaces';
import { notifyError } from '~/utils/notify-error';
import { BroadcastInfoCard } from '../../components/broadcast-info-card';
import { ContactAddModal } from '../../components/contact-add-modal';
import { SchedulingCard } from '../../components/scheduling-card';
import { TableCard } from '../../components/table-card';
import type { TableData } from '../../components/table-card/interfaces';
import { TemplateCard } from '../../components/template-card';
import { useGetCampaignById } from '../../hooks/use-get-campaign-by-id';
import { useUpdateCampaignById } from '../../hooks/use-update-campaign-by-id';
import { focusOnFieldWithError } from '../../utils/focus-on-field-with-error';
import type { BroadcastListFormValues } from './interfaces';

export const EditBroadcastList = () => {
  const [form] = Form.useForm<BroadcastListFormValues>();
  const { workspaceId, broadcastListId } = useParams<{
    workspaceId: string;
    broadcastListId: string;
  }>();
  const navigate = useNavigate();
  const { updateCampaign, isUpdatingCampaign } = useUpdateCampaignById();
  const { campaign, isLoadingCampaign, fetchCampaignById } = useGetCampaignById();
  const [selectedActiveMessage, setSelectedActiveMessage] = useState<ActiveMessageSetting>();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMessage>();
  const [dataSource, setDataSource] = useState<TableData[]>([]);
  const [isContactModalOpened, setIsContactModalOpened] = useState(false);
  const [shouldBlockNavigate, setShouldBlockNavigate] = useState(false);

  const formImmediateStart = Form.useWatch('immediateStart', form);
  const formIsTest = Form.useWatch('isTest', form);

  const canEdit =
    campaign?.data.campaign.status === CampaignStatus.draft ||
    campaign?.data.campaign.status === CampaignStatus.awaiting_send;

  const { children: broadcastListModules } =
    routes.modules.children.campaigns.children.broadcastList;

  const viewListsPath = generatePath(broadcastListModules.viewBroadcastList.fullPath, {
    workspaceId,
  });

  const cloneBroadcastWithErrorPath = `${generatePath(
    broadcastListModules.cloneBroadcastList.fullPath,
    {
      workspaceId,
      broadcastListId,
    }
  )}?contactsWithError=true`;

  const maxContactCount = formIsTest ? 5 : selectedActiveMessage?.data?.contactListLimit || 200;

  const getAvailableContactCount = () => {
    return maxContactCount - dataSource.length;
  };

  const duplicatedPhones = useMemo(() => {
    const filteredContacts = dataSource.filter((contact) => Boolean(contact.phone));

    const groupedByPhone = groupBy(filteredContacts, 'phone');

    const duplicatePhones = Object.keys(groupedByPhone).filter(
      (id) => groupedByPhone[id].length > 1
    );

    return duplicatePhones;
  }, [dataSource]);

  const handleFormChange = () => {
    setShouldBlockNavigate(true);
  };

  const handleChangeContacts: Dispatch<SetStateAction<TableData[]>> = (newDataSource) => {
    setShouldBlockNavigate(true);
    setDataSource(newDataSource);
  };

  const onCloseContactModal = () => {
    setIsContactModalOpened(false);
  };

  const { t } = useTranslation();

  const editBroadcastListLocaleKeys = localeKeys.campaign.broadcastList.pages.editBroadcastList;

  const handleEditCampaign = async (values: UpdateCampaignByIdProps) => {
    const currentShouldBlockNavigate = shouldBlockNavigate;
    setShouldBlockNavigate(false);

    const result = await updateCampaign(values);

    if ((result as ApiError)?.code) {
      setShouldBlockNavigate(currentShouldBlockNavigate);
      return;
    }

    navigate(viewListsPath);
  };

  const handleSubmit = async (formValues: BroadcastListFormValues) => {
    if (isUpdatingCampaign) return;

    const availableCount = getAvailableContactCount();

    if (availableCount < 0) {
      notifyError(t(editBroadcastListLocaleKeys.notifyErrorSurplus), true);
      return;
    }

    if (duplicatedPhones.length > 0) {
      focusOnFieldWithError();
      notifyError(t(editBroadcastListLocaleKeys.notifyErrorDuplicatedPhones), true);
      return;
    }

    const contacts = dataSource.map((data) => {
      const { newId, sent, phone, ...rest } = data;
      return { ...rest, phone: String(phone) };
    });

    const hasContactError = contacts.some((contact) => {
      return !contact.name?.trim() || !contact.phone;
    });

    const hasEmptyContactAttributes = contacts.some((contact) => {
      return !Object.values(contact).every(Boolean);
    });

    if (hasContactError) {
      notifyError(t(editBroadcastListLocaleKeys.notifyErrorContactError), true);
      focusOnFieldWithError();
      return;
    }

    const formattedSendAt = formValues.sendAt
      ? dayjs(formValues.sendAt, 'DD/MM/YYYY HH:mm').valueOf()
      : null;

    const formattedValues = {
      id: Number(broadcastListId),
      name: formValues.name!,
      activeMessageSettingId: formValues.activeMessageSettingId!,
      templateId: formValues.templateId!,
      sendAt: !formValues.immediateStart ? formattedSendAt : null,
      immediateStart: formValues.immediateStart,
      action: formValues.action || null,
      isTest: formValues.isTest,
      contacts,
    };

    if (formImmediateStart) {
      if (hasEmptyContactAttributes) {
        notifyError(t(editBroadcastListLocaleKeys.notifyErrorEmptyContact), true);
        focusOnFieldWithError();
        return;
      }

      Modal.confirm({
        title: t(editBroadcastListLocaleKeys.titleModalConfirm),
        icon: null,
        width: 534,
        content: (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Alert
                showIcon
                message={t(editBroadcastListLocaleKeys.messageAlertConfirm)}
                type='warning'
              />
            </Col>
            <Col span={24}>
              <span>{t(editBroadcastListLocaleKeys.messageSpanError)}</span>
            </Col>
          </Row>
        ),
        okText: t(editBroadcastListLocaleKeys.okTextConfirm),
        cancelText: t(editBroadcastListLocaleKeys.cancelText),
        onOk: async () => {
          await handleEditCampaign(formattedValues);
        },
      });
      return;
    }

    if (hasEmptyContactAttributes) {
      Modal.confirm({
        title: t(editBroadcastListLocaleKeys.titleAlert),
        icon: null,
        width: 534,
        content: (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <span>{t(editBroadcastListLocaleKeys.spanHasEmptyContactAttributes)}</span>
            </Col>
          </Row>
        ),
        okText: t(editBroadcastListLocaleKeys.okTextSave),
        cancelText: t(editBroadcastListLocaleKeys.cancelTextEdit),
        onOk: async () => {
          await handleEditCampaign(formattedValues);
        },
      });
      return;
    }

    handleEditCampaign(formattedValues);
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!broadcastListId) return;

      const broadcast = await fetchCampaignById(Number(broadcastListId));

      if (broadcast) {
        const {
          name,
          activeMessageSettingId,
          templateId,
          sendAt,
          immediateStart,
          isTest,
          action,
          startedAt,
        } = broadcast.data.campaign;

        const formattedSendAt = dayjs(Number(sendAt));
        const formattedStartAt = startedAt ? dayjs(Number(startedAt)) : undefined;

        form.setFieldsValue({
          name,
          activeMessageSettingId,
          templateId,
          sendAt: sendAt ? formattedSendAt : formattedStartAt,
          immediateStart,
          action,
          isTest,
        });
        setDataSource(broadcast.data.contacts || []);
      }
    };

    fetchCampaign();
  }, [broadcastListId, fetchCampaignById, form]);

  const pageTitle = campaign?.data ? campaign?.data.campaign.name : '';
  const hasContactWithError =
    campaign?.data.campaign.resume && campaign.data.campaign.resume.invalidContacts.length > 0;

  const actionButtons = (
    <Space>
      <Link to={viewListsPath} replace>
        <Button disabled={isUpdatingCampaign}>{t(editBroadcastListLocaleKeys.buttonGoBack)}</Button>
      </Link>
      {campaign?.data.campaign.status === CampaignStatus.finished_complete &&
        hasContactWithError && (
          <Link to={cloneBroadcastWithErrorPath}>
            <Button type='primary' htmlType='button' disabled={isLoadingCampaign}>
              {t(editBroadcastListLocaleKeys.buttonContactWithError)}
            </Button>
          </Link>
        )}
      {canEdit && (
        <Button
          type='primary'
          htmlType='submit'
          form='update-broadcast-list-form'
          disabled={isLoadingCampaign}
          loading={isUpdatingCampaign}
        >
          {formImmediateStart
            ? t(editBroadcastListLocaleKeys.buttonSaveSend)
            : t(editBroadcastListLocaleKeys.buttonSave)}
        </Button>
      )}
    </Space>
  );

  return (
    <PageTemplate title={pageTitle} actionButtons={actionButtons}>
      <Spin spinning={isLoadingCampaign}>
        <Form
          id='update-broadcast-list-form'
          layout='vertical'
          form={form}
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
        >
          <Row wrap={false} gutter={[16, 16]}>
            <Col flex='420px' style={{ paddingBottom: 16 }}>
              <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                <BroadcastInfoCard canEdit={canEdit} />
                <TemplateCard
                  setSelectedTemplate={setSelectedTemplate}
                  setSelectedActiveMessage={setSelectedActiveMessage}
                  canEdit={canEdit}
                />
                <SchedulingCard canEdit={canEdit} selectedTemplate={selectedTemplate} />
              </Space>
            </Col>
            <Col flex='auto' style={{ width: '100%' }}>
              <div
                style={{
                  position: 'fixed',
                  width: 'calc(100vw - 740px)',
                  height: '100vh',
                  top: 81,
                  right: 30,
                }}
              >
                <TableCard
                  dataSource={dataSource}
                  selectedTemplate={selectedTemplate}
                  selectedActiveMessage={selectedActiveMessage}
                  canEdit={canEdit}
                  availableCount={getAvailableContactCount()}
                  setDataSource={handleChangeContacts}
                  setIsContactModalOpened={setIsContactModalOpened}
                  broadcastStatus={campaign?.data.campaign.status}
                  duplicatedPhones={duplicatedPhones}
                />
              </div>
            </Col>
          </Row>
        </Form>
        <ContactAddModal
          isVisible={isContactModalOpened}
          selectedTemplate={selectedTemplate}
          maxContactCount={maxContactCount}
          availableCount={getAvailableContactCount()}
          onClose={onCloseContactModal}
          setDataSource={handleChangeContacts}
        />
      </Spin>
      <Prompt when={shouldBlockNavigate} />
    </PageTemplate>
  );
};
