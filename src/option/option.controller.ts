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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OptionService } from './option.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { QueryOptionDto } from './dto/query-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Options')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle option',
    description: 'Crée une nouvelle option pour une offre avec possibilité d\'associer des structures tarifaires (2 par défaut), des avantages et des consommations moyennes. Les valeurs de chaque association sont mises à jour lors de la création.'
  })
  @ApiBody({
    type: CreateOptionDto,
    description: 'Données pour créer une nouvelle option',
    examples: {
      withAllAssociations: {
        summary: 'Option complète avec toutes les associations et leurs valeurs',
        value: {
          offreId: 1,
          nom: 'Option Premium Mobile',
          tva: 18.00,
          nombreSouscriptions: 1500,
          traficOption: 25.00,
          fraisSouscription: 25.00,
          tarifMinuteOnNet: 15.50,
          tarifMinuteOffNet: 22.75,
          annee: 2026,
          trafic: 1500.75,
          structuresTarifaires: [
            { id: 1, valeur: 50.25 },
            { id: 2, valeur: 75.50 }
          ],
          avantages: [
            { id: 1, valeur: 500 },
            { id: 3, valeur: 1000 },
            { id: 5, valeur: 50 }
          ],
          consommationsMoyennes: [
            { id: 2, valeur: 125.75 },
            { id: 4, valeur: 250.50 }
          ]
        }
      },
      withDefaults: {
        summary: 'Option avec structures tarifaires par défaut (valeurs actuelles conservées)',
        value: {
          offreId: 1,
          nom: 'Option Standard Mobile',
          tva: 18.00,
          nombreSouscriptions: 1000,
          traficOption: 15.00,
          fraisSouscription: 15.00,
          tarifMinuteOnNet: 12.00,
          tarifMinuteOffNet: 18.50,
          annee: 2026,
          trafic: 850.25,
          avantages: [
            { id: 1, valeur: 300 },
            { id: 2, valeur: 400 }
          ]
        }
      },
      partialAssociations: {
        summary: 'Option avec structures personnalisées et quelques associations',
        value: {
          offreId: 2,
          nom: 'Option Data Plus',
          tva: 18.00,
          nombreSouscriptions: 800,
          traficOption: 20.00,
          fraisSouscription: 20.00,
          tarifMinuteOnNet: 14.25,
          tarifMinuteOffNet: 20.00,
          annee: 2026,
          trafic: 1200.50,
          structuresTarifaires: [
            { id: 3, valeur: 80.00 }
          ],
          consommationsMoyennes: [
            { id: 1, valeur: 200.00 }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Option créée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Option créée' },
        message: { type: 'string', example: 'Option "Option Premium Mobile" créée avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            offreId: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'Option Premium Mobile' },
            tva: { type: 'number', example: 18.00 },
            nombreSouscriptions: { type: 'number', example: 1500 },
            traficOption: { type: 'number', example: 25.00 },
            fraisSouscription: { type: 'number', example: 25.00 },
            tarifMinuteOnNet: { type: 'number', example: 15.50 },
            tarifMinuteOffNet: { type: 'number', example: 22.75 },
            annee: { type: 'number', example: 2026 },
            trafic: { type: 'number', example: 1500.75 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            offre: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                nom: { type: 'string', example: 'Offre Premium' }
              }
            },
            structuresTarifaires: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'Tarif Standard' },
                  valeur: { type: 'number', example: 50.25 }
                }
              }
            },
            avantages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'SMS illimités' },
                  valeur: { type: 'number', example: 500 }
                }
              }
            },
            consommationsMoyennes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  nom: { type: 'string', example: 'Consommation Mobile Standard' },
                  valeur: { type: 'number', example: 125.75 }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Une option avec ce nom existe déjà pour cette offre',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Une option avec le nom "Option Premium Mobile" existe déjà pour cette offre' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Offre inexistante, structures tarifaires, avantages ou consommations moyennes invalides',
    schema: {
      type: 'object',
      properties: {
        message: { 
          oneOf: [
            { type: 'string', example: 'L\'offre avec l\'ID 99 n\'existe pas' },
            { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Le nom est obligatoire', 'Le champ TP doit être un nombre']
            }
          ]
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  create(@Body() createOptionDto: CreateOptionDto) {
    return this.optionService.create(createOptionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les options avec filtres et pagination',
    description: 'Récupère toutes les options avec possibilité de filtrage par nom, offre, année, valeurs de trafic et nombre de souscriptions. Retourne également toutes les associations.'
  })
  @ApiQuery({
    name: 'nom',
    description: 'Filtre par nom d\'option (recherche partielle)',
    required: false,
    type: 'string',
    example: 'Premium'
  })
  @ApiQuery({
    name: 'offreId',
    description: 'Filtre par ID d\'offre',
    required: false,
    type: 'number',
    example: 1
  })
  @ApiQuery({
    name: 'annee',
    description: 'Filtre par année',
    required: false,
    type: 'number',
    example: 2026
  })
  @ApiQuery({
    name: 'traficMin',
    description: 'Valeur de trafic minimale pour le filtrage',
    required: false,
    type: 'number',
    example: 500
  })
  @ApiQuery({
    name: 'traficMax',
    description: 'Valeur de trafic maximale pour le filtrage',
    required: false,
    type: 'number',
    example: 2000
  })
  @ApiQuery({
    name: 'nombreSouscriptionsMin',
    description: 'Nombre minimum de souscriptions',
    required: false,
    type: 'number',
    example: 1000
  })
  @ApiQuery({
    name: 'nombreSouscriptionsMax',
    description: 'Nombre maximum de souscriptions',
    required: false,
    type: 'number',
    example: 5000
  })
  @ApiQuery({
    name: 'page',
    description: 'Numéro de page (pagination)',
    required: false,
    type: 'number',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre d\'éléments par page',
    required: false,
    type: 'number',
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des options récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Options récupérées' },
        message: { type: 'string', example: 'Liste des options récupérée avec succès.' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              offreId: { type: 'number', example: 1 },
              nom: { type: 'string', example: 'Option Premium Mobile' },
              tp: { type: 'number', example: 150.75 },
              tnc: { type: 'number', example: 125.50 },
              ep: { type: 'number', example: 85.25 },
              tva: { type: 'number', example: 18.00 },
              nombreSouscriptions: { type: 'number', example: 1500 },
              traficOption: { type: 'number', example: 25.00 },
              fraisSouscription: { type: 'number', example: 25.00 },
              tarifMinuteOnNet: { type: 'number', example: 15.50 },
              tarifMinuteOffNet: { type: 'number', example: 22.75 },
              annee: { type: 'number', example: 2026 },
              createdAt: { type: 'string', format: 'date-time', example: '2026-01-02T14:30:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2026-01-02T14:30:00.000Z' },
              offre: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'Offre Premium' }
                }
              },
              structuresTarifaires: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    nom: { type: 'string', example: 'Tarif Standard' },
                    valeur: { type: 'number', example: 50.25 }
                  }
                },
                example: [
                  {
                    id: 1,
                    nom: 'Tarif Standard',
                    valeur: 50.25
                  },
                  {
                    id: 2,
                    nom: 'Tarif Premium',
                    valeur: 75.50
                  }
                ]
              },
              avantages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    nom: { type: 'string', example: 'SMS illimités' },
                    valeur: { type: 'number', example: 500 }
                  }
                },
                example: [
                  {
                    id: 1,
                    nom: 'SMS illimités',
                    valeur: 500
                  },
                  {
                    id: 3,
                    nom: 'Appels illimités',
                    valeur: 1000
                  },
                  {
                    id: 5,
                    nom: 'Data 50GB',
                    valeur: 50
                  }
                ]
              },
              consommationsMoyennes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 2 },
                    nom: { type: 'string', example: 'Consommation Mobile Standard' },
                    valeur: { type: 'number', example: 125.75 }
                  }
                },
                example: [
                  {
                    id: 2,
                    nom: 'Consommation Mobile Standard',
                    valeur: 125.75
                  },
                  {
                    id: 4,
                    nom: 'Consommation Data Premium',
                    valeur: 250.50
                  }
                ]
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 }
          }
        }
      }
    },
    examples: {
      completeResponse: {
        summary: 'Réponse complète avec toutes les associations',
        value: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Options récupérées',
          message: 'Liste des options récupérée avec succès.',
          data: [
            {
              id: 1,
              offreId: 1,
              nom: 'Option Premium Mobile',
              tp: 150.75,
              tnc: 125.50,
              ep: 85.25,
              tva: 18.00,
              nombreSouscriptions: 1500,
              traficOption: 25.00,
              fraisSouscription: 25.00,
              tarifMinuteOnNet: 15.50,
              tarifMinuteOffNet: 22.75,
              annee: 2026,
              createdAt: '2026-01-02T14:30:00.000Z',
              updatedAt: '2026-01-02T14:30:00.000Z',
              offre: {
                id: 1,
                nom: 'Offre Premium'
              },
              structuresTarifaires: [
                {
                  id: 1,
                  nom: 'Tarif Standard',
                  valeur: 50.25
                },
                {
                  id: 2,
                  nom: 'Tarif Premium',
                  valeur: 75.50
                }
              ],
              avantages: [
                {
                  id: 1,
                  nom: 'SMS illimités',
                  valeur: 500
                },
                {
                  id: 3,
                  nom: 'Appels illimités',
                  valeur: 1000
                },
                {
                  id: 5,
                  nom: 'Data 50GB',
                  valeur: 50
                }
              ],
              consommationsMoyennes: [
                {
                  id: 2,
                  nom: 'Consommation Mobile Standard',
                  valeur: 125.75
                },
                {
                  id: 4,
                  nom: 'Consommation Data Premium',
                  valeur: 250.50
                }
              ]
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3
          }
        }
      }
    }
  })
  findAll(@Query() query: QueryOptionDto) {
    return this.optionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une option par son ID',
    description: 'Récupère une option spécifique par son identifiant unique, incluant l\'offre associée et toutes les relations (structures tarifaires, avantages, consommations moyennes).'
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de l\'option à récupérer',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Option récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Option récupérée' },
        message: { type: 'string', example: 'Option "Option Premium Mobile" récupérée avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            offreId: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'Option Premium Mobile' },
            tp: { type: 'number', example: 150.75 },
            tnc: { type: 'number', example: 125.50 },
            ep: { type: 'number', example: 85.25 },
            tva: { type: 'number', example: 18.00 },
            nombreSouscriptions: { type: 'number', example: 1500 },
            traficOption: { type: 'number', example: 25.00 },
            fraisSouscription: { type: 'number', example: 25.00 },
            tarifMinuteOnNet: { type: 'number', example: 15.50 },
            tarifMinuteOffNet: { type: 'number', example: 22.75 },
            annee: { type: 'number', example: 2026 },
            createdAt: { type: 'string', format: 'date-time', example: '2026-01-02T14:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-01-02T14:30:00.000Z' },
            offre: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                nom: { type: 'string', example: 'Offre Premium' }
              }
            },
            structuresTarifaires: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'Tarif Standard' },
                  valeur: { type: 'number', example: 50.25 }
                }
              },
              example: [
                {
                  id: 1,
                  nom: 'Tarif Standard',
                  valeur: 50.25
                },
                {
                  id: 2,
                  nom: 'Tarif Premium',
                  valeur: 75.50
                }
              ]
            },
            avantages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'SMS illimités' },
                  valeur: { type: 'number', example: 500 }
                }
              },
              example: [
                {
                  id: 1,
                  nom: 'SMS illimités',
                  valeur: 500
                },
                {
                  id: 3,
                  nom: 'Appels illimités',
                  valeur: 1000
                },
                {
                  id: 5,
                  nom: 'Data 50GB',
                  valeur: 50
                }
              ]
            },
            consommationsMoyennes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  nom: { type: 'string', example: 'Consommation Mobile Standard' },
                  valeur: { type: 'number', example: 125.75 }
                }
              },
              example: [
                {
                  id: 2,
                  nom: 'Consommation Mobile Standard',
                  valeur: 125.75
                },
                {
                  id: 4,
                  nom: 'Consommation Data Premium',
                  valeur: 250.50
                }
              ]
            }
          }
        }
      }
    },
    examples: {
      completeOption: {
        summary: 'Option complète avec toutes les associations',
        value: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Option récupérée',
          message: 'Option "Option Premium Mobile" récupérée avec succès.',
          data: {
            id: 1,
            offreId: 1,
            nom: 'Option Premium Mobile',
            tp: 150.75,
            tnc: 125.50,
            ep: 85.25,
            tva: 18.00,
            nombreSouscriptions: 1500,
            traficOption: 25.00,
            fraisSouscription: 25.00,
            tarifMinuteOnNet: 15.50,
            tarifMinuteOffNet: 22.75,
            annee: 2026,
            createdAt: '2026-01-02T14:30:00.000Z',
            updatedAt: '2026-01-02T14:30:00.000Z',
            offre: {
              id: 1,
              nom: 'Offre Premium'
            },
            structuresTarifaires: [
              {
                id: 1,
                nom: 'Tarif Standard',
                valeur: 50.25
              },
              {
                id: 2,
                nom: 'Tarif Premium',
                valeur: 75.50
              }
            ],
            avantages: [
              {
                id: 1,
                nom: 'SMS illimités',
                valeur: 500
              },
              {
                id: 3,
                nom: 'Appels illimités',
                valeur: 1000
              },
              {
                id: 5,
                nom: 'Data 50GB',
                valeur: 50
              }
            ],
            consommationsMoyennes: [
              {
                id: 2,
                nom: 'Consommation Mobile Standard',
                valeur: 125.75
              },
              {
                id: 4,
                nom: 'Consommation Data Premium',
                valeur: 250.50
              }
            ]
          }
        }
      },
      optionWithDefaults: {
        summary: 'Option avec structures tarifaires par défaut et peu d\'associations',
        value: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Option récupérée',
          message: 'Option "Option Standard Mobile" récupérée avec succès.',
          data: {
            id: 2,
            offreId: 1,
            nom: 'Option Standard Mobile',
            tp: 100.00,
            tnc: 85.00,
            ep: 60.00,
            tva: 18.00,
            nombreSouscriptions: 1000,
            traficOption: 15.00,
            fraisSouscription: 15.00,
            tarifMinuteOnNet: 12.00,
            tarifMinuteOffNet: 18.50,
            annee: 2026,
            createdAt: '2026-01-02T15:00:00.000Z',
            updatedAt: '2026-01-02T15:00:00.000Z',
            offre: {
              id: 1,
              nom: 'Offre Premium'
            },
            structuresTarifaires: [
              {
                id: 1,
                nom: 'Tarif Standard',
                valeur: 50.25
              },
              {
                id: 2,
                nom: 'Tarif Premium',
                valeur: 75.50
              }
            ],
            avantages: [
              {
                id: 1,
                nom: 'SMS illimités',
                valeur: 500
              }
            ],
            consommationsMoyennes: []
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Option introuvable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Option avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.optionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une option',
    description: 'Met à jour les informations d\'une option existante. Permet de modifier tous les champs ainsi que les associations avec les structures tarifaires, avantages et consommations moyennes. Les valeurs des associations sont également mises à jour.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de l\'option à modifier',
    type: 'number',
    example: 1,
  })
  @ApiBody({
    type: UpdateOptionDto,
    description: 'Nouvelles données de l\'option (tous les champs sont optionnels)',
    examples: {
      updateComplete: {
        summary: 'Modification complète avec toutes les associations et leurs valeurs',
        value: {
          nom: 'Option Premium Mobile+',
          tva: 19.25,
          nombreSouscriptions: 2000,
          traficOption: 30.00,
          fraisSouscription: 30.00,
          tarifMinuteOnNet: 18.00,
          tarifMinuteOffNet: 25.50,
          annee: 2027,
          trafic: 2250.50,
          structuresTarifaires: [
            { id: 1, valeur: 55.30 },
            { id: 3, valeur: 80.75 }
          ],
          avantages: [
            { id: 2, valeur: 750 },
            { id: 4, valeur: 1200 },
            { id: 6, valeur: 100 }
          ],
          consommationsMoyennes: [
            { id: 1, valeur: 180.50 },
            { id: 3, valeur: 300.75 },
            { id: 5, valeur: 450.25 }
          ]
        }
      },
      updatePartial: {
        summary: 'Modification partielle (prix et trafic seulement)',
        value: {
          traficOption: 28.00,
          fraisSouscription: 28.00,
          tarifMinuteOnNet: 16.75,
          tarifMinuteOffNet: 23.25,
          trafic: 1800.75
        }
      },
      updateAssociations: {
        summary: 'Modification des associations avec nouvelles valeurs',
        value: {
          avantages: [
            { id: 1, valeur: 600 },
            { id: 7, valeur: 800 }
          ],
          consommationsMoyennes: [
            { id: 2, valeur: 220.00 }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Option modifiée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Option modifiée' },
        message: { type: 'string', example: 'Option "Option Premium Mobile+" modifiée avec succès.' },
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Option introuvable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Option avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Une option avec ce nom existe déjà pour cette offre',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Une option avec le nom "Option Premium Mobile+" existe déjà pour cette offre' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Offre inexistante ou données invalides',
    schema: {
      type: 'object',
      properties: {
        message: { 
          oneOf: [
            { type: 'string', example: 'L\'offre avec l\'ID 99 n\'existe pas' },
            { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Le nom ne doit pas dépasser 255 caractères', 'Le champ TP doit être un nombre']
            }
          ]
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOptionDto: UpdateOptionDto) {
    return this.optionService.update(id, updateOptionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une option',
    description: 'Supprime définitivement une option et toutes ses associations (structures tarifaires, avantages, consommations moyennes). Cette action est irréversible.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de l\'option à supprimer',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Option supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Option supprimée' },
        message: { type: 'string', example: 'Option "Option Premium Mobile" supprimée avec succès.' },
        data: { type: 'null', example: null }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Option introuvable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Option avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.optionService.remove(id);
  }
}
