export const emailIsValid = (email: string): boolean => {
  const padraoEmail: RegExp = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  return padraoEmail.test(email);
};
