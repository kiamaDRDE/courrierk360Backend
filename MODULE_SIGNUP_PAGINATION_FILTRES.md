# Module Signup - Pagination et Filtres

## Date de mise à jour
**13 décembre 2025**

## Objectif
Ajouter la pagination et les filtres à la liste des utilisateurs du module **Signup**, en utilisant le même format standardisé que les autres modules (Operateur, Offre).

## Modifications Effectuées

### 1. Création du DTO de requête
**Fichier** : `src/signup/dto/user-query.dto.ts`

```typescript
export class UserQueryDto {
  page?: number = 1;           // Numéro de la page (défaut: 1)
  limit?: number = 10;         // Éléments par page (0 = tous, défaut: 10)
  nom?: string;                // Filtre par nom (recherche partielle)
  email?: string;              // Filtre par email (recherche partielle)
  numero?: string;             // Filtre par numéro (recherche partielle)
  fonction?: string;           // Filtre par fonction
  role?: string;               // Filtre par rôle (SUPER_ADMIN, ADMIN, USER)
  statut?: string;             // Filtre par statut (Actif, Inactif)
}
```

### 2. Mise à jour du Service
**Fichier** : `src/signup/signup.service.ts`

#### Ancienn méthode
```typescript
async getAllUsers() {
  const users = await this.prismaService.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  const usersWithoutPassword = users.map((user) => {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  return this.formatResponse(
    usersWithoutPassword,
    'Liste des utilisateurs',
    `${usersWithoutPassword.length} utilisateur(s) trouvé(s).`,
  );
}
```

#### Nouvelle méthode
```typescript
async getAllUsers(query: UserQueryDto) {
  const { page = 1, limit = 10, nom, email, numero, fonction, role, statut } = query;

  // Construction des filtres dynamiques
  const where: any = {};
  if (nom) where.nom = { contains: nom };
  if (email) where.email = { contains: email };
  if (numero) where.numero = { contains: numero };
  if (fonction) where.fonction = { contains: fonction };
  if (role) where.role = role;
  if (statut) where.statut = statut;

  // Compter le total
  const total = await this.prismaService.user.count({ where });

  // Si limit = 0, retourner tous les résultats
  if (limit === 0) {
    const users = await this.prismaService.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return this.formatResponse(
      {
        users: usersWithoutPassword,
        pagination: {
          total,
          page: 1,
          limit: total,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      'Liste des utilisateurs',
      `${total} utilisateur(s) récupéré(s) avec succès.`,
    );
  }

  // Pagination normale
  const skip = (page - 1) * limit;
  const users = await this.prismaService.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const usersWithoutPassword = users.map((user) => {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return this.formatResponse(
    {
      users: usersWithoutPassword,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    },
    'Liste des utilisateurs',
    `${usersWithoutPassword.length} utilisateur(s) sur ${total} récupéré(s) avec succès.`,
  );
}
```

### 3. Mise à jour du Contrôleur
**Fichier** : `src/signup/signup.controller.ts`

#### Import du DTO
```typescript
import { UserQueryDto } from './dto/user-query.dto';
import { Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
```

#### Mise à jour de l'endpoint
```typescript
@Get()
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Liste des utilisateurs avec filtres et pagination',
  description: 'Récupère la liste des utilisateurs avec possibilité de filtrer et paginer les résultats.',
})
@ApiQuery({ name: 'page', required: false, description: 'Numéro de la page', example: 1 })
@ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (0 = tous)', example: 10 })
@ApiQuery({ name: 'nom', required: false, description: 'Filtrer par nom', example: 'Jean' })
@ApiQuery({ name: 'email', required: false, description: 'Filtrer par email', example: 'jean@example.com' })
@ApiQuery({ name: 'numero', required: false, description: 'Filtrer par numéro', example: '+237' })
@ApiQuery({ name: 'fonction', required: false, description: 'Filtrer par fonction', example: 'Développeur' })
@ApiQuery({ name: 'role', required: false, description: 'Filtrer par rôle', enum: ['SUPER_ADMIN', 'ADMIN', 'USER'] })
@ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut', enum: ['Actif', 'Inactif'] })
async getAllUsers(@Query() query: UserQueryDto) {
  return this.signupService.getAllUsers(query);
}
```

## Format de Réponse Standardisé

### Structure
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des utilisateurs",
  "message": "10 utilisateur(s) sur 25 récupéré(s) avec succès.",
  "data": {
    "users": [ ... ],
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

### Exemple Complet
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Liste des utilisateurs",
  "message": "2 utilisateur(s) sur 10 récupéré(s) avec succès.",
  "data": {
    "users": [
      {
        "id": 1,
        "nom": "Jean Dupont",
        "email": "jean.dupont@example.com",
        "numero": "+237699999999",
        "fonction": "Développeur",
        "role": "USER",
        "statut": "Actif",
        "token": null,
        "expiresToken": null,
        "refreshToken": null,
        "refreshExpires": null,
        "resetOtp": null,
        "resetExpires": null,
        "verifyOtp": null,
        "verifyExpires": null,
        "createdAt": "2025-12-13T10:00:00.000Z",
        "updatedAt": "2025-12-13T10:00:00.000Z"
      },
      {
        "id": 2,
        "nom": "Marie Martin",
        "email": "marie.martin@example.com",
        "numero": "+237655005647",
        "fonction": "Designer",
        "role": "ADMIN",
        "statut": "Actif",
        "token": null,
        "expiresToken": null,
        "refreshToken": null,
        "refreshExpires": null,
        "resetOtp": null,
        "resetExpires": null,
        "verifyOtp": null,
        "verifyExpires": null,
        "createdAt": "2025-12-13T11:00:00.000Z",
        "updatedAt": "2025-12-13T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 2,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Filtres Disponibles

### 1. Filtre par Nom
Recherche partielle (case-insensitive via Prisma) :
```bash
GET /signup?nom=Jean
```

### 2. Filtre par Email
Recherche partielle :
```bash
GET /signup?email=@example.com
```

### 3. Filtre par Numéro
Recherche partielle :
```bash
GET /signup?numero=+237
```

### 4. Filtre par Fonction
Recherche partielle :
```bash
GET /signup?fonction=Développeur
```

### 5. Filtre par Rôle
Valeurs exactes : `SUPER_ADMIN`, `ADMIN`, `USER`
```bash
GET /signup?role=SUPER_ADMIN
```

### 6. Filtre par Statut
Valeurs exactes : `Actif`, `Inactif`
```bash
GET /signup?statut=Actif
```

### 7. Filtres Multiples
Combiner plusieurs filtres :
```bash
GET /signup?role=USER&statut=Actif&page=1&limit=10
```

## Pagination

### Paramètres de Pagination
- **page** : Numéro de la page (défaut: 1)
- **limit** : Nombre d'éléments par page (défaut: 10, 0 = tous)

### Exemples

#### Page 1 avec 10 éléments
```bash
GET /signup?page=1&limit=10
```

#### Page 2 avec 20 éléments
```bash
GET /signup?page=2&limit=20
```

#### Tous les utilisateurs (sans pagination)
```bash
GET /signup?limit=0
```

### Informations de Pagination
```json
{
  "pagination": {
    "total": 25,              // Nombre total d'utilisateurs
    "page": 1,                // Page actuelle
    "limit": 10,              // Éléments par page
    "totalPages": 3,          // Nombre total de pages
    "hasNextPage": true,      // Y a-t-il une page suivante ?
    "hasPreviousPage": false  // Y a-t-il une page précédente ?
  }
}
```

## Tests avec cURL

### 1. Liste complète (sans filtres)
```bash
curl -X GET "http://localhost:3000/signup?page=1&limit=10" \
  -H "Content-Type: application/json"
```

### 2. Filtrer par rôle SUPER_ADMIN
```bash
curl -X GET "http://localhost:3000/signup?role=SUPER_ADMIN" \
  -H "Content-Type: application/json"
```

### 3. Filtrer par nom et statut
```bash
curl -X GET "http://localhost:3000/signup?nom=Jean&statut=Actif&page=1&limit=5" \
  -H "Content-Type: application/json"
```

### 4. Rechercher par email
```bash
curl -X GET "http://localhost:3000/signup?email=@example.com" \
  -H "Content-Type: application/json"
```

### 5. Tous les utilisateurs actifs
```bash
curl -X GET "http://localhost:3000/signup?statut=Actif&limit=0" \
  -H "Content-Type: application/json"
```

## Utilisation Frontend

### Exemple avec Fetch API
```javascript
// Fonction pour récupérer les utilisateurs avec pagination et filtres
async function getUsers(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...(filters.nom && { nom: filters.nom }),
    ...(filters.email && { email: filters.email }),
    ...(filters.role && { role: filters.role }),
    ...(filters.statut && { statut: filters.statut }),
  });

  const response = await fetch(`/signup?${params}`);
  const data = await response.json();

  if (data.success) {
    const { users, pagination } = data.data;
    
    console.log(`Page ${pagination.page} sur ${pagination.totalPages}`);
    console.log(`Total: ${pagination.total} utilisateurs`);
    console.log(`Affichage: ${users.length} utilisateurs`);
    
    return { users, pagination };
  }
  
  throw new Error(data.message);
}

// Exemples d'utilisation
// Page 1 sans filtre
const result1 = await getUsers({ page: 1, limit: 10 });

// Filtrer par rôle
const result2 = await getUsers({ role: 'SUPER_ADMIN', limit: 5 });

// Recherche par nom
const result3 = await getUsers({ nom: 'Jean', page: 1 });

// Tous les utilisateurs actifs
const result4 = await getUsers({ statut: 'Actif', limit: 0 });
```

### Gestion de la Pagination
```javascript
function PaginationControls({ pagination, onPageChange }) {
  return (
    <div className="pagination">
      <button 
        disabled={!pagination.hasPreviousPage}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Précédent
      </button>
      
      <span>
        Page {pagination.page} / {pagination.totalPages}
        ({pagination.total} résultats)
      </span>
      
      <button 
        disabled={!pagination.hasNextPage}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Suivant
      </button>
    </div>
  );
}
```

## Comparaison avec les Autres Modules

### Module Operateur
```typescript
GET /operateur?page=1&limit=10&nom=MTN&type=Mobile
```

### Module Offre
```typescript
GET /offre?page=1&limit=10&typeOffre=Prépayé&statut=Actif
```

### Module Signup (nouveau)
```typescript
GET /signup?page=1&limit=10&role=SUPER_ADMIN&statut=Actif
```

**Tous les modules utilisent maintenant le même format de réponse et la même structure de pagination !**

## Avantages

✅ **Cohérence** : Format identique aux autres modules  
✅ **Pagination** : Navigation facilitée avec `hasNextPage` / `hasPreviousPage`  
✅ **Filtres multiples** : Combiner plusieurs critères de recherche  
✅ **Performance** : Requêtes optimisées avec `count()` et `findMany()`  
✅ **Flexibilité** : `limit=0` pour récupérer tous les résultats  
✅ **Sécurité** : Mots de passe exclus automatiquement des réponses  
✅ **Documentation Swagger** : Exemples et descriptions complets

## Résumé des Fichiers Modifiés

1. **src/signup/dto/user-query.dto.ts** (créé)
   - DTO pour les paramètres de requête (pagination + filtres)

2. **src/signup/signup.service.ts** (modifié)
   - Méthode `getAllUsers()` avec pagination et filtres
   - Support de `limit=0` pour tous les résultats
   - Calcul de `hasNextPage` et `hasPreviousPage`

3. **src/signup/signup.controller.ts** (modifié)
   - Endpoint `GET /signup` avec paramètres de requête
   - Documentation Swagger complète avec exemples

## Prochaines Étapes

1. ⏳ Tester tous les filtres avec Postman/curl
2. ⏳ Vérifier la documentation Swagger
3. ⏳ Mettre à jour le frontend pour utiliser la pagination
4. ⏳ Ajouter des tests unitaires si nécessaire

## Conclusion

Le module **Signup** utilise maintenant le même format de pagination et de filtres que les modules **Operateur** et **Offre**, garantissant la cohérence de l'API et facilitant l'intégration côté frontend.
