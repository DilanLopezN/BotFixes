/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/no-this-in-sfc */
import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Col, Popover, Row, Spin } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { BarChartProps } from './interfaces';

export const BarChart = ({ isLoading, remiReports }: BarChartProps) => {
  const data = [
    { y: remiReports?.totalRemiActivation || 0, color: '#1677ff' },
    { y: remiReports?.totalAnsweredOnFirstAttempt || 0, color: '#52c41a' },
    { y: remiReports?.totalAnsweredOnSecondAttempt || 0, color: '#fa8c16' },
    { y: remiReports?.totalFinishedByRemi || 0, color: '#f5222d' },
  ];

  const hasData = data.some((d) => d.y > 0);

  const options: Highcharts.Options = {
    chart: { type: 'bar', height: 500 },
    title: { text: '' },
    xAxis: {
      categories: [
        'Ativações de um REMI',
        'Conversões na primeira mensagem',
        'Conversões na segunda mensagem',
        'Finalizados por REMI',
      ],
      title: { text: null },
      visible: true,
      labels: {
        enabled: true,
      },
    },
    yAxis: {
      min: 0,
      title: { text: 'Unidades' },
      visible: false,
    },
    plotOptions: {
      bar: {
        dataLabels: { enabled: true },
        borderRadius: 6,
      },
    },
    series: [
      {
        type: 'bar',
        name: '',
        data: hasData ? data : [],
      },
    ],
    legend: {
      enabled: false,
    },
    credits: { enabled: false },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    tooltip: {
      enabled: false,
    },
    lang: {
      noData: 'Não há dados',
    },
  };

  const popoverContent = (
    <div style={{ maxWidth: 300 }}>
      <p>
        <strong>Ativações de um REMI:</strong> Vezes que um REMI assumiu um atendimento (podendo ser
        várias em um mesmo atendimento).
      </p>
      <p>
        <strong>Conversões na Primeira Mensagem:</strong> Vezes que um atendimento foi reengajado
        após a primeira mensagem
      </p>
      <p>
        <strong>Conversões na Segunda Mensagem:</strong> Vezes que um atendimento foi reengajado
        após a segunda mensagem
      </p>
      <p>
        <strong>Finalizados por REMI:</strong> Atendimentos finalizados por um REMI
      </p>
    </div>
  );

  return (
    <Spin spinning={isLoading}>
      <Card>
        <Row justify='center' style={{ marginBottom: 16 }}>
          <Col>
            <b style={{ margin: 0, fontSize: '1.3em' }}>Métricas</b>
            <Popover content={popoverContent} trigger='hover'>
              <InfoCircleOutlined
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  fontSize: 16,
                  marginLeft: 8,
                }}
              />
            </Popover>
          </Col>
        </Row>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </Card>
    </Spin>
  );
};
