import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('health')
export class StatusController {
  constructor() {}

  @Get()
  @HttpCode(200)
  async status() {
    return 'ok';
  }
}
