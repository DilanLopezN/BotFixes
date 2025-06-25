import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class PromMetricsController {
    @Get()
    getMetrics() {
        return register.metrics();
    }
}
