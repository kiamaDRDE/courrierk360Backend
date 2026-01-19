import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { CiseauTarifaireService } from './ciseau-tarifaire.service';
import { CreateEffetClubDto } from './dto/create-effet-club.dto';
import { UpdateEffetClubDto } from './dto/update-effet-club.dto';
import { EffetClubQueryDto } from './dto/effet-club-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('Ciseau Tarifaire')
@Controller('ciseau-tarifaire')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CiseauTarifaireController {
  constructor(private readonly ciseauTarifaireService: CiseauTarifaireService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer un nouvel effet club',
    description: 'Crée un nouvel enregistrement d\'effet club avec les coûts réseau, commerciaux et d\'interconnexion.'
  })
  @ApiResponse({
    status: 201,
    description: 'Effet club créé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'EFFET_CLUB_CREATED',
          title: 'Effet club créé',
          message: 'L\'effet club a été créé avec succès',
          data: {
            id: 1,
            annee: 2024,
            coutReseau: '1500000.00',
            coutCommerciaux: '500000.00',
            coutInterconnexion: '250000.00',
            taxe: '18.50',
            cout: '2250018.50',
            coutFormule: '1500000.00 + 500000.00 + 250000.00 + 18.50 = 2250018.50',
            createdAt: '2026-01-14T10:30:00.000Z',
            updatedAt: '2026-01-14T10:30:00.000Z'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          title: 'Erreur de validation',
          message: 'Les données fournies sont invalides',
          data: null
        }
      }
    }
  })
  async create(@Body() createEffetClubDto: CreateEffetClubDto): Promise<ResponseApi<any>> {
    const data = await this.ciseauTarifaireService.create(createEffetClubDto);
    return new ResponseApi(
      true,
      201,
      'EFFET_CLUB_CREATED',
      'Effet club créé',
      'L\'effet club a été créé avec succès',
      data
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lister tous les effets club',
    description: 'Récupère la liste paginée de tous les effets club avec possibilité de tri.'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (0 pour tous les résultats)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'éléments par page (0 = tous les résultats sans pagination)',
    example: 10
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Champ de tri',
    example: 'createdAt'
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Ordre de tri (asc/desc)',
    example: 'desc'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des effets club récupérée avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'EFFETS_CLUB_RETRIEVED',
          title: 'Succès',
          message: 'Effets club récupérés avec succès',
          data: {
            data: [
              {
                id: 1,
                annee: 2024,
                coutReseau: '1500000.00',
                coutCommerciaux: '500000.00',
                coutInterconnexion: '250000.00',
                taxe: '18.50',
                cout: '2250018.50',
                coutFormule: '1500000.00 + 500000.00 + 250000.00 + 18.50 = 2250018.50',
                createdAt: '2026-01-14T10:30:00.000Z',
                updatedAt: '2026-01-14T10:30:00.000Z'
              },
              {
                id: 2,
                annee: 2025,
                coutReseau: '1800000.00',
                coutCommerciaux: '600000.00',
                coutInterconnexion: '300000.00',
                taxe: '19.00',
                cout: '2700019.00',
                coutFormule: '1800000.00 + 600000.00 + 300000.00 + 19.00 = 2700019.00',
                createdAt: '2026-01-13T09:00:00.000Z',
                updatedAt: '2026-01-13T09:00:00.000Z'
              }
            ],
            meta: {
              total: 2,
              page: 1,
              limit: 10,
              totalPages: 1
            }
          }
        }
      }
    }
  })
  async findAll(@Query() query: EffetClubQueryDto): Promise<ResponseApi<any>> {
    const result = await this.ciseauTarifaireService.findAll(query);
    return new ResponseApi(
      true,
      200,
      'EFFETS_CLUB_RETRIEVED',
      'Succès',
      'Effets club récupérés avec succès',
      result
    );
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un effet club',
    description: 'Met à jour les informations d\'un effet club existant.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identifiant de l\'effet club',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club mis à jour avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'EFFET_CLUB_UPDATED',
          title: 'Effet club mis à jour',
          message: 'L\'effet club a été mis à jour avec succès',
          data: {
            id: 1,
            annee: 2024,
            coutReseau: '1600000.00',
            coutCommerciaux: '550000.00',
            coutInterconnexion: '275000.00',
            taxe: '18.50',
            cout: '2425018.50',
            coutFormule: '1600000.00 + 550000.00 + 275000.00 + 18.50 = 2425018.50',
            createdAt: '2026-01-14T10:30:00.000Z',
            updatedAt: '2026-01-14T11:00:00.000Z'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Effet club non trouvé',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'EFFET_CLUB_NOT_FOUND',
          title: 'Effet club non trouvé',
          message: 'Aucun effet club trouvé avec cet identifiant',
          data: null
        }
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEffetClubDto: UpdateEffetClubDto
  ): Promise<ResponseApi<any>> {
    const data = await this.ciseauTarifaireService.update(id, updateEffetClubDto);
    return new ResponseApi(
      true,
      200,
      'EFFET_CLUB_UPDATED',
      'Effet club mis à jour',
      'L\'effet club a été mis à jour avec succès',
      data
    );
  }
}
