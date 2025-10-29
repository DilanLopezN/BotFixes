export interface NavigationProps {
  id: string;
  title: string;
  path: string;
  icon: (props: Record<string, unknown>) => JSX.Element;
  hasPermission?: () => boolean;
}

export interface OptionsMap {
  dashboard: NavigationProps;
  entities: NavigationProps;
  'live-agent': NavigationProps;
  integrations: NavigationProps;
  settings: NavigationProps;
  customers: NavigationProps;
  campaigns: NavigationProps;
  trainerBot: NavigationProps;
}
