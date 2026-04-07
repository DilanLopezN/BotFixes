export interface KonsistPhone {
  ddi?: string;
  ddd?: string;
  numero?: string;
}

export interface KonsistContact {
  descricao?: string;
  conteudo?: string;
}

export interface KonsistErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}
