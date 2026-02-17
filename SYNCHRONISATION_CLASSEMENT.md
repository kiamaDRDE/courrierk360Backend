# SYNCHRONISATION DES CLASSEMENTS COURRIER ↔ TRANSMISSION

## 🎯 Objectif
Assurer une synchronisation bidirectionnelle entre les états de classement des courriers et de leurs transmissions pour éviter les incohérences de statut.

## 🔄 Logique de Synchronisation

### Règle Générale
- **Classer un courrier** → **Classe automatiquement toutes ses transmissions**
- **Déclasser un courrier** → **Déclasse automatiquement toutes ses transmissions** 
- **Classer une transmission** → **Classe automatiquement son courrier** (si pas déjà classé)
- **Déclasser une transmission** → **Déclasse automatiquement son courrier** (si classé)

### Priorité des Statuts lors du Déclassement
Le statut est déterminé selon cette hiérarchie (basée sur la **dernière transmission**):
1. `isArchive = true` → Statut **"Archivé"**
2. `isinstance = true` → Statut **"En instance"**  
3. `accuseReception = true` → Statut **"Reçu"**
4. Aucune condition → Statut **"En traitement"** (par défaut)

## 📝 Modifications Apportées

### 1. Service Courrier (`src/courrier/courrier.service.ts`)

#### `classerCourrier()` - Ligne ~660
```typescript
// ✅ AVANT: Classait seulement le courrier
// ✅ APRÈS: Classe le courrier ET toutes ses transmissions

async classerCourrier(id: number) {
  // ... vérifications ...

  const result = await this.prismaService.$transaction(async (prisma) => {
    // Classer le courrier
    const courrierClasse = await prisma.courrier.update({
      where: { id },
      data: { statut: 'Classé', isGeled: true },
    });

    // ➕ NOUVEAU: Classer toutes les transmissions liées
    await prisma.transmission.updateMany({
      where: { 
        idCourrier: id,
        isGeled: false // Seulement celles pas déjà gelées
      },
      data: { statut: 'Classé', isGeled: true },
    });

    return courrierClasse;
  });
}
```

#### `declasserCourrier()` - Ligne ~705
```typescript
// ✅ AVANT: Déclassait seulement le courrier, statut basé sur dernière transmission
// ✅ APRÈS: Déclasse le courrier ET toutes ses transmissions avec même statut

async declasserCourrier(id: number) {
  // Récupérer la dernière transmission pour déterminer le statut
  const derniereTransmission = await this.prismaService.transmission.findFirst({
    where: { idCourrier: id },
    orderBy: { createdAt: 'desc' },
  });

  // Déterminer le statut selon la hiérarchie
  let nouveauStatut = 'En traitement';
  if (derniereTransmission?.isArchive) nouveauStatut = 'Archivé';
  else if (derniereTransmission?.isinstance) nouveauStatut = 'En instance';  
  else if (derniereTransmission?.accuseReception) nouveauStatut = 'Reçu';

  const result = await this.prismaService.$transaction(async (prisma) => {
    // Déclasser le courrier
    const courrierDeclasse = await prisma.courrier.update({
      where: { id },
      data: { statut: nouveauStatut, isGeled: false },
    });

    // ➕ NOUVEAU: Déclasser toutes les transmissions avec le même statut
    await prisma.transmission.updateMany({
      where: { 
        idCourrier: id,
        isGeled: true // Seulement celles actuellement gelées
      },
      data: { statut: nouveauStatut, isGeled: false },
    });

    return courrierDeclasse;
  });
}
```

### 2. Service Traitement (`src/traitement/traitement.service.ts`)

#### `classerTransmission()` - Ligne ~2490
```typescript
// ✅ AVANT: Classait la transmission + courrier si pas déjà classé
// ✅ APRÈS: Idem, mais avec meilleure gestion d'erreur

async classerTransmission(id: number, classerDto: ClasserTransmissionDto, userId: number) {
  // ... traitement de la transmission ...

  // ✅ EXISTANT: Classer automatiquement le courrier lié si pas déjà classé
  if (!transmission.courrier.isGeled) {
    try {
      await this.courrierService.classerCourrier(transmission.idCourrier);
    } catch (error) {
      console.error('Erreur classement automatique courrier:', error.message);
    }
  }
}
```

#### `declasserTransmission()` - Ligne ~2560
```typescript
// ✅ AVANT: Déclassait la transmission et forçait isArchive=false
// ✅ APRÈS: Déclasse la transmission sans corrompre isArchive

async declasserTransmission(id: number, userId: number) {
  // Déterminer le statut basé sur les propriétés actuelles de la transmission
  let nouveauStatut = 'En traitement'; // 🔄 Changé de 'Transmis'
  if (transmission.isArchive) nouveauStatut = 'Archivé';
  else if (transmission.isinstance) nouveauStatut = 'En instance'; // 🔄 Changé de 'Instancié'
  else if (transmission.accuseReception) nouveauStatut = 'Reçu';

  // Mettre à jour la transmission (❌ NE PLUS forcer isArchive = false)
  const transmissionDeclassee = await this.prismaService.transmission.update({
    where: { id },
    data: {
      statut: nouveauStatut,
      isGeled: false,
      traitePar: traitePar,
      // ❌ SUPPRIMÉ: isArchive: false,
    },
  });

  // ✅ EXISTANT: Déclasser automatiquement le courrier lié si classé
  if (transmission.courrier.isGeled) {
    await this.courrierService.declasserCourrier(transmission.idCourrier);
  }
}
```

## 🧪 Test de Validation

Un fichier de test a été créé: [`test-synchronisation-classement.js`](test-synchronisation-classement.js)

### Scénarios Testés
1. **Classement courrier** → Toutes les transmissions sont classées automatiquement
2. **Déclassement courrier** → Toutes les transmissions sont déclassées automatiquement  
3. **Classement transmission** → Le courrier parent est classé automatiquement
4. **Déclassement transmission** → Le courrier parent est déclassé automatiquement

### Exécution du Test
```bash
node test-synchronisation-classement.js
```

## 🐛 Problème Résolu

### Avant
❌ **Problème Rapporté**: Une transmission avec `accuseReception=true` affichait le statut **"Archivé"** au lieu de **"Reçu"**

### Après  
✅ **Solution**: 
- Synchronisation bidirectionnelle des états `isGeled`
- Respect de la hiérarchie de priorité des statuts
- Conservation des propriétés `isArchive`, `isinstance`, `accuseReception` lors du déclassement
- Détermination du statut basée sur la **dernière transmission** pour le courrier

## 📊 Impact

### Avantages
- ✅ Cohérence parfaite entre courriers et transmissions
- ✅ Prévention des états incohérents (transmission "Archivée" avec courrier "Reçu")
- ✅ Automatisation complète des synchronisations
- ✅ Respect des règles métier de priorité des statuts

### Risques Minimisés
- 🛡️ Transactions utilisées pour éviter les états partiels
- 🛡️ Gestion d'erreur pour éviter le blocage des opérations principales
- 🛡️ Conservation des propriétés importantes (`isArchive`, etc.) lors des déclassements

## 🔍 Points d'Attention

1. **Performance**: Les opérations `updateMany` sont efficaces mais peuvent impacter les gros volumes
2. **Logs**: Les erreurs de synchronisation sont loggées sans bloquer l'opération principale  
3. **Ordre des opérations**: Le statut du courrier est toujours déterminé par la dernière transmission

---
*Dernière mise à jour: 13/12/2024*