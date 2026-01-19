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
import { TraficService } from './trafic.service';
import { CreateTraficDto } from './dto/create-trafic.dto';
import { UpdateTraficDto } from './dto/update-trafic.dto';
import { TraficResponseDto } from './dto/trafic-response.dto';
import { TraficQueryDto } from './dto/trafic-query.dto';
import { PaginatedTraficResponseDto } from './dto/paginated-trafic-response.dto';
import { HttpExceptionFilter } from '../../common/filters/httpException.filter';
import { ResponseApi } from '../../common/responseApi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Trafic')
@Controller('trafic')
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
export class TraficController {
  constructor(private readonly traficService: TraficService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer un nouveau trafic',
    description: `Crée un nouveau trafic avec ses services et autres opérateurs associés.
    
**Exemple de scénario :** L'opérateur A (ID: 1) génère du trafic ENTRANT qui utilise plusieurs services (Voix, SMS, Data) et implique le routage vers les opérateurs B et C.

**Exemple de payload :**
\`\`\`json
{
  "operateurId": 1,
  "annee": 2024,
  "typeTrafic": "ENTRANT",
  "volume": "15000.50",
  "services": [
    { "serviceId": 1 },
    { "serviceId": 3 },
    { "serviceId": 5 }
  ],
  "autresOperateurs": [
    { "autreOperateurId": 2 },
    { "autreOperateurId": 4 }
  ]
}
\`\`\``
  })
  @ApiBody({ 
    type: CreateTraficDto,
    examples: {
      'trafic-multiple-services': {
        summary: 'Trafic avec plusieurs services et opérateurs',
        description: 'Exemple complet d\'un trafic impliquant plusieurs services et opérateurs de routage',
        value: {
          operateurId: 1,
          annee: 2024,
          typeTrafic: 'ENTRANT',
          volume: '15000.50',
          services: [
            { serviceId: 1 },
            { serviceId: 3 },
            { serviceId: 5 }
          ],
          autresOperateurs: [
            { autreOperateurId: 2 },
            { autreOperateurId: 4 }
          ]
        }
      },
      'trafic-simple': {
        summary: 'Trafic simple avec un service',
        description: 'Exemple basique avec un seul service et aucun autre opérateur',
        value: {
          operateurId: 1,
          annee: 2024,
          typeTrafic: 'INTERNE',
          volume: '5000.25',
          services: [
            { serviceId: 1 }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Trafic créé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'TRAFIC_CREATED',
          title: 'Trafic créé avec succès',
          message: 'Les données de trafic ont été enregistrées et validées avec succès',
          data: {
            id: 47,
            operateurId: 1,
            annee: 2025,
            typeTrafic: 'ENTRANT',
            volume: 25847.75,
            createdAt: '2025-01-05T20:30:00.000Z',
            updatedAt: '2025-01-05T20:30:00.000Z',
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
                nom: 'Voix Mobile',
                typeService: 'Voice',
                volumeService: 18250.30,
                uniteMesure: 'minutes',
                tarifUnitaire: 45.50
              },
              {
                id: 3,
                serviceId: 3,
                nom: 'SMS International',
                typeService: 'SMS',
                volumeService: 5847.25,
                uniteMesure: 'messages',
                tarifUnitaire: 25.00
              },
              {
                id: 5,
                serviceId: 5,
                nom: 'Data Roaming',
                typeService: 'Data',
                volumeService: 1750.20,
                uniteMesure: 'MB',
                tarifUnitaire: 0.85
              }
            ],
            autresOperateurs: [
              {
                id: 2,
                operateurId: 2,
                nom: 'MTN Cameroon',
                volumeEchange: 12450.50,
                pourcentage: 48.2,
                typeRelation: 'interconnexion'
              },
              {
                id: 4,
                operateurId: 4,
                nom: 'Airtel International',
                volumeEchange: 8750.25,
                pourcentage: 33.9,
                typeRelation: 'roaming'
              }
            ],
            statistiques: {
              volumeTotal: 25847.75,
              repartitionServices: {
                'Voix': '70.6%',
                'SMS': '22.6%',
                'Data': '6.8%'
              },
              croissanceTrimestre: '+12.3%',
              qualiteService: 'excellent',
              conformiteReglementaire: true
            },
            facturation: {
              montantTotal: 1547850.75,
              devise: 'FCFA',
              modePaiement: 'compensation',
              echeance: '2025-01-30T00:00:00.000Z'
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
    description: 'Opérateur, service ou autre opérateur non trouvé'
  })
  async create(@Body() createTraficDto: CreateTraficDto): Promise<ResponseApi<TraficResponseDto>> {
    const data = await this.traficService.create(createTraficDto);
    return new ResponseApi(
      true,
      HttpStatus.CREATED,
      'CREATED',
      'Trafic créé',
      'Trafic créé avec succès',
      data
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les trafics avec pagination et filtres',
    description: 'Récupère la liste des trafics avec support de la pagination, du tri et des filtres. Utilisez page=0 pour récupérer tous les résultats sans pagination.'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des trafics récupérée avec succès',
    type: PaginatedTraficResponseDto
  })
  async findAll(@Query() query: TraficQueryDto): Promise<ResponseApi<PaginatedTraficResponseDto>> {
    const data = await this.traficService.findAllPaginated(query);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Trafics récupérés',
      'Trafics récupérés avec succès',
      data
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un trafic par son ID',
    description: 'Récupère un trafic spécifique avec ses relations'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du trafic',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Trafic récupéré avec succès',
    type: TraficResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Trafic non trouvé'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<TraficResponseDto>> {
    const data = await this.traficService.findOne(id);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Trafic récupéré',
      'Trafic récupéré avec succès',
      data
    );
  }

  @Get('operateur/:operateurId')
  @ApiOperation({ 
    summary: 'Récupérer tous les trafics d\'un opérateur',
    description: 'Récupère tous les trafics associés à un opérateur spécifique'
  })
  @ApiParam({
    name: 'operateurId',
    description: 'ID de l\'opérateur',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Trafics de l\'opérateur récupérés avec succès',
    type: [TraficResponseDto]
  })
  async findByOperateur(@Param('operateurId', ParseIntPipe) operateurId: number): Promise<ResponseApi<TraficResponseDto[]>> {
    const data = await this.traficService.findByOperateur(operateurId);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Trafics récupérés',
      'Trafics de l\'opérateur récupérés avec succès',
      data
    );
  }

  @Get('annee/:annee')
  @ApiOperation({ 
    summary: 'Récupérer tous les trafics d\'une année',
    description: 'Récupère tous les trafics d\'une année spécifique'
  })
  @ApiParam({
    name: 'annee',
    description: 'Année des trafics',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Trafics de l\'année récupérés avec succès',
    type: [TraficResponseDto]
  })
  async findByYear(@Param('annee', ParseIntPipe) annee: number): Promise<ResponseApi<TraficResponseDto[]>> {
    const data = await this.traficService.findByYear(annee);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Trafics récupérés',
      'Trafics de l\'année récupérés avec succès',
      data
    );
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un trafic',
    description: `Met à jour un trafic existant et ses relations.
    
**Note importante :** Lors de la mise à jour des services ou autres opérateurs, les relations existantes sont remplacées par les nouvelles. Pour conserver des relations existantes, incluez-les dans la nouvelle liste.

**Exemple de mise à jour :**
\`\`\`json
{
  "volume": "18500.75",
  "description": "Volume mis à jour après audit Q4",
  "services": [
    { "serviceId": 1 },
    { "serviceId": 2 },
    { "serviceId": 3 },
    { "serviceId": 6 }
  ],
  "autresOperateurs": [
    { "autreOperateurId": 2 },
    { "autreOperateurId": 3 },
    { "autreOperateurId": 5 }
  ]
}
\`\`\``
  })
  @ApiParam({
    name: 'id',
    description: 'ID du trafic',
    type: 'number'
  })
  @ApiBody({ 
    type: UpdateTraficDto,
    examples: {
      'update-volume-services': {
        summary: 'Mise à jour volume et services',
        description: 'Exemple de mise à jour du volume et modification des services associés',
        value: {
          volume: '18500.75',
          description: 'Volume mis à jour après audit Q4',
          services: [
            { serviceId: 1 },
            { serviceId: 2 },
            { serviceId: 3 },
            { serviceId: 6 }
          ],
          autresOperateurs: [
            { autreOperateurId: 2 },
            { autreOperateurId: 3 },
            { autreOperateurId: 5 }
          ]
        }
      },
      'update-partial': {
        summary: 'Mise à jour partielle',
        description: 'Exemple de mise à jour uniquement du volume et description',
        value: {
          volume: '12000.00',
          description: 'Correction du volume suite à vérification'
        }
      },
      'update-operateurs-only': {
        summary: 'Mise à jour des opérateurs uniquement',
        description: 'Exemple de modification uniquement des autres opérateurs',
        value: {
          autresOperateurs: [
            { autreOperateurId: 7 },
            { autreOperateurId: 8 }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Trafic mis à jour avec succès',
    type: TraficResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: 404,
    description: 'Trafic non trouvé'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTraficDto: UpdateTraficDto
  ): Promise<ResponseApi<TraficResponseDto>> {
    const data = await this.traficService.update(id, updateTraficDto);
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'SUCCESS',
      'Trafic mis à jour',
      'Trafic mis à jour avec succès',
      data
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Supprimer un trafic',
    description: 'Supprime un trafic et toutes ses relations'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du trafic',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Trafic supprimé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression réussie',
          message: 'Trafic avec l\'ID 1 supprimé avec succès',
          data: {
            message: 'Trafic avec l\'ID 1 supprimé avec succès'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Trafic non trouvé'
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<{ message: string }>> {
    const result = await this.traficService.remove(id);
    
    return new ResponseApi(
      true,
      HttpStatus.OK,
      'success',
      'Suppression réussie',
      result.message,
      result
    );
  }
}
