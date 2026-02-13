# Guide d'utilisation de la Pagination

## Description

Le système de pagination standardisé fournit une solution complète et réutilisable pour paginer vos données dans toutes les APIs.

## Composants

### 1. **PaginationQueryDto** - Paramètres de requête
DTO pour valider les paramètres de pagination dans les requêtes.

### 2. **PaginationMeta** - Métadonnées de pagination
Interface pour les informations de pagination.

### 3. **PaginatedResult** - Résultat paginé
Interface pour le résultat paginé complet (items + métadonnées).

### 4. **PaginationService** - Service de pagination
Service utilitaire pour calculer les métadonnées de pagination.

## Installation

Les services sont déjà configurés globalement dans `CommonModule` et sont disponibles partout.

## Format de réponse paginée standard

```json
{
  "success": true,
  "statusCode": 200,
  "code": "success",
  "title": "Liste des utilisateurs",
  "message": "15 utilisateur(s) récupéré(s).",
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 2,
      "itemsPerPage": 10,
      "totalItems": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": true,
      "nextPage": 3,
      "previousPage": 1,
      "startIndex": 10,
      "endIndex": 19
    }
  }
}
```

## Utilisation complète

### 1. Dans votre DTO de requête

Étendez `PaginationQueryDto` ou utilisez-le directement :

```typescript
// Option 1 : Utiliser directement
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('users')
export class UserController {
  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAll(query.page, query.limit);
  }
}
```

```typescript
// Option 2 : Étendre pour ajouter des filtres
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

@Controller('users')
export class UserController {
  @Get()
  async findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }
}
```

### 2. Dans votre Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    // 1️⃣ Valider et normaliser les paramètres
    const { page: validPage, limit: validLimit } =
      this.paginationService.validatePaginationParams(page, limit);

    // 2️⃣ Calculer l'offset pour Prisma
    const skip = this.paginationService.getSkip(validPage, validLimit);

    // 3️⃣ Récupérer les données et le total
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    // 4️⃣ Créer le résultat paginé
    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      validPage,
      validLimit,
      total,
    );

    // 5️⃣ Formater la réponse
    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des utilisateurs',
      `${items.length} utilisateur(s) récupéré(s).`,
    );
  }
}
```

### 3. Avec des filtres

```typescript
import { UserQueryDto } from './dto/user-query.dto';

async findAll(query: UserQueryDto) {
  // 1️⃣ Valider les paramètres de pagination
  const { page, limit } = this.paginationService.validatePaginationParams(
    query.page,
    query.limit,
  );

  // 2️⃣ Construire les filtres
  const where: any = {};

  if (query.search) {
    where.OR = [
      { nom: { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  // 3️⃣ Calculer l'offset
  const skip = this.paginationService.getSkip(page, limit);

  // 4️⃣ Récupérer les données
  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count({ where }),
  ]);

  // 5️⃣ Créer et retourner le résultat paginé
  const paginatedResult = this.paginationService.createPaginatedResult(
    items,
    page,
    limit,
    total,
  );

  return this.responseFormatter.paginated(
    paginatedResult,
    'Liste des utilisateurs',
    `${items.length} utilisateur(s) récupéré(s).`,
  );
}
```

### 4. Exemple complet avec tri et filtres

```typescript
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class CourrierQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';
}

@Injectable()
export class CourrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(query: CourrierQueryDto) {
    // Validation
    const { page, limit } = this.paginationService.validatePaginationParams(
      query.page,
      query.limit,
    );

    // Filtres
    const where: any = { isDelete: false };

    if (query.search) {
      where.OR = [
        { numero: { contains: query.search } },
        { objet: { contains: query.search } },
        { reference: { contains: query.search } },
      ];
    }

    if (query.statut) {
      where.statut = query.statut;
    }

    // Tri
    const orderBy: any = {};
    orderBy[query.sortBy] = query.order;

    // Pagination
    const skip = this.paginationService.getSkip(page, limit);

    // Requête
    const [items, total] = await Promise.all([
      this.prisma.courrier.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          provenance: true,
          typeCourrier: true,
          service: true,
        },
      }),
      this.prisma.courrier.count({ where }),
    ]);

    // Résultat paginé
    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      page,
      limit,
      total,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des courriers',
      `${items.length} courrier(s) récupéré(s).`,
    );
  }
}
```

## Méthodes du PaginationService

### `createPaginationMeta(page, limit, total)`
Crée les métadonnées de pagination complètes.

```typescript
const meta = this.paginationService.createPaginationMeta(2, 10, 45);
// Résultat:
// {
//   currentPage: 2,
//   itemsPerPage: 10,
//   totalItems: 45,
//   totalPages: 5,
//   hasNextPage: true,
//   hasPreviousPage: true,
//   nextPage: 3,
//   previousPage: 1,
//   startIndex: 10,
//   endIndex: 19
// }
```

### `getSkip(page, limit)`
Calcule l'offset pour Prisma.

```typescript
const skip = this.paginationService.getSkip(2, 10); // 10
const skip = this.paginationService.getSkip(3, 20); // 40
```

### `createPaginatedResult(items, page, limit, total)`
Crée un résultat paginé complet.

```typescript
const result = this.paginationService.createPaginatedResult(
  users,
  2,
  10,
  45
);
// Résultat:
// {
//   items: [...],
//   pagination: { currentPage: 2, itemsPerPage: 10, ... }
// }
```

### `validatePaginationParams(page, limit)`
Valide et normalise les paramètres.

```typescript
const { page, limit } = this.paginationService.validatePaginationParams(
  -1,  // Sera corrigé à 1
  200  // Sera limité à 100
);
// Résultat: { page: 1, limit: 100 }
```

### `createPaginationLinks(baseUrl, page, limit, total)`
Génère des liens de pagination (pour APIs RESTful).

```typescript
const links = this.paginationService.createPaginationLinks(
  '/api/users',
  2,
  10,
  45
);
// Résultat:
// {
//   first: '/api/users?page=1&limit=10',
//   previous: '/api/users?page=1&limit=10',
//   current: '/api/users?page=2&limit=10',
//   next: '/api/users?page=3&limit=10',
//   last: '/api/users?page=5&limit=10'
// }
```

## Exemple de Controller avec Swagger

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des utilisateurs' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des utilisateurs',
  })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAll(query.page, query.limit);
  }
}
```

## Paramètres de requête

### Par défaut
```
GET /api/users
// Retourne la page 1 avec 10 éléments
```

### Avec pagination
```
GET /api/users?page=2&limit=20
// Retourne la page 2 avec 20 éléments
```

### Avec filtres
```
GET /api/users?page=1&limit=10&search=john&role=ADMIN
```

## Validation automatique

Le DTO `PaginationQueryDto` valide automatiquement :
- ✅ `page` doit être ≥ 1
- ✅ `limit` doit être entre 1 et 100
- ✅ Les valeurs sont converties en nombres (avec `@Type(() => Number)`)
- ✅ Valeurs par défaut : page=1, limit=10

## Bonnes pratiques

✅ **Toujours utiliser PaginationService**
```typescript
const skip = this.paginationService.getSkip(page, limit);
```

✅ **Valider les paramètres**
```typescript
const { page, limit } = this.paginationService.validatePaginationParams(
  query.page,
  query.limit
);
```

✅ **Utiliser Promise.all pour les requêtes parallèles**
```typescript
const [items, total] = await Promise.all([
  this.prisma.model.findMany({ skip, take: limit }),
  this.prisma.model.count({ where }),
]);
```

✅ **Retourner avec ResponseFormatter.paginated**
```typescript
return this.responseFormatter.paginated(
  paginatedResult,
  'Titre',
  'Message'
);
```

❌ **Ne pas calculer manuellement les métadonnées**
```typescript
// ❌ MAUVAIS
const totalPages = Math.ceil(total / limit);
const hasNextPage = page < totalPages;

// ✅ BON
const paginatedResult = this.paginationService.createPaginatedResult(
  items,
  page,
  limit,
  total
);
```

## Résumé

Le système de pagination :
- ✅ **Standardisé** - Même format partout
- ✅ **Validé** - DTO avec validation automatique
- ✅ **Complet** - Toutes les métadonnées nécessaires
- ✅ **Réutilisable** - Service global injectable partout
- ✅ **Type-safe** - Support TypeScript complet
- ✅ **Flexible** - Fonctionne avec filtres et tri
- ✅ **Optimisé** - Requêtes parallèles avec Promise.all
