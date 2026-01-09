export interface KonsistTelefone {
  ddi?: string;
  ddd?: string;
  numero?: string;
}

export interface KonsistContato {
  descricao?: string;
  conteudo?: string;
}

export interface KonsistErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}
