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
   * Calcule l'effet club avec tous les détails de calcul
   */
  @Get('calculer-avec-details')
  @ApiOperation({
    summary: 'Cas 1 : Calcule l\'effet club selon le tarif de base avec tous les détails des données sources',
    description: `Retourne un calcul détaillé de l'effet club avec toutes les données intermédiaires :
    
  **ÉTAPES DU CALCUL :**

  1️⃣ **Différence Base** : TarifOffNet - TarifOnNet (selon type heure)
    - Retourne les tarifs de base utilisés (OffNet et OnNet)
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
  @ApiQuery({ name: 'operateurId', description: 'ID de l\'opérateur', type: Number, required: true, example: 1 })
  @ApiQuery({ name: 'typeHeure', description: 'Période tarifaire', enum: ['CREUSE', 'PLEINE'], required: true, example: 'PLEINE' })
  @ApiQuery({ name: 'annee', description: 'Année de référence', type: Number, required: true, example: 2025 })
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
            typeHeure: 'PLEINE',
            annee: 2025,
            differenceBase: 20.0,
            taMoyenAutresOperateurs: 46.5,
            tarifOperateur: 52.0,
            differenceTaMoyenTaOperateur: -5.5,
            isEffetClub: true,
            tarifsBaseDetails:{
              tarifOffNet: 50.0,
              tarifOnNet: 30.0
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides ou manquants' })
  @ApiResponse({ status: 404, description: 'Opérateur ou tarifs introuvables' })
  async calculerEffetClubAvecDetails(
    @Query('operateurId') operateurId: string,
    @Query('typeHeure') typeHeure: TypeHeure,
    @Query('annee') annee: string,
  ) {
    const result = await this.effetClubService.calculerResultatEffetClub(
      Number(operateurId),
      typeHeure,
      Number(annee),
    );

    return {
      success: true,
      statusCode: 201,
      code: 'success',
      title: "Calcul détaillé de l'ef fet club",
      message: "Toutes les étapes de calcul avec données sources",
      data: result,
    };
  }


}
