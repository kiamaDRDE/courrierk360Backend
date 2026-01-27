import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TypeCalcule, TypeHeure, TypeOffre, EffetClubService } from './effet-club.service';
import { EffetClubFilterDto } from './dto/effet-club-filter.dto';

@ApiTags('Effet Club')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('effet-club')
export class EffetClubController {
  constructor(private readonly effetClubService: EffetClubService) {}



  @Get('calculateEffetDeClub')
  @ApiOperation({
    summary: 'Calcule l\'effet club d\'une offre',
    description: `Calcule l'effet club selon différentes méthodes avec formules spécifiques :
    
**FORMULES SELON LE TYPE DE CALCUL :**

• **BASE** : Effet Club = (TF Offnet - TF Onnet) - (TB Moyen - TB Opérateur)
  - TF = Tarif Facial (moyenne des structures tarifaires des options)
  - TB = Tarif de Base
  
• **INTERCONNEXION** : Effet Club = (TF Offnet - TF Onnet) - (TA Moyen - TA Opérateur)
  - TF = Tarif Facial (moyenne des structures tarifaires des options)
  - TA = Tarif d'Interconnexion
  
• **REVENUS_BASE** : Effet Club = (RM Offnet - RM Onnet) - (TB Moyen - TB Opérateur)
  - RM = Revenus Moyens (stockés dans l'offre)
  - TB = Tarif de Base
  
• **REVENUS_INTERCONNEXION** : Effet Club = (RM Offnet - RM Onnet) - (TA Moyen - TA Opérateur)
  - RM = Revenus Moyens (stockés dans l'offre)
  - TA = Tarif d'Interconnexion

**RÉSULTAT :** Si Effet Club > 0 → "EFFET DE CLUB", sinon "PAS D'EFFET DE CLUB"`,
  })
  @ApiQuery({
    name: 'operateurId',
    description: 'ID de l\'opérateur',
    type: Number,
    required: true,
    example: 1,
  })
  @ApiQuery({
    name: 'offreId',
    description: 'ID de l\'offre',
    type: Number,
    required: true,
    example: 10,
  })
  @ApiQuery({
    name: 'typeOffre',
    description: 'Type de réseau pour le calcul TB/TA',
    enum: ['OFFNET', 'ONNET'],
    required: true,
    example: 'OFFNET',
  })
  @ApiQuery({
    name: 'typeHeure',
    description: 'Période tarifaire pour le calcul TB/TA',
    enum: ['CREUSE', 'PLEINE'],
    required: true,
    example: 'PLEINE',
  })
  @ApiQuery({
    name: 'typeCalcule',
    description: 'Méthode de calcul : BASE (tarif facial + tarif de base), INTERCONNEXION (tarif facial + tarif interconnexion), REVENUS_BASE (revenus moyens + tarif de base), REVENUS_INTERCONNEXION (revenus moyens + tarif interconnexion)',
    enum: ['BASE', 'INTERCONNEXION', 'REVENUS_BASE', 'REVENUS_INTERCONNEXION'],
    required: true,
    example: 'BASE',
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de référence pour les tarifs',
    type: Number,
    required: true,
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club calculé avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Effet club',
        message: 'Effet club récupéré pour l\'offre',
        data: {
          filtres: {
            operateurId: 1,
            offreId: 10,
            annee: 2025,
            typeOffre: 'OFFNET',
            typeHeure: 'PLEINE',
            typeCalcule: 'BASE',
          },
          tfOrRmOffnet: 45.50,
          tfOrRmOnnet: 35.20,
          ecartTF: 10.30,
          tbOrTaMoyen: 25.00,
          tbOrTaOperateur: 20.00,
          ecartTBorTA: 5.00,
          effetClubValeur: 5.30,
          effetClubPresent: true,
          result: 'EFFET DE CLUB',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides ou manquants',
  })
  @ApiResponse({
    status: 404,
    description: 'Offre ou opérateur introuvable',
  })
  calculateEffetDeClub(
    @Query('operateurId') operateurId: string,
    @Query('offreId') offreId: string,
    @Query('typeOffre') typeOffre: TypeOffre,
    @Query('typeHeure') typeHeure: TypeHeure,
    @Query('typeCalcule') typeCalcule: TypeCalcule,
    @Query('annee') annee: string,
  ) {
    return this.effetClubService.calculateEffetDeClubOptimized(
      Number(operateurId),
      Number(offreId),
      typeOffre,
      typeHeure,
      typeCalcule,
      Number(annee),
    );
  }






  /**
   * Récupère l'effet club d'une offre selon le tarif de base avec filtres
   */
  @Get('base/:id')
  @ApiOperation({
    summary: 'Récupère l\'effet club d\'une offre (tarif de base) avec filtres période et réseau',
    description: 'Retourne les données d\'effet club filtrées par période (HC/HP) et réseau (Onnet/Offnet) pour le calcul basé sur le tarif de base',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'offre',
    type: Number,
  })
  @ApiQuery({
    name: 'periode',
    description: 'Période tarifaire (HC ou HP)',
    enum: ['HC', 'HP'],
    required: true,
  })
  @ApiQuery({
    name: 'reseau',
    description: 'Type de réseau (Onnet ou Offnet)',
    enum: ['Onnet', 'Offnet'],
    required: true,
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de l\'offre (filtre optionnel)',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club récupéré avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Offre non trouvée',
  })
  async getEffetClubBase(
    @Param('id', ParseIntPipe) id: number,
    @Query('periode') periode: string,
    @Query('reseau') reseau: string,
    @Query('annee') annee?: number,
  ) {
    return this.effetClubService.getEffetClubBase(id, periode, reseau, annee);
  }

  /**
   * Récupère l'effet club d'une offre selon le tarif d'interconnexion avec filtres
   */
  @Get('inter/:id')
  @ApiOperation({
    summary: 'Récupère l\'effet club d\'une offre (tarif d\'interconnexion) avec filtres période et réseau',
    description: 'Retourne les données d\'effet club filtrées par période (HC/HP) et réseau (Onnet/Offnet) pour le calcul basé sur le tarif d\'interconnexion',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'offre',
    type: Number,
  })
  @ApiQuery({
    name: 'periode',
    description: 'Période tarifaire (HC ou HP)',
    enum: ['HC', 'HP'],
    required: true,
  })
  @ApiQuery({
    name: 'reseau',
    description: 'Type de réseau (Onnet ou Offnet)',
    enum: ['Onnet', 'Offnet'],
    required: true,
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de l\'offre (filtre optionnel)',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club récupéré avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Offre non trouvée',
  })
  async getEffetClubInter(
    @Param('id', ParseIntPipe) id: number,
    @Query('periode') periode: string,
    @Query('reseau') reseau: string,
    @Query('annee') annee?: number,
  ) {
    return this.effetClubService.getEffetClubInter(id, periode, reseau, annee);
  }

  /**
   * Récupère l'effet club d'une offre selon le tarif de base (revenus moyens) avec filtres
   */
  @Get('revenus-base/:id')
  @ApiOperation({
    summary: 'Récupère l\'effet club d\'une offre (tarif de base - revenus moyens) avec filtres période et réseau',
    description: 'Retourne les données d\'effet club filtrées par période (HC/HP) et réseau (Onnet/Offnet) pour le calcul basé sur les revenus moyens (tarif de base)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'offre',
    type: Number,
  })
  @ApiQuery({
    name: 'periode',
    description: 'Période tarifaire (HC ou HP)',
    enum: ['HC', 'HP'],
    required: true,
  })
  @ApiQuery({
    name: 'reseau',
    description: 'Type de réseau (Onnet ou Offnet)',
    enum: ['Onnet', 'Offnet'],
    required: true,
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de l\'offre (filtre optionnel)',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club récupéré avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Offre non trouvée',
  })
  async getEffetClubRevenusBase(
    @Param('id', ParseIntPipe) id: number,
    @Query('periode') periode: string,
    @Query('reseau') reseau: string,
    @Query('annee') annee?: number,
  ) {
    return this.effetClubService.getEffetClubRevenusBase(id, periode, reseau, annee);
  }

  /**
   * Récupère l'effet club d'une offre selon le tarif d'interconnexion (revenus moyens) avec filtres
   */
  @Get('revenus-inter/:id')
  @ApiOperation({
    summary: 'Récupère l\'effet club d\'une offre (tarif d\'interconnexion - revenus moyens) avec filtres période et réseau',
    description: 'Retourne les données d\'effet club filtrées par période (HC/HP) et réseau (Onnet/Offnet) pour le calcul basé sur les revenus moyens (tarif d\'interconnexion)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'offre',
    type: Number,
  })
  @ApiQuery({
    name: 'periode',
    description: 'Période tarifaire (HC ou HP)',
    enum: ['HC', 'HP'],
    required: true,
  })
  @ApiQuery({
    name: 'reseau',
    description: 'Type de réseau (Onnet ou Offnet)',
    enum: ['Onnet', 'Offnet'],
    required: true,
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de l\'offre (filtre optionnel)',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Effet club récupéré avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Offre non trouvée',
  })
  async getEffetClubRevenusInter(
    @Param('id', ParseIntPipe) id: number,
    @Query('periode') periode: string,
    @Query('reseau') reseau: string,
    @Query('annee') annee?: number,
  ) {
    return this.effetClubService.getEffetClubRevenusInter(id, periode, reseau, annee);
  }

  /**
   * Liste toutes les offres avec leurs effets club complets (16 combinaisons)
   */
  @Get('all-complete')
  @ApiOperation({
    summary: 'Liste toutes les offres avec les 16 combinaisons d\'effets club',
    description: 'Retourne toutes les offres avec l\'ensemble des 16 combinaisons possibles d\'effets club (4 méthodes × 4 combinaisons période/réseau)',
  })
  @ApiQuery({
    name: 'page',
    description: 'Numéro de la page',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre d\'éléments par page',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'operateurId',
    description: 'ID de l\'opérateur (filtre)',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'nom',
    description: 'Nom de l\'offre (filtre partiel)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'typeOffre',
    description: 'Type d\'offre (filtre)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'statut',
    description: 'Statut de l\'offre (filtre)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de l\'offre (filtre)',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'dateDebut',
    description: 'Date de début (filtre)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'dateFin',
    description: 'Date de fin (filtre)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Champ de tri',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Ordre de tri (asc/desc)',
    enum: ['asc', 'desc'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste récupérée avec succès',
  })
  async getAllEffetsClubComplete(@Query() query: EffetClubFilterDto) {
    return this.effetClubService.getAllEffetsClubComplete(query);
  }

   /**
   * Calcule l'effet club avec tous les détails de calcul
   */
  @Get('calculer-avec-details')
  @ApiOperation({
    summary: 'Calcule l\'effet club avec tous les détails des données sources',
    description: `Retourne un calcul détaillé de l'effet club avec toutes les données intermédiaires :
    
**ÉTAPES DU CALCUL :**

1️⃣ **Différence Base** : TarifOffNet - TarifOnNet (selon type heure)
   - Si CREUSE : retourne tarifOffNetHeureCreuse et tarifOnNetHeureCreuse
   - Si PLEINE : retourne tarifOffNetHeurePleine et tarifOnNetHeurePleine
   - Affiche la formule et le calcul appliqué

2️⃣ **Tarif Moyen Autres Opérateurs** : Moyenne des tarifs d'interconnexion
   - Liste tous les tarifs des autres opérateurs
   - Détaille le calcul de la moyenne
   
3️⃣ **Tarif Opérateur** : Tarif d'interconnexion de l'opérateur sélectionné
   - Retourne le tarif utilisé selon la période (HC/HP)
   
4️⃣ **Différence TaMoyen - TaOpérateur**
   - Calcul de la différence entre moyenne marché et opérateur
   
5️⃣ **Résultat Final** : Effet Club = DifferenceBase - (TaMoyen - TaOpérateur)
   - Détermine si "EFFET DE CLUB" ou "PAS D'EFFET DE CLUB"

**UTILITÉ :** Permet d'auditer et comprendre chaque étape du calcul avec les données sources`,
  })
  @ApiQuery({
    name: 'operateurId',
    description: 'ID de l\'opérateur',
    type: Number,
    required: true,
    example: 1,
  })
  @ApiQuery({
    name: 'typeHeure',
    description: 'Période tarifaire',
    enum: ['CREUSE', 'PLEINE'],
    required: true,
    example: 'PLEINE',
  })
  @ApiQuery({
    name: 'annee',
    description: 'Année de référence',
    type: Number,
    required: true,
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul détaillé retourné avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Calcul détaillé de l\'effet club',
        message: 'Toutes les étapes de calcul avec données sources',
        data: {
          parametres: {
            operateurId: 1,
            operateurNom: 'MTN',
            typeHeure: 'PLEINE',
            annee: 2025,
          },
          etape1_DifferenceBase: {
            formule: 'tarifOffNetHeurePleine - tarifOnNetHeurePleine',
            donneesSource: {
              tarifId: 123,
              typeTarif: 'Base',
              annee: 2025,
              operateur: {
                id: 1,
                nom: 'MTN',
              },
              // 👇 Si typeHeure = 'PLEINE', retourne ces 2 champs
              tarifOffNetHeurePleine: 50.0,
              tarifOnNetHeurePleine: 30.0,
              // 👇 Si typeHeure = 'CREUSE', retournerait plutôt :
              // tarifOffNetHeureCreuse: 40.0,
              // tarifOnNetHeureCreuse: 25.0,
            },
            calcul: '50 - 30',
            resultat: 20.0,
          },
          etape2_TaMoyenAutresOperateurs: {
            formule: 'Σ(tarifs autres opérateurs) / nombre d\'opérateurs',
            donneesSource: {
              nombreOperateurs: 2,
              tarifsDetails: [
                {
                  operateurId: 2,
                  operateurNom: 'Orange',
                  tarifId: 456,
                  valeur: 45.0,
                  typeTarif: 'Interconnexion',
                  annee: 2025,
                },
                {
                  operateurId: 3,
                  operateurNom: 'Camtel',
                  tarifId: 789,
                  valeur: 48.0,
                  typeTarif: 'Interconnexion',
                  annee: 2025,
                },
              ],
              sommeTarifs: 93.0,
            },
            calcul: '93 / 2',
            resultat: 46.5,
          },
          etape3_TarifOperateur: {
            formule: 'tarifOffNetHeurePleine',
            donneesSource: {
              tarifId: 124,
              typeTarif: 'Interconnexion',
              annee: 2025,
              operateur: {
                id: 1,
                nom: 'MTN',
              },
              tousLesTarifs: {
                tarifOffNetHeureCreuse: 42.0,
                tarifOffNetHeurePleine: 52.0,
              },
            },
            resultat: 52.0,
          },
          etape4_DifferenceTaMoyenTaOperateur: {
            formule: 'TaMoyen - TaOpérateur',
            calcul: '46.5 - 52',
            resultat: -5.5,
          },
          resultatFinal: {
            formule: 'Effet Club = DifferenceBase - (TaMoyen - TaOpérateur)',
            calcul: '20 - (-5.5)',
            effetClubValeur: 25.5,
            isEffetClub: true,
            resultat: 'EFFET DE CLUB',
            regleDetermination: 'Si DifferenceBase > (TaMoyen - TaOpérateur) alors "EFFET DE CLUB"',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides ou manquants',
  })
  @ApiResponse({
    status: 404,
    description: 'Opérateur ou tarifs introuvables',
  })
  async calculerResultatEffetClub(
    @Query('operateurId') operateurId: string,
    @Query('typeHeure') typeHeure: TypeHeure,
    @Query('annee') annee: string,
  ) {
    return this.effetClubService.calculerResultatEffetClub(
      Number(operateurId),
      typeHeure,
      Number(annee),
    );
  }

}
