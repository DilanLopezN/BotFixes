import {
  CopyOutlined,
  LeftOutlined,
  LinkOutlined,
  MoreOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Dropdown, Flex, Row, Tag, Tooltip, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 } from 'uuid';
import { EnhancedTable, type EnhancedTableRef } from '~/components/enhanced-table';
import { PageTemplate } from '~/components/page-template';
import { useQueryString } from '~/hooks/use-query-string';
import { FiltersContainer } from '../../components/filters-container';
import { allowedQueries } from '../../constants';
import { useAppointmentTableData } from '../../hooks/use-appointment-table-data';
import { AppointmentTableQueryString } from '../../interfaces';
import { pageSize } from './constants';

export const AppointmentReports = () => {
  const tableRef = useRef<EnhancedTableRef>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { queryStringAsObj } = useQueryString<AppointmentTableQueryString>({
    allowedQueries,
  });
  const { appointmentTableData, isFetchingAppointmentTableData, fetchAppointmentTableData } =
    useAppointmentTableData(currentPage, pageSize);

  const handleCopyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        message.success('Link copiado com sucesso!');
      })
      .catch(() => {
        message.error('Erro ao copiar link');
      });
  };

  const handleGoToConversation = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const columnsMap = useMemo(
    () => ({
      iid: {
        dataIndex: 'iid',
        key: 'iid',
        title: 'ID do atendimento',
        width: 150,
        render: (value: any) => {
          return `#${value}`;
        },
      },
      telefone_paciente: {
        dataIndex: 'telefone_paciente',
        key: 'telefone_paciente',
        title: 'Telefone paciente',
        width: 150,
      },
      cpf_paciente: {
        dataIndex: 'cpf_paciente',
        key: 'cpf_paciente',
        title: 'CPF paciente',
        width: 150,
      },
      data_criacao_atendimento: {
        dataIndex: 'data_criacao_atendimento',
        key: 'data_criacao_atendimento',
        title: 'Data criacao atendimento',
        width: 200,
      },
      data_finalizacao_atendimento: {
        dataIndex: 'data_finalizacao_atendimento',
        key: 'data_finalizacao_atendimento',
        title: 'Data finalizacao atendimento',
        width: 200,
      },
      // time_id: { dataIndex: 'time_id', key: 'time_id', title: 'Time id', width: 150 },
      nome_time: { dataIndex: 'nome_time', key: 'nome_time', title: 'Nome time', width: 200 },
      nome_agente: {
        dataIndex: 'nome_agente',
        key: 'nome_agente',
        title: 'Nome agente',
        width: 200,
      },
      canal: { dataIndex: 'canal', key: 'canal', title: 'Canal', width: 150 },
      etiquetas: {
        dataIndex: 'etiquetas',
        key: 'etiquetas',
        title: 'Etiquetas',
        width: 250,
        render: (value: any) => {
          if (Array.isArray(value)) {
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {value.map((item, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Tag key={index} style={{ margin: 0 }}>
                    {String(item)}
                  </Tag>
                ))}
              </div>
            );
          }
          return value;
        },
      },
      status_conversa: {
        dataIndex: 'status_conversa',
        key: 'status_conversa',
        title: 'Status conversa',
        width: 150,
      },
      url_conversa: {
        dataIndex: 'url_conversa',
        key: 'url_conversa',
        title: 'Url conversa',
        width: 300,
        render: (value: any) => {
          if (typeof value === 'string' && /^https?:\/\//.test(value)) {
            return (
              <a href={value} target='_blank' rel='noopener noreferrer'>
                {value}
              </a>
            );
          }
          return value;
        },
      },
      codigo_agendamento: {
        dataIndex: 'codigo_agendamento',
        key: 'codigo_agendamento',
        title: 'Codigo agendamento',
        width: 150,
      },
      data_agendamento: {
        dataIndex: 'data_agendamento',
        key: 'data_agendamento',
        title: 'Data agendamento',
        width: 200,
      },
      status_agendamento: {
        dataIndex: 'status_agendamento',
        key: 'status_agendamento',
        title: 'Status agendamento',
        width: 150,
      },
      tipo_agendamento: {
        dataIndex: 'tipo_agendamento',
        key: 'tipo_agendamento',
        title: 'Tipo agendamento',
        width: 200,
      },
      quantidade_datas_disponiveis: {
        dataIndex: 'quantidade_datas_disponiveis',
        key: 'quantidade_datas_disponiveis',
        title: 'Quantidade datas disponiveis',
        width: 200,
      },
      escolheu_medico: {
        dataIndex: 'escolheu_medico',
        key: 'escolheu_medico',
        title: 'Escolheu medico',
        width: 150,
        render: (value: any) => (value ? 'Sim' : 'Não'),
      },
      nome_medico: {
        dataIndex: 'nome_medico',
        key: 'nome_medico',
        title: 'Nome medico',
        width: 200,
      },
      primeira_data_disponivel: {
        dataIndex: 'primeira_data_disponivel',
        key: 'primeira_data_disponivel',
        title: 'Primeira data disponivel',
        width: 200,
      },
      categoria_convenio: {
        dataIndex: 'categoria_convenio',
        key: 'categoria_convenio',
        title: 'Categoria convenio',
        width: 200,
      },
      nome_convenio: {
        dataIndex: 'nome_convenio',
        key: 'nome_convenio',
        title: 'Nome convenio',
        width: 200,
      },
      plano_convenio: {
        dataIndex: 'plano_convenio',
        key: 'plano_convenio',
        title: 'Plano convenio',
        width: 200,
      },
      sub_plano_convenio: {
        dataIndex: 'sub_plano_convenio',
        key: 'sub_plano_convenio',
        title: 'Sub plano convenio',
        width: 200,
      },
      data_ultimo_agendamento_paciente: {
        dataIndex: 'data_ultimo_agendamento_paciente',
        key: 'data_ultimo_agendamento_paciente',
        title: 'Data ultimo agendamento paciente',
        width: 250,
      },
      data_proximo_agendamento_paciente: {
        dataIndex: 'data_proximo_agendamento_paciente',
        key: 'data_proximo_agendamento_paciente',
        title: 'Data proximo agendamento paciente',
        width: 250,
      },
      area_profissional: {
        dataIndex: 'area_profissional',
        key: 'area_profissional',
        title: 'Area profissional',
        width: 200,
      },
      localizacao_unidade: {
        dataIndex: 'localizacao_unidade',
        key: 'localizacao_unidade',
        title: 'Localizacao unidade',
        width: 200,
      },
      nome_unidade: {
        dataIndex: 'nome_unidade',
        key: 'nome_unidade',
        title: 'Nome unidade',
        width: 200,
      },
      idade_paciente: {
        dataIndex: 'idade_paciente',
        key: 'idade_paciente',
        title: 'Idade paciente',
        width: 150,
      },
      codigo_paciente: {
        dataIndex: 'codigo_paciente',
        key: 'codigo_paciente',
        title: 'Codigo paciente',
        width: 150,
      },
      periodo_dia: {
        dataIndex: 'periodo_dia',
        key: 'periodo_dia',
        title: 'Periodo dia',
        width: 150,
      },
      nome_procedimento: {
        dataIndex: 'nome_procedimento',
        key: 'nome_procedimento',
        title: 'Nome procedimento',
        width: 200,
      },
      nome_motivo: {
        dataIndex: 'nome_motivo',
        key: 'nome_motivo',
        title: 'Nome motivo',
        width: 200,
      },
      texto_motivo: {
        dataIndex: 'texto_motivo',
        key: 'texto_motivo',
        title: 'Texto motivo',
        width: 300,
      },
      nome_especialidade: {
        dataIndex: 'nome_especialidade',
        key: 'nome_especialidade',
        title: 'Nome especialidade',
        width: 200,
      },
      etapa: { dataIndex: 'etapa', key: 'etapa', title: 'Etapa', width: 150 },
      tipo_servico: {
        dataIndex: 'tipo_servico',
        key: 'tipo_servico',
        title: 'Tipo servico',
        width: 200,
      },
      actions: {
        key: 'actions',
        title: '',
        width: 60,
        fixed: 'right' as const,
        align: 'right' as const,
        render: (_: any, record: any) => {
          const url = record.url_conversa;
          const isValidUrl = url && typeof url === 'string' && /^https?:\/\//.test(url);

          if (!isValidUrl) {
            return (
              <Tooltip title='Link inválido'>
                <Button icon={<MoreOutlined />} disabled />
              </Tooltip>
            );
          }

          const items = [
            {
              key: 'go-to-conversation',
              label: 'Ir para conversa',
              icon: <LinkOutlined />,
              onClick: () => handleGoToConversation(url),
            },
            {
              key: 'copy-link',
              label: 'Copiar link da conversa',
              icon: <CopyOutlined />,
              onClick: () => handleCopyLink(url),
            },
          ];

          return (
            <Dropdown menu={{ items }} trigger={['hover']}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    }),
    []
  );

  const columns = useMemo(() => {
    if (
      !appointmentTableData ||
      !appointmentTableData.data ||
      appointmentTableData.data.length === 0
    ) {
      return [];
    }

    // Pegar as keys do primeiro elemento da resposta
    const firstItem = appointmentTableData.data[0];
    const apiKeys = Object.keys(firstItem);

    // Mapear apenas as colunas que existem na resposta da API
    const apiColumns = apiKeys
      .map((key) => columnsMap[key as keyof typeof columnsMap])
      .filter((column) => column !== undefined);

    return [...apiColumns, columnsMap.actions];
  }, [appointmentTableData, columnsMap]);

  // Exibir apenas 20 itens, mesmo se vierem 21
  const displayedData = useMemo(() => {
    if (!appointmentTableData?.data) return [];
    return appointmentTableData.data.slice(0, pageSize);
  }, [appointmentTableData?.data]);

  // Se vieram 21 itens, há próxima página
  const hasNextPage = useMemo(() => {
    return (appointmentTableData?.data?.length || 0) > pageSize;
  }, [appointmentTableData?.data]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const { startDate, endDate } = queryStringAsObj;
    if (!startDate || !endDate) {
      return;
    }

    fetchAppointmentTableData();
  }, [fetchAppointmentTableData, queryStringAsObj, currentPage]);

  // Reset para página 1 quando os filtros mudarem (exceto page/pageSize)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    queryStringAsObj.startDate,
    queryStringAsObj.endDate,
    queryStringAsObj.channelId,
    queryStringAsObj.agentIds,
    queryStringAsObj.tags,
    queryStringAsObj.teamIds,
    queryStringAsObj.appointmentStatus,
  ]);

  const pageTitle = (
    <Flex align='center' gap={8}>
      <span>Tabela de atendimentos</span>
    </Flex>
  );

  const itemRender = (_page: number, type: string, originalElement: React.ReactNode) => {
    if (type === 'prev') {
      return (
        <Button
          icon={<LeftOutlined style={{ verticalAlign: 'middle' }} />}
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || isFetchingAppointmentTableData}
          style={{ marginRight: 4, display: 'inline-flex', alignItems: 'center' }}
          iconPosition='start'
        >
          Anterior
        </Button>
      );
    }
    if (type === 'next') {
      return (
        <Button
          icon={<RightOutlined style={{ verticalAlign: 'middle' }} />}
          onClick={handleNextPage}
          disabled={!hasNextPage || isFetchingAppointmentTableData}
          style={{ marginLeft: 4, display: 'inline-flex', alignItems: 'center' }}
          iconPosition='end'
        >
          Próximo
        </Button>
      );
    }
    // Ocultar números das páginas e os "..."
    if (type === 'page' || type === 'jump-next' || type === 'jump-prev') {
      return null;
    }
    return originalElement;
  };

  return (
    <PageTemplate title={pageTitle}>
      <Row gutter={[16, 16]} style={{ paddingBottom: 16 }}>
        <Col span={24}>
          <Flex>
            <FiltersContainer
              tableRef={tableRef}
              onRefresh={fetchAppointmentTableData}
              isRefreshing={isFetchingAppointmentTableData}
            />
          </Flex>
        </Col>
        <Col span={24}>
          <Card title='Atendimentos' styles={{ body: { paddingBottom: 0 } }}>
            <EnhancedTable
              ref={tableRef}
              rowKey={(row) => `${row.iid} + ${v4()}`}
              size='small'
              id='dashboard::appointment-table'
              columns={columns}
              dataSource={displayedData}
              loading={isFetchingAppointmentTableData}
              bordered
              pagination={{
                current: currentPage,
                pageSize,
                total: currentPage * pageSize + (hasNextPage ? 1 : 0),
                showSizeChanger: false,
                itemRender,
                showTotal: () => `Página ${currentPage}`,
              }}
              scroll={{
                y: 'calc(100vh - 340px)',
              }}
            />
          </Card>
        </Col>
      </Row>
    </PageTemplate>
  );
};
