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

  // 👤 Création d'un utilisateur
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Création d\'un utilisateur',
    description: 'Crée un nouvel utilisateur dans le système.',
  })
  @ApiBody({
    type: SignupDto,
    examples: {
      example1: {
        summary: 'Utilisateur avec fonction',
        value: {
          nom: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          numero: '+237699999999',
          fonction: 'Développeur',
          password: 'motDePasseSecurise123',
          role: 'UTILISATEUR',
        },
      },
      example2: {
        summary: 'Super Admin sans fonction',
        value: {
          nom: 'Admin Principal',
          email: 'admin@example.com',
          numero: '+237655005647',
          password: 'adminPass123',
          role: 'SUPER_ADMIN',
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
            nom: 'Jean Dupont',
            email: 'jean.dupont@example.com',
            numero: '+237699999999',
            fonction: 'Développeur',
            role: 'UTILISATEUR',
            createdAt: '2025-12-12T10:41:24.000Z',
            updatedAt: '2025-12-12T10:41:24.000Z',
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
  @ApiQuery({ name: 'role', required: false, description: 'Filtrer par rôle', enum: ['SUPER_ADMIN', 'UTILISATEUR'] })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut', enum: ['Actif', 'Inactif'] })
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
                    nom: 'Jean Dupont',
                    email: 'jean.dupont@example.com',
                    numero: '+237699999999',
                    fonction: 'Développeur',
                    role: 'UTILISATEUR',
                    statut: 'Actif',
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
            summary: 'Avec filtres',
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
                    nom: 'Jean Dupont',
                    email: 'jean.dupont@example.com',
                    numero: '+237699999999',
                    fonction: 'Développeur',
                    role: 'SUPER_ADMIN',
                    statut: 'Actif',
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
            nom: 'Jean Dupont',
            email: 'jean.dupont@example.com',
            numero: '+237699999999',
            fonction: 'Développeur',
            role: 'UTILISATEUR',
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
    description: 'Met à jour les informations d\'un utilisateur existant.',
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
          nom: 'Jean Dupont Modifié',
          email: 'jean.dupont.modifie@example.com',
          numero: '+237655005647',
          fonction: 'Développeur Senior',
          password: 'nouveauMotDePasseSecurise123',
          role: 'SUPER_ADMIN',
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
            nom: 'Jean Dupont Modifié',
            email: 'jean.dupont@example.com',
            numero: '+237699999999',
            fonction: 'Développeur Senior',
            role: 'UTILISATEUR',
            createdAt: '2025-12-12T10:41:24.000Z',
            updatedAt: '2025-12-12T12:00:00.000Z',
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
