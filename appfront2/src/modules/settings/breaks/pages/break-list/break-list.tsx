import {
  CheckOutlined,
  EditOutlined,
  InfoCircleOutlined,
  RedoOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Flex, Modal, Row, Space, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { debounce } from 'lodash';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EnhancedTable } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import type { BreakTime } from '~/interfaces/break-time';
import { formatDurationHms } from '~/utils/format-duration-hms';
import { notifyError } from '~/utils/notify-error';
import { notifySuccess } from '~/utils/notify-success';
import { AutomaticBreakModal } from '../../components/automatic-break-modal';
import { BreakModal } from '../../components/break-modal';
import { EnableBreaksSwitch } from '../../components/enable-breaks-switch';
import { useActivateBreak } from '../../hooks/use-activate-break';
import { useBreaks } from '../../hooks/use-breaks';
import { useInactivateBreak } from '../../hooks/use-inactivate-break';
import { useToggleBreaksStatus } from '../../hooks/use-toggle-breaks-status';
import { BreaksCountContainer, SearchInput, TableTitle } from './styles';

export const BreakList = () => {
  const { breaks, isFetchingBreaks, fetchBreaks } = useBreaks();
  const { inactivateBreak } = useInactivateBreak();
  const { activateBreak } = useActivateBreak();
  const { toggleBreaksStatus } = useToggleBreaksStatus();
  const [isBreakModalVisible, setIsBreakModalVisible] = useState(false);
  const [isAutomaticBreakModalVisible, setIsAutomaticBreakModalVisible] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [debouncedSearchInputValue, setDebouncedSearchInputValue] = useState('');
  const [selectedBreak, setSelectedBreak] = useState<BreakTime>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const sortedBreaks = useMemo(() => {
    if (!breaks) return [];

    return [...breaks].sort((currentBreak, nextBreak) => {
      if (currentBreak.enabled === nextBreak.enabled) return 0;
      return currentBreak.enabled ? -1 : 1;
    });
  }, [breaks]);

  const breaksLength = sortedBreaks?.length || 0;

  const debouncedSearch = useRef(
    debounce((value: string) => {
      setDebouncedSearchInputValue(value);
    }, 300)
  ).current;

  const handleChangeSearchInput = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleOpenAutomaticBreakModal = () => {
    setIsAutomaticBreakModalVisible(true);
  };

  const handleCloseAutomaticBreakModal = () => {
    setIsAutomaticBreakModalVisible(false);
  };

  const handleOpenBreakModal = (breakTime?: BreakTime) => {
    setIsBreakModalVisible(true);

    if (breakTime) {
      setSelectedBreak(breakTime);
    }
  };

  const handleCloseBreakModal = () => {
    setIsBreakModalVisible(false);
    setSelectedBreak(undefined);
  };

  const handleRefresh = useCallback(async () => {
    fetchBreaks({ name: debouncedSearchInputValue });
  }, [debouncedSearchInputValue, fetchBreaks]);

  const bulkActivateBreaks = () => {
    if (selectedRowKeys.length === 0) {
      notifyError('Nenhuma pausa selecionada');
      return;
    }

    Modal.confirm({
      title: 'Ativar pausas',
      icon: null,
      width: 520,
      content: (
        <Alert
          message={
            <div>
              <span>
                Tem certeza que deseja ativar as <b>{selectedRowKeys.length} pausas</b>{' '}
                selecionadas? Elas voltarão a ficar disponíveis para os usuários.
              </span>
            </div>
          }
          type='warning'
        />
      ),
      onOk: async () => {
        const result = await toggleBreaksStatus({ ids: selectedRowKeys, enabled: true });

        if (!result) {
          notifyError('Erro ao ativar as pausas selecionadas');
          return;
        }

        setSelectedRowKeys([]);
        notifySuccess({
          message: 'Sucesso',
          description: 'As pausas selecionadas foram ativadas com sucesso.',
        });
        handleRefresh();
      },
      okText: 'Ativar pausas selecionadas',
      cancelText: 'Cancelar',
    });
  };

  const bulkInactivateBreaks = () => {
    if (selectedRowKeys.length === 0) {
      notifyError('Nenhuma pausa selecionada');
      return;
    }

    Modal.confirm({
      title: 'Inativar pausas',
      icon: null,
      width: 520,
      content: (
        <Alert
          message={
            <div>
              <span>
                Tem certeza que deseja inativar as <b>{selectedRowKeys.length} pausas</b>{' '}
                selecionados? Elas só ficarão inativas e não serão excluidas
              </span>
            </div>
          }
          type='warning'
        />
      ),
      onOk: async () => {
        const result = await toggleBreaksStatus({ ids: selectedRowKeys, enabled: false });

        if (!result) {
          notifyError('Erro ao inativar as pausas selecionadas');
          return;
        }

        setSelectedRowKeys([]);
        notifySuccess({
          message: 'Sucesso',
          description: 'As pausas selecionadas foram inativadas com sucesso.',
        });
        handleRefresh();
      },
      okText: 'Inativar pausas selecionadas',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
    });
  };

  const handleInactivateBreak = async (breakTime: BreakTime) => {
    Modal.confirm({
      title: 'Inativar pausa',
      icon: null,
      width: 520,
      content: (
        <Alert
          message={
            <div>
              <span>
                Tem certeza que deseja inativar a pausa <b>{breakTime.name}</b>? Ela só ficará
                inativa e não será excluida
              </span>
            </div>
          }
          type='warning'
        />
      ),
      onOk: async () => {
        const result = await inactivateBreak(breakTime);

        if (!result) {
          notifyError('Erro ao inativar pausa');
          return;
        }

        notifySuccess({ message: 'Sucesso', description: 'Pausa inativada.' });
        handleRefresh();
      },
      okText: 'Inativar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
    });
  };

  const handleActivateBreak = async (breakTime: BreakTime) => {
    Modal.confirm({
      title: 'Ativar pausa',
      icon: null,
      width: 520,
      content: (
        <Alert
          message={
            <div>
              <span>
                Tem certeza que deseja ativar a pausa <b>{breakTime.name}</b>? Ela voltará a ficar
                disponível para os usuários.
              </span>
            </div>
          }
          type='warning'
        />
      ),
      onOk: async () => {
        const result = await activateBreak(breakTime);

        if (!result) {
          notifyError('Erro ao ativar pausa');
          return;
        }

        notifySuccess({ message: 'Sucesso', description: 'Pausa ativada.' });
        handleRefresh();
      },
      okText: 'Ativar',
      cancelText: 'Cancelar',
    });
  };

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const pageTitle = (
    <Flex align='center' gap={16}>
      <span>Pausas</span>
      <EnableBreaksSwitch />
      <Tooltip title='Navegar para o artigo'>
        <Link
          to='https://botdesigner.freshdesk.com/support/solutions/articles/69000872737-como-configurar-as-pausas-da-funcionalidade-status-dos-agentes-'
          target='_blank'
          style={{ height: 16, width: 16 }}
        >
          <InfoCircleOutlined style={{ color: '#1677ff' }} />
        </Link>
      </Tooltip>
    </Flex>
  );

  const actionButtons = (
    <Space>
      <Button onClick={handleOpenAutomaticBreakModal}>Configurar pausa automática</Button>
      <Button
        type='primary'
        onClick={() => {
          handleOpenBreakModal();
        }}
      >
        Criar pausa
      </Button>
    </Space>
  );

  const columns: ColumnsType<BreakTime> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (_, breakTime) => {
        if (!breakTime.enabled) {
          return (
            <Space size='middle'>
              <span>{breakTime.name}</span>
              <Tag color='red'>Inativo</Tag>
            </Space>
          );
        }

        return <span>{breakTime.name}</span>;
      },
    },
    {
      title: 'Intervalo',
      dataIndex: 'durationSeconds',
      key: 'durationSeconds',
      width: 190,
      render: (duration: number) => {
        return <span>{formatDurationHms(duration)}</span>;
      },
    },
    {
      dataIndex: 'actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, breakTime) => {
        return (
          <Space>
            <Tooltip title='Editar'>
              <Button
                icon={<EditOutlined style={{ color: '#faad14' }} />}
                type='text'
                onClick={() => {
                  handleOpenBreakModal(breakTime);
                }}
              />
            </Tooltip>
            {breakTime.enabled ? (
              <Tooltip title='Inativar'>
                <Button
                  icon={<StopOutlined style={{ color: '#ff4d4f' }} />}
                  type='text'
                  onClick={() => {
                    handleInactivateBreak(breakTime);
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip title='Ativar'>
                <Button
                  icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                  type='text'
                  onClick={() => {
                    handleActivateBreak(breakTime);
                  }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <PageTemplate title={pageTitle} actionButtons={actionButtons}>
      <Card styles={{ body: { paddingBottom: 0 } }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Flex justify='space-between' gap={16} align='center'>
              <TableTitle>Lista de pausas</TableTitle>
              <Space wrap>
                <Button onClick={bulkActivateBreaks}>Ativar em lote</Button>
                <Button onClick={bulkInactivateBreaks}>Inativar em lote</Button>
                <SearchInput
                  value={searchInputValue}
                  onChange={handleChangeSearchInput}
                  placeholder='Procurar na lista'
                />
                <Button icon={<RedoOutlined />} onClick={handleRefresh}>
                  Atualizar
                </Button>
              </Space>
            </Flex>
          </Col>
          <Col span={24}>
            <EnhancedTable
              columns={columns}
              dataSource={sortedBreaks}
              loading={isFetchingBreaks}
              bordered
              pagination={false}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (newSelectedRowKeys) => {
                  setSelectedRowKeys(newSelectedRowKeys as number[]);
                },
                preserveSelectedRowKeys: true,
              }}
              scroll={{
                y: 'calc(100vh - 280px)',
                x: 664,
              }}
            />
            {breaksLength > 0 && (
              <BreaksCountContainer>
                <span>
                  {breaksLength !== 1 ? `${breaksLength} pausas` : `${breaksLength} pausa`}
                </span>
              </BreaksCountContainer>
            )}
          </Col>
        </Row>
      </Card>
      <BreakModal
        isVisible={isBreakModalVisible}
        onClose={handleCloseBreakModal}
        selectedBreak={selectedBreak}
        onRefresh={handleRefresh}
      />
      <AutomaticBreakModal
        isVisible={isAutomaticBreakModalVisible}
        onClose={handleCloseAutomaticBreakModal}
      />
    </PageTemplate>
  );
};
