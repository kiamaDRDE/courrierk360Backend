# 📋 Module Log - Système de Log Centralisé

## 🎯 Description

Le module Log offre un système de logging centralisé et avancé pour l'application PATNUC. Il permet de tracer toutes les activités des utilisateurs, les actions système, et les erreurs avec une granularité fine et des métadonnées enrichies.

## 🔧 Fonctionnalités

### ✨ Fonctionnalités principales
- **Logging automatique** : Toutes les requêtes HTTP sont loggées automatiquement
- **Types d'actions complets** : Plus de 50 actions prédéfinies couvrant tous les modules
- **Métadonnées enrichies** : Stockage des anciennes/nouvelles valeurs, durée des requêtes, etc.
- **Filtrage avancé** : Recherche par action, module, utilisateur, dates, IP, etc.
- **Export multi-format** : CSV, JSON, Excel, PDF
- **Statistiques détaillées** : Dashboard de monitoring et santé système
- **Nettoyage automatique** : Suppression des anciens logs
- **Helpers intuitifs** : Méthodes simplifiées pour les actions courantes

### 🚀 Nouveautés par rapport à l'ancien système
- **Module dédié** : Centralisation complète du logging
- **Métadonnées JSON** : Plus de flexibilité dans les données stockées
- **Actions typées** : Enum complet pour éviter les erreurs
- **Logging automatique** : Intercepteur global pour toutes les requêtes
- **Export avancé** : Multiples formats et filtres
- **Helpers métier** : Méthodes spécialisées par type d'action

---

## 🔐 Authentification

Toutes les routes du module Log nécessitent une authentification JWT :

```bash
Authorization: Bearer <votre_jwt_token>
```

---

## 📋 Routes Disponibles

### 1. POST /logs
**Description** : Créer un nouveau log manuellement

**Authentification** : ✅ Requise (Bearer Token)

**Body** :
```json
{
  "action": "CREATE_OPERATEUR",
  "module": "OPERATEUR", 
  "level": "SUCCESS",
  "description": "Création d'un nouvel opérateur Orange Cameroun",
  "metadata": {
    "entityId": 123,
    "newValues": {
      "nom": "Orange Cameroun",
      "code": "ORA-CM"
    }
  }
}
```

**Réponse** (201) :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "LOG_CREATED",
  "title": "Log créé avec succès",
  "message": "Le log d'activité a été enregistré avec succès",
  "data": {
    "id": 156,
    "userId": 1,
    "action": "CREATE_OPERATEUR",
    "module": "OPERATEUR",
    "level": "SUCCESS",
    "description": "Création d'un nouvel opérateur Orange Cameroun",
    "ipAddress": "192.168.1.100",
    "metadata": {
      "entityId": 123,
      "newValues": {
        "nom": "Orange Cameroun",
        "code": "ORA-CM"
      }
    },
    "createdAt": "2025-01-06T10:30:00.000Z",
    "user": {
      "id": 1,
      "nom": "Admin PATNUC",
      "email": "admin@patnuc.com"
    }
  }
}
```

### 2. GET /logs
**Description** : Récupérer la liste des logs avec pagination et filtres

**Authentification** : ✅ Requise (Bearer Token)

**Paramètres Query** (tous optionnels) :
- `page` (number, default: 1): Numéro de page
- `limit` (number, default: 20): Nombre d'éléments par page
- `action` (LogAction): Filtrer par action
- `module` (LogModule): Filtrer par module
- `level` (LogLevel): Filtrer par niveau (INFO, SUCCESS, WARNING, ERROR)
- `userId` (number): Filtrer par utilisateur
- `search` (string): Recherche dans la description
- `startDate` (ISO 8601): Date de début
- `endDate` (ISO 8601): Date de fin
- `ipAddress` (string): Filtrer par IP
- `entityId` (number): Filtrer par ID d'entité
- `sortBy` (string): Tri par (createdAt, action, module, level)
- `sortOrder` (string): Ordre de tri (asc, desc)

**Exemples d'utilisation** :
```bash
GET /logs?page=1&limit=20&action=CREATE_OPERATEUR
GET /logs?module=AUTH&level=ERROR&startDate=2025-01-01T00:00:00.000Z
GET /logs?userId=1&search=opérateur&sortBy=createdAt&sortOrder=desc
```

**Réponse** (200) :
```json
{
  "success": true,
  "statusCode": 200,
  "code": "LOGS_RETRIEVED",
  "title": "Logs récupérés",
  "message": "15 log(s) récupéré(s) avec succès.",
  "data": {
    "logs": [
      {
        "id": 156,
        "userId": 1,
        "action": "CREATE_OPERATEUR",
        "module": "OPERATEUR",
        "level": "SUCCESS",
        "description": "Création d'un nouvel opérateur Orange Cameroun",
        "ipAddress": "192.168.1.100",
        "metadata": {
          "entityId": 123,
          "newValues": {
            "nom": "Orange Cameroun",
            "code": "ORA-CM"
          }
        },
        "createdAt": "2025-01-06T10:30:00.000Z",
        "user": {
          "id": 1,
          "nom": "Admin PATNUC",
          "email": "admin@patnuc.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1247,
      "totalPages": 63,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 3. GET /logs/stats
**Description** : Récupérer les statistiques détaillées des logs

**Authentification** : ✅ Requise (Bearer Token)

**Paramètres Query** (optionnels) :
- `startDate` (ISO 8601): Date de début pour les statistiques
- `endDate` (ISO 8601): Date de fin pour les statistiques

**Exemple d'utilisation** :
```bash
GET /logs/stats?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

**Réponse** (200) :
```json
{
  "success": true,
  "statusCode": 200,
  "code": "STATS_RETRIEVED",
  "title": "Statistiques des logs",
  "message": "Statistiques récupérées avec succès.",
  "data": {
    "totalLogs": 1247,
    "logsToday": 23,
    "logsByModule": {
      "AUTH": 156,
      "OPERATEUR": 234,
      "OFFRE": 189,
      "STRUCTURE_TARIFAIRE": 145,
      "AVANTAGE": 98
    },
    "logsByAction": {
      "LOGIN": 156,
      "CREATE_OPERATEUR": 45,
      "UPDATE_OPERATEUR": 34,
      "CREATE_OFFRE": 28
    },
    "logsByLevel": {
      "INFO": 856,
      "SUCCESS": 234,
      "WARNING": 123,
      "ERROR": 34
    },
    "topUsers": [
      {
        "userId": 1,
        "userName": "Admin PATNUC",
        "count": 234
      }
    ],
    "recentErrors": [
      {
        "id": 1245,
        "action": "CREATE_OPERATEUR",
        "description": "Erreur lors de la création: nom déjà existant",
        "createdAt": "2025-01-06T09:45:00.000Z",
        "user": {
          "nom": "Admin PATNUC"
        }
      }
    ],
    "systemHealth": {
      "errorRate": 2.7,
      "averageResponseTime": 0,
      "status": "healthy"
    }
  }
}
```

### 4. GET /logs/export
**Description** : Exporter les logs dans différents formats

**Authentification** : ✅ Requise (Bearer Token)

**Paramètres Query** (tous optionnels) :
- `format` (csv|json|excel|pdf, default: csv): Format d'export
- `action` (LogAction): Filtrer par action
- `module` (LogModule): Filtrer par module
- `level` (LogLevel): Filtrer par niveau
- `userId` (number): Filtrer par utilisateur
- `startDate` (ISO 8601): Date de début
- `endDate` (ISO 8601): Date de fin
- `search` (string): Recherche dans la description
- `limit` (number, max: 10000, default: 5000): Limite d'export

**Exemples d'utilisation** :
```bash
GET /logs/export?format=csv&module=OPERATEUR&startDate=2025-01-01T00:00:00.000Z
GET /logs/export?format=json&level=ERROR&limit=1000
```

**Réponse** (200) : Fichier téléchargeable
- **CSV** : `text/csv`
- **JSON** : `application/json`

### 5. DELETE /logs/cleanup/:days
**Description** : Nettoyer les anciens logs (Admin seulement)

**Authentification** : ✅ Requise (Bearer Token + Admin)

**Paramètres** :
- `days` (number): Nombre de jours à conserver

**Exemple d'utilisation** :
```bash
DELETE /logs/cleanup/90  # Supprimer les logs de plus de 90 jours
```

**Réponse** (200) :
```json
{
  "success": true,
  "statusCode": 200,
  "code": "LOGS_CLEANED",
  "title": "Nettoyage des logs",
  "message": "234 anciens logs supprimés.",
  "data": {
    "deletedCount": 234
  }
}
```

---

## 🔄 Types d'Actions et Modules

### Actions disponibles (LogAction)
**Authentification & Utilisateur :**
- `LOGIN`, `LOGOUT`, `SIGNUP`, `TOKEN_REFRESH`
- `PASSWORD_CHANGE`, `PASSWORD_CHANGE_BY_ADMIN`
- `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_COMPLETE`
- `OTP_VERIFICATION`

**CRUD par module :**
- **Opérateur** : `CREATE_OPERATEUR`, `UPDATE_OPERATEUR`, `DELETE_OPERATEUR`, `VIEW_OPERATEUR`, `LIST_OPERATEURS`
- **Offre** : `CREATE_OFFRE`, `UPDATE_OFFRE`, `DELETE_OFFRE`, `VIEW_OFFRE`, `LIST_OFFRES`, `CALCUL_EFFET_CLUB`, `VIEW_EFFET_CLUB`
- **Structure Tarifaire** : `CREATE_STRUCTURE_TARIFAIRE`, `UPDATE_STRUCTURE_TARIFAIRE`, `UPDATE_MULTIPLE_STRUCTURES_TARIFAIRES`, etc.
- **Avantage** : `CREATE_AVANTAGE`, `UPDATE_AVANTAGE`, `UPDATE_MULTIPLE_AVANTAGES`, etc.
- Et pour tous les autres modules...

**Actions système :**
- `SYSTEM_ERROR`, `SYSTEM_WARNING`, `SYSTEM_INFO`, `API_ERROR`, `DATABASE_ERROR`

### Modules disponibles (LogModule)
`AUTH`, `USER`, `SIGNUP`, `FORGOT_PASSWORD`, `OPERATEUR`, `OFFRE`, `STRUCTURE_TARIFAIRE`, `AVANTAGE`, `SERVICE`, `TARIF_INTERCONNEXION`, `TYPE_APPEL`, `TYPE_OPERATEUR`, `OPTION`, `CONSOMMATION_MOYENNE`, `TRAFIC`, `ABONNEMENT`, `CHIFFRE_AFFAIRE`, `IHH`, `CARACTERISTIQUE`, `PARAMETRE`, `SYSTEM`

### Niveaux de log (LogLevel)
- `INFO` : Information générale
- `SUCCESS` : Action réussie
- `WARNING` : Avertissement
- `ERROR` : Erreur

---

## 🛠️ Utilisation dans le Code

### Pour les développeurs : LogHelper

Le `LogHelper` propose des méthodes simplifiées pour les actions courantes :

```typescript
import { LogHelper } from '../log/helpers/log.helper';
import { LogModule } from '../log/interfaces/log.interface';

@Injectable()
export class OperateurService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logHelper: LogHelper, // ✨ Injecter le helper
  ) {}

  async createOperateur(data: CreateOperateurDto, userId: number, ipAddress?: string) {
    // Créer l'opérateur
    const operateur = await this.prisma.operateur.create({ data });

    // Logger automatiquement la création 🚀
    await this.logHelper.logCreate(
      LogModule.OPERATEUR,
      'opérateur',
      operateur.id,
      operateur,
      userId,
      ipAddress,
    );

    return operateur;
  }

  async updateOperateur(id: number, updateData: UpdateOperateurDto, userId: number, ipAddress?: string) {
    // Récupérer les anciennes valeurs
    const oldOperateur = await this.prisma.operateur.findUnique({ where: { id } });
    
    // Mettre à jour
    const updatedOperateur = await this.prisma.operateur.update({
      where: { id },
      data: updateData,
    });

    // Déterminer les champs modifiés
    const changedFields = Object.keys(updateData);

    // Logger automatiquement la modification 🚀
    await this.logHelper.logUpdate(
      LogModule.OPERATEUR,
      'opérateur',
      id,
      oldOperateur,
      updatedOperateur,
      changedFields,
      userId,
      ipAddress,
    );

    return updatedOperateur;
  }
}
```

### Pour les actions spécialisées :

```typescript
// Logger une authentification
await this.logHelper.logAuth(
  LogAction.LOGIN, 
  'Connexion réussie de admin@patnuc.com',
  { userId: 1, ipAddress: '192.168.1.100', success: true }
);

// Logger un changement de mot de passe
await this.logHelper.logPasswordChange(
  false, // pas admin
  userId,
  undefined, // pas d'admin
  ipAddress
);

// Logger une erreur
await this.logHelper.logError(
  LogModule.OPERATEUR,
  new Error('Nom d\'opérateur déjà existant'),
  'createOperateur',
  userId
);

// Logger un calcul d'effet de club
await this.logHelper.logEffetClub(
  offreId,
  'Offre Premium 5G',
  0.75, // valeur calculée
  userId,
  ipAddress
);
```

### Utilisation directe du LogService :

```typescript
import { LogService } from '../log/log.service';
import { LogAction, LogModule, LogLevel } from '../log/interfaces/log.interface';

@Injectable()
export class MonService {
  constructor(private readonly logService: LogService) {}

  async maMethode() {
    // Log simple
    await this.logService.log(
      LogAction.CREATE_OPERATEUR,
      LogModule.OPERATEUR,
      'Création d\'un opérateur',
      {
        userId: 1,
        level: LogLevel.SUCCESS,
        ipAddress: '192.168.1.100',
        metadata: {
          entityId: 123,
          newValues: { nom: 'Orange Cameroun' }
        }
      }
    );

    // Log complet
    await this.logService.createLog({
      userId: 1,
      action: LogAction.CREATE_OPERATEUR,
      module: LogModule.OPERATEUR,
      level: LogLevel.SUCCESS,
      description: 'Création d\'un nouvel opérateur Orange Cameroun',
      ipAddress: '192.168.1.100',
      metadata: {
        entityId: 123,
        newValues: {
          nom: 'Orange Cameroun',
          code: 'ORA-CM',
          type: 'Mobile'
        },
        duration: 150 // ms
      }
    });
  }
}
```

---

## 🧪 Tester dans Swagger

1. Accédez à **http://localhost:3000**
2. Cliquez sur **"Authorize"** en haut à droite
3. Entrez votre token JWT : `Bearer <token>`
4. Cliquez sur **"Authorize"**
5. Testez les routes dans la section **"Logs"**

---

## 🛠️ Architecture Technique

### Structure des fichiers :
```
src/log/
├── log.module.ts                    # Configuration du module
├── log.service.ts                   # Logique métier principale
├── log.controller.ts                # Endpoints REST
├── dto/
│   ├── index.ts                     # Index des DTOs
│   ├── create-log.dto.ts           # Validation création de log
│   ├── log-query.dto.ts            # Validation requêtes de recherche
│   └── export-logs.dto.ts          # Validation export
├── interfaces/
│   └── log.interface.ts            # Types, enums et interfaces
├── helpers/
│   └── log.helper.ts               # Méthodes simplifiées
├── decorators/
│   └── auto-log.decorator.ts       # Décorateur automatique (futur)
└── interceptors/
    └── logging.interceptor.ts      # Intercepteur global
```

### Base de données :
- **Table activity_logs** : Stockage avec nouvelles colonnes `module`, `level`, `metadata` (JSON)

---

## 📊 Exemples de Cas d'Usage

### Cas 1 : Monitoring des connexions échouées
```bash
GET /logs?action=LOGIN&level=ERROR&startDate=2025-01-01T00:00:00.000Z
```

### Cas 2 : Audit des modifications d'opérateurs
```bash
GET /logs?module=OPERATEUR&action=UPDATE_OPERATEUR&userId=1
```

### Cas 3 : Export CSV des erreurs système
```bash
GET /logs/export?format=csv&level=ERROR&limit=5000
```

### Cas 4 : Dashboard de monitoring
```bash
GET /logs/stats  # Récupérer toutes les statistiques
```

### Cas 5 : Recherche par métadonnées
```bash
GET /logs?entityId=123  # Tous les logs concernant l'entité ID 123
```

---

## 🚀 Améliorations Futures

- [ ] **Dashboard temps réel** : Interface graphique pour monitoring
- [ ] **Alertes automatiques** : Notifications en cas d'erreurs critiques
- [ ] **Métriques de performance** : Temps de réponse moyen par endpoint
- [ ] **Archivage automatique** : Déplacement des anciens logs vers un stockage secondaire
- [ ] **Log streaming** : WebSocket pour logs temps réel
- [ ] **Décorateur @AutoLog** : Logging automatique sur les méthodes
- [ ] **Intégration ELK** : Export vers Elasticsearch/Logstash/Kibana
- [ ] **Corrélation de requêtes** : Traçage distribué avec correlation ID

---

## ✅ Status

**Module Log - ✅ Fonctionnel**

- ✅ **Service LogService complet** : CRUD, filtrage, statistiques, export
- ✅ **Controller avec 5 endpoints** : Create, Read, Stats, Export, Cleanup
- ✅ **50+ actions typées** : Couverture complète de tous les modules
- ✅ **Helpers intuitifs** : Méthodes simplifiées pour développeurs
- ✅ **Intercepteur global** : Logging automatique des requêtes HTTP
- ✅ **Export multi-format** : CSV, JSON prêts
- ✅ **Filtrage avancé** : 12 critères de filtrage
- ✅ **Documentation Swagger complète** : Exemples et schémas détaillés
- ✅ **Intégration AppModule** : Module prêt à l'emploi

### Avantages par rapport à l'ancien système :
1. **Centralisation** : Un seul module pour tous les logs
2. **Métadonnées enrichies** : JSON flexible vs champs fixes
3. **Actions typées** : Pas d'erreurs de frappe
4. **Logging automatique** : Plus besoin de coder manuellement chaque log
5. **Export avancé** : Multiple formats et filtres
6. **Statistiques** : Dashboard de monitoring intégré
7. **Performance** : Indexation optimisée sur tous les champs de recherche

---

**Le module Log est maintenant un système de logging entreprise complet ! 🎉**
