import { DefaultListConfirmationErpParams } from '../../../integrator/interfaces';

interface ConfirmationErpParams extends DefaultListConfirmationErpParams {
  idMotivoSituacao?: number;
  listConfirmed?: boolean;
  idMotivoSituacaoList?: number[];
  omitModalityIds?: number[];
  includeModalityIds?: number[];
}

export { ConfirmationErpParams };
