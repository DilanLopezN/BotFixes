import { IntegrationPatientNameCase } from '../../health/integration/interfaces/integration.interface';
import { IntegrationDocument } from '../../health/integration/schema/integration.schema';
import { capitalizeText } from './capitalize-text';

export const patientNameCaseFormat = (integration: IntegrationDocument, patientName: string): string => {
  if (integration?.rules?.patientNameCase) {
    switch (integration.rules?.patientNameCase) {
      case IntegrationPatientNameCase.CAPITALIZE:
        return capitalizeText(patientName);

      case IntegrationPatientNameCase.UPPER:
        return patientName.toUpperCase();

      case IntegrationPatientNameCase.LOWER:
        return patientName.toLowerCase();

      default:
        return patientName;
    }
  }
  return patientName;
};
