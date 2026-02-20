# Guide d'Intégration JWT Symfony avec NestJS

## 📋 Vue d'ensemble

Ce guide explique comment configurer votre application NestJS pour accepter et valider les tokens JWT générés par une application Symfony utilisant l'algorithme RS256.

## 🔑 Fichiers de Clés

Les clés RSA de Symfony ont été ajoutées à la racine du projet :

- **jwt-symfony-private.pem** : Clé privée chiffrée (pour signer les tokens - optionnel)
- **jwt-symfony-public.pem** : Clé publique (pour valider les tokens - REQUIS)

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez ces lignes à votre fichier `.env` :

```bash
# Validation des tokens Symfony (RS256)
JWT_PUBLIC_KEY_PATH=./jwt-symfony-public.pem

# Signature de tokens (optionnel - uniquement si vous devez créer des tokens)
JWT_PRIVATE_KEY_PATH=./jwt-symfony-private.pem
JWT_PRIVATE_KEY_PASSPHRASE=
```

**Note importante** : La clé privée est chiffrée. Si vous avez besoin de **signer** de nouveaux tokens (pas seulement les valider), vous devrez obtenir le mot de passe (`passphrase`) auprès de l'équipe Symfony et le définir dans `JWT_PRIVATE_KEY_PASSPHRASE`.

### 2. Fichier .env.symfony-jwt

Un fichier d'exemple `.env.symfony-jwt` a été créé avec la configuration complète. Vous pouvez :
- Le renommer en `.env` (si vous n'avez pas encore de fichier .env)
- Copier son contenu dans votre `.env` existant

## 📦 Format des Tokens

### Token Symfony (RS256)

**Header** :
```json
{
  "typ": "JWT",
  "alg": "RS256"
}
```

**Payload** :
```json
{
  "iat": 1771578161,
  "exp": 1771664561,
  "roles": ["ROLE_ADMIN", "ROLE_USER"],
  "username": "test1",
  "id": 1
}
```

### Token NestJS (HS256 ou RS256)

**Payload** :
```json
{
  "id": 1,
  "email": "user@example.com",
  "nom": "Nom",
  "role": "admin",
  "iat": 1771578161,
  "exp": 1771664561
}
```

## 🔄 Compatibilité

L'application NestJS supporte maintenant **DEUX formats de tokens** :

1. **Tokens Symfony** : avec `username` et `roles[]`
2. **Tokens NestJS** : avec `email` et `role`

La stratégie JWT détecte automatiquement le format et :
- Valide le token avec la clé appropriée (RS256 ou HS256)
- Récupère l'utilisateur dans la base de données via son `id`
- Retourne un objet utilisateur standardisé pour l'application

## 🧪 Tester la Configuration

### Script de test

Un script de test `test-symfony-jwt.js` a été créé pour vérifier que tout fonctionne :

```bash
node test-symfony-jwt.js
```

Ce script va :
1. Décoder le token Symfony fourni
2. Vérifier sa signature avec la clé publique
3. Afficher les informations du payload
4. Vérifier la date d'expiration

### Test avec l'API NestJS

Une fois l'application démarrée, testez avec :

```bash
curl -X GET http://localhost:3000/api/endpoint-protege \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
```

Remplacez `endpoint-protege` par n'importe quel endpoint protégé par `@UseGuards(JwtAuthGuard)`.

## 🔐 Sécurité

### Clé Privée Chiffrée

La clé privée Symfony est chiffrée avec un mot de passe. C'est une bonne pratique de sécurité.

**Pour la validation uniquement** (cas le plus courant) :
- ✅ Seule la clé publique est nécessaire
- ✅ Pas besoin du mot de passe
- ✅ L'application NestJS peut valider les tokens Symfony

**Pour signer des tokens** (optionnel) :
- ⚠️ Vous devez obtenir le mot de passe de la clé privée
- ⚠️ Configurez `JWT_PRIVATE_KEY_PASSPHRASE` dans `.env`

### Recommandations

1. **Ne committez jamais les clés privées** dans Git
   - Ajoutez `*.pem` à `.gitignore`
   - Ajoutez `.env` à `.gitignore`

2. **En production** :
   - Stockez les clés dans des variables d'environnement sécurisées
   - Ou utilisez un gestionnaire de secrets (AWS Secrets Manager, Azure Key Vault, etc.)

3. **Rotation des clés** :
   - Si Symfony change ses clés, mettez à jour les fichiers `.pem`
   - Redémarrez l'application NestJS

## 🔧 Modifications Apportées

### 1. src/auth/auth.module.ts

- Ajout de la fonction `loadJwtKey()` pour charger les clés depuis des fichiers
- Support de `JWT_PRIVATE_KEY_PATH` et `JWT_PUBLIC_KEY_PATH`
- Configuration automatique de l'algorithme (RS256 si clés RSA, sinon HS256)

### 2. src/auth/strategies/jwt.strategy.ts

- Ajout de la fonction `loadJwtPublicKey()` pour charger la clé publique
- Support de deux formats de payload (Symfony et NestJS)
- Détection automatique du format via les champs présents
- Récupération complète de l'utilisateur avec ses relations (role, service)
- Retour d'un objet utilisateur standardisé

### 3. .env.example

- Ajout de la documentation pour JWT_PRIVATE_KEY, JWT_PUBLIC_KEY
- Instructions pour les chemins de fichiers (JWT_*_PATH)
- Documentation du JWT_PRIVATE_KEY_PASSPHRASE

## 📊 Flux d'Authentification

```
┌─────────────────┐
│ Application     │
│ Symfony         │
│ (RS256)         │
└────────┬────────┘
         │
         │ Génère token JWT
         │ avec clé privée
         │
         ▼
┌─────────────────────────────────────────┐
│ Token JWT                               │
│ Header: { alg: "RS256" }                │
│ Payload: { id, username, roles, ... }   │
│ Signature: [signé avec clé privée]      │
└────────┬────────────────────────────────┘
         │
         │ Envoyé dans Header
         │ Authorization: Bearer <token>
         │
         ▼
┌─────────────────┐
│ Application     │
│ NestJS          │
│ (ce projet)     │
└────────┬────────┘
         │
         │ 1. JwtStrategy.validate()
         │    ├─ Vérifie signature avec clé publique
         │    ├─ Décode le payload
         │    └─ Détecte format Symfony
         │
         │ 2. Récupère user dans DB (by id)
         │
         │ 3. Retourne objet user standardisé
         │    { id, email, nom, username, role, ... }
         │
         ▼
┌─────────────────┐
│ Controller      │
│ @CurrentUser()  │
│ user: User      │
└─────────────────┘
```

## ⚡ Démarrage Rapide

1. **Copiez la configuration** :
   ```bash
   cp .env.symfony-jwt .env
   ```
   Ou ajoutez les lignes à votre `.env` existant.

2. **Testez la validation** :
   ```bash
   node test-symfony-jwt.js
   ```

3. **Démarrez l'application** :
   ```bash
   npm run start:dev
   ```

4. **Testez un endpoint protégé** avec un token Symfony :
   ```bash
   curl -X GET http://localhost:3000/api/user/profile \
     -H "Authorization: Bearer <token-symfony>"
   ```

## ❓ FAQ

### Q: Puis-je utiliser les tokens Symfony ET NestJS en même temps ?

**R:** Oui ! L'application détecte automatiquement le format et valide avec la bonne clé.

### Q: Dois-je modifier mes endpoints existants ?

**R:** Non ! Les endpoints utilisant `@UseGuards(JwtAuthGuard)` fonctionneront automatiquement avec les deux types de tokens.

### Q: Que se passe-t-il si l'utilisateur n'existe pas dans la base NestJS ?

**R:** La validation échoue avec une erreur 401 "Utilisateur introuvable". L'utilisateur doit exister dans la base de données NestJS avec le même `id` que dans Symfony.

### Q: Comment synchroniser les utilisateurs entre Symfony et NestJS ?

**R:** Vous avez plusieurs options :
1. Base de données partagée
2. API de synchronisation
3. Webhook lors de la création d'utilisateurs
4. Migration ponctuelle des données

### Q: Le mot de passe de la clé privée est-il obligatoire ?

**R:** Non, seulement si vous voulez **signer** de nouveaux tokens. Pour **valider** les tokens Symfony existants, seule la clé publique est nécessaire (pas de mot de passe).

## 📝 Notes Importantes

1. **Token expiré** : Le token d'exemple fourni expire le 22 février 2026. Pour tester, générez un nouveau token depuis Symfony.

2. **Synchronisation des utilisateurs** : L'utilisateur avec `id: 1` et `username: test1` doit exister dans votre base de données NestJS.

3. **Clé privée chiffrée** : Si vous avez besoin du mot de passe, contactez l'équipe Symfony.

4. **Production** : En production, utilisez des variables d'environnement au lieu de fichiers pour stocker les clés.

## 🎯 Résumé

✅ **Configurations terminées** :
- Clés RSA Symfony ajoutées (private + public)
- Module auth.module.ts modifié pour charger les clés depuis des fichiers
- Stratégie JWT adaptée pour supporter le format Symfony
- Script de test créé
- Documentation complète

✅ **Fonctionnalités** :
- Support RS256 (Symfony) et HS256 (NestJS)
- Détection automatique du format de token
- Validation avec la clé publique Symfony
- Compatible avec les endpoints existants

🚀 **Prêt à l'emploi** : Configurez votre `.env` et testez !
