import { Checkbox, Col, Row } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import type { PermissionListProps, PermissionListRef } from './interfaces';
import { CheckboxGroupDivider } from './styles';

export const PermissionList = forwardRef<PermissionListRef, PermissionListProps>(
  ({ selectedUser }, ref) => {
    const { t } = useTranslation();
    const { permissionList } = localeKeys.settings.teams.components;
    const [isSupervisor, setIsSupervisor] = useState(false);
    const [canStartConversation, setCanStartConversation] = useState(false);
    const [canViewFinishedConversations, setCanViewFinishedConversations] = useState(false);
    const [canViewOpenTeamConversations, setCanViewOpenTeamConversations] = useState(false);
    const [canViewConversationContent, setCanViewConversationContent] = useState(false);
    const [canTransferConversations, setCanTransferConversations] = useState(false);
    const [canSendAudioMessage, setCanSendAudioMessage] = useState(false);
    const [canViewHistoricConversation, setCanViewHistoricConversation] = useState(false);
    const [canSendOfficialTemplate, setCanSendOfficialTemplate] = useState(false);

    const handleResetCheckboxes = () => {
      setIsSupervisor(false);
      setCanStartConversation(false);
      setCanViewFinishedConversations(false);
      setCanViewOpenTeamConversations(false);
      setCanViewConversationContent(false);
      setCanTransferConversations(false);
      setCanSendAudioMessage(false);
      setCanViewHistoricConversation(false);
      setCanSendOfficialTemplate(false);
    };

    useImperativeHandle(
      ref,
      () => ({
        getCheckboxValues: () => {
          const permissions = {
            isSupervisor,
            canSendAudioMessage,
            canStartConversation,
            canTransferConversations,
            canViewConversationContent,
            canViewFinishedConversations,
            canViewHistoricConversation,
            canViewOpenTeamConversations,
            canSendOfficialTemplate,
          };

          handleResetCheckboxes();
          return permissions;
        },
        resetValues: () => {
          handleResetCheckboxes();
        },
      }),
      [
        canSendAudioMessage,
        canSendOfficialTemplate,
        canStartConversation,
        canTransferConversations,
        canViewConversationContent,
        canViewFinishedConversations,
        canViewHistoricConversation,
        canViewOpenTeamConversations,
        isSupervisor,
      ]
    );

    useEffect(() => {
      if (!selectedUser) return;

      setIsSupervisor(selectedUser.isSupervisor);
      setCanStartConversation(selectedUser.permission.canStartConversation);
      setCanViewFinishedConversations(selectedUser.permission.canViewFinishedConversations);
      setCanViewOpenTeamConversations(selectedUser.permission.canViewOpenTeamConversations);
      setCanViewConversationContent(selectedUser.permission.canViewConversationContent);
      setCanTransferConversations(selectedUser.permission.canTransferConversations);
      setCanSendAudioMessage(selectedUser.permission.canSendAudioMessage);
      setCanViewHistoricConversation(selectedUser.permission.canViewHistoricConversation);
      setCanSendOfficialTemplate(selectedUser.permission.canSendOfficialTemplate);
    }, [selectedUser]);

    return (
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Checkbox
            checked={isSupervisor && !canViewHistoricConversation}
            disabled={canViewHistoricConversation}
            onChange={(event) => {
              setIsSupervisor(event.target.checked);
            }}
          >
            {t(permissionList.supervisor)}
          </Checkbox>
        </Col>
        <CheckboxGroupDivider />
        <Col span={24}>
          <Checkbox checked={!canViewHistoricConversation} disabled>
            {t(permissionList.viewAttendances)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canStartConversation) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanStartConversation(event.target.checked);
            }}
          >
            {t(permissionList.startAttendances)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canViewFinishedConversations) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanViewFinishedConversations(event.target.checked);
            }}
          >
            {t(permissionList.viewFinishedAttendances)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canViewOpenTeamConversations) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanViewOpenTeamConversations(event.target.checked);
            }}
          >
            {t(permissionList.viewOpenTeamConversations)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canViewConversationContent) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanViewConversationContent(event.target.checked);
            }}
          >
            {t(permissionList.viewConversationContent)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canTransferConversations) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanTransferConversations(event.target.checked);
            }}
          >
            {t(permissionList.transferConversations)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canSendAudioMessage) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanSendAudioMessage(event.target.checked);
            }}
          >
            {t(permissionList.sendAudioMessage)}
          </Checkbox>
        </Col>
        <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canSendOfficialTemplate) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanSendOfficialTemplate(event.target.checked);
            }}
          >
            {t(permissionList.sendOfficialTemplate)}
          </Checkbox>
        </Col>
        {/* <Col span={24}>
          <Checkbox
            checked={(isSupervisor || canSendMultipleMessages) && !canViewHistoricConversation}
            disabled={canViewHistoricConversation || isSupervisor}
            onChange={(event) => {
              setCanSendMultipleMessages(event.target.checked);
            }}
          >
           {t(permissionList.sendMultipleMessages)}
          </Checkbox>
        </Col> */}
        <CheckboxGroupDivider />
        <Col span={24}>
          <Checkbox
            checked={canViewHistoricConversation && !isSupervisor}
            disabled={isSupervisor}
            onChange={(event) => {
              setCanViewHistoricConversation(event.target.checked);
            }}
          >
            {t(permissionList.viewHistoricConversation)}
          </Checkbox>
        </Col>
      </Row>
    );
  }
);
