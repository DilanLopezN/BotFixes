import { FlowSteps } from '../../flow/interfaces/flow.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityVersionType } from '../../interfaces/entity.interface';

export interface ListReasons {
  version: EntityVersionType;
  targetEntity: FlowSteps;
  filter: CorrelationFilter;
}
