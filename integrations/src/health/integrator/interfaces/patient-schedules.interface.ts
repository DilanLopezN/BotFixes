import { FlowSteps } from '../../flow/interfaces/flow.interface';

interface PatientSchedules {
  startDate?: number;
  endDate?: number;
  target?: PatientSchedulesTarget;
  patientCode: string;
  patientName?: string;
  patientCpf?: string;
  patientPhone?: string;
  patientBornDate?: string;
  returnGuidance?: boolean;
  ignoreFlowExecution?: boolean;
  specialityCode?: string;
  organizationUnitLocationCode?: string;
}

type PatientSchedulesTarget =
  | FlowSteps.cancel
  | FlowSteps.reschedule
  | FlowSteps.confirmPassive
  | FlowSteps.listPatientSchedules;

export { PatientSchedules, PatientSchedulesTarget };
