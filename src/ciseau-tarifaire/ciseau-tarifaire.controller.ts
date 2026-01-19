import { 
  Controller, 
  Get, 
  Post, 
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
import { EffetClubQueryDto } from './dto/effet-club-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('Ciseau Tarifaire')
@Controller('ciseau-tarifaire')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CiseauTarifaireController {
  constructor(private readonly ciseauTarifaireService: CiseauTarifaireService) {}

  @Post('calculate-for-offre/:offreId')
  @ApiOperation({ 
    summary: 'Calculer le ciseau tarifaire pour une offre',
    description: 'Calcule automatiquement le ciseau tarifaire à partir d\'une offre. Récupère l\'opérateur de l\'offre et calcule le ciseau tarifaire OffNet.'
  })
  @ApiParam({
    name: 'offreId',
    type: Number,
    description: 'Identifiant de l\'offre',
    example: 1
  })
  @ApiResponse({
    status: 201,
    description: 'Ciseau tarifaire calculé avec succès pour l\'offre',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'CISEAU_TARIFAIRE_OFFRE_CALCULATED',
          title: 'Ciseau tarifaire calculé',
          message: 'Le ciseau tarifaire pour l\'offre a été calculé avec succès',
          data: {
            offre: {
              id: 1,
              nom: 'Offre Mobile Pro',
              operateur: {
                id: 1,
                nom: 'Orange CI'
              }
            },
            ciseauTarifaire: {
              id: 1,
              annee: 2024,
              cout: '2250000.00',
              differenceOffnetHC: '15.50',
              differenceOffnetHP: '18.00',
              differenceOnnetHC: '12.00',
              differenceOnnetHP: '14.50',
              isCiseauOffHC: true,
              isCiseauOffHP: true,
              resultats: {
                offnetHC: {
                  difference: '15.50',
                  cout: '2250000.00',
                  isCiseau: true,
                  resultat: 'Ciseau tarifaire (15.50 <= 2250000.00)'
                },
                offnetHP: {
                  difference: '18.00',
                  cout: '2250000.00',
                  isCiseau: true,
                  resultat: 'Ciseau tarifaire (18.00 <= 2250000.00)'
                }
              },
              formules: {
                differenceOffnetHC: 'Tarif Base OffNet HC - Tarif Interconnexion OffNet HC = 15.50',
                differenceOffnetHP: 'Tarif Base OffNet HP - Tarif Interconnexion OffNet HP = 18.00',
                differenceOnnetHC: 'Tarif Base OnNet HC - Tarif Interconnexion OnNet HC = 12.00',
                differenceOnnetHP: 'Tarif Base OnNet HP - Tarif Interconnexion OnNet HP = 14.50'
              },
              offres: [],
              createdAt: '2026-01-19T10:30:00.000Z',
              updatedAt: '2026-01-19T10:30:00.000Z'
            },
            resultats: {
              isCiseauOffHC: true,
              isCiseauOffHP: true,
              messageOffHC: 'Ciseau tarifaire détecté pour OffNet HC',
              messageOffHP: 'Ciseau tarifaire détecté pour OffNet HP'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Offre, tarifs ou paramètres non trouvés',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'NOT_FOUND',
          title: 'Ressource non trouvée',
          message: 'L\'offre ou les données nécessaires n\'ont pas été trouvées',
          data: null
        }
      }
    }
  })
  async calculateForOffre(
    @Param('offreId', ParseIntPipe) offreId: number
  ): Promise<ResponseApi<any>> {
    const data = await this.ciseauTarifaireService.calculateCiseauTarifaireForOffre(offreId);
    return new ResponseApi(
      true,
      201,
      'CISEAU_TARIFAIRE_OFFRE_CALCULATED',
      'Ciseau tarifaire calculé',
      'Le ciseau tarifaire pour l\'offre a été calculé avec succès',
      data
    );
  }

  @Post('calculate-tarif-facial/:offreId')
  @ApiOperation({ 
    summary: 'Calculer le ciseau tarifaire selon le tarif facial',
    description: 'Calcule automatiquement le tarif facial OffNet à partir des options de l\'offre (moyenne des tarifMinuteOffNet), puis compare avec le tarif d\'interconnexion pour déterminer s\'il y a ciseau tarifaire.'
  })
  @ApiParam({
    name: 'offreId',
    type: Number,
    description: 'Identifiant de l\'offre',
    example: 1
  })
  @ApiResponse({
    status: 201,
    description: 'Ciseau tarifaire avec tarif facial calculé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'CISEAU_TARIFAIRE_FACIAL_CALCULATED',
          title: 'Ciseau tarifaire calculé',
          message: 'Le ciseau tarifaire selon le tarif facial a été calculé avec succès',
          data: {
            offre: {
              id: 1,
              nom: 'Offre Mobile Pro',
              operateur: {
                id: 1,
                nom: 'Orange CI'
              }
            },
            calculTarifFacial: {
              nombreOptions: 3,
              prixOffNetCalcule: '50.00'
            },
            ciseauTarifaire: {
              id: 1,
              annee: 2024,
              cout: '2250000.00',
              tariffacialOffnet: '50.00',
              DiffTariffacialOffnetHC: '35.50',
              DiffTariffacialOffnetHP: '32.00',
              isCiseauOffTarifHC: true,
              isCiseauOffTarifHP: true,
              resultats: {
                offnetTarifHC: {
                  tariffacial: '50.00',
                  difference: '35.50',
                  cout: '2250000.00',
                  isCiseau: true,
                  resultat: 'Ciseau tarifaire (35.50 <= 2250000.00)'
                },
                offnetTarifHP: {
                  tariffacial: '50.00',
                  difference: '32.00',
                  cout: '2250000.00',
                  isCiseau: true,
                  resultat: 'Ciseau tarifaire (32.00 <= 2250000.00)'
                }
              },
              formules: {
                tariffacialOffnet: 'Prix OffNet de l\'offre = 50.00',
                DiffTariffacialOffnetHC: 'Tarif Facial OffNet - Tarif Interconnexion OffNet HC = 35.50',
                DiffTariffacialOffnetHP: 'Tarif Facial OffNet - Tarif Interconnexion OffNet HP = 32.00'
              },
              offres: [],
              createdAt: '2026-01-19T10:30:00.000Z',
              updatedAt: '2026-01-19T10:30:00.000Z'
            },
            resultats: {
              isCiseauOffTarifHC: true,
              isCiseauOffTarifHP: true,
              messageOffTarifHC: 'Ciseau tarifaire détecté pour OffNet HC (tarif facial)',
              messageOffTarifHP: 'Ciseau tarifaire détecté pour OffNet HP (tarif facial)'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Offre, tarifs ou paramètres non trouvés',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'NOT_FOUND',
          title: 'Ressource non trouvée',
          message: 'L\'offre ou les données nécessaires n\'ont pas été trouvées',
          data: null
        }
      }
    }
  })
  async calculateTarifFacial(
    @Param('offreId', ParseIntPipe) offreId: number
  ): Promise<ResponseApi<any>> {
    const data = await this.ciseauTarifaireService.calculateCiseauTarifaireAvecTarifFacial(offreId);
    return new ResponseApi(
      true,
      201,
      'CISEAU_TARIFAIRE_FACIAL_CALCULATED',
      'Ciseau tarifaire calculé',
      'Le ciseau tarifaire selon le tarif facial a été calculé avec succès',
      data
    );
  }
}
