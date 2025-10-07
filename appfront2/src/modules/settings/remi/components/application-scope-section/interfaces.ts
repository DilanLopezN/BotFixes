import { FormInstance } from 'antd';
import { RemiFormDataForm } from '../../pages/remi-list/interfaces';

export interface ApplicationScopeSectionProps {
  form: FormInstance<RemiFormDataForm>;
  isLoading: boolean;
  isLoadingChannelConfigList: boolean;
  teamOptions: { value: string | undefined; label: string }[] | undefined;
}
