import { ApiProperty } from '@nestjs/swagger';

class OkResponse {
  @ApiProperty()
  ok: boolean;

  @ApiProperty()
  message?: string;
}

export { OkResponse };
