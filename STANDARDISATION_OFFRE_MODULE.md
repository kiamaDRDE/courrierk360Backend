# Standardisation du Format de Réponse API - Module Offre

## Modifications Appliquées

J'ai standardisé toutes les APIs du module **Offre** pour qu'elles utilisent le même format de réponse que le module **Signup**.

### Format Standardisé Appliqué

```typescript
{
  success: boolean;        // Statut de réussite
  statusCode: number;      // Code HTTP
  code: string;           // Code applicatif ('success' ou 'failure')
  title: string;          // Titre descriptif
  message: string;        // Message détaillé
  data: T | null;         // Données ou tableau vide en cas d'erreur
}
```

## APIs Modifiées

### 1. POST /offre - Créer une offre
- ✅ Format standardisé appliqué
- ✅ Exemples détaillés avec services multiples
- ✅ Gestion des erreurs 400, 409, 401, 500

### 2. PATCH /offre/:id - Modifier une offre
- ✅ Format standardisé appliqué
- ✅ Exemples de modification avec services
- ✅ Gestion des erreurs 404, 400

### 3. DELETE /offre/:id - Supprimer une offre
- ✅ Format standardisé appliqué
- ✅ Réponse avec data: null pour suppression
- ✅ Gestion de l'erreur 404

### 4. GET /offre - Lister les offres
- ✅ Format standardisé appliqué
- ✅ Exemples avec pagination
- ✅ Structure cohérente pour les listes

### 5. GET /offre/:id - Obtenir une offre
- ✅ Format standardisé appliqué
- ✅ Données complètes avec opérateur et services
- ✅ Gestion de l'erreur 404

### 6. GET /offre/:id/effet-club - Calculer l'effet club
- ✅ Format standardisé appliqué
- ✅ Données détaillées du calcul
- ✅ Gestion des erreurs

### 7. POST /offre/:id/calculer-effet-club - Calculer et sauvegarder l'effet club
- ✅ Format standardisé appliqué
- ✅ Réponse complète avec tous les détails du calcul
- ✅ Gestion des erreurs

## Réponses d'Erreur Communes

### Authentification (401)
```json
{
  "success": false,
  "statusCode": 401,
  "code": "failure",
  "title": "UnauthorizedException",
  "message": "Token d'authentification requis.",
  "data": []
}
```

### Validation (400)
```json
{
  "success": false,
  "statusCode": 400,
  "code": "failure",
  "title": "BadRequestException",
  "message": "Données de requête invalides.",
  "data": []
}
```

### Ressource introuvable (404)
```json
{
  "success": false,
  "statusCode": 404,
  "code": "failure",
  "title": "NotFoundException",
  "message": "Offre avec l'ID 999 introuvable.",
  "data": []
}
```

### Conflit (409)
```json
{
  "success": false,
  "statusCode": 409,
  "code": "failure",
  "title": "ConflictException",
  "message": "Une offre avec ce nom existe déjà pour cet opérateur.",
  "data": []
}
```

### Erreur serveur (500)
```json
{
  "success": false,
  "statusCode": 500,
  "code": "failure",
  "title": "InternalServerErrorException",
  "message": "Error 500: Server error.",
  "data": []
}
```

## Exemples de Réponses de Succès

### Création d'offre
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Offre créée",
  "message": "L'offre \"Forfait Mobile Premium\" a été créée avec succès avec 2 service(s) associé(s).",
  "data": {
    "id": 1,
    "operateurId": 1,
    "nom": "Forfait Mobile Premium",
    "typeOffre": "Prépayé",
    "statut": "Actif",
    "effetClub": 15.5,
    "createdAt": "2025-01-05T10:30:00.000Z",
    "updatedAt": "2025-01-05T10:30:00.000Z"
  }
}
```

### Liste d'offres avec pagination
```json
{
  "success": true,
  "statusCode": 200,
  "code": "success",
  "title": "Liste des offres",
  "message": "2 offre(s) récupérée(s) avec succès.",
  "data": {
    "offres": [...],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

## Cohérence avec le Service

Le service `OffreService` utilise déjà la méthode `formatResponse()` qui génère le bon format :

```typescript
private formatResponse(data: any, title: string, message: string) {
  return {
    success: true,
    statusCode: 201, // ou 200 selon le contexte
    code: 'success',
    title,
    message,
    data,
  };
}
```

## Bénéfices pour le Frontend

1. **Cohérence** : Même structure de réponse sur toutes les APIs
2. **Gestion d'erreurs simplifiée** : Format uniforme pour toutes les erreurs
3. **Exemples complets** : Documentation Swagger riche avec des exemples réels
4. **Intégration facilitée** : Le frontend peut utiliser la même logique de gestion des réponses

## Status

✅ **TERMINÉ** - Toutes les APIs du module Offre utilisent maintenant le format standardisé du module Signup.

L'application démarre correctement sans erreurs et la documentation Swagger est disponible sur :
- Module Offre : http://localhost:3000/offre-doc
- Tous modules : http://localhost:3000
