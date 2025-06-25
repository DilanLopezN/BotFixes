import { StatusService } from './status.service';
import { Controller, Get } from '@nestjs/common';

@Controller('private/health')
export class InternalStatusController {
  constructor(
    private statusService: StatusService,
  ) { }

  @Get()
  async status() {
    return await this.statusService.status();
  }
}
