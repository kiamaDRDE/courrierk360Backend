# Standardisation des Réponses API - Module Offre

## Date de mise à jour
**13 décembre 2025**

## Objectif
Standardiser le format des réponses de l'API du module **Offre** pour qu'il soit cohérent avec le format déjà utilisé dans le module **Operateur**.

## Format Standardisé

Toutes les réponses API suivent maintenant ce format :

```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Titre descriptif de l'opération",
  "message": "Message convivial pour l'utilisateur",
  "data": {
    // Données de la réponse
  }
}
```

### Avantages de ce format :
✅ **Cohérence** : Même structure pour tous les modules de l'API  
✅ **Clarté** : Le champ `title` indique l'action effectuée  
✅ **User-friendly** : Le champ `message` fournit un message explicite  
✅ **Debugging** : Les champs `statusCode` et `code` facilitent le débogage  
✅ **Frontend** : Facilite l'intégration côté client (affichage de notifications, gestion d'erreurs)

## Méthode Helper Ajoutée

Une méthode helper `formatResponse()` a été ajoutée dans `OffreService` :

```typescript
private formatResponse(data: any, title: string, message: string) {
  return {
    success: true,
    statusCode: 201,
    code: 'success',
    title,
    message,
    data,
  };
}
```

Cette méthode est utilisée par toutes les méthodes du service pour retourner des réponses standardisées.

## Méthodes Standardisées

### 1. createOffre()
**Avant** :
```json
{
  "success": true,
  "message": "Offre créée avec succès",
  "data": { ... }
}
```

**Après** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre créée",
  "message": "L'offre \"Nom de l'offre\" a été créée avec succès.",
  "data": { ... }
}
```

### 2. updateOffre()
**Avant** :
```json
{
  "success": true,
  "message": "Offre modifiée avec succès",
  "data": { ... }
}
```

**Après** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre modifiée",
  "message": "L'offre \"Nom de l'offre\" a été modifiée avec succès.",
  "data": { ... }
}
```

### 3. deleteOffre()
**Avant** :
```json
{
  "success": true,
  "message": "Offre supprimée avec succès"
}
```

**Après** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre supprimée",
  "message": "L'offre avec l'ID 123 a été supprimée avec succès.",
  "data": null
}
```

### 4. listOffres()
**Structure avec pagination** :

```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des offres",
  "message": "10 offre(s) sur 25 récupérée(s) avec succès.",
  "data": {
    "offres": [ ... ],
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

**Améliorations** :
- Ajout de `hasNextPage` et `hasPreviousPage` pour faciliter la navigation
- Message dynamique indiquant le nombre d'offres retournées et le total
- Support de `limit=0` pour récupérer toutes les offres

### 5. getOffreById()
**Avant** :
```json
{
  "success": true,
  "data": { ... }
}
```

**Après** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre récupérée",
  "message": "L'offre \"Nom de l'offre\" a été récupérée avec succès.",
  "data": { ... }
}
```

### 6. getEffetClub()
**Avant** :
```json
{
  "success": true,
  "message": "Effet club calculé et sauvegardé avec succès",
  "data": {
    "idOffre": 1,
    "effetClub": 150.50,
    "isEffetClub": true,
    ...
  }
}
```

**Après** :
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Effet club calculé",
  "message": "L'effet club a été calculé et sauvegardé avec succès.",
  "data": {
    "idOffre": 1,
    "effetClub": 150.50,
    "isEffetClub": true,
    ...
  }
}
```

**Note** : Le champ `isEffetClub` (boolean) est conservé dans la réponse.

### 7. calculerEtSauvegarderEffetClub()
Même format standardisé que `getEffetClub()` avec conservation du champ `isEffetClub`.

## Pagination et Filtres

### Module Offre
✅ **Pagination** : Fonctionnelle avec `page`, `limit`, `hasNextPage`, `hasPreviousPage`  
✅ **Filtres** : `operateurId`, `nom`, `typeOffre`, `destination`, `categorie`, `statut`  
✅ **Support limit=0** : Permet de récupérer toutes les offres  
✅ **Format standardisé** : Réponse encapsulée dans `formatResponse()`

### Module Operateur
✅ **Pagination** : Déjà fonctionnelle avec le même format  
✅ **Filtres** : `nom`, `code`, `type`, `statut`, `annee`  
✅ **Format standardisé** : Déjà implémenté

## Fichiers Modifiés

### src/offre/offre.service.ts
- ✅ Ajout de la méthode `formatResponse()`
- ✅ Mise à jour de `createOffre()`
- ✅ Mise à jour de `updateOffre()`
- ✅ Mise à jour de `deleteOffre()`
- ✅ Mise à jour de `listOffres()` (avec amélioration de la pagination)
- ✅ Mise à jour de `getOffreById()`
- ✅ Mise à jour de `getEffetClub()`
- ✅ Mise à jour de `calculerEtSauvegarderEffetClub()`

## Rétrocompatibilité

⚠️ **Important** : Cette modification change la structure des réponses API. Si vous avez un frontend existant qui utilise ces endpoints, vous devrez mettre à jour le code pour accéder aux données via `response.data.data` au lieu de `response.data`.

### Exemple de migration frontend :

**Avant** :
```javascript
const response = await fetch('/offre');
const offres = response.data;  // Accès direct aux offres
```

**Après** :
```javascript
const response = await fetch('/offre');
const { title, message, data } = response;
const { offres, pagination } = data;  // Accès via data
```

## Test des Endpoints

Après cette standardisation, tous les endpoints du module Offre retournent le même format de réponse :

- ✅ `POST /offre` - Créer une offre
- ✅ `PATCH /offre/:id` - Modifier une offre
- ✅ `DELETE /offre/:id` - Supprimer une offre
- ✅ `GET /offre` - Lister les offres avec pagination/filtres
- ✅ `GET /offre/:id` - Récupérer une offre par ID
- ✅ `GET /offre/:id/effet-club` - Calculer et sauvegarder l'effet club
- ✅ `POST /offre/:id/calculer-effet-club` - Calculer et sauvegarder l'effet club

## Prochaines Étapes

1. ✅ Vérifier qu'il n'y a pas d'erreurs de compilation TypeScript
2. ⏳ Tester tous les endpoints pour valider le format des réponses
3. ⏳ Mettre à jour la documentation Swagger si nécessaire
4. ⏳ Mettre à jour le frontend pour utiliser le nouveau format
5. ⏳ Standardiser les autres modules (User, TypeAppel, etc.) si nécessaire

## Conclusion

Le module **Offre** utilise maintenant le même format de réponse standardisé que le module **Operateur**, ce qui garantit la cohérence de l'API et facilite l'intégration côté frontend. Les champs `title` et `message` permettent d'afficher des notifications conviviales à l'utilisateur, tandis que les champs `statusCode` et `code` facilitent la gestion des erreurs et le débogage.
