import { DefaultListConfirmationErpParams } from '../../../integrator/interfaces';

interface ConfirmationErpParams extends DefaultListConfirmationErpParams {
  idMotivoSituacao?: number;
  listConfirmed?: boolean;
}

export { ConfirmationErpParams };
