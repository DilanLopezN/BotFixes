import { Badge, Button, Collapse, Flex, Modal, Space, type CollapseProps } from 'antd';
import { ModalProps } from 'antd/es/modal/interface';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryString } from '~/hooks/use-query-string';
import { useSelectedIntegration } from '~/hooks/use-selected-integration';
import { localeKeys } from '~/i18n';
import { FeedbackEnum, RecipientTypeEnum } from '../../constants';
import type { SendingListQueryString } from '../../interfaces';
import { CancelingReasonList } from '../canceling-reason-list';
import { DoctorList } from '../doctor-list';
import { FeedbackList } from '../feedback-list';
import { InsuranceNameList } from '../insurance-name-list';
import { InsurancePlanNameList } from '../insurance-plan-name-list';
import { NpsScoreList } from '../nps-score-list';
import { OrganizationUnitList } from '../organization-unit-list';
import { ProcedureList } from '../procedure-lits';
import { RecipientTypeList } from '../recipient-type-list';
import { ScheduleWithAliasList } from '../schedule-with-alias-list';
import { SpecialityList } from '../speciality-list';
import { StatusList } from '../status-list';
import type { FiltersModalProps } from './interfaces';
import { FiltersContainer } from './styles';

export const FiltersModal = ({ isVisible, onClose }: FiltersModalProps) => {
  const { t } = useTranslation();
  const { queryStringAsObj, updateQueryString } = useQueryString<SendingListQueryString>();

  const [selectedSpecialityCodeList, setSelectedSpecialityCodeList] = useState<string[]>([]);
  const [selectedDoctorCodeList, setSelectedDoctorCodeList] = useState<string[]>([]);
  const [selectedStatusList, setSelectedStatusList] = useState<string[]>([]);
  const [selectedNpsScoreList, setSelectedNpsScoreList] = useState<string[]>([]);
  const [selectedInsuranceCodeList, setSelectedInsuranceCodeList] = useState<string[]>([]);
  const [selectedInsurancePlanCodeList, setSelectedInsurancePlanCodeList] = useState<string[]>([]);
  const [selectedProcedureList, setSelectedProcedureList] = useState<string[]>([]);
  const [selectedCancelingReasonList, setSelectedCancelingReasonList] = useState<string[]>([]);
  const [selectedOrganizationUnitList, setSelectedOrganizationUnitList] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEnum | null>(null);
  const [recipientType, setRecipientType] = useState<RecipientTypeEnum | null>(null);
  const [selectedScheduleSettingWithAliasList, setSelectedScheduleSettingWithAliasList] = useState<
    string[]
  >([]);
  const [activeCollapseItem, setActiveCollapseItem] = useState<string[]>(['1']);
  const { data: selectedIntegration } = useSelectedIntegration();
  const { filtersModal: filtersModalLocaleKeys } = localeKeys.dashboard.sendingList.fullTable;

  const handleResetFilters = () => {
    setSelectedSpecialityCodeList([]);
    setSelectedDoctorCodeList([]);
    setSelectedStatusList([]);
    setSelectedInsuranceCodeList([]);
    setSelectedInsurancePlanCodeList([]);
    setSelectedProcedureList([]);
    setSelectedCancelingReasonList([]);
    setSelectedOrganizationUnitList([]);
    setSelectedNpsScoreList([]);
    setFeedback(null);
    setRecipientType(null);
    setSelectedScheduleSettingWithAliasList([]);
  };

  const handleFilters = () => {
    updateQueryString({
      specialityCodeList: selectedSpecialityCodeList,
      doctorCodeList: selectedDoctorCodeList,
      statusList: selectedStatusList,
      procedureCodeList: selectedProcedureList,
      cancelReasonList: selectedCancelingReasonList,
      organizationUnitList: selectedOrganizationUnitList,
      insuranceCodeList: selectedInsuranceCodeList,
      insurancePlanCodeList: selectedInsurancePlanCodeList,
      npsScoreList: selectedNpsScoreList,
      feedback,
      recipientType,
      aliasSettingId: selectedScheduleSettingWithAliasList,
      currentPage: 1,
    });
    onClose();
  };

  useEffect(() => {
    if (isVisible) {
      setSelectedSpecialityCodeList(
        queryStringAsObj.specialityCodeList ? queryStringAsObj.specialityCodeList.split(',') : []
      );
      setSelectedDoctorCodeList(
        queryStringAsObj.doctorCodeList ? queryStringAsObj.doctorCodeList.split(',') : []
      );
      setSelectedStatusList(
        queryStringAsObj.statusList ? queryStringAsObj.statusList.split(',') : []
      );
      setSelectedInsuranceCodeList(
        queryStringAsObj.insuranceCodeList ? queryStringAsObj.insuranceCodeList.split(',') : []
      );
      setSelectedInsurancePlanCodeList(
        queryStringAsObj.insurancePlanCodeList
          ? queryStringAsObj.insurancePlanCodeList.split(',')
          : []
      );
      setSelectedProcedureList(
        queryStringAsObj.procedureCodeList ? queryStringAsObj.procedureCodeList.split(',') : []
      );
      setSelectedCancelingReasonList(
        queryStringAsObj.cancelReasonList ? queryStringAsObj.cancelReasonList.split(',') : []
      );
      setSelectedOrganizationUnitList(
        queryStringAsObj.organizationUnitList
          ? queryStringAsObj.organizationUnitList.split(',')
          : []
      );
      setSelectedNpsScoreList(
        queryStringAsObj.npsScoreList ? queryStringAsObj.npsScoreList.split(',') : []
      );
      setFeedback((queryStringAsObj.feedback as FeedbackEnum) || undefined);
      setRecipientType((queryStringAsObj.recipientType as RecipientTypeEnum) || undefined);
      setSelectedScheduleSettingWithAliasList(
        queryStringAsObj.aliasSettingId ? queryStringAsObj.aliasSettingId.split(',') : []
      );
    }
  }, [
    isVisible,
    queryStringAsObj.aliasSettingId,
    queryStringAsObj.cancelReasonList,
    queryStringAsObj.doctorCodeList,
    queryStringAsObj.feedback,
    queryStringAsObj.insuranceCodeList,
    queryStringAsObj.insurancePlanCodeList,
    queryStringAsObj.npsScoreList,
    queryStringAsObj.organizationUnitList,
    queryStringAsObj.procedureCodeList,
    queryStringAsObj.recipientType,
    queryStringAsObj.specialityCodeList,
    queryStringAsObj.statusList,
  ]);

  const filterList: CollapseProps['items'] = [
    {
      key: '1',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.specialityGroupTitle)}</span>
          <Badge count={selectedSpecialityCodeList.length} />
        </Space>
      ),
      children: (
        <SpecialityList
          isVisible={isVisible}
          selectedIntegrationId={selectedIntegration?._id}
          selectedSpecialityCodeList={selectedSpecialityCodeList}
          setSelectedSpecialityCodeList={setSelectedSpecialityCodeList}
        />
      ),
    },
    {
      key: '2',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.procedureName)}</span>
          <Badge count={selectedProcedureList.length} />
        </Space>
      ),
      children: (
        <ProcedureList
          isVisible={isVisible}
          selectedIntegrationId={selectedIntegration?._id}
          selectedProcedureList={selectedProcedureList}
          setSelectedProcedureList={setSelectedProcedureList}
        />
      ),
    },
    {
      key: '3',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.doctorGroupTitle)}</span>
          <Badge count={selectedDoctorCodeList.length} />
        </Space>
      ),
      children: (
        <DoctorList
          isVisible={isVisible}
          selectedIntegrationId={selectedIntegration?._id}
          selectedDoctorCodeList={selectedDoctorCodeList}
          setSelectedDoctorCodeList={setSelectedDoctorCodeList}
        />
      ),
    },
    {
      key: '4',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.statusGroupTitle)}</span>
          <Badge count={selectedStatusList.length} />
        </Space>
      ),
      children: (
        <StatusList
          selectedStatusList={selectedStatusList}
          setSelectedStatusList={setSelectedStatusList}
        />
      ),
    },
    {
      key: '5',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.cancelingReasonGroupTitle)}</span>
          <Badge count={selectedCancelingReasonList.length} />
        </Space>
      ),
      children: (
        <CancelingReasonList
          isVisible
          selectedCancelingReasonList={selectedCancelingReasonList}
          setSelectedCancelingReasonList={setSelectedCancelingReasonList}
        />
      ),
    },
    {
      key: '6',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.unitCategory)}</span>
          <Badge count={selectedOrganizationUnitList.length} />
        </Space>
      ),
      children: (
        <OrganizationUnitList
          isVisible={isVisible}
          selectedIntegrationId={selectedIntegration?._id}
          selectedOrganizationUnitList={selectedOrganizationUnitList}
          setSelectedOrganizationUnitList={setSelectedOrganizationUnitList}
        />
      ),
    },
    {
      key: '7',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.insuranceName)}</span>
          <Badge count={selectedInsuranceCodeList.length} />
        </Space>
      ),
      children: (
        <InsuranceNameList
          isVisible={isVisible}
          selectedIntegrationId={selectedIntegration?._id}
          selectedInsuranceNameList={selectedInsuranceCodeList}
          setSelectedInsuranceNameList={setSelectedInsuranceCodeList}
        />
      ),
    },
    {
      key: '8',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.insurancePlanName)}</span>
          <Badge count={selectedInsurancePlanCodeList.length} />
        </Space>
      ),
      children: (
        <InsurancePlanNameList
          isVisible={isVisible}
          selectedIntegrationId={selectedIntegration?._id}
          selectedInsurancePlanNameList={selectedInsurancePlanCodeList}
          setSelectedInsurancePlanNameList={setSelectedInsurancePlanCodeList}
        />
      ),
    },
    {
      key: '9',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.npsScoreTitle)}</span>
          <Badge count={selectedNpsScoreList.length} />
        </Space>
      ),
      children: (
        <NpsScoreList
          selectedNpsScoreList={selectedNpsScoreList}
          setSelectedNpsScoreList={setSelectedNpsScoreList}
        />
      ),
    },
    {
      key: '10',
      label: (
        <Space align='center'>
          <span>Feedback</span>
          <Badge count={feedback ? 1 : 0} />
        </Space>
      ),
      children: <FeedbackList feedback={feedback} setFeedback={setFeedback} />,
    },
    {
      key: '11',
      label: (
        <Space align='center'>
          <span>Canal</span>
          <Badge count={recipientType ? 1 : 0} />
        </Space>
      ),
      children: (
        <RecipientTypeList recipientType={recipientType} setRecipientType={setRecipientType} />
      ),
    },
    {
      key: '12',
      label: (
        <Space align='center'>
          <span>{t(filtersModalLocaleKeys.configSendingStatus)}</span>
          <Badge count={selectedScheduleSettingWithAliasList.length} />
        </Space>
      ),
      children: (
        <ScheduleWithAliasList
          selectedScheduleSettingWithAliasList={selectedScheduleSettingWithAliasList}
          setSelectedScheduleSettingWithAliasList={setSelectedScheduleSettingWithAliasList}
        />
      ),
    },
  ];

  const modalFooter: ModalProps['footer'] = (_originNode, { OkBtn, CancelBtn }) => {
    return (
      <Flex justify='space-between'>
        <Button onClick={handleResetFilters}>{t(filtersModalLocaleKeys.resetFiltersButton)}</Button>
        <Space style={{ paddingRight: 24 }}>
          <CancelBtn />
          <OkBtn />
        </Space>
      </Flex>
    );
  };

  return (
    <FiltersContainer>
      <Modal
        open={isVisible}
        width={620}
        onOk={handleFilters}
        okText={t(filtersModalLocaleKeys.filterButton)}
        cancelText={t(filtersModalLocaleKeys.cancelButton)}
        styles={{
          body: { height: 650, overflowY: 'auto', paddingRight: 16 },
          content: {
            paddingRight: 0,
          },
        }}
        onCancel={onClose}
        title={t(filtersModalLocaleKeys.modalTitle)}
        maskClosable={false}
        keyboard={false}
        forceRender
        footer={modalFooter}
      >
        <Collapse
          items={filterList}
          ghost
          activeKey={activeCollapseItem}
          onChange={(key) => {
            const lastKey = _.last(key);
            setActiveCollapseItem(lastKey ? [lastKey] : []);
          }}
        />
      </Modal>
    </FiltersContainer>
  );
};
