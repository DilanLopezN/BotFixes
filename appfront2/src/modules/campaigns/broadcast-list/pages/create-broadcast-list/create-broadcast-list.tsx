import { useTranslation } from 'react-i18next';
import { Alert, Button, Col, Form, Modal, Row, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import { groupBy } from 'lodash';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { PageTemplate } from '~/components/page-template';
import { Prompt } from '~/components/prompt';
import { useQueryString } from '~/hooks/use-query-string';
import type { ActiveMessageSetting } from '~/interfaces/active-message-setting';
import type { ApiError } from '~/interfaces/api-error';
import type { TemplateMessage } from '~/interfaces/template-message';
import { routes } from '~/routes';
import type { CreateNewCampaignProps } from '~/services/workspace/create-new-campaign/interfaces';
import { notifyError } from '~/utils/notify-error';
import { BroadcastInfoCard } from '../../components/broadcast-info-card';
import { ContactAddModal } from '../../components/contact-add-modal';
import { SchedulingCard } from '../../components/scheduling-card';
import { TableCard } from '../../components/table-card';
import type { TableData } from '../../components/table-card/interfaces';
import { TemplateCard } from '../../components/template-card';
import { useCreateNewCampaign } from '../../hooks/use-create-new-campaign';
import { useGetCampaignById } from '../../hooks/use-get-campaign-by-id';
import { focusOnFieldWithError } from '../../utils/focus-on-field-with-error';
import type { BroadcastListFormValues } from './interfaces';

export const CreateBroadcastList = () => {
  const [form] = Form.useForm<BroadcastListFormValues>();
  const { queryStringAsObj } = useQueryString();
  const { workspaceId, broadcastListId } = useParams<{
    workspaceId: string;
    broadcastListId: string;
  }>();
  const { createCampaign, isCreatingNewCampaign } = useCreateNewCampaign();
  const { campaign, isLoadingCampaign, fetchCampaignById } = useGetCampaignById();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMessage>();
  const [selectedActiveMessage, setSelectedActiveMessage] = useState<ActiveMessageSetting>();
  const [dataSource, setDataSource] = useState<TableData[]>([]);
  const [isContactModalOpened, setIsContactModalOpened] = useState(false);
  const [shouldBlockNavigate, setShouldBlockNavigate] = useState(false);

  const formImmediateStart = Form.useWatch('immediateStart', form);
  const formIsTest = Form.useWatch('isTest', form);

  const { children: broadcastListModules } =
    routes.modules.children.campaigns.children.broadcastList;

  const viewListsPath = generatePath(broadcastListModules.viewBroadcastList.fullPath, {
    workspaceId,
  });

  const maxContactCount = formIsTest ? 5 : selectedActiveMessage?.data?.contactListLimit || 200;
  const canEditTemplate = !queryStringAsObj.contactsWithError;

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

  const handleCreateCampaign = async (values: CreateNewCampaignProps) => {
    const currentShouldBlockNavigate = shouldBlockNavigate;
    setShouldBlockNavigate(false);

    const result = await createCampaign(values);

    if ((result as ApiError)?.code) {
      setShouldBlockNavigate(currentShouldBlockNavigate);
      return;
    }

    navigate(viewListsPath);
  };

  const { t } = useTranslation();

  const createBroadcastListLocaleKeys = localeKeys.campaign.broadcastList.pages.createBroadcastList;

  const handleSubmit = async (formValues: BroadcastListFormValues) => {
    if (isCreatingNewCampaign) return;

    const availableCount = getAvailableContactCount();

    if (availableCount < 0) {
      notifyError(t(createBroadcastListLocaleKeys.notifyErrorSurplus), true);
      return;
    }

    if (duplicatedPhones.length > 0) {
      focusOnFieldWithError();
      notifyError(t(createBroadcastListLocaleKeys.notifyErrorDuplicatedPhones), true);
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
      notifyError(t(createBroadcastListLocaleKeys.notifyErrorContactError), true);
      focusOnFieldWithError();
      return;
    }

    const formattedSendAt = formValues.sendAt
      ? dayjs(formValues.sendAt, 'DD/MM/YYYY HH:mm').valueOf()
      : undefined;

    const formattedValues = {
      name: formValues.name!,
      activeMessageSettingId: formValues.activeMessageSettingId!,
      templateId: formValues.templateId!,
      sendAt: !formValues.immediateStart ? formattedSendAt : undefined,
      immediateStart: formValues.immediateStart,
      action: formValues.action,
      isTest: formValues.isTest,
      contacts,
      clonedFrom: broadcastListId ? Number(broadcastListId) : undefined,
    };

    if (formImmediateStart) {
      if (hasEmptyContactAttributes) {
        notifyError(t(createBroadcastListLocaleKeys.notifyErrorEmptyContact), true);
        focusOnFieldWithError();
        return;
      }

      Modal.confirm({
        title: t(createBroadcastListLocaleKeys.titleModalConfirm),
        icon: null,
        width: 534,
        content: (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Alert
                showIcon
                message={t(createBroadcastListLocaleKeys.messageAlertConfirm)}
                type='warning'
              />
            </Col>
            <Col span={24}>
              <span>{t(createBroadcastListLocaleKeys.messageSpanError)}</span>
            </Col>
          </Row>
        ),
        okText: t(createBroadcastListLocaleKeys.okTextConfirm),
        cancelText: 'Cancelar',
        onOk: async () => {
          await handleCreateCampaign(formattedValues);
        },
      });
      return;
    }

    if (hasEmptyContactAttributes) {
      Modal.confirm({
        title: t(createBroadcastListLocaleKeys.titleAlert),
        icon: null,
        width: 534,
        content: (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <span>{t(createBroadcastListLocaleKeys.spanHasEmptyContactAttributes)}</span>
            </Col>
          </Row>
        ),
        okText: t(createBroadcastListLocaleKeys.okTextSave),
        cancelText: t(createBroadcastListLocaleKeys.cancelTextEdit),
        onOk: async () => {
          await handleCreateCampaign(formattedValues);
        },
      });
      return;
    }

    handleCreateCampaign(formattedValues);
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!broadcastListId) return;

      const { contactsWithError } = queryStringAsObj;

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

        const broadcastName = contactsWithError
          ? `${name} ${t(createBroadcastListLocaleKeys.contactsWithErrorResend)}`
          : `${name} ${t(createBroadcastListLocaleKeys.contactsWithErrorClone)}`;
        const formattedSendAt = dayjs(Number(sendAt));
        const formattedStartAt = startedAt ? dayjs(Number(startedAt)) : undefined;

        form.setFieldsValue({
          name: broadcastName,
          activeMessageSettingId,
          templateId,
          sendAt: sendAt ? formattedSendAt : formattedStartAt,
          immediateStart,
          action,
          isTest,
        });

        const contacts = !contactsWithError
          ? broadcast.data.contacts
          : broadcast.data.contacts
              ?.filter((contact) => !contact.sent)
              .map((contact) => {
                const { status, id, sent, descriptionError, ...restProps } = contact;
                return restProps;
              });

        setDataSource(contacts || []);
        setShouldBlockNavigate(true);
      }
    };

    fetchCampaign();
  }, [
    broadcastListId,
    createBroadcastListLocaleKeys.contactsWithErrorClone,
    createBroadcastListLocaleKeys.contactsWithErrorResend,
    fetchCampaignById,
    form,
    queryStringAsObj,
    t,
  ]);

  const pageTitle =
    broadcastListId && campaign?.data
      ? `${t(createBroadcastListLocaleKeys.pageTitleCloning)} ${campaign?.data.campaign.name}`
      : t(createBroadcastListLocaleKeys.titleBroadcastList);

  const actionButtons = (
    <Space>
      <Link to={viewListsPath} replace>
        <Button disabled={isCreatingNewCampaign || isLoadingCampaign}>
          {t(createBroadcastListLocaleKeys.buttonGoBack)}
        </Button>
      </Link>
      <Button
        type='primary'
        htmlType='submit'
        form='create-new-broadcast-list-form'
        disabled={isLoadingCampaign}
        loading={isCreatingNewCampaign}
      >
        {formImmediateStart && dataSource.length >= 1
          ? t(createBroadcastListLocaleKeys.buttonSaveSend)
          : t(createBroadcastListLocaleKeys.buttonSave)}
      </Button>
    </Space>
  );

  return (
    <PageTemplate title={pageTitle} actionButtons={actionButtons}>
      <Spin spinning={isLoadingCampaign}>
        <Form
          id='create-new-broadcast-list-form'
          layout='vertical'
          form={form}
          initialValues={{ immediateStart: true }}
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
        >
          <Row wrap={false} gutter={[16, 16]}>
            <Col flex='420px' style={{ paddingBottom: 16 }}>
              <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                <BroadcastInfoCard canEdit />
                <TemplateCard
                  canEdit={canEditTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  setSelectedActiveMessage={setSelectedActiveMessage}
                />
                <SchedulingCard canEdit selectedTemplate={selectedTemplate} />
              </Space>
            </Col>
            <Col flex='auto'>
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
                  canEdit
                  dataSource={dataSource}
                  selectedTemplate={selectedTemplate}
                  selectedActiveMessage={selectedActiveMessage}
                  duplicatedPhones={duplicatedPhones}
                  availableCount={getAvailableContactCount()}
                  setDataSource={handleChangeContacts}
                  setIsContactModalOpened={setIsContactModalOpened}
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
