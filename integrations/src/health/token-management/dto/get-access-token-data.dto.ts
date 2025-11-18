import { IsJWT, IsString } from 'class-validator';

export class GetAccesTokenDataDto {
  @IsString()
  @IsJWT()
  token: string;
}
