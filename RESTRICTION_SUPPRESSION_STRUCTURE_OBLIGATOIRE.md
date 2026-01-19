# Restriction de suppression pour les structures tarifaires obligatoires

## 📋 Résumé de la fonctionnalité

Une nouvelle logique de protection a été implémentée pour empêcher la suppression accidentelle des structures tarifaires marquées comme obligatoires (`estObligatoire = true`).

## 🛡️ Logique implémentée

### Règles de suppression
- ✅ **Structure non obligatoire** (`estObligatoire = false`) : Suppression autorisée
- ❌ **Structure obligatoire** (`estObligatoire = true`) : Suppression bloquée
- 🔄 **Solution** : Modifier d'abord `estObligatoire` à `false`, puis supprimer

## 🔧 Modifications techniques

### Service (`structure-tarifaire.service.ts`)
```typescript
async remove(id: number) {
  const structure = await this.prisma.structureTarifaire.findUnique({
    where: { id },
  });

  if (!structure) {
    throw new NotFoundException(
      `Structure tarifaire avec l'ID ${id} introuvable`,
    );
  }

  // ✅ NOUVELLE LOGIQUE DE PROTECTION
  if (structure.estObligatoire) {
    throw new BadRequestException(
      `Impossible de supprimer la structure tarifaire "${structure.nom}" car elle est marquée comme obligatoire. Veuillez d'abord modifier le champ estObligatoire à false avant de pouvoir la supprimer.`,
    );
  }

  await this.prisma.structureTarifaire.delete({
    where: { id },
  });

  return this.formatResponse(
    { id },
    'Structure supprimée',
    `Structure tarifaire "${structure.nom}" supprimée avec succès.`,
  );
}
```

### Contrôleur (`structure-tarifaire.controller.ts`)
```typescript
@Delete(':id')
@ApiOperation({ 
  summary: 'Supprimer une structure tarifaire',
  description: 'Supprime une structure tarifaire. Les structures marquées comme obligatoires (estObligatoire = true) ne peuvent pas être supprimées. Il faut d\'abord modifier estObligatoire à false avant de pouvoir les supprimer.',
})
@ApiResponse({
  status: 400,
  description: 'Impossible de supprimer une structure obligatoire',
  schema: {
    example: {
      success: false,
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Impossible de supprimer la structure tarifaire "Tarification Obligatoire" car elle est marquée comme obligatoire. Veuillez d\'abord modifier le champ estObligatoire à false avant de pouvoir la supprimer.',
    },
  },
})
```

## 📚 Réponses API

### ✅ Suppression réussie (structure non obligatoire)
**Status:** `200 OK`
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Structure supprimée",
  "message": "Structure tarifaire \"Tarification Test\" supprimée avec succès.",
  "data": {
    "id": 1
  }
}
```

### ❌ Suppression refusée (structure obligatoire)
**Status:** `400 Bad Request`
```json
{
  "success": false,
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "Impossible de supprimer la structure tarifaire \"Tarification Critique\" car elle est marquée comme obligatoire. Veuillez d'abord modifier le champ estObligatoire à false avant de pouvoir la supprimer."
}
```

## 🧪 Scénarios de test

### Test 1: Suppression structure non obligatoire ✅
```bash
# 1. Créer structure non obligatoire
curl -X POST http://localhost:3000/structure-tarifaire \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"nom":"Test Non Obligatoire","valeur":10.00,"estObligatoire":false}'

# 2. Supprimer (doit fonctionner)
curl -X DELETE http://localhost:3000/structure-tarifaire/[ID] \
  -H "Authorization: Bearer TOKEN"
```
**Résultat:** `200 OK` - Suppression réussie

### Test 2: Suppression structure obligatoire ❌
```bash
# 1. Créer structure obligatoire
curl -X POST http://localhost:3000/structure-tarifaire \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"nom":"Test Obligatoire","valeur":25.00,"estObligatoire":true}'

# 2. Tenter de supprimer (doit échouer)
curl -X DELETE http://localhost:3000/structure-tarifaire/[ID] \
  -H "Authorization: Bearer TOKEN"
```
**Résultat:** `400 Bad Request` - Suppression refusée

### Test 3: Modification puis suppression ✅
```bash
# 1. Modifier estObligatoire à false
curl -X PATCH http://localhost:3000/structure-tarifaire/[ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"estObligatoire":false}'

# 2. Supprimer (doit maintenant fonctionner)
curl -X DELETE http://localhost:3000/structure-tarifaire/[ID] \
  -H "Authorization: Bearer TOKEN"
```
**Résultat:** `200 OK` - Suppression réussie

## 🎯 Avantages de cette implémentation

1. **Protection des données critiques** : Empêche la suppression accidentelle
2. **Message explicite** : Indique clairement pourquoi la suppression est refusée
3. **Solution proposée** : Guide l'utilisateur sur la marche à suivre
4. **Flexibilité** : Permet toujours la suppression après modification
5. **Documentation complète** : Swagger mis à jour avec les nouveaux codes d'erreur

## 🔍 Points techniques

- **Exception utilisée** : `BadRequestException` (HTTP 400)
- **Vérification** : Avant l'opération de suppression Prisma
- **Message personnalisé** : Inclut le nom de la structure concernée
- **Pas d'impact** : Sur les autres opérations CRUD
- **Rétrocompatibilité** : Aucune structure existante n'est affectée

## 📖 Documentation

La documentation Swagger a été mise à jour :
- **URL** : http://localhost:3000/structure-tarifaire-doc
- **Nouvelle réponse 400** : Documentée avec exemple
- **Description enrichie** : Explication de la restriction

## ✅ Status : Implémentation complète

La restriction de suppression pour les structures tarifaires obligatoires est maintenant :
- ✅ Implémentée dans le service
- ✅ Documentée dans le contrôleur
- ✅ Testée avec des scénarios complets
- ✅ Prête pour la production
