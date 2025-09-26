export interface SimplifiedTeam {
  _id: string;
  name: string;
  users: {
    _id: string;
    name: string;
    avatar: string;
  }[];
  inactivedAt?: string;
  usersCount: number;
}
