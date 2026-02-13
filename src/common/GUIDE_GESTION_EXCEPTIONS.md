# Guide de Gestion des Exceptions

## Description

Le système de gestion des exceptions intercepte automatiquement toutes les exceptions levées dans l'application et les formate selon le standard défini par `ResponseFormatterService`.

## Fonctionnement

Le filtre global `HttpExceptionFilter` est configuré dans [app.module.ts](../app.module.ts) et intercepte **toutes les exceptions** de l'application.

## Format de réponse d'erreur

Toutes les erreurs retournent un **HTTP 200** avec le vrai code d'erreur dans le body :

```json
{
  "success": false,
  "statusCode": 404,
  "code": "not_found",
  "title": "Erreur",
  "message": "Ressource non trouvée",
  "errors": {} // optionnel
}
```

## Utilisation dans vos services

### 1. Utiliser les exceptions NestJS standard

```typescript
import { 
  NotFoundException, 
  BadRequestException, 
  UnauthorizedException,
  ForbiddenException,
  ConflictException 
} from '@nestjs/common';

// ❌ NE PAS FAIRE - Message simple
throw new NotFoundException('Utilisateur non trouvé');

// ✅ FAIRE - Utiliser le ResponseFormatterService
throw new NotFoundException(
  this.responseFormatter.notFound(
    'Utilisateur non trouvé',
    'Aucun utilisateur avec cet ID n\'existe.'
  )
);
```

### 2. Mapping automatique des exceptions

Le filtre mappe automatiquement les exceptions aux codes appropriés :

| Exception NestJS | Code | StatusCode |
|-----------------|------|------------|
| `BadRequestException` | `validation_error` | 400 |
| `UnauthorizedException` | `unauthorized` | 401 |
| `ForbiddenException` | `forbidden` | 403 |
| `NotFoundException` | `not_found` | 404 |
| `ConflictException` | `conflict` | 409 |
| `InternalServerErrorException` | `server_error` | 500 |

### 3. Exemples complets

#### Validation de données
```typescript
async create(data: CreateUserDto) {
  if (!data.email || !data.password) {
    throw new BadRequestException(
      this.responseFormatter.validationError(
        'Erreur de validation',
        'Les champs email et password sont requis.',
        {
          email: !data.email ? 'Email requis' : null,
          password: !data.password ? 'Mot de passe requis' : null,
        }
      )
    );
  }
  
  // ...
}
```

**Réponse** :
```json
{
  "success": false,
  "statusCode": 400,
  "code": "validation_error",
  "title": "Erreur de validation",
  "message": "Les champs email et password sont requis.",
  "errors": {
    "email": "Email requis",
    "password": "Mot de passe requis"
  }
}
```

#### Ressource non trouvée
```typescript
async findOne(id: number) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  
  if (!user) {
    throw new NotFoundException(
      this.responseFormatter.notFound(
        'Utilisateur non trouvé',
        `Aucun utilisateur trouvé avec l'ID ${id}.`
      )
    );
  }
  
  return this.responseFormatter.success(
    user,
    'Utilisateur récupéré',
    'Les informations ont été récupérées avec succès.'
  );
}
```

**Réponse** :
```json
{
  "success": false,
  "statusCode": 404,
  "code": "not_found",
  "title": "Utilisateur non trouvé",
  "message": "Aucun utilisateur trouvé avec l'ID 123."
}
```

#### Conflit (ressource existante)
```typescript
async register(data: SignupDto) {
  const existing = await this.prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (existing) {
    throw new ConflictException(
      this.responseFormatter.conflict(
        'Email déjà utilisé',
        'Un compte avec cet email existe déjà.'
      )
    );
  }
  
  // ...
}
```

**Réponse** :
```json
{
  "success": false,
  "statusCode": 409,
  "code": "conflict",
  "title": "Email déjà utilisé",
  "message": "Un compte avec cet email existe déjà."
}
```

#### Non autorisé (authentification)
```typescript
async validateToken(token: string) {
  try {
    return this.jwtService.verify(token);
  } catch (error) {
    throw new UnauthorizedException(
      this.responseFormatter.unauthorized(
        'Session expirée',
        'Votre session a expiré. Veuillez vous reconnecter.'
      )
    );
  }
}
```

**Réponse** :
```json
{
  "success": false,
  "statusCode": 401,
  "code": "unauthorized",
  "title": "Session expirée",
  "message": "Votre session a expiré. Veuillez vous reconnecter."
}
```

#### Interdit (permissions)
```typescript
async deleteUser(requestingUserId: number, targetUserId: number) {
  const requestingUser = await this.prisma.user.findUnique({
    where: { id: requestingUserId }
  });
  
  if (requestingUser.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException(
      this.responseFormatter.forbidden(
        'Accès refusé',
        'Seuls les super administrateurs peuvent supprimer des utilisateurs.'
      )
    );
  }
  
  // ...
}
```

**Réponse** :
```json
{
  "success": false,
  "statusCode": 403,
  "code": "forbidden",
  "title": "Accès refusé",
  "message": "Seuls les super administrateurs peuvent supprimer des utilisateurs."
}
```

#### Erreur serveur
```typescript
async processData(data: any) {
  try {
    // Traitement complexe
    return result;
  } catch (error) {
    console.error('Erreur lors du traitement:', error);
    
    throw new InternalServerErrorException(
      this.responseFormatter.serverError(
        'Erreur de traitement',
        'Une erreur inattendue s\'est produite lors du traitement.'
      )
    );
  }
}
```

**Réponse** :
```json
{
  "success": false,
  "statusCode": 500,
  "code": "server_error",
  "title": "Erreur de traitement",
  "message": "Une erreur inattendue s'est produite lors du traitement."
}
```

## Gestion des erreurs de validation avec class-validator

Lorsque vous utilisez `ValidationPipe`, les erreurs sont automatiquement interceptées :

```typescript
// Dans main.ts (déjà configuré)
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

**DTO avec validation** :
```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}
```

**Réponse automatique** :
```json
{
  "success": false,
  "statusCode": 400,
  "code": "validation_error",
  "title": "BadRequestException",
  "message": "Email invalide, Le mot de passe doit contenir au moins 8 caractères",
  "errors": {
    "email": "Email invalide",
    "password": "Le mot de passe doit contenir au moins 8 caractères"
  }
}
```

## Erreurs non gérées

Les erreurs non HTTP (erreurs JavaScript, exceptions non gérées) sont automatiquement converties en erreur 500 :

```json
{
  "success": false,
  "statusCode": 500,
  "code": "server_error",
  "title": "Erreur serveur",
  "message": "Une erreur inattendue s'est produite."
}
```

## Bonnes pratiques

✅ **Toujours utiliser ResponseFormatterService avec les exceptions**
```typescript
throw new NotFoundException(
  this.responseFormatter.notFound('Titre', 'Message')
);
```

✅ **Fournir des messages clairs et explicites**
```typescript
throw new BadRequestException(
  this.responseFormatter.validationError(
    'Données invalides',
    'Les informations fournies ne sont pas valides.',
    { field: 'Description de l\'erreur' }
  )
);
```

✅ **Utiliser le bon type d'exception**
- 400 : Données invalides → `BadRequestException`
- 401 : Non authentifié → `UnauthorizedException`
- 403 : Non autorisé → `ForbiddenException`
- 404 : Non trouvé → `NotFoundException`
- 409 : Conflit → `ConflictException`
- 500 : Erreur serveur → `InternalServerErrorException`

❌ **Ne pas retourner de messages techniques à l'utilisateur**
```typescript
// ❌ MAUVAIS
throw new Error('Cannot read property "id" of undefined');

// ✅ BON
throw new InternalServerErrorException(
  this.responseFormatter.serverError(
    'Erreur de traitement',
    'Une erreur est survenue lors du traitement de votre demande.'
  )
);
```

❌ **Ne pas exposer d'informations sensibles**
```typescript
// ❌ MAUVAIS
throw new Error(`Database error: ${dbError.message}`);

// ✅ BON
console.error('Database error:', dbError);
throw new InternalServerErrorException(
  this.responseFormatter.serverError(
    'Erreur de base de données',
    'Impossible de traiter votre demande pour le moment.'
  )
);
```

## Résumé

Le système de gestion des exceptions :
- ✅ Intercepte **automatiquement** toutes les exceptions
- ✅ Formate **uniformément** toutes les réponses d'erreur
- ✅ Retourne toujours **HTTP 200** avec le vrai code dans le body
- ✅ Supporte les **erreurs de validation** automatiques
- ✅ Mappe les **exceptions NestJS** aux bons codes
- ✅ Gère les **erreurs non HTTP** (erreurs inattendues)
