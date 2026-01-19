# 📋 Module de Logging - Guide d'utilisation

## 🚀 **Logs Automatiques (Activés !)**

Les logs sont maintenant **automatiquement créés** pour toutes les requêtes HTTP avec des **descriptions d'action claires** grâce à l'intercepteur global `LoggingInterceptor`.

### ✨ **Messages d'Action Intelligents**

Le système génère automatiquement des descriptions d'action compréhensibles pour les développeurs frontend :

| Requête HTTP | Message généré |
|-------------|---------------|
| `GET /operateur` | **"Liste des opérateurs - Réussie (245ms)"** |
| `GET /operateur/123` | **"Consultation d'opérateur - Réussie (156ms)"** |
| `POST /operateur` | **"Création d'opérateur - Réussie (312ms)"** |
| `PATCH /operateur/123` | **"Modification d'opérateur - Réussie (198ms)"** |
| `DELETE /operateur/123` | **"Suppression d'opérateur - Réussie (87ms)"** |
| `POST /auth/login` | **"Connexion utilisateur - Réussie (423ms)"** |
| `GET /service/stats` | **"Consultation des statistiques de service - Réussie (234ms)"** |

### ✅ **Ce qui est loggé automatiquement :**
- **Toutes les requêtes HTTP** (GET, POST, PUT, PATCH, DELETE)
- **Messages d'action clairs** en français
- **Réponses avec codes de succès** (200, 201, etc.)
- **Erreurs et exceptions** (400, 401, 404, 500, etc.)
- **Durée des requêtes** en millisecondes
- **Adresse IP** de l'utilisateur
- **User-Agent** du navigateur
- **Utilisateur connecté** (si authentifié)
- **Métadonnées de la requête**

### 📊 **Exemple de logs automatiques générés :**
```json
{
  "id": 123,
  "userId": 1,
  "action": "CREATE_OPERATEUR",
  "module": "OPERATEUR", 
  "level": "SUCCESS",
  "description": "Création d'opérateur - Réussie (245ms)",
  "ipAddress": "192.168.1.100",
  "metadata": {
    "method": "POST",
    "url": "/operateur",
    "statusCode": 201,
    "duration": 245,
    "userAgent": "Mozilla/5.0...",
    "requestSize": 156,
    "responseSize": 234
  },
  "createdAt": "2026-01-06T10:30:00.000Z",
  "user": {
    "id": 1,
    "nom": "Admin PATNUC",
    "email": "admin@patnuc.com"
  }
}
```

### 🎯 **Catégories de Messages Générés**

#### **Authentification**
- `POST /auth/login` → "Connexion utilisateur"
- `POST /auth/logout` → "Déconnexion utilisateur"  
- `POST /auth/refresh` → "Renouvellement du token"

#### **Gestion des Entités** 
- `GET /entity` → "Liste des {entités}"
- `GET /entity/123` → "Consultation d'{entité}"
- `POST /entity` → "Création d'{entité}"
- `PATCH /entity/123` → "Modification d'{entité}"
- `DELETE /entity/123` → "Suppression d'{entité}"

#### **Actions Spécialisées**
- `GET /entity/stats` → "Consultation des statistiques d'{entité}"
- `GET /entity/export` → "Export des données d'{entité}"
- `POST /entity/123/action` → "Action spécialisée sur {entité}"
- `PATCH /entity` → "Modification multiple d'{entités}"

---

## 🛠️ **Logs Manuels (Pour cas spéciaux)**

### **1️⃣ Via LogHelper (Recommandé)**
```typescript
// Dans un service
constructor(private readonly logHelper: LogHelper) {}

// Logs d'authentification
await this.logHelper.logAuth(
  LogAction.LOGIN,
  'Connexion réussie',
  { 
    userId: user.id, 
    ipAddress: request.ip,
    success: true 
  }
);

// Logs de création
await this.logHelper.logCreate(
  LogModule.OPERATEUR,
  'Nouvel opérateur créé',
  { 
    userId: user.id,
    entityId: operateur.id,
    newValues: { nom: 'Orange', code: 'ORA' }
  }
);

// Logs d'erreur
await this.logHelper.logError(
  LogModule.SYSTEM,
  'Erreur de connexion base de données',
  {
    errorMessage: error.message,
    errorCode: error.code
  }
);
```

### **2️⃣ Via LogService (Plus de contrôle)**
```typescript
// Dans un service
constructor(private readonly logService: LogService) {}

await this.logService.createLog({
  userId: user.id,
  action: LogAction.CUSTOM_ACTION,
  module: LogModule.CUSTOM,
  level: LogLevel.INFO,
  description: 'Action personnalisée',
  ipAddress: request.ip,
  metadata: {
    customData: 'valeur personnalisée'
  }
});
```

---

## 🎯 **Quand utiliser les logs manuels ?**

### ✅ **Utilisez les logs manuels pour :**
- **Actions métier complexes** non couvertes par HTTP
- **Calculs importants** (effet club, statistiques)
- **Processus en arrière-plan** (tâches cron, jobs)
- **Erreurs métier** spécifiques
- **Audits de sécurité** détaillés
- **Workflows multi-étapes**

### ❌ **N'utilisez PAS les logs manuels pour :**
- **Requêtes HTTP basiques** (déjà loggées automatiquement)
- **CRUD simple** (Create, Read, Update, Delete)
- **Authentification standard** (déjà gérée automatiquement)

---

## 📈 **Consultation des logs**

### **API REST (avec JWT)**
```http
# Lister les logs
GET /logs?page=1&limit=20&module=OPERATEUR&level=SUCCESS

# Statistiques
GET /logs/stats

# Export CSV
GET /logs/export?format=csv&startDate=2026-01-01

# Nettoyage (Admin)
DELETE /logs/cleanup/30
```

### **Helper de récupération**
```typescript
// Dans un service
const logs = await this.logService.getLogs({
  module: LogModule.OPERATEUR,
  action: LogAction.CREATE_OPERATEUR,
  startDate: '2026-01-01',
  limit: 50
});

const stats = await this.logService.getLogStats(
  '2026-01-01',
  '2026-01-31'
);
```

---

## 🔧 **Configuration avancée**

### **Désactiver l'auto-logging pour certaines routes**
L'intercepteur ignore automatiquement les routes `/logs/*` pour éviter la récursion.

Pour ignorer d'autres routes, modifiez `logging.interceptor.ts` :
```typescript
// Dans logHttpRequest(), ajoutez :
if (!url.includes('/logs') && !url.includes('/health')) {
  // Votre logique de log
}
```

### **Personnaliser le mapping URL → Module/Action**
Modifiez les méthodes `mapUrlToModule()` et `mapUrlToAction()` dans l'intercepteur.

---

## 🚨 **Bonnes pratiques**

### ✅ **DO**
- Laissez l'auto-logging gérer les requêtes HTTP standard
- Utilisez LogHelper pour les logs métier
- Ajoutez des métadonnées riches pour l'audit
- Nettoyez régulièrement les anciens logs

### ❌ **DON'T**
- Ne loggez pas manuellement les requêtes HTTP basiques
- N'oubliez pas les informations de contexte (userId, IP)
- N'abusez pas des logs (performance)
- Ne loggez pas de données sensibles (mots de passe)

---

## 🎉 **Résumé**

**Votre système de logging est maintenant 100% automatique !**

- ✅ **Logs automatiques** pour toutes les requêtes HTTP
- ✅ **Logs manuels** pour les cas spéciaux
- ✅ **APIs sécurisées** avec JWT
- ✅ **Export et statistiques** 
- ✅ **Helpers pratiques** pour les développeurs

**Plus besoin de logger manuellement les requêtes basiques !** 🚀
