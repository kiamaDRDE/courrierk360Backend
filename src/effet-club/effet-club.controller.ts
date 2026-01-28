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

  /**
   * Calcule l'effet club basé sur le tarif facial avec tous les détails
   * @param operateurId - ID de l'opérateur
   * @param offreId - ID de l'offre
   * @param typeHeure - Type d'heure (CREUSE ou PLEINE)
   * @param annee - Année du tarif
   */
  @Get('calculer-tarif-facial')
  @ApiOperation({ 
    summary: 'Cas 2 : Calcule l\'effet club basé sur le tarif facial',
    description: 'Calcule l\'effet club en utilisant la différence entre tarif facial OffNet et OnNet (TF), et compare avec la différence entre le tarif moyen des autres opérateurs et le tarif de l\'opérateur sélectionné selon la période (HC/HP)'
  })
  @ApiQuery({ 
    name: 'operateurId', 
    type: Number, 
    description: 'ID de l\'opérateur',
    example: 1
  })
  @ApiQuery({ 
    name: 'offreId', 
    type: Number, 
    description: 'ID de l\'offre',
    example: 5
  })
  @ApiQuery({ 
    name: 'typeHeure', 
    enum: ['CREUSE', 'PLEINE'], 
    description: 'Type d\'heure (CREUSE ou PLEINE)',
    example: 'CREUSE'
  })
  @ApiQuery({ 
    name: 'annee', 
    type: Number, 
    description: 'Année du tarif',
    example: 2025
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul de l\'effet club basé sur le tarif facial réussi',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Effet club (Tarif Facial)',
        message: 'Calcul de l\'effet club basé sur le tarif facial effectué avec succès',
        data: {
          typeHeure: 'CREUSE',
          tarifOffnet: 45.50,
          tarifOnnet: 25.30,
          differenceTarifFacial: 20.20,
          taMoyenAutresOperateurs: 35.80,
          tarifOperateur: 28.50,
          differenceTaMoyenTaOperateur: 7.30,
          isEffetClub: true
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides'
  })
  @ApiResponse({
    status: 404,
    description: 'Opérateur ou offre introuvable'
  })
  async calculerEffetClubTarifFacialAvecDetails(
    @Query('operateurId', ParseIntPipe) operateurId: number,
    @Query('offreId', ParseIntPipe) offreId: number,
    @Query('typeHeure') typeHeure: TypeHeure,
    @Query('annee', ParseIntPipe) annee: number,
  ) {
    // Validation du typeHeure (la validation sera gérée par le service)
    const resultat = await this.effetClubService.calculerResultatEffetClubTarifFacial(
      operateurId,
      offreId,
      typeHeure,
      annee,
    );

    return this.effetClubService['formatResponse'](
      resultat,
      'Effet club (Tarif Facial)',
      'Calcul de l\'effet club basé sur le tarif fiscal effectué avec succès',
    );
  }

  /**
   * Calcule l'effet club basé sur le revenu moyen avec tous les détails
   * @param operateurId - ID de l'opérateur
   * @param offreId - ID de l'offre
   * @param typeHeure - Type d'heure (CREUSE ou PLEINE)
   * @param annee - Année du tarif
   */
  @Get('calculer-revenu-moyen')
  @ApiOperation({ 
    summary: 'Cas 3 : Calcule l\'effet club basé sur le revenu moyen',
    description: `Calcule l'effet club en utilisant la différence entre revenus moyens OffNet et OnNet (RM), et compare avec la différence entre le tarif moyen des autres opérateurs et le tarif de l'opérateur sélectionné selon la période (HC/HP).
    
    **ÉTAPES DU CALCUL :**
    
    1️⃣ **Revenus Moyens** : Calcul des RM OffNet et OnNet selon la formule :
      RM = (TP*TF*(1+TNC)*(1+EP) + Σ(frais)) / (TP + sommeAvantageGratuit + sommeTraficOption)
    
    2️⃣ **Différence Revenus** : RMoffnet - RMonnet (reste constant pour HC et HP)
    
    3️⃣ **Tarif Moyen Autres Opérateurs** : Moyenne des tarifs d'interconnexion selon HC/HP
    
    4️⃣ **Tarif Opérateur** : Tarif d'interconnexion de l'opérateur selon HC/HP
    
    5️⃣ **Différence Tarifaire** : TaMoyen - TaOpérateur (varie selon HC/HP)
    
    6️⃣ **Résultat Final** : Si DifferenceRevenus > DifferenceTarifaire → EFFET DE CLUB`
  })
  @ApiQuery({ 
    name: 'operateurId', 
    type: Number, 
    description: 'ID de l\'opérateur',
    example: 1
  })
  @ApiQuery({ 
    name: 'offreId', 
    type: Number, 
    description: 'ID de l\'offre',
    example: 5
  })
  @ApiQuery({ 
    name: 'typeHeure', 
    enum: ['CREUSE', 'PLEINE'], 
    description: 'Type d\'heure (CREUSE ou PLEINE)',
    example: 'CREUSE'
  })
  @ApiQuery({ 
    name: 'annee', 
    type: Number, 
    description: 'Année du tarif',
    example: 2025
  })
  @ApiResponse({
    status: 200,
    description: 'Calcul de l\'effet club basé sur le revenu moyen réussi',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Effet club (Revenu Moyen)',
        message: 'Calcul de l\'effet club basé sur le revenu moyen effectué avec succès',
        data: {
          typeHeure: 'CREUSE',
          revenuMoyenOffnet: 52.75,
          revenuMoyenOnnet: 28.40,
          differenceRevenusMoyens: 24.35,
          taMoyenAutresOperateurs: 35.80,
          tarifOperateur: 28.50,
          differenceTaMoyenTaOperateur: 7.30,
          isEffetClub: true
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides'
  })
  @ApiResponse({
    status: 404,
    description: 'Opérateur ou offre introuvable'
  })
  async calculerEffetClubRevenuMoyenAvecDetails(
    @Query('operateurId', ParseIntPipe) operateurId: number,
    @Query('offreId', ParseIntPipe) offreId: number,
    @Query('typeHeure') typeHeure: TypeHeure,
    @Query('annee', ParseIntPipe) annee: number,
  ) {
    const resultat = await this.effetClubService.calculerResultatEffetClubRevenuMoyen(
      operateurId,
      offreId,
      typeHeure,
      annee,
    );

    return this.effetClubService['formatResponse'](
      resultat,
      'Effet club (Revenu Moyen)',
      'Calcul de l\'effet club basé sur le revenu moyen effectué avec succès',
    );
  }

}
