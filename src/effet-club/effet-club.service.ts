import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EffetClubFilterDto } from './dto/effet-club-filter.dto';

  /**
 * Types d'offre autorisés
 */
export type TypeOffre = 'OFFNET' | 'ONNET';
export type TypeHeure = 'CREUSE' | 'PLEINE';
export type TypeCalcule = 'BASE' | 'INTERCONNEXION' | 'REVENUS_BASE' | 'REVENUS_INTERCONNEXION';

/**
 * Mapping métier → StructureTarifaire.nom
 */
const STRUCTURE_TARIFAIRE = {
  OFFNET: 'Tarif minute Off-Net – Hors gratuité (TF Offnet)',
  ONNET: 'Tarif minute On-Net – Hors gratuité (TF OnNet)',
} as const;

const TARIF_COLUMN_MAP = {
  OFFNET: {
    CREUSE: 'tarifOffNetHeureCreuse',
    PLEINE: 'tarifOffNetHeurePleine',
  },
  ONNET: {
    CREUSE: 'tarifOnNetHeureCreuse',
    PLEINE: 'tarifOnNetHeurePleine',
  },
} as const;

const TYPE_TARIF_MAP = {
  BASE: 'Base',
  INTERCONNEXION: 'Interconnexion',
} as const;




@Injectable()
export class EffetClubService {
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



  // async calculateEffetDeClub(
  //   operateurId: number,
  //   offreId: number,
  //   typeOffre: TypeOffre,      // utilisé pour TB / TA
  //   typeHeure: TypeHeure,
  //   typeCalcule: TypeCalcule,
  //   annee: number,
  // ) {
  //   // // 1️⃣ Calcul TF OFFNET et ONNET (toujours les deux)
  //   // const tfOffnet = await this.calculateTF(
  //   //   operateurId,
  //   //   offreId,
  //   //   'OFFNET',
  //   // );
  //   // const tfOnnet = await this.calculateTF(
  //   //   operateurId,
  //   //   offreId,
  //   //   'ONNET',
  //   // );
  //   // const calcul1 = tfOffnet - tfOnnet;

  //   // 🔹 TF OFFNET / ONNET optimisé
  //   const { tfOffnet, tfOnnet } = await this.calculateTFOptimized(operateurId, offreId);
  //   const calcul1 = tfOffnet - tfOnnet;

  //   // // 2️⃣ Calcul TB/TA moyen (marché) et TB/TA opérateur
  //   // const tbOrTaMoyen = await this.calculateTBorTAMoyen(
  //   //   operateurId,
  //   //   typeOffre,
  //   //   typeHeure,
  //   //   typeCalcule,
  //   //   annee,
  //   // );
  //   // const tbOrTaOperateur = await this.TBorTAoperateur(
  //   //   operateurId,
  //   //   typeOffre,
  //   //   typeHeure,
  //   //   typeCalcule,
  //   //   annee,
  //   // );
  //   // const calcul2 = tbOrTaMoyen - tbOrTaOperateur;

    
  //   // 🔹 TB / TA marché + opérateur optimisé
  //   const { tbOrTaMoyen, tbOrTaOperateur } = await this.calculateTBandTA(
  //     operateurId, typeOffre, typeHeure, typeCalcule, annee
  //   );
  //   const calcul2 = tbOrTaMoyen - tbOrTaOperateur;

  //   // // 3️⃣ Effet de club
  //   // const effetClubValeur = calcul1 - calcul2;
  //   // const effetClubPresent = calcul1 > calcul2;

  //   // 🔹 Effet de club
  //   const effetClubValeur = Math.round((calcul1 - calcul2) * 100) / 100;
  //   const effetClubPresent = calcul1 > calcul2;

  //   // 4️⃣ Retour structuré (audit / reporting)
  //   return this.formatResponse(
  //     {
  //       "filtres": {
  //         operateurId,
  //         offreId,
  //         annee,
  //         typeOffre,
  //         typeHeure,
  //         typeCalcule,
  //       },

  //       tfOrRmOffnet: Number(tfOffnet.toFixed(2)),
  //       tfOrRmOnnet: Number(tfOnnet.toFixed(2)),
  //       // ecartTF: Number(calcul1.toFixed(2)),

  //       tbOrTaMoyen: Number(tbOrTaMoyen.toFixed(2)),
  //       tbOrTaOperateur: Number(tbOrTaOperateur.toFixed(2)),
  //       // ecartTBorTA: Number(calcul2.toFixed(2)),

  //       effetClubValeur: Number(effetClubValeur.toFixed(2)),
  //       effetClubPresent, // true / false
  //     },
  //     "Effet club (Base - HP - Offnet)",
  //     "Effet club récupéré pour l'offre",
  //   );
  // }
  // async calculateEffetDeClubOptimized(
  //   operateurId: number,
  //   offreId: number,
  //   typeOffre: TypeOffre,
  //   typeHeure: TypeHeure,
  //   typeCalcule: TypeCalcule,
  //   annee: number,
  // ) {
  //   // 🔹 Lancer les calculs en parallèle
  //   const [
  //     { tfOffnet, tfOnnet },
  //     { tbOrTaMoyen, tbOrTaOperateur },
  //   ] = await Promise.all([
  //     this.calculateTFOptimized(operateurId, offreId), // TF OFFNET / ONNET
  //     this.calculateTBandTA(operateurId, typeOffre, typeHeure, typeCalcule, annee), // TB/TAMoyen + TB/TA opérateur
  //   ]);

  //   // 🔹 Calculs intermédiaires
  //   const calcul1 = tfOffnet - tfOnnet;
  //   const calcul2 = tbOrTaMoyen - tbOrTaOperateur;
  //   const effetClubValeur = Math.round((calcul1 - calcul2) * 100) / 100;
    
  //   // 🔹 Détermination du résultat boolean
  //   const effetClubPresent = calcul1 > calcul2;
  //   // 🔹 Détermination du résultat textuel
  //   const result = effetClubPresent ? "EFFET DE CLUB" : "PAS D'EFFET DE CLUB";

  //   // 🔹 Retour structuré
  //   return this.formatResponse(
  //     {
  //       filtres: { operateurId, offreId, annee, typeOffre, typeHeure, typeCalcule },

  //       tfOrRmOffnet: Math.round(tfOffnet * 100) / 100,
  //       tfOrRmOnnet: Math.round(tfOnnet * 100) / 100,
  //       ecartTF: Math.round(calcul1 * 100) / 100,

  //       tbOrTaMoyen: Math.round(tbOrTaMoyen * 100) / 100,
  //       tbOrTaOperateur: Math.round(tbOrTaOperateur * 100) / 100,
  //       ecartTBorTA: Math.round(calcul2 * 100) / 100,

  //       effetClubValeur,
  //       effetClubPresent,
  //       result, // <-- nouveau champ
  //     },
  //     'Effet club',
  //     'Effet club récupéré pour l\'offre',
  //   );
  // }
  async calculateEffetDeClubOptimized(
    operateurId: number,
    offreId: number,
    typeOffre: TypeOffre,
    typeHeure: TypeHeure,
    typeCalcule: TypeCalcule,
    annee: number,
  ) {
    // 🔹 Validation stricte des paramètres
    if (
      operateurId == null ||
      offreId == null ||
      !typeOffre ||
      !typeHeure ||
      !typeCalcule ||
      annee == null
    ) {
      throw new BadRequestException(
        'Tous les paramètres sont requis : operateurId, offreId, typeOffre, typeHeure, typeCalcule, annee',
      );
    }

    // 🔹 Validation typeOffre (seulement OFFNET ou ONNET)
    const valeursTypeOffre: TypeOffre[] = ['OFFNET', 'ONNET'];
    if (!valeursTypeOffre.includes(typeOffre)) {
      throw new BadRequestException(
        `typeOffre invalide : "${typeOffre}". Valeurs acceptées : OFFNET, ONNET`,
      );
    }

    // 🔹 Validation typeHeure (seulement CREUSE ou PLEINE)
    const valeursTypeHeure: TypeHeure[] = ['CREUSE', 'PLEINE'];
    if (!valeursTypeHeure.includes(typeHeure)) {
      throw new BadRequestException(
        `typeHeure invalide : "${typeHeure}". Valeurs acceptées : CREUSE, PLEINE`,
      );
    }

    // 🔹 Validation typeCalcule (seulement les 4 valeurs)
    const valeursTypeCalcule: TypeCalcule[] = ['BASE', 'INTERCONNEXION', 'REVENUS_BASE', 'REVENUS_INTERCONNEXION'];
    if (!valeursTypeCalcule.includes(typeCalcule)) {
      throw new BadRequestException(
        `typeCalcule invalide : "${typeCalcule}". Valeurs acceptées : BASE, INTERCONNEXION, REVENUS_BASE, REVENUS_INTERCONNEXION`,
      );
    }

    // 🔹 Validation annee (doit contenir 4 chiffres)
    const anneeStr = annee.toString();
    if (!/^\d{4}$/.test(anneeStr)) {
      throw new BadRequestException(
        `annee invalide : "${annee}". L'année doit contenir exactement 4 chiffres (exemple : 2025)`,
      );
    }

    // 🔹 Vérifier que l'offre existe et appartient à l'opérateur
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: {
        id: true,
        operateurId: true,
        nom: true,
        revenuMoyenOnNet: true,
        revenuMoyenOffNet: true,
        options: {
          select: { id: true },
        },
      },
    });

    if (!offre) {
      throw new NotFoundException(
        `L'offre avec l'ID ${offreId} n'existe pas dans la base de données`,
      );
    }

    if (offre.operateurId !== operateurId) {
      throw new BadRequestException(
        `L'offre "${offre.nom}" (ID: ${offreId}) n'appartient pas à l'opérateur avec l'ID ${operateurId}. Cette offre appartient à l'opérateur ID: ${offre.operateurId}`,
      );
    }

    // 🔹 Déterminer si on utilise les revenus moyens ou les tarifs faciaux
    const useRevenusMoyens = typeCalcule === 'REVENUS_BASE' || typeCalcule === 'REVENUS_INTERCONNEXION';

    let tfOrRmOffnet: number;
    let tfOrRmOnnet: number;

    if (useRevenusMoyens) {
      // Calculer le revenu moyen OffNet
      const rmOffnet = await this.calculerRevenuMoyen(operateurId, offreId, 'OFFNET');
      // Calculer le revenu moyen OnNet
      const rmOnnet = await this.calculerRevenuMoyen(operateurId, offreId, 'ONNET');
      // Stocker dans l'offre
      await this.prisma.offre.update({
        where: { id: offreId },
        data: {
          revenuMoyenOffNet: rmOffnet,
          revenuMoyenOnNet: rmOnnet,
        },
      });
      tfOrRmOffnet = rmOffnet;
      tfOrRmOnnet = rmOnnet;
    } else {
      // 🔹 Utiliser 0 si l'offre n'a pas d'options
      if (!offre.options || offre.options.length === 0) {
        tfOrRmOffnet = 0;
        tfOrRmOnnet = 0;
      } else {
        // 🔹 Utiliser les tarifs faciaux (comportement actuel)
        const { tfOffnet, tfOnnet } = await this.calculateTFOptimized(operateurId, offreId);
        tfOrRmOffnet = tfOffnet;
        tfOrRmOnnet = tfOnnet;
      }
    }

    // 🔹 Calculer TB/TA (adapté pour les revenus moyens)
    const typeCalculeForTarif = useRevenusMoyens 
      ? (typeCalcule === 'REVENUS_BASE' ? 'BASE' : 'INTERCONNEXION')
      : typeCalcule;

    const { tbOrTaMoyen, tbOrTaOperateur } = await this.calculateTBandTA(
      operateurId,
      typeOffre,
      typeHeure,
      typeCalculeForTarif as 'BASE' | 'INTERCONNEXION',
      annee,
    );

    // 🔹 Calculs intermédiaires
    const calcul1 = tfOrRmOffnet - tfOrRmOnnet;
    const calcul2 = tbOrTaMoyen - tbOrTaOperateur;
    const effetClubValeur = Math.round((calcul1 - calcul2) * 100) / 100;

    // 🔹 Détermination du résultat boolean et textuel
    const effetClubPresent = calcul1 > calcul2;
    const result = effetClubPresent ? "EFFET DE CLUB" : "PAS D'EFFET DE CLUB";

    // 🔹 Retour structuré
    return this.formatResponse(
      {
        filtres: { operateurId, offreId, annee, typeOffre, typeHeure, typeCalcule },

        tfOrRmOffnet: Math.round(tfOrRmOffnet * 100) / 100,
        tfOrRmOnnet: Math.round(tfOrRmOnnet * 100) / 100,
        ecartTF: Math.round(calcul1 * 100) / 100,

        tbOrTaMoyen: Math.round(tbOrTaMoyen * 100) / 100,
        tbOrTaOperateur: Math.round(tbOrTaOperateur * 100) / 100,
        ecartTBorTA: Math.round(calcul2 * 100) / 100,

        effetClubValeur,
        effetClubPresent,
        result, // <-- résultat textuel
      },
      'Effet club',
      'Effet club récupéré pour l\'offre',
    );
  }





  
  /**
   * Calcule le TF OffNet ou TF OnNet d'une offre
   *
   * TF = moyenne des valeurs des structures tarifaires
   * associées aux options de la même offre
   */
  async calculateTF(
    operateurId: number,
    offreId: number,
    typeOffre: TypeOffre,
  ): Promise<number> {
    // 1️⃣ Vérifier que l'offre appartient bien à l'opérateur
    const offre = await this.prisma.offre.findFirst({
      where: {
        id: offreId,
        operateurId,
      },
    });

    if (!offre) {
      throw new NotFoundException(
        'Offre introuvable ou non rattachée à cet opérateur',
      );
    }

    // 2️⃣ Récupérer la structure tarifaire correspondante
    const structureTarifaire =
      await this.prisma.structureTarifaire.findFirst({
        where: {
          nom: STRUCTURE_TARIFAIRE[typeOffre],
        },
      });

    if (!structureTarifaire) {
      throw new NotFoundException(
        `Structure tarifaire ${STRUCTURE_TARIFAIRE[typeOffre]} introuvable`,
      );
    }

    // 3️⃣ Récupérer les valeurs tarifaires des options de l'offre
    const valeurs =
      await this.prisma.optionStructureTarifaire.findMany({
        where: {
          structureTarifaireId: structureTarifaire.id,
          option: {
            offreId: offreId,
          },
          valeur: {
            not: null,
          },
        },
        select: {
          valeur: true,
        },
      });

    // 4️⃣ Calcul de la moyenne - Retourner 0 si aucune valeur trouvée
    if (valeurs.length === 0) {
      return 0;
    }

    const somme = valeurs.reduce(
      (total, item) => total + Number(item.valeur),
      0,
    );

    const moyenne = somme / valeurs.length;

    return Number(moyenne.toFixed(2));
  }

  
  async calculateTFOptimized(
    operateurId: number,
    offreId: number,
  ): Promise<{ tfOffnet: number; tfOnnet: number }> {
    // 1️⃣ Récupérer l'offre avec toutes ses options et les structures tarifaires
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      include: {
        options: {
          include: {
            structuresTarifaires: {
              include: { structureTarifaire: true }, // On récupère le nom
            },
          },
        },
      },
    });

    if (!offre || offre.operateurId !== operateurId) {
      throw new NotFoundException(
        'Offre introuvable ou non rattachée à cet opérateur',
      );
    }

    // 2️⃣ Filtrer les valeurs TF OFFNET et ONNET
    const valeursOffnet: number[] = [];
    const valeursOnnet: number[] = [];

    for (const option of offre.options) {
      for (const st of option.structuresTarifaires) {
        const nom = st.structureTarifaire.nom;
        const valeur = st.valeur;
        if (valeur === null) continue;

        if (nom === STRUCTURE_TARIFAIRE['OFFNET']) {
          valeursOffnet.push(Number(valeur));
        } else if (nom === STRUCTURE_TARIFAIRE['ONNET']) {
          valeursOnnet.push(Number(valeur));
        }
      }
    }

    // 3️⃣ Calcul de la moyenne - Retourner 0 si aucune valeur trouvée
    const moyenne = (arr: number[]) =>
      arr.length === 0 ? 0 : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;

    return {
      tfOffnet: moyenne(valeursOffnet),
      tfOnnet: moyenne(valeursOnnet),
    };
  }


  /**
   * Fonction UNIQUE : TBMoyen / TAMoyen
   */
  // async calculateTBorTAMoyen(
  //   operateurId: number, // présent pour cohérence API
  //   typeOffre: TypeOffre,
  //   typeHeure: TypeHeure,
  //   typeCalcule: TypeCalcule,
  //   annee: number,
  // ): Promise<number> {

  //   const columnName =
  //     TARIF_COLUMN_MAP[typeOffre]?.[typeHeure];

  //   if (!columnName) {
  //     throw new Error('Combinaison typeOffre / typeHeure invalide');
  //   }

  //   // Récupération des tarifs concernés (tous les opérateurs)
  //   const tarifs = await this.prisma.tarifInterconnexion.findMany({
  //     where: {
  //       annee,
  //       typeTarif: TYPE_TARIF_MAP[typeCalcule],
  //     },
  //     select: {
  //       [columnName]: true,
  //     } as any,
  //   });

  //   if (tarifs.length === 0) {
  //     throw new Error(
  //       `Aucun tarif trouvé pour ${typeCalcule} ${typeOffre} ${typeHeure} en ${annee}`,
  //     );
  //   }

  //   // Calcul de la moyenne
  //   const somme = tarifs.reduce((acc, t) => {
  //     const valeur = Number(t[columnName]);
  //     return acc + valeur;
  //   }, 0);

  //   const moyenne = somme / tarifs.length;

  //   return Number(moyenne.toFixed(2));
  // }
  // // Fonction TBorTAoperateur() 
  // async TBorTAoperateur(
  //   operateurId: number,
  //   typeOffre: TypeOffre,
  //   typeHeure: TypeHeure,
  //   typeCalcule: TypeCalcule,
  //   annee: number,
  // ): Promise<number> {

  //   const columnName =
  //     TARIF_COLUMN_MAP[typeOffre]?.[typeHeure];

  //   if (!columnName) {
  //     throw new Error('Combinaison OFFNET/ONNET et CREUSE/PLEINE invalide');
  //   }

  //   const tarif = await this.prisma.tarifInterconnexion.findFirst({
  //     where: {
  //       operateurId,
  //       annee,
  //       typeTarif: TYPE_TARIF_MAP[typeCalcule],
  //     },
  //     select: {
  //       [columnName]: true,
  //     } as any,
  //   });

  //   if (!tarif || tarif[columnName] === null) {
  //     throw new Error(
  //       'Tarif introuvable pour cet opérateur, cette année et ce type',
  //     );
  //   }

  //   return Number(tarif[columnName]);
  // }
  async calculateTBandTA(
    operateurId: number,
    typeOffre: TypeOffre,
    typeHeure: TypeHeure,
    typeCalcule: TypeCalcule,
    annee: number,
  ): Promise<{ tbOrTaMoyen: number; tbOrTaOperateur: number }> {
    const columnName = TARIF_COLUMN_MAP[typeOffre]?.[typeHeure];
    if (!columnName) {
      throw new BadRequestException('Combinaison OFFNET/ONNET et CREUSE/PLEINE invalide');
    }

    const typeTarif = TYPE_TARIF_MAP[typeCalcule];

    // 🔹 Lancer les deux requêtes en parallèle
    const [tarifsAll, tarifOperateur] = await Promise.all([
      this.prisma.tarifInterconnexion.findMany({
        where: { annee, typeTarif },
        select: { [columnName]: true } as any,
      }),
      this.prisma.tarifInterconnexion.findFirst({
        where: { operateurId, annee, typeTarif },
        select: { [columnName]: true } as any,
      }),
    ]);

    // 🔹 Utiliser 0 si aucun tarif n'existe pour cette année (marché)
    let tbOrTaMoyen = 0;
    if (tarifsAll.length > 0) {
      const moyenne = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
      tbOrTaMoyen = moyenne(tarifsAll.map(t => Number(t[columnName])));
    }

    // 🔹 Utiliser 0 si l'opérateur n'a pas de tarif pour cette année
    let tbOrTaOperateur = 0;
    if (tarifOperateur && tarifOperateur[columnName] !== null) {
      tbOrTaOperateur = Math.round(Number(tarifOperateur[columnName]) * 100) / 100;
    }

    return { tbOrTaMoyen, tbOrTaOperateur };
  }
























  /**
   * Récupère l'effet club d'une offre selon le tarif de base avec filtres
   */
  async getEffetClubBase(id: number, periode: string, reseau: string, annee?: number) {
    // Validation des paramètres
    if (!['HC', 'HP'].includes(periode)) {
      throw new BadRequestException('La période doit être HC ou HP');
    }

    if (!['Onnet', 'Offnet'].includes(reseau)) {
      throw new BadRequestException('Le réseau doit être Onnet ou Offnet');
    }

    try {
      // Récupérer l'offre avec ses relations
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

      // Vérifier l'année si fournie
      const offreAnnee = new Date(offre.dateDebutValidite).getFullYear();
      if (annee && offreAnnee !== annee) {
        throw new BadRequestException(
          `L'offre ${offre.nom} est de l'année ${offreAnnee}, pas de l'année ${annee}`
        );
      }

      // Construire le code du bloc selon les filtres
      const blocCode = `base${reseau}${periode}`;
      
      // Mapper les champs selon le bloc
      const champsMapping: any = {
        baseOnnetHC: {
          taOperateur: 'taBaseOperateurOnnetHC',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOnnetHC',
          taMoyen: 'taMoyenBaseOnnetHC',
          effetClub: 'effetClubBaseOnnetHC',
          resultat: 'resultatBaseOnnetHC',
          isEffetClub: 'isEffetClubBaseOnnetHC',
        },
        baseOnnetHP: {
          taOperateur: 'taBaseOperateurOnnetHP',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOnnetHP',
          taMoyen: 'taMoyenBaseOnnetHP',
          effetClub: 'effetClubBaseOnnetHP',
          resultat: 'resultatBaseOnnetHP',
          isEffetClub: 'isEffetClubBaseOnnetHP',
        },
        baseOffnetHC: {
          taOperateur: 'taBaseOperateurOffnetHC',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOffnetHC',
          taMoyen: 'taMoyenBaseOffnetHC',
          effetClub: 'effetClubBaseOffnetHC',
          resultat: 'resultatBaseOffnetHC',
          isEffetClub: 'isEffetClubBaseOffnetHC',
        },
        baseOffnetHP: {
          taOperateur: 'taBaseOperateurOffnetHP',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOffnetHP',
          taMoyen: 'taMoyenBaseOffnetHP',
          effetClub: 'effetClubBaseOffnetHP',
          resultat: 'resultatBaseOffnetHP',
          isEffetClub: 'isEffetClubBaseOffnetHP',
        },
      };

      const champs = champsMapping[blocCode];
      if (!champs) {
        throw new BadRequestException(`Combinaison invalide: ${periode} - ${reseau}`);
      }

      // Extraire les valeurs des champs
      const taOperateur = Number(offre[champs.taOperateur as keyof typeof offre]) || 0;
      const sommeAutresOperateurs = Number(offre[champs.sommeAutresOperateurs as keyof typeof offre]) || 0;
      const taMoyen = Number(offre[champs.taMoyen as keyof typeof offre]) || 0;
      const effetClub = Number(offre[champs.effetClub as keyof typeof offre]) || 0;
      const resultat = offre[champs.resultat as keyof typeof offre] as string || 0;
      const isEffetClub = offre[champs.isEffetClub as keyof typeof offre] as boolean || false;
      
      const prixOnNet = Number(offre.prixOnNet) || 0;
      const prixOffNet = Number(offre.prixOffNet) || 0;

      // Calculer le différentiel tarifaire
      const differentielTarifaire = (taMoyen !== null && taOperateur !== null) 
        ? Math.round((taMoyen - taOperateur) * 100) / 100 
        : null;

      // Calculer le différentiel de prix
      const differentielPrix = (prixOffNet !== null && prixOnNet !== null)
        ? Math.round((prixOffNet - prixOnNet) * 100) / 100
        : null;

      // Construire l'objet de retour dynamique
      const effetClubData: any = {
        [champs.taOperateur]: taOperateur,
        [champs.sommeAutresOperateurs]: sommeAutresOperateurs,
        [champs.taMoyen]: taMoyen,
        prixOnNet,
        prixOffNet,
        [champs.effetClub]: effetClub,
        [champs.resultat]: resultat,
        [champs.isEffetClub]: isEffetClub,
        differentielTarifaire,
        differentielPrix,
      };

      const result = {
        offre: {
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          annee: offreAnnee,
        },
        filtres: {
          periode,
          reseau,
          typeCalcul: 'Base',
        },
        effetClub: effetClubData,
      };

      return this.formatResponse(
        result,
        `Effet club (Base - ${periode} - ${reseau})`,
        `Effet club récupéré pour l'offre "${offre.nom}"`,
      );

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la récupération de l\'effet club:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération de l\'effet club'
      );
    }
  }

  /**
   * Récupère l'effet club d'une offre selon le tarif d'interconnexion avec filtres
   */
  async getEffetClubInter(id: number, periode: string, reseau: string, annee?: number) {
    // Validation des paramètres
    if (!['HC', 'HP'].includes(periode)) {
      throw new BadRequestException('La période doit être HC ou HP');
    }

    if (!['Onnet', 'Offnet'].includes(reseau)) {
      throw new BadRequestException('Le réseau doit être Onnet ou Offnet');
    }

    try {
      // Récupérer l'offre avec ses relations
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

      // Vérifier l'année si fournie
      const offreAnnee = new Date(offre.dateDebutValidite).getFullYear();
      if (annee && offreAnnee !== annee) {
        throw new BadRequestException(
          `L'offre ${offre.nom} est de l'année ${offreAnnee}, pas de l'année ${annee}`
        );
      }

      // Construire le code du bloc selon les filtres
      const blocCode = `inter${reseau}${periode}`;
      
      // Mapper les champs selon le bloc
      const champsMapping: any = {
        interOnnetHC: {
          taOperateur: 'taInterOperateurOnnetHC',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOnnetHC',
          taMoyen: 'taMoyenInterOnnetHC',
          effetClub: 'effetClubInterOnnetHC',
          resultat: 'resultatInterOnnetHC',
          isEffetClub: 'isEffetClubInterOnnetHC',
        },
        interOnnetHP: {
          taOperateur: 'taInterOperateurOnnetHP',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOnnetHP',
          taMoyen: 'taMoyenInterOnnetHP',
          effetClub: 'effetClubInterOnnetHP',
          resultat: 'resultatInterOnnetHP',
          isEffetClub: 'isEffetClubInterOnnetHP',
        },
        interOffnetHC: {
          taOperateur: 'taInterOperateurOffnetHC',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOffnetHC',
          taMoyen: 'taMoyenInterOffnetHC',
          effetClub: 'effetClubInterOffnetHC',
          resultat: 'resultatInterOffnetHC',
          isEffetClub: 'isEffetClubInterOffnetHC',
        },
        interOffnetHP: {
          taOperateur: 'taInterOperateurOffnetHP',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOffnetHP',
          taMoyen: 'taMoyenInterOffnetHP',
          effetClub: 'effetClubInterOffnetHP',
          resultat: 'resultatInterOffnetHP',
          isEffetClub: 'isEffetClubInterOffnetHP',
        },
      };

      const champs = champsMapping[blocCode];
      if (!champs) {
        throw new BadRequestException(`Combinaison invalide: ${periode} - ${reseau}`);
      }

      // Extraire les valeurs des champs
      const taOperateur = Number(offre[champs.taOperateur as keyof typeof offre]) || 0;
      const sommeAutresOperateurs = Number(offre[champs.sommeAutresOperateurs as keyof typeof offre]) || 0;
      const taMoyen = Number(offre[champs.taMoyen as keyof typeof offre]) || 0;
      const effetClub = Number(offre[champs.effetClub as keyof typeof offre]) || 0;
      const resultat = offre[champs.resultat as keyof typeof offre] as string || 0;
      const isEffetClub = offre[champs.isEffetClub as keyof typeof offre] as boolean || false;
      
      const prixOnNet = Number(offre.prixOnNet) || 0;
      const prixOffNet = Number(offre.prixOffNet) || 0;

      // Calculer le différentiel tarifaire
      const differentielTarifaire = (taMoyen !== null && taOperateur !== null) 
        ? Math.round((taMoyen - taOperateur) * 100) / 100 
        : null;

      // Calculer le différentiel de prix
      const differentielPrix = (prixOffNet !== null && prixOnNet !== null)
        ? Math.round((prixOffNet - prixOnNet) * 100) / 100
        : null;

      // Construire l'objet de retour dynamique
      const effetClubData: any = {
        [champs.taOperateur]: taOperateur,
        [champs.sommeAutresOperateurs]: sommeAutresOperateurs,
        [champs.taMoyen]: taMoyen,
        prixOnNet,
        prixOffNet,
        [champs.effetClub]: effetClub,
        [champs.resultat]: resultat,
        [champs.isEffetClub]: isEffetClub,
        differentielTarifaire,
        differentielPrix,
      };

      const result = {
        offre: {
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          annee: offreAnnee,
        },
        filtres: {
          periode,
          reseau,
          typeCalcul: 'Inter',
        },
        effetClub: effetClubData,
      };

      return this.formatResponse(
        result,
        `Effet club (Inter - ${periode} - ${reseau})`,
        `Effet club récupéré pour l'offre "${offre.nom}"`,
      );

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la récupération de l\'effet club:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération de l\'effet club'
      );
    }
  }

  /**
   * Récupère l'effet club d'une offre selon le tarif de base (revenus moyens) avec filtres
   */
  async getEffetClubRevenusBase(id: number, periode: string, reseau: string, annee?: number) {
    // Validation des paramètres
    if (!['HC', 'HP'].includes(periode)) {
      throw new BadRequestException('La période doit être HC ou HP');
    }

    if (!['Onnet', 'Offnet'].includes(reseau)) {
      throw new BadRequestException('Le réseau doit être Onnet ou Offnet');
    }

    try {
      // Récupérer l'offre avec ses relations
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

      // Vérifier l'année si fournie
      const offreAnnee = new Date(offre.dateDebutValidite).getFullYear();
      if (annee && offreAnnee !== annee) {
        throw new BadRequestException(
          `L'offre ${offre.nom} est de l'année ${offreAnnee}, pas de l'année ${annee}`
        );
      }

      // Construire le code du bloc selon les filtres
      const blocCode = `base${reseau}${periode}`;
      
      // Mapper les champs selon le bloc (revenus moyens)
      const champsMapping: any = {
        baseOnnetHC: {
          taOperateur: 'taBaseOperateurOnnetHC',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOnnetHC',
          taMoyen: 'taMoyenBaseOnnetHC',
          effetClub: 'effetClubRevenuBaseOnnetHC',
          resultat: 'resultatRevenuBaseOnnetHC',
          isEffetClub: 'isEffetClubRevenuBaseOnnetHC',
        },
        baseOnnetHP: {
          taOperateur: 'taBaseOperateurOnnetHP',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOnnetHP',
          taMoyen: 'taMoyenBaseOnnetHP',
          effetClub: 'effetClubRevenuBaseOnnetHP',
          resultat: 'resultatRevenuBaseOnnetHP',
          isEffetClub: 'isEffetClubRevenuBaseOnnetHP',
        },
        baseOffnetHC: {
          taOperateur: 'taBaseOperateurOffnetHC',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOffnetHC',
          taMoyen: 'taMoyenBaseOffnetHC',
          effetClub: 'effetClubRevenuBaseOffnetHC',
          resultat: 'resultatRevenuBaseOffnetHC',
          isEffetClub: 'isEffetClubRevenuBaseOffnetHC',
        },
        baseOffnetHP: {
          taOperateur: 'taBaseOperateurOffnetHP',
          sommeAutresOperateurs: 'sommeBaseAutresOperateursOffnetHP',
          taMoyen: 'taMoyenBaseOffnetHP',
          effetClub: 'effetClubRevenuBaseOffnetHP',
          resultat: 'resultatRevenuBaseOffnetHP',
          isEffetClub: 'isEffetClubRevenuBaseOffnetHP',
        },
      };

      const champs = champsMapping[blocCode];
      if (!champs) {
        throw new BadRequestException(`Combinaison invalide: ${periode} - ${reseau}`);
      }

      // Extraire les valeurs des champs
      const taOperateur = Number(offre[champs.taOperateur as keyof typeof offre]) || 0;
      const sommeAutresOperateurs = Number(offre[champs.sommeAutresOperateurs as keyof typeof offre]) || 0;
      const taMoyen = Number(offre[champs.taMoyen as keyof typeof offre]) || 0;
      const effetClub = Number(offre[champs.effetClub as keyof typeof offre]) || 0;
      const resultat = offre[champs.resultat as keyof typeof offre] as string || 0;
      const isEffetClub = offre[champs.isEffetClub as keyof typeof offre] as boolean || false;
      
      const revenuMoyenOnNet = Number(offre.revenuMoyenOnNet) || 0;
      const revenuMoyenOffNet = Number(offre.revenuMoyenOffNet) || 0;

      // Calculer le différentiel tarifaire
      const differentielTarifaire = (taMoyen !== null && taOperateur !== null) 
        ? Math.round((taMoyen - taOperateur) * 100) / 100 
        : null;

      // Calculer le différentiel de revenus
      const differentielRevenus = (revenuMoyenOffNet !== null && revenuMoyenOnNet !== null)
        ? Math.round((revenuMoyenOffNet - revenuMoyenOnNet) * 100) / 100
        : null;

      // Construire l'objet de retour dynamique
      const effetClubData: any = {
        [champs.taOperateur]: taOperateur,
        [champs.sommeAutresOperateurs]: sommeAutresOperateurs,
        [champs.taMoyen]: taMoyen,
        revenuMoyenOnNet,
        revenuMoyenOffNet,
        [champs.effetClub]: effetClub,
        [champs.resultat]: resultat,
        [champs.isEffetClub]: isEffetClub,
        differentielTarifaire,
        differentielRevenus,
      };

      const result = {
        offre: {
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          annee: offreAnnee,
        },
        filtres: {
          periode,
          reseau,
          typeCalcul: 'Base',
          methodeCalcul: 'revenus_moyens',
        },
        effetClub: effetClubData,
      };

      return this.formatResponse(
        result,
        `Effet club (Base Revenus - ${periode} - ${reseau})`,
        `Effet club récupéré pour l'offre "${offre.nom}"`,
      );

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la récupération de l\'effet club:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération de l\'effet club'
      );
    }
  }

  /**
   * Récupère l'effet club d'une offre selon le tarif d'interconnexion (revenus moyens) avec filtres
   */
  async getEffetClubRevenusInter(id: number, periode: string, reseau: string, annee?: number) {
    // Validation des paramètres
    if (!['HC', 'HP'].includes(periode)) {
      throw new BadRequestException('La période doit être HC ou HP');
    }

    if (!['Onnet', 'Offnet'].includes(reseau)) {
      throw new BadRequestException('Le réseau doit être Onnet ou Offnet');
    }

    try {
      // Récupérer l'offre avec ses relations
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

      // Vérifier l'année si fournie
      const offreAnnee = new Date(offre.dateDebutValidite).getFullYear();
      if (annee && offreAnnee !== annee) {
        throw new BadRequestException(
          `L'offre ${offre.nom} est de l'année ${offreAnnee}, pas de l'année ${annee}`
        );
      }

      // Construire le code du bloc selon les filtres
      const blocCode = `inter${reseau}${periode}`;
      
      // Mapper les champs selon le bloc (revenus moyens)
      const champsMapping: any = {
        interOnnetHC: {
          taOperateur: 'taInterOperateurOnnetHC',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOnnetHC',
          taMoyen: 'taMoyenInterOnnetHC',
          effetClub: 'effetClubRevenuInterOnnetHC',
          resultat: 'resultatRevenuInterOnnetHC',
          isEffetClub: 'isEffetClubRevenuInterOnnetHC',
        },
        interOnnetHP: {
          taOperateur: 'taInterOperateurOnnetHP',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOnnetHP',
          taMoyen: 'taMoyenInterOnnetHP',
          effetClub: 'effetClubRevenuInterOnnetHP',
          resultat: 'resultatRevenuInterOnnetHP',
          isEffetClub: 'isEffetClubRevenuInterOnnetHP',
        },
        interOffnetHC: {
          taOperateur: 'taInterOperateurOffnetHC',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOffnetHC',
          taMoyen: 'taMoyenInterOffnetHC',
          effetClub: 'effetClubRevenuInterOffnetHC',
          resultat: 'resultatRevenuInterOffnetHC',
          isEffetClub: 'isEffetClubRevenuInterOffnetHC',
        },
        interOffnetHP: {
          taOperateur: 'taInterOperateurOffnetHP',
          sommeAutresOperateurs: 'sommeInterAutresOperateursOffnetHP',
          taMoyen: 'taMoyenInterOffnetHP',
          effetClub: 'effetClubRevenuInterOffnetHP',
          resultat: 'resultatRevenuInterOffnetHP',
          isEffetClub: 'isEffetClubRevenuInterOffnetHP',
        },
      };

      const champs = champsMapping[blocCode];
      if (!champs) {
        throw new BadRequestException(`Combinaison invalide: ${periode} - ${reseau}`);
      }

      // Extraire les valeurs des champs
      const taOperateur = Number(offre[champs.taOperateur as keyof typeof offre]) || 0;
      const sommeAutresOperateurs = Number(offre[champs.sommeAutresOperateurs as keyof typeof offre]) || 0;
      const taMoyen = Number(offre[champs.taMoyen as keyof typeof offre]) || 0;
      const effetClub = Number(offre[champs.effetClub as keyof typeof offre]) || 0;
      const resultat = offre[champs.resultat as keyof typeof offre] as string || 0;
      const isEffetClub = offre[champs.isEffetClub as keyof typeof offre] as boolean || false;
      
      const revenuMoyenOnNet = Number(offre.revenuMoyenOnNet) || 0;
      const revenuMoyenOffNet = Number(offre.revenuMoyenOffNet) || 0;

      // Calculer le différentiel tarifaire
      const differentielTarifaire = (taMoyen !== null && taOperateur !== null) 
        ? Math.round((taMoyen - taOperateur) * 100) / 100 
        : null;

      // Calculer le différentiel de revenus
      const differentielRevenus = (revenuMoyenOffNet !== null && revenuMoyenOnNet !== null)
        ? Math.round((revenuMoyenOffNet - revenuMoyenOnNet) * 100) / 100
        : null;

      // Construire l'objet de retour dynamique
      const effetClubData: any = {
        [champs.taOperateur]: taOperateur,
        [champs.sommeAutresOperateurs]: sommeAutresOperateurs,
        [champs.taMoyen]: taMoyen,
        revenuMoyenOnNet,
        revenuMoyenOffNet,
        [champs.effetClub]: effetClub,
        [champs.resultat]: resultat,
        [champs.isEffetClub]: isEffetClub,
        differentielTarifaire,
        differentielRevenus,
      };

      const result = {
        offre: {
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          annee: offreAnnee,
        },
        filtres: {
          periode,
          reseau,
          typeCalcul: 'Inter',
          methodeCalcul: 'revenus_moyens',
        },
        effetClub: effetClubData,
      };

      return this.formatResponse(
        result,
        `Effet club (Inter Revenus - ${periode} - ${reseau})`,
        `Effet club récupéré pour l'offre "${offre.nom}"`,
      );

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur lors de la récupération de l\'effet club:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération de l\'effet club'
      );
    }
  }

  /**
   * Liste toutes les offres avec leurs effets club complets (16 combinaisons)
   */
  async getAllEffetsClubComplete(query: EffetClubFilterDto) {
    const {
      page = 1,
      limit = 10,
      operateurId,
      nom,
      typeOffre,
      statut,
      annee,
      dateDebut,
      dateFin,
      sortBy = 'dateDebutValidite',
      sortOrder = 'desc',
    } = query;

    // Construction des filtres WHERE
    const where: any = {};

    if (operateurId) {
      where.operateurId = operateurId;
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

      // Construire les résultats pour chaque offre
      const offresAvecEffetsClub = offres.map(offre => {
        const offreAnnee = new Date(offre.dateDebutValidite).getFullYear();

        // 1. BASE (PRIX) - 4 combinaisons
        const basePrix = {
          methode: 'Base (Prix)',
          combinaisons: [
            {
              periode: 'HC',
              reseau: 'Onnet',
              taOperateur: Number(offre.taBaseOperateurOnnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOnnetHC) || 0,
              taMoyen: Number(offre.taMoyenBaseOnnetHC) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubBaseOnnetHC) || 0,
              resultat: offre.resultatBaseOnnetHC || 0,
              isEffetClub: offre.isEffetClubBaseOnnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Onnet',
              taOperateur: Number(offre.taBaseOperateurOnnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOnnetHP) || 0,
              taMoyen: Number(offre.taMoyenBaseOnnetHP) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubBaseOnnetHP) || 0,
              resultat: offre.resultatBaseOnnetHP || 0,
              isEffetClub: offre.isEffetClubBaseOnnetHP || false,
            },
            {
              periode: 'HC',
              reseau: 'Offnet',
              taOperateur: Number(offre.taBaseOperateurOffnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOffnetHC) || 0,
              taMoyen: Number(offre.taMoyenBaseOffnetHC) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubBaseOffnetHC) || 0,
              resultat: offre.resultatBaseOffnetHC || 0,
              isEffetClub: offre.isEffetClubBaseOffnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Offnet',
              taOperateur: Number(offre.taBaseOperateurOffnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOffnetHP) || 0,
              taMoyen: Number(offre.taMoyenBaseOffnetHP) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubBaseOffnetHP) || 0,
              resultat: offre.resultatBaseOffnetHP || 0,
              isEffetClub: offre.isEffetClubBaseOffnetHP || false,
            },
          ],
        };

        // 2. INTER (PRIX) - 4 combinaisons
        const interPrix = {
          methode: 'Inter (Prix)',
          combinaisons: [
            {
              periode: 'HC',
              reseau: 'Onnet',
              taOperateur: Number(offre.taInterOperateurOnnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOnnetHC) || 0,
              taMoyen: Number(offre.taMoyenInterOnnetHC) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubInterOnnetHC) || 0,
              resultat: offre.resultatInterOnnetHC || 0,
              isEffetClub: offre.isEffetClubInterOnnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Onnet',
              taOperateur: Number(offre.taInterOperateurOnnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOnnetHP) || 0,
              taMoyen: Number(offre.taMoyenInterOnnetHP) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubInterOnnetHP) || 0,
              resultat: offre.resultatInterOnnetHP || 0,
              isEffetClub: offre.isEffetClubInterOnnetHP || false,
            },
            {
              periode: 'HC',
              reseau: 'Offnet',
              taOperateur: Number(offre.taInterOperateurOffnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOffnetHC) || 0,
              taMoyen: Number(offre.taMoyenInterOffnetHC) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubInterOffnetHC) || 0,
              resultat: offre.resultatInterOffnetHC || 0,
              isEffetClub: offre.isEffetClubInterOffnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Offnet',
              taOperateur: Number(offre.taInterOperateurOffnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOffnetHP) || 0,
              taMoyen: Number(offre.taMoyenInterOffnetHP) || 0,
              prixOnNet: Number(offre.prixOnNet) || 0,
              prixOffNet: Number(offre.prixOffNet) || 0,
              effetClub: Number(offre.effetClubInterOffnetHP) || 0,
              resultat: offre.resultatInterOffnetHP || 0,
              isEffetClub: offre.isEffetClubInterOffnetHP || false,
            },
          ],
        };

        // 3. BASE (REVENUS MOYENS) - 4 combinaisons
        const baseRevenus = {
          methode: 'Base (Revenus Moyens)',
          combinaisons: [
            {
              periode: 'HC',
              reseau: 'Onnet',
              taOperateur: Number(offre.taBaseOperateurOnnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOnnetHC) || 0,
              taMoyen: Number(offre.taMoyenBaseOnnetHC) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuBaseOnnetHC) || 0,
              resultat: offre.resultatRevenuBaseOnnetHC || 0,
              isEffetClub: offre.isEffetClubRevenuBaseOnnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Onnet',
              taOperateur: Number(offre.taBaseOperateurOnnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOnnetHP) || 0,
              taMoyen: Number(offre.taMoyenBaseOnnetHP) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuBaseOnnetHP) || 0,
              resultat: offre.resultatRevenuBaseOnnetHP || 0,
              isEffetClub: offre.isEffetClubRevenuBaseOnnetHP || false,
            },
            {
              periode: 'HC',
              reseau: 'Offnet',
              taOperateur: Number(offre.taBaseOperateurOffnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOffnetHC) || 0,
              taMoyen: Number(offre.taMoyenBaseOffnetHC) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuBaseOffnetHC) || 0,
              resultat: offre.resultatRevenuBaseOffnetHC || 0,
              isEffetClub: offre.isEffetClubRevenuBaseOffnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Offnet',
              taOperateur: Number(offre.taBaseOperateurOffnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeBaseAutresOperateursOffnetHP) || 0,
              taMoyen: Number(offre.taMoyenBaseOffnetHP) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuBaseOffnetHP) || 0,
              resultat: offre.resultatRevenuBaseOffnetHP || 0,
              isEffetClub: offre.isEffetClubRevenuBaseOffnetHP || false,
            },
          ],
        };

        // 4. INTER (REVENUS MOYENS) - 4 combinaisons
        const interRevenus = {
          methode: 'Inter (Revenus Moyens)',
          combinaisons: [
            {
              periode: 'HC',
              reseau: 'Onnet',
              taOperateur: Number(offre.taInterOperateurOnnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOnnetHC) || 0,
              taMoyen: Number(offre.taMoyenInterOnnetHC) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuInterOnnetHC) || 0,
              resultat: offre.resultatRevenuInterOnnetHC || 0,
              isEffetClub: offre.isEffetClubRevenuInterOnnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Onnet',
              taOperateur: Number(offre.taInterOperateurOnnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOnnetHP) || 0,
              taMoyen: Number(offre.taMoyenInterOnnetHP) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuInterOnnetHP) || 0,
              resultat: offre.resultatRevenuInterOnnetHP || 0,
              isEffetClub: offre.isEffetClubRevenuInterOnnetHP || false,
            },
            {
              periode: 'HC',
              reseau: 'Offnet',
              taOperateur: Number(offre.taInterOperateurOffnetHC) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOffnetHC) || 0,
              taMoyen: Number(offre.taMoyenInterOffnetHC) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuInterOffnetHC) || 0,
              resultat: offre.resultatRevenuInterOffnetHC || 0,
              isEffetClub: offre.isEffetClubRevenuInterOffnetHC || false,
            },
            {
              periode: 'HP',
              reseau: 'Offnet',
              taOperateur: Number(offre.taInterOperateurOffnetHP) || 0,
              sommeAutresOperateurs: Number(offre.sommeInterAutresOperateursOffnetHP) || 0,
              taMoyen: Number(offre.taMoyenInterOffnetHP) || 0,
              revenuMoyenOnNet: Number(offre.revenuMoyenOnNet) || 0,
              revenuMoyenOffNet: Number(offre.revenuMoyenOffNet) || 0,
              effetClub: Number(offre.effetClubRevenuInterOffnetHP) || 0,
              resultat: offre.resultatRevenuInterOffnetHP || 0,
              isEffetClub: offre.isEffetClubRevenuInterOffnetHP || false,
            },
          ],
        };

        return {
          id: offre.id,
          nom: offre.nom,
          operateur: offre.operateur,
          dateDebutValidite: offre.dateDebutValidite,
          dateFinValidite: offre.dateFinValidite,
          typeOffre: offre.typeOffre,
          statut: offre.statut,
          annee: offreAnnee,
          createdAt: offre.createdAt,
          updatedAt: offre.updatedAt,
          effetsClub: {
            basePrix,
            interPrix,
            baseRevenus,
            interRevenus,
          },
        };
      });

      // Informations de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const result = {
        offres: offresAvecEffetsClub,
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
          nom,
          typeOffre,
          statut,
          annee,
          dateDebut,
          dateFin,
        },
        tri: {
          sortBy,
          sortOrder,
        },
        metadata: {
          nombreOffres: offresAvecEffetsClub.length,
          nombreMethodes: 4,
          nombreCombinaisonsParMethode: 4,
          nombreTotalCombinaisons: 16,
          methodes: ['Base (Prix)', 'Inter (Prix)', 'Base (Revenus Moyens)', 'Inter (Revenus Moyens)'],
        },
      };

      return this.formatResponse(
        result,
        'Liste des offres avec effets club complets',
        `${total} offre(s) trouvée(s) avec 16 combinaisons d'effets club par offre`,
      );

    } catch (error) {
      console.error('Erreur lors de la récupération des offres avec effets club complets:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des offres avec effets club complets'
      );
    }
  }



  /************mise à jour fonction manuella */

  /**
   * Calculer la somme des frais de souscription pour une offre
   * Formule: Σ(fraisSouscription × nombreSouscriptions)
   */
  private async SommeFraisSouscriptionParNbreSousc(offreId: number): Promise<number> {
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
   * MÉTHODE DE CALCUL DE LA SOMME DES AVANTAGES GRATUITS
   * =====================================================
   * 
   * Cette méthode calcule la somme des valeurs des avantages gratuits pour une offre
   * en utilisant les valeurs stockées dans la table OptionAvantage
   * 
   * @param offreId - ID de l'offre pour laquelle calculer la somme
   * @returns Promise<number> - La somme calculée des avantages gratuits
   * 
   * LOGIQUE APPLIQUÉE :
   * - Une offre a plusieurs options
   * - Chaque option peut avoir plusieurs avantages via la table OptionAvantage
   * - La table OptionAvantage stocke la valeur spécifique de chaque avantage pour une option
   * - La table Avantage contient le champ isGratuit pour déterminer si un avantage est gratuit
   * - Formule: sommeAvantagesGratuits = Σ(optionAvantage.valeur) où avantage.isGratuit = true
   */
  private async sommeAvantageGratuit(offreId: number): Promise<number> {
    // Récupérer toutes les options de l'offre avec leurs avantages
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

    let sommeAvantagesGratuits = 0;

    // Parcourir toutes les options
    for (const option of options) {
      // Parcourir tous les avantages de chaque option via la table OptionAvantage
      for (const optionAvantage of option.avantages) {
        const avantage = optionAvantage.avantage;
        
        // Si l'avantage est gratuit, ajouter la valeur stockée dans OptionAvantage
        if (avantage.isGratuit) {
          sommeAvantagesGratuits += Number(optionAvantage.valeur || 0);
        }
      }
    }

    return sommeAvantagesGratuits;
  }

  /**
   * MÉTHODE DE CALCUL DE LA SOMME DU TRAFIC OPTION
   * ===============================================
   * 
   * Cette méthode calcule la somme des trafics option pour une offre
   * en additionnant les valeurs du champ traficOption de toutes ses options
   * 
   * @param offreId - ID de l'offre pour laquelle calculer la somme
   * @returns Promise<number> - La somme calculée du trafic option
   * 
   * LOGIQUE APPLIQUÉE :
   * - Une offre a plusieurs options
   * - Chaque option a un champ traficOption qui représente le trafic associé à cette option
   * - Formule: sommeTraficOption = Σ(option.traficOption)
   */
  private async sommeTraficOption(offreId: number): Promise<number> {
    // Récupérer toutes les options de l'offre avec le champ traficOption
    const options = await this.prisma.option.findMany({
      where: { offreId },
      select: {
        traficOption: true,
      },
    });

    // Si aucune option, retourner 0
    if (!options || options.length === 0) {
      return 0;
    }

    // Calculer la somme de tous les traficOption
    const sommeTraficOption = options.reduce((sum, option) => {
      return sum + Number(option.traficOption || 0);
    }, 0);

    return sommeTraficOption;
  }

  /**
   * MÉTHODE DE CALCUL DU REVENU MOYEN OFFNET OU ONNET
   * ==================================================
   * 
   * Cette méthode calcule le revenu moyen OffNet ou OnNet d'une offre
   * en utilisant la formule complète avec tous les paramètres tarifaires
   * 
   * @param operateurId - ID de l'opérateur (pour validation et calcul TF)
   * @param offreId - ID de l'offre pour laquelle calculer le revenu moyen
   * @param typeOffre - Type d'offre ('OFFNET' ou 'ONNET')
   * @returns Promise<number> - Le revenu moyen calculé
   * 
   * FORMULE APPLIQUÉE :
   * RM = (TP*TF*(1+TNC)*(1+EP) + Σ(frais)) / (TP + sommeAvantageGratuit + sommeTraficOption)
   * 
   * COMPOSANTES :
   * - TP : Trafic total (de la table Offre)
   * - TF : Tarif facial OffNet ou OnNet (calculé via calculateTF)
   * - TNC : Taux net de collecte (de la table Offre)
   * - EP : Epargne préalable (de la table Offre)
   * - Σ(frais × nombre) : Somme des frais de souscription pondérés (via SommeFraisSouscriptionParNbreSousc)
   * - Somme avantages gratuits : Via sommeAvantageGratuit()
   * - Somme trafic option : Via sommeTraficOption()
   */
  async calculerRevenuMoyen(
    operateurId: number,
    offreId: number,
    typeOffre: TypeOffre,
  ): Promise<number> {
    // 1️⃣ Récupérer l'offre avec les champs nécessaires
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: {
        id: true,
        operateurId: true,
        tp: true,
        tnc: true,
        ep: true,
      },
    });

    // Validation de l'offre
    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${offreId} introuvable`);
    }

    if (offre.operateurId !== operateurId) {
      throw new BadRequestException(
        'Cette offre n\'appartient pas à l\'opérateur spécifié'
      );
    }

    // 2️⃣ Extraire les valeurs tarifaires
    const tp = Number(offre.tp || 0);
    const tnc = Number(offre.tnc || 0);
    const ep = Number(offre.ep || 0);

    // Validation : TP doit être > 0 pour éviter division par zéro
    if (tp === 0) {
      throw new BadRequestException(
        'Le trafic total (TP) de l\'offre doit être supérieur à 0'
      );
    }

    // 3️⃣ Calculer TF (Tarif Facial) selon le type d'offre
    const tf = await this.calculateTF(operateurId, offreId, typeOffre);

    // 4️⃣ Calculer les sommes en parallèle pour optimiser les performances
    const [sommeFrais, sommeAvantages, sommeTrafic] = await Promise.all([
      this.SommeFraisSouscriptionParNbreSousc(offreId),
      this.sommeAvantageGratuit(offreId),
      this.sommeTraficOption(offreId),
    ]);

    // 5️⃣ Appliquer la formule
    // RM = (TP*TF*(1+TNC)*(1+EP) + Σ(frais)) / (TP + sommeAvantageGratuit + sommeTraficOption)
    const numerateur = tp * tf * (1 + tnc) * (1 + ep) + sommeFrais;
    const denominateur = tp + sommeAvantages + sommeTrafic;

    // Validation : le dénominateur doit être > 0
    if (denominateur === 0) {
      throw new BadRequestException(
        'Le dénominateur de la formule (TP + sommeAvantages + sommeTrafic) doit être supérieur à 0'
      );
    }

    const revenuMoyen = numerateur / denominateur;

    // Arrondir à 2 décimales
    return Math.round(revenuMoyen * 100) / 100;
  }
}
