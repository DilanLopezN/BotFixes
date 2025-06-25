import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly password: string;

  readonly token?: string;
}
