// src/user/user.controller.ts

import { Body, Controller, Get, Put, Patch, Param, Query, HttpCode, HttpStatus, ParseIntPipe, Ip, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseApi } from '../../common/responseApi.dto';

interface UserPayload {
  id: number;
  email: string;
  username: string;
  idRole: number | null;
}

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard) // 🔒 Protéger toutes les routes avec JWT
@ApiBearerAuth('bearer') // 🔒 Toutes les routes de ce controller sont sécurisées
@ApiResponse({
  status: 401,
  description: 'Error 401: Unauthorized.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 401,
        code: 'failure',
        title: 'UnauthorizedException',
        message: 'Token invalide ou expiré.',
        data: [],
      },
    },
  },
})
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
        message: 'Les mots de passe ne correspondent pas.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Error 404: Not Found.',
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
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 🔐 API 1: Afficher les informations de l'utilisateur connecté
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Profil de l\'utilisateur connecté',
    description: 'Récupère les informations du profil de l\'utilisateur connecté.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur récupéré avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'USER_PROFILE_RETRIEVED',
          title: 'Profil utilisateur récupéré avec succès',
          message: 'Les informations du profil utilisateur ont été récupérées avec succès',
          data: {
            id: 1,
            username: 'jmvondo',
            firstName: 'Jean Baptiste',
            lastName: 'Mvondo',
            email: 'j.mvondo@artc.cm',
            phone: '+237699123456',
            numero: '+237699123456',
            civilite: 'M.',
            isActive: true,
            isSignataire: true,
            role: {
              id: 1,
              nom: 'Administrateur',
              description: 'Rôle administrateur complet',
            },
            service: {
              id: 1,
              nom: 'Direction Réglementaire',
              sigle: 'DR',
              type: 'POSTE',
            },
            servicesAdditionel: [
              {
                serviceId: 2,
                serviceName: 'Service Technique',
                userId: 1,
                userName: 'jmvondo',
              },
            ],
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiai5tdm9uZG9AQXJ0Yy5jbSIsInJvbGUiOiJBRE1JTklTVFJBVEVVUiIsImlhdCI6MTcwNDQ1NjAwMCwiZXhwIjoxNzA0NDc0MDAwfQ.signature',
            expiresToken: '2025-01-06T08:00:00.000Z',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzA0NDU2MDAwLCJleHAiOjE3MDUwNjA4MDB9.refresh_signature',
            refreshExpires: '2025-01-13T02:00:00.000Z',
            createdAt: '2024-11-15T09:30:00.000Z',
            updatedAt: '2025-01-05T14:15:00.000Z',
            permissions: [
              'read_operateurs',
              'write_operateurs', 
              'read_tarifs',
              'write_tarifs',
              'admin_users'
            ],
            preferences: {
              langue: 'fr',
              timezone: 'Africa/Douala',
              notifications: {
                email: true,
                sms: false,
                push: true
              }
            },
            lastLogin: '2025-01-05T14:15:00.000Z',
            loginCount: 47,
            sessionActive: true
          }
        }
      }
    }
  })
  async getProfile(@CurrentUser() user: UserPayload) {
    const profile = await this.userService.getProfile(user.id);
    return new ResponseApi(
      true,
      200,
      'USER_PROFILE_RETRIEVED',
      'Profil utilisateur récupéré avec succès',
      'Les informations du profil utilisateur ont été récupérées avec succès',
      profile
    );
  }

  // 🔐 API 2: Changer le mot de passe de l'utilisateur connecté
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Changer son mot de passe',
    description: 'Permet à l\'utilisateur connecté de changer son propre mot de passe.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      example1: {
        summary: 'Exemple de changement de mot de passe',
        value: {
          password: 'nouveauMotDePasse123',
          confirmPassword: 'nouveauMotDePasse123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe modifié avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'PASSWORD_CHANGED',
          title: 'Mot de passe modifié avec succès',
          message: 'Votre mot de passe a été modifié et sécurisé avec succès',
          data: {
            userId: 1,
            email: 'j.mvondo@artc.cm',
            dateModification: '2025-01-05T16:20:00.000Z',
            securite: {
              forcePasswordHash: true,
              derniereModification: '2025-01-05T16:20:00.000Z',
              expirationSession: '2025-01-06T16:20:00.000Z',
              nouvelleSessionRequise: true,
              historiqueLongueur: 12,
              criteresMet: [
                'longueur_minimale',
                'caracteres_speciaux',
                'majuscules_minuscules',
                'chiffres_inclus'
              ]
            },
            action: {
              sessionActuelleRevoquee: false,
              notificationEmail: true,
              logSecurite: true,
              prochainExpiration: '2025-04-05T16:20:00.000Z'
            }
          }
        }
      }
    }
  })
  async changeMyPassword(
    @CurrentUser() user: UserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
    @Ip() ip: string,
  ) {
    const result = await this.userService.changeMyPassword(user.id, changePasswordDto, ip);
    return new ResponseApi(
      true,
      200,
      'USER_PASSWORD_CHANGED',
      'Mot de passe modifié avec succès',
      'Votre mot de passe a été modifié avec succès',
      result
    );
  }

  // 🔐 API 3: Changer le mot de passe d'un utilisateur par son ID
  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Changer le mot de passe d\'un utilisateur',
    description: 'Permet de changer le mot de passe d\'un utilisateur spécifique par son ID (Admin).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'utilisateur dont on veut changer le mot de passe',
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      example1: {
        summary: 'Exemple de changement de mot de passe',
        value: {
          password: 'nouveauMotDePasse123',
          confirmPassword: 'nouveauMotDePasse123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe modifié avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'USER_PASSWORD_CHANGED_BY_ADMIN',
          title: 'Mot de passe utilisateur modifié avec succès',
          message: 'Le mot de passe de l\'utilisateur a été modifié par l\'administrateur avec succès',
          data: {
            userId: 5,
            email: 'marie.nkomo@artc.cm',
            username: 'mnkomo',
            firstName: 'Marie',
            lastName: 'Nkomo',
            modifiePar: {
              adminId: 1,
              adminEmail: 'j.mvondo@artc.cm',
              adminUsername: 'jmvondo'
            },
            dateModification: '2025-01-05T16:45:00.000Z',
            securite: {
              motDePasseGenere: false,
              forceChangementProchainLogin: true,
              sessionRevoquee: true,
              notificationEnvoyee: true,
              ancienneSessionExpire: '2025-01-05T16:45:00.000Z'
            },
            audit: {
              actionType: 'PASSWORD_RESET_BY_ADMIN',
              ipAdmin: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              raisonModification: 'Demande de réinitialisation utilisateur',
              conformiteRGPD: true
            },
            instructions: {
              utilisateurDoit: [
                'Se connecter avec le nouveau mot de passe',
                'Changer le mot de passe lors de la prochaine connexion',
                'Vérifier ses paramètres de sécurité'
              ],
              emailNotification: true,
              smsNotification: false
            }
          }
        }
      }
    }
  })
  async changeUserPassword(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @Ip() ip: string,
  ) {
    const result = await this.userService.changeUserPassword(user.id, targetUserId, changePasswordDto, ip);
    return new ResponseApi(
      true,
      200,
      'USER_PASSWORD_CHANGED',
      'Mot de passe utilisateur modifié avec succès',
      'Le mot de passe de l\'utilisateur a été modifié avec succès',
      result
    );
  }

  // 🔐 API 4: Récupérer les logs d'actions de l'utilisateur connecté
  @Get('activity-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logs d\'activité de l\'utilisateur',
    description: 'Récupère les logs d\'activité de l\'utilisateur connecté avec pagination et filtres.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Numéro de la page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'action', required: false, type: String, example: 'LOGIN', description: 'Filtrer par action' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'connexion', description: 'Recherche dans la description' })
  @ApiResponse({
    status: 200,
    description: 'Logs d\'activité récupérés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'ACTIVITY_LOGS_RETRIEVED',
          title: 'Logs d\'activité récupérés avec succès',
          message: 'Les logs d\'activité de l\'utilisateur ont été récupérés avec succès',
          data: {
            logs: [
              {
                id: 47,
                userId: 1,
                action: 'CREATE_TARIF_INTERCONNEXION',
                description: 'Création d\'un nouveau tarif d\'interconnexion pour Orange Cameroun 2025',
                ipAddress: '192.168.1.150',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                dateAction: '2025-01-05T16:30:00.000Z',
                details: {
                  module: 'TarifInterconnexion',
                  operateurId: 2,
                  annee: 2025,
                  anciennesValeurs: null,
                  nouvellesValeurs: {
                    tarifOffNetHeureCreuse: 28.50,
                    tarifOffNetHeurePleine: 35.75
                  }
                },
                localisation: {
                  pays: 'Cameroun',
                  ville: 'Yaoundé',
                  timezone: 'Africa/Douala'
                }
              },
              {
                id: 46,
                userId: 1,
                action: 'LOGIN',
                description: 'Connexion réussie au système ARTC',
                ipAddress: '192.168.1.150',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                dateAction: '2025-01-05T14:15:00.000Z',
                details: {
                  module: 'Auth',
                  methodAuth: 'JWT_TOKEN',
                  sessionDuration: '8 heures',
                  previousLogin: '2025-01-04T16:45:00.000Z'
                },
                securite: {
                  score: 95,
                  anomalies: [],
                  location_change: false
                }
              },
              {
                id: 45,
                userId: 1,
                action: 'UPDATE_TYPE_OPERATEUR',
                description: 'Modification du type d\'opérateur Mobile Premium',
                ipAddress: '192.168.1.150',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                dateAction: '2025-01-05T15:45:00.000Z',
                details: {
                  module: 'TypeOperateur',
                  entityId: 1,
                  champsModifies: ['nom', 'description'],
                  anciennesValeurs: {
                    nom: 'Mobile',
                    description: 'Opérateur de télécommunication mobile'
                  },
                  nouvellesValeurs: {
                    nom: 'Mobile Premium',
                    description: 'Opérateur mobile premium offrant services 5G'
                  }
                }
              }
            ],
            statistiques: {
              totalActions: 47,
              actionsAujourdhui: 3,
              derniereConnexion: '2025-01-05T14:15:00.000Z',
              modulesActifs: ['TarifInterconnexion', 'TypeOperateur', 'Auth'],
              scoreActivite: 'élevé'
            },
            pagination: {
              page: 1,
              limit: 10,
              total: 47,
              totalPages: 5,
              hasNextPage: true,
              hasPreviousPage: false
            }
          }
        }
      }
    }
  })
  async getActivityLogs(
    @CurrentUser() user: UserPayload,
    @Query() query: ActivityLogQueryDto,
  ) {
    const activityLogs = await this.userService.getActivityLogs(user.id, query);
    return new ResponseApi(
      true,
      200,
      'ACTIVITY_LOGS_RETRIEVED',
      'Logs d\'activité récupérés avec succès',
      'Les logs d\'activité de l\'utilisateur ont été récupérés avec succès',
      activityLogs
    );
  }
}
