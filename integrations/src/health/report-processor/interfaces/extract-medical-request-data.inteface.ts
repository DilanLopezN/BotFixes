import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

export interface ExtractMedicalRequestDataResponse {
  procedures: any[];
  error: string | null;
  errorMessage: string | null;
}

export interface ExtractMedicalRequestAI {
  result: {
    extractedExam: string;
    confidence: number;
    possibilityName: {
      name: string;
      confidence: number;
    }[];
  }[];
  error: string;
}

export interface ListValidProceduresParams {
  integrationId: string;
  filter?: CorrelationFilter;
}

export interface ExtractMedicalRequestDataParams {
  integrationId: string;
  file: any;
  fileUrl: string;
  filter?: CorrelationFilter;
}
