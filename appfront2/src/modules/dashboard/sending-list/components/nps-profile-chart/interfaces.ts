export interface PieChartProps {
  npsProfile?: {
    promoterCount: number;
    passiveCount: number;
    detractorCount: number;
  };
  isLoading?: boolean;
  height?: number;
}
