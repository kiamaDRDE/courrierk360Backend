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
    description: 'Calcule l\'effet club selon différentes méthodes : tarif facial (BASE/INTERCONNEXION) ou revenus moyens (REVENUS_BASE/REVENUS_INTERCONNEXION). Formule utilisée : (TF/RM Offnet - TF/RM Onnet) - (TB/TA Moyen - TB/TA Opérateur)',
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
}
