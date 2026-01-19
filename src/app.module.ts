// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from '../common/filters/httpException.filter';
import { LoggingInterceptor } from './log/interceptors/logging.interceptor';
import { SignupModule } from './signup/signup.module';
import { AuthModule } from './auth/auth.module';
import { ForgotPasswordModule } from './forgot-password/forgot-password.module';
import { UserModule } from './user/user.module';
import { OperateurModule } from './operateur/operateur.module';
import { TypeAppelModule } from './type-appel/type-appel.module';
import { OptionModule } from './option/option.module';
import { ConsommationMoyenneModule } from './consommation-moyenne/consommation-moyenne.module';
import { OffreModule } from './offre/offre.module';
import { TarifInterconnexionModule } from './tarif-interconnexion/tarif-interconnexion.module';
import { ServicesModule } from './services-management/services.module';
import { StructureTarifaireModule } from './structure-tarifaire/structure-tarifaire.module';
import { AvantageModule } from './avantage/avantage.module';
import { TypeOperateurModule } from './type-operateur/type-operateur.module';
import { MailerModule } from './mailer/mailer.module';
import { TraficModule } from './trafic/trafic.module';
import { AbonnementModule } from './abonnement/abonnement.module';
import { ChiffreAffaireModule } from './chiffre-affaire/chiffre-affaire.module';
import { IhhModule } from './ihh/ihh.module';
import { CaracteristiqueModule } from './caracteristique/caracteristique.module';
import { ParametreModule } from './parametre/parametre.module';
import { LogModule } from './log/log.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EffetClubModule } from './effet-club/effet-club.module';
import { CiseauTarifaireModule } from './ciseau-tarifaire/ciseau-tarifaire.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailerModule,
    SignupModule,
    AuthModule,
    ForgotPasswordModule,
    UserModule,
    OperateurModule,
    TypeAppelModule,
    OptionModule,
    ConsommationMoyenneModule,
    OffreModule,
    TarifInterconnexionModule,
    ServicesModule,
    StructureTarifaireModule,
    AvantageModule,
    TypeOperateurModule,
    TraficModule,
    AbonnementModule,
    ChiffreAffaireModule,
    IhhModule,
    CaracteristiqueModule,
    ParametreModule,
    LogModule,
    DashboardModule,
    EffetClubModule,
    CiseauTarifaireModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Applique globalement le filtre d'exception
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // 🚀 Active le logging automatique global
    },
  ],
})
export class AppModule {}
