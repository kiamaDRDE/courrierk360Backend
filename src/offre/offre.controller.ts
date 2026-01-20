import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OffreService } from './offre.service';
import { CreateOffreDto } from './dto/create-offre.dto';
import { UpdateOffreDto } from './dto/update-offre.dto';
import { OffreQueryDto } from './dto/offre-query.dto';
import { EffetClubQueryDto } from './dto/effet-club-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Offre')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('offre')
export class OffreController {
  constructor(private readonly offreService: OffreService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle offre' })
  @ApiResponse({
    status: 201,
    description: 'Offre créée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Offre créée',
        message: 'L\'offre "Forfait Mobile Premium" a été créée avec succès avec 3 service(s) associé(s).',
        data: {
          id: 1,
          operateurId: 1,
          nom: 'Forfait Mobile Premium',
          dateDebutValidite: '2024-01-01T00:00:00.000Z',
          dateFinValidite: '2024-12-31T23:59:59.000Z',
          typeOffre: 'Prépayé',
          destination: 'National',
          statut: 'Actif',
          description: 'Forfait premium avec services multiples',
          // Champs tarifaires de base
          tp: 150.75,
          tnc: 125.30,
          ep: 85.25,
          // Champs revenus moyens
          revenuMoyenOnNet: 0.0,
          revenuMoyenOffNet: 0.0,
          taOperateur: null,
          sommeAutresOperateurs: null,
          nombreAutresOperateurs: null,
          taMoyen: null,
          effetClub: null,
          resultat: null,
          createdAt: '2025-12-13T10:00:00.000Z',
          updatedAt: '2025-12-13T10:00:00.000Z',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
          },
          services: [
            {
              id: 1,
              nom: 'Appels vocaux',
            },
            {
              id: 2,
              nom: 'Internet mobile',
            },
            {
              id: 3,
              nom: 'SMS',
            }
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Opérateur introuvable ou un ou plusieurs services introuvables',
  })
  @ApiResponse({
    status: 409,
    description: 'Une offre avec ce nom existe déjà pour cet opérateur',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (dates incorrectes)',
  })
  async createOffre(@Body() createOffreDto: CreateOffreDto) {
    return this.offreService.createOffre(createOffreDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une offre' })
  @ApiResponse({
    status: 200,
    description: 'Offre modifiée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Offre modifiée',
        message: 'L\'offre "Forfait Mobile Premium" a été modifiée avec succès avec 2 service(s) associé(s).',
        data: {
          id: 1,
          operateurId: 1,
          nom: 'Forfait Mobile Premium',
          dateDebutValidite: '2024-01-01T00:00:00.000Z',
          dateFinValidite: '2024-12-31T23:59:59.000Z',
          typeOffre: 'Prépayé',
          destination: 'National',
          statut: 'Actif',
          description: 'Forfait premium modifié',
          // Champs revenus moyens
          revenuMoyenOnNet: 0.0,
          revenuMoyenOffNet: 0.0,
          taOperateur: null,
          sommeAutresOperateurs: null,
          nombreAutresOperateurs: null,
          taMoyen: null,
          effetClub: null,
          resultat: null,
          createdAt: '2025-12-13T10:00:00.000Z',
          updatedAt: '2025-12-13T10:30:00.000Z',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
          },
          services: [
            {
              id: 1,
              nom: 'Appels vocaux',
            },
            {
              id: 2,
              nom: 'Internet mobile',
            }
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Offre ou opérateur introuvable, ou un ou plusieurs services introuvables',
  })
  @ApiResponse({
    status: 409,
    description: 'Une offre avec ce nom existe déjà pour cet opérateur',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (dates incorrectes)',
  })
  async updateOffre(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOffreDto: UpdateOffreDto,
  ) {
    return this.offreService.updateOffre(id, updateOffreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une offre' })
  @ApiResponse({
    status: 200,
    description: 'Offre supprimée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Offre supprimée',
        message: 'L\'offre avec l\'ID 5 a été supprimée avec succès.',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Offre introuvable',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        error: 'Not Found',
        message: 'Offre avec l\'ID 999 introuvable',
        timestamp: '2026-01-07T10:30:45.123Z',
        path: '/offre/999'
      }
    }
  })
  async deleteOffre(@Param('id', ParseIntPipe) id: number) {
    return this.offreService.deleteOffre(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les offres avec filtres et pagination' })
  @ApiResponse({
    status: 200,
    description: 'Liste des offres récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Liste des offres',
        message: '2 offre(s) sur 10 récupérée(s) avec succès.',
        data: {
          offres: [
            {
              id: 1,
              operateurId: 1,
              nom: 'Forfait Mobile Premium',
              annee: 2025,
              dateDebutValidite: '2024-01-01T00:00:00.000Z',
              dateFinValidite: '2024-12-31T23:59:59.000Z',
              typeOffre: 'Prépayé',
              destination: 'National',
              statut: 'Actif',
              description: 'Forfait premium avec services multiples',
              // Champs revenus moyens
              revenuMoyenOnNet: 0.0,
              revenuMoyenOffNet: 0.0,
              taOperateur: 25.5,
              sommeAutresOperateurs: 92.25,
              nombreAutresOperateurs: 3,
              taMoyen: 30.75,
              effetClub: 150.5,
              resultat: 'Effet club - Potentiel abus de position dominante',
              isEffetClub: true,
              createdAt: '2025-12-13T10:00:00.000Z',
              updatedAt: '2025-12-13T10:00:00.000Z',
              operateur: {
                id: 1,
                nom: 'MTN',
                code: 'MTN',
              },
              services: [
                {
                  id: 1,
                  nom: 'Appels vocaux',
                },
                {
                  id: 2,
                  nom: 'Internet mobile',
                },
                {
                  id: 3,
                  nom: 'SMS',
                }
              ],
            },
            {
              id: 2,
              operateurId: 2,
              nom: 'Forfait Data',
              dateDebutValidite: '2024-02-01T00:00:00.000Z',
              dateFinValidite: '2024-11-30T23:59:59.000Z',
              typeOffre: 'Postpayé',
              destination: 'International',
              statut: 'Inactif',
              description: 'Forfait data uniquement',
              taOperateur: null,
              sommeAutresOperateurs: null,
              nombreAutresOperateurs: null,
              taMoyen: null,
              effetClub: null,
              resultat: null,
              isEffetClub: false,
              createdAt: '2025-12-13T11:00:00.000Z',
              updatedAt: '2025-12-13T11:00:00.000Z',
              operateur: {
                id: 2,
                nom: 'Orange',
                code: 'ORA',
              },
              services: [
                {
                  id: 2,
                  nom: 'Internet mobile',
                }
              ],
            },
          ],
          pagination: {
            total: 10,
            page: 1,
            limit: 2,
            totalPages: 5,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  async listOffres(@Query() query: OffreQueryDto) {
    return this.offreService.listOffres(query);
  }

  @Get('effets-club/all')
  @ApiOperation({ 
    summary: 'Lister tous les effets de club des offres - SEGMENTÉS EN 8 BLOCS',
    description: `
    ## 🎯 NOUVELLE STRUCTURE : 8 BLOCS D'EFFET CLUB SPÉCIALISÉS

    Récupère tous les effets de club calculés pour les offres avec **segmentation automatique en 8 blocs spécialisés** selon les types de tarifications.

    ### 🔧 Filtres disponibles :
    - **Opérateur** : Filtrer par ID d'opérateur
    - **Offre** : Filtrer par ID d'offre spécifique
    - **Nom** : Recherche partielle dans le nom de l'offre
    - **Type d'offre** : Filtrer par type (Prépayé, Postpayé, etc.)
    - **Statut** : Filtrer par statut (Actif, Inactif, etc.)
    - **Année** : Filtrer par année de début de validité
    - **Dates** : Filtrer par plage de dates personnalisée
    - **Effet club** : Filtrer seulement les offres avec effet club positif
    - **Valeurs** : Filtrer par valeur min/max de l'effet de club

    ###  8 BLOCS DE SEGMENTATION AUTOMATIQUE :

    1. **Base Off Net HC** : Tarifs base hors réseau heures creuses
    2. **Base Off Net HP** : Tarifs base hors réseau heures pleines
    3. **Base On Net HC** : Tarifs base réseau heures creuses
    4. **Base On Net HP** : Tarifs base réseau heures pleines
    5. **Inter Off Net HC** : Tarifs interconnexion hors réseau heures creuses
    6. **Inter Off Net HP** : Tarifs interconnexion hors réseau heures pleines
    7. **Inter On Net HC** : Tarifs interconnexion réseau heures creuses
    8. **Inter On Net HP** : Tarifs interconnexion réseau heures pleines

    ### 🧮 Formule de calcul pour chaque bloc :
    **effetClub[Type][Réseau][Période] = (prixOffNet - prixOnNet) - (ta[Type]Operateur[Réseau][Période] - taMoyen[Type][Réseau][Période])**

    ### 📈 Statistiques par bloc :
    - Total offres analysées par bloc
    - Nombre d'offres avec effet club positif
    - Valeur moyenne, minimum, maximum des effets club
    - Résumé global de performance par segment

    ### 📄 Structure de réponse :
    - **effetsClub** : Données brutes (compatibilité)
    - **blocsEffetClub** : 8 blocs segmentés avec statistiques
    - **statistiquesParBloc** : Métriques détaillées par bloc
    - **resumeBlocs** : Vue d'ensemble des segments
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des effets de club segmentée en 8 blocs récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Effets de club récupérés',
        message: '15 effet(s) de club sur 25 récupéré(s) avec succès en 8 blocs spécialisés.',
        data: {
          // Données brutes pour compatibilité
          effetsClub: [
            {
              id: 1,
              nom: 'Forfait Premium 5G',
              operateur: { id: 1, nom: 'MTN', code: 'MTN' },
              annee: 2025,
              dateDebutValidite: '2025-01-01T00:00:00.000Z',
              dateFinValidite: '2025-12-31T23:59:59.000Z',
              typeOffre: 'Postpayé',
              statut: 'Actif',
              // Prix
              prixOnNet: 5000.0,
              prixOffNet: 7500.0,
              // Tarifs opérateur (8 champs)
              taBaseOperateurOffnetHC: 75.25,
              taBaseOperateurOffnetHP: 85.50,
              taBaseOperateurOnnetHC: 65.25,
              taBaseOperateurOnnetHP: 75.50,
              taInterOperateurOffnetHC: 95.25,
              taInterOperateurOffnetHP: 105.50,
              taInterOperateurOnnetHC: 85.25,
              taInterOperateurOnnetHP: 95.50,
              // Moyennes (8 champs)
              taMoyenBaseOffnetHC: 78.30,
              taMoyenBaseOffnetHP: 88.75,
              taMoyenBaseOnnetHC: 68.30,
              taMoyenBaseOnnetHP: 78.75,
              taMoyenInterOffnetHC: 98.30,
              taMoyenInterOffnetHP: 108.75,
              taMoyenInterOnnetHC: 88.30,
              taMoyenInterOnnetHP: 98.75,
              // Sommes (8 champs)
              sommeBaseAutresOperateursOffnetHC: 234.90,
              sommeBaseAutresOperateursOffnetHP: 266.25,
              sommeBaseAutresOperateursOnnetHC: 204.90,
              sommeBaseAutresOperateursOnnetHP: 236.25,
              sommeInterAutresOperateursOffnetHC: 294.90,
              sommeInterAutresOperateursOffnetHP: 326.25,
              sommeInterAutresOperateursOnnetHC: 264.90,
              sommeInterAutresOperateursOnnetHP: 296.25,
              nombreAutresOperateurs: 3,
              // Effets club (8 champs)
              effetClubBaseOffnetHC: 2497.95,
              effetClubBaseOffnetHP: 2496.25,
              effetClubBaseOnnetHC: 2502.05,
              effetClubBaseOnnetHP: 2496.75,
              effetClubInterOffnetHC: 2503.05,
              effetClubInterOffnetHP: 2496.25,
              effetClubInterOnnetHC: 2502.95,
              effetClubInterOnnetHP: 2497.25,
              // Résultats (8 champs)
              resultatBaseOffnetHC: 'Effet club positif : Avantage concurrentiel de 2497.95',
              resultatBaseOffnetHP: 'Effet club positif : Avantage concurrentiel de 2496.25',
              resultatBaseOnnetHC: 'Effet club positif : Avantage concurrentiel de 2502.05',
              resultatBaseOnnetHP: 'Effet club positif : Avantage concurrentiel de 2496.75',
              resultatInterOffnetHC: 'Effet club positif : Avantage concurrentiel de 2503.05',
              resultatInterOffnetHP: 'Effet club positif : Avantage concurrentiel de 2496.25',
              resultatInterOnnetHC: 'Effet club positif : Avantage concurrentiel de 2502.95',
              resultatInterOnnetHP: 'Effet club positif : Avantage concurrentiel de 2497.25',
              // Booléens (8 champs)
              isEffetClubBaseOffnetHC: true,
              isEffetClubBaseOffnetHP: true,
              isEffetClubBaseOnnetHC: true,
              isEffetClubBaseOnnetHP: true,
              isEffetClubInterOffnetHC: true,
              isEffetClubInterOffnetHP: true,
              isEffetClubInterOnnetHC: true,
              isEffetClubInterOnnetHP: true,
              createdAt: '2025-01-01T10:00:00.000Z',
              updatedAt: '2025-01-05T15:30:00.000Z',
            }
          ],
          
          // 🎯 SEGMENTATION EN 8 BLOCS - TOUTES LES OFFRES AVEC CHAMPS SPÉCIFIQUES
          blocsEffetClub: [
            {
              type: 'Base',
              reseau: 'Offnet',
              periode: 'HC',
              codeBloc: 'baseOffnetHC',
              description: 'Effet club Base Offnet HC',
              formule: 'effetClubBaseOffnetHC = (prixOffNet - prixOnNet) - (taBaseOperateurOffnetHC - taMoyenBaseOffnetHC)',
              
              // TOUTES les offres avec leurs champs spécifiques à Base Offnet HC
              offres: [
                {
                  id: 1,
                  nom: 'Forfait Premium 5G',
                  operateur: { id: 1, nom: 'MTN', code: 'MTN' },
                  annee: 2025,
                  typeOffre: 'Postpayé',
                  statut: 'Actif',
                  nombreAutresOperateurs: 3,
                  prixOnNet: 5000.0,
                  prixOffNet: 7500.0,
                  
                  // 🎯 CHAMPS SPÉCIFIQUES À BASE OFFNET HC
                  taOperateur: 75.25,  // taBaseOperateurOffnetHC
                  taMoyen: 78.30,      // taMoyenBaseOffnetHC
                  sommeAutresOperateurs: 234.90, // sommeBaseAutresOperateursOffnetHC
                  effetClub: 2497.95,  // effetClubBaseOffnetHC
                  resultat: 'Effet club positif : Avantage concurrentiel de 2497.95', // resultatBaseOffnetHC
                  isEffetClub: true,   // isEffetClubBaseOffnetHC
                  differentielTarifaire: 3.05,
                  
                  createdAt: '2025-01-01T10:00:00.000Z',
                  updatedAt: '2025-01-05T15:30:00.000Z',
                },
                {
                  id: 2,
                  nom: 'Forfait Standard',
                  operateur: { id: 2, nom: 'Orange', code: 'OCI' },
                  annee: 2025,
                  typeOffre: 'Prépayé',
                  statut: 'Actif',
                  nombreAutresOperateurs: 3,
                  prixOnNet: 3000.0,
                  prixOffNet: 4500.0,
                  
                  // 🎯 CHAMPS SPÉCIFIQUES À BASE OFFNET HC (différents pour cette offre)
                  taOperateur: 82.50,  // taBaseOperateurOffnetHC
                  taMoyen: 78.30,      // taMoyenBaseOffnetHC
                  sommeAutresOperateurs: 234.90, // sommeBaseAutresOperateursOffnetHC
                  effetClub: -4.20,    // effetClubBaseOffnetHC (négatif)
                  resultat: 'Effet club négatif : Désavantage concurrentiel de -4.20', // resultatBaseOffnetHC
                  isEffetClub: false,  // isEffetClubBaseOffnetHC
                  differentielTarifaire: -4.20,
                  
                  createdAt: '2025-01-01T11:00:00.000Z',
                  updatedAt: '2025-01-05T14:20:00.000Z',
                }
                // ... toutes les autres offres avec leurs champs Base Offnet HC
              ],
              
              statistiques: {
                totalOffres: 25,
                avecDonnees: 20,
                sansDonnees: 5,
                avecEffetClubPositif: 12,
                avecEffetClubNegatifOuNul: 8,
                pourcentageEffetPositif: 60.0,
                valeurMoyenne: 2452.08,
                valeurMin: 125.30,
                valeurMax: 2497.95,
              },
              interpretation: '12 offre(s) sur 20 présente(nt) un effet club positif pour Base Offnet HC'
            },
            {
              type: 'Base',
              reseau: 'Offnet',
              periode: 'HP',
              codeBloc: 'baseOffnetHP',
              description: 'Effet club Base Offnet HP',
              formule: 'effetClubBaseOffnetHP = (prixOffNet - prixOnNet) - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP)',
              
              // Aucune offre avec effet club positif pour ce bloc
              offres: [],
              
              statistiques: {
                totalAnalyse: 20,
                avecEffetClubPositif: 0,
                avecEffetClubNegatifOuNul: 15,
                sansCalcul: 5,
                pourcentageEffetPositif: 0.0,
                valeurMoyenne: 0,
                valeurMin: 0,
                valeurMax: 0,
              },
              interpretation: 'Aucune offre ne présente d\'effet club positif pour Base Offnet HP'
            },
            {
              type: 'Base',
              reseau: 'Offnet',
              periode: 'HP',
              codeBloc: 'baseOffnetHP',
              description: 'Effet club Base Offnet HP',
              formule: 'effetClubBaseOffnetHP = (prixOffNet - prixOnNet) - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP)',
              
              // TOUTES les offres avec leurs champs spécifiques à Base Offnet HP
              offres: [
                {
                  id: 1,
                  nom: 'Forfait Premium 5G',
                  operateur: { id: 1, nom: 'MTN', code: 'MTN' },
                  annee: 2025,
                  typeOffre: 'Postpayé',
                  statut: 'Actif',
                  nombreAutresOperateurs: 3,
                  prixOnNet: 5000.0,
                  prixOffNet: 7500.0,
                  
                  // 🎯 CHAMPS SPÉCIFIQUES À BASE OFFNET HP (différents de HC)
                  taOperateur: 85.50,  // taBaseOperateurOffnetHP
                  taMoyen: 88.75,      // taMoyenBaseOffnetHP
                  sommeAutresOperateurs: 266.25, // sommeBaseAutresOperateursOffnetHP
                  effetClub: 2496.25,  // effetClubBaseOffnetHP
                  resultat: 'Effet club positif : Avantage concurrentiel de 2496.25', // resultatBaseOffnetHP
                  isEffetClub: true,   // isEffetClubBaseOffnetHP
                  differentielTarifaire: 3.25,
                  
                  createdAt: '2025-01-01T10:00:00.000Z',
                  updatedAt: '2025-01-05T15:30:00.000Z',
                }
                // ... toutes les autres offres avec leurs champs Base Offnet HP
              ],
              
              statistiques: {
                totalOffres: 25,
                avecDonnees: 18,
                sansDonnees: 7,
                avecEffetClubPositif: 8,
                avecEffetClubNegatifOuNul: 10,
                pourcentageEffetPositif: 44.44,
                valeurMoyenne: 1820.60,
                valeurMin: 95.40,
                valeurMax: 2496.25,
              },
              interpretation: '8 offre(s) sur 18 présente(nt) un effet club positif pour Base Offnet HP'
            },
            {
              type: 'Inter',
              reseau: 'Onnet',
              periode: 'HC',
              codeBloc: 'interOnnetHC',
              description: 'Effet club Inter Onnet HC',
              formule: 'effetClubInterOnnetHC = (prixOffNet - prixOnNet) - (taInterOperateurOnnetHC - taMoyenInterOnnetHC)',
              
              // TOUTES les offres avec leurs champs spécifiques à Inter Onnet HC
              offres: [
                {
                  id: 1,
                  nom: 'Forfait Premium 5G',
                  operateur: { id: 1, nom: 'MTN', code: 'MTN' },
                  annee: 2025,
                  typeOffre: 'Postpayé',
                  statut: 'Actif',
                  nombreAutresOperateurs: 3,
                  prixOnNet: 5000.0,
                  prixOffNet: 7500.0,
                  
                  // 🎯 CHAMPS SPÉCIFIQUES À INTER ONNET HC
                  taOperateur: 85.25,  // taInterOperateurOnnetHC
                  taMoyen: 88.30,      // taMoyenInterOnnetHC
                  sommeAutresOperateurs: 264.90, // sommeInterAutresOperateursOnnetHC
                  effetClub: 2502.95,  // effetClubInterOnnetHC
                  resultat: 'Effet club positif : Avantage concurrentiel de 2502.95', // resultatInterOnnetHC
                  isEffetClub: true,   // isEffetClubInterOnnetHC
                  differentielTarifaire: 3.05,
                  
                  createdAt: '2025-01-01T10:00:00.000Z',
                  updatedAt: '2025-01-05T15:30:00.000Z',
                },
                {
                  id: 15,
                  nom: 'Forfait Interconnexion Pro',
                  operateur: { id: 3, nom: 'Moov', code: 'MOV' },
                  annee: 2025,
                  typeOffre: 'Postpayé',
                  statut: 'Inactif',
                  nombreAutresOperateurs: 3,
                  prixOnNet: 4200.0,
                  prixOffNet: 6800.0,
                  
                  // 🎯 CHAMPS SPÉCIFIQUES À INTER ONNET HC (différents pour cette offre)
                  taOperateur: 90.15,  // taInterOperateurOnnetHC
                  taMoyen: 88.30,      // taMoyenInterOnnetHC
                  sommeAutresOperateurs: 264.90, // sommeInterAutresOperateursOnnetHC
                  effetClub: -1.85,    // effetClubInterOnnetHC (négatif)
                  resultat: 'Effet club négatif : Désavantage concurrentiel de -1.85', // resultatInterOnnetHC
                  isEffetClub: false,  // isEffetClubInterOnnetHC
                  differentielTarifaire: -1.85,
                  
                  createdAt: '2025-01-01T14:00:00.000Z',
                  updatedAt: '2025-01-05T17:15:00.000Z',
                }
                // ... toutes les autres offres avec leurs champs Inter Onnet HC
              ],
              
              statistiques: {
                totalOffres: 25,
                avecDonnees: 22,
                sansDonnees: 3,
                avecEffetClubPositif: 11,
                avecEffetClubNegatifOuNul: 11,
                pourcentageEffetPositif: 50.0,
                valeurMoyenne: 2150.45,
                valeurMin: 180.60,
                valeurMax: 2502.95,
              },
              interpretation: '11 offre(s) sur 22 présente(nt) un effet club positif pour Inter Onnet HC'
            },
            // ... 5 autres blocs similaires (Base Onnet HC, Base Onnet HP, Inter Offnet HC, Inter Offnet HP, Inter Onnet HP)
          ],
          
          pagination: {
            total: 25,
            page: 1,
            limit: 10,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
          },
          
          // Statistiques globales
          statistiques: {
            totalAvecEffetClub: 12,
            totalSansEffetClub: 13,
            totalCalcule: 20,
            totalNonCalcule: 5,
          },
          
          // 📊 STATISTIQUES DÉTAILLÉES PAR BLOC
          statistiquesParBloc: {
            baseOffnetHC: {
              total: 25,
              avecEffetClub: 12,
              sansEffetClub: 13,
              valeurMoyenne: 1850.45,
              valeurMin: 125.50,
              valeurMax: 3200.75,
            },
            baseOffnetHP: {
              total: 25,
              avecEffetClub: 8,
              sansEffetClub: 17,
              valeurMoyenne: 1420.30,
              valeurMin: 85.25,
              valeurMax: 2850.60,
            },
            baseOnnetHC: {
              total: 25,
              avecEffetClub: 15,
              sansEffetClub: 10,
              valeurMoyenne: 2100.85,
              valeurMin: 200.15,
              valeurMax: 3500.90,
            },
            baseOnnetHP: {
              total: 25,
              avecEffetClub: 10,
              sansEffetClub: 15,
              valeurMoyenne: 1650.40,
              valeurMin: 95.30,
              valeurMax: 2980.25,
            },
            interOffnetHC: {
              total: 25,
              avecEffetClub: 9,
              sansEffetClub: 16,
              valeurMoyenne: 1320.75,
              valeurMin: 150.80,
              valeurMax: 2750.45,
            },
            interOffnetHP: {
              total: 25,
              avecEffetClub: 7,
              sansEffetClub: 18,
              valeurMoyenne: 1180.60,
              valeurMin: 75.90,
              valeurMax: 2450.30,
            },
            interOnnetHC: {
              total: 25,
              avecEffetClub: 11,
              sansEffetClub: 14,
              valeurMoyenne: 1890.25,
              valeurMin: 180.45,
              valeurMax: 3150.70,
            },
            interOnnetHP: {
              total: 25,
              avecEffetClub: 6,
              sansEffetClub: 19,
              valeurMoyenne: 980.35,
              valeurMin: 65.15,
              valeurMax: 2200.85,
            }
          },
          
          // 📈 RÉSUMÉ DES BLOCS
          resumeBlocs: {
            totalBlocs: 8,
            blocsAvecDonnees: 8,
            blocsSansDonnees: 0,
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres de requête invalides',
  })
  async getAllEffetsClub(@Query() query: EffetClubQueryDto) {
    return this.offreService.getAllEffetsClub(query);
  }

  @Get('effets-club/all-revenus_moyens')
  @ApiOperation({ 
    summary: 'Lister tous les effets club selon revenus moyens (8 segments)',
    description: `
      Liste toutes les offres avec leurs effets club organisés par segments selon la méthode des revenus moyens.
      
      **🎯 MÉTHODE REVENUS MOYENS:**
      - Utilise les revenus moyens au lieu des tarifs d'interconnexion standard
      - Calcul basé sur: effetClub = (revenuMoyenOffNet - revenuMoyenOnNet) - (taOperateur - taMoyen)
      - Organisation identique aux 8 segments: Base/Inter × OnNet/OffNet × HC/HP
      
      **� FORMAT DE RETOUR (identique à l'API standard):**
      - **TOUTES les offres** sont incluses dans chaque bloc avec leurs champs spécifiques
      - Offres avec effet positif : isEffetClub = true, effetClub > 0
      - Offres avec effet négatif/nul : isEffetClub = false, effetClub ≤ 0 ou null
      - Offres sans données : effetClub = null (données tarifaires manquantes)
      
      **�📊 SEGMENTATION (8 blocs d'analyse):**
      1. Base OnNet HC (revenus moyens)
      2. Base OnNet HP (revenus moyens)  
      3. Base OffNet HC (revenus moyens)
      4. Base OffNet HP (revenus moyens)
      5. Inter OnNet HC (revenus moyens)
      6. Inter OnNet HP (revenus moyens)
      7. Inter OffNet HC (revenus moyens)
      8. Inter OffNet HP (revenus moyens)
      
      **🔍 FILTRES DISPONIBLES:**
      - Par opérateur, offre, nom, type, statut, année
      - Par plage de dates (dateDebut, dateFin)
      - Par effet club (isEffetClub: true/false)
      - Par valeurs d'effet club (effetClubMin, effetClubMax)
      - Tri personnalisable (sortBy, sortOrder)
      - Pagination (page, limit)
    `
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiQuery({ name: 'operateurId', required: false, type: Number, example: 1, description: 'ID de l\'opérateur' })
  @ApiQuery({ name: 'offreId', required: false, type: Number, example: 5, description: 'ID de l\'offre spécifique' })
  @ApiQuery({ name: 'nom', required: false, type: String, example: 'Premium', description: 'Recherche par nom d\'offre (insensible à la casse)' })
  @ApiQuery({ name: 'typeOffre', required: false, type: String, example: 'Postpayé', description: 'Type d\'offre (Prépayé, Postpayé, Hybride)' })
  @ApiQuery({ name: 'statut', required: false, type: String, example: 'Actif', description: 'Statut de l\'offre' })
  @ApiQuery({ name: 'annee', required: false, type: Number, example: 2025, description: 'Année de l\'offre' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String, example: '2025-01-01', description: 'Date de début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateFin', required: false, type: String, example: '2025-12-31', description: 'Date de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'isEffetClub', required: false, type: Boolean, example: true, description: 'Filtrer les offres avec/sans effet club positif' })
  @ApiQuery({ name: 'effetClubMin', required: false, type: Number, example: 100, description: 'Valeur minimale d\'effet club' })
  @ApiQuery({ name: 'effetClubMax', required: false, type: Number, example: 5000, description: 'Valeur maximale d\'effet club' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'dateDebutValidite', description: 'Champ de tri' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, example: 'desc', description: 'Ordre de tri (asc/desc)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des effets club selon revenus moyens récupérée avec succès',
    content: {
      'application/json': {
        examples: {
          'success_revenus_moyens': {
            summary: '✅ Succès - Effets club revenus moyens avec données',
            description: 'Réponse typique avec plusieurs offres analysées selon la méthode des revenus moyens',
            value: {
              success: true,
              message: 'Liste des effets club (revenus moyens)',
              details: '147 offre(s) trouvée(s) avec analyse par revenus moyens sur 8 segments',
              data: {
                effetsClub: [
                  {
                    type: 'Base',
                    reseau: 'Onnet',
                    periode: 'HC',
                    codeBloc: 'baseOnnetHC',
                    description: 'Effet club Base Onnet HC (revenus moyens)',
                    formule: 'effetClubBaseOnnetHC = (revenuMoyenOffNet - revenuMoyenOnNet) - (taBaseOperateurOnnetHC - taMoyenBaseOnnetHC)',
                    
                    offres: [
                      {
                        id: 1,
                        nom: 'Forfait Premium 5G',
                        operateur: { id: 1, nom: 'MTN', code: 'MTN' },
                        annee: 2025,
                        dateDebutValidite: '2025-01-01T00:00:00.000Z',
                        dateFinValidite: '2025-12-31T23:59:59.000Z',
                        typeOffre: 'Postpayé',
                        statut: 'Actif',
                        
                        // Données globales communes (revenus moyens)
                        nombreAutresOperateurs: 3,
                        revenuMoyenOnNet: 4875.50,
                        revenuMoyenOffNet: 7250.75,
                        sommeFraisSouscription: 1250.00,
                        sommeTraficGratuit: 890.25,
                        sommeTraficOption: 460.30,
                        
                        // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE ONNET HC
                        taOperateur: 75.25, // taBaseOperateurOnnetHC
                        taMoyen: 78.30, // taMoyenBaseOnnetHC
                        sommeAutresOperateurs: 234.90,
                        effetClub: 2372.20, // effetClubRevenuBaseOnnetHC - POSITIF
                        resultat: 'Effet Club Positif (Revenus Moyens)',
                        isEffetClub: true,
                        differentielTarifaire: 3.05, // taMoyen - taOperateur
                        methodeCalcul: 'revenus_moyens',
                        
                        createdAt: '2025-01-01T10:00:00.000Z',
                        updatedAt: '2025-01-05T15:30:00.000Z',
                      },
                      {
                        id: 2,
                        nom: 'Forfait Standard 4G',
                        operateur: { id: 2, nom: 'Orange', code: 'ORN' },
                        annee: 2025,
                        dateDebutValidite: '2025-01-02T00:00:00.000Z',
                        dateFinValidite: '2025-12-31T23:59:59.000Z',
                        typeOffre: 'Prépayé',
                        statut: 'Actif',
                        
                        // Données globales communes (revenus moyens)
                        nombreAutresOperateurs: 3,
                        revenuMoyenOnNet: 3256.40,
                        revenuMoyenOffNet: 4890.60,
                        sommeFraisSouscription: 850.00,
                        sommeTraficGratuit: 520.75,
                        sommeTraficOption: 280.15,
                        
                        // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE ONNET HC
                        taOperateur: 68.40, // taBaseOperateurOnnetHC
                        taMoyen: 65.15, // taMoyenBaseOnnetHC
                        sommeAutresOperateurs: 195.45,
                        effetClub: -188.85, // effetClubRevenuBaseOnnetHC - NÉGATIF
                        resultat: 'Effet Club Négatif (Revenus Moyens)',
                        isEffetClub: false,
                        differentielTarifaire: -3.25, // taMoyen - taOperateur
                        methodeCalcul: 'revenus_moyens',
                        
                        createdAt: '2025-01-02T14:20:00.000Z',
                        updatedAt: '2025-01-05T16:10:00.000Z',
                      },
                      {
                        id: 3,
                        nom: 'Forfait Basic',
                        operateur: { id: 3, nom: 'Moov', code: 'MOV' },
                        annee: 2025,
                        dateDebutValidite: '2025-01-03T00:00:00.000Z',
                        dateFinValidite: '2025-12-31T23:59:59.000Z',
                        typeOffre: 'Prépayé',
                        statut: 'Actif',
                        
                        // Données globales communes (revenus moyens)
                        nombreAutresOperateurs: 3,
                        revenuMoyenOnNet: 2145.80,
                        revenuMoyenOffNet: 3890.25,
                        sommeFraisSouscription: 650.00,
                        sommeTraficGratuit: 420.50,
                        sommeTraficOption: 180.75,
                        
                        // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE ONNET HC
                        taOperateur: null, // Pas de données taBaseOperateurOnnetHC
                        taMoyen: 62.80, // taMoyenBaseOnnetHC
                        sommeAutresOperateurs: 188.40,
                        effetClub: null, // Pas d'effet club calculé (données manquantes)
                        resultat: null,
                        isEffetClub: false,
                        differentielTarifaire: null,
                        methodeCalcul: 'revenus_moyens',
                        
                        createdAt: '2025-01-03T09:15:00.000Z',
                        updatedAt: '2025-01-05T11:45:00.000Z',
                      }
                    ],
                    
                    statistiques: {
                      totalOffres: 147,
                      avecDonnees: 23, // Offres avec données pour ce bloc spécifique
                      sansDonnees: 124,
                      avecEffetClubPositif: 1, // 1 seule offre avec effet positif pour ce bloc
                      avecEffetClubNegatifOuNul: 22, // 22 offres avec effet négatif/nul
                      pourcentageEffetPositif: 4.35, // 1/23 * 100
                      valeurMoyenne: 892.15, // Moyenne incluant valeurs positives ET négatives
                      valeurMin: -845.30, // Valeur la plus négative
                      valeurMax: 2372.20, // Valeur la plus positive
                    },
                    interpretation: '1 offre(s) sur 23 présente(nt) un effet club positif pour Effet club Base Onnet HC (revenus moyens) (méthode revenus moyens)'
                  },
                  {
                    type: 'Base',
                    reseau: 'Offnet',
                    periode: 'HP',
                    codeBloc: 'baseOffnetHP',
                    description: 'Effet club Base Offnet HP (revenus moyens)',
                    formule: 'effetClubBaseOffnetHP = (revenuMoyenOffNet - revenuMoyenOnNet) - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP)',
                    
                    offres: [
                      {
                        id: 4,
                        nom: 'Forfait Professionnel',
                        operateur: { id: 2, nom: 'Orange', code: 'ORN' },
                        annee: 2025,
                        dateDebutValidite: '2025-01-04T00:00:00.000Z',
                        dateFinValidite: '2025-12-31T23:59:59.000Z',
                        typeOffre: 'Postpayé',
                        statut: 'Actif',
                        
                        // Données globales communes (revenus moyens)
                        nombreAutresOperateurs: 3,
                        revenuMoyenOnNet: 5124.30,
                        revenuMoyenOffNet: 7890.45,
                        sommeFraisSouscription: 1500.00,
                        sommeTraficGratuit: 945.80,
                        sommeTraficOption: 520.15,
                        
                        // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE OFFNET HP
                        taOperateur: 82.50, // taBaseOperateurOffnetHP
                        taMoyen: 78.90, // taMoyenBaseOffnetHP
                        sommeAutresOperateurs: 236.70,
                        effetClub: -1406.10, // effetClubRevenuBaseOffnetHP - NÉGATIF
                        resultat: 'Effet Club Négatif (Revenus Moyens)',
                        isEffetClub: false,
                        differentielTarifaire: -3.60, // taMoyen - taOperateur
                        methodeCalcul: 'revenus_moyens',
                        
                        createdAt: '2025-01-04T08:30:00.000Z',
                        updatedAt: '2025-01-05T17:20:00.000Z',
                      },
                      {
                        id: 5,
                        nom: 'Forfait Étudiant',
                        operateur: { id: 3, nom: 'Moov', code: 'MOV' },
                        annee: 2025,
                        dateDebutValidite: '2025-01-05T00:00:00.000Z',
                        dateFinValidite: '2025-12-31T23:59:59.000Z',
                        typeOffre: 'Prépayé',
                        statut: 'Actif',
                        
                        // Données globales communes (revenus moyens)
                        nombreAutresOperateurs: 3,
                        revenuMoyenOnNet: 1890.75,
                        revenuMoyenOffNet: 2945.20,
                        sommeFraisSouscription: 450.00,
                        sommeTraficGratuit: 380.50,
                        sommeTraficOption: 150.25,
                        
                        // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE OFFNET HP
                        taOperateur: 58.20, // taBaseOperateurOffnetHP
                        taMoyen: 62.40, // taMoyenBaseOffnetHP
                        sommeAutresOperateurs: 187.20,
                        effetClub: 850.25, // effetClubRevenuBaseOffnetHP - POSITIF
                        resultat: 'Effet Club Positif (Revenus Moyens)',
                        isEffetClub: true,
                        differentielTarifaire: 4.20, // taMoyen - taOperateur
                        methodeCalcul: 'revenus_moyens',
                        
                        createdAt: '2025-01-05T12:45:00.000Z',
                        updatedAt: '2025-01-05T18:15:00.000Z',
                      }
                    ],
                    
                    statistiques: {
                      totalOffres: 147,
                      avecDonnees: 18,
                      sansDonnees: 129,
                      avecEffetClubPositif: 1, // 1 offre avec effet positif
                      avecEffetClubNegatifOuNul: 17, // 17 offres avec effet négatif/nul
                      pourcentageEffetPositif: 5.56, // 1/18 * 100
                      valeurMoyenne: -278.92, // Moyenne négative car plus d'effets négatifs
                      valeurMin: -1406.10,
                      valeurMax: 850.25,
                    },
                    interpretation: '1 offre(s) sur 18 présente(nt) un effet club positif pour Effet club Base Offnet HP (revenus moyens) (méthode revenus moyens)'
                  }
                  // ... 6 autres segments (Inter OnNet/OffNet HC/HP)
                ],
                
                pagination: {
                  page: 1,
                  limit: 10,
                  total: 147,
                  totalPages: 15,
                  hasNextPage: true,
                  hasPreviousPage: false,
                },
                
                filtres: {
                  operateurId: null,
                  offreId: null,
                  nom: null,
                  typeOffre: null,
                  statut: 'Actif',
                  annee: 2025,
                  dateDebut: null,
                  dateFin: null,
                  isEffetClub: true,
                  effetClubMin: null,
                  effetClubMax: null,
                },
                
                tri: {
                  sortBy: 'dateDebutValidite',
                  sortOrder: 'desc',
                },
                
                metadata: {
                  methodeCalcul: 'revenus_moyens', // 🎯 INDICATEUR GLOBAL
                  description: 'Analyse des effets club basée sur les revenus moyens',
                  nombreBlocsAnalyses: 8,
                  segmentation: 'Base/Inter × OnNet/OffNet × HC/HP',
                  formuleGenerique: 'effetClub = (revenuMoyenOffNet - revenuMoyenOnNet) - (taOperateur - taMoyen)',
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres de requête invalides',
  })
  async getAllEffetsClubRevenusMoyens(@Query() query: EffetClubQueryDto) {
    return this.offreService.getAllEffetsClubRevenusMoyens(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les informations d\'une offre spécifique' })
  @ApiResponse({
    status: 200,
    description: 'Offre récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Offre récupérée',
        message: 'L\'offre "Forfait Mobile Premium" a été récupérée avec succès.',
        data: {
          id: 1,
          operateurId: 1,
          nom: 'Forfait Mobile Premium',
          dateDebutValidite: '2024-01-01T00:00:00.000Z',
          dateFinValidite: '2024-12-31T23:59:59.000Z',
          typeOffre: 'Prépayé',
          destination: 'National',
          statut: 'Actif',
          description: 'Forfait premium avec services multiples',
          // 🔄 NOUVEAUX CHAMPS TARIFAIRES ONNET/OFFNET
          tpOnNet: 150.75,
          tfOnNet: 200.50,
          tncOnNet: 125.30,
          epOnNet: 85.25,
          tpOffNet: 175.80,
          tfOffNet: 225.75,
          tncOffNet: 140.60,
          epOffNet: 95.45,
          // 🔄 NOUVEAUX CHAMPS REVENUS MOYENS
          revenuMoyenOnNet: 0.0,
          revenuMoyenOffNet: 0.0,
          taOperateur: 25.5,
          sommeAutresOperateurs: 92.25,
          nombreAutresOperateurs: 3,
          taMoyen: 30.75,
          effetClub: 150.5,
          resultat: 'Effet club - Potentiel abus de position dominante',
          isEffetClub: true,
          createdAt: '2025-12-13T10:00:00.000Z',
          updatedAt: '2025-12-13T10:00:00.000Z',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
            type: 'Mobile',
            statut: 'Actif',
          },
          services: [
            {
              id: 1,
              nom: 'Appels vocaux',
            },
            {
              id: 2,
              nom: 'Internet mobile',
            },
            {
              id: 3,
              nom: 'SMS',
            }
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Offre introuvable',
  })
  async getOffreById(@Param('id', ParseIntPipe) id: number) {
    return this.offreService.getOffreById(id);
  }

  @Get(':id/effet-club')
  @ApiOperation({ 
    summary: 'Calculer ET sauvegarder l\'effet club d\'une offre',
    description: `
    ## CALCUL DE L'EFFET CLUB - FORMULES DÉTAILLÉES

    ### 1. Calcul du taOperateur
    **Formule :** (tarifOffNetHeureCreuse + tarifOffNetHeurePleine + tarifOnNetHeureCreuse + tarifOnNetHeurePleine) / 4
    
    **Logique :** 
    - Priorité au tarif de type "Interconnexion"
    - Si absent, utiliser le tarif de type "Base"
    - Moyenne des 4 composantes tarifaires

    ### 2. Calcul du taMoyen
    **Formule :** Somme(taOperateur_autres_opérateurs) / Nombre_autres_opérateurs
    
    **Logique :**
    - Calculer le taOperateur de tous les autres opérateurs (même logique)
    - Faire la moyenne de ces valeurs

    ### 3. Calcul des prix réseau
    **prixOnNet :** Moyenne des tarifMinuteOnNet de toutes les options de l'offre
    **prixOffNet :** Moyenne des tarifMinuteOffNet de toutes les options de l'offre

    ### 4. FORMULE PRINCIPALE DE L'EFFET CLUB
    **effetClub = (prixOffNet - prixOnNet) - (taMoyen - taOperateur)**

    #### Interprétation :
    - **Positif :** Effet club favorable (économies pour les clients)
    - **Négatif :** Pas d'effet club (surcoût par rapport au marché)
    - **Nul :** Équilibre parfait avec le marché

    ### Conditions de calcul :
    - Nécessite des tarifs d'interconnexion pour l'année de l'offre
    - Nécessite au moins une option avec tarifs OnNet/OffNet
    - Nécessite d'autres opérateurs avec des tarifs pour la même année
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club calculé et sauvegardé avec succès',
    schema: {
      example: {
        success: true,
        message: 'Effet club calculé et sauvegardé avec succès',
        data: {
          idOffre: 1,
          nomOffre: 'Forfait Mobile Illimité',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
          },
          prixOffNet: 7500.0,
          prixOnNet: 5000.0,
          // Tarifs de l'opérateur (8 valeurs détaillées)
          taBaseOperateurOffnetHC: 22.50,
          taBaseOperateurOffnetHP: 24.75,
          taBaseOperateurOnnetHC: 18.30,
          taBaseOperateurOnnetHP: 20.60,
          taInterOperateurOffnetHC: 25.80,
          taInterOperateurOffnetHP: 28.40,
          taInterOperateurOnnetHC: 21.90,
          taInterOperateurOnnetHP: 24.20,
          // Moyennes du marché (8 valeurs)
          taMoyenBaseOffnetHC: 28.15,
          taMoyenBaseOffnetHP: 30.45,
          taMoyenBaseOnnetHC: 24.80,
          taMoyenBaseOnnetHP: 26.90,
          taMoyenInterOffnetHC: 31.20,
          taMoyenInterOffnetHP: 33.85,
          taMoyenInterOnnetHC: 27.40,
          taMoyenInterOnnetHP: 29.75,
          nombreAutresOperateurs: 3,
          // 8 Effets club calculés
          effetClubBaseOffnetHC: 2494.35,
          effetClubBaseOffnetHP: 2494.30,
          effetClubBaseOnnetHC: 2493.50,
          effetClubBaseOnnetHP: 2493.70,
          effetClubInterOffnetHC: 2494.60,
          effetClubInterOffnetHP: 2494.55,
          effetClubInterOnnetHC: 2494.50,
          effetClubInterOnnetHP: 2494.45,
          // 8 Résultats d'analyse
          resultatBaseOffnetHC: 'Effet Club Positif',
          resultatBaseOffnetHP: 'Effet Club Positif',
          resultatBaseOnnetHC: 'Effet Club Positif',
          resultatBaseOnnetHP: 'Effet Club Positif',
          resultatInterOffnetHC: 'Effet Club Positif',
          resultatInterOffnetHP: 'Effet Club Positif',
          resultatInterOnnetHC: 'Effet Club Positif',
          resultatInterOnnetHP: 'Effet Club Positif',
          // 8 Indicateurs booléens
          isEffetClubBaseOffnetHC: true,
          isEffetClubBaseOffnetHP: true,
          isEffetClubBaseOnnetHC: true,
          isEffetClubBaseOnnetHP: true,
          isEffetClubInterOffnetHC: true,
          isEffetClubInterOffnetHP: true,
          isEffetClubInterOnnetHC: true,
          isEffetClubInterOnnetHP: true,
          // Résultat général (moyenne des 8)
          effetClub: 2494.42,
          resultat: 'Effet Club calculé: 2494.4200 (8/8 analyses positives)',
          isEffetClub: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Offre introuvable',
  })
  async getEffetClub(@Param('id', ParseIntPipe) id: number) {
    return this.offreService.getEffetClub(id);
  }

  @Post(':id/calculer-effet-club')
  @ApiOperation({ 
    summary: 'Calculer ET sauvegarder l\'effet club d\'une offre (version POST)',
    description: `
    ## CALCUL DE L'EFFET CLUB - FORMULES DÉTAILLÉES

    ### 1. Calcul du taOperateur
    **Formule :** (tarifOffNetHeureCreuse + tarifOffNetHeurePleine + tarifOnNetHeureCreuse + tarifOnNetHeurePleine) / 4
    
    **Détail :**
    - Recherche du tarif d'interconnexion de l'opérateur pour l'année de l'offre
    - **Priorité 1 :** Tarif de type "Interconnexion"
    - **Priorité 2 :** Si absent, tarif de type "Base"
    - **Calcul :** Moyenne arithmétique des 4 composantes tarifaires

    ### 2. Calcul du taMoyen (TA moyen du marché)
    **Formule :** Σ(taOperateur_autres) / n_autres_opérateurs
    
    **Détail :**
    - Pour chaque autre opérateur de l'année :
      - Appliquer la même logique de priorité (Interconnexion > Base)
      - Calculer son taOperateur avec la même formule
    - Moyenne de tous les taOperateur calculés

    ### 3. Calcul des prix réseau de l'offre
    **prixOnNet :** Σ(tarifMinuteOnNet_options) / nombre_options
    **prixOffNet :** Σ(tarifMinuteOffNet_options) / nombre_options
    
    **Détail :**
    - Récupération de toutes les options de l'offre
    - Moyenne des tarifs OnNet et OffNet de ces options

    ### 4. 🔥 FORMULE PRINCIPALE DE L'EFFET CLUB
    **effetClub = (prixOffNet - prixOnNet) - (taMoyen - taOperateur)**

    #### Décomposition :
    - **(prixOffNet - prixOnNet)** : Différentiel de prix réseau de l'offre
    - **(taMoyen - taOperateur)** : Différentiel par rapport au marché
    - **Résultat final** : Impact économique de l'effet club

    #### Interprétation du résultat :
    - **> 0 :** 🟢 Effet club FAVORABLE (économies client)
    - **= 0 :** 🟡 Équilibre parfait avec le marché
    - **< 0 :** 🔴 PAS d'effet club (surcoût client)

    ### ⚠️ Prérequis pour le calcul :
    1. Tarifs d'interconnexion existants pour l'opérateur (année de l'offre)
    2. Au moins une option avec tarifs OnNet/OffNet définis
    3. Autres opérateurs avec tarifs pour la même année
    4. Données cohérentes et complètes dans la base
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club calculé et sauvegardé avec succès',
    schema: {
      example: {
        success: true,
        message: 'L\'effet club et les prix réseaux ont été calculés et sauvegardés avec succès.',
        data: {
          idOffre: 1,
          nomOffre: 'Forfait Mobile Illimité',
          operateur: {
            id: 1,
            nom: 'MTN',
            code: 'MTN',
          },
          prixOffNet: 7500.0,
          prixOnNet: 5000.0,
          // Tarifs de l'opérateur (8 valeurs)
          taBaseOperateurOffnetHC: 22.50,
          taBaseOperateurOffnetHP: 24.75,
          taBaseOperateurOnnetHC: 18.30,
          taBaseOperateurOnnetHP: 20.60,
          taInterOperateurOffnetHC: 25.80,
          taInterOperateurOffnetHP: 28.40,
          taInterOperateurOnnetHC: 21.90,
          taInterOperateurOnnetHP: 24.20,
          // Moyennes du marché (8 valeurs)
          taMoyenBaseOffnetHC: 28.15,
          taMoyenBaseOffnetHP: 30.45,
          taMoyenBaseOnnetHC: 24.80,
          taMoyenBaseOnnetHP: 26.90,
          taMoyenInterOffnetHC: 31.20,
          taMoyenInterOffnetHP: 33.85,
          taMoyenInterOnnetHC: 27.40,
          taMoyenInterOnnetHP: 29.75,
          // 8 Effets club spécifiques
          effetClubBaseOffnetHC: 2494.35,
          effetClubBaseOffnetHP: 2494.30,
          effetClubBaseOnnetHC: 2493.50,
          effetClubBaseOnnetHP: 2493.70,
          effetClubInterOffnetHC: 2494.60,
          effetClubInterOffnetHP: 2494.55,
          effetClubInterOnnetHC: 2494.50,
          effetClubInterOnnetHP: 2494.45,
          // Résultats des 8 analyses
          resultatBaseOffnetHC: 'Effet Club Positif',
          resultatBaseOffnetHP: 'Effet Club Positif',
          resultatBaseOnnetHC: 'Effet Club Positif',
          resultatBaseOnnetHP: 'Effet Club Positif',
          resultatInterOffnetHC: 'Effet Club Positif',
          resultatInterOffnetHP: 'Effet Club Positif',
          resultatInterOnnetHC: 'Effet Club Positif',
          resultatInterOnnetHP: 'Effet Club Positif',
          // Booléens des 8 analyses
          isEffetClubBaseOffnetHC: true,
          isEffetClubBaseOffnetHP: true,
          isEffetClubBaseOnnetHC: true,
          isEffetClubBaseOnnetHP: true,
          isEffetClubInterOffnetHC: true,
          isEffetClubInterOffnetHP: true,
          isEffetClubInterOnnetHC: true,
          isEffetClubInterOnnetHP: true,
          // Données générales
          nombreAutresOperateurs: 3,
          nombreOptions: 4,
          effetClub: 2494.42, // Moyenne générale
          resultat: 'Effet Club calculé: 2494.4200 (4 options analysées - 8/8 effets positifs)',
          isEffetClub: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Offre introuvable',
  })
  async calculerEtSauvegarderEffetClub(@Param('id', ParseIntPipe) id: number) {
    return this.offreService.calculerEtSauvegarderEffetClub(id);
  }

  @Post('calculer-effets-club-toutes')
  @ApiOperation({ 
    summary: 'Calculer l\'effet club pour TOUTES les offres (méthode classique)',
    description: `
    ## CALCUL MASSIF DE L'EFFET CLUB - MÉTHODE CLASSIQUE

    ### 🎯 Objectif :
    Calculer et sauvegarder l'effet club pour toutes les offres existantes selon la **méthode classique** avec prix OnNet/OffNet.

    ### 🔄 MÉTHODE CLASSIQUE vs REVENUS :
    
    **📊 Cette API (CLASSIQUE) :**
    - Utilise **prixOnNet** = moyenne des tarifs OnNet des options
    - Utilise **prixOffNet** = moyenne des tarifs OffNet des options
    - Formule : \`effetClub = (prixOffNet - prixOnNet) - (taMoyen - taOperateur)\`
    
    **💰 API Revenus (/calculer-effets-club-revenus) :**
    - Utilise **revenuMoyenOnNet** = formules complexes avec tp, tf, tnc, ep
    - Utilise **revenuMoyenOffNet** = formules complexes avec tp, tf, tnc, ep
    - Intègre sommes (frais souscription, trafic gratuit, trafic option)

    ### 📋 Fonctionnement :
    1. **Récupération** de toutes les offres actives
    2. **Calcul individuel** de l'effet club pour chaque offre (méthode classique)
    3. **Sauvegarde automatique** des résultats avec prixOnNet/prixOffNet
    4. **Rapport détaillé** des succès et échecs

    ### 📊 Réponse détaillée :
    - **Succès** : Liste des offres avec effet club calculé (prix standard)
    - **Échecs** : Liste des offres avec raison de l'échec
    - **Statistiques** : Résumé global de l'opération
    - **Méthode** : "prix-standard" (vs "revenus-moyens")

    ### ⚠️ Cas d'échec possibles :
    - Absence de tarifs d'interconnexion pour l'opérateur
    - Aucune option avec tarifs OnNet/OffNet définis
    - Données incomplètes ou incohérentes
    - Erreurs de calcul spécifiques

    ### 🕒 Durée estimée :
    Varie selon le nombre d'offres (quelques secondes à minutes)

    ### 💡 Conseil :
    Pour des calculs plus sophistiqués incluant les revenus moyens, utilisez \`POST /offre/calculer-effets-club-revenus\`
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul des effets club terminé (méthode classique)',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Effets club calculés (méthode classique)',
        message: 'Calcul terminé: 15 succès, 3 échecs sur 18 offres (méthode prix standard)',
        data: {
          statistiques: {
            totalOffres: 18,
            succes: 15,
            echecs: 3,
            pourcentageReussite: 83.33,
            totalEffetsClubPositifs: 48,
            moyenneEffetsClubParOffre: 3.2,
            methodeCalcul: 'prix-standard'
          },
          succes: [
            {
              idOffre: 1,
              nomOffre: 'Forfait Premium Mobile',
              operateur: 'Orange',
              annee: 2025,
              // MÉTHODE CLASSIQUE : Prix moyens des tarifs OnNet/OffNet des options
              prixOnNet: 50.25,
              prixOffNet: 175.50,
              nombreOptions: 3,
              effetClubGeneral: 125.75,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 6,
                baseOffnetHC: 142.30,
                baseOffnetHP: 151.20,
                baseOnnetHC: 98.45,
                baseOnnetHP: 105.80,
                interOffnetHC: 135.60,
                interOffnetHP: 148.90,
                interOnnetHC: 88.25,
                interOnnetHP: 95.70
              },
              methodeUtilisee: 'prix-standard',
              hasEffetClub: true
            },
            {
              idOffre: 2,
              nomOffre: 'Forfait Entreprise',
              operateur: 'MTN',
              annee: 2025,
              // MÉTHODE CLASSIQUE : Prix moyens des tarifs OnNet/OffNet des options
              prixOnNet: 35.80,
              prixOffNet: 120.30,
              nombreOptions: 2,
              effetClubGeneral: 84.50,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 4,
                baseOffnetHC: 95.20,
                baseOffnetHP: 102.40,
                baseOnnetHC: 65.10,
                baseOnnetHP: 72.30,
                interOffnetHC: 88.90,
                interOffnetHP: 94.70,
                interOnnetHC: 58.40,
                interOnnetHP: 63.80
              },
              methodeUtilisee: 'prix-standard',
              hasEffetClub: true
            },
            {
              idOffre: 3,
              nomOffre: 'Forfait Étudiant',
              operateur: 'Moov',
              annee: 2025,
              prixOnNet: 25.00,
              prixOffNet: 45.00,
              nombreOptions: 1,
              effetClubGeneral: 20.00,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 2,
                baseOffnetHC: 22.50,
                baseOffnetHP: 18.75,
                baseOnnetHC: 15.30,
                baseOnnetHP: 12.80,
                interOffnetHC: 25.60,
                interOffnetHP: 21.40,
                interOnnetHC: 16.90,
                interOnnetHP: 14.20
              },
              hasEffetClub: true
            }
          ],
          echecs: [
            {
              idOffre: 4,
              nomOffre: 'Forfait Basic',
              operateur: 'MTN',
              annee: 2025,
              raison: 'Aucune donnée tarifaire trouvée pour cet opérateur et cette année',
              erreur: 'Tarifs d\'interconnexion manquants pour 2025'
            },
            {
              idOffre: 7,
              nomOffre: 'Offre Spéciale',
              operateur: 'Telecel',
              annee: 2025,
              raison: 'Aucune option avec tarifs OnNet/OffNet définis',
              erreur: 'Options sans configuration tarifaire'
            },
            {
              idOffre: 12,
              nomOffre: 'Forfait International',
              operateur: 'Orange',
              annee: 2025,
              raison: 'Données incomplètes ou incohérentes',
              erreur: 'Tarifs manquants pour certaines heures'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul avec échecs majoritaires (méthode classique)',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Effets club calculés avec erreurs (méthode classique)',
        message: 'Calcul terminé: 2 succès, 8 échecs sur 10 offres (méthode prix standard)',
        data: {
          statistiques: {
            totalOffres: 10,
            succes: 2,
            echecs: 8,
            pourcentageReussite: 20.00,
            totalEffetsClubPositifs: 12,
            moyenneEffetsClubParOffre: 6.0,
            methodeCalcul: 'prix-standard'
          },
          succes: [
            {
              idOffre: 1,
              nomOffre: 'Forfait Complet',
              operateur: 'Orange',
              annee: 2025,
              // MÉTHODE CLASSIQUE : Prix moyens des tarifs OnNet/OffNet des options
              prixOnNet: 45.00,
              prixOffNet: 180.00,
              nombreOptions: 4,
              effetClubGeneral: 135.00,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 8,
                baseOffnetHC: 145.20,
                baseOffnetHP: 152.30,
                baseOnnetHC: 128.40,
                baseOnnetHP: 134.60,
                interOffnetHC: 149.80,
                interOffnetHP: 156.90,
                interOnnetHC: 132.50,
                interOnnetHP: 138.20
              },
              hasEffetClub: true
            },
            {
              idOffre: 5,
              nomOffre: 'Pack Business',
              operateur: 'MTN',
              annee: 2025,
              prixOnNet: 38.50,
              prixOffNet: 95.00,
              nombreOptions: 2,
              effetClubGeneral: 56.50,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 4,
                baseOffnetHC: 62.10,
                baseOffnetHP: 58.80,
                baseOnnetHC: 45.30,
                baseOnnetHP: 42.70,
                interOffnetHC: 65.40,
                interOffnetHP: 61.90,
                interOnnetHC: 48.20,
                interOnnetHP: 44.80
              },
              hasEffetClub: true
            }
          ],
          echecs: [
            {
              idOffre: 2,
              nomOffre: 'Forfait Jeune',
              operateur: 'Moov',
              annee: 2025,
              raison: 'Tarifs d\'interconnexion non configurés',
              erreur: 'Table tarifaire vide pour l\'opérateur'
            },
            {
              idOffre: 3,
              nomOffre: 'Offre Senior',
              operateur: 'Telecel',
              annee: 2025,
              raison: 'Options sans tarification',
              erreur: 'Champs tarifMinuteOnNet et tarifMinuteOffNet null'
            },
            {
              idOffre: 4,
              nomOffre: 'Pack Famille',
              operateur: 'Orange',
              annee: 2024,
              raison: 'Année non supportée pour le calcul',
              erreur: 'Données tarifaires obsolètes'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur dans les paramètres',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'error',
        title: 'Erreur de calcul',
        message: 'Impossible de calculer les effets club',
        data: {
          raison: 'Aucune offre trouvée dans la base de données',
          suggestion: 'Vérifiez que des offres existent avant de lancer le calcul'
        }
      }
    }
  })
  async calculerEffetsClubToutes() {
    return this.offreService.calculerEffetsClubToutes();
  }

  @Post('calculer-effets-club-revenus')
  @ApiOperation({ 
    summary: 'Calculer l\'effet club pour TOUTES les offres selon les revenus moyens',
    description: `
    ## CALCUL MASSIF DE L'EFFET CLUB - MÉTHODE REVENUS MOYENS

    ### 🎯 Objectif :
    Calculer et sauvegarder l'effet club pour toutes les offres existantes selon une méthode basée sur les **revenus moyens** au lieu des prix traditionnels.

    ### 📋 Fonctionnement :
    1. **Récupération** de toutes les offres actives
    2. **Calcul des revenus moyens** pour chaque offre avec les formules complexes :
       - \`revenuMoyenOnNet = ((tpOnNet*tfOnNet)*(1+tncOnNet)*(1+epOnNet)+sommeFraisSouscription)/(tpOnNet+sommeTraficGratuit+sommeTraficOption)\`
       - \`revenuMoyenOffNet = ((tpOffNet*tfOffNet)*(1+tncOffNet)*(1+epOffNet)+sommeFraisSouscription)/(tpOffNet+sommeTraficGratuit+sommeTraficOption)\`
    3. **Calcul de l'effet club** avec la formule : \`effetClub = (revenuMoyenOffNet - revenuMoyenOnNet) - (taMoyen - taOperateur)\`
    4. **Sauvegarde automatique** des résultats dans les champs \`revenuMoyenOnNet\` et \`revenuMoyenOffNet\`
    5. **Rapport détaillé** des succès et échecs

    ### 🆕 Différence MAJEURE avec l'API standard :
    | **API Standard** | **API Revenus Moyens (cette API)** |
    |-----------------|-----------------------------------|
    | Utilise \`prixOnNet\` et \`prixOffNet\` | Utilise \`revenuMoyenOnNet\` et \`revenuMoyenOffNet\` |
    | Calcul simple : moyenne des tarifs | Calcul complexe : formules avec tp, tf, tnc, ep |
    | Ne considère que les tarifs minutes | Intègre frais, trafic gratuit, trafic options |
    | Formule : \`(prixOffNet - prixOnNet) - (taMoyen - taOperateur)\` | Formule : \`(revenuMoyenOffNet - revenuMoyenOnNet) - (taMoyen - taOperateur)\` |

    ### 🧮 **Méthodes de calcul intégrées :**
    - **\`calculerSommeFraisSouscription()\`** : (somme nombreSouscriptions) × (somme fraisSouscription)
    - **\`calculerSommeTraficGratuit()\`** : Somme des valeurs \`gratuit\` des avantages
    - **\`calculerSommeTraficOption()\`** : Somme des valeurs \`trafic\` des options
    - **\`calculerRevenusMoyens()\`** : Formules complexes OnNet/OffNet avec tous les paramètres tarifaires

    ### 📊 Données sauvegardées (NOUVEAUX CHAMPS SPÉCIFIQUES AUX REVENUS) :
    - **\`revenuMoyenOnNet\`** : Revenu moyen calculé OnNet (au lieu de prixOnNet)
    - **\`revenuMoyenOffNet\`** : Revenu moyen calculé OffNet (au lieu de prixOffNet)
    - **\`effetClubRevenus\`** : Effet club général selon revenus moyens
    - **\`isEffetClubRevenus\`** : Booléen effet club général selon revenus
    - **\`resultatRevenus\`** : Résultat textuel selon revenus moyens
    - **8 effets club revenus spécifiques** : \`effetClubRevenuBase/InterOnNet/OffNetHC/HP\`
    - **8 résultats revenus spécifiques** : \`resultatRevenuBase/InterOnNet/OffNetHC/HP\`  
    - **8 booléens revenus spécifiques** : \`isEffetClubRevenuBase/InterOnNet/OffNetHC/HP\`
    - **Tous les champs TA** : Tarifs d'accès opérateur et moyens du marché

    ### 🆕 Séparation des méthodes :
    - **Champs classiques** : \`effetClub\`, \`isEffetClub\`, \`effetClubBaseXXX\` (inchangés)
    - **Champs revenus** : \`effetClubRevenus\`, \`isEffetClubRevenus\`, \`effetClubRevenuXXX\` (nouveaux)

    ### ⚠️ Cas d'échec possibles :
    - Absence de données tarifaires (tp, tf, tnc, ep) pour l'offre
    - Aucune option associée à l'offre
    - Division par zéro dans les calculs de revenus
    - Données de tarifs d'interconnexion manquantes pour l'opérateur
    - Erreurs dans les calculs de sommes (frais, trafic)

    ### 🕒 Durée estimée :
    Varie selon le nombre d'offres et la complexité des calculs (quelques secondes à plusieurs minutes)
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul des effets club terminé (méthode revenus)',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Effets club calculés (revenus)',
        message: 'Calcul terminé: 12 succès, 6 échecs sur 18 offres (méthode revenus moyens)',
        data: {
          statistiques: {
            totalOffres: 18,
            succes: 12,
            echecs: 6,
            pourcentageReussite: 66.67,
            totalEffetsClubPositifs: 38,
            moyenneEffetsClubParOffre: 3.17,
            methodeCalcul: 'revenus-moyens'
          },
          succes: [
            {
              idOffre: 1,
              nomOffre: 'Forfait Premium Mobile',
              operateur: 'Orange',
              annee: 2025,
              // **REVENUS MOYENS** au lieu des prix simples
              revenuMoyenOnNet: 847.32,   // Calculé avec formule complexe OnNet
              revenuMoyenOffNet: 1205.78, // Calculé avec formule complexe OffNet
              nombreOptions: 3,
              effetClubGeneral: 142.85,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 7,
                baseOffnetHC: 155.40,
                baseOffnetHP: 162.30,
                baseOnnetHC: 118.65,
                baseOnnetHP: 125.90,
                interOffnetHC: 148.70,
                interOffnetHP: 156.00,
                interOnnetHC: 112.35,
                interOnnetHP: 119.80
              },
              hasEffetClub: true,
              methodeUtilisee: 'revenus-moyens'
            },
            {
              idOffre: 2,
              nomOffre: 'Forfait Entreprise',
              operateur: 'MTN',
              annee: 2025,
              // **REVENUS MOYENS** calculés selon les formules business
              revenuMoyenOnNet: 623.45,   // Intègre frais souscription, trafic gratuit, etc.
              revenuMoyenOffNet: 892.17,  // Formule avec tp, tf, tnc, ep et sommes
              nombreOptions: 2,
              effetClubGeneral: 91.60,
              effetsClubSpecifiques: {
                totalCalcules: 8,
                effetsPositifs: 5,
                baseOffnetHC: 102.30,
                baseOffnetHP: 109.50,
                baseOnnetHC: 75.20,
                baseOnnetHP: 82.40,
                interOffnetHC: 96.90,
                interOffnetHP: 103.80,
                interOnnetHC: 69.50,
                interOnnetHP: 76.30
              },
              hasEffetClub: true,
              methodeUtilisee: 'revenus-moyens'
            }
          ],
          echecs: [
            {
              idOffre: 4,
              nomOffre: 'Forfait Basic',
              operateur: 'MTN',
              annee: 2025,
              raison: 'Données tarifaires OnNet/OffNet manquantes pour le calcul des revenus moyens',
              erreur: 'Champs tp, tf, tnc, ep non définis pour cette offre',
              methodeEchouee: 'revenus-moyens'
            },
            {
              idOffre: 7,
              nomOffre: 'Offre Spéciale',
              operateur: 'Telecel',
              annee: 2025,
              raison: 'Division par zéro dans le calcul des revenus moyens',
              erreur: 'Dénominateur (tpOnNet+sommeTraficGratuit+sommeTraficOption) égal à zéro',
              methodeEchouee: 'revenus-moyens'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur dans les paramètres (méthode revenus)',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'error',
        title: 'Erreur de calcul (revenus moyens)',
        message: 'Impossible de calculer les effets club avec la méthode des revenus moyens',
        data: {
          raison: 'Données tarifaires insuffisantes pour les calculs de revenus moyens',
          suggestion: 'Vérifiez que les champs tp, tf, tnc, ep sont définis pour toutes les offres et que les options ont des données de trafic',
          champsRequis: ['tpOnNet', 'tfOnNet', 'tncOnNet', 'epOnNet', 'tpOffNet', 'tfOffNet', 'tncOffNet', 'epOffNet'],
          methode: 'revenus-moyens'
        }
      }
    }
  })
  async calculerEffetsClubRevenus() {
    return this.offreService.calculerEffetsClubRevenus();
  }
}
