import { styled } from 'styled-components';

export const ChartContainer = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 380px;

  .highcharts-credits {
    display: none;
  }
`;
