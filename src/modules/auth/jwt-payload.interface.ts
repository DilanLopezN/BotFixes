export interface JwtPayload {
  email: string;
  name: string;
  userId: string;
  given_name?: string;
  sub?: string;
  middle_name?: string;
  picture?: string;
}
