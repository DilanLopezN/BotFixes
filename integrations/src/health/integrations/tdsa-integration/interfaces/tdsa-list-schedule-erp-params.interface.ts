import { DefaultListConfirmationErpParams } from '../../../integrator/interfaces';

export interface TdsaListSchedulesErpParams extends DefaultListConfirmationErpParams {
  saveTelemedicineLink?: boolean;
  filterTelemedicine?: boolean;
  checkRangePeriodByHour?: boolean;
  filterStatus?: number[];
  omitProcedureCodeList?: string[];
  useSocialName?: boolean;
}
