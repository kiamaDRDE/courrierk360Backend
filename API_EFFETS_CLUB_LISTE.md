# API Effet de Club - Liste Complète

## Nouvelle API créée

### Endpoint
```
GET /offres/effets-club/all
```

### Description
Récupère tous les effets de club calculés pour les offres avec des filtres avancés et de la pagination.

## Paramètres de requête (Query Parameters)

### Pagination
- **page** (optionnel) : Numéro de la page (défaut: 1)
- **limit** (optionnel) : Nombre d'éléments par page (défaut: 10)

### Filtres de base
- **operateurId** (optionnel) : ID de l'opérateur
- **offreId** (optionnel) : ID d'une offre spécifique
- **nom** (optionnel) : Recherche partielle dans le nom de l'offre
- **typeOffre** (optionnel) : Type d'offre (Prépayé, Postpayé, etc.)
- **statut** (optionnel) : Statut de l'offre (Actif, Inactif, etc.)

### Filtres par dates
- **annee** (optionnel) : Année de début de validité (ex: 2025)
- **dateDebut** (optionnel) : Date de début personnalisée (YYYY-MM-DD)
- **dateFin** (optionnel) : Date de fin personnalisée (YYYY-MM-DD)

### Filtres par effet de club
- **isEffetClub** (optionnel) : true pour seulement les effets positifs
- **effetClubMin** (optionnel) : Valeur minimale de l'effet de club
- **effetClubMax** (optionnel) : Valeur maximale de l'effet de club

### Tri
- **sortBy** (optionnel) : Champ de tri 
  - Options: `nom`, `dateDebutValidite`, `dateFinValidite`, `effetClub`, `taOperateur`, `taMoyen`, `createdAt`
  - Défaut: `dateDebutValidite`
- **sortOrder** (optionnel) : Ordre de tri (`asc` ou `desc`, défaut: `desc`)

## Exemples d'utilisation

### 1. Récupérer tous les effets de club avec pagination
```bash
GET /offres/effets-club/all?page=1&limit=10
```

### 2. Filtrer par opérateur et année
```bash
GET /offres/effets-club/all?operateurId=1&annee=2025
```

### 3. Récupérer l'effet de club d'une offre spécifique
```bash
GET /offres/effets-club/all?offreId=5
```

### 4. Seulement les effets de club positifs, triés par valeur
```bash
GET /offres/effets-club/all?isEffetClub=true&sortBy=effetClub&sortOrder=desc
```

### 5. Plage de valeurs d'effet de club
```bash
GET /offres/effets-club/all?effetClubMin=100&effetClubMax=1000
```

### 6. Filtrer par période personnalisée
```bash
GET /offres/effets-club/all?dateDebut=2025-01-01&dateFin=2025-06-30
```

### 7. Recherche par nom d'offre
```bash
GET /offres/effets-club/all?nom=Premium&typeOffre=Postpayé
```

### 8. Combiner filtre opérateur et offre spécifique
```bash
GET /offres/effets-club/all?operateurId=1&offreId=5
```

## Réponse type

```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Effets de club récupérés",
  "message": "5 effet(s) de club sur 25 récupéré(s) avec succès.",
  "data": {
    "effetsClub": [
      {
        "id": 1,
        "nom": "Forfait Premium 5G",
        "operateur": {
          "id": 1,
          "nom": "MTN",
          "code": "MTN"
        },
        "annee": 2025,
        "dateDebutValidite": "2025-01-01T00:00:00.000Z",
        "dateFinValidite": "2025-12-31T23:59:59.000Z",
        "typeOffre": "Postpayé",
        "statut": "Actif",
        "taOperateur": 25.50,
        "sommeAutresOperateurs": 92.25,
        "nombreAutresOperateurs": 3,
        "taMoyen": 30.75,
        "prixOnNet": 5000.0,
        "prixOffNet": 7500.0,
        "effetClub": 2245.25,
        "isEffetClub": true,
        "resultat": "Effet Club calculé: 2245.2500 (4 options analysées)",
        "createdAt": "2025-01-01T10:00:00.000Z",
        "updatedAt": "2025-01-05T15:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "statistiques": {
      "totalAvecEffetClub": 12,
      "totalSansEffetClub": 13,
      "totalCalcule": 20,
      "totalNonCalcule": 5
    }
  }
}
```

## Informations sur les statistiques

- **totalAvecEffetClub** : Nombre d'offres avec effet de club positif (isEffetClub = true)
- **totalSansEffetClub** : Nombre d'offres sans effet de club ou avec effet négatif
- **totalCalcule** : Nombre d'offres avec un effet de club calculé (non null)
- **totalNonCalcule** : Nombre d'offres sans effet de club calculé (null)

## Cas d'usage typiques

### Pour l'analyse de marché
- Récupérer tous les effets positifs pour identifier les abus de position dominante
- Comparer les effets de club entre opérateurs
- Analyser l'évolution temporelle des effets de club

### Pour le monitoring
- Surveiller les nouvelles offres avec effet de club
- Identifier les offres nécessitant un recalcul
- Générer des rapports de compliance

### Pour les études
- Analyser les corrélations entre types d'offres et effets de club
- Étudier l'impact des tarifs d'interconnexion
- Comparer les stratégies tarifaires des opérateurs
