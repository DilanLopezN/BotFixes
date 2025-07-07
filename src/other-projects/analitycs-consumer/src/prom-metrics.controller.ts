import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { collectDefaultMetrics, register } from 'prom-client';

@Controller('metrics')
export class PromMetricsController {
  @Get()
  getMetrics() {
    return register.metrics()
  }
}
