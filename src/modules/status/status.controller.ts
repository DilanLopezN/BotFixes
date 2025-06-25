import { StatusService } from './status.service';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class StatusController {
  constructor(
    private statusService: StatusService,
  ) { }

  @Get()
  async status() {
    return await this.statusService.status();
  }

  @Get('getKafkaList')
  async statusKafka() {
    return await this.statusService.getKafkaList();
  }
}
