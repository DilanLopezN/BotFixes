import { InfoCircleOutlined, MoreOutlined, PoweroffOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Flex,
  MenuProps,
  Row,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { debounce } from 'lodash';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, generatePath, useLocation, useParams } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { useQueryString } from '~/hooks/use-query-string';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import {
  SearchInput,
  TableTitle,
} from '~/modules/campaigns/broadcast-list/pages/broadcast-grid/styles';
import { routes } from '~/routes';
import { notifyError } from '~/utils/notify-error';
import { ConfirmDeleteModal } from '../../components/confirm-delete-modal';
import { CopyConfigModal } from '../../components/copy-config-modal';
import { EnableRemiSwitch } from '../../components/enable-remi-switch';
import { useAllRemiSettings } from '../../hooks/use-all-remi-settings';
import { useRemiOperations } from '../../hooks/use-remi-operations';
import { useTeamList } from '../../hooks/use-team-list';
import { useToggleRemiActive } from '../../hooks/use-toggle-remi-active';

export const RemiList = () => {
  const { t } = useTranslation();
  const { teamList } = useTeamList();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { remiList: remiKeys } = localeKeys.settings.remi.pages;
  const location = useLocation();
  const { children: remiModules } = routes.modules.children.settings.children.remi;

  const {
    data: allRemiSettings,
    isLoading: isLoadingRemiList,
    fetchRemiSettings,
  } = useAllRemiSettings();

  const {
    isCopyingConfig,
    isDeleting,
    handleCloneRemi,
    handleCopyConfig,
    handleDeleteRemi,
    isOperationInProgress,
  } = useRemiOperations(allRemiSettings || [], () => fetchRemiSettings());

  const { toggleRemiActive, isToggling } = useToggleRemiActive();

  const { userFeatureFlag } = useSelectedWorkspace();

  const [featureFlag, setFeatureFlag] = useState(userFeatureFlag?.enableRemi);
  const { queryStringAsObj, updateQueryString } = useQueryString<{ search?: string }>({
    allowedQueries: ['search'],
  });
  const querySearch = queryStringAsObj.search || '';
  const [searchInputValue, setSearchInputValue] = useState(querySearch);

  const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [sourceRemiIdForCopy, setSourceRemiIdForCopy] = useState<string | null>(null);
  const [remiToDelete, setRemiToDelete] = useState<string | null>(null);

  const isLoading = isLoadingRemiList || isOperationInProgress || isToggling;

  const createNewRemiPath = generatePath(remiModules.remiConfig.fullPath, { workspaceId });

  const debouncedSearch = useRef(
    debounce((value: string) => {
      updateQueryString({ search: value });
    }, 300)
  ).current;

  const handleChangeSearchInput = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(event.target.value);
    debouncedSearch(event.target.value);
  };

  const filteredRemiList = useMemo(() => {
    if (!allRemiSettings) return [];
    const searchTerm = querySearch.toLowerCase();
    return allRemiSettings
      .filter(
        (remi) =>
          typeof remi.id === 'string' &&
          (remi.name || t(remiKeys.defaultName)).toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        const aActive = a.active !== false ? 1 : 0;
        const bActive = b.active !== false ? 1 : 0;
        return bActive - aActive;
      });
  }, [allRemiSettings, querySearch, remiKeys.defaultName, t]);

  const remiToDeleteName = useMemo(() => {
    if (!remiToDelete || !allRemiSettings) return '';
    const remi = allRemiSettings.find((r) => r.id === remiToDelete);
    return remi?.name || t(remiKeys.defaultName);
  }, [remiToDelete, allRemiSettings, remiKeys.defaultName, t]);

  const targetRemiOptions = useMemo(() => {
    if (!sourceRemiIdForCopy || !allRemiSettings) return [];
    return allRemiSettings
      .filter((remi) => remi.id !== sourceRemiIdForCopy && typeof remi.id === 'string')
      .map((remi) => ({
        label: remi.name || t(remiKeys.defaultName),
        value: remi.id!,
      }));
  }, [allRemiSettings, remiKeys.defaultName, sourceRemiIdForCopy, t]);

  const handleCopyConfigClick = (sourceRemiId: string) => {
    if (isOperationInProgress) return;

    const targetRemis = allRemiSettings?.filter(
      (remi) => remi.id !== sourceRemiId && typeof remi.id === 'string'
    );
    if (!targetRemis || targetRemis.length === 0) {
      notifyError({ message: t(remiKeys.noOtherRemisToCopy) });
      return;
    }

    setSourceRemiIdForCopy(sourceRemiId);
    setIsCopyModalVisible(true);
  };

  const handleConfirmCopyConfig = async (targetRemiId: string) => {
    if (!sourceRemiIdForCopy) return;

    const success = await handleCopyConfig(sourceRemiIdForCopy, targetRemiId);
    if (success) {
      setIsCopyModalVisible(false);
      setSourceRemiIdForCopy(null);
    }
  };

  const handleDeleteRemiClick = (remiDeleteId: string) => {
    if (isOperationInProgress) return;
    setRemiToDelete(remiDeleteId);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDeleteRemi = async () => {
    if (!remiToDelete) return;
    const success = await handleDeleteRemi(remiToDelete);
    if (success) {
      setIsDeleteModalVisible(false);
      setRemiToDelete(null);
    }
  };

  const handleCloneRemiClick = (remiId: string) => {
    if (isOperationInProgress) return;
    handleCloneRemi(remiId);
  };

  const handleActive = (isActive: boolean) => {
    setFeatureFlag(isActive);
  };

  const handleToggleRemiActive = async (remiId: string, currentActive: boolean) => {
    if (isOperationInProgress) return;

    const success = await toggleRemiActive(remiId, currentActive);
    if (success) {
      fetchRemiSettings();
    }
  };

  useEffect(() => {
    setFeatureFlag(userFeatureFlag?.enableRemi);
  }, [userFeatureFlag]);

  useEffect(() => {
    setSearchInputValue(querySearch);
  }, [querySearch]);

  const columns: ColumnsType<any> = [
    {
      title: t(remiKeys.columnTitleName),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, remi) => {
        return <span>{name || t(remiKeys.defaultName)}</span>;
      },
    },
    {
      title: t(remiKeys.columnTitleTeams),
      dataIndex: 'teamIds',
      key: 'teamIds',
      render: (teamIds: string[]) => {
        const allTeams = teamList?.data || [];
        const hasTeams = Array.isArray(teamIds) && teamIds.length > 0;

        if (!hasTeams) {
          return <Tag key='all'>{t(remiKeys.allTeamsTag)}</Tag>;
        }

        const teamNames = teamIds
          .map((id) => allTeams.find((team) => team._id === id)?.name)
          .filter(Boolean);

        return (
          <>
            {teamNames.map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
          </>
        );
      },
    },
    {
      title: t(remiKeys.columnTitleStatus),
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active: boolean) => {
        const isActive = active !== false;
        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? t(remiKeys.activeLabel) : t(remiKeys.inactiveLabel)}
          </Tag>
        );
      },
    },
    {
      title: t(remiKeys.columnTitleActions),
      dataIndex: 'actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, remi) => {
        const disableActions = isLoading;
        const isActive = remi.active !== false;

        const menu: MenuProps['items'] = [
          {
            key: 'toggle',
            label: isActive ? t(remiKeys.toggleDeactivate) : t(remiKeys.toggleActivate),
            icon: <PoweroffOutlined />,
            onClick: () => handleToggleRemiActive(remi.id!, isActive),
            disabled: disableActions,
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'clone',
            label: t(remiKeys.cloneButtonLabel),
            onClick: () => handleCloneRemiClick(remi.id!),
            disabled: disableActions,
          },
          {
            key: 'copyConfig',
            label: t(remiKeys.copyConfigButtonLabel),
            onClick: () => handleCopyConfigClick(remi.id!),
            disabled: disableActions || filteredRemiList.length === 1,
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            danger: true,
            label: t(remiKeys.deleteButtonLabel),
            onClick: () => handleDeleteRemiClick(remi.id!),
            disabled: disableActions,
          },
        ];

        const viewRemiPath = generatePath(remiModules.remiUpdate.fullPath, {
          workspaceId,
          remiId: remi.id,
        });

        return (
          <Space size='small'>
            <Link to={viewRemiPath} state={{ queryStrings: location.search }}>
              <Button size='small'>{t(remiKeys.viewButtonLabel)}</Button>
            </Link>

            <Dropdown menu={{ items: menu }} trigger={['click']}>
              <Button icon={<MoreOutlined />} size='small' disabled={disableActions} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const actionButtons = (
    <Space>
      <Link to={createNewRemiPath}>
        <Button type='primary'>{t(remiKeys.addRemiButton)}</Button>{' '}
      </Link>
    </Space>
  );

  const pageTitle = (
    <Space align='center'>
      <span>{t(remiKeys.pageHeader)}</span>
      <Tooltip title={t(remiKeys.infoTooltip)}>
        <Link
          to='https://botdesigner.freshdesk.com/support/solutions/articles/69000871800-como-utilizar-a-funcionalidade-remi-reengajamento-inteligente'
          target='_blank'
        >
          <InfoCircleOutlined style={{ color: '#1677ff' }} />
        </Link>
      </Tooltip>
      <EnableRemiSwitch onActive={handleActive} />
      {!featureFlag && <Alert message={t(remiKeys.alertMessage)} />}
    </Space>
  );

  return (
    <PageTemplate title={pageTitle} actionButtons={actionButtons}>
      <Alert message={t(remiKeys.automationInfo)} type='info' style={{ marginBottom: 16 }} />

      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Flex justify='space-between' align='center'>
              <TableTitle>{t(remiKeys.tableTitle)}</TableTitle>
              <Space wrap>
                <SearchInput
                  value={searchInputValue}
                  onChange={handleChangeSearchInput}
                  placeholder={t(remiKeys.searchInputPlaceholder)}
                />
              </Space>
            </Flex>
          </Col>
          <Col span={24}>
            <EnhancedTable
              columns={columns}
              dataSource={filteredRemiList}
              loading={isLoading}
              bordered
              scroll={{
                y: 'calc(100vh - 295x)',
              }}
              rowKey='id'
            />
          </Col>
        </Row>
      </Card>

      <CopyConfigModal
        visible={isCopyModalVisible}
        onCancel={() => {
          setIsCopyModalVisible(false);
          setSourceRemiIdForCopy(null);
        }}
        onConfirm={handleConfirmCopyConfig}
        loading={isCopyingConfig}
        targetOptions={targetRemiOptions}
      />

      <ConfirmDeleteModal
        visible={isDeleteModalVisible}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setRemiToDelete(null);
        }}
        onConfirm={handleConfirmDeleteRemi}
        loading={isDeleting}
        remiName={remiToDeleteName}
      />
    </PageTemplate>
  );
};
