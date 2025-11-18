import { Appointment } from 'kissbot-entities';

interface ListPreviousInsurances {
  integrationId: string;
  patientCode?: string;
  patientCpf?: string;
  patientBornDate?: string;
  patientPhone?: string;
  insuranceCodesToIgnore?: string[];
}

type PreviousInsurances = Pick<
  Appointment,
  'appointmentCode' | 'insuranceCode' | 'insuranceCategoryCode' | 'insurancePlanCode' | 'insuranceSubPlanCode'
>;

export { ListPreviousInsurances, PreviousInsurances };
