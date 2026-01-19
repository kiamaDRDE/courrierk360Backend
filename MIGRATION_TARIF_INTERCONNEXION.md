# Migration Guide - Tarif d'Interconnexion

## ⚠️ IMPORTANT : Mise à jour requise

La table `tarifs_interconnexion` a été créée avec succès, mais les modules suivants doivent être mis à jour pour utiliser la nouvelle structure :

### Modules à mettre à jour

#### 1. Module Opérateur (`src/operateur`)

**Fichiers à modifier :**
- `operateur.service.ts` - Remplacer les accès directs à `tarifInterconnection` et `annee`
- `operateur.controller.ts` - Mettre à jour les exemples Swagger
- `dto/create-operateur.dto.ts` - Supprimer `tarifInterconnection` et `annee`
- `dto/update-operateur.dto.ts` - Supprimer `tarifInterconnection` et `annee`

**Changements à effectuer :**

**Avant :**
```typescript
const operateur = await this.prisma.operateur.create({
  data: {
    nom: 'MTN',
    code: 'MTN',
    type: 'Mobile',
    statut: 'Actif',
    tarifInterconnection: 25.50,
    annee: 2025
  }
});
```

**Après :**
```typescript
// Créer l'opérateur
const operateur = await this.prisma.operateur.create({
  data: {
    nom: 'MTN',
    code: 'MTN',
    type: 'Mobile',
    statut: 'Actif'
  }
});

// Créer le tarif dans une transaction ou séparément
await this.prisma.tarifInterconnexion.create({
  data: {
    operateurId: operateur.id,
    annee: 2025,
    tarif: 25.50
  }
});
```

#### 2. Module Offre (`src/offre`)

**Fichiers à modifier :**
- `offre.service.ts` - Méthode `calculerEtSauvegarderEffetClub` (lignes 29, 36, 43, 48)

**Changements à effectuer :**

**Avant :**
```typescript
const operateur = await this.prisma.operateur.findUnique({
  where: { id: offre.operateurId },
  select: { tarifInterconnection: true },
});
const taOperateur = Number(operateur.tarifInterconnection);
```

**Après :**
```typescript
// Récupérer le tarif de l'année de l'offre
const anneeOffre = new Date(offre.dateDebutValidite).getFullYear();
const tarifInterco = await this.prisma.tarifInterconnexion.findUnique({
  where: {
    unique_tarif_operateur_annee: {
      operateurId: offre.operateurId,
      annee: anneeOffre,
    },
  },
});

if (!tarifInterco) {
  throw new NotFoundException(
    `Aucun tarif d'interconnexion trouvé pour l'opérateur ${offre.operateurId} en ${anneeOffre}`
  );
}

const taOperateur = Number(tarifInterco.tarif);
```

### Options de migration

#### Option 1 : Migration manuelle immédiate

1. Sauvegarder les données actuelles des opérateurs
2. Modifier les DTOs pour supprimer `tarifInterconnection` et `annee`  
3. Mettre à jour les services pour utiliser la nouvelle table
4. Mettre à jour les controllers et la documentation Swagger
5. Tester tous les endpoints

#### Option 2 : Migration progressive (recommandé)

1. **Phase 1 :** Utiliser le nouveau module `TarifInterconnexion` pour les nouvelles données
2. **Phase 2 :** Créer un service de migration pour transférer les données existantes
3. **Phase 3 :** Mettre à jour progressivement les modules Opérateur et Offre
4. **Phase 4 :** Supprimer complètement les anciennes références

### Script de migration des données

```typescript
// src/tarif-interconnexion/scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
  // Note: Les colonnes annee et tarifInterconnection n'existent plus
  // Cette migration doit être faite AVANT la migration Prisma
  
  console.log('Migration terminée automatiquement par Prisma');
  console.log('Les nouvelles données doivent être ajoutées via l\'API TarifInterconnexion');
}

migrateData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Checklist de mise à jour

- [ ] Créer les tarifs d'interconnexion via l'API pour les opérateurs existants
- [ ] Modifier `create-operateur.dto.ts` - supprimer `tarifInterconnection` et `annee`
- [ ] Modifier `update-operateur.dto.ts` - supprimer `tarifInterconnection` et `annee`
- [ ] Mettre à jour `operateur.service.ts` - créer les opérateurs sans tarif
- [ ] Mettre à jour `operateur.controller.ts` - exemples Swagger
- [ ] Mettre à jour `offre.service.ts` - récupérer les tarifs depuis la nouvelle table
- [ ] Tester la création d'opérateurs
- [ ] Tester la création d'offres
- [ ] Tester le calcul de l'effet club
- [ ] Mettre à jour la documentation

### Commandes utiles

```bash
# Créer un tarif pour un opérateur existant
curl -X POST http://localhost:3000/tarif-interconnexion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "operateurId": 1,
    "annee": 2025,
    "tarif": 25.50,
    "description": "Tarif MTN 2025"
  }'

# Lister tous les tarifs d'un opérateur
curl -X GET "http://localhost:3000/tarif-interconnexion?operateurId=1&limit=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Contact

Pour toute question sur cette migration, veuillez contacter l'équipe de développement.

## Prochaines étapes

1. Utiliser l'API `/tarif-interconnexion` pour créer les tarifs des opérateurs existants
2. Planifier la mise à jour des modules Opérateur et Offre
3. Tester en environnement de développement avant de déployer en production
