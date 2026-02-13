# Guide d'utilisation du ResponseFormatterService

## Description

Le `ResponseFormatterService` est un service global qui standardise le format de réponse de toutes les APIs. Il garantit que chaque réponse suit le même schéma avec `success`, `statusCode`, `code`, `title`, `message`, et `data`.

## Installation

Le service est déjà configuré en tant que module global dans `CommonModule` et est automatiquement disponible dans tous les modules de l'application.

## Format de réponse standard

```typescript
{
  success: boolean;      // true pour succès, false pour erreur
  statusCode: number;    // Code HTTP (200, 201, 400, 401, 404, 500, etc.)
  code: string;          // Code interne ('success', 'created', 'validation_error', etc.)
  title: string;         // Titre de la réponse
  message: string;       // Message descriptif
  data?: any;            // Données optionnelles (présent uniquement en cas de succès)
  errors?: any;          // Détails des erreurs (présent uniquement en cas d'erreur)
}
```

## Utilisation dans vos services

### 1. Injecter le service

```typescript
import { Injectable } from '@nestjs/common';
import { ResponseFormatterService } from '../common/response-formatter.service';

@Injectable()
export class MonService {
  constructor(
    private readonly responseFormatter: ResponseFormatterService,
  ) {}
}
```

### 2. Méthodes disponibles

#### Réponses de succès

##### `success()` - Succès général (200)
```typescript
async getUser(id: number) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  
  return this.responseFormatter.success(
    user,
    'Utilisateur récupéré',
    'Les informations de l\'utilisateur ont été récupérées avec succès.'
  );
}
```

##### `created()` - Création réussie (201)
```typescript
async createUser(data: CreateUserDto) {
  const user = await this.prisma.user.create({ data });
  
  return this.responseFormatter.created(
    user,
    'Utilisateur créé',
    'L\'utilisateur a été créé avec succès.'
  );
}
```

##### `updated()` - Mise à jour réussie (200)
```typescript
async updateUser(id: number, data: UpdateUserDto) {
  const user = await this.prisma.user.update({ where: { id }, data });
  
  return this.responseFormatter.updated(
    user,
    'Utilisateur modifié',
    'L\'utilisateur a été modifié avec succès.'
  );
}
```

##### `deleted()` - Suppression réussie (200)
```typescript
async deleteUser(id: number) {
  await this.prisma.user.delete({ where: { id } });
  
  return this.responseFormatter.deleted(
    'Utilisateur supprimé',
    'L\'utilisateur a été supprimé avec succès.'
  );
}
```

##### `paginated()` - Liste paginée (200)
```typescript
async getUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    this.prisma.user.findMany({ skip, take: limit }),
    this.prisma.user.count(),
  ]);
  
  const totalPages = Math.ceil(total / limit);
  
  return this.responseFormatter.paginated(
    users,
    {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    'Liste des utilisateurs',
    `${users.length} utilisateur(s) récupéré(s).`
  );
}
```

#### Réponses d'erreur

##### `validationError()` - Erreur de validation (400)
```typescript
if (!email || !password) {
  throw new BadRequestException(
    this.responseFormatter.validationError(
      'Erreur de validation',
      'Les champs email et password sont requis.',
      { email: 'Email requis', password: 'Mot de passe requis' }
    )
  );
}
```

##### `unauthorized()` - Non autorisé (401)
```typescript
if (!isValidToken) {
  throw new UnauthorizedException(
    this.responseFormatter.unauthorized(
      'Accès non autorisé',
      'Votre session a expiré. Veuillez vous reconnecter.'
    )
  );
}
```

##### `forbidden()` - Interdit (403)
```typescript
if (!hasPermission) {
  throw new ForbiddenException(
    this.responseFormatter.forbidden(
      'Accès interdit',
      'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.'
    )
  );
}
```

##### `notFound()` - Non trouvé (404)
```typescript
const user = await this.prisma.user.findUnique({ where: { id } });

if (!user) {
  throw new NotFoundException(
    this.responseFormatter.notFound(
      'Utilisateur non trouvé',
      `Aucun utilisateur trouvé avec l'ID ${id}.`
    )
  );
}
```

##### `conflict()` - Conflit (409)
```typescript
const existingUser = await this.prisma.user.findUnique({ where: { email } });

if (existingUser) {
  throw new ConflictException(
    this.responseFormatter.conflict(
      'Utilisateur existant',
      'Un utilisateur avec cet email existe déjà.'
    )
  );
}
```

##### `serverError()` - Erreur serveur (500)
```typescript
try {
  // ... code
} catch (error) {
  throw new InternalServerErrorException(
    this.responseFormatter.serverError(
      'Erreur serveur',
      'Une erreur inattendue s\'est produite. Veuillez réessayer.'
    )
  );
}
```

##### `error()` - Erreur personnalisée
```typescript
return this.responseFormatter.error(
  422,
  'unprocessable_entity',
  'Entité non traitable',
  'Les données fournies ne peuvent pas être traitées.',
  { field: 'date', reason: 'Format invalide' }
);
```

## Exemple complet d'un service

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';

@Injectable()
export class CourrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
  ) {}

  async create(data: CreateCourrierDto) {
    // Vérifier si le numéro existe déjà
    const existing = await this.prisma.courrier.findUnique({
      where: { numero: data.numero },
    });

    if (existing) {
      throw new ConflictException(
        this.responseFormatter.conflict(
          'Courrier existant',
          `Un courrier avec le numéro ${data.numero} existe déjà.`
        )
      );
    }

    const courrier = await this.prisma.courrier.create({ data });

    return this.responseFormatter.created(
      courrier,
      'Courrier créé',
      'Le courrier a été créé avec succès.'
    );
  }

  async findOne(id: number) {
    const courrier = await this.prisma.courrier.findUnique({
      where: { id },
      include: {
        provenance: true,
        typeCourrier: true,
        service: true,
      },
    });

    if (!courrier) {
      throw new NotFoundException(
        this.responseFormatter.notFound(
          'Courrier non trouvé',
          `Aucun courrier trouvé avec l'ID ${id}.`
        )
      );
    }

    return this.responseFormatter.success(
      courrier,
      'Courrier récupéré',
      'Les informations du courrier ont été récupérées avec succès.'
    );
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [courriers, total] = await Promise.all([
      this.prisma.courrier.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.courrier.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return this.responseFormatter.paginated(
      courriers,
      {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      'Liste des courriers',
      `${courriers.length} courrier(s) récupéré(s).`
    );
  }

  async update(id: number, data: UpdateCourrierDto) {
    const courrier = await this.prisma.courrier.findUnique({ where: { id } });

    if (!courrier) {
      throw new NotFoundException(
        this.responseFormatter.notFound(
          'Courrier non trouvé',
          `Aucun courrier trouvé avec l'ID ${id}.`
        )
      );
    }

    const updated = await this.prisma.courrier.update({
      where: { id },
      data,
    });

    return this.responseFormatter.updated(
      updated,
      'Courrier modifié',
      'Le courrier a été modifié avec succès.'
    );
  }

  async remove(id: number) {
    const courrier = await this.prisma.courrier.findUnique({ where: { id } });

    if (!courrier) {
      throw new NotFoundException(
        this.responseFormatter.notFound(
          'Courrier non trouvé',
          `Aucun courrier trouvé avec l'ID ${id}.`
        )
      );
    }

    await this.prisma.courrier.delete({ where: { id } });

    return this.responseFormatter.deleted(
      'Courrier supprimé',
      'Le courrier a été supprimé avec succès.',
      { id }
    );
  }
}
```

## Avantages

✅ **Cohérence** - Toutes les réponses API suivent le même format  
✅ **Maintenance** - Modification centralisée du format de réponse  
✅ **Type-safe** - Support TypeScript complet avec génériques  
✅ **Flexible** - Méthodes pour tous les cas d'usage courants  
✅ **Auto-documentation** - Code auto-documenté et facile à comprendre  
✅ **Gestion d'erreurs** - Formats standardisés pour tous les types d'erreurs

## Notes importantes

- Le service est global (`@Global()`) et n'a pas besoin d'être importé dans chaque module
- Utilisez toujours ce service pour formater vos réponses
- Les exceptions NestJS (NotFoundException, BadRequestException, etc.) doivent être utilisées avec le formateur
- Pour les réponses de succès personnalisées, utilisez `success()` avec un statusCode personnalisé
