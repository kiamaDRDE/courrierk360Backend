# APIs de Mise à Jour en Lot

Ce document décrit les nouvelles APIs créées pour mettre à jour plusieurs entités à la fois, ainsi que les règles de création des avantages.

## Avantage - Création avec valeur par défaut

### Endpoint
```
POST /avantages
```

### Description
Crée plusieurs avantages. Si le champ `valeur` n'est pas renseigné, il prend automatiquement la valeur 0 par défaut.

### Corps de la requête
```json
{
  "avantages": [
    {
      "nom": "SMS illimités", 
      "valeur": 0  // Valeur explicite
    },
    {
      "nom": "Appels illimités"
      // valeur non renseignée = valeur par défaut 0
    },
    {
      "nom": "Réduction 20%", 
      "valeur": 20
    }
  ],
  "offreId": 1  // Optionnel : associer tous les avantages à cette offre
}
```

### Règles importantes
- **Le champ `valeur` est optionnel** : s'il n'est pas fourni, la valeur par défaut est 0
- **Le champ `nom` est obligatoire** et doit être unique
- **Le champ `offreId` est optionnel** : permet d'associer tous les avantages créés à une offre

---

## Structure Tarifaire - Mise à jour multiple

### Endpoint
```
PATCH /structure-tarifaire
```

### Description
Met à jour plusieurs structures tarifaires en une seule opération.

### Corps de la requête
```json
{
  "structures": [
    {
      "id": 1,
      "nom": "Tarification Standard Modifiée",
      "valeur": 30.00
    },
    {
      "id": 2,
      "nom": "Tarification Premium Modifiée", 
      "valeur": 50.00
    },
    {
      "id": 3,
      "valeur": 15.25
      // nom non renseigné = pas de modification du nom
    }
  ]
}
```

### Réponse de succès (200)
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Structures mises à jour",
  "message": "3 structure(s) tarifaire(s) mise(s) à jour avec succès.",
  "data": [
    {
      "id": 1,
      "nom": "Tarification Standard Modifiée",
      "valeur": 30.00,
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2026-01-05T15:45:00.000Z"
    },
    {
      "id": 2,
      "nom": "Tarification Premium Modifiée",
      "valeur": 50.00,
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2026-01-05T15:45:00.000Z"
    },
    {
      "id": 3,
      "nom": "Tarification Basic",
      "valeur": 15.25,
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2026-01-05T15:45:00.000Z"
    }
  ]
}
```

### Erreurs possibles
- **404**: Une ou plusieurs structures tarifaires introuvables
- **409**: Conflit de noms avec des structures existantes

---

## Avantage - Mise à jour multiple

### Endpoint
```
PATCH /avantages
```

### Description
Met à jour plusieurs avantages en une seule opération.

### Corps de la requête
```json
{
  "avantages": [
    {
      "id": 1,
      "nom": "SMS illimités Premium",
      "valeur": 0,
      "offreId": 2
    },
    {
      "id": 2,
      "nom": "Appels illimités Modifiés"
      // valeur et offreId non renseignés = pas de modification de ces champs
    },
    {
      "id": 3,
      "valeur": 25.00
      // nom non renseigné = pas de modification du nom
    }
  ]
}
```

### Réponse de succès (200)
```json
{
  "success": true,
  "statusCode": 200,
  "code": "AVANTAGES_UPDATED",
  "title": "Avantages modifiés avec succès",
  "message": "Les avantages ont été modifiés avec succès",
  "data": [
    {
      "id": 1,
      "nom": "SMS illimités Premium",
      "valeur": 0,
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2026-01-05T16:45:00.000Z",
      "offres": [
        {
          "id": 2,
          "nom": "Forfait Standard"
        }
      ]
    },
    {
      "id": 2,
      "nom": "Appels illimités Modifiés",
      "valeur": 15.50,
      "createdAt": "2025-12-31T14:30:00.000Z",
      "updatedAt": "2026-01-05T16:45:00.000Z",
      "offres": []
    }
  ]
}
```

### Erreurs possibles
- **404**: Un ou plusieurs avantages introuvables
- **409**: Conflit de noms avec des avantages existants ou offres introuvables
- **400**: Données de requête invalides

---

## Caractéristiques communes

### Validation
- Chaque élément doit avoir un ID valide existant dans la base de données
- Les noms doivent rester uniques s'ils sont modifiés
- Pour les avantages, les `offreId` doivent exister s'ils sont spécifiés

### Comportement
- Si un champ optionnel n'est pas renseigné, il n'est pas modifié
- Les mises à jour sont effectuées de manière atomique
- En cas d'erreur sur un élément, l'ensemble de l'opération échoue

### Authentification
- Ces APIs nécessitent un token JWT valide
- Utiliser le header `Authorization: Bearer <token>`
