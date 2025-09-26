import { useTranslation } from 'react-i18next';
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Modal, Row, Space, Tooltip } from 'antd';
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom';
import { localeKeys } from '~/i18n';
import { CampaignStatus } from '~/constants/campaign-status';
import { routes } from '~/routes';
import { useDeleteCampaign } from '../../hooks/use-delete-campaign';
import type { GridActionsColumnProps } from './interface';

export const GridActionsColumn = ({ broadcastList, updateList }: GridActionsColumnProps) => {
  const navigate = useNavigate();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { deleteCampaign, isDeleting } = useDeleteCampaign();
  const { children: broadcastListModules } =
    routes.modules.children.campaigns.children.broadcastList;

  const cloneBroadcastPath = generatePath(broadcastListModules.cloneBroadcastList.fullPath, {
    workspaceId,
    broadcastListId: broadcastList.id,
  });
  const editBroadcastPath = generatePath(broadcastListModules.editBroadcastList.fullPath, {
    workspaceId,
    broadcastListId: broadcastList.id,
  });

  const canDelete =
    broadcastList.status !== CampaignStatus.finished_complete &&
    broadcastList.status !== CampaignStatus.running;

  const { t } = useTranslation();

  const gridActionsColumnLocaleKeys =
    localeKeys.campaign.broadcastList.components.gridActionsColumn;

  const handleDelete = () => {
    Modal.confirm({
      title: t(gridActionsColumnLocaleKeys.deleteTitle),
      icon: null,
      width: 534,
      content: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message={t(gridActionsColumnLocaleKeys.deleteAlertMessage)}
              type='warning'
              showIcon
            />
          </Col>
          <Col span={24}>
            <span>
              {t(gridActionsColumnLocaleKeys.deleteSpanMessage)} <b>{broadcastList.name}?</b>
            </span>
          </Col>
        </Row>
      ),
      okText: t(gridActionsColumnLocaleKeys.deleteOkText),
      okButtonProps: { danger: true },
      cancelText: t(gridActionsColumnLocaleKeys.cancelText),
      onOk: async () => {
        await deleteCampaign(broadcastList.id);
        updateList();
      },
      onCancel: () => {},
    });
  };
  const handleCloneBroadcast = () => {
    Modal.confirm({
      title: t(gridActionsColumnLocaleKeys.cloneTitle),
      icon: null,
      width: 534,
      content: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              showIcon
              message={t(gridActionsColumnLocaleKeys.cloneAlertMessage)}
              type='warning'
            />
          </Col>
          <Col span={24}>
            <span>{t(gridActionsColumnLocaleKeys.cloneConfirmationSpan)}</span>
          </Col>
        </Row>
      ),

      okText: t(gridActionsColumnLocaleKeys.confirmOkText),
      cancelText: t(gridActionsColumnLocaleKeys.cancelText),
      onOk: () => navigate(cloneBroadcastPath),
    });
  };
  return (
    <Space>
      <Link to={editBroadcastPath}>
        <Button disabled={isDeleting}>{t(gridActionsColumnLocaleKeys.buttonViewSendItems)}</Button>
      </Link>
      <Tooltip title={t(gridActionsColumnLocaleKeys.cloneTitle)}>
        <Button icon={<CopyOutlined />} disabled={isDeleting} onClick={handleCloneBroadcast} />
      </Tooltip>
      <Tooltip
        title={
          canDelete
            ? t(gridActionsColumnLocaleKeys.canDelete)
            : t(gridActionsColumnLocaleKeys.deleteWarning)
        }
      >
        <Button
          icon={<DeleteOutlined />}
          loading={isDeleting}
          onClick={handleDelete}
          disabled={!canDelete}
        />
      </Tooltip>
    </Space>
  );
};
