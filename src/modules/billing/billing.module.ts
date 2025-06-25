import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './services/account.service';
import { Account } from './models/account.entity';
import { Payment } from './models/payment.entity';
import { PaymentItem } from './models/payment-item.entity';
import { BillingController } from './controllers/billing.controller';
import { PaymentGetDataService } from './services/payment-get-data.service';
import { PaymentService } from './services/payment.service';
import { AsaasService } from './services/asaas.service';
import { BillingCallbackController } from './controllers/billing-callback.controller';
import { WorkspaceService } from './services/workspace.service';
import { Workspace } from './models/workspace.entity';
import { PaymentCallbackService } from './services/payment-callback.service';
import { ResumeService } from './services/resume.service';
import { ResumeInternalontroller } from './controllers/resume-internal.controller';
import { PaymentItemService } from './services/payment-item.service';
import { BILLING_CONNECTION } from './ormconfig';
import { ConfigModule } from './../../config/config.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { UsersModule } from '../users/users.module';
import { CustomerBillingController } from './controllers/customer-billing.controller';
import { WorkspaceChannelResume } from './models/worksapce-channel-resume.entity';
import { WorkspaceChannelResumeService } from './services/workspace-channel-resume.service';
import { WorkspaceChannelSpecification } from './models/workspace-channel-specification.entity';
import { WorkspaceChannelSpecificationService } from './services/workspace-channel-specification.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { BillingHealthCheckService } from './services/billing-health-check.service';
import { EventsModule } from '../events/events.module';
import { PaymentSpecificationService } from './services/payment-item-specification.service';
import { GetPaymentItemService } from './services/payment-item-specification-services/get-payment-item.service';
import { ChannelConfigDiscountService } from './services/payment-item-specification-services/channelConfig-discount.service';

@Module({
    imports: [
        ConfigModule,
        EventsModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: BILLING_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'billing',
        }),
        TypeOrmModule.forFeature(
            [Workspace, Account, Payment, PaymentItem, WorkspaceChannelResume, WorkspaceChannelSpecification],
            BILLING_CONNECTION,
        ),
        forwardRef(() => UsersModule),
    ],
    providers: [
        AccountService,
        AsaasService,
        PaymentGetDataService,
        PaymentService,
        WorkspaceService,
        PaymentCallbackService,
        ResumeService,
        PaymentItemService,
        WorkspaceChannelResumeService,
        WorkspaceChannelSpecificationService,
        BillingHealthCheckService,
        PaymentSpecificationService,
        GetPaymentItemService,
        ChannelConfigDiscountService,
    ],
    exports: [WorkspaceService],
    controllers: [BillingController, BillingCallbackController, ResumeInternalontroller, CustomerBillingController],
})
export class BillingModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                BillingController,
                BillingCallbackController,
                ResumeInternalontroller,
                CustomerBillingController,
            );
    }
}
