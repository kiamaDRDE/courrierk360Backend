# Module Tarif d'Interconnexion

Ce module gère les tarifs d'interconnexion des opérateurs par année.

## Description

Un tarif d'interconnexion représente le tarif appliqué par un opérateur pour une année donnée. 

### Contraintes
- Un opérateur peut avoir **plusieurs tarifs d'interconnexion** (un par année)
- Un opérateur **ne peut pas avoir deux tarifs pour la même année** (contrainte unique)
- La suppression d'un opérateur supprime automatiquement tous ses tarifs (CASCADE)

## Structure de la table

```prisma
model TarifInterconnexion {
  id          Int       @id @default(autoincrement())
  operateurId Int
  annee       Int
  tarif       Decimal   @db.Decimal(10, 2)
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  operateur   Operateur @relation(fields: [operateurId], references: [id], onDelete: Cascade)
  
  @@unique([operateurId, annee])
}
```

## Endpoints API

### 1. Créer un tarif d'interconnexion
**POST** `/tarif-interconnexion`

```json
{
  "operateurId": 1,
  "annee": 2025,
  "tarif": 25.50,
  "description": "Tarif applicable pour les appels on-net"
}
```

**Réponse (201)**
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Tarif créé",
  "message": "Tarif d'interconnexion pour \"MTN\" (2025) créé avec succès.",
  "data": {
    "id": 1,
    "operateurId": 1,
    "annee": 2025,
    "tarif": 25.50,
    "description": "Tarif applicable pour les appels on-net",
    "createdAt": "2025-12-16T07:30:00.000Z",
    "updatedAt": "2025-12-16T07:30:00.000Z",
    "operateur": {
      "id": 1,
      "nom": "MTN",
      "code": "MTN",
      "type": "Mobile"
    }
  }
}
```

### 2. Lister les tarifs avec filtres et pagination
**GET** `/tarif-interconnexion?operateurId=1&annee=2025&page=1&limit=10`

**Paramètres de requête**
- `operateurId` (optionnel) : Filtrer par ID de l'opérateur
- `annee` (optionnel) : Filtrer par année
- `page` (optionnel, défaut: 1) : Numéro de page
- `limit` (optionnel, défaut: 10) : Nombre d'éléments par page (0 = tous)

**Réponse (200)**
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des tarifs",
  "message": "2 tarif(s) d'interconnexion sur 5 récupéré(s) avec succès.",
  "data": {
    "tarifs": [
      {
        "id": 1,
        "operateurId": 1,
        "annee": 2025,
        "tarif": 25.50,
        "description": "Tarif applicable pour les appels on-net",
        "createdAt": "2025-12-16T07:30:00.000Z",
        "updatedAt": "2025-12-16T07:30:00.000Z",
        "operateur": {
          "id": 1,
          "nom": "MTN",
          "code": "MTN",
          "type": "Mobile"
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 2,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 3. Obtenir un tarif par ID
**GET** `/tarif-interconnexion/:id`

### 4. Obtenir le tarif d'un opérateur pour une année
**GET** `/tarif-interconnexion/operateur/:operateurId/annee/:annee`

Exemple : `/tarif-interconnexion/operateur/1/annee/2025`

### 5. Mettre à jour un tarif
**PATCH** `/tarif-interconnexion/:id`

```json
{
  "tarif": 26.75,
  "description": "Tarif mis à jour pour 2025"
}
```

### 6. Supprimer un tarif
**DELETE** `/tarif-interconnexion/:id`

## Exemples d'utilisation

### Ajouter les tarifs pour MTN
```bash
# Tarif 2023
curl -X POST http://localhost:3000/tarif-interconnexion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "operateurId": 1,
    "annee": 2023,
    "tarif": 22.50
  }'

# Tarif 2024
curl -X POST http://localhost:3000/tarif-interconnexion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "operateurId": 1,
    "annee": 2024,
    "tarif": 24.00
  }'

# Tarif 2025
curl -X POST http://localhost:3000/tarif-interconnexion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "operateurId": 1,
    "annee": 2025,
    "tarif": 25.50
  }'
```

### Récupérer tous les tarifs d'un opérateur
```bash
curl -X GET "http://localhost:3000/tarif-interconnexion?operateurId=1&limit=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Récupérer le tarif actuel d'un opérateur
```bash
curl -X GET "http://localhost:3000/tarif-interconnexion/operateur/1/annee/2025" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Codes d'erreur

- **400 Bad Request** : Un tarif existe déjà pour cet opérateur et cette année
- **404 Not Found** : Opérateur ou tarif introuvable
- **401 Unauthorized** : Token JWT manquant ou invalide

## Migration depuis l'ancien modèle

Les champs `tarifInterconnection` et `annee` ont été supprimés de la table `operateurs`. Les données existantes ont été automatiquement migrées vers la nouvelle table `tarifs_interconnexion` lors de la migration Prisma.

Si vous avez des données à migrer manuellement, utilisez :

```sql
INSERT INTO tarifs_interconnexion (operateur_id, annee, tarif, created_at, updated_at)
SELECT id, 2025, 25.50, NOW(), NOW()
FROM operateurs
WHERE nom = 'MTN';
```

## Swagger Documentation

La documentation Swagger est disponible à l'adresse :
- Local : http://localhost:3000/api
- Tag : "Tarifs d'interconnexion"

Tous les endpoints sont protégés par JWT et nécessitent un Bearer Token.
