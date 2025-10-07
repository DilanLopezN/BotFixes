export interface MetricCardProps {
  title: string;
  description: string;
  isLoading?: boolean;
  icon: 'clock' | 'linechart';
  tooltip?: string;
}
