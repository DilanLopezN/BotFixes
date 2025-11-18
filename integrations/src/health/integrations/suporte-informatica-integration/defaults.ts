const PUBLIC_TOKEN_CACHE_EXPIRATION = 7_100; // 2 horas de expiração
const PATIENT_TOKEN_EXPIRATION = 3_300; // 1 hora

// usuário que sera criado em cada cliente para efetuar requests que precisam de
// um token de paciente
const DEFAULT_USER_TO_AUTH = {
  bornDate: '2000-01-01',
  cpf: '62992898058',
  name: 'BOTDESIGNER TECNOLOGIA',
  phone: '48998989898',
  email: 'botdesigner@botdesigner.com',
  sex: 'M',
};

export { PUBLIC_TOKEN_CACHE_EXPIRATION, PATIENT_TOKEN_EXPIRATION, DEFAULT_USER_TO_AUTH };
