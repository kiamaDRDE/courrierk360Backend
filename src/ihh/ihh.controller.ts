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
import { IhhService } from './ihh.service';
import { PartMarcheResponseDto } from './dto/part-marche-response.dto';
import { PartMarcheQueryDto } from './dto/part-marche-query.dto';
import { ResponseApi } from '../../common/responseApi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Part de marché (IHH)')
@Controller('ihh')
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
export class IhhController {
  constructor(private readonly ihhService: IhhService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lister toutes les parts de marché avec calculs IHH',
    description: `Récupère la liste paginée de toutes les parts de marché avec les indices IHH (Indice de Herfindahl-Hirschman) et indicateurs de concentration.

**🔢 FORMULES DE CALCUL :**

**1. Part de marché (%) :**
- Part de marché Trafic = (Volume trafic opérateur / Somme totale trafic) × 100
- Part de marché Abonnés = (Nombre abonnés opérateur / Somme totale abonnés) × 100  
- Part de marché CA = (Chiffre d'affaires opérateur / Somme totale CA) × 100

**2. Indice IHH (Herfindahl-Hirschman Index) :**
- IHH = Σ(Part de marché)² pour tous les opérateurs d'une année
- Exemple : Si 3 opérateurs ont 40%, 35% et 25% de parts de marché :
  - IHH = (40)² + (35)² + (25) = 1600 + 1225 + 625 = 3450

**3. Seuils de concentration :**
- IHH ≤ 1500 : Marché peu concentré
- 1500 < IHH ≤ 2500 : Marché modérément concentré  
- IHH > 2500 : Marché hautement concentré
- **Seuil critique : IHH > 2000 = Marché concentré (isConcentre = true)**

**📊 Note :** L'IHH est identique pour tous les opérateurs d'une même année car il mesure la concentration globale du marché.`
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
    name: 'operateur',
    required: false,
    type: String,
    description: 'Filtrer par nom d\'opérateur',
    example: 'Orange'
  })
  @ApiQuery({
    name: 'annee',
    required: false,
    type: Number,
    description: 'Filtrer par année',
    example: 2024
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Champ de tri',
    example: 'annee'
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
    description: 'Liste des parts de marché récupérée avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'PARTS_MARCHE_RETRIEVED',
          title: 'Succès',
          message: 'Parts de marché récupérées avec succès',
          data: {
            data: [
              {
                id: 1,
                operateurId: 1,
                operateurName: 'MTN Cameroon',
                annee: 2024,
                trafic: {
                  partMarcheTrafic: '45.25',
                  ihhTrafic: '2850.75',
                  isConcentreTrafic: true
                },
                abonnement: {
                  partMarcheAbonnes: '48.90',
                  ihhAbonne: '2650.25',
                  isConcentreAbonne: true
                },
                chiffreAffaire: {
                  partMarcheChiffreAffaire: '52.75',
                  ihhChiffreAffaire: '3100.50',
                  isConcentreChiffreAffaire: true
                },
                sommeTrafic: '125000.50',
                sommeAbonnement: '15000000.00',
                sommeChiffreAffaire: '85000000.00',
                createdAt: '2025-01-05T10:30:00.000Z',
                updatedAt: '2025-01-05T10:30:00.000Z'
              },
              {
                id: 2,
                operateurId: 2,
                operateurName: 'Orange Cameroun',
                annee: 2024,
                trafic: {
                  partMarcheTrafic: '30.50',
                  ihhTrafic: '2850.75',
                  isConcentreTrafic: true
                },
                abonnement: {
                  partMarcheAbonnes: '35.20',
                  ihhAbonne: '2650.25',
                  isConcentreAbonne: true
                },
                chiffreAffaire: {
                  partMarcheChiffreAffaire: '28.75',
                  ihhChiffreAffaire: '3100.50',
                  isConcentreChiffreAffaire: true
                },
                sommeTrafic: '125000.50',
                sommeAbonnement: '15000000.00',
                sommeChiffreAffaire: '85000000.00',
                createdAt: '2025-01-05T11:00:00.000Z',
                updatedAt: '2025-01-05T11:00:00.000Z'
              }
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 2,
              itemsPerPage: 10,
              note: "Pour récupérer tous les résultats sans pagination, utilisez limit=0"
            },
            statistiquesGlobales: {
              ihhTrafic: 2850.75,
              concentrationTrafic: 'Élevée (> 2000)',
              ihhAbonne: 2650.25,
              concentrationAbonne: 'Élevée (> 2000)',
              ihhChiffreAffaire: 3100.50,
              concentrationChiffreAffaire: 'Élevée (> 2000)',
              leadMarketShareTrafic: '45.25%',
              leadMarketShareAbonne: '48.90%',
              leadMarketShareChiffreAffaire: '52.75%',
              operateurDominant: 'MTN Cameroon'
            }
          }
        }
      }
    }
  })
  async findAll(@Query() query: PartMarcheQueryDto): Promise<ResponseApi<any>> {
    const result = await this.ihhService.findAll(query);
    return new ResponseApi(
      true,
      200,
      'PARTS_MARCHE_RETRIEVED',
      'Succès',
      'Parts de marché récupérées avec succès',
      result
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer les détails d\'une part de marché avec calculs IHH par ID',
    description: `Récupère les détails complets d'une part de marché spécifique avec les données IHH et de concentration.

**🔢 RAPPEL DES FORMULES :**
- **Part de marché** = (Volume opérateur / Volume total) × 100
- **IHH** = Σ(Part de marché)² de tous les opérateurs (même valeur pour tous les opérateurs d'une année)
- **Concentration** = true si IHH > 2000, false sinon

**Exemple de calcul :** Si 3 opérateurs ont respectivement 45%, 35% et 20% :
IHH = (45)² + (35)² + (20)² = 2025 + 1225 + 400 = 3650 (Marché hautement concentré)`
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identifiant de la part de marché',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la part de marché récupérés avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'PART_MARCHE_FOUND',
          title: 'Part de marché trouvée',
          message: 'Les détails de la part de marché ont été récupérés avec succès',
          data: {
            id: 1,
            operateurId: 1,
            operateurName: 'MTN Cameroon',
            annee: 2024,
            trafic: {
              partMarcheTrafic: '45.25',
              ihhTrafic: '2850.75',
              isConcentreTrafic: true
            },
            abonnement: {
              partMarcheAbonnes: '48.90',
              ihhAbonne: '2650.25',
              isConcentreAbonne: true
            },
            chiffreAffaire: {
              partMarcheChiffreAffaire: '52.75',
              ihhChiffreAffaire: '3100.50',
              isConcentreChiffreAffaire: true
            },
            sommeTrafic: '125000.50',
            sommeAbonnement: '15000000.00',
            sommeChiffreAffaire: '85000000.00',
            createdAt: '2025-01-05T10:30:00.000Z',
            updatedAt: '2025-01-05T10:30:00.000Z'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Part de marché non trouvée',
    content: {
      'application/json': {
        example: {
          success: false,
          statusCode: 404,
          code: 'PART_MARCHE_NOT_FOUND',
          title: 'Part de marché non trouvée',
          message: 'Aucune part de marché trouvée avec cet identifiant',
          data: null
        }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<PartMarcheResponseDto>> {
    const data = await this.ihhService.findOne(id);
    return new ResponseApi(
      true,
      200,
      'PART_MARCHE_FOUND',
      'Part de marché trouvée',
      'Les détails de la part de marché ont été récupérés avec succès',
      data
    );
  }



  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Supprimer une part de marché',
    description: 'Supprime définitivement une part de marché'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identifiant de la part de marché',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Part de marché supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'IHH_DELETED' },
        title: { type: 'string', example: 'Part de marché supprimée' },
        message: { type: 'string', example: 'La part de marché a été supprimée avec succès' },
        data: {
          type: 'object',
          properties: {
            deletedPartMarche: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                operateurId: { type: 'number' },
                operateur: { type: 'string' },
                annee: { type: 'number' },
                partMarcheTrafic: { type: 'string' },
                partMarcheChiffreAffaire: { type: 'string' },
                partMarcheAbonnes: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Part de marché non trouvée'
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<{ deletedPartMarche: any }>> {
    const result = await this.ihhService.remove(id);
    
    return new ResponseApi(
      true,
      200,
      'IHH_DELETED',
      'Part de marché supprimée',
      'La part de marché a été supprimée avec succès',
      result
    );
  }

  @Post('calculer-parts-marche')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Calculer et sauvegarder les parts de marché et IHH',
    description: `Calcule les parts de marché et indices IHH pour tous les opérateurs de toutes les années, puis **sauvegarde automatiquement** les résultats en base de données.

**🔄 PROCESSUS COMPLET :**
1. **Détection automatique** de toutes les années avec données (trafic, abonnés, CA)
2. **Calcul des parts de marché** pour chaque opérateur et chaque année
3. **Calcul des indices IHH** pour chaque métrique et chaque année  
4. **Sauvegarde automatique** dans la table PartMarche (upsert si existe déjà)
5. **Retour des résultats** détaillés avec statistiques

**📊 DONNÉES SAUVEGARDÉES :**
- Parts de marché (trafic, abonnés, chiffre d'affaires)
- Indices IHH pour chaque métrique  
- Indicateurs de concentration (booléens)
- Volumes et données brutes utilisées
- Sommes totales par année

**💡 Après exécution,** les APIs GET retourneront automatiquement les données calculées avec les valeurs IHH.`
  })
  @ApiResponse({
    status: 200,
    description: 'Parts de marché et IHH calculés avec succès pour toutes les années',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'PARTS_MARCHE_CALCULEES',
          title: 'Calcul des parts de marché terminé',
          message: 'Les parts de marché, IHH et indicateurs de concentration ont été calculés pour tous les opérateurs de toutes les années',
          data: {
            nombreAnneesTraitees: 3,
            anneesTraitees: [2023, 2024, 2025],
            resultatsParAnnee: {
              "2023": {
                annee: 2023,
                sommesTotales: {
                  sommeTrafic: 1100000.50,
                  sommeAbonnement: 22000000,
                  sommeChiffreAffaire: 420000000000.00
                },
                ihhGlobal: {
                  ihhTrafic: 2650.25,
                  ihhAbonne: 2025.80,
                  ihhChiffreAffaire: 2920.15
                },
                concentrationGlobale: {
                  isConcentreTrafic: true,
                  isConcentreAbonne: true,
                  isConcentreChiffreAffaire: true
                },
                operateurs: [
                  {
                    operateurId: 1,
                    operateur: {
                      nom: 'Orange Cameroun',
                      code: 'ORC',
                      type: 'Mobile'
                    },
                    donnees: {
                      volumeTrafic: 420000.25,
                      nombreAbonne: 8500000,
                      chiffreAffaire: 155000000000.00
                    },
                    partsMarche: {
                      partMarcheTrafic: 38.18,
                      partMarcheAbonnes: 38.64,
                      partMarcheChiffreAffaire: 36.90
                    },
                    concentration: {
                      contributionIhhTrafic: 1457.72,
                      contributionIhhAbonne: 1493.05,
                      contributionIhhChiffreAffaire: 1361.61
                    }
                  }
                ],
                statistiques: {
                  nombreOperateurs: 3,
                  operateursConcentresTrafic: 3,
                  operateursConcentresAbonnes: 3,
                  operateursConcentresChiffreAffaire: 3,
                  interpretationIHH: {
                    trafic: 'Marché hautement concentré',
                    abonnes: 'Marché hautement concentré', 
                    chiffreAffaire: 'Marché hautement concentré'
                  }
                }
              },
              "2024": {
                annee: 2024,
                sommesTotales: {
                  sommeTrafic: 1200000.75,
                  sommeAbonnement: 24000000,
                  sommeChiffreAffaire: 435000000000.00
                },
                ihhGlobal: {
                  ihhTrafic: 2700.50,
                  ihhAbonne: 2075.40,
                  ihhChiffreAffaire: 2980.25
                },
                concentrationGlobale: {
                  isConcentreTrafic: true,
                  isConcentreAbonne: true,
                  isConcentreChiffreAffaire: true
                },
                operateurs: [
                  {
                    operateurId: 1,
                    operateur: {
                      nom: 'Orange Cameroun',
                      code: 'ORC',
                      type: 'Mobile'
                    },
                    donnees: {
                      volumeTrafic: 435000.30,
                      nombreAbonne: 9000000,
                      chiffreAffaire: 160000000000.00
                    },
                    partsMarche: {
                      partMarcheTrafic: 36.25,
                      partMarcheAbonnes: 37.50,
                      partMarcheChiffreAffaire: 36.78
                    },
                    concentration: {
                      contributionIhhTrafic: 1314.06,
                      contributionIhhAbonne: 1406.25,
                      contributionIhhChiffreAffaire: 1352.77
                    }
                  }
                ],
                statistiques: {
                  nombreOperateurs: 3,
                  operateursConcentresTrafic: 3,
                  operateursConcentresAbonnes: 3,
                  operateursConcentresChiffreAffaire: 3,
                  interpretationIHH: {
                    trafic: 'Marché hautement concentré',
                    abonnes: 'Marché hautement concentré',
                    chiffreAffaire: 'Marché hautement concentré'
                  }
                }
              }
            },
            resumeGlobal: {
              evolutionConcentration: {
                trafic: 'Stable - Hautement concentré sur toutes les années',
                abonnes: 'Stable - Hautement concentré sur toutes les années',
                chiffreAffaire: 'Stable - Hautement concentré sur toutes les années'
              },
              moyenneIHH: {
                trafic: 2675.38,
                abonnes: 2050.60,
                chiffreAffaire: 2950.20
              }
            }
          }
        }
      }
    }
  })
  async calculerPartsMarche(): Promise<ResponseApi<any>> {
    const data = await this.ihhService.calculerPartsMarCheToutesAnnees();
    return new ResponseApi(
      true,
      200,
      'PARTS_MARCHE_CALCULEES',
      'Calcul des parts de marché terminé',
      'Les parts de marché, IHH et indicateurs de concentration ont été calculés pour tous les opérateurs de toutes les années',
      data
    );
  }
}
