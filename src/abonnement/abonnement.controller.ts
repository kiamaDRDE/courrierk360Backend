import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseFilters,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AbonnementService } from './abonnement.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { UpdateAbonnementDto } from './dto/update-abonnement.dto';
import { AbonnementResponseDto } from './dto/abonnement-response.dto';
import { AbonnementQueryDto } from './dto/abonnement-query.dto';
import { PaginatedAbonnementResponseDto } from './dto/paginated-abonnement-response.dto';
import { HttpExceptionFilter } from '../../common/filters/httpException.filter';
import { ResponseApi } from '../../common/responseApi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Abonnement')
@Controller('abonnement')
@UseFilters(HttpExceptionFilter)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
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
export class AbonnementController {
  constructor(private readonly abonnementService: AbonnementService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer un nouveau abonnement',
    description: 'Crée un nouvel abonnement avec ses services associés'
  })
  @ApiBody({ 
    type: CreateAbonnementDto,
    examples: {
      prepaye_mobile: {
        summary: 'Abonnement mobile prépayé',
        description: 'Exemple d\'abonnement mobile prépayé avec plusieurs services',
        value: {
          operateurId: 1,
          annee: 2024,
          typeAbonnement: 'PREPAYE',
          nombreAbonnes: 15000,
          description: 'Abonnement mobile prépayé avec services voix, SMS et données',
          services: [
            { serviceId: 1 },
            { serviceId: 2 },
            { serviceId: 3 }
          ]
        }
      },
      postpaye_entreprise: {
        summary: 'Abonnement postpayé entreprise',
        description: 'Exemple d\'abonnement postpayé pour entreprises',
        value: {
          operateurId: 2,
          annee: 2024,
          typeAbonnement: 'POSTPAYE',
          nombreAbonnes: 5000,
          description: 'Abonnement postpayé entreprise avec services premium',
          services: [
            { serviceId: 1 },
            { serviceId: 4 },
            { serviceId: 5 }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Abonnement créé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'ABONNEMENT_CREATED',
          title: 'Abonnement créé avec succès',
          message: 'Le nouvel abonnement a été créé et activé avec tous ses services',
          data: {
            id: 128,
            operateurId: 1,
            annee: 2025,
            trimestre: 'Q1',
            typeAbonnement: 'Postpayé',
            categorie: 'Entreprise',
            nombreAbonnes: 15750,
            croissanceAbonnes: 8.3,
            dateCreation: '2025-01-05T20:45:00.000Z',
            dateModification: '2025-01-05T20:45:00.000Z',
            statut: 'actif',
            operateur: {
              id: 1,
              nom: 'Orange Cameroun',
              code: 'ORC',
              typeOperateur: 'Mobile'
            },
            services: [
              {
                id: 1,
                serviceId: 1,
                nom: 'Voix Mobile Pro',
                typeService: 'Voice',
                nombreAbonnesService: 15750,
                arpu: 28500,
                penetration: 100.0,
                satisfaction: 4.6
              },
              {
                id: 4,
                serviceId: 4,
                nom: 'Internet 5G Business',
                typeService: 'Data',
                nombreAbonnesService: 12850,
                arpu: 45000,
                penetration: 81.6,
                satisfaction: 4.8
              },
              {
                id: 5,
                serviceId: 5,
                nom: 'Solutions IoT',
                typeService: 'IoT',
                nombreAbonnesService: 3200,
                arpu: 125000,
                penetration: 20.3,
                satisfaction: 4.9
              }
            ],
            segmentation: {
              particuliers: 0,
              petitesEntreprises: 8750,
              moyennesEntreprises: 5200,
              grandesEntreprises: 1800,
              administration: 0
            },
            kpi: {
              churnRate: 3.2,
              acquisitionCost: 15500,
              lifetimeValue: 850000,
              revenuMensuel: 542750000,
              margeContribution: 42.5
            },
            comparaison: {
              anneePrecedente: {
                nombreAbonnes: 14580,
                croissance: '+8.0%'
              },
              concurrence: {
                partMarche: 38.7,
                positionnement: 'leader',
                ecartSuivant: '+12.3%'
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: 404,
    description: 'Opérateur ou service non trouvé'
  })
  async create(@Body() createAbonnementDto: CreateAbonnementDto): Promise<ResponseApi<AbonnementResponseDto>> {
    const data = await this.abonnementService.create(createAbonnementDto);
    return new ResponseApi(
      true,
      HttpStatus.CREATED,
      'CREATED',
      'Abonnement créé',
      'Abonnement créé avec succès',
      data
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les abonnements avec pagination et filtres',
    description: 'Récupère la liste des abonnements avec support de la pagination, du tri et des filtres. Utilisez page=0 pour récupérer tous les résultats sans pagination.'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements récupérée avec succès',
    type: PaginatedAbonnementResponseDto
  })
  async findAll(@Query() query: AbonnementQueryDto): Promise<ResponseApi<PaginatedAbonnementResponseDto>> {
    const data = await this.abonnementService.findAllPaginated(query);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Abonnements récupérés',
      'Abonnements récupérés avec succès',
      data
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un abonnement par son ID',
    description: 'Récupère un abonnement spécifique avec ses relations'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement récupéré avec succès',
    type: AbonnementResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Abonnement non trouvé'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<AbonnementResponseDto>> {
    const data = await this.abonnementService.findOne(id);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Abonnement récupéré',
      'Abonnement récupéré avec succès',
      data
    );
  }

  @Get('operateur/:operateurId')
  @ApiOperation({ 
    summary: 'Récupérer tous les abonnements d\'un opérateur',
    description: 'Récupère tous les abonnements associés à un opérateur spécifique'
  })
  @ApiParam({
    name: 'operateurId',
    description: 'ID de l\'opérateur',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnements de l\'opérateur récupérés avec succès',
    type: [AbonnementResponseDto]
  })
  async findByOperateur(@Param('operateurId', ParseIntPipe) operateurId: number): Promise<ResponseApi<AbonnementResponseDto[]>> {
    const data = await this.abonnementService.findByOperateur(operateurId);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Abonnements récupérés',
      'Abonnements de l\'opérateur récupérés avec succès',
      data
    );
  }

  @Get('annee/:annee')
  @ApiOperation({ 
    summary: 'Récupérer tous les abonnements d\'une année',
    description: 'Récupère tous les abonnements d\'une année spécifique'
  })
  @ApiParam({
    name: 'annee',
    description: 'Année des abonnements',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnements de l\'année récupérés avec succès',
    type: [AbonnementResponseDto]
  })
  async findByYear(@Param('annee', ParseIntPipe) annee: number): Promise<ResponseApi<AbonnementResponseDto[]>> {
    const data = await this.abonnementService.findByYear(annee);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Abonnements récupérés',
      'Abonnements de l\'année récupérés avec succès',
      data
    );
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un abonnement',
    description: 'Met à jour un abonnement existant et ses relations'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
    type: 'number'
  })
  @ApiBody({ 
    type: UpdateAbonnementDto,
    examples: {
      update_services: {
        summary: 'Mise à jour des services',
        description: 'Exemple de mise à jour d\'un abonnement avec nouveaux services',
        value: {
          nombreAbonnes: 18000,
          description: 'Abonnement mis à jour avec nouveaux services',
          services: [
            { serviceId: 1 },
            { serviceId: 2 },
            { serviceId: 4 },
            { serviceId: 6 }
          ]
        }
      },
      update_type: {
        summary: 'Changement de type',
        description: 'Exemple de changement de type d\'abonnement',
        value: {
          typeAbonnement: 'POSTPAYE',
          nombreAbonnes: 12000
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis à jour avec succès',
    type: AbonnementResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: 404,
    description: 'Abonnement non trouvé'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbonnementDto: UpdateAbonnementDto
  ): Promise<ResponseApi<AbonnementResponseDto>> {
    const data = await this.abonnementService.update(id, updateAbonnementDto);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Abonnement mis à jour',
      'Abonnement mis à jour avec succès',
      data
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Supprimer un abonnement',
    description: 'Supprime un abonnement et toutes ses relations'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'abonnement',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement supprimé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'ABONNEMENT_DELETED',
          title: 'Abonnement supprimé',
          message: 'Abonnement supprimé avec succès',
          data: {
            message: 'Abonnement supprimé avec succès',
            deletedId: 123
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Abonnement non trouvé'
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<{ message: string; deletedId: number }>> {
    const result = await this.abonnementService.remove(id);
    
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'ABONNEMENT_DELETED',
      'Abonnement supprimé',
      'L\'abonnement et ses relations ont été supprimés avec succès',
      result
    );
  }
}
