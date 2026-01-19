# API Effet Club Base avec Filtres

## 📋 Description

Cette API permet de récupérer l'effet club d'une offre spécifique selon le **tarif de base uniquement**, avec des filtres pour la période (HC/HP) et le réseau (Onnet/Offnet).

## 🎯 Endpoint

```
GET /offre/effet-club-base/:id
```

## 📝 Paramètres

### Path Parameters
- `id` (number, requis) : ID de l'offre

### Query Parameters
- `periode` (string, requis) : Période - `HC` (Heure Creuse) ou `HP` (Heure Pleine)
- `reseau` (string, requis) : Réseau - `Onnet` ou `Offnet`
- `annee` (number, optionnel) : Année de l'offre (pour validation)

## 📊 Combinaisons possibles et champs retournés

### 1. HC + Offnet
```json
{
  "taBaseOperateurOffnetHC": 75.25,
  "sommeBaseAutresOperateursOffnetHC": 234.90,
  "taMoyenBaseOffnetHC": 78.30,
  "prixOnNet": 150.50,
  "prixOffNet": 175.75,
  "effetClubBaseOffnetHC": 2372.20,
  "resultatBaseOffnetHC": "Effet Club Positif",
  "isEffetClubBaseOffnetHC": true,
  "differentielTarifaire": 3.05,
  "differentielPrix": 25.25
}
```

### 2. HP + Offnet
```json
{
  "taBaseOperateurOffnetHP": 68.40,
  "sommeBaseAutresOperateursOffnetHP": 195.45,
  "taMoyenBaseOffnetHP": 65.15,
  "prixOnNet": 150.50,
  "prixOffNet": 175.75,
  "effetClubBaseOffnetHP": -188.85,
  "resultatBaseOffnetHP": "Effet Club Négatif",
  "isEffetClubBaseOffnetHP": false,
  "differentielTarifaire": -3.25,
  "differentielPrix": 25.25
}
```

### 3. HC + Onnet
```json
{
  "taBaseOperateurOnnetHC": 82.50,
  "sommeBaseAutresOperateursOnnetHC": 236.70,
  "taMoyenBaseOnnetHC": 78.90,
  "prixOnNet": 150.50,
  "prixOffNet": 175.75,
  "effetClubBaseOnnetHC": 850.25,
  "resultatBaseOnnetHC": "Effet Club Positif",
  "isEffetClubBaseOnnetHC": true,
  "differentielTarifaire": -3.60,
  "differentielPrix": 25.25
}
```

### 4. HP + Onnet
```json
{
  "taBaseOperateurOnnetHP": 58.20,
  "sommeBaseAutresOperateursOnnetHP": 187.20,
  "taMoyenBaseOnnetHP": 62.40,
  "prixOnNet": 150.50,
  "prixOffNet": 175.75,
  "effetClubBaseOnnetHP": 1250.75,
  "resultatBaseOnnetHP": "Effet Club Positif",
  "isEffetClubBaseOnnetHP": true,
  "differentielTarifaire": 4.20,
  "differentielPrix": 25.25
}
```

## 🔍 Exemples d'utilisation

### Exemple 1 : Récupérer l'effet club Base HC Offnet
```bash
GET /offre/effet-club-base/1?periode=HC&reseau=Offnet
```

**Réponse :**
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Effet club (Base - HC - Offnet)",
  "message": "Effet club récupéré pour l'offre \"Forfait Premium 5G\"",
  "data": {
    "offre": {
      "id": 1,
      "nom": "Forfait Premium 5G",
      "operateur": {
        "id": 1,
        "nom": "MTN",
        "code": "MTN"
      },
      "dateDebutValidite": "2025-01-01T00:00:00.000Z",
      "dateFinValidite": "2025-12-31T23:59:59.000Z",
      "typeOffre": "Postpayé",
      "statut": "Actif",
      "annee": 2025
    },
    "filtres": {
      "periode": "HC",
      "reseau": "Offnet",
      "typeCalcul": "Base"
    },
    "effetClub": {
      "taBaseOperateurOffnetHC": 75.25,
      "sommeBaseAutresOperateursOffnetHC": 234.90,
      "taMoyenBaseOffnetHC": 78.30,
      "prixOnNet": 150.50,
      "prixOffNet": 175.75,
      "effetClubBaseOffnetHC": 2372.20,
      "resultatBaseOffnetHC": "Effet Club Positif",
      "isEffetClubBaseOffnetHC": true,
      "differentielTarifaire": 3.05,
      "differentielPrix": 25.25
    }
  }
}
```

### Exemple 2 : Récupérer l'effet club Base HP Onnet avec validation de l'année
```bash
GET /offre/effet-club-base/2?periode=HP&reseau=Onnet&annee=2025
```

**Réponse :**
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Effet club (Base - HP - Onnet)",
  "message": "Effet club récupéré pour l'offre \"Forfait Standard\"",
  "data": {
    "offre": {
      "id": 2,
      "nom": "Forfait Standard",
      "operateur": {
        "id": 2,
        "nom": "Orange",
        "code": "ORN"
      },
      "dateDebutValidite": "2025-01-01T00:00:00.000Z",
      "dateFinValidite": "2025-12-31T23:59:59.000Z",
      "typeOffre": "Prépayé",
      "statut": "Actif",
      "annee": 2025
    },
    "filtres": {
      "periode": "HP",
      "reseau": "Onnet",
      "typeCalcul": "Base"
    },
    "effetClub": {
      "taBaseOperateurOnnetHP": 58.20,
      "sommeBaseAutresOperateursOnnetHP": 187.20,
      "taMoyenBaseOnnetHP": 62.40,
      "prixOnNet": 125.30,
      "prixOffNet": 145.60,
      "effetClubBaseOnnetHP": 1250.75,
      "resultatBaseOnnetHP": "Effet Club Positif",
      "isEffetClubBaseOnnetHP": true,
      "differentielTarifaire": 4.20,
      "differentielPrix": 20.30
    }
  }
}
```

## ❌ Gestion des erreurs

### Erreur 400 - Paramètres invalides
```json
{
  "statusCode": 400,
  "message": "La période doit être HC ou HP",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Le réseau doit être Onnet ou Offnet",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "L'offre Forfait Premium est de l'année 2024, pas de l'année 2025",
  "error": "Bad Request"
}
```

### Erreur 404 - Offre introuvable
```json
{
  "statusCode": 404,
  "message": "Offre avec l'ID 999 introuvable",
  "error": "Not Found"
}
```

## 📌 Notes importantes

1. **Type de calcul** : Cette API retourne uniquement les données pour le **tarif de base** (pas Inter)
2. **Filtres obligatoires** : Les paramètres `periode` et `reseau` sont obligatoires
3. **Validation de l'année** : Si le paramètre `annee` est fourni, l'API vérifie que l'offre correspond bien à cette année
4. **Champs dynamiques** : Les noms des champs retournés dans `effetClub` changent selon les filtres appliqués
5. **Calculs supplémentaires** :
   - `differentielTarifaire` = taMoyen - taOperateur
   - `differentielPrix` = prixOffNet - prixOnNet

## 🎯 Cas d'usage

- Analyser l'effet club d'une offre spécifique selon différentes combinaisons période/réseau
- Comparer les résultats entre HC et HP pour une même offre
- Comparer les résultats entre Onnet et Offnet pour une même offre
- Valider que l'offre appartient bien à une année donnée
- Obtenir rapidement les indicateurs clés d'effet club pour une configuration précise

## 🔄 Différence avec les autres APIs

- **`GET /offre/:id/effet-club`** : Calcule ET sauvegarde l'effet club (toutes les combinaisons)
- **`GET /offre/effets-club/all`** : Liste tous les effets club avec 8 blocs (tarif standard)
- **`GET /offre/effets-club/all-revenus_moyens`** : Liste tous les effets club selon revenus moyens
- **`GET /offre/effet-club-base/:id`** : ✅ **NOUVELLE** - Récupère l'effet club d'une offre spécifique avec filtres Base uniquement
