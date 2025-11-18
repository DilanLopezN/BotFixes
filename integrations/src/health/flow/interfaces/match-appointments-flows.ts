import { Types } from 'mongoose';
import { Appointment } from '../../interfaces/appointment.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { FlowSteps } from './flow.interface';
import { MatchFlowsFilters } from './match-flow-filters';

export interface MatchAppoinemtntsFlow {
  integrationId: Types.ObjectId;
  entitiesFilter: CorrelationFilter;
  appointments: Appointment[];
  targetEntity: FlowSteps.listAppointments | FlowSteps.doAppointment;
  filters: MatchFlowsFilters;
}
