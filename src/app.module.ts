// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from '../common/filters/httpException.filter';
import { LoggingInterceptor } from './log/interceptors/logging.interceptor';
import { SignupModule } from './signup/signup.module';
import { AuthModule } from './auth/auth.module';
import { ForgotPasswordModule } from './forgot-password/forgot-password.module';
import { UserModule } from './user/user.module';
import { MailerModule } from './mailer/mailer.module';
import { LogModule } from './log/log.module';
import { ClasseCourrierModule } from './classe-courrier/classe-courrier.module';
import { TypeCourrierModule } from './type-courrier/type-courrier.module';
import { CorrespondantModule } from './correspondant/correspondant.module';
import { CategoriesModule } from './categories/categories.module';
import { PermissionModule } from './permission/permission.module';
import { RoleModule } from './role/role.module';
import { ServiceModule } from './service/service.module';
import { SalleModule } from './salle/salle.module';
import { CoffreModule } from './coffre/coffre.module';
import { ArchiveModule } from './archive/archive.module';
import { BordereauTransmissionModule } from './bordereau-transmission/bordereau-transmission.module';
import { CourrierModule } from './courrier/courrier.module';
import { TraitementModule } from './traitement/traitement.module';
import { PieceJointeModule } from './piece-jointe/piece-jointe.module';
import { CourrierInterneModule } from './courrier-interne/courrier-interne.module';
import { NotificationModule } from './notification/notification.module';
import { CourrierDepartModule } from './courrier-depart/courrier-depart.module';
import { StatistiqueModule } from './statistique/statistique.module';
import { ProjetModule } from './projets/projet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    MailerModule,
    SignupModule,
    AuthModule,
    ForgotPasswordModule,
    UserModule,
    LogModule,
    ClasseCourrierModule,
    TypeCourrierModule,
    CorrespondantModule,
    CategoriesModule,
    PermissionModule,
    RoleModule,
    ServiceModule,
    SalleModule,
    CoffreModule,
    ArchiveModule,
    BordereauTransmissionModule,
    CourrierModule,
    TraitementModule,
    PieceJointeModule,
    CourrierModule,
    CourrierInterneModule,
    NotificationModule,
    CourrierDepartModule,
    StatistiqueModule,
    ProjetModule,
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
