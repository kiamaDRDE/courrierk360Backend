# Format de Réponse API - Module Type d'Appel

## Vue d'ensemble

Ce document décrit le format standardisé des réponses API pour le module **Type d'Appel**. Toutes les réponses suivent un format cohérent basé sur la classe `ResponseApi<T>` pour faciliter l'intégration frontend.

## Structure de Réponse Standardisée

```typescript
{
  success: boolean;        // Indique le succès ou l'échec de l'opération
  statusCode: number;      // Code de statut HTTP
  code: string;           // Code d'erreur/succès spécifique à l'application
  title: string;          // Titre de la réponse
  message: string;        // Message descriptif
  data: T | null;         // Données de la réponse (null en cas d'erreur)
}
```

## Endpoints et Exemples de Réponses

### 1. POST /type-appel - Créer un/des type(s) d'appel

#### Création réussie (plusieurs types)
```json
{
  "success": true,
  "statusCode": 201,
  "code": "TYPES_APPEL_CREATED",
  "title": "Succès",
  "message": "3 type(s) d'appel créé(s) avec succès",
  "data": [
    {
      "id": 1,
      "libelle": "Appel national",
      "description": "Appels effectués vers des numéros nationaux",
      "categorie": "Fixe",
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2025-12-31T14:30:00.000Z"
    },
    {
      "id": 2,
      "libelle": "Appel international",
      "description": "Appels effectués vers des numéros internationaux",
      "categorie": "Mobile",
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2025-12-31T14:30:00.000Z"
    }
  ]
}
```

#### Erreur de conflit (409)
```json
{
  "success": false,
  "statusCode": 409,
  "code": "TYPES_APPEL_CONFLICT",
  "title": "Conflit",
  "message": "Des types d'appel avec les libellés suivants existent déjà : Appel national, Appel local",
  "data": null
}
```

### 2. PATCH /type-appel/:id - Modifier un type d'appel

#### Modification réussie
```json
{
  "success": true,
  "statusCode": 200,
  "code": "TYPE_APPEL_UPDATED",
  "title": "Succès",
  "message": "Type d'appel modifié avec succès",
  "data": {
    "id": 1,
    "libelle": "Appel national modifié",
    "description": "Description mise à jour pour les appels nationaux",
    "categorie": "Mobile",
    "createdAt": "2025-12-31T14:30:00.000Z",
    "updatedAt": "2026-01-05T10:15:00.000Z"
  }
}
```

#### Type d'appel non trouvé (404)
```json
{
  "success": false,
  "statusCode": 404,
  "code": "TYPE_APPEL_NOT_FOUND",
  "title": "Erreur",
  "message": "Type d'appel avec l'ID 999 introuvable",
  "data": null
}
```

### 3. DELETE /type-appel/:id - Supprimer un type d'appel

#### Suppression réussie
```json
{
  "success": true,
  "statusCode": 200,
  "code": "TYPE_APPEL_DELETED",
  "title": "Succès",
  "message": "Type d'appel supprimé avec succès",
  "data": null
}
```

### 4. GET /type-appel - Lister les types d'appel

#### Liste avec pagination
```json
{
  "success": true,
  "statusCode": 200,
  "code": "TYPES_APPEL_RETRIEVED",
  "title": "Succès",
  "message": "Liste des types d'appel récupérée avec succès",
  "data": [
    {
      "id": 1,
      "libelle": "Appel national",
      "description": "Appels effectués vers des numéros nationaux",
      "categorie": "Fixe",
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2025-12-31T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

#### Liste vide
```json
{
  "success": true,
  "statusCode": 200,
  "code": "TYPES_APPEL_RETRIEVED",
  "title": "Succès",
  "message": "Liste des types d'appel récupérée avec succès",
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

### 5. GET /type-appel/:id - Obtenir un type d'appel spécifique

#### Type d'appel trouvé
```json
{
  "success": true,
  "statusCode": 200,
  "code": "TYPE_APPEL_RETRIEVED",
  "title": "Succès",
  "message": "Type d'appel récupéré avec succès",
  "data": {
    "id": 1,
    "libelle": "Appel national",
    "description": "Appels effectués vers des numéros nationaux",
    "categorie": "Fixe",
    "createdAt": "2025-12-31T14:30:00.000Z",
    "updatedAt": "2025-12-31T14:30:00.000Z"
  }
}
```

## Codes d'Erreur Communes

### Erreurs d'Authentification
```json
{
  "success": false,
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "title": "Erreur d'authentification",
  "message": "Token d'authentification requis",
  "data": null
}
```

### Erreurs de Permission
```json
{
  "success": false,
  "statusCode": 403,
  "code": "FORBIDDEN",
  "title": "Accès interdit",
  "message": "Permissions insuffisantes pour accéder à cette ressource",
  "data": null
}
```

### Erreurs de Validation
```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "title": "Erreur de validation",
  "message": "Données de requête invalides",
  "data": {
    "errors": [
      {
        "field": "libelle",
        "message": "Le libellé est obligatoire"
      },
      {
        "field": "categorie",
        "message": "La catégorie doit être soit \"Fixe\" soit \"Mobile\""
      }
    ]
  }
}
```

### Erreurs de Paramètre
```json
{
  "success": false,
  "statusCode": 400,
  "code": "INVALID_PARAMETER",
  "title": "Erreur de paramètre",
  "message": "L'ID doit être un nombre entier positif",
  "data": null
}
```

## Paramètres de Requête

### GET /type-appel (avec filtres)

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `page` | number | Numéro de la page (défaut: 1) | `?page=2` |
| `limit` | number | Nombre d'éléments par page (défaut: 10, 0 = tous) | `?limit=5` |
| `libelle` | string | Filtre par libellé (contient) | `?libelle=national` |
| `categorie` | string | Filtre par catégorie exacte | `?categorie=Fixe` |

### Exemple avec filtres
```
GET /type-appel?page=1&limit=5&libelle=appel&categorie=Fixe
```

## Utilisation Frontend

### Gestion des Réponses
```javascript
// Exemple d'utilisation avec fetch
const response = await fetch('/api/type-appel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    libelle: 'Appel test',
    categorie: 'Fixe'
  })
});

const result = await response.json();

if (result.success) {
  console.log('Succès:', result.message);
  console.log('Données:', result.data);
} else {
  console.error('Erreur:', result.message);
  // Gérer les erreurs de validation si présentes
  if (result.data?.errors) {
    result.data.errors.forEach(error => {
      console.error(`${error.field}: ${error.message}`);
    });
  }
}
```

### Gestion de la Pagination
```javascript
// Exemple pour la liste avec pagination
const response = await fetch('/api/type-appel?page=1&limit=10');
const result = await response.json();

if (result.success) {
  const { data, pagination } = result;
  console.log('Types d\'appel:', data);
  console.log(`Page ${pagination.page} sur ${pagination.totalPages}`);
  console.log(`Total: ${pagination.total} éléments`);
}
```

## Notes Importantes

1. **Format Cohérent** : Toutes les réponses suivent le même format pour faciliter la gestion côté frontend
2. **Gestion d'Erreurs** : Les erreurs incluent des codes spécifiques pour permettre une gestion appropriée
3. **Données Typées** : Le champ `data` contient les données métier ou `null` en cas d'erreur
4. **Pagination** : Les listes incluent des informations de pagination complètes
5. **Validation** : Les erreurs de validation incluent des détails sur les champs concernés

Cette documentation doit être utilisée comme référence pour l'intégration frontend du module Type d'Appel.
