# Module User - Gestion du Profil et des Activités

## Description
Module sécurisé pour la gestion du profil utilisateur, le changement de mot de passe et le suivi des activités. Toutes les routes nécessitent une authentification via Bearer token JWT.

## 🔐 Authentification
Toutes les routes de ce module sont sécurisées et nécessitent un token JWT dans le header `Authorization`:
```
Authorization: Bearer <votre_token_jwt>
```

Pour obtenir un token JWT :
1. Utilisez l'API `/auth/login` pour obtenir un OTP
2. Vérifiez l'OTP avec `/auth/verify-otp` pour recevoir votre token

## 📋 Routes Disponibles

### 1. GET /user/profile
**Description**: Récupère les informations du profil de l'utilisateur connecté

**Authentification**: ✅ Requise (Bearer Token)

**Réponse** (200):
```json
{
  "success": true,
  "message": "Profil récupéré avec succès",
  "data": {
    "id": 1,
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "numero": "0612345678",
    "fonction": "Développeur",
    "role": "UTILISATEUR"
  }
}
```

---

### 2. PATCH /user/password
**Description**: Change le mot de passe de l'utilisateur connecté

**Authentification**: ✅ Requise (Bearer Token)

**Body**:
```json
{
  "password": "nouveauMotDePasse123",
  "confirmPassword": "nouveauMotDePasse123"
}
```

**Validation**:
- `password`: Requis, minimum 6 caractères
- `confirmPassword`: Requis, doit correspondre à `password`

**Réponse** (200):
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

**Actions automatiques**:
- Hash du nouveau mot de passe (bcrypt)
- Enregistrement dans les logs d'activité (action: "PASSWORD_CHANGE")
- Capture de l'adresse IP

---

### 3. PATCH /user/:id/password
**Description**: Change le mot de passe d'un utilisateur spécifique (fonction admin)

**Authentification**: ✅ Requise (Bearer Token)

**Paramètre URL**:
- `id` (number): ID de l'utilisateur dont on veut changer le mot de passe

**Body**:
```json
{
  "password": "nouveauMotDePasse123",
  "confirmPassword": "nouveauMotDePasse123"
}
```

**Validation**:
- `password`: Requis, minimum 6 caractères
- `confirmPassword`: Requis, doit correspondre à `password`

**Réponse** (200):
```json
{
  "success": true,
  "message": "Mot de passe de l'utilisateur modifié avec succès"
}
```

**Réponse** (404):
```json
{
  "success": false,
  "message": "Utilisateur introuvable"
}
```

**Actions automatiques**:
- Hash du nouveau mot de passe (bcrypt)
- Enregistrement dans les logs (action: "PASSWORD_CHANGE_BY_ADMIN")
- Capture de l'admin connecté et adresse IP

---

### 4. GET /user/activity-logs
**Description**: Récupère les logs d'activité avec pagination et filtres

**Authentification**: ✅ Requise (Bearer Token)

**Paramètres Query** (tous optionnels):
- `page` (number, default: 1): Numéro de page
- `limit` (number, default: 10): Nombre d'éléments par page
- `action` (string): Filtre par type d'action (ex: "PASSWORD_CHANGE")
- `search` (string): Recherche dans la description des logs

**Exemple d'utilisation**:
```
GET /user/activity-logs?page=1&limit=20&action=PASSWORD_CHANGE
GET /user/activity-logs?search=admin&page=2
```

**Réponse** (200):
```json
{
  "success": true,
  "message": "Logs récupérés avec succès",
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 5,
        "action": "PASSWORD_CHANGE",
        "description": "Mot de passe changé",
        "ipAddress": "192.168.1.100",
        "createdAt": "2025-12-12T10:30:00.000Z",
        "user": {
          "nom": "Jean Dupont",
          "email": "jean.dupont@example.com"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

## 🔄 Types d'Actions dans les Logs

Le système enregistre automatiquement les actions suivantes :

| Action | Description | Déclencheur |
|--------|-------------|-------------|
| `PASSWORD_CHANGE` | Changement de mot de passe personnel | PATCH /user/password |
| `PASSWORD_CHANGE_BY_ADMIN` | Changement de mot de passe par admin | PATCH /user/:id/password |

*Note: D'autres actions pourront être ajoutées dans les autres modules (connexion, déconnexion, etc.)*

---

## 🧪 Tester dans Swagger

1. Accédez à http://localhost:3000
2. Cliquez sur le bouton **"Authorize"** en haut à droite (cadenas vert)
3. Entrez votre token JWT dans le format: `Bearer <token>`
4. Cliquez sur **"Authorize"**
5. Testez les routes dans la section **"User"**

---

## 🔒 Sécurité

- **Tokens JWT**: Expiration après 1 heure
- **Hash des mots de passe**: Bcrypt avec 10 rounds de salt
- **Logs d'activité**: Traçabilité complète avec adresse IP
- **Validation**: class-validator sur tous les DTOs
- **Extraction automatique**: Décorateur `@CurrentUser()` pour extraire l'utilisateur du JWT

---

## 🛠️ Architecture Technique

### Fichiers du module:
```
src/user/
├── user.module.ts              # Configuration du module
├── user.controller.ts          # Routes HTTP (4 endpoints)
├── user.service.ts             # Logique métier
├── decorators/
│   └── current-user.decorator.ts  # Extraction du user depuis JWT
└── dto/
    ├── change-password.dto.ts     # Validation changement de password
    └── activity-log-query.dto.ts  # Pagination et filtres des logs
```

### Dépendances:
- **PrismaModule**: Accès à la base de données
- **JwtModule**: Vérification et décodage des tokens
- **bcrypt**: Hash des mots de passe

### Base de données:
- **Table users**: Stockage des utilisateurs
- **Table activity_logs**: Stockage des logs (relation one-to-many avec users)

---

## 📊 Exemples de Cas d'Usage

### Cas 1: Utilisateur change son propre mot de passe
```bash
# 1. Login et obtention du token
POST /auth/login
Body: { "email": "user@example.com" }

# 2. Vérification OTP
POST /auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
# Réponse: { token: "eyJhbGc...", refreshToken: "..." }

# 3. Changement de mot de passe
PATCH /user/password
Authorization: Bearer eyJhbGc...
Body: { 
  "password": "nouveauPassword123",
  "confirmPassword": "nouveauPassword123"
}
```

### Cas 2: Admin consulte les logs d'activité
```bash
# 1. Connexion en tant qu'admin et obtention du token
# (même process que cas 1)

# 2. Récupération des logs avec filtres
GET /user/activity-logs?page=1&limit=20&action=PASSWORD_CHANGE
Authorization: Bearer eyJhbGc...
```

### Cas 3: Admin réinitialise le mot de passe d'un utilisateur
```bash
# 1. Connexion en tant qu'admin
# (même process que cas 1)

# 2. Changement du mot de passe de l'utilisateur ID=5
PATCH /user/5/password
Authorization: Bearer eyJhbGc...
Body: {
  "password": "temporaryPassword123",
  "confirmPassword": "temporaryPassword123"
}
```

---

## 🚀 Prochaines Améliorations Possibles

- [ ] Ajouter un guard RBAC pour restreindre PATCH /user/:id/password aux SUPER_ADMIN uniquement
- [ ] Ajouter des logs d'activité dans les autres modules (auth, signup, forgot-password)
- [ ] Ajouter une route pour consulter son propre historique d'activité
- [ ] Ajouter une notification email lors du changement de mot de passe
- [ ] Ajouter une route pour exporter les logs en CSV/PDF

---

## ✅ Status

**Module User - ✅ Fonctionnel**

- ✅ 4 routes créées et testables
- ✅ Authentification Bearer configurée
- ✅ Logs d'activité enregistrés automatiquement
- ✅ Pagination et filtres sur les logs
- ✅ Documentation Swagger complète
- ✅ Validation des données avec class-validator
