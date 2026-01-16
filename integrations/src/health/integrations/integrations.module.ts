import { Module } from '@nestjs/common';
import { ClinuxModule } from './clinux-integration/clinux.module';
import { CmModule } from './cm-integration/cm.module';
import { CustomImportModule } from './custom-import-integration/custom-import.module';
import { DoctoraliaModule } from './doctoralia-integration/doctoralia.module';
import { FeegowModule } from './feegow-integration/feegow.module';
import { ManagerModule } from './manager-integration/manager.module';
import { NetpacsModule } from './netpacs-integration/netpacs.module';
import { SaoMarcosModule } from './sao-marcos-integration/sao-marcos.module';
import { SuporteInformaticaModule } from './suporte-informatica-integration/suporte-informatica.module';
import { TdsaModule } from './tdsa-integration/tdsa.module';
import { BotdesignerModule } from './botdesigner-integration/botdesigner.module';
import { DrMobileModule } from './dr-mobile-integration/dr-mobile.module';
import { ClinicModule } from './clinic-integration/clinic.module';
import { MatrixModule } from './matrix-integration/matrix.module';
import { AmigoModule } from './amigo-integration/amigo.module';
import { KayserModule } from './kayser-integration/kayser.module';
import { BotdesignerFakeModule } from './botdesigner-fake-integration/botdesigner-fake.module';

import { ProdoctorModule } from './prodoctor-integration/prodoctor.module';
import { KonsistModule } from './konsist-integration/konsist.module';

@Module({
  imports: [
    ClinuxModule,
    CmModule,
    CustomImportModule,
    DoctoraliaModule,
    FeegowModule,
    ManagerModule,
    NetpacsModule,
    SaoMarcosModule,
    TdsaModule,
    SuporteInformaticaModule,
    BotdesignerModule,
    DrMobileModule,
    ClinicModule,
    MatrixModule,
    AmigoModule,
    KayserModule,
    BotdesignerFakeModule,
    ProdoctorModule,
    KonsistModule,
  ],
})
export class IntegrationsModule {}
