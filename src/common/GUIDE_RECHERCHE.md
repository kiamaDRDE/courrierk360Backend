# Guide d'utilisation de la Recherche Standardisée

## Description

Le système de recherche standardisé permet d'implémenter facilement une fonctionnalité de recherche dans toutes vos tables tout en respectant la pagination et le format de réponse.

## Composants

### 1. **SearchPaginationQueryDto** - DTO avec recherche et pagination
Combine les paramètres de pagination avec un terme de recherche.

### 2. **SearchService** - Service de recherche
Service utilitaire pour construire les clauses WHERE de recherche.

### 3. **SearchConfig** - Configuration de recherche par table
Interface pour définir quels champs sont searchables sur chaque table.

## Format de requête

```
GET /api/users?search=john&page=1&limit=10
GET /api/courriers?search=courrier123&page=2&limit=20
```

## Configuration de recherche par table

Chaque module définit sa propre configuration de recherche :

```typescript
import { SearchConfig } from '../common/search.service';

export const USER_SEARCH_CONFIG: SearchConfig = {
  // Champs de type string où rechercher
  stringFields: ['nom', 'email', 'numero', 'fonction'],
  
  // Champs de type number où rechercher (si le terme est un nombre)
  numberFields: ['id'],
  
  // Filtres de base (ex: ne pas inclure les éléments supprimés)
  baseFilters: {
    // isDelete: false, // Si vous avez ce champ
  },
  
  // Relations à inclure dans le résultat
  relations: {
    service: true,
    correspondant: true,
  },
};
```

## Utilisation complète dans un Service

### Exemple 1 : Recherche simple sur Users

```typescript
// src/user/user.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService, SearchConfig } from '../common/search.service';

// Configuration de recherche pour les utilisateurs
const USER_SEARCH_CONFIG: SearchConfig = {
  stringFields: ['nom', 'email', 'numero', 'fonction'],
  numberFields: ['id'],
  relations: {
    service: {
      select: {
        id: true,
        nom: true,
        sigle: true,
      },
    },
    correspondant: {
      select: {
        id: true,
        nom: true,
        type: true,
      },
    },
  },
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    // 1. Valider les paramètres de pagination
    const { page: validPage, limit: validLimit } =
      this.paginationService.validatePaginationParams(page, limit);

    // 2. Construire la clause WHERE avec recherche
    const where = this.searchService.buildSearchWhere(
      search,
      USER_SEARCH_CONFIG,
    );

    // 3. Construire les relations à inclure
    const include = this.searchService.buildInclude(USER_SEARCH_CONFIG);

    // 4. Calculer l'offset
    const skip = this.paginationService.getSkip(validPage, validLimit);

    // 5. Récupérer les données
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include,
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nom: true,
          email: true,
          numero: true,
          fonction: true,
          role: true,
          service: include.service,
          correspondant: include.correspondant,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 6. Créer le résultat paginé
    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      validPage,
      validLimit,
      total,
    );

    // 7. Retourner la réponse formatée
    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des utilisateurs',
      search
        ? `${items.length} utilisateur(s) trouvé(s) pour "${search}".`
        : `${items.length} utilisateur(s) récupéré(s).`,
    );
  }
}
```

### Exemple 2 : Recherche sur Courrier

```typescript
// src/courrier/courrier.config.ts

import { SearchConfig } from '../common/search.service';

export const COURRIER_SEARCH_CONFIG: SearchConfig = {
  stringFields: [
    'numero',
    'reference',
    'objet',
    'commentaire',
    'nom',
    'email',
    'telephone',
    'matricule',
    'statut',
    'priorite',
  ],
  numberFields: ['id', 'nombrePieceJointe'],
  baseFilters: {
    isDelete: false, // Ne pas retourner les courriers supprimés
  },
  relations: {
    provenance: {
      select: {
        id: true,
        nom: true,
        type: true,
        telephone: true,
        email: true,
      },
    },
    typeCourrier: {
      select: {
        id: true,
        nom: true,
        type: true,
      },
    },
    service: {
      select: {
        id: true,
        nom: true,
        sigle: true,
      },
    },
    user: {
      select: {
        id: true,
        nom: true,
        email: true,
      },
    },
  },
};

// src/courrier/courrier.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { COURRIER_SEARCH_CONFIG } from './courrier.config';

@Injectable()
export class CourrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const { page: validPage, limit: validLimit } =
      this.paginationService.validatePaginationParams(page, limit);

    const where = this.searchService.buildSearchWhere(
      search,
      COURRIER_SEARCH_CONFIG,
    );

    const include = this.searchService.buildInclude(COURRIER_SEARCH_CONFIG);
    const skip = this.paginationService.getSkip(validPage, validLimit);

    const [items, total] = await Promise.all([
      this.prisma.courrier.findMany({
        where,
        include,
        skip,
        take: validLimit,
        orderBy: { dateEnregistrement: 'desc' },
      }),
      this.prisma.courrier.count({ where }),
    ]);

    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      validPage,
      validLimit,
      total,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des courriers',
      search
        ? `${items.length} courrier(s) trouvé(s) pour "${search}".`
        : `${items.length} courrier(s) récupéré(s).`,
    );
  }
}
```

### Exemple 3 : Recherche avec filtres supplémentaires

```typescript
// src/courrier/dto/courrier-query.dto.ts

import { SearchPaginationQueryDto } from '../../common/dto/search-pagination-query.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CourrierQueryDto extends SearchPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    example: 'EN_COURS',
  })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par priorité',
    example: 'URGENT',
  })
  @IsOptional()
  @IsString()
  priorite?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ID de service',
    example: 1,
  })
  @IsOptional()
  idService?: number;
}

// src/courrier/courrier.service.ts

async findAll(query: CourrierQueryDto) {
  const { page: validPage, limit: validLimit } =
    this.paginationService.validatePaginationParams(query.page, query.limit);

  // Construire le WHERE avec recherche
  const where = this.searchService.buildSearchWhere(
    query.search,
    COURRIER_SEARCH_CONFIG,
  );

  // Ajouter les filtres supplémentaires
  if (query.statut) {
    where.statut = query.statut;
  }

  if (query.priorite) {
    where.priorite = query.priorite;
  }

  if (query.idService) {
    where.idService = query.idService;
  }

  const include = this.searchService.buildInclude(COURRIER_SEARCH_CONFIG);
  const skip = this.paginationService.getSkip(validPage, validLimit);

  const [items, total] = await Promise.all([
    this.prisma.courrier.findMany({
      where,
      include,
      skip,
      take: validLimit,
      orderBy: { dateEnregistrement: 'desc' },
    }),
    this.prisma.courrier.count({ where }),
  ]);

  const paginatedResult = this.paginationService.createPaginatedResult(
    items,
    validPage,
    validLimit,
    total,
  );

  return this.responseFormatter.paginated(
    paginatedResult,
    'Liste des courriers',
    `${items.length} courrier(s) récupéré(s).`,
  );
}
```

## Dans votre Controller

```typescript
// src/courrier/courrier.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchPaginationQueryDto } from '../common/dto/search-pagination-query.dto';
import { CourrierService } from './courrier.service';

@ApiTags('Courriers')
@Controller('courriers')
export class CourrierController {
  constructor(private readonly courrierService: CourrierService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des courriers avec recherche' })
  async findAll(@Query() query: SearchPaginationQueryDto) {
    return this.courrierService.findAll(
      query.search,
      query.page,
      query.limit,
    );
  }
}
```

## Exemples de requêtes

### Sans recherche (liste complète)
```
GET /api/courriers?page=1&limit=10
```

### Avec recherche
```
GET /api/courriers?search=urgent&page=1&limit=10
GET /api/users?search=dupont&page=1&limit=20
GET /api/correspondants?search=marie&page=1&limit=10
```

### Avec recherche et filtres
```
GET /api/courriers?search=facture&statut=EN_COURS&page=1&limit=10
GET /api/courriers?search=123&priorite=URGENT&page=1&limit=10
```

## Configuration avancée

### Recherche personnalisée

Si vous avez besoin d'une logique de recherche plus complexe, vous pouvez surcharger la méthode :

```typescript
async findAll(search?: string, page: number = 1, limit: number = 10) {
  const { page: validPage, limit: validLimit } =
    this.paginationService.validatePaginationParams(page, limit);

  // WHERE personnalisé
  const where: any = { isDelete: false };

  if (search && search.trim()) {
    const trimmedSearch = search.trim();
    
    where.OR = [
      { numero: { contains: trimmedSearch, mode: 'insensitive' } },
      { reference: { contains: trimmedSearch, mode: 'insensitive' } },
      { objet: { contains: trimmedSearch, mode: 'insensitive' } },
      // Recherche dans les relations
      {
        provenance: {
          nom: { contains: trimmedSearch, mode: 'insensitive' },
        },
      },
      {
        typeCourrier: {
          nom: { contains: trimmedSearch, mode: 'insensitive' },
        },
      },
    ];
  }

  // Suite du code...
}
```

## Méthodes du SearchService

### `buildSearchWhere(searchTerm, config)`
Construit la clause WHERE Prisma avec les conditions de recherche.

```typescript
const where = this.searchService.buildSearchWhere(
  'john',
  USER_SEARCH_CONFIG,
);
// Résultat:
// {
//   OR: [
//     { nom: { contains: 'john', mode: 'insensitive' } },
//     { email: { contains: 'john', mode: 'insensitive' } },
//     { numero: { contains: 'john', mode: 'insensitive' } },
//     { fonction: { contains: 'john', mode: 'insensitive' } },
//   ]
// }
```

### `buildInclude(config)`
Construit les options d'inclusion pour Prisma.

```typescript
const include = this.searchService.buildInclude(USER_SEARCH_CONFIG);
// Résultat: { service: true, correspondant: true }
```

### `sanitizeSearchTerm(searchTerm)`
Nettoie et normalise le terme de recherche.

```typescript
const clean = this.searchService.sanitizeSearchTerm('  john  ');
// Résultat: 'john'
```

### `isValidSearchTerm(searchTerm, minLength)`
Vérifie si un terme de recherche est valide.

```typescript
const isValid = this.searchService.isValidSearchTerm('jo', 3);
// Résultat: false (trop court)
```

## Réponse type

```json
{
  "success": true,
  "statusCode": 200,
  "code": "success",
  "title": "Liste des courriers",
  "message": "5 courrier(s) trouvé(s) pour \"urgent\".",
  "data": {
    "items": [
      {
        "id": 1,
        "numero": "C-2026-001",
        "reference": "REF-URGENT-001",
        "objet": "Demande urgente",
        "provenance": {
          "id": 5,
          "nom": "Jean Dupont",
          "type": "PARTICULIER"
        },
        "service": {
          "id": 2,
          "nom": "Service Courrier",
          "sigle": "SC"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 10,
      "totalItems": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false,
      "nextPage": null,
      "previousPage": null,
      "startIndex": 0,
      "endIndex": 4
    }
  }
}
```

## Bonnes pratiques

✅ **Définir la configuration dans un fichier séparé**
```typescript
// courrier.config.ts
export const COURRIER_SEARCH_CONFIG: SearchConfig = { ... };
```

✅ **Ne rechercher que sur les champs pertinents**
```typescript
stringFields: ['nom', 'email'], // Pas 'password' ou 'token'
```

✅ **Toujours appliquer les filtres de base**
```typescript
baseFilters: {
  isDelete: false,
  isActive: true,
}
```

✅ **Inclure seulement les relations nécessaires**
```typescript
relations: {
  service: {
    select: { id: true, nom: true }, // Pas tous les champs
  },
}
```

❌ **Ne pas exposer les champs sensibles**
```typescript
// ❌ MAUVAIS
stringFields: ['password', 'token', 'resetOtp']

// ✅ BON
stringFields: ['nom', 'email', 'numero']
```

## Résumé

Le système de recherche :
- ✅ **Standardisé** - Même comportement partout
- ✅ **Configurable** - Chaque table définit ses champs searchables
- ✅ **Flexible** - Fonctionne avec pagination et filtres
- ✅ **Type-safe** - Support TypeScript complet
- ✅ **Performant** - Recherche optimisée avec index MySQL
- ✅ **Réutilisable** - Service global injectable
- ✅ **Documenté** - Swagger automatique

Vous définissez une configuration par table, et le SearchService gère le reste automatiquement !
