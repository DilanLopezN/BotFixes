import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappSessionControlService } from './services/whatsapp-session-control.service';
import { WhatsappSessionSchema } from './schemas/whatsapp-session.schema';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'WhatsappSession', schema: WhatsappSessionSchema },
          ]),
    ],
    providers: [
        WhatsappSessionControlService,
    ],
    exports: [
        WhatsappSessionControlService,
    ],
})
export class WhatsappSessionControlModule {}