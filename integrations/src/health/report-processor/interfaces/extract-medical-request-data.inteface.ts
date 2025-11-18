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
