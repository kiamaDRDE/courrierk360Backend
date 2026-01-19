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
import { OperateurModule } from './operateur/operateur.module';
import { TypeAppelModule } from './type-appel/type-appel.module';
import { OptionModule } from './option/option.module';
import { ConsommationMoyenneModule } from './consommation-moyenne/consommation-moyenne.module';
import { OffreModule } from './offre/offre.module';
import { StructureTarifaireModule } from './structure-tarifaire/structure-tarifaire.module';
import { AvantageModule } from './avantage/avantage.module';
import { TypeOperateurModule } from './type-operateur/type-operateur.module';
import { TraficModule } from './trafic/trafic.module';
import { AbonnementModule } from './abonnement/abonnement.module';
import { ChiffreAffaireModule } from './chiffre-affaire/chiffre-affaire.module';
import { IhhModule } from './ihh/ihh.module';
import { ParametreModule } from './parametre/parametre.module';
import { CaracteristiqueModule } from './caracteristique/caracteristique.module';
import { TarifInterconnexionModule } from './tarif-interconnexion/tarif-interconnexion.module';
import { ServicesModule } from './services-management/services.module';
import { LogModule } from './log/log.module';
import { DashboardModule } from './dashboard/dashboard.module';

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
    .setTitle('API Complète - Patnuc Segmentation')
    .setDescription(
      'API permettant de gérer tous les modules du système patnuc_segmentation.',
    )
    .setVersion('1.0.0')
    .addTag('Signup', 'Gestion de la création des utilisateurs')
    .addTag('Auth', 'Authentification et gestion des tokens')
    .addTag('Forgot Password', 'Réinitialisation de mot de passe oublié')
    .addTag('User', 'Gestion du profil et des activités utilisateur')
    .addTag('Operateur', 'Gestion des opérateurs et tarifs d\'interconnection')
    .addTag('Type d\'appel', 'Gestion des types d\'appel des opérateurs')
    .addTag('Structures tarifaires', 'Gestion des structures tarifaires')
    .addTag('Avantages', 'Gestion des avantages des offres')
    .addTag('Types d\'opérateur', 'Gestion des types d\'opérateur')
    .addTag('Options', 'Gestion des options des offres')
    .addTag('Consommations moyennes', 'Gestion des consommations moyennes')
    .addTag('Offre', 'Gestion des offres et calcul d\'effet club')
    .addTag('Trafic', 'Gestion des données de trafic des opérateurs')
    .addTag('Abonnement', 'Gestion des données d\'abonnement')
    .addTag('Chiffre d\'affaire', 'Gestion des chiffres d\'affaire')
    .addTag('Part de marché (IHH)', 'Gestion des parts de marché et indices IHH')
    .addTag('Paramètres', 'Gestion des paramètres financiers')
    .addTag('Caractéristique', 'Gestion des caractéristiques des offres')
    .addTag('Tarif Interconnexion', 'Gestion des tarifs d\'interconnexion')
    .addTag('Services', 'Gestion des services opérateurs')
    .addTag('Logs', 'Gestion des logs et audit système')
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

  // Configuration Swagger pour le module Operateur
  const operateurConfig = new DocumentBuilder()
    .setTitle('API Operateur - Gestion Opérateurs')
    .setDescription('API dédiée à la gestion des opérateurs et tarifs d\'interconnection.')
    .setVersion('1.0.0')
    .addTag('Operateur', 'Gestion des opérateurs')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const operateurDocument = SwaggerModule.createDocument(app, operateurConfig, {
    include: [OperateurModule],
  });

  // Configuration Swagger pour le module TypeAppel
  const typeAppelConfig = new DocumentBuilder()
    .setTitle('API Type Appel - Gestion Types d\'Appel')
    .setDescription('API dédiée à la gestion des types d\'appel.')
    .setVersion('1.0.0')
    .addTag('TypeAppel', 'Gestion des types d\'appel')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const typeAppelDocument = SwaggerModule.createDocument(app, typeAppelConfig, {
    include: [TypeAppelModule],
  });

  // Configuration Swagger pour le module Option
  const optionConfig = new DocumentBuilder()
    .setTitle('API Options - Gestion Options')
    .setDescription('API dédiée à la gestion des options des offres.')
    .setVersion('1.0.0')
    .addTag('Options', 'Gestion des options')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const optionDocument = SwaggerModule.createDocument(app, optionConfig, {
    include: [OptionModule],
  });

  // Configuration Swagger pour le module ConsommationMoyenne
  const consommationMoyenneConfig = new DocumentBuilder()
    .setTitle('API Consommations moyennes - Gestion Consommations moyennes')
    .setDescription('API dédiée à la gestion des consommations moyennes.')
    .setVersion('1.0.0')
    .addTag('Consommations moyennes', 'Gestion des consommations moyennes')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const consommationMoyenneDocument = SwaggerModule.createDocument(app, consommationMoyenneConfig, {
    include: [ConsommationMoyenneModule],
  });

  // Configuration Swagger pour le module Offre
  const offreConfig = new DocumentBuilder()
    .setTitle('API Offre - Gestion Offres')
    .setDescription('API dédiée à la gestion des offres et calcul d\'effet club.')
    .setVersion('1.0.0')
    .addTag('Offre', 'Gestion des offres et effet club')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const offreDocument = SwaggerModule.createDocument(app, offreConfig, {
    include: [OffreModule],
  });

  // Configuration Swagger pour le module Structure Tarifaire
  const structureTarifaireConfig = new DocumentBuilder()
    .setTitle('API Structure Tarifaire - Gestion Structures Tarifaires')
    .setDescription('API dédiée à la gestion des structures tarifaires.')
    .setVersion('1.0.0')
    .addTag('Structures tarifaires', 'Gestion des structures tarifaires')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const structureTarifaireDocument = SwaggerModule.createDocument(app, structureTarifaireConfig, {
    include: [StructureTarifaireModule],
  });

  // Configuration Swagger pour le module Avantage
  const avantageConfig = new DocumentBuilder()
    .setTitle('API Avantage - Gestion Avantages')
    .setDescription('API dédiée à la gestion des avantages des offres.')
    .setVersion('1.0.0')
    .addTag('Avantages', 'Gestion des avantages')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const avantageDocument = SwaggerModule.createDocument(app, avantageConfig, {
    include: [AvantageModule],
  });

  // Configuration Swagger pour le module Type Opérateur
  const typeOperateurConfig = new DocumentBuilder()
    .setTitle('API Type Opérateur - Gestion Types d\'Opérateur')
    .setDescription('API dédiée à la gestion des types d\'opérateur.')
    .setVersion('1.0.0')
    .addTag('Types d\'opérateur', 'Gestion des types d\'opérateur')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const typeOperateurDocument = SwaggerModule.createDocument(app, typeOperateurConfig, {
    include: [TypeOperateurModule],
  });

  // Configuration Swagger pour le module Trafic
  const traficConfig = new DocumentBuilder()
    .setTitle('API Trafic - Gestion du Trafic')
    .setDescription('API dédiée à la gestion des données de trafic des opérateurs.')
    .setVersion('1.0.0')
    .addTag('Trafic', 'Gestion des données de trafic')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const traficDocument = SwaggerModule.createDocument(app, traficConfig, {
    include: [TraficModule],
  });

  // Configuration Swagger pour le module Abonnement
  const abonnementConfig = new DocumentBuilder()
    .setTitle('API Abonnement - Gestion des Abonnements')
    .setDescription('API dédiée à la gestion des données d\'abonnement.')
    .setVersion('1.0.0')
    .addTag('Abonnement', 'Gestion des abonnements')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const abonnementDocument = SwaggerModule.createDocument(app, abonnementConfig, {
    include: [AbonnementModule],
  });

  // Configuration Swagger pour le module Chiffre d'Affaire
  const chiffreAffaireConfig = new DocumentBuilder()
    .setTitle('API Chiffre d\'Affaire - Gestion CA')
    .setDescription('API dédiée à la gestion des chiffres d\'affaire.')
    .setVersion('1.0.0')
    .addTag('Chiffre d\'affaire', 'Gestion des chiffres d\'affaire')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const chiffreAffaireDocument = SwaggerModule.createDocument(app, chiffreAffaireConfig, {
    include: [ChiffreAffaireModule],
  });

  // Configuration Swagger pour le module IHH
  const ihhConfig = new DocumentBuilder()
    .setTitle('API Part de Marché (IHH) - Indices Herfindahl-Hirschman')
    .setDescription('API dédiée à la gestion des parts de marché et calculs d\'indices IHH.')
    .setVersion('1.0.0')
    .addTag('Part de marché (IHH)', 'Gestion des parts de marché')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const ihhDocument = SwaggerModule.createDocument(app, ihhConfig, {
    include: [IhhModule],
  });

  // Configuration Swagger pour le module Parametre
  const parametreConfig = new DocumentBuilder()
    .setTitle('API Paramètres - Gestion des Paramètres Financiers')
    .setDescription('API dédiée à la gestion des paramètres financiers (redevances, coûts).')
    .setVersion('1.0.0')
    .addTag('Paramètres', 'Gestion des paramètres financiers')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const parametreDocument = SwaggerModule.createDocument(app, parametreConfig, {
    include: [ParametreModule],
  });

  // Configuration Swagger pour le module Caracteristique
  const caracteristiqueConfig = new DocumentBuilder()
    .setTitle('API Caractéristiques - Gestion des Caractéristiques')
    .setDescription('API dédiée à la gestion des caractéristiques des offres.')
    .setVersion('1.0.0')
    .addTag('Caractéristique', 'Gestion des caractéristiques')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const caracteristiqueDocument = SwaggerModule.createDocument(app, caracteristiqueConfig, {
    include: [CaracteristiqueModule],
  });

  // Configuration Swagger pour le module Tarif Interconnexion
  const tarifInterconnexionConfig = new DocumentBuilder()
    .setTitle('API Tarifs d\'Interconnexion - Gestion Tarifs')
    .setDescription('API dédiée à la gestion des tarifs d\'interconnexion.')
    .setVersion('1.0.0')
    .addTag('Tarif Interconnexion', 'Gestion des tarifs d\'interconnexion')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const tarifInterconnexionDocument = SwaggerModule.createDocument(app, tarifInterconnexionConfig, {
    include: [TarifInterconnexionModule],
  });

  // Configuration Swagger pour le module Services
  const servicesConfig = new DocumentBuilder()
    .setTitle('API Services - Gestion des Services')
    .setDescription('API dédiée à la gestion des services opérateurs.')
    .setVersion('1.0.0')
    .addTag('Services', 'Gestion des services')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const servicesDocument = SwaggerModule.createDocument(app, servicesConfig, {
    include: [ServicesModule],
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

  // Configuration Swagger pour le module Dashboard
  const dashboardConfig = new DocumentBuilder()
    .setTitle('API Dashboard - Statistiques et KPI')
    .setDescription('API dédiée aux statistiques générales et KPI du dashboard.')
    .setVersion('1.0.0')
    .addTag('Dashboard', 'Statistiques dashboard et KPI')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addServer('/')
    .build();

  const dashboardDocument = SwaggerModule.createDocument(app, dashboardConfig, {
    include: [DashboardModule],
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
          name: '📡 Module Operateur', 
          url: '/operateur-swagger.json' 
        },
        { 
          name: '📞 Module Type Appel', 
          url: '/type-appel-swagger.json' 
        },
        { 
          name: '⚙️ Module Options', 
          url: '/option-swagger.json' 
        },
        { 
          name: '📊 Module Consommations moyennes', 
          url: '/consommation-moyenne-swagger.json' 
        },
        { 
          name: '💼 Module Offre', 
          url: '/offre-swagger.json' 
        },
        { 
          name: '🏗️ Module Structure Tarifaire', 
          url: '/structure-tarifaire-swagger.json' 
        },
        { 
          name: '🎁 Module Avantage', 
          url: '/avantage-swagger.json' 
        },
        { 
          name: '⚙️ Module Type Opérateur', 
          url: '/type-operateur-swagger.json' 
        },
        { 
          name: '📊 Module Trafic', 
          url: '/trafic-swagger.json' 
        },
        { 
          name: '📱 Module Abonnement', 
          url: '/abonnement-swagger.json' 
        },
        { 
          name: '💰 Module Chiffre d\'Affaire', 
          url: '/chiffre-affaire-swagger.json' 
        },
        { 
          name: '📈 Module Part de Marché (IHH)', 
          url: '/ihh-swagger.json' 
        },
        { 
          name: '🔧 Module Paramètres', 
          url: '/parametre-swagger.json' 
        },
        { 
          name: '📋 Module Caractéristiques', 
          url: '/caracteristique-swagger.json' 
        },
        { 
          name: '💲 Module Tarif Interconnexion', 
          url: '/tarif-interconnexion-swagger.json' 
        },
        { 
          name: '🛠️ Module Services', 
          url: '/services-swagger.json' 
        },
        { 
          name: '📋 Module Logs', 
          url: '/log-swagger.json' 
        },
        { 
          name: '📊 Module Dashboard', 
          url: '/dashboard-swagger.json' 
        },
      ],
    },
    jsonDocumentUrl: '/swagger.json',
    customSiteTitle: 'API Documentation - Patnuc Segmentation',
    customfavIcon: '/patnuc.png',
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

  SwaggerModule.setup('operateur-doc', app, operateurDocument, {
    jsonDocumentUrl: '/operateur-swagger.json',
    customSiteTitle: 'API Operateur - Gestion Opérateurs',
    customfavIcon: '',
  });

  SwaggerModule.setup('type-appel-doc', app, typeAppelDocument, {
    jsonDocumentUrl: '/type-appel-swagger.json',
    customSiteTitle: 'API Type Appel - Gestion Types d\'Appel',
    customfavIcon: '',
  });

  SwaggerModule.setup('option-doc', app, optionDocument, {
    jsonDocumentUrl: '/option-swagger.json',
    customSiteTitle: 'API Options - Gestion Options',
    customfavIcon: '',
  });

  SwaggerModule.setup('consommation-moyenne-doc', app, consommationMoyenneDocument, {
    jsonDocumentUrl: '/consommation-moyenne-swagger.json',
    customSiteTitle: 'API Consommations moyennes - Gestion Consommations moyennes',
    customfavIcon: '',
  });

  SwaggerModule.setup('offre-doc', app, offreDocument, {
    jsonDocumentUrl: '/offre-swagger.json',
    customSiteTitle: 'API Offre - Gestion Offres',
    customfavIcon: '',
  });

  SwaggerModule.setup('structure-tarifaire-doc', app, structureTarifaireDocument, {
    jsonDocumentUrl: '/structure-tarifaire-swagger.json',
    customSiteTitle: 'API Structure Tarifaire - Gestion Structures Tarifaires',
    customfavIcon: '',
  });

  SwaggerModule.setup('avantage-doc', app, avantageDocument, {
    jsonDocumentUrl: '/avantage-swagger.json',
    customSiteTitle: 'API Avantage - Gestion Avantages',
    customfavIcon: '',
  });

  SwaggerModule.setup('type-operateur-doc', app, typeOperateurDocument, {
    jsonDocumentUrl: '/type-operateur-swagger.json',
    customSiteTitle: 'API Type Opérateur - Gestion Types d\'Opérateur',
    customfavIcon: '',
  });

  SwaggerModule.setup('trafic-doc', app, traficDocument, {
    jsonDocumentUrl: '/trafic-swagger.json',
    customSiteTitle: 'API Trafic - Gestion du Trafic',
    customfavIcon: '',
  });

  SwaggerModule.setup('abonnement-doc', app, abonnementDocument, {
    jsonDocumentUrl: '/abonnement-swagger.json',
    customSiteTitle: 'API Abonnement - Gestion des Abonnements',
    customfavIcon: '',
  });

  SwaggerModule.setup('chiffre-affaire-doc', app, chiffreAffaireDocument, {
    jsonDocumentUrl: '/chiffre-affaire-swagger.json',
    customSiteTitle: 'API Chiffre d\'Affaire - Gestion CA',
    customfavIcon: '',
  });

  SwaggerModule.setup('ihh-doc', app, ihhDocument, {
    jsonDocumentUrl: '/ihh-swagger.json',
    customSiteTitle: 'API Part de Marché (IHH) - Indices Herfindahl-Hirschman',
    customfavIcon: '',
  });

  SwaggerModule.setup('parametre-doc', app, parametreDocument, {
    jsonDocumentUrl: '/parametre-swagger.json',
    customSiteTitle: 'API Paramètres - Gestion des Paramètres Financiers',
    customfavIcon: '',
  });

  SwaggerModule.setup('caracteristique-doc', app, caracteristiqueDocument, {
    jsonDocumentUrl: '/caracteristique-swagger.json',
    customSiteTitle: 'API Caractéristiques - Gestion des Caractéristiques',
    customfavIcon: '',
  });

  SwaggerModule.setup('tarif-interconnexion-doc', app, tarifInterconnexionDocument, {
    jsonDocumentUrl: '/tarif-interconnexion-swagger.json',
    customSiteTitle: 'API Tarifs d\'Interconnexion - Gestion Tarifs',
    customfavIcon: '',
  });

  SwaggerModule.setup('services-doc', app, servicesDocument, {
    jsonDocumentUrl: '/services-swagger.json',
    customSiteTitle: 'API Services - Gestion des Services',
    customfavIcon: '',
  });

  SwaggerModule.setup('log-doc', app, logDocument, {
    jsonDocumentUrl: '/log-swagger.json',
    customSiteTitle: 'API Logs - Gestion des Logs et Audit',
    customfavIcon: '',
  });

  SwaggerModule.setup('dashboard-doc', app, dashboardDocument, {
    jsonDocumentUrl: '/dashboard-swagger.json',
    customSiteTitle: 'API Dashboard - Statistiques et KPI',
    customfavIcon: '',
  });

  SwaggerModule.setup('dashboard-doc', app, dashboardDocument, {
    jsonDocumentUrl: '/dashboard-swagger.json',
    customSiteTitle: 'API Dashboard - Statistiques et KPI',
    customfavIcon: '',
  });

  // Activer la validation globale avec transformation automatique des types
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Active la transformation automatique des types
      transformOptions: {
        enableImplicitConversion: true, // Conversion implicite des types
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
  console.log(`   • Module Operateur: http://localhost:${port}/operateur-doc`);
  console.log(`   • Module Type Appel: http://localhost:${port}/type-appel-doc`);
  console.log(`   • Module Options: http://localhost:${port}/option-doc`);
  console.log(`   • Module Consommations moyennes: http://localhost:${port}/consommation-moyenne-doc`);
  console.log(`   • Module Offre: http://localhost:${port}/offre-doc`);
  console.log(`   • Module Structure Tarifaire: http://localhost:${port}/structure-tarifaire-doc`);
  console.log(`   • Module Avantages: http://localhost:${port}/avantage-doc`);
  console.log(`   • Module Type Opérateur: http://localhost:${port}/type-operateur-doc`);
  console.log(`   • Module Trafic: http://localhost:${port}/trafic-doc`);
  console.log(`   • Module Abonnement: http://localhost:${port}/abonnement-doc`);
  console.log(`   • Module Chiffre d'Affaire: http://localhost:${port}/chiffre-affaire-doc`);
  console.log(`   • Module Part de Marché (IHH): http://localhost:${port}/ihh-doc`);
  console.log(`   • Module Paramètres: http://localhost:${port}/parametre-doc`);
  console.log(`   • Module Caractéristiques: http://localhost:${port}/caracteristique-doc`);
  console.log(`   • Module Tarif Interconnexion: http://localhost:${port}/tarif-interconnexion-doc`);
  console.log(`   • Module Services: http://localhost:${port}/services-doc`);
  console.log(`   • Module Logs: http://localhost:${port}/log-doc`);
  console.log(`   • Module Dashboard: http://localhost:${port}/dashboard-doc`);
  console.log(`\n✅ Utilisez le dropdown "Select a definition" pour filtrer par module\n`);
}

bootstrap();
