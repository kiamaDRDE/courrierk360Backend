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
  NotFoundException,
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
import { ChiffreAffaireService } from './chiffre-affaire.service';
import { CreateChiffreAffaireDto } from './dto/create-chiffre-affaire.dto';
import { UpdateChiffreAffaireDto } from './dto/update-chiffre-affaire.dto';
import { ChiffreAffaireResponseDto } from './dto/chiffre-affaire-response.dto';
import { ChiffreAffaireQueryDto } from './dto/chiffre-affaire-query.dto';
import { PaginatedChiffreAffaireResponseDto } from './dto/paginated-chiffre-affaire-response.dto';
import { HttpExceptionFilter } from '../../common/filters/httpException.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('Chiffre d\'affaire')
@Controller('chiffre-affaire')
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
export class ChiffreAffaireController {
  constructor(private readonly chiffreAffaireService: ChiffreAffaireService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer un nouveau chiffre d\'affaire',
    description: 'Crée un nouveau chiffre d\'affaire avec ses services associés. Un opérateur ne peut avoir qu\'un seul chiffre d\'affaire par année.'
  })
  @ApiBody({ 
    type: CreateChiffreAffaireDto,
    examples: {
      chiffre_affaire_mobile: {
        summary: 'Chiffre d\'affaire services mobiles',
        description: 'Exemple de chiffre d\'affaire avec liste des services',
        value: {
          operateurId: 1,
          annee: 2024,
          chiffreAffaire: '150000.75',
          description: 'Chiffre d\'affaire 2024 incluant tous les services mobiles',
          services: [1, 2, 3]
        }
      },
      chiffre_affaire_global: {
        summary: 'Chiffre d\'affaire global',
        description: 'Exemple de chiffre d\'affaire global avec services associés',
        value: {
          operateurId: 2,
          annee: 2024,
          chiffreAffaire: '250000.00',
          description: 'Chiffre d\'affaire global 2024',
          services: [1, 2, 4, 5]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Chiffre d\'affaire créé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'CHIFFRE_AFFAIRE_CREATED',
          title: 'Chiffre d\'affaire créé avec succès',
          message: 'Le chiffre d\'affaire a été enregistré et validé avec tous les services associés',
          data: {
            id: 85,
            operateurId: 1,
            annee: 2025,
            chiffreAffaireTotal: 785000000000,
            croissance: 12.8,
            devise: 'FCFA',
            periode: 'annuelle',
            dateCreation: '2025-01-05T21:00:00.000Z',
            dateModification: '2025-01-05T21:00:00.000Z',
            statut: 'valide',
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
                nom: 'Services Voix',
                typeService: 'Voice',
                chiffreAffaireService: 285000000000,
                pourcentage: 36.3,
                croissance: 5.2,
                marge: 45.8
              },
              {
                id: 2,
                serviceId: 2,
                nom: 'Services Data 4G/5G',
                typeService: 'Data',
                chiffreAffaireService: 385000000000,
                pourcentage: 49.0,
                croissance: 22.5,
                marge: 52.3
              },
              {
                id: 3,
                serviceId: 3,
                nom: 'Services SMS',
                typeService: 'SMS',
                chiffreAffaireService: 45000000000,
                pourcentage: 5.7,
                croissance: -8.1,
                marge: 38.2
              },
              {
                id: 4,
                serviceId: 4,
                nom: 'Services Financiers Mobiles',
                typeService: 'FinTech',
                chiffreAffaireService: 70000000000,
                pourcentage: 8.9,
                croissance: 35.7,
                marge: 28.5
              }
            ],
            analyse: {
              performanceGlobale: 'excellente',
              secteursPrincipiaux: {
                'Particuliers': 450000000000,
                'Entreprises': 280000000000,
                'Administration': 55000000000
              },
              comparaison: {
                anneePrecedente: 697500000000,
                evolution: '+12.5%',
                objectifAnnuel: 750000000000,
                realisation: '104.7%'
              },
              indicateursFinanciers: {
                ebitda: 275250000000,
                margeEbitda: 35.1,
                investissements: 125000000000,
                beneficeNet: 156800000000,
                dividendes: 78400000000
              }
            },
            conformite: {
              auditExterne: true,
              certificationComptes: 'validee',
              declarationFiscale: 'conforme',
              rapportARTC: 'transmis',
              dateAudit: '2024-12-15T00:00:00.000Z',
              prochainControle: '2025-06-30T00:00:00.000Z'
            },
            previsions: {
              objectif2026: 890000000000,
              croissancePrevisionnelle: 13.4,
              investissementsPlannifies: 150000000000,
              nouveauxServices: ['6G Pilot', 'IoT Industrial', 'AI Services']
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
  @ApiResponse({
    status: 409,
    description: 'Un chiffre d\'affaire existe déjà pour cet opérateur cette année'
  })
  async create(@Body() createChiffreAffaireDto: CreateChiffreAffaireDto): Promise<ResponseApi<ChiffreAffaireResponseDto>> {
    const data = await this.chiffreAffaireService.create(createChiffreAffaireDto);
    return new ResponseApi(
      true,
      HttpStatus.CREATED,
      'CREATED',
      'Chiffre d\'affaire créé',
      'Chiffre d\'affaire créé avec succès',
      data
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les chiffres d\'affaire avec pagination et filtres',
    description: 'Récupère la liste des chiffres d\'affaire avec support de la pagination, du tri et des filtres. Utilisez page=0 pour récupérer tous les résultats sans pagination.'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des chiffres d\'affaire récupérée avec succès',
    type: PaginatedChiffreAffaireResponseDto
  })
  async findAll(@Query() query: ChiffreAffaireQueryDto): Promise<ResponseApi<PaginatedChiffreAffaireResponseDto>> {
    const data = await this.chiffreAffaireService.findAllPaginated(query);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Chiffres d\'affaire récupérés',
      'Chiffres d\'affaire récupérés avec succès',
      data
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un chiffre d\'affaire par son ID',
    description: 'Récupère un chiffre d\'affaire spécifique avec ses relations'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du chiffre d\'affaire',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Chiffre d\'affaire récupéré avec succès',
    type: ChiffreAffaireResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Chiffre d\'affaire non trouvé'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<ChiffreAffaireResponseDto>> {
    const data = await this.chiffreAffaireService.findOne(id);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Chiffre d\'affaire récupéré',
      'Chiffre d\'affaire récupéré avec succès',
      data
    );
  }

  @Get('operateur/:operateurId')
  @ApiOperation({ 
    summary: 'Récupérer tous les chiffres d\'affaire d\'un opérateur',
    description: 'Récupère tous les chiffres d\'affaire associés à un opérateur spécifique, triés par année décroissante'
  })
  @ApiParam({
    name: 'operateurId',
    description: 'ID de l\'opérateur',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Chiffres d\'affaire de l\'opérateur récupérés avec succès',
    type: [ChiffreAffaireResponseDto]
  })
  async findByOperateur(@Param('operateurId', ParseIntPipe) operateurId: number): Promise<ResponseApi<ChiffreAffaireResponseDto[]>> {
    const data = await this.chiffreAffaireService.findByOperateur(operateurId);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Chiffres d\'affaire récupérés',
      'Chiffres d\'affaire de l\'opérateur récupérés avec succès',
      data
    );
  }

  @Get('annee/:annee')
  @ApiOperation({ 
    summary: 'Récupérer tous les chiffres d\'affaire d\'une année',
    description: 'Récupère tous les chiffres d\'affaire d\'une année spécifique, triés par montant décroissant'
  })
  @ApiParam({
    name: 'annee',
    description: 'Année des chiffres d\'affaire',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Chiffres d\'affaire de l\'année récupérés avec succès',
    type: [ChiffreAffaireResponseDto]
  })
  async findByYear(@Param('annee', ParseIntPipe) annee: number): Promise<ResponseApi<ChiffreAffaireResponseDto[]>> {
    const data = await this.chiffreAffaireService.findByYear(annee);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Chiffres d\'affaire récupérés',
      'Chiffres d\'affaire de l\'année récupérés avec succès',
      data
    );
  }

  @Get('operateur/:operateurId/annee/:annee')
  @ApiOperation({ 
    summary: 'Récupérer le chiffre d\'affaire d\'un opérateur pour une année',
    description: 'Récupère le chiffre d\'affaire spécifique d\'un opérateur pour une année donnée'
  })
  @ApiParam({
    name: 'operateurId',
    description: 'ID de l\'opérateur',
    type: 'number'
  })
  @ApiParam({
    name: 'annee',
    description: 'Année du chiffre d\'affaire',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Chiffre d\'affaire récupéré avec succès',
    type: ChiffreAffaireResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Chiffre d\'affaire non trouvé pour cet opérateur cette année'
  })
  async findByOperateurAndYear(
    @Param('operateurId', ParseIntPipe) operateurId: number,
    @Param('annee', ParseIntPipe) annee: number
  ): Promise<ResponseApi<ChiffreAffaireResponseDto>> {
    const data = await this.chiffreAffaireService.findByOperateurAndYear(operateurId, annee);
    
    if (!data) {
      throw new NotFoundException(`Aucun chiffre d'affaire trouvé pour l'opérateur ${operateurId} en ${annee}`);
    }

    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Chiffre d\'affaire récupéré',
      'Chiffre d\'affaire récupéré avec succès',
      data
    );
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un chiffre d\'affaire',
    description: 'Met à jour un chiffre d\'affaire existant et ses relations. La contrainte d\'unicité opérateur-année est maintenue.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du chiffre d\'affaire',
    type: 'number'
  })
  @ApiBody({ 
    type: UpdateChiffreAffaireDto,
    examples: {
      update_montant: {
        summary: 'Mise à jour du montant',
        description: 'Exemple de mise à jour du montant et de la description',
        value: {
          chiffreAffaire: '175000.00',
          description: 'Chiffre d\'affaire révisé après audit'
        }
      },
      update_services: {
        summary: 'Mise à jour des services',
        description: 'Exemple de mise à jour des services avec répartition',
        value: {
          chiffreAffaire: '180000.50',
          services: [1, 2, 3]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Chiffre d\'affaire mis à jour avec succès',
    type: ChiffreAffaireResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: 404,
    description: 'Chiffre d\'affaire non trouvé'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflit avec un chiffre d\'affaire existant (opérateur-année)'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChiffreAffaireDto: UpdateChiffreAffaireDto
  ): Promise<ResponseApi<ChiffreAffaireResponseDto>> {
    const data = await this.chiffreAffaireService.update(id, updateChiffreAffaireDto);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Chiffre d\'affaire mis à jour',
      'Chiffre d\'affaire mis à jour avec succès',
      data
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Supprimer un chiffre d\'affaire',
    description: 'Supprime un chiffre d\'affaire et toutes ses relations avec les services'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du chiffre d\'affaire',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Chiffre d\'affaire supprimé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'CHIFFRE_AFFAIRE_DELETED',
          title: 'Chiffre d\'affaire supprimé',
          message: 'Chiffre d\'affaire supprimé avec succès',
          data: {
            message: 'Chiffre d\'affaire supprimé avec succès',
            deletedId: 123
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Chiffre d\'affaire non trouvé'
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<{ message: string; deletedId: number }>> {
    const result = await this.chiffreAffaireService.remove(id);
    
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'CHIFFRE_AFFAIRE_DELETED',
      'Chiffre d\'affaire supprimé',
      'Le chiffre d\'affaire et ses relations ont été supprimés avec succès',
      result
    );
  }
}
