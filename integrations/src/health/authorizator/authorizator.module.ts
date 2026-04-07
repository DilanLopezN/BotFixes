import { Module } from '@nestjs/common';
import { AuthorizatorController } from './controllers/authorizator.controller';
import { AuthorizatorService } from './services/authorizator.service';
import { IntegratorModule } from '../integrator/integrator.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [IntegratorModule, AuditModule],
  controllers: [AuthorizatorController],
  providers: [AuthorizatorService],
  exports: [AuthorizatorService],
})
export class AuthorizatorModule {}
