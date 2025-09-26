import { Row } from 'antd';
import styled from 'styled-components';

export const ChartContainer = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;

  .highcharts-credits {
    display: none;
  }
`;

export const ChartTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #828282;
`;

export const ChartCount = styled.span`
  font-family: Roboto;
  font-size: 28px;
  font-weight: 500;
  line-height: 47px;
  color: #0b1354;
`;

export const ChartActionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: flex-end;
`;

export const EmptyChartContainer = styled(Row)`
  padding: 44px 32px 0 32px;
`;

export const EmptyChartText = styled.span`
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  color: #6c6e79;
`;

export const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-left: 32px;
  justify-content: flex-start;
  align-items: flex-start;
`;

export const LegentContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
`;

export const LegendColor = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 50%;
  background-color: ${(props) => props.color || 'black'};
`;

export const LegendText = styled.span`
  color: rgb(51, 51, 51);
  font-size: 12.8px;
  text-decoration: none;
  fill: rgb(51, 51, 51);
`;
