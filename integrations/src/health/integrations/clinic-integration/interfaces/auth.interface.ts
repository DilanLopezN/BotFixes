interface ClinicAuthResponse {
  access_token: string;
  expires_in: number;
  scope: 'integration';
  token_type: 'Bearer';
}

export { ClinicAuthResponse };
