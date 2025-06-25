export interface IMailProvider {
  sendMail(to, from, subject, body): void;
}
