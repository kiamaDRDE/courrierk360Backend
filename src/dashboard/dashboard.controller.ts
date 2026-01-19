import {
  Controller,
  Get,
  Query,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardStatsDto, AvailableYearsDto, DashboardStatsQueryDto } from './dto/dashboard-stats.dto';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('Dashboard')
// @ApiBearerAuth('bearer')
// @UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('part-marche/trafic')
  getPartMarche(
    @Query('annee') annee?: number,
    @Query('typeTrafic') typeTrafic?: string,
    @Query('typeAbonnement') typeAbonnement?: string,
  ) {
    return this.dashboardService.getMarketStats({
      annee: annee ? Number(annee) : undefined,
      typeTrafic,
      typeAbonnement,
    });
  }





  


  @Get('stats')
  @ApiOperation({
    summary: 'Récupérer les statistiques générales du dashboard',
    description: `
    Récupère les statistiques globales incluant :
    - Chiffre d'affaires total par année
    - Nombre total d'abonnés par année 
    - Volume total de trafic en minutes par année
    - Répartition par opérateur avec couleurs associées
    
    Les données sont automatiquement agrégées pour l'année spécifiée.
    `
  })
  @ApiQuery({
    name: 'year',
    description: 'Année pour les statistiques (optionnel, par défaut : année courante)',
    required: false,
    type: 'number',
    example: 2025
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques dashboard récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Statistiques dashboard' },
        message: { type: 'string', example: 'Statistiques 2025 récupérées avec succès' },
        data: {
          type: 'object',
          properties: {
            year: { type: 'number', example: 2025 },
            totalRevenue: { type: 'number', example: 380000000 },
            totalSubscribers: { type: 'number', example: 13700000 },
            totalMinutes: { type: 'number', example: 216000000 },
            operatorStats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  operatorId: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'MTN' },
                  revenue: { type: 'number', example: 160000000 },
                  subscribers: { type: 'number', example: 5800000 },
                  minutes: { type: 'number', example: 98000000 },
                  color: { type: 'string', example: '#06B6D4' }
                }
              }
            }
          }
        }
      }
    },
    examples: {
      success: {
        summary: 'Réponse avec données complètes',
        value: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Statistiques dashboard',
          message: 'Statistiques 2025 récupérées avec succès',
          data: {
            year: 2025,
            totalRevenue: 380000000,
            totalSubscribers: 13700000,
            totalMinutes: 216000000,
            operatorStats: [
              {
                operatorId: 1,
                name: 'MTN',
                revenue: 160000000,
                subscribers: 5800000,
                minutes: 98000000,
                color: '#06B6D4'
              },
              {
                operatorId: 2,
                name: 'Orange',
                revenue: 120000000,
                subscribers: 5000000,
                minutes: 76000000,
                color: '#8B5CF6'
              },
              {
                operatorId: 3,
                name: 'Camtel',
                revenue: 60000000,
                subscribers: 1800000,
                minutes: 26000000,
                color: '#10B981'
              },
              {
                operatorId: 4,
                name: 'Nexttel',
                revenue: 40000000,
                subscribers: 1100000,
                minutes: 16000000,
                color: '#F59E0B'
              }
            ]
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Paramètres invalides',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'failure',
        title: 'BadRequestException',
        message: 'L\'année doit être un nombre valide',
        data: []
      }
    }
  })
  async getDashboardStats(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number
  ): Promise<ResponseApi<DashboardStatsDto>> {
    const result = await this.dashboardService.getDashboardStats(year);
    return new ResponseApi(
      result.success,
      result.statusCode,
      result.code,
      result.title,
      result.message,
      result.data
    );
  }

  @Get('years')
  @ApiOperation({
    summary: 'Récupérer les années disponibles',
    description: `
    Récupère la liste de toutes les années disponibles dans les données
    du système (chiffres d'affaires, abonnements, trafic).
    
    Utile pour alimenter dynamiquement le sélecteur d'années du dashboard.
    `
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Années disponibles récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Années disponibles' },
        message: { type: 'string', example: '6 années disponibles récupérées avec succès' },
        data: {
          type: 'object',
          properties: {
            availableYears: { 
              type: 'array', 
              items: { type: 'number' },
              example: [2020, 2021, 2022, 2023, 2024, 2025] 
            },
            currentYear: { type: 'number', example: 2025 }
          }
        }
      }
    },
    examples: {
      success: {
        summary: 'Liste des années disponibles',
        value: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Années disponibles',
          message: '6 années disponibles récupérées avec succès',
          data: {
            availableYears: [2020, 2021, 2022, 2023, 2024, 2025],
            currentYear: 2025
          }
        }
      },
      empty: {
        summary: 'Aucune année disponible',
        value: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Années disponibles',
          message: '0 années disponibles récupérées avec succès',
          data: {
            availableYears: [],
            currentYear: 2025
          }
        }
      }
    }
  })
  async getAvailableYears(): Promise<ResponseApi<AvailableYearsDto>> {
    const result = await this.dashboardService.getAvailableYears();
    return new ResponseApi(
      result.success,
      result.statusCode,
      result.code,
      result.title,
      result.message,
      result.data
    );
  }
}
