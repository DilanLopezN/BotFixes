export interface UserTeam {
  _id: string;
  name: string;
  inactivatedAt?: string;
  inactivedAt?: string;
}

export interface GetUserTeamsByIdResponse {
  data: UserTeam[];
}
