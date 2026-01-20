import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOffreDto } from './dto/create-offre.dto';
import { UpdateOffreDto } from './dto/update-offre.dto';
import { OffreQueryDto } from './dto/offre-query.dto';
import { EffetClubQueryDto } from './dto/effet-club-query.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OffreService {
  constructor(private readonly prisma: PrismaService) {}

  // Fonction utilitaire pour formater les réponses
  private formatResponse(data: any, title: string, message: string) {
    return {
      success: true,
      statusCode: 201,
      code: 'success',
      title,
      message,
      data,
    };
  }

  /**
   * MÉTHODE PRINCIPALE DE CALCUL DE L'EFFET CLUB
   * =============================================
   * 
   * Cette méthode implémente l'algorithme complet de calcul de l'effet club
   * selon la formule : effetClub = (prixOffNet - prixOnNet) - (taMoyen - taOperateur)
   * 
   * @param operateurId - ID de l'opérateur propriétaire de l'offre
   * @param annee - Année de référence pour les tarifs d'interconnexion
   * @param offreId - ID de l'offre (optionnel, nécessaire pour le calcul complet)
   * 
   * ÉTAPES DE CALCUL :
   * 1. Calcul du taOperateur (tarif d'accès de l'opérateur)
   * 2. Calcul du taMoyen (moyenne des tarifs d'accès du marché)
   * 3. Calcul des prix réseau OnNet/OffNet (si offreId fourni)
   * 4. Application de la formule principale de l'effet club
   * 
   * FORMULES UTILISÉES :
   * - taOperateur = (tarifOffNetHC + tarifOffNetHP + tarifOnNetHC + tarifOnNetHP) / 4
   * - taMoyen = Σ(taOperateur_autres) / nombre_autres_opérateurs
   * - prixOnNet = Σ(tarifMinuteOnNet_options) / nombre_options
   * - prixOffNet = Σ(tarifMinuteOffNet_options) / nombre_options
   * - effetClub = (prixOffNet - prixOnNet) - (taMoyen - taOperateur)
   */
  private async calculerEffetClub(operateurId: number, annee: number, offreId?: number) {
    // ========================================
    // ÉTAPE 1: RÉCUPÉRATION DES TARIFS OPÉRATEUR
    // ========================================
    // Récupérer les tarifs de l'opérateur pour l'année donnée, ordonnés par type (Interconnexion en premier)
    const tarifsOperateur = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId,
        annee,
      },
      orderBy: {
        typeTarif: 'desc', // Interconnexion avant Base (ordre alphabétique inverse)
      },
    });

    if (!tarifsOperateur || tarifsOperateur.length === 0) {
      return null;
    }

    // ========================================
    // ÉTAPE 2: SÉLECTION DU TARIF PRIORITAIRE
    // ========================================
    // Logique de priorité : Interconnexion > Base
    let tarifSelectionne = tarifsOperateur.find(tarif => tarif.typeTarif === 'Interconnexion');
    if (!tarifSelectionne) {
      tarifSelectionne = tarifsOperateur.find(tarif => tarif.typeTarif === 'Base');
    }

    if (!tarifSelectionne) {
      return null;
    }

    // ========================================
    // ÉTAPE 3: CALCUL DES 8 CHAMPS TARIFS INDIVIDUELS
    // ========================================
    const tarifOffNetHeureCreuse = Number(tarifSelectionne.tarifOffNetHeureCreuse || 0);
    const tarifOffNetHeurePleine = Number(tarifSelectionne.tarifOffNetHeurePleine || 0);
    const tarifOnNetHeureCreuse = Number(tarifSelectionne.tarifOnNetHeureCreuse || 0);
    const tarifOnNetHeurePleine = Number(tarifSelectionne.tarifOnNetHeurePleine || 0);

    // Initialiser tous les 8 champs
    let taBaseOperateurOffnetHC = 0;
    let taBaseOperateurOffnetHP = 0;
    let taBaseOperateurOnnetHC = 0;
    let taBaseOperateurOnnetHP = 0;
    let taInterOperateurOffnetHC = 0;
    let taInterOperateurOffnetHP = 0;
    let taInterOperateurOnnetHC = 0;
    let taInterOperateurOnnetHP = 0;

    // Récupérer les deux types de tarifs : Base et Interconnexion
    const tarifBase = tarifsOperateur.find(tarif => tarif.typeTarif === 'Base');
    const tarifInter = tarifsOperateur.find(tarif => tarif.typeTarif === 'Interconnexion');

    // Remplir les champs Base
    if (tarifBase) {
      taBaseOperateurOffnetHC = Number(tarifBase.tarifOffNetHeureCreuse || 0);
      taBaseOperateurOffnetHP = Number(tarifBase.tarifOffNetHeurePleine || 0);
      taBaseOperateurOnnetHC = Number(tarifBase.tarifOnNetHeureCreuse || 0);
      taBaseOperateurOnnetHP = Number(tarifBase.tarifOnNetHeurePleine || 0);
    }

    // Remplir les champs Interconnexion
    if (tarifInter) {
      taInterOperateurOffnetHC = Number(tarifInter.tarifOffNetHeureCreuse || 0);
      taInterOperateurOffnetHP = Number(tarifInter.tarifOffNetHeurePleine || 0);
      taInterOperateurOnnetHC = Number(tarifInter.tarifOnNetHeureCreuse || 0);
      taInterOperateurOnnetHP = Number(tarifInter.tarifOnNetHeurePleine || 0);
    }

    // ========================================
    // ÉTAPE 4: CALCUL DU taMoyen (TA MARCHÉ)
    // ========================================
    // Récupérer les TA de tous les autres opérateurs pour la même année
    const autresOperateurs = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId: { not: operateurId },
        annee,
      },
    });

    // Collecter les tarifs de tous les autres opérateurs séparément
    const tarifsBaseOffnetHC: number[] = [];
    const tarifsBaseOffnetHP: number[] = [];
    const tarifsBaseOnnetHC: number[] = [];
    const tarifsBaseOnnetHP: number[] = [];
    const tarifsInterOffnetHC: number[] = [];
    const tarifsInterOffnetHP: number[] = [];
    const tarifsInterOnnetHC: number[] = [];
    const tarifsInterOnnetHP: number[] = [];

    // Traiter chaque opérateur (éviter les doublons)
    const operateursTraites = new Set<number>();
    
    for (const autreOp of autresOperateurs) {
      if (operateursTraites.has(autreOp.operateurId)) {
        continue;
      }
      operateursTraites.add(autreOp.operateurId);

      // Récupérer tous les tarifs de cet opérateur pour l'année
      const tarifsAutreOperateur = await this.prisma.tarifInterconnexion.findMany({
        where: {
          operateurId: autreOp.operateurId,
          annee,
        },
      });

      // Trouver les tarifs Base et Inter
      const tarifBase = tarifsAutreOperateur.find(t => t.typeTarif === 'Base');
      const tarifInter = tarifsAutreOperateur.find(t => t.typeTarif === 'Interconnexion');

      // Collecter tous les tarifs Base (4 champs)
      if (tarifBase) {
        tarifsBaseOffnetHC.push(Number(tarifBase.tarifOffNetHeureCreuse || 0));
        tarifsBaseOffnetHP.push(Number(tarifBase.tarifOffNetHeurePleine || 0));
        tarifsBaseOnnetHC.push(Number(tarifBase.tarifOnNetHeureCreuse || 0));
        tarifsBaseOnnetHP.push(Number(tarifBase.tarifOnNetHeurePleine || 0));
      }

      // Collecter tous les tarifs Inter (4 champs)
      if (tarifInter) {
        tarifsInterOffnetHC.push(Number(tarifInter.tarifOffNetHeureCreuse || 0));
        tarifsInterOffnetHP.push(Number(tarifInter.tarifOffNetHeurePleine || 0));
        tarifsInterOnnetHC.push(Number(tarifInter.tarifOnNetHeureCreuse || 0));
        tarifsInterOnnetHP.push(Number(tarifInter.tarifOnNetHeurePleine || 0));
      }
    }

    // Calculer les sommes pour chaque type de tarif
    const sommeBaseOffnetHC = tarifsBaseOffnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeBaseOffnetHP = tarifsBaseOffnetHP.reduce((sum, tarif) => sum + tarif, 0);
    const sommeBaseOnnetHC = tarifsBaseOnnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeBaseOnnetHP = tarifsBaseOnnetHP.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOffnetHC = tarifsInterOffnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOffnetHP = tarifsInterOffnetHP.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOnnetHC = tarifsInterOnnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOnnetHP = tarifsInterOnnetHP.reduce((sum, tarif) => sum + tarif, 0);

    // Calculer les moyennes en divisant les sommes par le nombre d'opérateurs
    const nombreOperateurs = operateursTraites.size;
    const taMoyenBaseOffnetHC = nombreOperateurs > 0 ? sommeBaseOffnetHC / nombreOperateurs : 0;
    const taMoyenBaseOffnetHP = nombreOperateurs > 0 ? sommeBaseOffnetHP / nombreOperateurs : 0;
    const taMoyenBaseOnnetHC = nombreOperateurs > 0 ? sommeBaseOnnetHC / nombreOperateurs : 0;
    const taMoyenBaseOnnetHP = nombreOperateurs > 0 ? sommeBaseOnnetHP / nombreOperateurs : 0;
    const taMoyenInterOffnetHC = nombreOperateurs > 0 ? sommeInterOffnetHC / nombreOperateurs : 0;
    const taMoyenInterOffnetHP = nombreOperateurs > 0 ? sommeInterOffnetHP / nombreOperateurs : 0;
    const taMoyenInterOnnetHC = nombreOperateurs > 0 ? sommeInterOnnetHC / nombreOperateurs : 0;
    const taMoyenInterOnnetHP = nombreOperateurs > 0 ? sommeInterOnnetHP / nombreOperateurs : 0;

    // ========================================
    // ÉTAPE 5: CALCUL DES PRIX RÉSEAU ET 8 EFFETS CLUB
    // ========================================
    let effetClub: number | null = null;
    let prixOnNet: number | null = null;
    let prixOffNet: number | null = null;

    // Initialiser les 8 effets club
    let effetClubBaseOffnetHC: number | null = null;
    let effetClubBaseOffnetHP: number | null = null;
    let effetClubBaseOnnetHC: number | null = null;
    let effetClubBaseOnnetHP: number | null = null;
    let effetClubInterOffnetHC: number | null = null;
    let effetClubInterOffnetHP: number | null = null;
    let effetClubInterOnnetHC: number | null = null;
    let effetClubInterOnnetHP: number | null = null;

    // Initialiser les 8 résultats et booléens
    let resultatBaseOffnetHC: string | null = null;
    let resultatBaseOffnetHP: string | null = null;
    let resultatBaseOnnetHC: string | null = null;
    let resultatBaseOnnetHP: string | null = null;
    let resultatInterOffnetHC: string | null = null;
    let resultatInterOffnetHP: string | null = null;
    let resultatInterOnnetHC: string | null = null;
    let resultatInterOnnetHP: string | null = null;

    let isEffetClubBaseOffnetHC = false;
    let isEffetClubBaseOffnetHP = false;
    let isEffetClubBaseOnnetHC = false;
    let isEffetClubBaseOnnetHP = false;
    let isEffetClubInterOffnetHC = false;
    let isEffetClubInterOffnetHP = false;
    let isEffetClubInterOnnetHC = false;
    let isEffetClubInterOnnetHP = false;

    if (offreId) {
      // Calculer les prix OnNet et OffNet basés sur les options de l'offre
      const prixReseaux = await this.calculerPrixReseaux(offreId);
      
      if (prixReseaux.prixOnNet !== null && prixReseaux.prixOffNet !== null) {
        prixOnNet = Number(prixReseaux.prixOnNet);
        prixOffNet = Number(prixReseaux.prixOffNet);
        
        const differentielPrix = prixOffNet - prixOnNet;

        // ========================================
        // CALCUL DES 8 EFFETS CLUB SPÉCIFIQUES
        // ========================================
        
        // 1. Effet club Base OffNet HC
        effetClubBaseOffnetHC = differentielPrix - (taBaseOperateurOffnetHC - taMoyenBaseOffnetHC);
        resultatBaseOffnetHC = effetClubBaseOffnetHC > 0 ? 'Effet Club Positif' : 
                               effetClubBaseOffnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubBaseOffnetHC = effetClubBaseOffnetHC > 0;

        // 2. Effet club Base OffNet HP
        effetClubBaseOffnetHP = differentielPrix - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP);
        resultatBaseOffnetHP = effetClubBaseOffnetHP > 0 ? 'Effet Club Positif' : 
                               effetClubBaseOffnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubBaseOffnetHP = effetClubBaseOffnetHP > 0;

        // 3. Effet club Base OnNet HC
        effetClubBaseOnnetHC = differentielPrix - (taBaseOperateurOnnetHC - taMoyenBaseOnnetHC);
        resultatBaseOnnetHC = effetClubBaseOnnetHC > 0 ? 'Effet Club Positif' : 
                              effetClubBaseOnnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubBaseOnnetHC = effetClubBaseOnnetHC > 0;

        // 4. Effet club Base OnNet HP
        effetClubBaseOnnetHP = differentielPrix - (taBaseOperateurOnnetHP - taMoyenBaseOnnetHP);
        resultatBaseOnnetHP = effetClubBaseOnnetHP > 0 ? 'Effet Club Positif' : 
                              effetClubBaseOnnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubBaseOnnetHP = effetClubBaseOnnetHP > 0;

        // 5. Effet club Inter OffNet HC
        effetClubInterOffnetHC = differentielPrix - (taInterOperateurOffnetHC - taMoyenInterOffnetHC);
        resultatInterOffnetHC = effetClubInterOffnetHC > 0 ? 'Effet Club Positif' : 
                                effetClubInterOffnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubInterOffnetHC = effetClubInterOffnetHC > 0;

        // 6. Effet club Inter OffNet HP
        effetClubInterOffnetHP = differentielPrix - (taInterOperateurOffnetHP - taMoyenInterOffnetHP);
        resultatInterOffnetHP = effetClubInterOffnetHP > 0 ? 'Effet Club Positif' : 
                                effetClubInterOffnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubInterOffnetHP = effetClubInterOffnetHP > 0;

        // 7. Effet club Inter OnNet HC
        effetClubInterOnnetHC = differentielPrix - (taInterOperateurOnnetHC - taMoyenInterOnnetHC);
        resultatInterOnnetHC = effetClubInterOnnetHC > 0 ? 'Effet Club Positif' : 
                               effetClubInterOnnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubInterOnnetHC = effetClubInterOnnetHC > 0;

        // 8. Effet club Inter OnNet HP
        effetClubInterOnnetHP = differentielPrix - (taInterOperateurOnnetHP - taMoyenInterOnnetHP);
        resultatInterOnnetHP = effetClubInterOnnetHP > 0 ? 'Effet Club Positif' : 
                               effetClubInterOnnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
        isEffetClubInterOnnetHP = effetClubInterOnnetHP > 0;

        // ========================================
        // FORMULE PRINCIPALE DE L'EFFET CLUB (moyenne générale)
        // ========================================
        const taMoyenGeneral = (taMoyenBaseOffnetHC + taMoyenBaseOffnetHP + taMoyenBaseOnnetHC + taMoyenBaseOnnetHP +
          taMoyenInterOffnetHC + taMoyenInterOffnetHP + taMoyenInterOnnetHC + taMoyenInterOnnetHP) / 8;
        const taOperateurGeneral = (taBaseOperateurOffnetHC + taBaseOperateurOffnetHP + taBaseOperateurOnnetHC + taBaseOperateurOnnetHP +
          taInterOperateurOffnetHC + taInterOperateurOffnetHP + taInterOperateurOnnetHC + taInterOperateurOnnetHP) / 8;
        
        effetClub = differentielPrix - (taMoyenGeneral - taOperateurGeneral);
      }
    }

    return {
      taBaseOperateurOffnetHC: new Decimal(taBaseOperateurOffnetHC),
      taBaseOperateurOffnetHP: new Decimal(taBaseOperateurOffnetHP),
      taBaseOperateurOnnetHC: new Decimal(taBaseOperateurOnnetHC),
      taBaseOperateurOnnetHP: new Decimal(taBaseOperateurOnnetHP),
      taInterOperateurOffnetHC: new Decimal(taInterOperateurOffnetHC),
      taInterOperateurOffnetHP: new Decimal(taInterOperateurOffnetHP),
      taInterOperateurOnnetHC: new Decimal(taInterOperateurOnnetHC),
      taInterOperateurOnnetHP: new Decimal(taInterOperateurOnnetHP),
      // Sommes des tarifs de tous les autres opérateurs par type
      sommeBaseAutresOperateursOffnetHC: new Decimal(sommeBaseOffnetHC),
      sommeBaseAutresOperateursOffnetHP: new Decimal(sommeBaseOffnetHP),
      sommeBaseAutresOperateursOnnetHC: new Decimal(sommeBaseOnnetHC),
      sommeBaseAutresOperateursOnnetHP: new Decimal(sommeBaseOnnetHP),
      sommeInterAutresOperateursOffnetHC: new Decimal(sommeInterOffnetHC),
      sommeInterAutresOperateursOffnetHP: new Decimal(sommeInterOffnetHP),
      sommeInterAutresOperateursOnnetHC: new Decimal(sommeInterOnnetHC),
      sommeInterAutresOperateursOnnetHP: new Decimal(sommeInterOnnetHP),
      nombreAutresOperateurs: nombreOperateurs, // Nombre total d'autres opérateurs (excluant l'opérateur de l'offre)
      taMoyenBaseOffnetHC: new Decimal(taMoyenBaseOffnetHC),
      taMoyenBaseOffnetHP: new Decimal(taMoyenBaseOffnetHP),
      taMoyenBaseOnnetHC: new Decimal(taMoyenBaseOnnetHC),
      taMoyenBaseOnnetHP: new Decimal(taMoyenBaseOnnetHP),
      taMoyenInterOffnetHC: new Decimal(taMoyenInterOffnetHC),
      taMoyenInterOffnetHP: new Decimal(taMoyenInterOffnetHP),
      taMoyenInterOnnetHC: new Decimal(taMoyenInterOnnetHC),
      taMoyenInterOnnetHP: new Decimal(taMoyenInterOnnetHP),
      effetClub: effetClub !== null ? new Decimal(effetClub) : null,
      prixOnNet: prixOnNet !== null ? new Decimal(prixOnNet) : null,
      prixOffNet: prixOffNet !== null ? new Decimal(prixOffNet) : null,
      
      // Les 8 effets club spécifiques
      effetClubBaseOffnetHC: effetClubBaseOffnetHC !== null ? new Decimal(effetClubBaseOffnetHC) : null,
      effetClubBaseOffnetHP: effetClubBaseOffnetHP !== null ? new Decimal(effetClubBaseOffnetHP) : null,
      effetClubBaseOnnetHC: effetClubBaseOnnetHC !== null ? new Decimal(effetClubBaseOnnetHC) : null,
      effetClubBaseOnnetHP: effetClubBaseOnnetHP !== null ? new Decimal(effetClubBaseOnnetHP) : null,
      effetClubInterOffnetHC: effetClubInterOffnetHC !== null ? new Decimal(effetClubInterOffnetHC) : null,
      effetClubInterOffnetHP: effetClubInterOffnetHP !== null ? new Decimal(effetClubInterOffnetHP) : null,
      effetClubInterOnnetHC: effetClubInterOnnetHC !== null ? new Decimal(effetClubInterOnnetHC) : null,
      effetClubInterOnnetHP: effetClubInterOnnetHP !== null ? new Decimal(effetClubInterOnnetHP) : null,
      
      // Les 8 résultats spécifiques
      resultatBaseOffnetHC,
      resultatBaseOffnetHP,
      resultatBaseOnnetHC,
      resultatBaseOnnetHP,
      resultatInterOffnetHC,
      resultatInterOffnetHP,
      resultatInterOnnetHC,
      resultatInterOnnetHP,
      
      // Les 8 booléens spécifiques
      isEffetClubBaseOffnetHC,
      isEffetClubBaseOffnetHP,
      isEffetClubBaseOnnetHC,
      isEffetClubBaseOnnetHP,
      isEffetClubInterOffnetHC,
      isEffetClubInterOffnetHP,
      isEffetClubInterOnnetHC,
      isEffetClubInterOnnetHP,
    };
  }

  // Méthode privée pour calculer les prix OnNet et OffNet basés sur les options de l'offre
  private async calculerPrixReseaux(offreId: number) {
    // Récupérer toutes les options de l'offre
    const options = await this.prisma.option.findMany({
      where: { offreId },
      select: {
        tarifMinuteOnNet: true,
        tarifMinuteOffNet: true,
      },
    });

    if (!options || options.length === 0) {
      return {
        prixOnNet: null,
        prixOffNet: null,
        nombreOptions: 0,
      };
    }

    // Calculer la moyenne des tarifs OnNet
    const totalOnNet = options.reduce((sum, option) => {
      return sum + Number(option.tarifMinuteOnNet || 0);
    }, 0);
    const prixOnNet = totalOnNet / options.length;

    // Calculer la moyenne des tarifs OffNet
    const totalOffNet = options.reduce((sum, option) => {
      return sum + Number(option.tarifMinuteOffNet || 0);
    }, 0);
    const prixOffNet = totalOffNet / options.length;

    return {
      prixOnNet: new Decimal(prixOnNet),
      prixOffNet: new Decimal(prixOffNet),
      nombreOptions: options.length,
    };
  }

  /**
   * MÉTHODE DE CALCUL DE L'EFFET CLUB SELON LES REVENUS MOYENS
   * ==========================================================
   * 
   * Cette méthode calcule l'effet club en utilisant les revenus moyens OnNet/OffNet
   * au lieu des prix OnNet/OffNet traditionnels.
   * 
   * @param operateurId - ID de l'opérateur propriétaire de l'offre
   * @param annee - Année de référence pour les tarifs d'interconnexion
   * @param offreId - ID de l'offre (requis pour le calcul des revenus)
   * 
   * FORMULE UTILISÉE :
   * effetClub = (revenuMoyenOffNet - revenuMoyenOnNet) - (taMoyen - taOperateur)
   */
  private async calculerEffetClubSelonRevenus(operateurId: number, annee: number, offreId: number) {
    // ========================================
    // ÉTAPE 1: RÉCUPÉRATION DES TARIFS OPÉRATEUR
    // ========================================
    // Récupérer les tarifs de l'opérateur pour l'année donnée, ordonnés par type (Interconnexion en premier)
    const tarifsOperateur = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId,
        annee,
      },
      orderBy: {
        typeTarif: 'desc', // Interconnexion avant Base (ordre alphabétique inverse)
      },
    });

    if (!tarifsOperateur || tarifsOperateur.length === 0) {
      return null;
    }

    // ========================================
    // ÉTAPE 2: SÉLECTION DU TARIF PRIORITAIRE
    // ========================================
    // Logique de priorité : Interconnexion > Base
    let tarifSelectionne = tarifsOperateur.find(tarif => tarif.typeTarif === 'Interconnexion');
    if (!tarifSelectionne) {
      tarifSelectionne = tarifsOperateur.find(tarif => tarif.typeTarif === 'Base');
    }

    if (!tarifSelectionne) {
      return null;
    }

    // ========================================
    // ÉTAPE 3: CALCUL DES 8 CHAMPS TARIFS INDIVIDUELS
    // ========================================
    const tarifOffNetHeureCreuse = Number(tarifSelectionne.tarifOffNetHeureCreuse || 0);
    const tarifOffNetHeurePleine = Number(tarifSelectionne.tarifOffNetHeurePleine || 0);
    const tarifOnNetHeureCreuse = Number(tarifSelectionne.tarifOnNetHeureCreuse || 0);
    const tarifOnNetHeurePleine = Number(tarifSelectionne.tarifOnNetHeurePleine || 0);

    // Initialiser tous les 8 champs
    let taBaseOperateurOffnetHC = 0;
    let taBaseOperateurOffnetHP = 0;
    let taBaseOperateurOnnetHC = 0;
    let taBaseOperateurOnnetHP = 0;
    let taInterOperateurOffnetHC = 0;
    let taInterOperateurOffnetHP = 0;
    let taInterOperateurOnnetHC = 0;
    let taInterOperateurOnnetHP = 0;

    // Récupérer les deux types de tarifs : Base et Interconnexion
    const tarifBase = tarifsOperateur.find(tarif => tarif.typeTarif === 'Base');
    const tarifInter = tarifsOperateur.find(tarif => tarif.typeTarif === 'Interconnexion');

    // Remplir les champs Base
    if (tarifBase) {
      taBaseOperateurOffnetHC = Number(tarifBase.tarifOffNetHeureCreuse || 0);
      taBaseOperateurOffnetHP = Number(tarifBase.tarifOffNetHeurePleine || 0);
      taBaseOperateurOnnetHC = Number(tarifBase.tarifOnNetHeureCreuse || 0);
      taBaseOperateurOnnetHP = Number(tarifBase.tarifOnNetHeurePleine || 0);
    }

    // Remplir les champs Interconnexion
    if (tarifInter) {
      taInterOperateurOffnetHC = Number(tarifInter.tarifOffNetHeureCreuse || 0);
      taInterOperateurOffnetHP = Number(tarifInter.tarifOffNetHeurePleine || 0);
      taInterOperateurOnnetHC = Number(tarifInter.tarifOnNetHeureCreuse || 0);
      taInterOperateurOnnetHP = Number(tarifInter.tarifOnNetHeurePleine || 0);
    }

    // ========================================
    // ÉTAPE 4: CALCUL DU taMoyen (TA MARCHÉ)
    // ========================================
    // Récupérer les TA de tous les autres opérateurs pour la même année
    const autresOperateurs = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId: { not: operateurId },
        annee,
      },
    });

    // Collecter les tarifs de tous les autres opérateurs séparément
    const tarifsBaseOffnetHC: number[] = [];
    const tarifsBaseOffnetHP: number[] = [];
    const tarifsBaseOnnetHC: number[] = [];
    const tarifsBaseOnnetHP: number[] = [];
    const tarifsInterOffnetHC: number[] = [];
    const tarifsInterOffnetHP: number[] = [];
    const tarifsInterOnnetHC: number[] = [];
    const tarifsInterOnnetHP: number[] = [];

    // Traiter chaque opérateur (éviter les doublons)
    const operateursTraites = new Set<number>();
    
    for (const autreOp of autresOperateurs) {
      if (operateursTraites.has(autreOp.operateurId)) {
        continue;
      }
      operateursTraites.add(autreOp.operateurId);

      // Récupérer tous les tarifs de cet opérateur pour l'année
      const tarifsAutreOperateur = await this.prisma.tarifInterconnexion.findMany({
        where: {
          operateurId: autreOp.operateurId,
          annee,
        },
      });

      // Trouver les tarifs Base et Inter
      const tarifBase = tarifsAutreOperateur.find(t => t.typeTarif === 'Base');
      const tarifInter = tarifsAutreOperateur.find(t => t.typeTarif === 'Interconnexion');

      // Collecter tous les tarifs Base (4 champs)
      if (tarifBase) {
        tarifsBaseOffnetHC.push(Number(tarifBase.tarifOffNetHeureCreuse || 0));
        tarifsBaseOffnetHP.push(Number(tarifBase.tarifOffNetHeurePleine || 0));
        tarifsBaseOnnetHC.push(Number(tarifBase.tarifOnNetHeureCreuse || 0));
        tarifsBaseOnnetHP.push(Number(tarifBase.tarifOnNetHeurePleine || 0));
      }

      // Collecter tous les tarifs Inter (4 champs)
      if (tarifInter) {
        tarifsInterOffnetHC.push(Number(tarifInter.tarifOffNetHeureCreuse || 0));
        tarifsInterOffnetHP.push(Number(tarifInter.tarifOffNetHeurePleine || 0));
        tarifsInterOnnetHC.push(Number(tarifInter.tarifOnNetHeureCreuse || 0));
        tarifsInterOnnetHP.push(Number(tarifInter.tarifOnNetHeurePleine || 0));
      }
    }

    // Calculer les sommes pour chaque type de tarif
    const sommeBaseOffnetHC = tarifsBaseOffnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeBaseOffnetHP = tarifsBaseOffnetHP.reduce((sum, tarif) => sum + tarif, 0);
    const sommeBaseOnnetHC = tarifsBaseOnnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeBaseOnnetHP = tarifsBaseOnnetHP.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOffnetHC = tarifsInterOffnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOffnetHP = tarifsInterOffnetHP.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOnnetHC = tarifsInterOnnetHC.reduce((sum, tarif) => sum + tarif, 0);
    const sommeInterOnnetHP = tarifsInterOnnetHP.reduce((sum, tarif) => sum + tarif, 0);

    // Calculer les moyennes en divisant les sommes par le nombre d'opérateurs
    const nombreOperateurs = operateursTraites.size;
    const taMoyenBaseOffnetHC = nombreOperateurs > 0 ? sommeBaseOffnetHC / nombreOperateurs : 0;
    const taMoyenBaseOffnetHP = nombreOperateurs > 0 ? sommeBaseOffnetHP / nombreOperateurs : 0;
    const taMoyenBaseOnnetHC = nombreOperateurs > 0 ? sommeBaseOnnetHC / nombreOperateurs : 0;
    const taMoyenBaseOnnetHP = nombreOperateurs > 0 ? sommeBaseOnnetHP / nombreOperateurs : 0;
    const taMoyenInterOffnetHC = nombreOperateurs > 0 ? sommeInterOffnetHC / nombreOperateurs : 0;
    const taMoyenInterOffnetHP = nombreOperateurs > 0 ? sommeInterOffnetHP / nombreOperateurs : 0;
    const taMoyenInterOnnetHC = nombreOperateurs > 0 ? sommeInterOnnetHC / nombreOperateurs : 0;
    const taMoyenInterOnnetHP = nombreOperateurs > 0 ? sommeInterOnnetHP / nombreOperateurs : 0;

    // ========================================
    // ÉTAPE 5: CALCUL DES REVENUS MOYENS ET 8 EFFETS CLUB
    // ========================================
    let effetClub: number | null = null;
    let revenuMoyenOnNet: number | null = null;
    let revenuMoyenOffNet: number | null = null;

    // Initialiser les 8 effets club
    let effetClubBaseOffnetHC: number | null = null;
    let effetClubBaseOffnetHP: number | null = null;
    let effetClubBaseOnnetHC: number | null = null;
    let effetClubBaseOnnetHP: number | null = null;
    let effetClubInterOffnetHC: number | null = null;
    let effetClubInterOffnetHP: number | null = null;
    let effetClubInterOnnetHC: number | null = null;
    let effetClubInterOnnetHP: number | null = null;

    // Initialiser les 8 résultats et booléens
    let resultatBaseOffnetHC: string | null = null;
    let resultatBaseOffnetHP: string | null = null;
    let resultatBaseOnnetHC: string | null = null;
    let resultatBaseOnnetHP: string | null = null;
    let resultatInterOffnetHC: string | null = null;
    let resultatInterOffnetHP: string | null = null;
    let resultatInterOnnetHC: string | null = null;
    let resultatInterOnnetHP: string | null = null;

    let isEffetClubBaseOffnetHC = false;
    let isEffetClubBaseOffnetHP = false;
    let isEffetClubBaseOnnetHC = false;
    let isEffetClubBaseOnnetHP = false;
    let isEffetClubInterOffnetHC = false;
    let isEffetClubInterOffnetHP = false;
    let isEffetClubInterOnnetHC = false;
    let isEffetClubInterOnnetHP = false;

    // **DIFFÉRENCE PRINCIPALE** : Calculer les revenus moyens au lieu des prix
    const revenus = await this.calculerRevenusMoyens(offreId);
    revenuMoyenOnNet = revenus.revenuMoyenOnNet;
    revenuMoyenOffNet = revenus.revenuMoyenOffNet;
    
    const differentielRevenus = revenuMoyenOffNet - revenuMoyenOnNet;

    // ========================================
    // CALCUL DES 8 EFFETS CLUB SPÉCIFIQUES AVEC REVENUS
    // ========================================
    
    // 1. Effet club Base OffNet HC
    effetClubBaseOffnetHC = differentielRevenus - (taBaseOperateurOffnetHC - taMoyenBaseOffnetHC);
    resultatBaseOffnetHC = effetClubBaseOffnetHC > 0 ? 'Effet Club Positif' : 
                           effetClubBaseOffnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubBaseOffnetHC = effetClubBaseOffnetHC > 0;

    // 2. Effet club Base OffNet HP
    effetClubBaseOffnetHP = differentielRevenus - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP);
    resultatBaseOffnetHP = effetClubBaseOffnetHP > 0 ? 'Effet Club Positif' : 
                           effetClubBaseOffnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubBaseOffnetHP = effetClubBaseOffnetHP > 0;

    // 3. Effet club Base OnNet HC
    effetClubBaseOnnetHC = differentielRevenus - (taBaseOperateurOnnetHC - taMoyenBaseOnnetHC);
    resultatBaseOnnetHC = effetClubBaseOnnetHC > 0 ? 'Effet Club Positif' : 
                          effetClubBaseOnnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubBaseOnnetHC = effetClubBaseOnnetHC > 0;

    // 4. Effet club Base OnNet HP
    effetClubBaseOnnetHP = differentielRevenus - (taBaseOperateurOnnetHP - taMoyenBaseOnnetHP);
    resultatBaseOnnetHP = effetClubBaseOnnetHP > 0 ? 'Effet Club Positif' : 
                          effetClubBaseOnnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubBaseOnnetHP = effetClubBaseOnnetHP > 0;

    // 5. Effet club Inter OffNet HC
    effetClubInterOffnetHC = differentielRevenus - (taInterOperateurOffnetHC - taMoyenInterOffnetHC);
    resultatInterOffnetHC = effetClubInterOffnetHC > 0 ? 'Effet Club Positif' : 
                            effetClubInterOffnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubInterOffnetHC = effetClubInterOffnetHC > 0;

    // 6. Effet club Inter OffNet HP
    effetClubInterOffnetHP = differentielRevenus - (taInterOperateurOffnetHP - taMoyenInterOffnetHP);
    resultatInterOffnetHP = effetClubInterOffnetHP > 0 ? 'Effet Club Positif' : 
                            effetClubInterOffnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubInterOffnetHP = effetClubInterOffnetHP > 0;

    // 7. Effet club Inter OnNet HC
    effetClubInterOnnetHC = differentielRevenus - (taInterOperateurOnnetHC - taMoyenInterOnnetHC);
    resultatInterOnnetHC = effetClubInterOnnetHC > 0 ? 'Effet Club Positif' : 
                           effetClubInterOnnetHC < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubInterOnnetHC = effetClubInterOnnetHC > 0;

    // 8. Effet club Inter OnNet HP
    effetClubInterOnnetHP = differentielRevenus - (taInterOperateurOnnetHP - taMoyenInterOnnetHP);
    resultatInterOnnetHP = effetClubInterOnnetHP > 0 ? 'Effet Club Positif' : 
                           effetClubInterOnnetHP < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre';
    isEffetClubInterOnnetHP = effetClubInterOnnetHP > 0;

    // ========================================
    // FORMULE PRINCIPALE DE L'EFFET CLUB (moyenne générale avec revenus)
    // ========================================
    const taMoyenGeneral = (taMoyenBaseOffnetHC + taMoyenBaseOffnetHP + taMoyenBaseOnnetHC + taMoyenBaseOnnetHP +
      taMoyenInterOffnetHC + taMoyenInterOffnetHP + taMoyenInterOnnetHC + taMoyenInterOnnetHP) / 8;
    const taOperateurGeneral = (taBaseOperateurOffnetHC + taBaseOperateurOffnetHP + taBaseOperateurOnnetHC + taBaseOperateurOnnetHP +
      taInterOperateurOffnetHC + taInterOperateurOffnetHP + taInterOperateurOnnetHC + taInterOperateurOnnetHP) / 8;
    
    effetClub = differentielRevenus - (taMoyenGeneral - taOperateurGeneral);

    return {
      taBaseOperateurOffnetHC: new Decimal(taBaseOperateurOffnetHC),
      taBaseOperateurOffnetHP: new Decimal(taBaseOperateurOffnetHP),
      taBaseOperateurOnnetHC: new Decimal(taBaseOperateurOnnetHC),
      taBaseOperateurOnnetHP: new Decimal(taBaseOperateurOnnetHP),
      taInterOperateurOffnetHC: new Decimal(taInterOperateurOffnetHC),
      taInterOperateurOffnetHP: new Decimal(taInterOperateurOffnetHP),
      taInterOperateurOnnetHC: new Decimal(taInterOperateurOnnetHC),
      taInterOperateurOnnetHP: new Decimal(taInterOperateurOnnetHP),
      // Sommes des tarifs de tous les autres opérateurs par type
      sommeBaseAutresOperateursOffnetHC: new Decimal(sommeBaseOffnetHC),
      sommeBaseAutresOperateursOffnetHP: new Decimal(sommeBaseOffnetHP),
      sommeBaseAutresOperateursOnnetHC: new Decimal(sommeBaseOnnetHC),
      sommeBaseAutresOperateursOnnetHP: new Decimal(sommeBaseOnnetHP),
      sommeInterAutresOperateursOffnetHC: new Decimal(sommeInterOffnetHC),
      sommeInterAutresOperateursOffnetHP: new Decimal(sommeInterOffnetHP),
      sommeInterAutresOperateursOnnetHC: new Decimal(sommeInterOnnetHC),
      sommeInterAutresOperateursOnnetHP: new Decimal(sommeInterOnnetHP),
      nombreAutresOperateurs: nombreOperateurs,
      taMoyenBaseOffnetHC: new Decimal(taMoyenBaseOffnetHC),
      taMoyenBaseOffnetHP: new Decimal(taMoyenBaseOffnetHP),
      taMoyenBaseOnnetHC: new Decimal(taMoyenBaseOnnetHC),
      taMoyenBaseOnnetHP: new Decimal(taMoyenBaseOnnetHP),
      taMoyenInterOffnetHC: new Decimal(taMoyenInterOffnetHC),
      taMoyenInterOffnetHP: new Decimal(taMoyenInterOffnetHP),
      taMoyenInterOnnetHC: new Decimal(taMoyenInterOnnetHC),
      taMoyenInterOnnetHP: new Decimal(taMoyenInterOnnetHP),
      effetClub: effetClub !== null ? new Decimal(effetClub) : null,
      // **DIFFÉRENCE** : revenus au lieu de prix
      revenuMoyenOnNet: revenuMoyenOnNet !== null ? new Decimal(revenuMoyenOnNet) : null,
      revenuMoyenOffNet: revenuMoyenOffNet !== null ? new Decimal(revenuMoyenOffNet) : null,
      
      // Les 8 effets club spécifiques
      effetClubBaseOffnetHC: effetClubBaseOffnetHC !== null ? new Decimal(effetClubBaseOffnetHC) : null,
      effetClubBaseOffnetHP: effetClubBaseOffnetHP !== null ? new Decimal(effetClubBaseOffnetHP) : null,
      effetClubBaseOnnetHC: effetClubBaseOnnetHC !== null ? new Decimal(effetClubBaseOnnetHC) : null,
      effetClubBaseOnnetHP: effetClubBaseOnnetHP !== null ? new Decimal(effetClubBaseOnnetHP) : null,
      effetClubInterOffnetHC: effetClubInterOffnetHC !== null ? new Decimal(effetClubInterOffnetHC) : null,
      effetClubInterOffnetHP: effetClubInterOffnetHP !== null ? new Decimal(effetClubInterOffnetHP) : null,
      effetClubInterOnnetHC: effetClubInterOnnetHC !== null ? new Decimal(effetClubInterOnnetHC) : null,
      effetClubInterOnnetHP: effetClubInterOnnetHP !== null ? new Decimal(effetClubInterOnnetHP) : null,
      
      // Les 8 résultats spécifiques
      resultatBaseOffnetHC,
      resultatBaseOffnetHP,
      resultatBaseOnnetHC,
      resultatBaseOnnetHP,
      resultatInterOffnetHC,
      resultatInterOffnetHP,
      resultatInterOnnetHC,
      resultatInterOnnetHP,
      
      // Les 8 booléens spécifiques
      isEffetClubBaseOffnetHC,
      isEffetClubBaseOffnetHP,
      isEffetClubBaseOnnetHC,
      isEffetClubBaseOnnetHP,
      isEffetClubInterOffnetHC,
      isEffetClubInterOffnetHP,
      isEffetClubInterOnnetHC,
      isEffetClubInterOnnetHP,
    };
  }

  /**
   * MÉTHODE DE CALCUL DE LA SOMME DES FRAIS DE SOUSCRIPTION
   * =======================================================
   * 
   * Cette méthode calcule la somme des frais de souscription pour une offre
   * selon la formule : sommeFraisSouscription = (somme des nombreSouscriptions) × (somme des fraisSouscription)
   * 
   * @param offreId - ID de l'offre pour laquelle calculer la somme
   * @returns Promise<number> - La somme calculée des frais de souscription
   * 
   * FORMULE APPLIQUÉE :
   * - Somme des nombreSouscriptions = nombreSouscriptions1 + nombreSouscriptions2 + ... + nombreSouscriptionsN
   * - Somme des fraisSouscription = fraisSouscription1 + fraisSouscription2 + ... + fraisSouscriptionN  
   * - sommeFraisSouscription = (somme nombreSouscriptions) × (somme fraisSouscription)
   */
  private async calculerSommeFraisSouscription(offreId: number): Promise<number> {
    // Récupérer toutes les options de l'offre avec les champs nécessaires
    const options = await this.prisma.option.findMany({
      where: { offreId },
      select: {
        nombreSouscriptions: true,
        fraisSouscription: true,
      },
    });

    // Si aucune option, retourner 0
    if (!options || options.length === 0) {
      return 0;
    }

    // Appliquer la formule : Σ(fraisSouscription × nombreSouscriptions)
    const resultat = options.reduce((sum, option) => {
      const frais = Number(option.fraisSouscription || 0);
      const nombre = option.nombreSouscriptions || 0;
      return sum + (frais * nombre);
    }, 0);

    return resultat;
  }

  /**
   * MÉTHODE DE CALCUL DE LA SOMME DU TRAFIC GRATUIT
   * ===============================================
   * 
   * Cette méthode calcule la somme du trafic gratuit pour une offre
   * en additionnant les valeurs de tous les avantages gratuits de toutes ses options
   * 
   * @param offreId - ID de l'offre pour laquelle calculer la somme
   * @returns Promise<number> - La somme calculée du trafic gratuit
   * 
   * LOGIQUE APPLIQUÉE :
   * - Une offre a plusieurs options
   * - Chaque option peut avoir plusieurs avantages
   * - Parmi ces avantages, certains sont gratuits (isGratuit = true)
   * - sommeTraficGratuit = somme des valeurs de tous les avantages gratuits
   */
  private async calculerSommeTraficGratuit(offreId: number): Promise<number> {
    // Récupérer toutes les options de l'offre avec leurs avantages gratuits
    const options = await this.prisma.option.findMany({
      where: { offreId },
      include: {
        avantages: {
          include: {
            avantage: {
              select: {
                id: true,
                isGratuit: true,
              },
            },
          },
        },
      },
    });

    // Si aucune option, retourner 0
    if (!options || options.length === 0) {
      return 0;
    }

    let sommeTraficGratuit = 0;

    // Parcourir toutes les options
    for (const option of options) {
      // Parcourir tous les avantages de chaque option
      for (const optionAvantage of option.avantages) {
        const avantage = optionAvantage.avantage;
        
        // Si l'avantage est gratuit, utiliser la valeur de la liaison
        if (avantage.isGratuit) {
          sommeTraficGratuit += Number(optionAvantage.valeur || 0);
        }
      }
    }

    return sommeTraficGratuit;
  }

  /**
   * MÉTHODE DE CALCUL DE LA SOMME DU TRAFIC DES OPTIONS
   * ==================================================
   * 
   * Cette méthode calcule la somme du trafic de toutes les options d'une offre
   * en additionnant les valeurs du champ trafic de chaque option
   * 
   * @param offreId - ID de l'offre pour laquelle calculer la somme
   * @returns Promise<number> - La somme calculée du trafic des options
   * 
   * LOGIQUE APPLIQUÉE :
   * - Une offre a plusieurs options
   * - Chaque option a un champ trafic (avec valeur par défaut 0)
   * - sommeTraficOption = somme de tous les champs trafic des options de l'offre
   */
  private async calculerSommeTraficOption(offreId: number): Promise<number> {
    // Récupérer toutes les options de l'offre avec leur champ trafic
    const options = await this.prisma.option.findMany({
      where: { offreId },
      select: {
        id: true,
        trafic: true,
      },
    });

    // Si aucune option, retourner 0
    if (!options || options.length === 0) {
      return 0;
    }

    // Calculer la somme des champs trafic de toutes les options
    const sommeTraficOption = options.reduce((sum, option) => {
      return sum + Number(option.trafic || 0);
    }, 0);

    return sommeTraficOption;
  }

  /**
   * MÉTHODE DE CALCUL DES REVENUS MOYENS ONNET ET OFFNET
   * ====================================================
   * 
   * Cette méthode calcule les revenus moyens OnNet et OffNet pour une offre
   * en utilisant les formules complexes intégrant les tarifs et les sommes calculées
   * 
   * @param offreId - ID de l'offre pour laquelle calculer les revenus moyens
   * @returns Promise<{revenuMoyenOnNet: number, revenuMoyenOffNet: number}> - Les revenus moyens calculés
   * 
   * FORMULES APPLIQUÉES :
   * - revenuMoyenOnNet = ((tpOnNet*tfOnNet)*(1+tncOnNet)*(1+epOnNet)+sommeFraisSouscription)/(tpOnNet+sommeTraficGratuit+sommeTraficOption)
   * - revenuMoyenOffNet = ((tpOffNet*tfOffNet)*(1+tncOffNet)*(1+epOffNet)+sommeFraisSouscription)/(tpOffNet+sommeTraficGratuit+sommeTraficOption)
   */
  private async calculerRevenusMoyens(offreId: number): Promise<{revenuMoyenOnNet: number, revenuMoyenOffNet: number}> {
    // Récupérer les données de l'offre avec les champs tarifaires
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: {
        tpOnNet: true,
        tfOnNet: true,
        tncOnNet: true,
        epOnNet: true,
        tpOffNet: true,
        tfOffNet: true,
        tncOffNet: true,
        epOffNet: true,
      },
    });

    if (!offre) {
      return { revenuMoyenOnNet: 0, revenuMoyenOffNet: 0 };
    }

    // Calculer les 3 sommes nécessaires aux formules
    const sommeFraisSouscription = await this.calculerSommeFraisSouscription(offreId);
    const sommeTraficGratuit = await this.calculerSommeTraficGratuit(offreId);
    const sommeTraficOption = await this.calculerSommeTraficOption(offreId);

    // Convertir les valeurs Decimal en nombres
    const tpOnNet = Number(offre.tpOnNet || 0);
    const tfOnNet = Number(offre.tfOnNet || 0);
    const tncOnNet = Number(offre.tncOnNet || 0);
    const epOnNet = Number(offre.epOnNet || 0);
    const tpOffNet = Number(offre.tpOffNet || 0);
    const tfOffNet = Number(offre.tfOffNet || 0);
    const tncOffNet = Number(offre.tncOffNet || 0);
    const epOffNet = Number(offre.epOffNet || 0);

    // Calcul du revenu moyen OnNet
    // Formule: ((tpOnNet*tfOnNet)*(1+tncOnNet)*(1+epOnNet)+sommeFraisSouscription)/(tpOnNet+sommeTraficGratuit+sommeTraficOption)
    const numerateurOnNet = (tpOnNet * tfOnNet) * (1 + tncOnNet) * (1 + epOnNet) + sommeFraisSouscription;
    const denominateurOnNet = tpOnNet + sommeTraficGratuit + sommeTraficOption;
    const revenuMoyenOnNet = denominateurOnNet === 0 ? 0 : numerateurOnNet / denominateurOnNet;

    // Calcul du revenu moyen OffNet
    // Formule: ((tpOffNet*tfOffNet)*(1+tncOffNet)*(1+epOffNet)+sommeFraisSouscription)/(tpOffNet+sommeTraficGratuit+sommeTraficOption)
    const numerateurOffNet = (tpOffNet * tfOffNet) * (1 + tncOffNet) * (1 + epOffNet) + sommeFraisSouscription;
    const denominateurOffNet = tpOffNet + sommeTraficGratuit + sommeTraficOption;
    const revenuMoyenOffNet = denominateurOffNet === 0 ? 0 : numerateurOffNet / denominateurOffNet;

    return {
      revenuMoyenOnNet,
      revenuMoyenOffNet
    };
  }

  // Créer une offre
  async createOffre(createOffreDto: CreateOffreDto) {
    const { serviceIds, ...offreData } = createOffreDto;

    // Vérifier si l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id: createOffreDto.operateurId },
    });

    if (!operateur) {
      throw new NotFoundException(
        `Opérateur avec l'ID ${createOffreDto.operateurId} introuvable`,
      );
    }

    // Vérifier si tous les services existent
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException(
        'Un ou plusieurs services spécifiés sont introuvables',
      );
    }

    // Vérifier si une offre avec le même nom existe déjà pour cet opérateur
    const existingOffre = await this.prisma.offre.findFirst({
      where: {
        operateurId: createOffreDto.operateurId,
        nom: createOffreDto.nom,
      },
    });

    if (existingOffre) {
      throw new ConflictException(
        `Une offre avec le nom "${createOffreDto.nom}" existe déjà pour cet opérateur`,
      );
    }

    // Vérifier que la date de fin est après la date de début
    const dateDebut = new Date(createOffreDto.dateDebutValidite);
    const dateFin = new Date(createOffreDto.dateFinValidite);

    if (dateFin <= dateDebut) {
      throw new BadRequestException(
        'La date de fin de validité doit être postérieure à la date de début',
      );
    }

    // Ne plus calculer l'effet club à la création (calcul à la demande uniquement)
    
    try {
      const offre = await this.prisma.offre.create({
        data: {
          operateurId: offreData.operateurId,
          nom: offreData.nom,
          dateDebutValidite: new Date(offreData.dateDebutValidite),
          dateFinValidite: new Date(offreData.dateFinValidite),
          typeOffre: offreData.typeOffre,
          destination: offreData.destination,
          statut: offreData.statut,
          description: offreData.description,
          // 🔄 NOUVEAUX CHAMPS TARIFAIRES ONNET/OFFNET
          tp: offreData.tp ? new Decimal(offreData.tp) : null,
          tnc: offreData.tnc ? new Decimal(offreData.tnc) : null,
          ep: offreData.ep ? new Decimal(offreData.ep) : null,

          // 🔄 NOUVEAUX CHAMPS TARIFAIRES ONNET/OFFNET
          tpOnNet: offreData.tpOnNet ? new Decimal(offreData.tpOnNet) : null,
          tfOnNet: offreData.tfOnNet ? new Decimal(offreData.tfOnNet) : null,
          tncOnNet: offreData.tncOnNet ? new Decimal(offreData.tncOnNet) : null,
          epOnNet: offreData.epOnNet ? new Decimal(offreData.epOnNet) : null,
          tpOffNet: offreData.tpOffNet ? new Decimal(offreData.tpOffNet) : null,
          tfOffNet: offreData.tfOffNet ? new Decimal(offreData.tfOffNet) : null,
          tncOffNet: offreData.tncOffNet ? new Decimal(offreData.tncOffNet) : null,
          epOffNet: offreData.epOffNet ? new Decimal(offreData.epOffNet) : null,
          // Champs calculés de l'effet club (null par défaut, calculés à la demande)
          taBaseOperateurOffnetHC: null,
          taBaseOperateurOffnetHP: null,
          taBaseOperateurOnnetHC: null,
          taBaseOperateurOnnetHP: null,
          taInterOperateurOffnetHC: null,
          taInterOperateurOffnetHP: null,
          taInterOperateurOnnetHC: null,
          taInterOperateurOnnetHP: null,
          taMoyenBaseOffnetHC: null,
          taMoyenBaseOffnetHP: null,
          taMoyenBaseOnnetHC: null,
          taMoyenBaseOnnetHP: null,
          taMoyenInterOffnetHC: null,
          taMoyenInterOffnetHP: null,
          taMoyenInterOnnetHC: null,
          taMoyenInterOnnetHP: null,
          sommeBaseAutresOperateursOffnetHC: null,
          sommeBaseAutresOperateursOnnetHP: null,
          sommeInterAutresOperateursOffnetHC: null,
          sommeInterAutresOperateursOnnetHP: null,
          nombreAutresOperateurs: null,
          effetClub: null,
          resultat: null,
        },
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
            },
          },
        },
      });

      // Créer les relations offre-services
      await this.prisma.offreService.createMany({
        data: serviceIds.map(serviceId => ({
          offreId: offre.id,
          serviceId,
        })),
      });

      // Récupérer l'offre créée avec ses services
      const offreComplete = await this.prisma.offre.findUnique({
        where: { id: offre.id },
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
            },
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      if (!offreComplete) {
        throw new Error('Erreur lors de la récupération de l\'offre créée');
      }

      const offreFormatted = {
        ...offreComplete,
        taBaseOperateurOffnetHC: offreComplete.taBaseOperateurOffnetHC ? Number(offreComplete.taBaseOperateurOffnetHC) : null,
        taBaseOperateurOffnetHP: offreComplete.taBaseOperateurOffnetHP ? Number(offreComplete.taBaseOperateurOffnetHP) : null,
        taBaseOperateurOnnetHC: offreComplete.taBaseOperateurOnnetHC ? Number(offreComplete.taBaseOperateurOnnetHC) : null,
        taBaseOperateurOnnetHP: offreComplete.taBaseOperateurOnnetHP ? Number(offreComplete.taBaseOperateurOnnetHP) : null,
        taInterOperateurOffnetHC: offreComplete.taInterOperateurOffnetHC ? Number(offreComplete.taInterOperateurOffnetHC) : null,
        taInterOperateurOffnetHP: offreComplete.taInterOperateurOffnetHP ? Number(offreComplete.taInterOperateurOffnetHP) : null,
        taInterOperateurOnnetHC: offreComplete.taInterOperateurOnnetHC ? Number(offreComplete.taInterOperateurOnnetHC) : null,
        taInterOperateurOnnetHP: offreComplete.taInterOperateurOnnetHP ? Number(offreComplete.taInterOperateurOnnetHP) : null,
        taMoyenBaseOffnetHC: offreComplete.taMoyenBaseOffnetHC ? Number(offreComplete.taMoyenBaseOffnetHC) : null,
        taMoyenBaseOffnetHP: offreComplete.taMoyenBaseOffnetHP ? Number(offreComplete.taMoyenBaseOffnetHP) : null,
        taMoyenBaseOnnetHC: offreComplete.taMoyenBaseOnnetHC ? Number(offreComplete.taMoyenBaseOnnetHC) : null,
        taMoyenBaseOnnetHP: offreComplete.taMoyenBaseOnnetHP ? Number(offreComplete.taMoyenBaseOnnetHP) : null,
        taMoyenInterOffnetHC: offreComplete.taMoyenInterOffnetHC ? Number(offreComplete.taMoyenInterOffnetHC) : null,
        taMoyenInterOffnetHP: offreComplete.taMoyenInterOffnetHP ? Number(offreComplete.taMoyenInterOffnetHP) : null,
        taMoyenInterOnnetHC: offreComplete.taMoyenInterOnnetHC ? Number(offreComplete.taMoyenInterOnnetHC) : null,
        taMoyenInterOnnetHP: offreComplete.taMoyenInterOnnetHP ? Number(offreComplete.taMoyenInterOnnetHP) : null,
        // Sommes des tarifs des autres opérateurs
        sommeBaseAutresOperateursOffnetHC: offreComplete.sommeBaseAutresOperateursOffnetHC ? Number(offreComplete.sommeBaseAutresOperateursOffnetHC) : null,
        sommeBaseAutresOperateursOffnetHP: offreComplete.sommeBaseAutresOperateursOffnetHP ? Number(offreComplete.sommeBaseAutresOperateursOffnetHP) : null,
        sommeBaseAutresOperateursOnnetHC: offreComplete.sommeBaseAutresOperateursOnnetHC ? Number(offreComplete.sommeBaseAutresOperateursOnnetHC) : null,
        sommeBaseAutresOperateursOnnetHP: offreComplete.sommeBaseAutresOperateursOnnetHP ? Number(offreComplete.sommeBaseAutresOperateursOnnetHP) : null,
        sommeInterAutresOperateursOffnetHC: offreComplete.sommeInterAutresOperateursOffnetHC ? Number(offreComplete.sommeInterAutresOperateursOffnetHC) : null,
        sommeInterAutresOperateursOffnetHP: offreComplete.sommeInterAutresOperateursOffnetHP ? Number(offreComplete.sommeInterAutresOperateursOffnetHP) : null,
        sommeInterAutresOperateursOnnetHC: offreComplete.sommeInterAutresOperateursOnnetHC ? Number(offreComplete.sommeInterAutresOperateursOnnetHC) : null,
        sommeInterAutresOperateursOnnetHP: offreComplete.sommeInterAutresOperateursOnnetHP ? Number(offreComplete.sommeInterAutresOperateursOnnetHP) : null,
        // Effets club
        effetClubBaseOffnetHC: offreComplete.effetClubBaseOffnetHC ? Number(offreComplete.effetClubBaseOffnetHC) : null,
        effetClubBaseOffnetHP: offreComplete.effetClubBaseOffnetHP ? Number(offreComplete.effetClubBaseOffnetHP) : null,
        effetClubBaseOnnetHC: offreComplete.effetClubBaseOnnetHC ? Number(offreComplete.effetClubBaseOnnetHC) : null,
        effetClubBaseOnnetHP: offreComplete.effetClubBaseOnnetHP ? Number(offreComplete.effetClubBaseOnnetHP) : null,
        effetClubInterOffnetHC: offreComplete.effetClubInterOffnetHC ? Number(offreComplete.effetClubInterOffnetHC) : null,
        effetClubInterOffnetHP: offreComplete.effetClubInterOffnetHP ? Number(offreComplete.effetClubInterOffnetHP) : null,
        effetClubInterOnnetHC: offreComplete.effetClubInterOnnetHC ? Number(offreComplete.effetClubInterOnnetHC) : null,
        effetClubInterOnnetHP: offreComplete.effetClubInterOnnetHP ? Number(offreComplete.effetClubInterOnnetHP) : null,
        // Résultats
        resultatBaseOffnetHC: offreComplete.resultatBaseOffnetHC,
        resultatBaseOffnetHP: offreComplete.resultatBaseOffnetHP,
        resultatBaseOnnetHC: offreComplete.resultatBaseOnnetHC,
        resultatBaseOnnetHP: offreComplete.resultatBaseOnnetHP,
        resultatInterOffnetHC: offreComplete.resultatInterOffnetHC,
        resultatInterOffnetHP: offreComplete.resultatInterOffnetHP,
        resultatInterOnnetHC: offreComplete.resultatInterOnnetHC,
        resultatInterOnnetHP: offreComplete.resultatInterOnnetHP,
        // Booléens isEffetClub
        isEffetClubBaseOffnetHC: offreComplete.isEffetClubBaseOffnetHC,
        isEffetClubBaseOffnetHP: offreComplete.isEffetClubBaseOffnetHP,
        isEffetClubBaseOnnetHC: offreComplete.isEffetClubBaseOnnetHC,
        isEffetClubBaseOnnetHP: offreComplete.isEffetClubBaseOnnetHP,
        isEffetClubInterOffnetHC: offreComplete.isEffetClubInterOffnetHC,
        isEffetClubInterOffnetHP: offreComplete.isEffetClubInterOffnetHP,
        isEffetClubInterOnnetHC: offreComplete.isEffetClubInterOnnetHC,
        isEffetClubInterOnnetHP: offreComplete.isEffetClubInterOnnetHP,
        services: (offreComplete as any).services?.map((os: any) => ({
          id: os.service.id,
          nom: os.service.nom,
        })) || [],
      };

      return this.formatResponse(
        offreFormatted,
        'Offre créée',
        `L'offre "${offre.nom}" a été créée avec succès avec ${serviceIds.length} service(s) associé(s).`,
      );
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Une offre avec le nom "${createOffreDto.nom}" existe déjà pour cet opérateur`,
        );
      }
      throw error;
    }
  }

  // Modifier une offre
  async updateOffre(id: number, updateOffreDto: UpdateOffreDto) {
    const { serviceIds, ...offreUpdateData } = updateOffreDto;

    // Vérifier si l'offre existe
    const offre = await this.prisma.offre.findUnique({
      where: { id },
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${id} introuvable`);
    }

    // Si des services sont spécifiés, vérifier qu'ils existent
    if (serviceIds && serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: serviceIds },
        },
      });

      if (services.length !== serviceIds.length) {
        throw new NotFoundException(
          'Un ou plusieurs services spécifiés sont introuvables',
        );
      }
    }

    // Si l'opérateur est modifié, vérifier qu'il existe
    if (offreUpdateData.operateurId && offreUpdateData.operateurId !== offre.operateurId) {
      const operateur = await this.prisma.operateur.findUnique({
        where: { id: offreUpdateData.operateurId },
      });

      if (!operateur) {
        throw new NotFoundException(
          `Opérateur avec l'ID ${offreUpdateData.operateurId} introuvable`,
        );
      }
    }

    // Vérifier l'unicité du nom pour l'opérateur
    const operateurIdFinal = offreUpdateData.operateurId || offre.operateurId;
    const nomFinal = offreUpdateData.nom || offre.nom;

    if (
      (offreUpdateData.nom && offreUpdateData.nom !== offre.nom) ||
      (offreUpdateData.operateurId && offreUpdateData.operateurId !== offre.operateurId)
    ) {
      const existingOffre = await this.prisma.offre.findFirst({
        where: {
          operateurId: operateurIdFinal,
          nom: nomFinal,
          NOT: { id },
        },
      });

      if (existingOffre) {
        throw new ConflictException(
          `Une offre avec le nom "${nomFinal}" existe déjà pour cet opérateur`,
        );
      }
    }

    // Vérifier les dates si elles sont modifiées
    if (offreUpdateData.dateDebutValidite || offreUpdateData.dateFinValidite) {
      const dateDebut = offreUpdateData.dateDebutValidite
        ? new Date(offreUpdateData.dateDebutValidite)
        : offre.dateDebutValidite;
      const dateFin = offreUpdateData.dateFinValidite
        ? new Date(offreUpdateData.dateFinValidite)
        : offre.dateFinValidite;

      if (dateFin <= dateDebut) {
        throw new BadRequestException(
          'La date de fin de validité doit être postérieure à la date de début',
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (offreUpdateData.operateurId) updateData.operateurId = offreUpdateData.operateurId;
    if (offreUpdateData.nom) updateData.nom = offreUpdateData.nom;
    if (offreUpdateData.dateDebutValidite)
      updateData.dateDebutValidite = new Date(offreUpdateData.dateDebutValidite);
    if (offreUpdateData.dateFinValidite)
      updateData.dateFinValidite = new Date(offreUpdateData.dateFinValidite);
    if (offreUpdateData.typeOffre) updateData.typeOffre = offreUpdateData.typeOffre;
    if (offreUpdateData.destination) updateData.destination = offreUpdateData.destination;
    if (offreUpdateData.statut) updateData.statut = offreUpdateData.statut;
    if (offreUpdateData.description !== undefined)
      updateData.description = offreUpdateData.description;





    // 🔄 MISE À JOUR DES NOUVEAUX CHAMPS TARIFAIRES
    if (offreUpdateData.tp !== undefined) 
      updateData.tp = offreUpdateData.tp ? new Decimal(offreUpdateData.tp) : null;
    if (offreUpdateData.tnc !== undefined) 
      updateData.tnc = offreUpdateData.tnc ? new Decimal(offreUpdateData.tnc) : null;
    if (offreUpdateData.ep !== undefined) 
      updateData.ep = offreUpdateData.ep ? new Decimal(offreUpdateData.ep) : null;






    // 🔄 MISE À JOUR DES NOUVEAUX CHAMPS TARIFAIRES ONNET/OFFNET
    if (offreUpdateData.tpOnNet !== undefined) 
      updateData.tpOnNet = offreUpdateData.tpOnNet ? new Decimal(offreUpdateData.tpOnNet) : null;
    if (offreUpdateData.tfOnNet !== undefined) 
      updateData.tfOnNet = offreUpdateData.tfOnNet ? new Decimal(offreUpdateData.tfOnNet) : null;
    if (offreUpdateData.tncOnNet !== undefined) 
      updateData.tncOnNet = offreUpdateData.tncOnNet ? new Decimal(offreUpdateData.tncOnNet) : null;
    if (offreUpdateData.epOnNet !== undefined) 
      updateData.epOnNet = offreUpdateData.epOnNet ? new Decimal(offreUpdateData.epOnNet) : null;
    if (offreUpdateData.tpOffNet !== undefined) 
      updateData.tpOffNet = offreUpdateData.tpOffNet ? new Decimal(offreUpdateData.tpOffNet) : null;
    if (offreUpdateData.tfOffNet !== undefined) 
      updateData.tfOffNet = offreUpdateData.tfOffNet ? new Decimal(offreUpdateData.tfOffNet) : null;
    if (offreUpdateData.tncOffNet !== undefined) 
      updateData.tncOffNet = offreUpdateData.tncOffNet ? new Decimal(offreUpdateData.tncOffNet) : null;
    if (offreUpdateData.epOffNet !== undefined) 
      updateData.epOffNet = offreUpdateData.epOffNet ? new Decimal(offreUpdateData.epOffNet) : null;

    // Ne plus recalculer l'effet club à la mise à jour (calcul à la demande uniquement)
    // Si l'opérateur change, réinitialiser les champs calculés
    if (offreUpdateData.operateurId) {
      // Réinitialiser tous les champs tarifaires de l'opérateur
      updateData.taBaseOperateurOffnetHC = null;
      updateData.taBaseOperateurOffnetHP = null;
      updateData.taBaseOperateurOnnetHC = null;
      updateData.taBaseOperateurOnnetHP = null;
      updateData.taInterOperateurOffnetHC = null;
      updateData.taInterOperateurOffnetHP = null;
      updateData.taInterOperateurOnnetHC = null;
      updateData.taInterOperateurOnnetHP = null;
      
      // Réinitialiser les moyennes
      updateData.taMoyenBaseOffnetHC = null;
      updateData.taMoyenBaseOffnetHP = null;
      updateData.taMoyenBaseOnnetHC = null;
      updateData.taMoyenBaseOnnetHP = null;
      updateData.taMoyenInterOffnetHC = null;
      updateData.taMoyenInterOffnetHP = null;
      updateData.taMoyenInterOnnetHC = null;
      updateData.taMoyenInterOnnetHP = null;
      
      // Réinitialiser les sommes
      updateData.sommeBaseAutresOperateursOffnetHC = null;
      updateData.sommeBaseAutresOperateursOffnetHP = null;
      updateData.sommeBaseAutresOperateursOnnetHC = null;
      updateData.sommeBaseAutresOperateursOnnetHP = null;
      updateData.sommeInterAutresOperateursOffnetHC = null;
      updateData.sommeInterAutresOperateursOffnetHP = null;
      updateData.sommeInterAutresOperateursOnnetHC = null;
      updateData.sommeInterAutresOperateursOnnetHP = null;
      
      updateData.nombreAutresOperateurs = null;
      updateData.effetClub = null;
      updateData.resultat = null;
      
      // Réinitialiser les 8 effets club spécifiques
      updateData.effetClubBaseOffnetHC = null;
      updateData.effetClubBaseOffnetHP = null;
      updateData.effetClubBaseOnnetHC = null;
      updateData.effetClubBaseOnnetHP = null;
      updateData.effetClubInterOffnetHC = null;
      updateData.effetClubInterOffnetHP = null;
      updateData.effetClubInterOnnetHC = null;
      updateData.effetClubInterOnnetHP = null;
      
      // Réinitialiser les 8 résultats
      updateData.resultatBaseOffnetHC = null;
      updateData.resultatBaseOffnetHP = null;
      updateData.resultatBaseOnnetHC = null;
      updateData.resultatBaseOnnetHP = null;
      updateData.resultatInterOffnetHC = null;
      updateData.resultatInterOffnetHP = null;
      updateData.resultatInterOnnetHC = null;
      updateData.resultatInterOnnetHP = null;
      
      // Réinitialiser les 8 booléens
      updateData.isEffetClubBaseOffnetHC = false;
      updateData.isEffetClubBaseOffnetHP = false;
      updateData.isEffetClubBaseOnnetHC = false;
      updateData.isEffetClubBaseOnnetHP = false;
      updateData.isEffetClubInterOffnetHC = false;
      updateData.isEffetClubInterOffnetHP = false;
      updateData.isEffetClubInterOnnetHC = false;
      updateData.isEffetClubInterOnnetHP = false;
      updateData.isEffetClub = false;
      
      // Commentaire: Pour recalculer l'effet club après une modification,
      // utilisez l'API POST /offre/:id/calculer-effet-club
    }

    try {
      // Mettre à jour l'offre
      const updatedOffre = await this.prisma.offre.update({
        where: { id },
        data: updateData,
      });

      // Si les services sont spécifiés, mettre à jour les relations
      if (serviceIds !== undefined) {
        // Supprimer les anciennes relations
        await this.prisma.offreService.deleteMany({
          where: { offreId: id },
        });

        // Créer les nouvelles relations si des services sont fournis
        if (serviceIds.length > 0) {
          await this.prisma.offreService.createMany({
            data: serviceIds.map(serviceId => ({
              offreId: id,
              serviceId,
            })),
          });
        }
      }

      // Récupérer l'offre mise à jour avec ses relations
      const offreComplete = await this.prisma.offre.findUnique({
        where: { id },
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
            },
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      if (!offreComplete) {
        throw new Error('Erreur lors de la récupération de l\'offre mise à jour');
      }

      const offreFormatted = {
        ...offreComplete,
        // Tarifs opérateur
        taBaseOperateurOffnetHC: offreComplete.taBaseOperateurOffnetHC ? Number(offreComplete.taBaseOperateurOffnetHC) : null,
        taBaseOperateurOffnetHP: offreComplete.taBaseOperateurOffnetHP ? Number(offreComplete.taBaseOperateurOffnetHP) : null,
        taBaseOperateurOnnetHC: offreComplete.taBaseOperateurOnnetHC ? Number(offreComplete.taBaseOperateurOnnetHC) : null,
        taBaseOperateurOnnetHP: offreComplete.taBaseOperateurOnnetHP ? Number(offreComplete.taBaseOperateurOnnetHP) : null,
        taInterOperateurOffnetHC: offreComplete.taInterOperateurOffnetHC ? Number(offreComplete.taInterOperateurOffnetHC) : null,
        taInterOperateurOffnetHP: offreComplete.taInterOperateurOffnetHP ? Number(offreComplete.taInterOperateurOffnetHP) : null,
        taInterOperateurOnnetHC: offreComplete.taInterOperateurOnnetHC ? Number(offreComplete.taInterOperateurOnnetHC) : null,
        taInterOperateurOnnetHP: offreComplete.taInterOperateurOnnetHP ? Number(offreComplete.taInterOperateurOnnetHP) : null,
        // Moyennes
        taMoyenBaseOffnetHC: offreComplete.taMoyenBaseOffnetHC ? Number(offreComplete.taMoyenBaseOffnetHC) : null,
        taMoyenBaseOffnetHP: offreComplete.taMoyenBaseOffnetHP ? Number(offreComplete.taMoyenBaseOffnetHP) : null,
        taMoyenBaseOnnetHC: offreComplete.taMoyenBaseOnnetHC ? Number(offreComplete.taMoyenBaseOnnetHC) : null,
        taMoyenBaseOnnetHP: offreComplete.taMoyenBaseOnnetHP ? Number(offreComplete.taMoyenBaseOnnetHP) : null,
        taMoyenInterOffnetHC: offreComplete.taMoyenInterOffnetHC ? Number(offreComplete.taMoyenInterOffnetHC) : null,
        taMoyenInterOffnetHP: offreComplete.taMoyenInterOffnetHP ? Number(offreComplete.taMoyenInterOffnetHP) : null,
        taMoyenInterOnnetHC: offreComplete.taMoyenInterOnnetHC ? Number(offreComplete.taMoyenInterOnnetHC) : null,
        taMoyenInterOnnetHP: offreComplete.taMoyenInterOnnetHP ? Number(offreComplete.taMoyenInterOnnetHP) : null,
        // Sommes
        sommeBaseAutresOperateursOffnetHC: offreComplete.sommeBaseAutresOperateursOffnetHC ? Number(offreComplete.sommeBaseAutresOperateursOffnetHC) : null,
        sommeBaseAutresOperateursOffnetHP: offreComplete.sommeBaseAutresOperateursOffnetHP ? Number(offreComplete.sommeBaseAutresOperateursOffnetHP) : null,
        sommeBaseAutresOperateursOnnetHC: offreComplete.sommeBaseAutresOperateursOnnetHC ? Number(offreComplete.sommeBaseAutresOperateursOnnetHC) : null,
        sommeBaseAutresOperateursOnnetHP: offreComplete.sommeBaseAutresOperateursOnnetHP ? Number(offreComplete.sommeBaseAutresOperateursOnnetHP) : null,
        sommeInterAutresOperateursOffnetHC: offreComplete.sommeInterAutresOperateursOffnetHC ? Number(offreComplete.sommeInterAutresOperateursOffnetHC) : null,
        sommeInterAutresOperateursOffnetHP: offreComplete.sommeInterAutresOperateursOffnetHP ? Number(offreComplete.sommeInterAutresOperateursOffnetHP) : null,
        sommeInterAutresOperateursOnnetHC: offreComplete.sommeInterAutresOperateursOnnetHC ? Number(offreComplete.sommeInterAutresOperateursOnnetHC) : null,
        sommeInterAutresOperateursOnnetHP: offreComplete.sommeInterAutresOperateursOnnetHP ? Number(offreComplete.sommeInterAutresOperateursOnnetHP) : null,
        // Effets club
        effetClubBaseOffnetHC: offreComplete.effetClubBaseOffnetHC ? Number(offreComplete.effetClubBaseOffnetHC) : null,
        effetClubBaseOffnetHP: offreComplete.effetClubBaseOffnetHP ? Number(offreComplete.effetClubBaseOffnetHP) : null,
        effetClubBaseOnnetHC: offreComplete.effetClubBaseOnnetHC ? Number(offreComplete.effetClubBaseOnnetHC) : null,
        effetClubBaseOnnetHP: offreComplete.effetClubBaseOnnetHP ? Number(offreComplete.effetClubBaseOnnetHP) : null,
        effetClubInterOffnetHC: offreComplete.effetClubInterOffnetHC ? Number(offreComplete.effetClubInterOffnetHC) : null,
        effetClubInterOffnetHP: offreComplete.effetClubInterOffnetHP ? Number(offreComplete.effetClubInterOffnetHP) : null,
        effetClubInterOnnetHC: offreComplete.effetClubInterOnnetHC ? Number(offreComplete.effetClubInterOnnetHC) : null,
        effetClubInterOnnetHP: offreComplete.effetClubInterOnnetHP ? Number(offreComplete.effetClubInterOnnetHP) : null,
        // Résultats
        resultatBaseOffnetHC: offreComplete.resultatBaseOffnetHC,
        resultatBaseOffnetHP: offreComplete.resultatBaseOffnetHP,
        resultatBaseOnnetHC: offreComplete.resultatBaseOnnetHC,
        resultatBaseOnnetHP: offreComplete.resultatBaseOnnetHP,
        resultatInterOffnetHC: offreComplete.resultatInterOffnetHC,
        resultatInterOffnetHP: offreComplete.resultatInterOffnetHP,
        resultatInterOnnetHC: offreComplete.resultatInterOnnetHC,
        resultatInterOnnetHP: offreComplete.resultatInterOnnetHP,
        // Booléens
        isEffetClubBaseOffnetHC: offreComplete.isEffetClubBaseOffnetHC,
        isEffetClubBaseOffnetHP: offreComplete.isEffetClubBaseOffnetHP,
        isEffetClubBaseOnnetHC: offreComplete.isEffetClubBaseOnnetHC,
        isEffetClubBaseOnnetHP: offreComplete.isEffetClubBaseOnnetHP,
        isEffetClubInterOffnetHC: offreComplete.isEffetClubInterOffnetHC,
        isEffetClubInterOffnetHP: offreComplete.isEffetClubInterOffnetHP,
        isEffetClubInterOnnetHC: offreComplete.isEffetClubInterOnnetHC,
        isEffetClubInterOnnetHP: offreComplete.isEffetClubInterOnnetHP,
        services: (offreComplete as any).services?.map((os: any) => ({
          id: os.service.id,
          nom: os.service.nom,
        })) || [],
      };

      const serviceMessage = serviceIds !== undefined 
        ? ` avec ${serviceIds.length} service(s) associé(s)`
        : '';

      return this.formatResponse(
        offreFormatted,
        'Offre modifiée',
        `L'offre "${updatedOffre.nom}" a été modifiée avec succès${serviceMessage}.`,
      );
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Une offre avec le nom "${nomFinal}" existe déjà pour cet opérateur`,
        );
      }
      throw error;
    }
  }

  // Supprimer une offre
  async deleteOffre(id: number) {
    // Vérifier si l'offre existe
    const offre = await this.prisma.offre.findUnique({
      where: { id },
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${id} introuvable`);
    }

    await this.prisma.offre.delete({
      where: { id },
    });

    return this.formatResponse(
      null,
      'Offre supprimée',
      `L'offre avec l'ID ${id} a été supprimée avec succès.`,
    );
  }

  // Lister les offres avec filtres et pagination
  async listOffres(query: OffreQueryDto) {
    const {
      page = 1,
      limit = 10,
      operateurId,
      nom,
      typeOffre,
      destination,
      service,
      statut,
    } = query;

    // Construction des filtres
    const where: any = {};

    if (operateurId) {
      where.operateurId = operateurId;
    }

    if (nom) {
      where.nom = { contains: nom };
    }

    if (typeOffre) {
      where.typeOffre = typeOffre;
    }

    if (destination) {
      where.destination = destination;
    }

    if (service) {
      where.service = service;
    }

    if (statut) {
      where.statut = statut;
    }

    // Compter le total
    const total = await this.prisma.offre.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const offres = await this.prisma.offre.findMany({
        where,
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
            },
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const offresFormatted = offres.map((offre) => {
        return {
          ...offre,
          // Tarifs opérateur
          taBaseOperateurOffnetHC: offre.taBaseOperateurOffnetHC ? Number(offre.taBaseOperateurOffnetHC) : null,
          taBaseOperateurOffnetHP: offre.taBaseOperateurOffnetHP ? Number(offre.taBaseOperateurOffnetHP) : null,
          taBaseOperateurOnnetHC: offre.taBaseOperateurOnnetHC ? Number(offre.taBaseOperateurOnnetHC) : null,
          taBaseOperateurOnnetHP: offre.taBaseOperateurOnnetHP ? Number(offre.taBaseOperateurOnnetHP) : null,
          taInterOperateurOffnetHC: offre.taInterOperateurOffnetHC ? Number(offre.taInterOperateurOffnetHC) : null,
          taInterOperateurOffnetHP: offre.taInterOperateurOffnetHP ? Number(offre.taInterOperateurOffnetHP) : null,
          taInterOperateurOnnetHC: offre.taInterOperateurOnnetHC ? Number(offre.taInterOperateurOnnetHC) : null,
          taInterOperateurOnnetHP: offre.taInterOperateurOnnetHP ? Number(offre.taInterOperateurOnnetHP) : null,
          // Moyennes
          taMoyenBaseOffnetHC: offre.taMoyenBaseOffnetHC ? Number(offre.taMoyenBaseOffnetHC) : null,
          taMoyenBaseOffnetHP: offre.taMoyenBaseOffnetHP ? Number(offre.taMoyenBaseOffnetHP) : null,
          taMoyenBaseOnnetHC: offre.taMoyenBaseOnnetHC ? Number(offre.taMoyenBaseOnnetHC) : null,
          taMoyenBaseOnnetHP: offre.taMoyenBaseOnnetHP ? Number(offre.taMoyenBaseOnnetHP) : null,
          taMoyenInterOffnetHC: offre.taMoyenInterOffnetHC ? Number(offre.taMoyenInterOffnetHC) : null,
          taMoyenInterOffnetHP: offre.taMoyenInterOffnetHP ? Number(offre.taMoyenInterOffnetHP) : null,
          taMoyenInterOnnetHC: offre.taMoyenInterOnnetHC ? Number(offre.taMoyenInterOnnetHC) : null,
          taMoyenInterOnnetHP: offre.taMoyenInterOnnetHP ? Number(offre.taMoyenInterOnnetHP) : null,
          // Sommes
          sommeBaseAutresOperateursOffnetHC: offre.sommeBaseAutresOperateursOffnetHC ? Number(offre.sommeBaseAutresOperateursOffnetHC) : null,
          sommeBaseAutresOperateursOffnetHP: offre.sommeBaseAutresOperateursOffnetHP ? Number(offre.sommeBaseAutresOperateursOffnetHP) : null,
          sommeBaseAutresOperateursOnnetHC: offre.sommeBaseAutresOperateursOnnetHC ? Number(offre.sommeBaseAutresOperateursOnnetHC) : null,
          sommeBaseAutresOperateursOnnetHP: offre.sommeBaseAutresOperateursOnnetHP ? Number(offre.sommeBaseAutresOperateursOnnetHP) : null,
          sommeInterAutresOperateursOffnetHC: offre.sommeInterAutresOperateursOffnetHC ? Number(offre.sommeInterAutresOperateursOffnetHC) : null,
          sommeInterAutresOperateursOffnetHP: offre.sommeInterAutresOperateursOffnetHP ? Number(offre.sommeInterAutresOperateursOffnetHP) : null,
          sommeInterAutresOperateursOnnetHC: offre.sommeInterAutresOperateursOnnetHC ? Number(offre.sommeInterAutresOperateursOnnetHC) : null,
          sommeInterAutresOperateursOnnetHP: offre.sommeInterAutresOperateursOnnetHP ? Number(offre.sommeInterAutresOperateursOnnetHP) : null,
          // Prix
          prixOnNet: offre.prixOnNet ? Number(offre.prixOnNet) : null,
          prixOffNet: offre.prixOffNet ? Number(offre.prixOffNet) : null,
          // Effets club
          effetClubBaseOffnetHC: offre.effetClubBaseOffnetHC ? Number(offre.effetClubBaseOffnetHC) : null,
          effetClubBaseOffnetHP: offre.effetClubBaseOffnetHP ? Number(offre.effetClubBaseOffnetHP) : null,
          effetClubBaseOnnetHC: offre.effetClubBaseOnnetHC ? Number(offre.effetClubBaseOnnetHC) : null,
          effetClubBaseOnnetHP: offre.effetClubBaseOnnetHP ? Number(offre.effetClubBaseOnnetHP) : null,
          effetClubInterOffnetHC: offre.effetClubInterOffnetHC ? Number(offre.effetClubInterOffnetHC) : null,
          effetClubInterOffnetHP: offre.effetClubInterOffnetHP ? Number(offre.effetClubInterOffnetHP) : null,
          effetClubInterOnnetHC: offre.effetClubInterOnnetHC ? Number(offre.effetClubInterOnnetHC) : null,
          effetClubInterOnnetHP: offre.effetClubInterOnnetHP ? Number(offre.effetClubInterOnnetHP) : null,
          // Résultats
          resultatBaseOffnetHC: offre.resultatBaseOffnetHC,
          resultatBaseOffnetHP: offre.resultatBaseOffnetHP,
          resultatBaseOnnetHC: offre.resultatBaseOnnetHC,
          resultatBaseOnnetHP: offre.resultatBaseOnnetHP,
          resultatInterOffnetHC: offre.resultatInterOffnetHC,
          resultatInterOffnetHP: offre.resultatInterOffnetHP,
          resultatInterOnnetHC: offre.resultatInterOnnetHC,
          resultatInterOnnetHP: offre.resultatInterOnnetHP,
          // Booléens
          isEffetClubBaseOffnetHC: offre.isEffetClubBaseOffnetHC || false,
          isEffetClubBaseOffnetHP: offre.isEffetClubBaseOffnetHP || false,
          isEffetClubBaseOnnetHC: offre.isEffetClubBaseOnnetHC || false,
          isEffetClubBaseOnnetHP: offre.isEffetClubBaseOnnetHP || false,
          isEffetClubInterOffnetHC: offre.isEffetClubInterOffnetHC || false,
          isEffetClubInterOffnetHP: offre.isEffetClubInterOffnetHP || false,
          isEffetClubInterOnnetHC: offre.isEffetClubInterOnnetHC || false,
          isEffetClubInterOnnetHP: offre.isEffetClubInterOnnetHP || false,
          services: (offre as any).services?.map((os: any) => ({
            id: os.service.id,
            nom: os.service.nom,
          })) || [],
        };
      });

      return this.formatResponse(
        {
          offres: offresFormatted,
          pagination: {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des offres',
        `${total} offre(s) récupérée(s) avec succès.`,
      );
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const offres = await this.prisma.offre.findMany({
      where,
      skip,
      take: limit,
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const offresFormatted = offres.map((offre) => {
      return {
        ...offre,
        // Tarifs opérateur
        taBaseOperateurOffnetHC: offre.taBaseOperateurOffnetHC ? Number(offre.taBaseOperateurOffnetHC) : null,
        taBaseOperateurOffnetHP: offre.taBaseOperateurOffnetHP ? Number(offre.taBaseOperateurOffnetHP) : null,
        taBaseOperateurOnnetHC: offre.taBaseOperateurOnnetHC ? Number(offre.taBaseOperateurOnnetHC) : null,
        taBaseOperateurOnnetHP: offre.taBaseOperateurOnnetHP ? Number(offre.taBaseOperateurOnnetHP) : null,
        taInterOperateurOffnetHC: offre.taInterOperateurOffnetHC ? Number(offre.taInterOperateurOffnetHC) : null,
        taInterOperateurOffnetHP: offre.taInterOperateurOffnetHP ? Number(offre.taInterOperateurOffnetHP) : null,
        taInterOperateurOnnetHC: offre.taInterOperateurOnnetHC ? Number(offre.taInterOperateurOnnetHC) : null,
        taInterOperateurOnnetHP: offre.taInterOperateurOnnetHP ? Number(offre.taInterOperateurOnnetHP) : null,
        // Moyennes
        taMoyenBaseOffnetHC: offre.taMoyenBaseOffnetHC ? Number(offre.taMoyenBaseOffnetHC) : null,
        taMoyenBaseOffnetHP: offre.taMoyenBaseOffnetHP ? Number(offre.taMoyenBaseOffnetHP) : null,
        taMoyenBaseOnnetHC: offre.taMoyenBaseOnnetHC ? Number(offre.taMoyenBaseOnnetHC) : null,
        taMoyenBaseOnnetHP: offre.taMoyenBaseOnnetHP ? Number(offre.taMoyenBaseOnnetHP) : null,
        taMoyenInterOffnetHC: offre.taMoyenInterOffnetHC ? Number(offre.taMoyenInterOffnetHC) : null,
        taMoyenInterOffnetHP: offre.taMoyenInterOffnetHP ? Number(offre.taMoyenInterOffnetHP) : null,
        taMoyenInterOnnetHC: offre.taMoyenInterOnnetHC ? Number(offre.taMoyenInterOnnetHC) : null,
        taMoyenInterOnnetHP: offre.taMoyenInterOnnetHP ? Number(offre.taMoyenInterOnnetHP) : null,
        // Sommes
        sommeBaseAutresOperateursOffnetHC: offre.sommeBaseAutresOperateursOffnetHC ? Number(offre.sommeBaseAutresOperateursOffnetHC) : null,
        sommeBaseAutresOperateursOffnetHP: offre.sommeBaseAutresOperateursOffnetHP ? Number(offre.sommeBaseAutresOperateursOffnetHP) : null,
        sommeBaseAutresOperateursOnnetHC: offre.sommeBaseAutresOperateursOnnetHC ? Number(offre.sommeBaseAutresOperateursOnnetHC) : null,
        sommeBaseAutresOperateursOnnetHP: offre.sommeBaseAutresOperateursOnnetHP ? Number(offre.sommeBaseAutresOperateursOnnetHP) : null,
        sommeInterAutresOperateursOffnetHC: offre.sommeInterAutresOperateursOffnetHC ? Number(offre.sommeInterAutresOperateursOffnetHC) : null,
        sommeInterAutresOperateursOffnetHP: offre.sommeInterAutresOperateursOffnetHP ? Number(offre.sommeInterAutresOperateursOffnetHP) : null,
        sommeInterAutresOperateursOnnetHC: offre.sommeInterAutresOperateursOnnetHC ? Number(offre.sommeInterAutresOperateursOnnetHC) : null,
        sommeInterAutresOperateursOnnetHP: offre.sommeInterAutresOperateursOnnetHP ? Number(offre.sommeInterAutresOperateursOnnetHP) : null,
        // Effets club
        effetClubBaseOffnetHC: offre.effetClubBaseOffnetHC ? Number(offre.effetClubBaseOffnetHC) : null,
        effetClubBaseOffnetHP: offre.effetClubBaseOffnetHP ? Number(offre.effetClubBaseOffnetHP) : null,
        effetClubBaseOnnetHC: offre.effetClubBaseOnnetHC ? Number(offre.effetClubBaseOnnetHC) : null,
        effetClubBaseOnnetHP: offre.effetClubBaseOnnetHP ? Number(offre.effetClubBaseOnnetHP) : null,
        effetClubInterOffnetHC: offre.effetClubInterOffnetHC ? Number(offre.effetClubInterOffnetHC) : null,
        effetClubInterOffnetHP: offre.effetClubInterOffnetHP ? Number(offre.effetClubInterOffnetHP) : null,
        effetClubInterOnnetHC: offre.effetClubInterOnnetHC ? Number(offre.effetClubInterOnnetHC) : null,
        effetClubInterOnnetHP: offre.effetClubInterOnnetHP ? Number(offre.effetClubInterOnnetHP) : null,
        // Résultats
        resultatBaseOffnetHC: offre.resultatBaseOffnetHC,
        resultatBaseOffnetHP: offre.resultatBaseOffnetHP,
        resultatBaseOnnetHC: offre.resultatBaseOnnetHC,
        resultatBaseOnnetHP: offre.resultatBaseOnnetHP,
        resultatInterOffnetHC: offre.resultatInterOffnetHC,
        resultatInterOffnetHP: offre.resultatInterOffnetHP,
        resultatInterOnnetHC: offre.resultatInterOnnetHC,
        resultatInterOnnetHP: offre.resultatInterOnnetHP,
        // Booléens
        isEffetClubBaseOffnetHC: offre.isEffetClubBaseOffnetHC || false,
        isEffetClubBaseOffnetHP: offre.isEffetClubBaseOffnetHP || false,
        isEffetClubBaseOnnetHC: offre.isEffetClubBaseOnnetHC || false,
        isEffetClubBaseOnnetHP: offre.isEffetClubBaseOnnetHP || false,
        isEffetClubInterOffnetHC: offre.isEffetClubInterOffnetHC || false,
        isEffetClubInterOffnetHP: offre.isEffetClubInterOffnetHP || false,
        isEffetClubInterOnnetHC: offre.isEffetClubInterOnnetHC || false,
        isEffetClubInterOnnetHP: offre.isEffetClubInterOnnetHP || false,
        services: (offre as any).services?.map((os: any) => ({
          id: os.service.id,
          nom: os.service.nom,
        })) || [],
      };
    });

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return this.formatResponse(
      {
        offres: offresFormatted,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      'Liste des offres',
      `${offresFormatted.length} offre(s) sur ${total} récupérée(s) avec succès.`,
    );
  }

  // Obtenir une offre par ID
  async getOffreById(id: number) {
    const offre = await this.prisma.offre.findUnique({
      where: { id },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            statut: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${id} introuvable`);
    }

    const offreFormatted = {
      ...offre,
      // 🔄 CONVERSION NOUVEAUX CHAMPS TARIFAIRES ONNET/OFFNET EN NUMBER
      tpOnNet: offre.tpOnNet ? Number(offre.tpOnNet) : null,
      tfOnNet: offre.tfOnNet ? Number(offre.tfOnNet) : null,
      tncOnNet: offre.tncOnNet ? Number(offre.tncOnNet) : null,
      epOnNet: offre.epOnNet ? Number(offre.epOnNet) : null,
      tpOffNet: offre.tpOffNet ? Number(offre.tpOffNet) : null,
      tfOffNet: offre.tfOffNet ? Number(offre.tfOffNet) : null,
      tncOffNet: offre.tncOffNet ? Number(offre.tncOffNet) : null,
      epOffNet: offre.epOffNet ? Number(offre.epOffNet) : null,
      // 🔄 CONVERSION NOUVEAUX CHAMPS REVENUS MOYENS EN NUMBER
      revenuMoyenOnNet: offre.revenuMoyenOnNet ? Number(offre.revenuMoyenOnNet) : null,
      revenuMoyenOffNet: offre.revenuMoyenOffNet ? Number(offre.revenuMoyenOffNet) : null,
     
      // Tarifs opérateur
      taBaseOperateurOffnetHC: offre.taBaseOperateurOffnetHC ? Number(offre.taBaseOperateurOffnetHC) : null,
      taBaseOperateurOffnetHP: offre.taBaseOperateurOffnetHP ? Number(offre.taBaseOperateurOffnetHP) : null,
      taBaseOperateurOnnetHC: offre.taBaseOperateurOnnetHC ? Number(offre.taBaseOperateurOnnetHC) : null,
      taBaseOperateurOnnetHP: offre.taBaseOperateurOnnetHP ? Number(offre.taBaseOperateurOnnetHP) : null,
      taInterOperateurOffnetHC: offre.taInterOperateurOffnetHC ? Number(offre.taInterOperateurOffnetHC) : null,
      taInterOperateurOffnetHP: offre.taInterOperateurOffnetHP ? Number(offre.taInterOperateurOffnetHP) : null,
      taInterOperateurOnnetHC: offre.taInterOperateurOnnetHC ? Number(offre.taInterOperateurOnnetHC) : null,
      taInterOperateurOnnetHP: offre.taInterOperateurOnnetHP ? Number(offre.taInterOperateurOnnetHP) : null,
      // Moyennes
      taMoyenBaseOffnetHC: offre.taMoyenBaseOffnetHC ? Number(offre.taMoyenBaseOffnetHC) : null,
      taMoyenBaseOffnetHP: offre.taMoyenBaseOffnetHP ? Number(offre.taMoyenBaseOffnetHP) : null,
      taMoyenBaseOnnetHC: offre.taMoyenBaseOnnetHC ? Number(offre.taMoyenBaseOnnetHC) : null,
      taMoyenBaseOnnetHP: offre.taMoyenBaseOnnetHP ? Number(offre.taMoyenBaseOnnetHP) : null,
      taMoyenInterOffnetHC: offre.taMoyenInterOffnetHC ? Number(offre.taMoyenInterOffnetHC) : null,
      taMoyenInterOffnetHP: offre.taMoyenInterOffnetHP ? Number(offre.taMoyenInterOffnetHP) : null,
      taMoyenInterOnnetHC: offre.taMoyenInterOnnetHC ? Number(offre.taMoyenInterOnnetHC) : null,
      taMoyenInterOnnetHP: offre.taMoyenInterOnnetHP ? Number(offre.taMoyenInterOnnetHP) : null,
      // Sommes
      sommeBaseAutresOperateursOffnetHC: offre.sommeBaseAutresOperateursOffnetHC ? Number(offre.sommeBaseAutresOperateursOffnetHC) : null,
      sommeBaseAutresOperateursOffnetHP: offre.sommeBaseAutresOperateursOffnetHP ? Number(offre.sommeBaseAutresOperateursOffnetHP) : null,
      sommeBaseAutresOperateursOnnetHC: offre.sommeBaseAutresOperateursOnnetHC ? Number(offre.sommeBaseAutresOperateursOnnetHC) : null,
      sommeBaseAutresOperateursOnnetHP: offre.sommeBaseAutresOperateursOnnetHP ? Number(offre.sommeBaseAutresOperateursOnnetHP) : null,
      sommeInterAutresOperateursOffnetHC: offre.sommeInterAutresOperateursOffnetHC ? Number(offre.sommeInterAutresOperateursOffnetHC) : null,
      sommeInterAutresOperateursOffnetHP: offre.sommeInterAutresOperateursOffnetHP ? Number(offre.sommeInterAutresOperateursOffnetHP) : null,
      sommeInterAutresOperateursOnnetHC: offre.sommeInterAutresOperateursOnnetHC ? Number(offre.sommeInterAutresOperateursOnnetHC) : null,
      sommeInterAutresOperateursOnnetHP: offre.sommeInterAutresOperateursOnnetHP ? Number(offre.sommeInterAutresOperateursOnnetHP) : null,
      // Prix
      prixOnNet: offre.prixOnNet ? Number(offre.prixOnNet) : null,
      prixOffNet: offre.prixOffNet ? Number(offre.prixOffNet) : null,
      // Effets club
      effetClubBaseOffnetHC: offre.effetClubBaseOffnetHC ? Number(offre.effetClubBaseOffnetHC) : null,
      effetClubBaseOffnetHP: offre.effetClubBaseOffnetHP ? Number(offre.effetClubBaseOffnetHP) : null,
      effetClubBaseOnnetHC: offre.effetClubBaseOnnetHC ? Number(offre.effetClubBaseOnnetHC) : null,
      effetClubBaseOnnetHP: offre.effetClubBaseOnnetHP ? Number(offre.effetClubBaseOnnetHP) : null,
      effetClubInterOffnetHC: offre.effetClubInterOffnetHC ? Number(offre.effetClubInterOffnetHC) : null,
      effetClubInterOffnetHP: offre.effetClubInterOffnetHP ? Number(offre.effetClubInterOffnetHP) : null,
      effetClubInterOnnetHC: offre.effetClubInterOnnetHC ? Number(offre.effetClubInterOnnetHC) : null,
      effetClubInterOnnetHP: offre.effetClubInterOnnetHP ? Number(offre.effetClubInterOnnetHP) : null,
      // Résultats
      resultatBaseOffnetHC: offre.resultatBaseOffnetHC,
      resultatBaseOffnetHP: offre.resultatBaseOffnetHP,
      resultatBaseOnnetHC: offre.resultatBaseOnnetHC,
      resultatBaseOnnetHP: offre.resultatBaseOnnetHP,
      resultatInterOffnetHC: offre.resultatInterOffnetHC,
      resultatInterOffnetHP: offre.resultatInterOffnetHP,
      resultatInterOnnetHC: offre.resultatInterOnnetHC,
      resultatInterOnnetHP: offre.resultatInterOnnetHP,
      // Booléens
      isEffetClubBaseOffnetHC: offre.isEffetClubBaseOffnetHC || false,
      isEffetClubBaseOffnetHP: offre.isEffetClubBaseOffnetHP || false,
      isEffetClubBaseOnnetHC: offre.isEffetClubBaseOnnetHC || false,
      isEffetClubBaseOnnetHP: offre.isEffetClubBaseOnnetHP || false,
      isEffetClubInterOffnetHC: offre.isEffetClubInterOffnetHC || false,
      isEffetClubInterOffnetHP: offre.isEffetClubInterOffnetHP || false,
      isEffetClubInterOnnetHC: offre.isEffetClubInterOnnetHC || false,
      isEffetClubInterOnnetHP: offre.isEffetClubInterOnnetHP || false,
      services: (offre as any).services?.map((os: any) => ({
        id: os.service.id,
        nom: os.service.nom,
      })) || [],
    };

    return this.formatResponse(
      offreFormatted,
      'Offre récupérée',
      `L'offre "${offre.nom}" a été récupérée avec succès.`,
    );
  }

  // Obtenir l'effet club d'une offre (calcul à la demande ET sauvegarde dans la BD)
  async getEffetClub(id: number) {
    const offre = await this.prisma.offre.findUnique({
      where: { id },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
      },
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${id} introuvable`);
    }

    // Déterminer l'année à partir de la date de début de validité
    const anneeOffre = new Date(offre.dateDebutValidite).getFullYear();

    // Calculer l'effet club avec les prix OnNet et OffNet
    const champsEffetClub = await this.calculerEffetClub(offre.operateurId, anneeOffre, id);

    if (!champsEffetClub) {
      throw new NotFoundException('Aucune donnée tarifaire trouvée pour cet opérateur et cette année');
    }

    // Sauvegarder les résultats dans la base de données
    const updatedOffre = await this.prisma.offre.update({
      where: { id },
      data: {
        taBaseOperateurOffnetHC: champsEffetClub.taBaseOperateurOffnetHC || null,
        taBaseOperateurOffnetHP: champsEffetClub.taBaseOperateurOffnetHP || null,
        taBaseOperateurOnnetHC: champsEffetClub.taBaseOperateurOnnetHC || null,
        taBaseOperateurOnnetHP: champsEffetClub.taBaseOperateurOnnetHP || null,
        taInterOperateurOffnetHC: champsEffetClub.taInterOperateurOffnetHC || null,
        taInterOperateurOffnetHP: champsEffetClub.taInterOperateurOffnetHP || null,
        taInterOperateurOnnetHC: champsEffetClub.taInterOperateurOnnetHC || null,
        taInterOperateurOnnetHP: champsEffetClub.taInterOperateurOnnetHP || null,
        taMoyenBaseOffnetHC: champsEffetClub.taMoyenBaseOffnetHC,
        taMoyenBaseOffnetHP: champsEffetClub.taMoyenBaseOffnetHP,
        taMoyenBaseOnnetHC: champsEffetClub.taMoyenBaseOnnetHC,
        taMoyenBaseOnnetHP: champsEffetClub.taMoyenBaseOnnetHP,
        taMoyenInterOffnetHC: champsEffetClub.taMoyenInterOffnetHC,
        taMoyenInterOffnetHP: champsEffetClub.taMoyenInterOffnetHP,
        taMoyenInterOnnetHC: champsEffetClub.taMoyenInterOnnetHC,
        taMoyenInterOnnetHP: champsEffetClub.taMoyenInterOnnetHP,
        sommeBaseAutresOperateursOffnetHC: champsEffetClub.sommeBaseAutresOperateursOffnetHC || null,
        sommeBaseAutresOperateursOffnetHP: champsEffetClub.sommeBaseAutresOperateursOffnetHP || null,
        sommeBaseAutresOperateursOnnetHC: champsEffetClub.sommeBaseAutresOperateursOnnetHC || null,
        sommeBaseAutresOperateursOnnetHP: champsEffetClub.sommeBaseAutresOperateursOnnetHP || null,
        sommeInterAutresOperateursOffnetHC: champsEffetClub.sommeInterAutresOperateursOffnetHC || null,
        sommeInterAutresOperateursOffnetHP: champsEffetClub.sommeInterAutresOperateursOffnetHP || null,
        sommeInterAutresOperateursOnnetHC: champsEffetClub.sommeInterAutresOperateursOnnetHC || null,
        sommeInterAutresOperateursOnnetHP: champsEffetClub.sommeInterAutresOperateursOnnetHP || null,
        nombreAutresOperateurs: champsEffetClub.nombreAutresOperateurs || null,
        prixOnNet: champsEffetClub.prixOnNet || null,
        prixOffNet: champsEffetClub.prixOffNet || null,
        effetClub: champsEffetClub.effetClub || null,
        
        // Les 8 effets club spécifiques
        effetClubBaseOffnetHC: champsEffetClub.effetClubBaseOffnetHC || null,
        effetClubBaseOffnetHP: champsEffetClub.effetClubBaseOffnetHP || null,
        effetClubBaseOnnetHC: champsEffetClub.effetClubBaseOnnetHC || null,
        effetClubBaseOnnetHP: champsEffetClub.effetClubBaseOnnetHP || null,
        effetClubInterOffnetHC: champsEffetClub.effetClubInterOffnetHC || null,
        effetClubInterOffnetHP: champsEffetClub.effetClubInterOffnetHP || null,
        effetClubInterOnnetHC: champsEffetClub.effetClubInterOnnetHC || null,
        effetClubInterOnnetHP: champsEffetClub.effetClubInterOnnetHP || null,
        
        // Les 8 résultats spécifiques
        resultatBaseOffnetHC: champsEffetClub.resultatBaseOffnetHC || null,
        resultatBaseOffnetHP: champsEffetClub.resultatBaseOffnetHP || null,
        resultatBaseOnnetHC: champsEffetClub.resultatBaseOnnetHC || null,
        resultatBaseOnnetHP: champsEffetClub.resultatBaseOnnetHP || null,
        resultatInterOffnetHC: champsEffetClub.resultatInterOffnetHC || null,
        resultatInterOffnetHP: champsEffetClub.resultatInterOffnetHP || null,
        resultatInterOnnetHC: champsEffetClub.resultatInterOnnetHC || null,
        resultatInterOnnetHP: champsEffetClub.resultatInterOnnetHP || null,
        
        // Les 8 booléens spécifiques
        isEffetClubBaseOffnetHC: champsEffetClub.isEffetClubBaseOffnetHC || false,
        isEffetClubBaseOffnetHP: champsEffetClub.isEffetClubBaseOffnetHP || false,
        isEffetClubBaseOnnetHC: champsEffetClub.isEffetClubBaseOnnetHC || false,
        isEffetClubBaseOnnetHP: champsEffetClub.isEffetClubBaseOnnetHP || false,
        isEffetClubInterOffnetHC: champsEffetClub.isEffetClubInterOffnetHC || false,
        isEffetClubInterOffnetHP: champsEffetClub.isEffetClubInterOffnetHP || false,
        isEffetClubInterOnnetHC: champsEffetClub.isEffetClubInterOnnetHC || false,
        isEffetClubInterOnnetHP: champsEffetClub.isEffetClubInterOnnetHP || false,
        
        // Champs génériques (effet club global)
        isEffetClub: champsEffetClub.effetClub !== null && Number(champsEffetClub.effetClub) > 0,
        resultat: champsEffetClub.effetClub !== null 
          ? `Effet Club calculé: ${Number(champsEffetClub.effetClub).toFixed(4)}` 
          : "Données tarifaires mises à jour (effet club non calculable - options manquantes)",
      },
    });

    const effetClubData = {
      idOffre: updatedOffre.id,
      nomOffre: updatedOffre.nom,
      operateur: offre.operateur,
      
      // Données globales
      nombreAutresOperateurs: updatedOffre.nombreAutresOperateurs,
      prixOnNet: updatedOffre.prixOnNet ? Number(updatedOffre.prixOnNet) : null,
      prixOffNet: updatedOffre.prixOffNet ? Number(updatedOffre.prixOffNet) : null,
      
      // Tarifs opérateur (8 champs)
      taBaseOperateurOffnetHC: updatedOffre.taBaseOperateurOffnetHC ? Number(updatedOffre.taBaseOperateurOffnetHC) : null,
      taBaseOperateurOffnetHP: updatedOffre.taBaseOperateurOffnetHP ? Number(updatedOffre.taBaseOperateurOffnetHP) : null,
      taBaseOperateurOnnetHC: updatedOffre.taBaseOperateurOnnetHC ? Number(updatedOffre.taBaseOperateurOnnetHC) : null,
      taBaseOperateurOnnetHP: updatedOffre.taBaseOperateurOnnetHP ? Number(updatedOffre.taBaseOperateurOnnetHP) : null,
      taInterOperateurOffnetHC: updatedOffre.taInterOperateurOffnetHC ? Number(updatedOffre.taInterOperateurOffnetHC) : null,
      taInterOperateurOffnetHP: updatedOffre.taInterOperateurOffnetHP ? Number(updatedOffre.taInterOperateurOffnetHP) : null,
      taInterOperateurOnnetHC: updatedOffre.taInterOperateurOnnetHC ? Number(updatedOffre.taInterOperateurOnnetHC) : null,
      taInterOperateurOnnetHP: updatedOffre.taInterOperateurOnnetHP ? Number(updatedOffre.taInterOperateurOnnetHP) : null,
      
      // Moyennes (8 champs)
      taMoyenBaseOffnetHC: updatedOffre.taMoyenBaseOffnetHC ? Number(updatedOffre.taMoyenBaseOffnetHC) : null,
      taMoyenBaseOffnetHP: updatedOffre.taMoyenBaseOffnetHP ? Number(updatedOffre.taMoyenBaseOffnetHP) : null,
      taMoyenBaseOnnetHC: updatedOffre.taMoyenBaseOnnetHC ? Number(updatedOffre.taMoyenBaseOnnetHC) : null,
      taMoyenBaseOnnetHP: updatedOffre.taMoyenBaseOnnetHP ? Number(updatedOffre.taMoyenBaseOnnetHP) : null,
      taMoyenInterOffnetHC: updatedOffre.taMoyenInterOffnetHC ? Number(updatedOffre.taMoyenInterOffnetHC) : null,
      taMoyenInterOffnetHP: updatedOffre.taMoyenInterOffnetHP ? Number(updatedOffre.taMoyenInterOffnetHP) : null,
      taMoyenInterOnnetHC: updatedOffre.taMoyenInterOnnetHC ? Number(updatedOffre.taMoyenInterOnnetHC) : null,
      taMoyenInterOnnetHP: updatedOffre.taMoyenInterOnnetHP ? Number(updatedOffre.taMoyenInterOnnetHP) : null,
      
      // Sommes (8 champs)
      sommeBaseAutresOperateursOffnetHC: updatedOffre.sommeBaseAutresOperateursOffnetHC ? Number(updatedOffre.sommeBaseAutresOperateursOffnetHC) : null,
      sommeBaseAutresOperateursOffnetHP: updatedOffre.sommeBaseAutresOperateursOffnetHP ? Number(updatedOffre.sommeBaseAutresOperateursOffnetHP) : null,
      sommeBaseAutresOperateursOnnetHC: updatedOffre.sommeBaseAutresOperateursOnnetHC ? Number(updatedOffre.sommeBaseAutresOperateursOnnetHC) : null,
      sommeBaseAutresOperateursOnnetHP: updatedOffre.sommeBaseAutresOperateursOnnetHP ? Number(updatedOffre.sommeBaseAutresOperateursOnnetHP) : null,
      sommeInterAutresOperateursOffnetHC: updatedOffre.sommeInterAutresOperateursOffnetHC ? Number(updatedOffre.sommeInterAutresOperateursOffnetHC) : null,
      sommeInterAutresOperateursOffnetHP: updatedOffre.sommeInterAutresOperateursOffnetHP ? Number(updatedOffre.sommeInterAutresOperateursOffnetHP) : null,
      sommeInterAutresOperateursOnnetHC: updatedOffre.sommeInterAutresOperateursOnnetHC ? Number(updatedOffre.sommeInterAutresOperateursOnnetHC) : null,
      sommeInterAutresOperateursOnnetHP: updatedOffre.sommeInterAutresOperateursOnnetHP ? Number(updatedOffre.sommeInterAutresOperateursOnnetHP) : null,
      
      // 8 effets club spécifiques
      effetClubBaseOffnetHC: updatedOffre.effetClubBaseOffnetHC ? Number(updatedOffre.effetClubBaseOffnetHC) : null,
      effetClubBaseOffnetHP: updatedOffre.effetClubBaseOffnetHP ? Number(updatedOffre.effetClubBaseOffnetHP) : null,
      effetClubBaseOnnetHC: updatedOffre.effetClubBaseOnnetHC ? Number(updatedOffre.effetClubBaseOnnetHC) : null,
      effetClubBaseOnnetHP: updatedOffre.effetClubBaseOnnetHP ? Number(updatedOffre.effetClubBaseOnnetHP) : null,
      effetClubInterOffnetHC: updatedOffre.effetClubInterOffnetHC ? Number(updatedOffre.effetClubInterOffnetHC) : null,
      effetClubInterOffnetHP: updatedOffre.effetClubInterOffnetHP ? Number(updatedOffre.effetClubInterOffnetHP) : null,
      effetClubInterOnnetHC: updatedOffre.effetClubInterOnnetHC ? Number(updatedOffre.effetClubInterOnnetHC) : null,
      effetClubInterOnnetHP: updatedOffre.effetClubInterOnnetHP ? Number(updatedOffre.effetClubInterOnnetHP) : null,
      
      // 8 résultats spécifiques
      resultatBaseOffnetHC: updatedOffre.resultatBaseOffnetHC,
      resultatBaseOffnetHP: updatedOffre.resultatBaseOffnetHP,
      resultatBaseOnnetHC: updatedOffre.resultatBaseOnnetHC,
      resultatBaseOnnetHP: updatedOffre.resultatBaseOnnetHP,
      resultatInterOffnetHC: updatedOffre.resultatInterOffnetHC,
      resultatInterOffnetHP: updatedOffre.resultatInterOffnetHP,
      resultatInterOnnetHC: updatedOffre.resultatInterOnnetHC,
      resultatInterOnnetHP: updatedOffre.resultatInterOnnetHP,
      
      // 8 booléens spécifiques
      isEffetClubBaseOffnetHC: updatedOffre.isEffetClubBaseOffnetHC || false,
      isEffetClubBaseOffnetHP: updatedOffre.isEffetClubBaseOffnetHP || false,
      isEffetClubBaseOnnetHC: updatedOffre.isEffetClubBaseOnnetHC || false,
      isEffetClubBaseOnnetHP: updatedOffre.isEffetClubBaseOnnetHP || false,
      isEffetClubInterOffnetHC: updatedOffre.isEffetClubInterOffnetHC || false,
      isEffetClubInterOffnetHP: updatedOffre.isEffetClubInterOffnetHP || false,
      isEffetClubInterOnnetHC: updatedOffre.isEffetClubInterOnnetHC || false,
      isEffetClubInterOnnetHP: updatedOffre.isEffetClubInterOnnetHP || false,
    };

    return this.formatResponse(
      effetClubData,
      'Effet club calculé',
      'L\'effet club a été calculé et sauvegardé avec succès.',
    );
  }

  // Calculer ET sauvegarder l'effet club d'une offre
  async calculerEtSauvegarderEffetClub(id: number) {
    const offre = await this.prisma.offre.findUnique({
      where: { id },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
      },
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${id} introuvable`);
    }

    // Déterminer l'année à partir de la date de début de validité
    const anneeOffre = new Date(offre.dateDebutValidite).getFullYear();

    // Calculer l'effet club avec les prix OnNet et OffNet
    const champsEffetClub = await this.calculerEffetClub(offre.operateurId, anneeOffre, id);

    if (!champsEffetClub) {
      throw new NotFoundException('Aucune donnée tarifaire trouvée pour cet opérateur et cette année');
    }

    // Compter les options pour le message de résultat
    const nombreOptions = await this.prisma.option.count({
      where: { offreId: id },
    });

    // Sauvegarder les résultats dans la base de données
    const updatedOffre = await this.prisma.offre.update({
      where: { id },
      data: {
        taBaseOperateurOffnetHC: champsEffetClub.taBaseOperateurOffnetHC || null,
        taBaseOperateurOffnetHP: champsEffetClub.taBaseOperateurOffnetHP || null,
        taBaseOperateurOnnetHC: champsEffetClub.taBaseOperateurOnnetHC || null,
        taBaseOperateurOnnetHP: champsEffetClub.taBaseOperateurOnnetHP || null,
        taInterOperateurOffnetHC: champsEffetClub.taInterOperateurOffnetHC || null,
        taInterOperateurOffnetHP: champsEffetClub.taInterOperateurOffnetHP || null,
        taInterOperateurOnnetHC: champsEffetClub.taInterOperateurOnnetHC || null,
        taInterOperateurOnnetHP: champsEffetClub.taInterOperateurOnnetHP || null,
        taMoyenBaseOffnetHC: champsEffetClub.taMoyenBaseOffnetHC,
        taMoyenBaseOffnetHP: champsEffetClub.taMoyenBaseOffnetHP,
        taMoyenBaseOnnetHC: champsEffetClub.taMoyenBaseOnnetHC,
        taMoyenBaseOnnetHP: champsEffetClub.taMoyenBaseOnnetHP,
        taMoyenInterOffnetHC: champsEffetClub.taMoyenInterOffnetHC,
        taMoyenInterOffnetHP: champsEffetClub.taMoyenInterOffnetHP,
        taMoyenInterOnnetHC: champsEffetClub.taMoyenInterOnnetHC,
        taMoyenInterOnnetHP: champsEffetClub.taMoyenInterOnnetHP,
        sommeBaseAutresOperateursOffnetHC: champsEffetClub.sommeBaseAutresOperateursOffnetHC || null,
        sommeBaseAutresOperateursOnnetHP: champsEffetClub.sommeBaseAutresOperateursOnnetHP || null,
        sommeInterAutresOperateursOffnetHC: champsEffetClub.sommeInterAutresOperateursOffnetHC || null,
        sommeInterAutresOperateursOnnetHP: champsEffetClub.sommeInterAutresOperateursOnnetHP || null,
        nombreAutresOperateurs: champsEffetClub.nombreAutresOperateurs || null,
        prixOnNet: champsEffetClub.prixOnNet || null,
        prixOffNet: champsEffetClub.prixOffNet || null,
        effetClub: champsEffetClub.effetClub || null,
        isEffetClub: champsEffetClub.effetClub !== null && Number(champsEffetClub.effetClub) > 0,
        resultat: champsEffetClub.effetClub !== null 
          ? `Effet Club calculé: ${Number(champsEffetClub.effetClub).toFixed(4)} (${nombreOptions} options analysées)` 
          : `Données tarifaires mises à jour (${nombreOptions} options analysées - effet club non calculable)`,
      },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
      },
    });

    const effetClubData = {
      idOffre: updatedOffre.id,
      nomOffre: updatedOffre.nom,
      operateur: updatedOffre.operateur,
      nombreAutresOperateurs: updatedOffre.nombreAutresOperateurs,
      prixOnNet: updatedOffre.prixOnNet ? Number(updatedOffre.prixOnNet) : null,
      prixOffNet: updatedOffre.prixOffNet ? Number(updatedOffre.prixOffNet) : null,
      nombreOptions: nombreOptions,
      
      // Tarifs opérateur (8 champs)
      taBaseOperateurOffnetHC: updatedOffre.taBaseOperateurOffnetHC ? Number(updatedOffre.taBaseOperateurOffnetHC) : null,
      taBaseOperateurOffnetHP: updatedOffre.taBaseOperateurOffnetHP ? Number(updatedOffre.taBaseOperateurOffnetHP) : null,
      taBaseOperateurOnnetHC: updatedOffre.taBaseOperateurOnnetHC ? Number(updatedOffre.taBaseOperateurOnnetHC) : null,
      taBaseOperateurOnnetHP: updatedOffre.taBaseOperateurOnnetHP ? Number(updatedOffre.taBaseOperateurOnnetHP) : null,
      taInterOperateurOffnetHC: updatedOffre.taInterOperateurOffnetHC ? Number(updatedOffre.taInterOperateurOffnetHC) : null,
      taInterOperateurOffnetHP: updatedOffre.taInterOperateurOffnetHP ? Number(updatedOffre.taInterOperateurOffnetHP) : null,
      taInterOperateurOnnetHC: updatedOffre.taInterOperateurOnnetHC ? Number(updatedOffre.taInterOperateurOnnetHC) : null,
      taInterOperateurOnnetHP: updatedOffre.taInterOperateurOnnetHP ? Number(updatedOffre.taInterOperateurOnnetHP) : null,
      
      // Moyennes (8 champs)
      taMoyenBaseOffnetHC: updatedOffre.taMoyenBaseOffnetHC ? Number(updatedOffre.taMoyenBaseOffnetHC) : null,
      taMoyenBaseOffnetHP: updatedOffre.taMoyenBaseOffnetHP ? Number(updatedOffre.taMoyenBaseOffnetHP) : null,
      taMoyenBaseOnnetHC: updatedOffre.taMoyenBaseOnnetHC ? Number(updatedOffre.taMoyenBaseOnnetHC) : null,
      taMoyenBaseOnnetHP: updatedOffre.taMoyenBaseOnnetHP ? Number(updatedOffre.taMoyenBaseOnnetHP) : null,
      taMoyenInterOffnetHC: updatedOffre.taMoyenInterOffnetHC ? Number(updatedOffre.taMoyenInterOffnetHC) : null,
      taMoyenInterOffnetHP: updatedOffre.taMoyenInterOffnetHP ? Number(updatedOffre.taMoyenInterOffnetHP) : null,
      taMoyenInterOnnetHC: updatedOffre.taMoyenInterOnnetHC ? Number(updatedOffre.taMoyenInterOnnetHC) : null,
      taMoyenInterOnnetHP: updatedOffre.taMoyenInterOnnetHP ? Number(updatedOffre.taMoyenInterOnnetHP) : null,
      
      // Sommes (8 champs)
      sommeBaseAutresOperateursOffnetHC: updatedOffre.sommeBaseAutresOperateursOffnetHC ? Number(updatedOffre.sommeBaseAutresOperateursOffnetHC) : null,
      sommeBaseAutresOperateursOffnetHP: updatedOffre.sommeBaseAutresOperateursOffnetHP ? Number(updatedOffre.sommeBaseAutresOperateursOffnetHP) : null,
      sommeBaseAutresOperateursOnnetHC: updatedOffre.sommeBaseAutresOperateursOnnetHC ? Number(updatedOffre.sommeBaseAutresOperateursOnnetHC) : null,
      sommeBaseAutresOperateursOnnetHP: updatedOffre.sommeBaseAutresOperateursOnnetHP ? Number(updatedOffre.sommeBaseAutresOperateursOnnetHP) : null,
      sommeInterAutresOperateursOffnetHC: updatedOffre.sommeInterAutresOperateursOffnetHC ? Number(updatedOffre.sommeInterAutresOperateursOffnetHC) : null,
      sommeInterAutresOperateursOffnetHP: updatedOffre.sommeInterAutresOperateursOffnetHP ? Number(updatedOffre.sommeInterAutresOperateursOffnetHP) : null,
      sommeInterAutresOperateursOnnetHC: updatedOffre.sommeInterAutresOperateursOnnetHC ? Number(updatedOffre.sommeInterAutresOperateursOnnetHC) : null,
      sommeInterAutresOperateursOnnetHP: updatedOffre.sommeInterAutresOperateursOnnetHP ? Number(updatedOffre.sommeInterAutresOperateursOnnetHP) : null,
      
      // 8 effets club spécifiques
      effetClubBaseOffnetHC: updatedOffre.effetClubBaseOffnetHC ? Number(updatedOffre.effetClubBaseOffnetHC) : null,
      effetClubBaseOffnetHP: updatedOffre.effetClubBaseOffnetHP ? Number(updatedOffre.effetClubBaseOffnetHP) : null,
      effetClubBaseOnnetHC: updatedOffre.effetClubBaseOnnetHC ? Number(updatedOffre.effetClubBaseOnnetHC) : null,
      effetClubBaseOnnetHP: updatedOffre.effetClubBaseOnnetHP ? Number(updatedOffre.effetClubBaseOnnetHP) : null,
      effetClubInterOffnetHC: updatedOffre.effetClubInterOffnetHC ? Number(updatedOffre.effetClubInterOffnetHC) : null,
      effetClubInterOffnetHP: updatedOffre.effetClubInterOffnetHP ? Number(updatedOffre.effetClubInterOffnetHP) : null,
      effetClubInterOnnetHC: updatedOffre.effetClubInterOnnetHC ? Number(updatedOffre.effetClubInterOnnetHC) : null,
      effetClubInterOnnetHP: updatedOffre.effetClubInterOnnetHP ? Number(updatedOffre.effetClubInterOnnetHP) : null,
      
      // 8 résultats spécifiques
      resultatBaseOffnetHC: updatedOffre.resultatBaseOffnetHC,
      resultatBaseOffnetHP: updatedOffre.resultatBaseOffnetHP,
      resultatBaseOnnetHC: updatedOffre.resultatBaseOnnetHC,
      resultatBaseOnnetHP: updatedOffre.resultatBaseOnnetHP,
      resultatInterOffnetHC: updatedOffre.resultatInterOffnetHC,
      resultatInterOffnetHP: updatedOffre.resultatInterOffnetHP,
      resultatInterOnnetHC: updatedOffre.resultatInterOnnetHC,
      resultatInterOnnetHP: updatedOffre.resultatInterOnnetHP,
      
      // 8 booléens spécifiques
      isEffetClubBaseOffnetHC: updatedOffre.isEffetClubBaseOffnetHC || false,
      isEffetClubBaseOffnetHP: updatedOffre.isEffetClubBaseOffnetHP || false,
      isEffetClubBaseOnnetHC: updatedOffre.isEffetClubBaseOnnetHC || false,
      isEffetClubBaseOnnetHP: updatedOffre.isEffetClubBaseOnnetHP || false,
      isEffetClubInterOffnetHC: updatedOffre.isEffetClubInterOffnetHC || false,
      isEffetClubInterOffnetHP: updatedOffre.isEffetClubInterOffnetHP || false,
      isEffetClubInterOnnetHC: updatedOffre.isEffetClubInterOnnetHC || false,
      isEffetClubInterOnnetHP: updatedOffre.isEffetClubInterOnnetHP || false,
    };

    return this.formatResponse(
      effetClubData,
      'Effet club calculé',
      'L\'effet club et les prix réseaux ont été calculés et sauvegardés avec succès.',
    );
  }

  // Récupérer tous les effets de club avec filtres et pagination
  async getAllEffetsClub(query: EffetClubQueryDto) {
    const {
      page = 1,
      limit = 10,
      operateurId,
      offreId,
      nom,
      typeOffre,
      statut,
      annee,
      dateDebut,
      dateFin,
      isEffetClub,
      effetClubMin,
      effetClubMax,
      sortBy = 'dateDebutValidite',
      sortOrder = 'desc',
    } = query;

    // Construction des filtres WHERE
    const where: any = {};

    // Filtres de base
    if (operateurId) {
      where.operateurId = operateurId;
    }

    if (offreId) {
      where.id = offreId;
    }

    if (nom) {
      where.nom = {
        contains: nom,
        mode: 'insensitive',
      };
    }

    if (typeOffre) {
      where.typeOffre = {
        contains: typeOffre,
        mode: 'insensitive',
      };
    }

    if (statut) {
      where.statut = statut;
    }

    // Filtre par année (basé sur dateDebutValidite)
    if (annee) {
      const dateDebutAnnee = new Date(`${annee}-01-01`);
      const dateFinAnnee = new Date(`${annee}-12-31T23:59:59.999Z`);
      
      where.dateDebutValidite = {
        gte: dateDebutAnnee,
        lte: dateFinAnnee,
      };
    }

    // Filtres par dates personnalisées
    if (dateDebut || dateFin) {
      where.dateDebutValidite = {};
      
      if (dateDebut) {
        where.dateDebutValidite.gte = new Date(dateDebut);
      }
      
      if (dateFin) {
        where.dateDebutValidite.lte = new Date(`${dateFin}T23:59:59.999Z`);
      }
    }

    // Filtre par effet de club
    if (isEffetClub !== undefined) {
      where.isEffetClub = isEffetClub;
    }

    // Filtres par valeur d'effet de club
    if (effetClubMin !== undefined || effetClubMax !== undefined) {
      where.effetClub = {};
      
      if (effetClubMin !== undefined) {
        where.effetClub.gte = effetClubMin;
      }
      
      if (effetClubMax !== undefined) {
        where.effetClub.lte = effetClubMax;
      }
      
      // Ne pas inclure les offres sans effet de club calculé
      where.effetClub.not = null;
    }

    // Calcul de l'offset pour la pagination
    const skip = (page - 1) * limit;

    // Construction de l'ordre de tri
    let orderBy: any = {};
    
    // Champs autorisés pour le tri
    const allowedSortFields = ['nom', 'dateDebutValidite', 'dateFinValidite', 'effetClub', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'dateDebutValidite';
    
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Pour le tri par effet de club, on fait un tri secondaire par ID pour la cohérence
    if (sortField === 'effetClub') {
      orderBy = [
        { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' },
        { id: 'asc' }, // Tri secondaire pour la cohérence
      ];
    }

    // Récupération des données
    const [offres, total] = await Promise.all([
      this.prisma.offre.findMany({
        where,
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.offre.count({ where }),
    ]);

    // Formatage des données pour la réponse
    const effetsClub = offres.map(offre => ({
      id: offre.id,
      nom: offre.nom,
      operateur: offre.operateur,
      annee: new Date(offre.dateDebutValidite).getFullYear(),
      dateDebutValidite: offre.dateDebutValidite,
      dateFinValidite: offre.dateFinValidite,
      typeOffre: offre.typeOffre,
      statut: offre.statut,
      
      // Données globales
      nombreAutresOperateurs: offre.nombreAutresOperateurs,
      prixOnNet: offre.prixOnNet ? Number(offre.prixOnNet) : null,
      prixOffNet: offre.prixOffNet ? Number(offre.prixOffNet) : null,
      effetClub: offre.effetClub ? Number(offre.effetClub) : null,
      isEffetClub: offre.isEffetClub,
      resultat: offre.resultat,
      
      // Tarifs opérateur (8 champs)
      taBaseOperateurOffnetHC: offre.taBaseOperateurOffnetHC ? Number(offre.taBaseOperateurOffnetHC) : null,
      taBaseOperateurOffnetHP: offre.taBaseOperateurOffnetHP ? Number(offre.taBaseOperateurOffnetHP) : null,
      taBaseOperateurOnnetHC: offre.taBaseOperateurOnnetHC ? Number(offre.taBaseOperateurOnnetHC) : null,
      taBaseOperateurOnnetHP: offre.taBaseOperateurOnnetHP ? Number(offre.taBaseOperateurOnnetHP) : null,
      taInterOperateurOffnetHC: offre.taInterOperateurOffnetHC ? Number(offre.taInterOperateurOffnetHC) : null,
      taInterOperateurOffnetHP: offre.taInterOperateurOffnetHP ? Number(offre.taInterOperateurOffnetHP) : null,
      taInterOperateurOnnetHC: offre.taInterOperateurOnnetHC ? Number(offre.taInterOperateurOnnetHC) : null,
      taInterOperateurOnnetHP: offre.taInterOperateurOnnetHP ? Number(offre.taInterOperateurOnnetHP) : null,
      
      // Moyennes (8 champs)
      taMoyenBaseOffnetHC: offre.taMoyenBaseOffnetHC ? Number(offre.taMoyenBaseOffnetHC) : null,
      taMoyenBaseOffnetHP: offre.taMoyenBaseOffnetHP ? Number(offre.taMoyenBaseOffnetHP) : null,
      taMoyenBaseOnnetHC: offre.taMoyenBaseOnnetHC ? Number(offre.taMoyenBaseOnnetHC) : null,
      taMoyenBaseOnnetHP: offre.taMoyenBaseOnnetHP ? Number(offre.taMoyenBaseOnnetHP) : null,
      taMoyenInterOffnetHC: offre.taMoyenInterOffnetHC ? Number(offre.taMoyenInterOffnetHC) : null,
      taMoyenInterOffnetHP: offre.taMoyenInterOffnetHP ? Number(offre.taMoyenInterOffnetHP) : null,
      taMoyenInterOnnetHC: offre.taMoyenInterOnnetHC ? Number(offre.taMoyenInterOnnetHC) : null,
      taMoyenInterOnnetHP: offre.taMoyenInterOnnetHP ? Number(offre.taMoyenInterOnnetHP) : null,
      
      // Sommes (8 champs)
      sommeBaseAutresOperateursOffnetHC: offre.sommeBaseAutresOperateursOffnetHC ? Number(offre.sommeBaseAutresOperateursOffnetHC) : null,
      sommeBaseAutresOperateursOffnetHP: offre.sommeBaseAutresOperateursOffnetHP ? Number(offre.sommeBaseAutresOperateursOffnetHP) : null,
      sommeBaseAutresOperateursOnnetHC: offre.sommeBaseAutresOperateursOnnetHC ? Number(offre.sommeBaseAutresOperateursOnnetHC) : null,
      sommeBaseAutresOperateursOnnetHP: offre.sommeBaseAutresOperateursOnnetHP ? Number(offre.sommeBaseAutresOperateursOnnetHP) : null,
      sommeInterAutresOperateursOffnetHC: offre.sommeInterAutresOperateursOffnetHC ? Number(offre.sommeInterAutresOperateursOffnetHC) : null,
      sommeInterAutresOperateursOffnetHP: offre.sommeInterAutresOperateursOffnetHP ? Number(offre.sommeInterAutresOperateursOffnetHP) : null,
      sommeInterAutresOperateursOnnetHC: offre.sommeInterAutresOperateursOnnetHC ? Number(offre.sommeInterAutresOperateursOnnetHC) : null,
      sommeInterAutresOperateursOnnetHP: offre.sommeInterAutresOperateursOnnetHP ? Number(offre.sommeInterAutresOperateursOnnetHP) : null,
      
      // 8 effets club spécifiques
      effetClubBaseOffnetHC: offre.effetClubBaseOffnetHC ? Number(offre.effetClubBaseOffnetHC) : null,
      effetClubBaseOffnetHP: offre.effetClubBaseOffnetHP ? Number(offre.effetClubBaseOffnetHP) : null,
      effetClubBaseOnnetHC: offre.effetClubBaseOnnetHC ? Number(offre.effetClubBaseOnnetHC) : null,
      effetClubBaseOnnetHP: offre.effetClubBaseOnnetHP ? Number(offre.effetClubBaseOnnetHP) : null,
      effetClubInterOffnetHC: offre.effetClubInterOffnetHC ? Number(offre.effetClubInterOffnetHC) : null,
      effetClubInterOffnetHP: offre.effetClubInterOffnetHP ? Number(offre.effetClubInterOffnetHP) : null,
      effetClubInterOnnetHC: offre.effetClubInterOnnetHC ? Number(offre.effetClubInterOnnetHC) : null,
      effetClubInterOnnetHP: offre.effetClubInterOnnetHP ? Number(offre.effetClubInterOnnetHP) : null,
      
      // 8 résultats spécifiques
      resultatBaseOffnetHC: offre.resultatBaseOffnetHC,
      resultatBaseOffnetHP: offre.resultatBaseOffnetHP,
      resultatBaseOnnetHC: offre.resultatBaseOnnetHC,
      resultatBaseOnnetHP: offre.resultatBaseOnnetHP,
      resultatInterOffnetHC: offre.resultatInterOffnetHC,
      resultatInterOffnetHP: offre.resultatInterOffnetHP,
      resultatInterOnnetHC: offre.resultatInterOnnetHC,
      resultatInterOnnetHP: offre.resultatInterOnnetHP,
      
      // 8 booléens spécifiques
      isEffetClubBaseOffnetHC: offre.isEffetClubBaseOffnetHC || false,
      isEffetClubBaseOffnetHP: offre.isEffetClubBaseOffnetHP || false,
      isEffetClubBaseOnnetHC: offre.isEffetClubBaseOnnetHC || false,
      isEffetClubBaseOnnetHP: offre.isEffetClubBaseOnnetHP || false,
      isEffetClubInterOffnetHC: offre.isEffetClubInterOffnetHC || false,
      isEffetClubInterOffnetHP: offre.isEffetClubInterOffnetHP || false,
      isEffetClubInterOnnetHC: offre.isEffetClubInterOnnetHC || false,
      isEffetClubInterOnnetHP: offre.isEffetClubInterOnnetHP || false,
      
      createdAt: offre.createdAt,
      updatedAt: offre.updatedAt,
    }));

    // ========================================
    // SEGMENTATION EN 8 BLOCS D'EFFET CLUB - TOUTES LES OFFRES AVEC CHAMPS SPÉCIFIQUES
    // ========================================
    
    // Fonction helper pour créer un bloc d'effet club avec TOUTES les offres et leurs champs spécifiques
    const creerBlocEffetClub = (type: string, reseau: string, periode: string, champEffet: string, champResultat: string, champIsEffet: string, champTaOperateur: string, champTaMoyen: string, champSommeAutres: string) => {
      
      // INCLURE TOUTES LES OFFRES avec leurs champs spécifiques à ce type
      const offresAvecChampsSpecifiques = effetsClub.map(offre => ({
        id: offre.id,
        nom: offre.nom,
        operateur: offre.operateur,
        annee: offre.annee,
        dateDebutValidite: offre.dateDebutValidite,
        dateFinValidite: offre.dateFinValidite,
        typeOffre: offre.typeOffre,
        statut: offre.statut,
        
        // Prix globaux (identiques pour tous les blocs)
        nombreAutresOperateurs: offre.nombreAutresOperateurs,
        prixOnNet: offre.prixOnNet,
        prixOffNet: offre.prixOffNet,
        
        // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC
        taOperateur: offre[champTaOperateur],
        taMoyen: offre[champTaMoyen],
        sommeAutresOperateurs: offre[champSommeAutres],
        effetClub: offre[champEffet],
        resultat: offre[champResultat],
        isEffetClub: offre[champIsEffet],
        
        // Calcul de la différence tarifaire pour ce segment
        differentielTarifaire: offre[champTaMoyen] !== null && offre[champTaOperateur] !== null
          ? Number((Number(offre[champTaMoyen]) - Number(offre[champTaOperateur])).toFixed(4))
          : null,
        
        // Métadonnées
        createdAt: offre.createdAt,
        updatedAt: offre.updatedAt,
      }));

      // Calculer les statistiques pour ce type spécifique
      const offresAvecDonnees = offresAvecChampsSpecifiques.filter(offre => offre.effetClub !== null);
      const offresAvecEffetPositif = offresAvecChampsSpecifiques.filter(offre => 
        offre.effetClub !== null && 
        offre.isEffetClub === true &&
        Number(offre.effetClub) > 0
      );
      const offresAvecEffetNegatif = offresAvecChampsSpecifiques.filter(offre => 
        offre.effetClub !== null && 
        (offre.isEffetClub === false || Number(offre.effetClub) <= 0)
      );

      const statistiques = {
        totalOffres: offresAvecChampsSpecifiques.length,
        avecDonnees: offresAvecDonnees.length,
        sansDonnees: offresAvecChampsSpecifiques.length - offresAvecDonnees.length,
        avecEffetClubPositif: offresAvecEffetPositif.length,
        avecEffetClubNegatifOuNul: offresAvecEffetNegatif.length,
        pourcentageEffetPositif: offresAvecDonnees.length > 0 
          ? Number(((offresAvecEffetPositif.length / offresAvecDonnees.length) * 100).toFixed(2))
          : 0,
        // Statistiques sur les valeurs d'effet club
        valeurMoyenne: offresAvecEffetPositif.length > 0 
          ? Number((offresAvecEffetPositif.reduce((sum, offre) => sum + (Number(offre.effetClub) || 0), 0) / offresAvecEffetPositif.length).toFixed(2))
          : 0,
        valeurMin: offresAvecEffetPositif.length > 0 
          ? Number(Math.min(...offresAvecEffetPositif.map(o => Number(o.effetClub) || 0)).toFixed(2))
          : 0,
        valeurMax: offresAvecEffetPositif.length > 0 
          ? Number(Math.max(...offresAvecEffetPositif.map(o => Number(o.effetClub) || 0)).toFixed(2))
          : 0,
      };

      return {
        type,
        reseau,
        periode,
        codeBloc: `${type.toLowerCase()}${reseau}${periode}`,
        description: `Effet club ${type} ${reseau} ${periode}`,
        formule: `effetClub${type}${reseau}${periode} = (prixOffNet - prixOnNet) - (ta${type}Operateur${reseau}${periode} - taMoyen${type}${reseau}${periode})`,
        
        // TOUTES les offres avec leurs champs spécifiques à ce bloc
        offres: offresAvecChampsSpecifiques,
        statistiques,
        
        // Informations supplémentaires
        interpretation: offresAvecEffetPositif.length > 0 
          ? `${offresAvecEffetPositif.length} offre(s) sur ${offresAvecDonnees.length} présente(nt) un effet club positif pour ${type} ${reseau} ${periode}`
          : `Aucune offre ne présente d'effet club positif pour ${type} ${reseau} ${periode} sur ${offresAvecDonnees.length} analysée(s)`,
      };
    };

    // Création des 8 blocs d'effet club avec tous les champs spécifiques
    const blocsEffetClub = [
      creerBlocEffetClub('Base', 'Offnet', 'HC', 'effetClubBaseOffnetHC', 'resultatBaseOffnetHC', 'isEffetClubBaseOffnetHC', 'taBaseOperateurOffnetHC', 'taMoyenBaseOffnetHC', 'sommeBaseAutresOperateursOffnetHC'),
      creerBlocEffetClub('Base', 'Offnet', 'HP', 'effetClubBaseOffnetHP', 'resultatBaseOffnetHP', 'isEffetClubBaseOffnetHP', 'taBaseOperateurOffnetHP', 'taMoyenBaseOffnetHP', 'sommeBaseAutresOperateursOffnetHP'),
      creerBlocEffetClub('Base', 'Onnet', 'HC', 'effetClubBaseOnnetHC', 'resultatBaseOnnetHC', 'isEffetClubBaseOnnetHC', 'taBaseOperateurOnnetHC', 'taMoyenBaseOnnetHC', 'sommeBaseAutresOperateursOnnetHC'),
      creerBlocEffetClub('Base', 'Onnet', 'HP', 'effetClubBaseOnnetHP', 'resultatBaseOnnetHP', 'isEffetClubBaseOnnetHP', 'taBaseOperateurOnnetHP', 'taMoyenBaseOnnetHP', 'sommeBaseAutresOperateursOnnetHP'),
      creerBlocEffetClub('Inter', 'Offnet', 'HC', 'effetClubInterOffnetHC', 'resultatInterOffnetHC', 'isEffetClubInterOffnetHC', 'taInterOperateurOffnetHC', 'taMoyenInterOffnetHC', 'sommeInterAutresOperateursOffnetHC'),
      creerBlocEffetClub('Inter', 'Offnet', 'HP', 'effetClubInterOffnetHP', 'resultatInterOffnetHP', 'isEffetClubInterOffnetHP', 'taInterOperateurOffnetHP', 'taMoyenInterOffnetHP', 'sommeInterAutresOperateursOffnetHP'),
      creerBlocEffetClub('Inter', 'Onnet', 'HC', 'effetClubInterOnnetHC', 'resultatInterOnnetHC', 'isEffetClubInterOnnetHC', 'taInterOperateurOnnetHC', 'taMoyenInterOnnetHC', 'sommeInterAutresOperateursOnnetHC'),
      creerBlocEffetClub('Inter', 'Onnet', 'HP', 'effetClubInterOnnetHP', 'resultatInterOnnetHP', 'isEffetClubInterOnnetHP', 'taInterOperateurOnnetHP', 'taMoyenInterOnnetHP', 'sommeInterAutresOperateursOnnetHP'),
    ];

    // Calcul des statistiques globales
    const totalAvecEffetClub = offres.filter(offre => 
      offre.isEffetClubBaseOffnetHC || offre.isEffetClubBaseOffnetHP || 
      offre.isEffetClubBaseOnnetHC || offre.isEffetClubBaseOnnetHP ||
      offre.isEffetClubInterOffnetHC || offre.isEffetClubInterOffnetHP ||
      offre.isEffetClubInterOnnetHC || offre.isEffetClubInterOnnetHP
    ).length;
    
    const totalSansEffetClub = offres.filter(offre => 
      !offre.isEffetClubBaseOffnetHC && !offre.isEffetClubBaseOffnetHP && 
      !offre.isEffetClubBaseOnnetHC && !offre.isEffetClubBaseOnnetHP &&
      !offre.isEffetClubInterOffnetHC && !offre.isEffetClubInterOffnetHP &&
      !offre.isEffetClubInterOnnetHC && !offre.isEffetClubInterOnnetHP
    ).length;

    // Calcul de la pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Statistiques par bloc
    const statistiquesParBloc = {
      baseOffnetHC: blocsEffetClub[0].statistiques,
      baseOffnetHP: blocsEffetClub[1].statistiques,
      baseOnnetHC: blocsEffetClub[2].statistiques,
      baseOnnetHP: blocsEffetClub[3].statistiques,
      interOffnetHC: blocsEffetClub[4].statistiques,
      interOffnetHP: blocsEffetClub[5].statistiques,
      interOnnetHC: blocsEffetClub[6].statistiques,
      interOnnetHP: blocsEffetClub[7].statistiques,
    };

    const result = {
      // Données brutes (pour compatibilité)
      effetsClub,
      
      // Segmentation en 8 blocs spécialisés
      blocsEffetClub,
      
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      
      // Statistiques globales
      statistiques: {
        totalAvecEffetClub,
        totalSansEffetClub,
        totalCalcule: effetsClub.filter(e => e.effetClub !== null).length,
        totalNonCalcule: effetsClub.filter(e => e.effetClub === null).length,
      },
      
      // Statistiques détaillées par bloc
      statistiquesParBloc,
      
      // Résumé des blocs
      resumeBlocs: {
        totalBlocs: 8,
        blocsAvecDonnees: blocsEffetClub.filter(bloc => bloc.offres.length > 0).length,
        blocsSansDonnees: blocsEffetClub.filter(bloc => bloc.offres.length === 0).length,
      },
    };

    return this.formatResponse(
      result,
      'Effets de club récupérés',
      `${effetsClub.length} effet(s) de club sur ${total} récupéré(s) avec succès.`,
    );
  }

  async calculerEffetsClubToutes() {
    // Récupérer toutes les offres
    const offres = await this.prisma.offre.findMany({
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    const succes: any[] = [];
    const echecs: any[] = [];

    // Traiter chaque offre
    for (const offre of offres) {
      try {
        // Déterminer l'année à partir de la date de début de validité
        const anneeOffre = new Date(offre.dateDebutValidite).getFullYear();

        // Calculer l'effet club
        const champsEffetClub = await this.calculerEffetClub(offre.operateurId, anneeOffre, offre.id);

        if (!champsEffetClub) {
          echecs.push({
            idOffre: offre.id,
            nomOffre: offre.nom,
            operateur: offre.operateur.nom,
            annee: anneeOffre,
            raison: 'Aucune donnée tarifaire trouvée pour cet opérateur et cette année',
          });
          continue;
        }

        // Compter les options pour le message de résultat
        const nombreOptions = await this.prisma.option.count({
          where: { offreId: offre.id },
        });

        // Sauvegarder les résultats dans la base de données
        const updatedOffre = await this.prisma.offre.update({
          where: { id: offre.id },
          data: {
            taBaseOperateurOffnetHC: champsEffetClub.taBaseOperateurOffnetHC || null,
            taBaseOperateurOffnetHP: champsEffetClub.taBaseOperateurOffnetHP || null,
            taBaseOperateurOnnetHC: champsEffetClub.taBaseOperateurOnnetHC || null,
            taBaseOperateurOnnetHP: champsEffetClub.taBaseOperateurOnnetHP || null,
            taInterOperateurOffnetHC: champsEffetClub.taInterOperateurOffnetHC || null,
            taInterOperateurOffnetHP: champsEffetClub.taInterOperateurOffnetHP || null,
            taInterOperateurOnnetHC: champsEffetClub.taInterOperateurOnnetHC || null,
            taInterOperateurOnnetHP: champsEffetClub.taInterOperateurOnnetHP || null,
            taMoyenBaseOffnetHC: champsEffetClub.taMoyenBaseOffnetHC,
            taMoyenBaseOffnetHP: champsEffetClub.taMoyenBaseOffnetHP,
            taMoyenBaseOnnetHC: champsEffetClub.taMoyenBaseOnnetHC,
            taMoyenBaseOnnetHP: champsEffetClub.taMoyenBaseOnnetHP,
            taMoyenInterOffnetHC: champsEffetClub.taMoyenInterOffnetHC,
            taMoyenInterOffnetHP: champsEffetClub.taMoyenInterOffnetHP,
            taMoyenInterOnnetHC: champsEffetClub.taMoyenInterOnnetHC,
            taMoyenInterOnnetHP: champsEffetClub.taMoyenInterOnnetHP,
            sommeBaseAutresOperateursOffnetHC: champsEffetClub.sommeBaseAutresOperateursOffnetHC || null,
            sommeBaseAutresOperateursOnnetHP: champsEffetClub.sommeBaseAutresOperateursOnnetHP || null,
            sommeInterAutresOperateursOffnetHC: champsEffetClub.sommeInterAutresOperateursOffnetHC || null,
            sommeInterAutresOperateursOnnetHP: champsEffetClub.sommeInterAutresOperateursOnnetHP || null,
            nombreAutresOperateurs: champsEffetClub.nombreAutresOperateurs || null,
            prixOnNet: champsEffetClub.prixOnNet || null,
            prixOffNet: champsEffetClub.prixOffNet || null,
            effetClub: champsEffetClub.effetClub || null,
            isEffetClub: champsEffetClub.effetClub !== null && Number(champsEffetClub.effetClub) > 0,
            
            // AJOUT DES 8 EFFETS CLUB SPÉCIFIQUES
            effetClubBaseOffnetHC: champsEffetClub.effetClubBaseOffnetHC || null,
            effetClubBaseOffnetHP: champsEffetClub.effetClubBaseOffnetHP || null,
            effetClubBaseOnnetHC: champsEffetClub.effetClubBaseOnnetHC || null,
            effetClubBaseOnnetHP: champsEffetClub.effetClubBaseOnnetHP || null,
            effetClubInterOffnetHC: champsEffetClub.effetClubInterOffnetHC || null,
            effetClubInterOffnetHP: champsEffetClub.effetClubInterOffnetHP || null,
            effetClubInterOnnetHC: champsEffetClub.effetClubInterOnnetHC || null,
            effetClubInterOnnetHP: champsEffetClub.effetClubInterOnnetHP || null,
            
            // AJOUT DES 8 RÉSULTATS SPÉCIFIQUES
            resultatBaseOffnetHC: champsEffetClub.resultatBaseOffnetHC || null,
            resultatBaseOffnetHP: champsEffetClub.resultatBaseOffnetHP || null,
            resultatBaseOnnetHC: champsEffetClub.resultatBaseOnnetHC || null,
            resultatBaseOnnetHP: champsEffetClub.resultatBaseOnnetHP || null,
            resultatInterOffnetHC: champsEffetClub.resultatInterOffnetHC || null,
            resultatInterOffnetHP: champsEffetClub.resultatInterOffnetHP || null,
            resultatInterOnnetHC: champsEffetClub.resultatInterOnnetHC || null,
            resultatInterOnnetHP: champsEffetClub.resultatInterOnnetHP || null,
            
            // AJOUT DES 8 BOOLÉENS SPÉCIFIQUES
            isEffetClubBaseOffnetHC: champsEffetClub.isEffetClubBaseOffnetHC || false,
            isEffetClubBaseOffnetHP: champsEffetClub.isEffetClubBaseOffnetHP || false,
            isEffetClubBaseOnnetHC: champsEffetClub.isEffetClubBaseOnnetHC || false,
            isEffetClubBaseOnnetHP: champsEffetClub.isEffetClubBaseOnnetHP || false,
            isEffetClubInterOffnetHC: champsEffetClub.isEffetClubInterOffnetHC || false,
            isEffetClubInterOffnetHP: champsEffetClub.isEffetClubInterOffnetHP || false,
            isEffetClubInterOnnetHC: champsEffetClub.isEffetClubInterOnnetHC || false,
            isEffetClubInterOnnetHP: champsEffetClub.isEffetClubInterOnnetHP || false,
            
            resultat: champsEffetClub.effetClub !== null 
              ? `Effet Club calculé: ${Number(champsEffetClub.effetClub).toFixed(4)} (${nombreOptions} options analysées)` 
              : `Données tarifaires mises à jour (${nombreOptions} options analysées - effet club non calculable)`,
          },
        });

        // Compter combien d'effets club positifs parmi les 8
        const effetsClubPositifs = [
          updatedOffre.isEffetClubBaseOffnetHC,
          updatedOffre.isEffetClubBaseOffnetHP,
          updatedOffre.isEffetClubBaseOnnetHC,
          updatedOffre.isEffetClubBaseOnnetHP,
          updatedOffre.isEffetClubInterOffnetHC,
          updatedOffre.isEffetClubInterOffnetHP,
          updatedOffre.isEffetClubInterOnnetHC,
          updatedOffre.isEffetClubInterOnnetHP
        ].filter(Boolean).length;

        // Ajouter aux succès
        succes.push({
          idOffre: updatedOffre.id,
          nomOffre: updatedOffre.nom,
          operateur: offre.operateur.nom,
          annee: anneeOffre,
          prixOnNet: updatedOffre.prixOnNet ? Number(updatedOffre.prixOnNet) : null,
          prixOffNet: updatedOffre.prixOffNet ? Number(updatedOffre.prixOffNet) : null,
          nombreOptions: nombreOptions,
          effetClubGeneral: updatedOffre.effetClub ? Number(updatedOffre.effetClub) : null,
          // Nouveau: détails des 8 effets club
          effetsClubSpecifiques: {
            totalCalcules: 8,
            effetsPositifs: effetsClubPositifs,
            baseOffnetHC: updatedOffre.effetClubBaseOffnetHC ? Number(updatedOffre.effetClubBaseOffnetHC) : null,
            baseOffnetHP: updatedOffre.effetClubBaseOffnetHP ? Number(updatedOffre.effetClubBaseOffnetHP) : null,
            baseOnnetHC: updatedOffre.effetClubBaseOnnetHC ? Number(updatedOffre.effetClubBaseOnnetHC) : null,
            baseOnnetHP: updatedOffre.effetClubBaseOnnetHP ? Number(updatedOffre.effetClubBaseOnnetHP) : null,
            interOffnetHC: updatedOffre.effetClubInterOffnetHC ? Number(updatedOffre.effetClubInterOffnetHC) : null,
            interOffnetHP: updatedOffre.effetClubInterOffnetHP ? Number(updatedOffre.effetClubInterOffnetHP) : null,
            interOnnetHC: updatedOffre.effetClubInterOnnetHC ? Number(updatedOffre.effetClubInterOnnetHC) : null,
            interOnnetHP: updatedOffre.effetClubInterOnnetHP ? Number(updatedOffre.effetClubInterOnnetHP) : null,
          },
          // Indique s'il y a au moins un effet club calculé parmi les 8
          hasEffetClub: updatedOffre.effetClubBaseOffnetHC !== null || updatedOffre.effetClubBaseOffnetHP !== null ||
                        updatedOffre.effetClubBaseOnnetHC !== null || updatedOffre.effetClubBaseOnnetHP !== null ||
                        updatedOffre.effetClubInterOffnetHC !== null || updatedOffre.effetClubInterOffnetHP !== null ||
                        updatedOffre.effetClubInterOnnetHC !== null || updatedOffre.effetClubInterOnnetHP !== null,
        });

      } catch (error) {
        // Ajouter aux échecs
        echecs.push({
          idOffre: offre.id,
          nomOffre: offre.nom,
          operateur: offre.operateur.nom,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          raison: error.message || 'Erreur inconnue lors du calcul',
          erreur: error.message,
        });
      }
    }

    // Calculer les statistiques
    const totalOffres = offres.length;
    const nombreSucces = succes.length;
    const nombreEchecs = echecs.length;
    const pourcentageReussite = totalOffres > 0 ? Math.round((nombreSucces / totalOffres) * 100 * 100) / 100 : 0;

    const result = {
      statistiques: {
        totalOffres,
        succes: nombreSucces,
        echecs: nombreEchecs,
        pourcentageReussite,
      },
      succes: succes.slice(0, 20), // Limiter à 20 pour éviter une réponse trop lourde
      echecs: echecs.slice(0, 20), // Limiter à 20 pour éviter une réponse trop lourde
      ...(succes.length > 20 && { 
        noteSucces: `${succes.length - 20} autres succès non affichés (limite de 20)` 
      }),
      ...(echecs.length > 20 && { 
        noteEchecs: `${echecs.length - 20} autres échecs non affichés (limite de 20)` 
      }),
    };

    return this.formatResponse(
      result,
      'Effets club calculés',
      `Calcul terminé: ${nombreSucces} succès, ${nombreEchecs} échecs sur ${totalOffres} offres`,
    );
  }

  async calculerEffetsClubRevenus() {
    // Récupérer toutes les offres
    const offres = await this.prisma.offre.findMany({
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    const succes: any[] = [];
    const echecs: any[] = [];

    // Traiter chaque offre
    for (const offre of offres) {
      try {
        // Déterminer l'année à partir de la date de début de validité
        const anneeOffre = new Date(offre.dateDebutValidite).getFullYear();

        // **NOUVELLE MÉTHODE** : Calculer l'effet club selon les revenus moyens
        const champsEffetClub = await this.calculerEffetClubSelonRevenus(offre.operateurId, anneeOffre, offre.id);

        if (!champsEffetClub) {
          echecs.push({
            idOffre: offre.id,
            nomOffre: offre.nom,
            operateur: offre.operateur.nom,
            annee: anneeOffre,
            raison: 'Aucune donnée de revenus trouvée pour cet opérateur et cette année',
            erreur: 'Données de revenus manquantes pour le calcul',
            methodeEchouee: 'revenus-moyens'
          });
          continue;
        }

        // Compter les options pour le message de résultat
        const nombreOptions = await this.prisma.option.count({
          where: { offreId: offre.id },
        });

        // Sauvegarder les résultats dans la base de données (REVENUS VERSION - NOUVEAUX CHAMPS)
        const updatedOffre = await this.prisma.offre.update({
          where: { id: offre.id },
          data: {
            taBaseOperateurOffnetHC: champsEffetClub.taBaseOperateurOffnetHC || null,
            taBaseOperateurOffnetHP: champsEffetClub.taBaseOperateurOffnetHP || null,
            taBaseOperateurOnnetHC: champsEffetClub.taBaseOperateurOnnetHC || null,
            taBaseOperateurOnnetHP: champsEffetClub.taBaseOperateurOnnetHP || null,
            taInterOperateurOffnetHC: champsEffetClub.taInterOperateurOffnetHC || null,
            taInterOperateurOffnetHP: champsEffetClub.taInterOperateurOffnetHP || null,
            taInterOperateurOnnetHC: champsEffetClub.taInterOperateurOnnetHC || null,
            taInterOperateurOnnetHP: champsEffetClub.taInterOperateurOnnetHP || null,
            taMoyenBaseOffnetHC: champsEffetClub.taMoyenBaseOffnetHC,
            taMoyenBaseOffnetHP: champsEffetClub.taMoyenBaseOffnetHP,
            taMoyenBaseOnnetHC: champsEffetClub.taMoyenBaseOnnetHC,
            taMoyenBaseOnnetHP: champsEffetClub.taMoyenBaseOnnetHP,
            taMoyenInterOffnetHC: champsEffetClub.taMoyenInterOffnetHC,
            taMoyenInterOffnetHP: champsEffetClub.taMoyenInterOffnetHP,
            taMoyenInterOnnetHC: champsEffetClub.taMoyenInterOnnetHC,
            taMoyenInterOnnetHP: champsEffetClub.taMoyenInterOnnetHP,
            sommeBaseAutresOperateursOffnetHC: champsEffetClub.sommeBaseAutresOperateursOffnetHC || null,
            sommeBaseAutresOperateursOnnetHP: champsEffetClub.sommeBaseAutresOperateursOnnetHP || null,
            sommeInterAutresOperateursOffnetHC: champsEffetClub.sommeInterAutresOperateursOffnetHC || null,
            sommeInterAutresOperateursOnnetHP: champsEffetClub.sommeInterAutresOperateursOnnetHP || null,
            nombreAutresOperateurs: champsEffetClub.nombreAutresOperateurs || null,
            
            // **REVENUS MOYENS** au lieu des prix pour cette API spécifique
            revenuMoyenOnNet: champsEffetClub.revenuMoyenOnNet || null,
            revenuMoyenOffNet: champsEffetClub.revenuMoyenOffNet || null,
            
            // **NOUVEAUX CHAMPS SPÉCIFIQUES AUX REVENUS MOYENS**
            effetClubRevenus: champsEffetClub.effetClub || null,
            isEffetClubRevenus: champsEffetClub.effetClub !== null && Number(champsEffetClub.effetClub) > 0,
            resultatRevenus: champsEffetClub.effetClub !== null 
              ? (Number(champsEffetClub.effetClub) > 0 ? 'Effet Club Positif' : 
                 Number(champsEffetClub.effetClub) < 0 ? 'Effet Club Négatif' : 'Effet Club Neutre')
              : null,
            
            // AJOUT DES 8 EFFETS CLUB SPÉCIFIQUES SELON REVENUS MOYENS
            effetClubRevenuBaseOffnetHC: champsEffetClub.effetClubBaseOffnetHC || null,
            effetClubRevenuBaseOffnetHP: champsEffetClub.effetClubBaseOffnetHP || null,
            effetClubRevenuBaseOnnetHC: champsEffetClub.effetClubBaseOnnetHC || null,
            effetClubRevenuBaseOnnetHP: champsEffetClub.effetClubBaseOnnetHP || null,
            effetClubRevenuInterOffnetHC: champsEffetClub.effetClubInterOffnetHC || null,
            effetClubRevenuInterOffnetHP: champsEffetClub.effetClubInterOffnetHP || null,
            effetClubRevenuInterOnnetHC: champsEffetClub.effetClubInterOnnetHC || null,
            effetClubRevenuInterOnnetHP: champsEffetClub.effetClubInterOnnetHP || null,
            
            // AJOUT DES 8 RÉSULTATS SPÉCIFIQUES SELON REVENUS MOYENS
            resultatRevenuBaseOffnetHC: champsEffetClub.resultatBaseOffnetHC || null,
            resultatRevenuBaseOffnetHP: champsEffetClub.resultatBaseOffnetHP || null,
            resultatRevenuBaseOnnetHC: champsEffetClub.resultatBaseOnnetHC || null,
            resultatRevenuBaseOnnetHP: champsEffetClub.resultatBaseOnnetHP || null,
            resultatRevenuInterOffnetHC: champsEffetClub.resultatInterOffnetHC || null,
            resultatRevenuInterOffnetHP: champsEffetClub.resultatInterOffnetHP || null,
            resultatRevenuInterOnnetHC: champsEffetClub.resultatInterOnnetHC || null,
            resultatRevenuInterOnnetHP: champsEffetClub.resultatInterOnnetHP || null,
            
            // AJOUT DES 8 BOOLÉENS SPÉCIFIQUES SELON REVENUS MOYENS
            isEffetClubRevenuBaseOffnetHC: champsEffetClub.isEffetClubBaseOffnetHC || false,
            isEffetClubRevenuBaseOffnetHP: champsEffetClub.isEffetClubBaseOffnetHP || false,
            isEffetClubRevenuBaseOnnetHC: champsEffetClub.isEffetClubBaseOnnetHC || false,
            isEffetClubRevenuBaseOnnetHP: champsEffetClub.isEffetClubBaseOnnetHP || false,
            isEffetClubRevenuInterOffnetHC: champsEffetClub.isEffetClubInterOffnetHC || false,
            isEffetClubRevenuInterOffnetHP: champsEffetClub.isEffetClubInterOffnetHP || false,
            isEffetClubRevenuInterOnnetHC: champsEffetClub.isEffetClubInterOnnetHC || false,
            isEffetClubRevenuInterOnnetHP: champsEffetClub.isEffetClubInterOnnetHP || false,
            
            resultat: champsEffetClub.effetClub !== null 
              ? `Effet Club calculé (revenus): ${Number(champsEffetClub.effetClub).toFixed(4)} (${nombreOptions} options analysées)` 
              : `Données tarifaires mises à jour (revenus) - ${nombreOptions} options analysées - effet club non calculable)`,
          },
        });

        // Compter combien d'effets club positifs parmi les 8 SELON REVENUS MOYENS
        const effetsClubPositifs = [
          updatedOffre.isEffetClubRevenuBaseOffnetHC,
          updatedOffre.isEffetClubRevenuBaseOffnetHP,
          updatedOffre.isEffetClubRevenuBaseOnnetHC,
          updatedOffre.isEffetClubRevenuBaseOnnetHP,
          updatedOffre.isEffetClubRevenuInterOffnetHC,
          updatedOffre.isEffetClubRevenuInterOffnetHP,
          updatedOffre.isEffetClubRevenuInterOnnetHC,
          updatedOffre.isEffetClubRevenuInterOnnetHP
        ].filter(Boolean).length;

        // Ajouter aux succès
        succes.push({
          idOffre: updatedOffre.id,
          nomOffre: updatedOffre.nom,
          operateur: offre.operateur.nom,
          annee: anneeOffre,
          // **REVENUS MOYENS** pour cette API spécifique
          revenuMoyenOnNet: updatedOffre.revenuMoyenOnNet ? Number(updatedOffre.revenuMoyenOnNet) : null,
          revenuMoyenOffNet: updatedOffre.revenuMoyenOffNet ? Number(updatedOffre.revenuMoyenOffNet) : null,
          nombreOptions: nombreOptions,
          // **EFFET CLUB SELON REVENUS MOYENS**
          effetClubGeneral: updatedOffre.effetClubRevenus ? Number(updatedOffre.effetClubRevenus) : null,
          // Nouveau: détails des 8 effets club SELON REVENUS MOYENS
          effetsClubSpecifiques: {
            totalCalcules: 8,
            effetsPositifs: effetsClubPositifs,
            baseOffnetHC: updatedOffre.effetClubRevenuBaseOffnetHC ? Number(updatedOffre.effetClubRevenuBaseOffnetHC) : null,
            baseOffnetHP: updatedOffre.effetClubRevenuBaseOffnetHP ? Number(updatedOffre.effetClubRevenuBaseOffnetHP) : null,
            baseOnnetHC: updatedOffre.effetClubRevenuBaseOnnetHC ? Number(updatedOffre.effetClubRevenuBaseOnnetHC) : null,
            baseOnnetHP: updatedOffre.effetClubRevenuBaseOnnetHP ? Number(updatedOffre.effetClubRevenuBaseOnnetHP) : null,
            interOffnetHC: updatedOffre.effetClubRevenuInterOffnetHC ? Number(updatedOffre.effetClubRevenuInterOffnetHC) : null,
            interOffnetHP: updatedOffre.effetClubRevenuInterOffnetHP ? Number(updatedOffre.effetClubRevenuInterOffnetHP) : null,
            interOnnetHC: updatedOffre.effetClubRevenuInterOnnetHC ? Number(updatedOffre.effetClubRevenuInterOnnetHC) : null,
            interOnnetHP: updatedOffre.effetClubRevenuInterOnnetHP ? Number(updatedOffre.effetClubRevenuInterOnnetHP) : null,
          },
          methodeUtilisee: 'revenus-moyens',
          // Indique s'il y a au moins un effet club calculé parmi les 8 SELON REVENUS MOYENS
          hasEffetClub: updatedOffre.effetClubRevenuBaseOffnetHC !== null || updatedOffre.effetClubRevenuBaseOffnetHP !== null ||
                        updatedOffre.effetClubRevenuBaseOnnetHC !== null || updatedOffre.effetClubRevenuBaseOnnetHP !== null ||
                        updatedOffre.effetClubRevenuInterOffnetHC !== null || updatedOffre.effetClubRevenuInterOffnetHP !== null ||
                        updatedOffre.effetClubRevenuInterOnnetHC !== null || updatedOffre.effetClubRevenuInterOnnetHP !== null,
        });

      } catch (error) {
        // Ajouter aux échecs
        echecs.push({
          idOffre: offre.id,
          nomOffre: offre.nom,
          operateur: offre.operateur.nom,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          raison: error.message || 'Erreur inconnue lors du calcul avec méthode revenus',
          erreur: error.message,
          methodeEchouee: 'revenus-moyens'
        });
      }
    }

    // Statistiques finales
    const totalOffres = offres.length;
    const nombreSucces = succes.length;
    const nombreEchecs = echecs.length;
    const pourcentageReussite = totalOffres > 0 ? Number(((nombreSucces / totalOffres) * 100).toFixed(2)) : 0;

    // Calculer le total d'effets club positifs
    const totalEffetsClubPositifs = succes.reduce((total, offre) => {
      return total + (offre.effetsClubSpecifiques?.effetsPositifs || 0);
    }, 0);

    const moyenneEffetsClubParOffre = nombreSucces > 0 ? Number((totalEffetsClubPositifs / nombreSucces).toFixed(2)) : 0;

    // Préparer le résultat final
    const result = {
      statistiques: {
        totalOffres,
        succes: nombreSucces,
        echecs: nombreEchecs,
        pourcentageReussite,
        totalEffetsClubPositifs,
        moyenneEffetsClubParOffre,
        methodeCalcul: 'revenus-moyens'
      },
      succes: succes.slice(0, 50), // Limiter à 50 pour éviter les réponses trop lourdes
      echecs: echecs.slice(0, 20), // Limiter à 20 échecs
      ...(succes.length > 50 && { 
        noteSucces: `${succes.length - 50} autres succès non affichés (limite de 50)` 
      }),
      ...(echecs.length > 20 && { 
        noteEchecs: `${echecs.length - 20} autres échecs non affichés (limite de 20)` 
      }),
    };

    return this.formatResponse(
      result,
      'Effets club calculés (revenus)',
      `Calcul terminé (méthode revenus): ${nombreSucces} succès, ${nombreEchecs} échecs sur ${totalOffres} offres`,
    );
  }

  // 📋 NOUVELLE MÉTHODE: Liste tous les effets club selon les revenus moyens
  async getAllEffetsClubRevenusMoyens(query: EffetClubQueryDto) {
    const {
      page = 1,
      limit = 10,
      operateurId,
      offreId,
      nom,
      typeOffre,
      statut,
      annee,
      dateDebut,
      dateFin,
      isEffetClub,
      effetClubMin,
      effetClubMax,
      sortBy = 'dateDebutValidite',
      sortOrder = 'desc',
    } = query;

    // Construction des filtres WHERE (identique à la méthode standard)
    const where: any = {};

    if (operateurId) {
      where.operateurId = operateurId;
    }

    if (offreId) {
      where.id = offreId;
    }

    if (nom) {
      where.nom = {
        contains: nom,
        mode: 'insensitive',
      };
    }

    if (typeOffre) {
      where.typeOffre = typeOffre;
    }

    if (statut) {
      where.statut = statut;
    }

    if (annee) {
      where.annee = annee;
    }

    if (dateDebut || dateFin) {
      where.dateDebutValidite = {};
      if (dateDebut) {
        where.dateDebutValidite.gte = new Date(dateDebut);
      }
      if (dateFin) {
        where.dateDebutValidite.lte = new Date(dateFin);
      }
    }

    // Filtres spécifiques aux effets club (selon revenus moyens - CHAMPS SPÉCIFIQUES)
    if (typeof isEffetClub === 'boolean') {
      // Pour la méthode revenus, on utilise le champ isEffetClubRevenus au lieu de isEffetClub
      where.isEffetClubRevenus = isEffetClub;
    }

    if (effetClubMin !== undefined || effetClubMax !== undefined) {
      where.effetClubRevenus = {};
      
      if (effetClubMin !== undefined) {
        where.effetClubRevenus.gte = effetClubMin;
      }
      
      if (effetClubMax !== undefined) {
        where.effetClubRevenus.lte = effetClubMax;
      }
      
      // Ne pas inclure les offres sans effet de club calculé selon les revenus moyens
      where.effetClubRevenus.not = null;
    }

    // Calcul de l'offset pour la pagination
    const skip = (page - 1) * limit;

    // Construction de l'ordre de tri
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    try {
      // Requête principale avec pagination
      const [offres, total] = await Promise.all([
        this.prisma.offre.findMany({
          where,
          include: {
            operateur: {
              select: {
                id: true,
                nom: true,
                code: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.offre.count({ where }),
      ]);

      // 🎯 ORGANISATION PAR BLOCS (8 segments d'effet club selon revenus moyens)
      const blocsEffetsClub = [
        {
          type: 'Base',
          reseau: 'Onnet',
          periode: 'HC',
          codeBloc: 'baseOnnetHC',
          description: 'Effet club Base Onnet HC (revenus moyens)',
          formule: 'effetClubBaseOnnetHC = (revenuMoyenOffNet - revenuMoyenOnNet) - (taBaseOperateurOnnetHC - taMoyenBaseOnnetHC)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Base',
          reseau: 'Onnet',
          periode: 'HP',
          codeBloc: 'baseOnnetHP',
          description: 'Effet club Base Onnet HP (revenus moyens)',
          formule: 'effetClubBaseOnnetHP = (revenuMoyenOffNet - revenuMoyenOnNet) - (taBaseOperateurOnnetHP - taMoyenBaseOnnetHP)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Base',
          reseau: 'Offnet',
          periode: 'HC',
          codeBloc: 'baseOffnetHC',
          description: 'Effet club Base Offnet HC (revenus moyens)',
          formule: 'effetClubBaseOffnetHC = (revenuMoyenOffNet - revenuMoyenOnNet) - (taBaseOperateurOffnetHC - taMoyenBaseOffnetHC)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Base',
          reseau: 'Offnet',
          periode: 'HP',
          codeBloc: 'baseOffnetHP',
          description: 'Effet club Base Offnet HP (revenus moyens)',
          formule: 'effetClubBaseOffnetHP = (revenuMoyenOffNet - revenuMoyenOnNet) - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Inter',
          reseau: 'Onnet',
          periode: 'HC',
          codeBloc: 'interOnnetHC',
          description: 'Effet club Inter Onnet HC (revenus moyens)',
          formule: 'effetClubInterOnnetHC = (revenuMoyenOffNet - revenuMoyenOnNet) - (taInterOperateurOnnetHC - taMoyenInterOnnetHC)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Inter',
          reseau: 'Onnet',
          periode: 'HP',
          codeBloc: 'interOnnetHP',
          description: 'Effet club Inter Onnet HP (revenus moyens)',
          formule: 'effetClubInterOnnetHP = (revenuMoyenOffNet - revenuMoyenOnNet) - (taInterOperateurOnnetHP - taMoyenInterOnnetHP)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Inter',
          reseau: 'Offnet',
          periode: 'HC',
          codeBloc: 'interOffnetHC',
          description: 'Effet club Inter Offnet HC (revenus moyens)',
          formule: 'effetClubInterOffnetHC = (revenuMoyenOffNet - revenuMoyenOnNet) - (taInterOperateurOffnetHC - taMoyenInterOffnetHC)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
        {
          type: 'Inter',
          reseau: 'Offnet',
          periode: 'HP',
          codeBloc: 'interOffnetHP',
          description: 'Effet club Inter Offnet HP (revenus moyens)',
          formule: 'effetClubInterOffnetHP = (revenuMoyenOffNet - revenuMoyenOnNet) - (taInterOperateurOffnetHP - taMoyenInterOffnetHP)',
          offres: [] as any[],
          statistiques: {
            totalOffres: 0,
            avecDonnees: 0,
            sansDonnees: 0,
            avecEffetClubPositif: 0,
            avecEffetClubNegatifOuNul: 0,
            pourcentageEffetPositif: 0,
            valeurMoyenne: 0,
            valeurMin: 0,
            valeurMax: 0,
          },
          interpretation: '',
        },
      ];

      // 🔄 ORGANISATION DES OFFRES PAR BLOC (selon revenus moyens - TOUTES LES OFFRES)
      for (const offre of offres) {
        // Préparer les champs communs de revenus moyens pour toutes les utilisations
        const champsRevenusMoyensCommuns = {
          // 🎯 CHAMPS SPÉCIFIQUES REVENUS MOYENS (au lieu des prix)
          revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
          revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
          sommeFraisSouscription: Number(offre.sommeFraisSouscription) || 0,
          sommeTraficGratuit: Number(offre.sommeTraficGratuit) || 0,
          sommeTraficOption: Number(offre.sommeTraficOption) || 0,
        };

        // Pour chaque bloc, on ajoute TOUTES LES OFFRES avec leurs champs spécifiques (comme l'API standard)
        
        // Bloc 1: Base Onnet HC (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[0].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE ONNET HC
          taOperateur: Number(offre.taBaseOperateurOnnetHC) || 0,
          taMoyen: Number(offre.taMoyenBaseOnnetHC) || 0,
          sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOnnetHC) || 0,
          effetClub: Number(offre.effetClubRevenuBaseOnnetHC) || null,
          resultat: offre.resultatRevenuBaseOnnetHC || null,
          isEffetClub: offre.isEffetClubRevenuBaseOnnetHC || false,
          differentielTarifaire: (Number(offre.taMoyenBaseOnnetHC) || 0) - (Number(offre.taBaseOperateurOnnetHC) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 2: Base Onnet HP (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[1].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE ONNET HP
          taOperateur: Number(offre.taBaseOperateurOnnetHP) || 0,
          taMoyen: Number(offre.taMoyenBaseOnnetHP) || 0,
          sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOnnetHP) || 0,
          effetClub: Number(offre.effetClubRevenuBaseOnnetHP) || null,
          resultat: offre.resultatRevenuBaseOnnetHP || null,
          isEffetClub: offre.isEffetClubRevenuBaseOnnetHP || false,
          differentielTarifaire: (Number(offre.taMoyenBaseOnnetHP) || 0) - (Number(offre.taBaseOperateurOnnetHP) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 3: Base Offnet HC (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[2].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE OFFNET HC
          taOperateur: Number(offre.taBaseOperateurOffnetHC) || 0,
          taMoyen: Number(offre.taMoyenBaseOffnetHC) || 0,
          sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOffnetHC) || 0,
          effetClub: Number(offre.effetClubRevenuBaseOffnetHC) || null,
          resultat: offre.resultatRevenuBaseOffnetHC || null,
          isEffetClub: offre.isEffetClubRevenuBaseOffnetHC || false,
          differentielTarifaire: (Number(offre.taMoyenBaseOffnetHC) || 0) - (Number(offre.taBaseOperateurOffnetHC) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 4: Base Offnet HP (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[3].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - BASE OFFNET HP
          taOperateur: Number(offre.taBaseOperateurOffnetHP) || 0,
          taMoyen: Number(offre.taMoyenBaseOffnetHP) || 0,
          sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOffnetHP) || 0,
          effetClub: Number(offre.effetClubRevenuBaseOffnetHP) || null,
          resultat: offre.resultatRevenuBaseOffnetHP || null,
          isEffetClub: offre.isEffetClubRevenuBaseOffnetHP || false,
          differentielTarifaire: (Number(offre.taMoyenBaseOffnetHP) || 0) - (Number(offre.taBaseOperateurOffnetHP) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 5: Inter Onnet HC (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[4].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - INTER ONNET HC
          taOperateur: Number(offre.taInterOperateurOnnetHC) || 0,
          taMoyen: Number(offre.taMoyenInterOnnetHC) || 0,
          sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOnnetHC) || 0,
          effetClub: Number(offre.effetClubRevenuInterOnnetHC) || null,
          resultat: offre.resultatRevenuInterOnnetHC || null,
          isEffetClub: offre.isEffetClubRevenuInterOnnetHC || false,
          differentielTarifaire: (Number(offre.taMoyenInterOnnetHC) || 0) - (Number(offre.taInterOperateurOnnetHC) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 6: Inter Onnet HP (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[5].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - INTER ONNET HP
          taOperateur: Number(offre.taInterOperateurOnnetHP) || 0,
          taMoyen: Number(offre.taMoyenInterOnnetHP) || 0,
          sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOnnetHP) || 0,
          effetClub: Number(offre.effetClubRevenuInterOnnetHP) || null,
          resultat: offre.resultatRevenuInterOnnetHP || null,
          isEffetClub: offre.isEffetClubRevenuInterOnnetHP || false,
          differentielTarifaire: (Number(offre.taMoyenInterOnnetHP) || 0) - (Number(offre.taInterOperateurOnnetHP) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 7: Inter Offnet HC (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[6].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - INTER OFFNET HC
          taOperateur: Number(offre.taInterOperateurOffnetHC) || 0,
          taMoyen: Number(offre.taMoyenInterOffnetHC) || 0,
          sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOffnetHC) || 0,
          effetClub: Number(offre.effetClubRevenuInterOffnetHC) || null,
          resultat: offre.resultatRevenuInterOffnetHC || null,
          isEffetClub: offre.isEffetClubRevenuInterOffnetHC || false,
          differentielTarifaire: (Number(offre.taMoyenInterOffnetHC) || 0) - (Number(offre.taInterOperateurOffnetHC) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });

        // Bloc 8: Inter Offnet HP (REVENUS MOYENS) - TOUTES LES OFFRES
        blocsEffetsClub[7].offres.push({
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          annee: new Date(offre.dateDebutValidite).getFullYear(),
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          
          // Données globales communes (revenus moyens)
          nombreAutresOperateurs: offre.nombreAutresOperateurs,
          ...champsRevenusMoyensCommuns,
          
          // 🎯 CHAMPS SPÉCIFIQUES À CE BLOC - INTER OFFNET HP
          taOperateur: Number(offre.taInterOperateurOffnetHP) || 0,
          taMoyen: Number(offre.taMoyenInterOffnetHP) || 0,
          sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOffnetHP) || 0,
          effetClub: Number(offre.effetClubRevenuInterOffnetHP) || null,
          resultat: offre.resultatRevenuInterOffnetHP || null,
          isEffetClub: offre.isEffetClubRevenuInterOffnetHP || false,
          differentielTarifaire: (Number(offre.taMoyenInterOffnetHP) || 0) - (Number(offre.taInterOperateurOffnetHP) || 0),
          methodeCalcul: 'revenus_moyens',
          
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
        });
      }

      // 📊 CALCUL DES STATISTIQUES POUR CHAQUE BLOC (identique à l'API standard)
      for (const bloc of blocsEffetsClub) {
        // Statistiques basées sur les offres paginées du bloc
        const offresAvecDonnees = bloc.offres.filter((offre: any) => offre.effetClub !== null);
        const offresAvecEffetPositif = bloc.offres.filter((offre: any) => 
          offre.effetClub !== null && 
          offre.isEffetClub === true &&
          Number(offre.effetClub) > 0
        );
        const offresAvecEffetNegatif = bloc.offres.filter((offre: any) => 
          offre.effetClub !== null && 
          (offre.isEffetClub === false || Number(offre.effetClub) <= 0)
        );
        const valeursEffetClub = offresAvecDonnees.map((offre: any) => Number(offre.effetClub));

        bloc.statistiques.totalOffres = bloc.offres.length; // Nombre d'offres paginées
        bloc.statistiques.avecDonnees = offresAvecDonnees.length;
        bloc.statistiques.sansDonnees = bloc.offres.length - offresAvecDonnees.length;
        bloc.statistiques.avecEffetClubPositif = offresAvecEffetPositif.length;
        bloc.statistiques.avecEffetClubNegatifOuNul = offresAvecEffetNegatif.length;
        
        if (offresAvecDonnees.length > 0) {
          bloc.statistiques.pourcentageEffetPositif = Math.round(
            (offresAvecEffetPositif.length / offresAvecDonnees.length) * 100 * 100
          ) / 100; // Arrondi à 2 décimales
        }

        if (valeursEffetClub.length > 0) {
          bloc.statistiques.valeurMoyenne = Math.round(
            valeursEffetClub.reduce((sum, val) => sum + val, 0) / valeursEffetClub.length * 100
          ) / 100;
          bloc.statistiques.valeurMin = Math.round(Math.min(...valeursEffetClub) * 100) / 100;
          bloc.statistiques.valeurMax = Math.round(Math.max(...valeursEffetClub) * 100) / 100;
        }

        // Interprétation selon revenus moyens (identique au format standard)
        if (offresAvecEffetPositif.length > 0) {
          bloc.interpretation = `${offresAvecEffetPositif.length} offre(s) sur ${offresAvecDonnees.length} présente(nt) un effet club positif pour ${bloc.description} (méthode revenus moyens)`;
        } else if (offresAvecDonnees.length > 0) {
          bloc.interpretation = `Aucune offre ne présente d'effet club positif pour ${bloc.description} sur ${offresAvecDonnees.length} offre(s) analysée(s) (méthode revenus moyens)`;
        } else {
          bloc.interpretation = `Aucune donnée disponible pour ${bloc.description} (méthode revenus moyens)`;
        }
      }

      // Informations de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const result = {
        effetsClub: blocsEffetsClub,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filtres: {
          operateurId,
          offreId,
          nom,
          typeOffre,
          statut,
          annee,
          dateDebut,
          dateFin,
          isEffetClub,
          effetClubMin,
          effetClubMax,
        },
        tri: {
          sortBy,
          sortOrder,
        },
        metadata: {
          methodeCalcul: 'revenus_moyens', // 🎯 INDICATEUR GLOBAL
          description: 'Analyse des effets club basée sur les revenus moyens',
          nombreBlocsAnalyses: 8,
          segmentation: 'Base/Inter × OnNet/OffNet × HC/HP',
          formuleGenerique: 'effetClub = (revenuMoyenOffNet - revenuMoyenOnNet) - (taOperateur - taMoyen)',
        },
      };

      return this.formatResponse(
        result,
        'Liste des effets club (revenus moyens)',
        `${total} offre(s) trouvée(s) avec analyse par revenus moyens sur ${blocsEffetsClub.length} segments`,
      );

    } catch (error) {
      console.error('Erreur lors de la récupération des effets club (revenus moyens):', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des effets club selon revenus moyens'
      );
    }
  }
}
