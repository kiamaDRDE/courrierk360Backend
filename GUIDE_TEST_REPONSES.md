# Guide de Test - Format de Réponse Standardisé

## Prérequis
- Application en cours d'exécution sur `http://localhost:3000`
- Token JWT valide pour l'authentification

## Obtenir un Token JWT

```bash
# 1. Se connecter pour obtenir un token
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre_email@example.com",
    "motDePasse": "votre_mot_de_passe"
  }'

# Réponse :
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Connexion réussie",
  "message": "Vous êtes maintenant connecté.",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": { ... }
  }
}
```

⚠️ Utilisez le `accessToken` dans l'en-tête `Authorization: Bearer <token>` pour les requêtes suivantes.

## Tests des Endpoints du Module Offre

### 1. Créer une Offre
```bash
curl -X POST http://localhost:3000/offre \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operateurId": 1,
    "nom": "Offre Test Standard",
    "typeOffre": "Prépayé",
    "destination": "National",
    "categorie": "Mobile",
    "tva": 19.25,
    "prixOnNet": 100,
    "prixOffNet": 150,
    "statut": "Actif"
  }'
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre créée",
  "message": "L'offre \"Offre Test Standard\" a été créée avec succès.",
  "data": {
    "id": 1,
    "nom": "Offre Test Standard",
    "operateurId": 1,
    "typeOffre": "Prépayé",
    ...
  }
}
```

### 2. Lister les Offres avec Pagination
```bash
# Sans filtres
curl -X GET "http://localhost:3000/offre?page=1&limit=10" \
  -H "Authorization: Bearer <votre_token>"

# Avec filtres
curl -X GET "http://localhost:3000/offre?page=1&limit=10&typeOffre=Prépayé&statut=Actif" \
  -H "Authorization: Bearer <votre_token>"

# Récupérer toutes les offres (sans pagination)
curl -X GET "http://localhost:3000/offre?limit=0" \
  -H "Authorization: Bearer <votre_token>"
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des offres",
  "message": "10 offre(s) sur 25 récupérée(s) avec succès.",
  "data": {
    "offres": [
      {
        "id": 1,
        "nom": "Offre Test",
        ...
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 3. Récupérer une Offre par ID
```bash
curl -X GET http://localhost:3000/offre/1 \
  -H "Authorization: Bearer <votre_token>"
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre récupérée",
  "message": "L'offre \"Offre Test Standard\" a été récupérée avec succès.",
  "data": {
    "id": 1,
    "nom": "Offre Test Standard",
    ...
  }
}
```

### 4. Modifier une Offre
```bash
curl -X PATCH http://localhost:3000/offre/1 \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Offre Test Modifiée",
    "prixOnNet": 120,
    "statut": "Inactif"
  }'
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre modifiée",
  "message": "L'offre \"Offre Test Modifiée\" a été modifiée avec succès.",
  "data": {
    "id": 1,
    "nom": "Offre Test Modifiée",
    "prixOnNet": 120,
    ...
  }
}
```

### 5. Calculer l'Effet Club
```bash
# GET endpoint
curl -X GET http://localhost:3000/offre/1/effet-club \
  -H "Authorization: Bearer <votre_token>"

# POST endpoint (même résultat)
curl -X POST http://localhost:3000/offre/1/calculer-effet-club \
  -H "Authorization: Bearer <votre_token>"
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Effet club calculé",
  "message": "L'effet club a été calculé et sauvegardé avec succès.",
  "data": {
    "idOffre": 1,
    "nomOffre": "Offre Test",
    "operateur": {
      "id": 1,
      "nom": "MTN",
      "code": "MTN"
    },
    "prixOffNet": 150,
    "prixOnNet": 100,
    "taOperateur": 25.5,
    "sommeAutresOperateurs": 52.5,
    "nombreAutresOperateurs": 2,
    "taMoyen": 26.25,
    "effetClub": 150.5,
    "resultat": "Effet club - Potentiel abus de position dominante",
    "isEffetClub": true
  }
}
```

**Note** : Le champ `isEffetClub` est `true` si `effetClub > 0`, sinon `false`.

### 6. Supprimer une Offre
```bash
curl -X DELETE http://localhost:3000/offre/1 \
  -H "Authorization: Bearer <votre_token>"
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre supprimée",
  "message": "L'offre avec l'ID 1 a été supprimée avec succès.",
  "data": null
}
```

## Tests des Endpoints du Module Operateur

### Lister les Opérateurs avec Pagination
```bash
# Sans filtres
curl -X GET "http://localhost:3000/operateur?page=1&limit=10" \
  -H "Authorization: Bearer <votre_token>"

# Avec filtres
curl -X GET "http://localhost:3000/operateur?page=1&limit=10&type=Mobile&statut=Actif&annee=2025" \
  -H "Authorization: Bearer <votre_token>"

# Récupérer tous les opérateurs
curl -X GET "http://localhost:3000/operateur?limit=0" \
  -H "Authorization: Bearer <votre_token>"
```

**Format de réponse attendu** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des opérateurs",
  "message": "2 opérateur(s) récupéré(s) sur 2 au total.",
  "data": {
    "operateurs": [
      {
        "id": 1,
        "nom": "MTN Cameroon",
        "code": "MTN",
        "type": "Mobile",
        "statut": "Actif",
        "annee": 2025,
        ...
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## Vérifications à Effectuer

### ✅ Structure de Réponse
- [ ] Tous les endpoints retournent les champs : `success`, `statusCode`, `code`, `title`, `message`, `data`
- [ ] Le champ `success` est `true` pour les succès
- [ ] Le champ `statusCode` est `201` pour les succès
- [ ] Le champ `code` est `'success'` pour les succès
- [ ] Le champ `title` décrit l'action effectuée
- [ ] Le champ `message` fournit un message convivial

### ✅ Pagination
- [ ] Le champ `pagination` contient : `total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPreviousPage`
- [ ] `hasNextPage` est `true` s'il y a une page suivante
- [ ] `hasPreviousPage` est `true` s'il y a une page précédente
- [ ] `limit=0` retourne toutes les données

### ✅ Filtres
- [ ] Les filtres du module Offre fonctionnent : `operateurId`, `nom`, `typeOffre`, `destination`, `categorie`, `statut`
- [ ] Les filtres du module Operateur fonctionnent : `nom`, `code`, `type`, `statut`, `annee`

### ✅ Effet Club
- [ ] Le champ `isEffetClub` est présent dans les réponses GET/POST effet-club
- [ ] `isEffetClub` est `true` si `effetClub > 0`, sinon `false`
- [ ] Les calculs d'effet club sont corrects

## Utilisation avec Postman

1. **Créer une collection Postman**
2. **Configurer l'authentification** :
   - Dans l'onglet "Authorization" de la collection
   - Type : "Bearer Token"
   - Token : Coller le `accessToken` obtenu lors de la connexion

3. **Créer des requêtes pour chaque endpoint** avec les exemples ci-dessus

4. **Vérifier le format des réponses** dans l'onglet "Response" de Postman

## Documentation Swagger

Pour tester via Swagger UI :

1. Accéder à `http://localhost:3000/api`
2. Cliquer sur "Authorize" (🔒)
3. Entrer le token : `Bearer <votre_token>`
4. Tester les endpoints directement depuis l'interface Swagger

## Conclusion

Tous les endpoints des modules **Offre** et **Operateur** retournent maintenant le même format standardisé, garantissant la cohérence de l'API et facilitant l'intégration côté frontend.

### Format Standard
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Titre de l'action",
  "message": "Message convivial",
  "data": {
    // Données (peut être un objet, un tableau, ou null)
  }
}
```

### Format Liste (avec pagination)
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des ressources",
  "message": "X ressource(s) récupérée(s)",
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```
