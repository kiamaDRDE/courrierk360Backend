import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TarifInterconnexionService } from './tarif-interconnexion.service';
import { CreateTarifInterconnexionDto } from './dto/create-tarif-interconnexion.dto';
import { UpdateTarifInterconnexionDto } from './dto/update-tarif-interconnexion.dto';
import { QueryTarifInterconnexionDto } from './dto/query-tarif-interconnexion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tarif Interconnexion')
@Controller('tarif-interconnexion')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TarifInterconnexionController {
  constructor(
    private readonly tarifInterconnexionService: TarifInterconnexionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau tarif d\'interconnexion' })
  @ApiResponse({
    status: 201,
    description: 'Tarif d\'interconnexion créé avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Tarif créé',
        message: 'Tarif d\'interconnexion pour "MTN" (2025) créé avec succès.',
        data: {
          id: 1,
          operateurId: 1,
          annee: 2025,
          tarifOffNetHeureCreuse: 25.50,
          tarifOffNetHeurePleine: 30.75,
          tarifOnNetHeureCreuse: 15.25,
          tarifOnNetHeurePleine: 20.00,
          typeTarif: 'Standard',
          description: 'Tarif applicable pour les appels on-net et off-net',
          createdAt: '2025-12-16T07:30:00.000Z',
          updatedAt: '2025-12-16T07:30:00.000Z',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
            type: 'Mobile',
          },
          services: [
            { id: 1, nom: 'Mobile' },
            { id: 2, nom: 'Fixe' }
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Un tarif existe déjà pour cet opérateur et cette année',
  })
  @ApiResponse({
    status: 404,
    description: 'Opérateur introuvable',
  })
  create(@Body() createDto: CreateTarifInterconnexionDto) {
    return this.tarifInterconnexionService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tarifs d\'interconnexion avec filtres et pagination' })
  @ApiResponse({
    status: 200,
    description: 'Liste des tarifs d\'interconnexion récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Liste des tarifs',
        message: '2 tarif(s) d\'interconnexion sur 5 récupéré(s) avec succès.',
        data: {
          tarifs: [
            {
              id: 1,
              operateurId: 1,
              annee: 2025,
              tarifOffNetHeureCreuse: 25.50,
              tarifOffNetHeurePleine: 30.75,
              tarifOnNetHeureCreuse: 15.25,
              tarifOnNetHeurePleine: 20.00,
              typeTarif: 'Standard',
              description: 'Tarif applicable pour les appels on-net et off-net',
              createdAt: '2025-12-16T07:30:00.000Z',
              updatedAt: '2025-12-16T07:30:00.000Z',
              operateur: {
                id: 1,
                nom: 'MTN',
                code: 'MTN',
                type: 'Mobile',
                statut: 'Actif',
              },
              services: [
                { id: 1, nom: 'Mobile' },
                { id: 2, nom: 'Fixe' }
              ],
            },
            {
              id: 2,
              operateurId: 1,
              annee: 2024,
              tarifOffNetHeureCreuse: 23.75,
              tarifOffNetHeurePleine: 28.50,
              tarifOnNetHeureCreuse: 13.00,
              tarifOnNetHeurePleine: 18.25,
              typeTarif: 'Premium',
              description: 'Tarif premium avec réductions',
              createdAt: '2024-01-15T10:00:00.000Z',
              updatedAt: '2024-01-15T10:00:00.000Z',
              operateur: {
                id: 1,
                nom: 'MTN',
                code: 'MTN',
                type: 'Mobile',
              },
              services: [
                { id: 1, nom: 'Mobile' },
                { id: 2, nom: 'Fixe' }
              ],
            },
            {
              id: 2,
              operateurId: 1,
              annee: 2024,
              tarif: 23.75,
              description: null,
              createdAt: '2024-01-15T10:00:00.000Z',
              updatedAt: '2024-01-15T10:00:00.000Z',
              operateur: {
                id: 1,
                nom: 'MTN',
                code: 'MTN',
                type: 'Mobile',
                statut: 'Actif',
              },
              services: [
                { id: 1, nom: 'Mobile' }
              ],
            },
          ],
          pagination: {
            total: 5,
            page: 1,
            limit: 2,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryTarifInterconnexionDto) {
    return this.tarifInterconnexionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un tarif d\'interconnexion par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Tarif d\'interconnexion récupéré avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Tarif récupéré',
        message: 'Tarif d\'interconnexion pour "MTN" (2025) récupéré avec succès.',
        data: {
          id: 1,
          operateurId: 1,
          annee: 2025,
          tarifOffNetHeureCreuse: 25.50,
          tarifOffNetHeurePleine: 30.75,
          tarifOnNetHeureCreuse: 15.25,
          tarifOnNetHeurePleine: 20.00,
          typeTarif: 'Standard',
          description: 'Tarif applicable pour les appels on-net et off-net',
          createdAt: '2025-12-16T07:30:00.000Z',
          updatedAt: '2025-12-16T07:30:00.000Z',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
            type: 'Mobile',
            statut: 'Actif',
          },
          services: [
            { id: 1, nom: 'Mobile' },
            { id: 2, nom: 'Fixe' }
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tarif d\'interconnexion introuvable',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarifInterconnexionService.findOne(id);
  }

  @Get('operateur/:operateurId/annee/:annee')
  @ApiOperation({ summary: 'Obtenir tous les tarifs d\'un opérateur pour une année donnée' })
  @ApiResponse({
    status: 200,
    description: 'Tarifs d\'interconnexion récupérés avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Tarifs récupérés',
        message: '2 tarifs d\'interconnexion pour "MTN" (2025) récupérés avec succès.',
        data: {
          tarifs: [
            {
              id: 1,
              operateurId: 1,
              annee: 2025,
              tarifOffNetHeureCreuse: 25.50,
              tarifOffNetHeurePleine: 30.75,
              tarifOnNetHeureCreuse: 15.25,
              tarifOnNetHeurePleine: 20.00,
              typeTarif: 'Standard',
              description: 'Tarif standard pour les appels',
              createdAt: '2025-12-16T07:30:00.000Z',
              updatedAt: '2025-12-16T07:30:00.000Z',
              operateur: {
                id: 1,
                nom: 'MTN',
                code: 'MTN',
                type: 'Mobile',
                statut: 'Actif',
              },
              services: [
                { id: 1, nom: 'Mobile' },
                { id: 2, nom: 'Fixe' }
              ],
            },
            {
              id: 2,
              operateurId: 1,
              annee: 2025,
              tarifOffNetHeureCreuse: 22.00,
              tarifOffNetHeurePleine: 27.50,
              tarifOnNetHeureCreuse: 12.75,
              tarifOnNetHeurePleine: 17.25,
              typeTarif: 'Premium',
              description: 'Tarif premium avec réductions',
              createdAt: '2025-12-16T08:00:00.000Z',
              updatedAt: '2025-12-16T08:00:00.000Z',
              operateur: {
                id: 1,
                nom: 'MTN',
                code: 'MTN',
                type: 'Mobile',
                statut: 'Actif',
              },
              services: [
                { id: 1, nom: 'Mobile' }
              ],
            }
          ],
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
            type: 'Mobile',
            statut: 'Actif',
          },
          annee: 2025,
          count: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tarif introuvable pour cet opérateur et cette année',
  })
  findByOperateurAndAnnee(
    @Param('operateurId', ParseIntPipe) operateurId: number,
    @Param('annee', ParseIntPipe) annee: number,
  ) {
    return this.tarifInterconnexionService.findByOperateurAndAnnee(
      operateurId,
      annee,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un tarif d\'interconnexion' })
  @ApiResponse({
    status: 200,
    description: 'Tarif d\'interconnexion mis à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Conflit avec un tarif existant',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarif ou opérateur introuvable',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTarifInterconnexionDto,
  ) {
    return this.tarifInterconnexionService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un tarif d\'interconnexion' })
  @ApiResponse({
    status: 200,
    description: 'Tarif d\'interconnexion supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarif d\'interconnexion introuvable',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarifInterconnexionService.remove(id);
  }
}
