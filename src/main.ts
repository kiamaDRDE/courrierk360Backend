// src/main.ts

import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { SignupModule } from './signup/signup.module';
import { AuthModule } from './auth/auth.module';
import { ForgotPasswordModule } from './forgot-password/forgot-password.module';
import { UserModule } from './user/user.module';
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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Activer le parsing des cookies
  app.use(cookieParser());

  // Activer CORS pour le développement local
  app.enableCors();

  // Servir les fichiers statiques depuis le dossier public
  app.useStaticAssets(join(__dirname, '..', '..', 'public')); // dev

  // Configuration Swagger pour l'API complète
  const mainConfig = new DocumentBuilder()
    .setTitle('API Complète - Courrier KIAMA 360')
    .setDescription(
      'API permettant de gérer tous les modules du système Courrier KIAMA.',
    )
    .setVersion('1.0.0')
    .addTag('Signup', 'Gestion de la création des utilisateurs')
    .addTag('Auth', 'Authentification et gestion des tokens')
    .addTag('Forgot Password', 'Réinitialisation de mot de passe oublié')
    .addTag('User', 'Gestion du profil et des activités utilisateur')
    .addTag('Logs', 'Gestion des logs et audit système')
    .addTag('Classes de Courrier', 'Gestion des classes de courrier')
    .addTag('Types de Courrier', 'Gestion des types de courrier')
    .addTag('Correspondants', 'Gestion des correspondants et leurs catégories')
    .addTag('Catégories', 'Gestion des catégories de correspondants')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'bearer', // Nom de la sécurité
    )
    .addServer('/')
    .build();

  // Créer le document Swagger principal
  const mainDocument = SwaggerModule.createDocument(app, mainConfig);

  // Configuration Swagger pour le module Signup uniquement
  const signupConfig = new DocumentBuilder()
    .setTitle('API Signup - Création Utilisateurs')
    .setDescription(
      'API dédiée à la création des utilisateurs dans le système.',
    )
    .setVersion('1.0.0')
    .addTag('Signup', 'Création et gestion des utilisateurs')
    .addServer('/')
    .build();

  // Créer le document Swagger pour Signup
  const signupDocument = SwaggerModule.createDocument(app, signupConfig, {
    include: [SignupModule],
  });

  // Configuration Swagger pour le module Auth
  const authConfig = new DocumentBuilder()
    .setTitle('API Auth - Authentification')
    .setDescription('API dédiée à l\'authentification et gestion des tokens.')
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentification et gestion des tokens')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const authDocument = SwaggerModule.createDocument(app, authConfig, {
    include: [AuthModule],
  });

  // Configuration Swagger pour le module Forgot Password
  const forgotPasswordConfig = new DocumentBuilder()
    .setTitle('API Forgot Password - Réinitialisation')
    .setDescription('API dédiée à la réinitialisation de mot de passe.')
    .setVersion('1.0.0')
    .addTag('Forgot Password', 'Réinitialisation de mot de passe')
    .addServer('/')
    .build();

  const forgotPasswordDocument = SwaggerModule.createDocument(app, forgotPasswordConfig, {
    include: [ForgotPasswordModule],
  });

  // Configuration Swagger pour le module User
  const userConfig = new DocumentBuilder()
    .setTitle('API User - Gestion Profil')
    .setDescription('API dédiée à la gestion du profil utilisateur.')
    .setVersion('1.0.0')
    .addTag('User', 'Gestion du profil et des activités')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const userDocument = SwaggerModule.createDocument(app, userConfig, {
    include: [UserModule],
  });

  // Configuration Swagger pour le module Logs
  const logConfig = new DocumentBuilder()
    .setTitle('API Logs - Gestion des Logs et Audit')
    .setDescription('API dédiée à la gestion des logs système et audit des activités.')
    .setVersion('1.0.0')
    .addTag('Logs', 'Gestion des logs et audit système')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const logDocument = SwaggerModule.createDocument(app, logConfig, {
    include: [LogModule],
  });

  // Configuration Swagger pour le module ClasseCourrier
  const classeCourrierConfig = new DocumentBuilder()
    .setTitle('API ClasseCourrier - Gestion des Classes de Courrier')
    .setDescription('API dédiée à la gestion des classes de courrier.')
    .setVersion('1.0.0')
    .addTag('Classes de Courrier', 'Gestion des classes de courrier')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const classeCourrierDocument = SwaggerModule.createDocument(app, classeCourrierConfig, {
    include: [ClasseCourrierModule],
  });

  // Configuration Swagger pour le module TypeCourrier
  const typeCourrierConfig = new DocumentBuilder()
    .setTitle('API TypeCourrier - Gestion des Types de Courrier')
    .setDescription('API dédiée à la gestion des types de courrier avec suppression logique et définitive.')
    .setVersion('1.0.0')
    .addTag('Types de Courrier', 'Gestion des types de courrier')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const typeCourrierDocument = SwaggerModule.createDocument(app, typeCourrierConfig, {
    include: [TypeCourrierModule],
  });

  // Configuration Swagger pour le module Correspondant
  const correspondantConfig = new DocumentBuilder()
    .setTitle('API Correspondant - Gestion des Correspondants')
    .setDescription('API dédiée à la gestion des correspondants avec leurs catégories.')
    .setVersion('1.0.0')
    .addTag('Correspondants', 'Gestion des correspondants et leurs catégories')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const correspondantDocument = SwaggerModule.createDocument(app, correspondantConfig, {
    include: [CorrespondantModule],
  });

  // Configuration Swagger pour le module Categories
  const categoriesConfig = new DocumentBuilder()
    .setTitle('API Catégories - Gestion des Catégories')
    .setDescription('API dédiée à la gestion des catégories de correspondants.')
    .setVersion('1.0.0')
    .addTag('Catégories', 'Gestion des catégories de correspondants')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const categoriesDocument = SwaggerModule.createDocument(app, categoriesConfig, {
    include: [CategoriesModule],
  });

  // Configuration Swagger pour le module Permission
  const permissionConfig = new DocumentBuilder()
    .setTitle('API Permission - Gestion des Permissions')
    .setDescription('API dédiée à la gestion des permissions du système.')
    .setVersion('1.0.0')
    .addTag('Permissions', 'Gestion des permissions système')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const permissionDocument = SwaggerModule.createDocument(app, permissionConfig, {
    include: [PermissionModule],
  });

  // Configuration Swagger pour le module Role
  const roleConfig = new DocumentBuilder()
    .setTitle('API Role - Gestion des Rôles')
    .setDescription('API dédiée à la gestion des rôles et leurs permissions.')
    .setVersion('1.0.0')
    .addTag('Roles', 'Gestion des rôles et attribution de permissions')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const roleDocument = SwaggerModule.createDocument(app, roleConfig, {
    include: [RoleModule],
  });

  // Configuration Swagger pour le module Service
  const serviceConfig = new DocumentBuilder()
    .setTitle('API Service - Gestion des Services')
    .setDescription('API dédiée à la gestion des services.')
    .setVersion('1.0.0')
    .addTag('Service', 'Gestion des services')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const serviceDocument = SwaggerModule.createDocument(app, serviceConfig, {
    include: [ServiceModule],
  });

  // Configuration Swagger pour le module Salle
  const salleConfig = new DocumentBuilder()
    .setTitle('API Salle - Gestion des Salles')
    .setDescription('API dédiée à la gestion des salles.')
    .setVersion('1.0.0')
    .addTag('Salle', 'Gestion des salles')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const salleDocument = SwaggerModule.createDocument(app, salleConfig, {
    include: [SalleModule],
  });

  // Configuration Swagger pour le module Coffre
  const coffreConfig = new DocumentBuilder()
    .setTitle('API Coffre - Gestion des Coffres')
    .setDescription('API dédiée à la gestion des coffres.')
    .setVersion('1.0.0')
    .addTag('Coffre', 'Gestion des coffres')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const coffreDocument = SwaggerModule.createDocument(app, coffreConfig, {
    include: [CoffreModule],
  });

  // Configuration Swagger pour le module Archive
  const archiveConfig = new DocumentBuilder()
    .setTitle('API Archive - Gestion des Archives')
    .setDescription('API dédiée à la gestion des archives.')
    .setVersion('1.0.0')
    .addTag('Archive', 'Gestion des archives')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const archiveDocument = SwaggerModule.createDocument(app, archiveConfig, {
    include: [ArchiveModule],
  });

  // Configuration Swagger pour le module Bordereau Transmission
  const bordereauConfig = new DocumentBuilder()
    .setTitle('API Bordereau Transmission')
    .setDescription('API dédiée à la gestion des bordereaux de transmission.')
    .setVersion('1.0.0')
    .addTag('Bordereau Transmission', 'Gestion des bordereaux')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const bordereauDocument = SwaggerModule.createDocument(app, bordereauConfig, {
    include: [BordereauTransmissionModule],
  });

  // Configuration Swagger pour le module Courrier Arrivée
  const courrierConfig = new DocumentBuilder()
    .setTitle('API Courrier Arrivée')
    .setDescription('API dédiée à la gestion des courriers arrivés.')
    .setVersion('1.0.0')
    .addTag('Courrier Arrivée', 'Gestion des courriers arrivés')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const courrierDocument = SwaggerModule.createDocument(app, courrierConfig, {
    include: [CourrierModule],
  });

  // Configuration Swagger pour le module Traitement
  const traitementConfig = new DocumentBuilder()
    .setTitle('API Traitement')
    .setDescription('API dédiée au traitement des courriers et transmissions.')
    .setVersion('1.0.0')
    .addTag('Traitement', 'Gestion des traitements')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const traitementDocument = SwaggerModule.createDocument(app, traitementConfig, {
    include: [TraitementModule],
  });

  // Configuration Swagger pour le module Pièce Jointe
  const pieceJointeConfig = new DocumentBuilder()
    .setTitle('API Pièce Jointe')
    .setDescription('API dédiée à la gestion des pièces jointes.')
    .setVersion('1.0.0')
    .addTag('PieceJointe', 'Gestion des pièces jointes')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const pieceJointeDocument = SwaggerModule.createDocument(app, pieceJointeConfig, {
    include: [PieceJointeModule],
  });

  // Configuration Swagger pour le module Courrier Interne
  const courrierInterneConfig = new DocumentBuilder()
    .setTitle('API Courrier Interne')
    .setDescription('API dédiée aux courriers internes (réponses).')
    .setVersion('1.0.0')
    .addTag('Courrier Interne', 'Gestion des courriers internes')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const courrierInterneDocument = SwaggerModule.createDocument(app, courrierInterneConfig, {
    include: [CourrierInterneModule],
  });

  // Configuration Swagger pour le module Notification
  const notificationConfig = new DocumentBuilder()
    .setTitle('API Notification')
    .setDescription('API dédiée à la gestion des notifications.')
    .setVersion('1.0.0')
    .addTag('Notification', 'Gestion des notifications')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const notificationDocument = SwaggerModule.createDocument(app, notificationConfig, {
    include: [NotificationModule],
  });

  // Configuration Swagger pour le module Courrier Départ
  const courrierDepartConfig = new DocumentBuilder()
    .setTitle('API Courrier Départ')
    .setDescription('API dédiée à la gestion des courriers départ.')
    .setVersion('1.0.0')
    .addTag('Courrier Départ', 'Gestion des courriers départ')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const courrierDepartDocument = SwaggerModule.createDocument(app, courrierDepartConfig, {
    include: [CourrierDepartModule],
  });

  // Configuration Swagger pour le module Statistique
  const statistiqueConfig = new DocumentBuilder()
    .setTitle('API Statistique')
    .setDescription('API dédiée aux statistiques globales.')
    .setVersion('1.0.0')
    .addTag('Statistique', 'Statistiques globales')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const statistiqueDocument = SwaggerModule.createDocument(app, statistiqueConfig, {
    include: [StatistiqueModule],
  });

  // Setup Swagger avec dropdown pour filtrer par module
  SwaggerModule.setup('', app, mainDocument, {
    explorer: true,
    swaggerOptions: {
      urls: [
        { 
          name: '📚 Tous les modules', 
          url: '/swagger.json' 
        },
        { 
          name: '👤 Module Signup', 
          url: '/signup-swagger.json' 
        },
        { 
          name: '🔐 Module Auth', 
          url: '/auth-swagger.json' 
        },
        { 
          name: '🔑 Module Forgot Password', 
          url: '/forgot-password-swagger.json' 
        },
        { 
          name: '👨‍💼 Module User', 
          url: '/user-swagger.json' 
        },
        { 
          name: '� Module Logs', 
          url: '/log-swagger.json' 
        },        { 
          name: '📁 Module ClasseCourrier', 
          url: '/classe-courrier-swagger.json' 
        },
        { 
          name: '📋 Module TypeCourrier', 
          url: '/type-courrier-swagger.json' 
        },
        { 
          name: '👥 Module Correspondant', 
          url: '/correspondant-swagger.json' 
        },
        { 
          name: '🏷️ Module Catégories', 
          url: '/categories-swagger.json' 
        },
        { 
          name: '🔐 Module Permission', 
          url: '/permission-swagger.json' 
        },
        { 
          name: '👔 Module Role', 
          url: '/role-swagger.json' 
        },
        { 
          name: '🏢 Module Service', 
          url: '/service-swagger.json' 
        },
        { 
          name: '🏛️ Module Salle', 
          url: '/salle-swagger.json' 
        },
        { 
          name: '🔒 Module Coffre', 
          url: '/coffre-swagger.json' 
        },
        { 
          name: '🗄️ Module Archive', 
          url: '/archive-swagger.json' 
        },
        { 
          name: '📄 Module Bordereau Transmission', 
          url: '/bordereau-transmission-swagger.json' 
        },
        { 
          name: '📨 Module Courrier Arrivée', 
          url: '/courrier-swagger.json' 
        },
        { 
          name: '🧭 Module Traitement', 
          url: '/traitement-swagger.json' 
        },
        { 
          name: '📎 Module PieceJointe', 
          url: '/piece-jointe-swagger.json' 
        },
        { 
          name: '🏷️ Module Courrier Interne', 
          url: '/courrier-interne-swagger.json' 
        },
        { 
          name: '🔔 Module Notification', 
          url: '/notification-swagger.json' 
        },
        { 
          name: '📤 Module Courrier Départ', 
          url: '/courrier-depart-swagger.json' 
        },
        { 
          name: '📊 Module Statistique', 
          url: '/statistique-swagger.json' 
        },
      ],
    },
    jsonDocumentUrl: '/swagger.json',
    customSiteTitle: 'API Documentation - Courrier KIAMA 360',
    customfavIcon: '/public/logo.png',
    customCss: `
      .swagger-ui .topbar { background-color: #5c5959ff; }
      .swagger-ui .topbar .wrapper .topbar-wrapper form label span { color: #f1f1f1; }
      .swagger-ui .topbar .wrapper .topbar-wrapper .link svg { display: none; }
      .swagger-ui .topbar .wrapper .topbar-wrapper .link:before {
        content: '';
        display: inline-block;
        background-image: url('');
        background-size: contain;
        background-repeat: no-repeat;
        width: 150px;
        height: 40px;
      }
    `,
  });

  // Setup Swagger pour chaque module avec URL dédiée
  SwaggerModule.setup('signup-doc', app, signupDocument, {
    jsonDocumentUrl: '/signup-swagger.json',
    customSiteTitle: 'API Signup - Création Utilisateurs',
    customfavIcon: '',
  });

  SwaggerModule.setup('auth-doc', app, authDocument, {
    jsonDocumentUrl: '/auth-swagger.json',
    customSiteTitle: 'API Auth - Authentification',
    customfavIcon: '',
  });

  SwaggerModule.setup('forgot-password-doc', app, forgotPasswordDocument, {
    jsonDocumentUrl: '/forgot-password-swagger.json',
    customSiteTitle: 'API Forgot Password - Réinitialisation',
    customfavIcon: '',
  });

  SwaggerModule.setup('user-doc', app, userDocument, {
    jsonDocumentUrl: '/user-swagger.json',
    customSiteTitle: 'API User - Gestion Profil',
    customfavIcon: '',
  });

  SwaggerModule.setup('log-doc', app, logDocument, {
    jsonDocumentUrl: '/log-swagger.json',
    customSiteTitle: 'API Logs - Gestion des Logs et Audit',
    customfavIcon: '',
  });

  SwaggerModule.setup('classe-courrier-doc', app, classeCourrierDocument, {
    jsonDocumentUrl: '/classe-courrier-swagger.json',
    customSiteTitle: 'API ClasseCourrier - Gestion des Classes de Courrier',
    customfavIcon: '',
  });

  SwaggerModule.setup('type-courrier-doc', app, typeCourrierDocument, {
    jsonDocumentUrl: '/type-courrier-swagger.json',
    customSiteTitle: 'API TypeCourrier - Gestion des Types de Courrier',
    customfavIcon: '',
  });

  SwaggerModule.setup('correspondant-doc', app, correspondantDocument, {
    jsonDocumentUrl: '/correspondant-swagger.json',
    customSiteTitle: 'API Correspondant - Gestion des Correspondants',
    customfavIcon: '',
  });

  SwaggerModule.setup('categories-doc', app, categoriesDocument, {
    jsonDocumentUrl: '/categories-swagger.json',
    customSiteTitle: 'API Catégories - Gestion des Catégories',
    customfavIcon: '',
  });

  SwaggerModule.setup('permission-doc', app, permissionDocument, {
    jsonDocumentUrl: '/permission-swagger.json',
    customSiteTitle: 'API Permission - Gestion des Permissions',
    customfavIcon: '',
  });

  SwaggerModule.setup('role-doc', app, roleDocument, {
    jsonDocumentUrl: '/role-swagger.json',
    customSiteTitle: 'API Role - Gestion des Rôles',
    customfavIcon: '',
  });

  SwaggerModule.setup('service-doc', app, serviceDocument, {
    jsonDocumentUrl: '/service-swagger.json',
    customSiteTitle: 'API Service - Gestion des Services',
    customfavIcon: '',
  });

  SwaggerModule.setup('salle-doc', app, salleDocument, {
    jsonDocumentUrl: '/salle-swagger.json',
    customSiteTitle: 'API Salle - Gestion des Salles',
    customfavIcon: '',
  });

  SwaggerModule.setup('coffre-doc', app, coffreDocument, {
    jsonDocumentUrl: '/coffre-swagger.json',
    customSiteTitle: 'API Coffre - Gestion des Coffres',
    customfavIcon: '',
  });

  SwaggerModule.setup('archive-doc', app, archiveDocument, {
    jsonDocumentUrl: '/archive-swagger.json',
    customSiteTitle: 'API Archive - Gestion des Archives',
    customfavIcon: '',
  });

  SwaggerModule.setup('bordereau-transmission-doc', app, bordereauDocument, {
    jsonDocumentUrl: '/bordereau-transmission-swagger.json',
    customSiteTitle: 'API Bordereau Transmission',
    customfavIcon: '',
  });

  SwaggerModule.setup('courrier-doc', app, courrierDocument, {
    jsonDocumentUrl: '/courrier-swagger.json',
    customSiteTitle: 'API Courrier Arrivée',
    customfavIcon: '',
  });

  SwaggerModule.setup('traitement-doc', app, traitementDocument, {
    jsonDocumentUrl: '/traitement-swagger.json',
    customSiteTitle: 'API Traitement',
    customfavIcon: '',
  });

  SwaggerModule.setup('piece-jointe-doc', app, pieceJointeDocument, {
    jsonDocumentUrl: '/piece-jointe-swagger.json',
    customSiteTitle: 'API Pièce Jointe',
    customfavIcon: '',
  });

  SwaggerModule.setup('courrier-interne-doc', app, courrierInterneDocument, {
    jsonDocumentUrl: '/courrier-interne-swagger.json',
    customSiteTitle: 'API Courrier Interne',
    customfavIcon: '',
  });

  SwaggerModule.setup('notification-doc', app, notificationDocument, {
    jsonDocumentUrl: '/notification-swagger.json',
    customSiteTitle: 'API Notification',
    customfavIcon: '',
  });

  SwaggerModule.setup('courrier-depart-doc', app, courrierDepartDocument, {
    jsonDocumentUrl: '/courrier-depart-swagger.json',
    customSiteTitle: 'API Courrier Départ',
    customfavIcon: '',
  });

  SwaggerModule.setup('statistique-doc', app, statistiqueDocument, {
    jsonDocumentUrl: '/statistique-swagger.json',
    customSiteTitle: 'API Statistique',
    customfavIcon: '',
  });

  // Activer la validation globale avec transformation automatique des types
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Active la transformation automatique des types
      transformOptions: {
        enableImplicitConversion: false, // ❌ Désactivé car convertit "false" en true
      },
      whitelist: true, // Supprime les propriétés non déclarées dans le DTO
    }),
  );

  // Démarrer le serveur
  await app.listen(process.env.PORT ?? 3000);
  
  const port = process.env.PORT ?? 3000;
  console.log(`\n🚀 Application démarrée sur: http://localhost:${port}`);
  console.log(`\n📚 Documentation Swagger:`);
  console.log(`   • Tous les modules: http://localhost:${port}`);
  console.log(`   • Module Signup: http://localhost:${port}/signup-doc`);
  console.log(`   • Module Auth: http://localhost:${port}/auth-doc`);
  console.log(`   • Module Forgot Password: http://localhost:${port}/forgot-password-doc`);
  console.log(`   • Module User: http://localhost:${port}/user-doc`);
  console.log(`   • Module Logs: http://localhost:${port}/log-doc`);
  console.log(`   • Module ClasseCourrier: http://localhost:${port}/classe-courrier-doc`);
  console.log(`\n✅ Utilisez le dropdown "Select a definition" pour filtrer par module\n`);
}

bootstrap();
