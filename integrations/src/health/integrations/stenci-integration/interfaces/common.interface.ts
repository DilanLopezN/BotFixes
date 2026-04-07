export interface StenciIdentity {
  type: 'cpf' | 'cnpj' | 'rg' | 'passport';
  value: string;
}

export interface StenciAddress {
  addressLine1?: string;
  addressLine2?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface StenciPaginationParams {
  limit?: number;
  offset?: number;
}

export interface StenciPaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
}

export interface StenciErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}
