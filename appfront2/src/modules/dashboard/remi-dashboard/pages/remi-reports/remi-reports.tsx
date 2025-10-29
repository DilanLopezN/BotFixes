import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Tooltip } from 'antd';
import { useEffect } from 'react';
import { PageTemplate } from '~/components/page-template';
import { BarChart } from '../../components/bar-chart';
import { FiltersContainer } from '../../components/filters-container';
import { MetricCard } from '../../components/metric-card';
import { useRemiReports } from '../../hooks/use-remi-reports';

export const RemiReports = () => {
  const { remiReports, isLoadingRemiReports, fetchRemiReports } = useRemiReports();

  useEffect(() => {
    fetchRemiReports();
  }, [fetchRemiReports]);

  const pageTitle = (
    <Flex align='center' gap={8}>
      <span>Atendimentos otimizados pelo REMI</span>
      <Tooltip title='Os valores do gráfico representam o número de ativações da função REMI dentro de um atendimento. Um mesmo atendimento pode conter múltiplas ativações de REMI, impactando o total registrado no gráfico.'>
        <InfoCircleOutlined style={{ color: '#1677ff' }} />
      </Tooltip>
    </Flex>
  );

  return (
    <PageTemplate title={pageTitle}>
      <Row gutter={[16, 16]} style={{ paddingBottom: 16 }}>
        <Col span={24}>
          <Flex justify='flex-end'>
            <FiltersContainer onRefresh={fetchRemiReports} isRefreshing={isLoadingRemiReports} />
          </Flex>
        </Col>
        <Col span={12}>
          <MetricCard
            title='Total de atendimentos'
            description={`${remiReports?.totalRemiConversations || 0}`}
            isLoading={isLoadingRemiReports}
            tooltip='Quantidade de atendimentos que tiveram um REMI'
          />
        </Col>
        <Col span={12}>
          <MetricCard
            title='Atendimentos reengajados'
            description={`${remiReports?.totalRengagedConversation || 0}`}
            isLoading={isLoadingRemiReports}
            tooltip='Quantidade total de atendimentos que voltaram para o agente após terem passado pelo reengajamento inteligente e foram finalizados por um agente'
          />
        </Col>
        <Col span={24}>
          <BarChart isLoading={isLoadingRemiReports} remiReports={remiReports} />
        </Col>
      </Row>
    </PageTemplate>
  );
};
