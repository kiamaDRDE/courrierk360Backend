// src/signup/signup.controller.ts

import { SignupDto } from './dto/signup.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUsersDto } from './dto/delete-users.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { SignupService } from './signup.service';
import { Body, Controller, Post, Patch, Delete, Get, Param, Query, HttpStatus, HttpCode, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Signup')
@Controller('signup')
@ApiResponse({
  status: 400,
  description: 'Error 400: Bad Request.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 400,
        code: 'failure',
        title: 'BadRequestException',
        message: 'Cet email est déjà utilisé.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 500,
  description: 'Error 500: Server error.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 500,
        code: 'failure',
        title: 'InternalServerErrorException',
        message: 'Error 500: Server error.',
        data: [],
      },
    },
  },
})
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post('sync-external-users')
  @ApiOperation({ summary: 'Synchroniser les utilisateurs depuis une API externe' })
  @ApiResponse({ status: 200, description: 'Utilisateurs synchronisés avec succès' })
  async syncExternalUsers(@Body('url') url?: string) {
    return this.signupService.syncUsersFromExternal(url);
  }

  // 👤 Création d'un utilisateur
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Création d\'un utilisateur',
    description: `Crée un nouvel utilisateur dans le système.

**Validations effectuées** :
- ✅ Email unique : L'email ne doit pas être déjà utilisé
- ✅ Username unique : Le nom d'utilisateur ne doit pas être déjà utilisé
- ✅ Service unique : Le service principal (idService) ne peut être attribué qu'à un seul utilisateur actif à la fois
- ✅ Rôle valide : Le rôle doit exister et ne pas être supprimé (isDelete=false)
- ✅ Service valide : Le service doit exister et ne pas être supprimé
- ✅ Correspondant valide : Le correspondant doit exister et ne pas être supprimé (si fourni)

**Note** : Plusieurs utilisateurs peuvent partager les mêmes services additionnels (servicesAdditionel).`,
  })
  @ApiBody({
    type: SignupDto,
    examples: {
      example1: {
        summary: 'Utilisateur complet avec services additionnels',
        value: {
          username: 'jdupont',
          email: 'jean.dupont@example.com',
          password: 'motDePasseSecurise123',
          civilite: 'M.',
          firstName: 'Jean',
          lastName: 'Dupont',
          phone: '+237699999999',
          numero: '+237699999999',
          idService: 1,
          idRole: 2,
          idCorrespondant: 1,
          servicesAdditionel: [
            { serviceId: 2 },
            { serviceId: 3 }
          ],
          isActive: true,
          isSignataire: false,
        },
      },
      example2: {
        summary: 'Utilisateur minimal',
        value: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'adminPass123',
          numero: '+237655005647',
          idRole: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Création utilisateur',
          message: 'Utilisateur créé avec succès.',
          data: {
            id: 1,
            username: 'jdupont',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@example.com',
            phone: '+237699999999',
            numero: '+237699999999',
            civilite: 'M.',
            isActive: true,
            isSignataire: false,
            role: {
              id: 2,
              nom: 'Utilisateur',
              description: 'Rôle utilisateur standard',
            },
            service: {
              id: 1,
              nom: 'Service Informatique',
              sigle: 'SI',
            },
            servicesAdditionel: [
              {
                serviceId: 2,
                serviceName: 'Service RH',
                userId: 1,
                userName: 'jdupont',
              },
            ],
            createdAt: '2025-12-12T10:41:24.000Z',
            updatedAt: '2025-12-12T10:41:24.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation (email/username existant, service déjà attribué, etc.).',
    content: {
      'application/json': {
        examples: {
          emailExistant: {
            summary: 'Email déjà utilisé',
            value: {
              success: false,
              statusCode: 400,
              code: 'failure',
              title: 'BadRequestException',
              message: 'Cet email est déjà utilisé.',
              data: [],
            },
          },
          serviceDejaAttribue: {
            summary: 'Service principal déjà attribué',
            value: {
              success: false,
              statusCode: 400,
              code: 'failure',
              title: 'BadRequestException',
              message: 'Le service "Service Informatique" est déjà attribué à un autre utilisateur actif.',
              data: [],
            },
          },
        },
      },
    },
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.signupService.signup(signupDto);
  }

  // 📋 Liste de tous les utilisateurs avec filtres et pagination
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liste des utilisateurs avec filtres et pagination',
    description: 'Récupère la liste des utilisateurs avec possibilité de filtrer et paginer les résultats.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de la page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (0 = tous)', example: 10 })
  @ApiQuery({ name: 'nom', required: false, description: 'Filtrer par nom (recherche partielle)', example: 'Jean' })
  @ApiQuery({ name: 'email', required: false, description: 'Filtrer par email (recherche partielle)', example: 'jean@example.com' })
  @ApiQuery({ name: 'numero', required: false, description: 'Filtrer par numéro', example: '+237' })
  @ApiQuery({ name: 'fonction', required: false, description: 'Filtrer par fonction', example: 'Développeur' })
  @ApiQuery({ name: 'idRole', required: false, description: 'Filtrer par ID du rôle', type: Number, example: 1 })
  @ApiQuery({ name: 'idService', required: false, description: 'Filtrer par ID du service', type: Number, example: 1 })
  @ApiQuery({ name: 'isSignataire', required: false, description: 'Filtrer les utilisateurs signataires (true/false, 1/0)', schema: { type: 'string', enum: ['true', 'false', '1', '0'] }, example: 'true' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif/inactif (true/false, 1/0)', schema: { type: 'string', enum: ['true', 'false', '1', '0'] }, example: 'true' })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès.',
    content: {
      'application/json': {
        examples: {
          withPagination: {
            summary: 'Avec pagination',
            value: {
              success: true,
              statusCode: 201,
              code: 'success',
              title: 'Liste des utilisateurs',
              message: '10 utilisateur(s) sur 25 récupéré(s) avec succès.',
              data: {
                users: [
                  {
                    id: 1,
                    username: 'jdupont',
                    firstName: 'Jean',
                    lastName: 'Dupont',
                    email: 'jean.dupont@example.com',
                    numero: '+237699999999',
                    isActive: true,
                    isSignataire: false,
                    role: {
                      id: 1,
                      nom: 'Administrateur',
                      description: 'Rôle administrateur',
                    },
                    service: {
                      id: 1,
                      nom: 'Service Informatique',
                      sigle: 'SI',
                    },
                    servicesAdditionel: [
                      {
                        serviceId: 2,
                        serviceName: 'Service RH',
                        userId: 1,
                        userName: 'jdupont',
                      },
                    ],
                    createdAt: '2025-12-12T10:41:24.000Z',
                    updatedAt: '2025-12-12T10:41:24.000Z',
                  },
                ],
                pagination: {
                  total: 25,
                  page: 1,
                  limit: 10,
                  totalPages: 3,
                  hasNextPage: true,
                  hasPreviousPage: false,
                },
              },
            },
          },
          withFilters: {
            summary: 'Avec filtres (isActive=true, isSignataire=true)',
            description: 'Exemple: /signup?isActive=true&isSignataire=true',
            value: {
              success: true,
              statusCode: 201,
              code: 'success',
              title: 'Liste des utilisateurs',
              message: '2 utilisateur(s) sur 2 récupéré(s) avec succès.',
              data: {
                users: [
                  {
                    id: 1,
                    username: 'admin',
                    firstName: 'Jean',
                    lastName: 'Dupont',
                    email: 'jean.dupont@example.com',
                    numero: '+237699999999',
                    isActive: true,
                    isSignataire: true,
                    role: {
                      id: 1,
                      nom: 'Super Admin',
                      description: 'Rôle super administrateur',
                    },
                    service: {
                      id: 1,
                      nom: 'Direction Générale',
                      sigle: 'DG',
                    },
                    servicesAdditionel: [],
                    createdAt: '2025-12-12T10:41:24.000Z',
                    updatedAt: '2025-12-12T10:41:24.000Z',
                  },
                ],
                pagination: {
                  total: 2,
                  page: 1,
                  limit: 10,
                  totalPages: 1,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              },
            },
          },
          usersInactifs: {
            summary: 'Filtrer utilisateurs inactifs (isActive=false)',
            description: 'Exemple: /signup?isActive=false',
            value: {
              success: true,
              statusCode: 201,
              code: 'success',
              title: 'Liste des utilisateurs',
              message: '1 utilisateur(s) sur 1 récupéré(s) avec succès.',
              data: {
                users: [
                  {
                    id: 5,
                    username: 'ancien_user',
                    firstName: 'Pierre',
                    lastName: 'Martin',
                    email: 'pierre.martin@example.com',
                    numero: '+237688888888',
                    isActive: false,
                    isSignataire: false,
                    role: {
                      id: 2,
                      nom: 'Utilisateur',
                      description: 'Rôle utilisateur standard',
                    },
                    service: {
                      id: 3,
                      nom: 'Service RH',
                      sigle: 'RH',
                    },
                    servicesAdditionel: [],
                    createdAt: '2025-11-10T08:30:00.000Z',
                    updatedAt: '2025-12-01T14:20:00.000Z',
                  },
                ],
                pagination: {
                  total: 1,
                  page: 1,
                  limit: 10,
                  totalPages: 1,
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
              },
            },
          },
        },
      },
    },
  })
  async getAllUsers(@Query() query: UserQueryDto) {
    return this.signupService.getAllUsers(query);
  }

  // 👤 Récupérer un utilisateur par son ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détails d\'un utilisateur',
    description: 'Récupère les informations détaillées d\'un utilisateur par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'utilisateur à récupérer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur récupéré avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Détails utilisateur',
          message: 'Utilisateur récupéré avec succès.',
          data: {
            id: 1,
            username: 'jdupont',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@example.com',
            phone: '+237699999999',
            numero: '+237699999999',
            civilite: 'M.',
            isActive: true,
            isSignataire: false,
            role: {
              id: 2,
              nom: 'Utilisateur',
              description: 'Rôle utilisateur standard',
            },
            service: {
              id: 1,
              nom: 'Service Informatique',
              sigle: 'SI',
            },
            servicesAdditionel: [
              {
                serviceId: 2,
                serviceName: 'Service RH',
                userId: 1,
                userName: 'jdupont',
              },
            ],
            resetOtp: null,
            resetExpires: null,
            refreshToken: null,
            refreshExpires: null,
            verifyOtp: null,
            verifyExpires: null,
            createdAt: '2025-12-12T10:41:24.000Z',
            updatedAt: '2025-12-12T10:41:24.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé.',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'failure',
          title: 'NotFoundException',
          message: 'Utilisateur non trouvé.',
          data: [],
        },
      },
    },
  })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.signupService.getUserById(id);
  }

  // �👤 Mise à jour d'un utilisateur
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mise à jour d\'un utilisateur',
    description: `Met à jour les informations d'un utilisateur existant. Tous les champs sont optionnels.

**Validations effectuées** :
- ✅ Utilisateur existant : L'utilisateur doit exister dans le système
- ✅ Email unique : Si modifié, l'email ne doit pas être déjà utilisé par un autre utilisateur
- ✅ Username unique : Si modifié, le nom d'utilisateur ne doit pas être déjà utilisé par un autre utilisateur
- ✅ Service unique : Si modifié, le service principal (idService) ne peut être attribué qu'à un seul utilisateur actif à la fois
- ✅ Rôle valide : Le rôle doit exister et ne pas être supprimé (si fourni)
- ✅ Service valide : Le service doit exister et ne pas être supprimé (si fourni)
- ✅ Correspondant valide : Le correspondant doit exister et ne pas être supprimé (si fourni)

**Note** : Plusieurs utilisateurs peuvent partager les mêmes services additionnels (servicesAdditionel).`,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'utilisateur à mettre à jour',
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      example1: {
        summary: 'Exemple complet (tous les champs sont optionnels)',
        value: {
          username: 'jdupont_modifie',
          firstName: 'Jean',
          lastName: 'Dupont Modifié',
          email: 'jean.dupont.modifie@example.com',
          phone: '+237655005647',
          numero: '+237655005647',
          civilite: 'M.',
          password: 'nouveauMotDePasseSecurise123',
          idRole: 1,
          idService: 2,
          servicesAdditionel: [
            { serviceId: 3 },
            { serviceId: 4 },
          ],
          isActive: true,
          isSignataire: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Mise à jour utilisateur',
          message: 'Utilisateur mis à jour avec succès.',
          data: {
            id: 1,
            username: 'jdupont_modifie',
            firstName: 'Jean',
            lastName: 'Dupont Modifié',
            email: 'jean.dupont.modifie@example.com',
            numero: '+237655005647',
            phone: '+237655005647',
            civilite: 'M.',
            isActive: true,
            isSignataire: true,
            role: {
              id: 1,
              nom: 'Super Admin',
              description: 'Rôle super administrateur',
            },
            service: {
              id: 2,
              nom: 'Service Commercial',
              sigle: 'SC',
            },
            servicesAdditionel: [
              {
                serviceId: 3,
                serviceName: 'Service Marketing',
                userId: 1,
                userName: 'jdupont_modifie',
              },
              {
                serviceId: 4,
                serviceName: 'Service Support',
                userId: 1,
                userName: 'jdupont_modifie',
              },
            ],
            createdAt: '2025-12-12T10:41:24.000Z',
            updatedAt: '2025-12-12T12:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation (email/username existant, service déjà attribué, etc.).',
    content: {
      'application/json': {
        examples: {
          emailExistant: {
            summary: 'Email déjà utilisé',
            value: {
              success: false,
              statusCode: 400,
              code: 'failure',
              title: 'BadRequestException',
              message: 'Cet email est déjà utilisé par un autre utilisateur.',
              data: [],
            },
          },
          serviceDejaAttribue: {
            summary: 'Service principal déjà attribué',
            value: {
              success: false,
              statusCode: 400,
              code: 'failure',
              title: 'BadRequestException',
              message: 'Le service "Service Commercial" est déjà attribué à un autre utilisateur actif.',
              data: [],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé.',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'failure',
          title: 'NotFoundException',
          message: 'Utilisateur non trouvé.',
          data: [],
        },
      },
    },
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.signupService.updateUser(id, updateUserDto);
  }

  // 🗑️ Suppression d'un utilisateur
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression d\'un utilisateur',
    description: 'Supprime un utilisateur par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'utilisateur à supprimer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprimé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Suppression utilisateur',
          message: 'Utilisateur supprimé avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé.',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'failure',
          title: 'NotFoundException',
          message: 'Utilisateur non trouvé.',
          data: [],
        },
      },
    },
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.signupService.deleteUser(id);
  }

  // 🗑️ Suppression multiple d'utilisateurs
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression multiple d\'utilisateurs',
    description: 'Supprime plusieurs utilisateurs en une seule requête.',
  })
  @ApiBody({
    type: DeleteUsersDto,
    examples: {
      example1: {
        summary: 'Supprimer 3 utilisateurs',
        value: {
          ids: [1, 2, 3],
        },
      },
      example2: {
        summary: 'Supprimer 1 utilisateur',
        value: {
          ids: [5],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateurs supprimés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Suppression multiple',
          message: '3 utilisateur(s) supprimé(s) avec succès.',
          data: {
            count: 3,
            ids: [1, 2, 3],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Aucun ID fourni.',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 400,
          code: 'failure',
          title: 'BadRequestException',
          message: 'Aucun ID fourni.',
          data: [],
        },
      },
    },
  })
  async deleteMultipleUsers(@Body() deleteUsersDto: DeleteUsersDto) {
    return this.signupService.deleteMultipleUsers(deleteUsersDto.ids);
  }
}
