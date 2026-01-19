import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto, AvailableYearsDto, OperatorStatsDto } from './dto/dashboard-stats.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Couleurs prédéfinies pour les opérateurs
  private readonly operatorColors = [
    '#06B6D4', // Cyan
    '#8B5CF6', // Violet
    '#10B981', // Vert
    '#F59E0B', // Orange
    '#EF4444', // Rouge
    '#3B82F6', // Bleu
    '#8B5A2B', // Marron
    '#6B7280', // Gris
    '#EC4899', // Rose
    '#84CC16', // Lime
  ];

  // Génère une couleur pour un opérateur basée sur son index
  private getOperatorColor(index: number): string {
    return this.operatorColors[index % this.operatorColors.length];
  }

  // Fonction utilitaire pour formater les réponses
  private formatResponse(data: any, title: string, message: string) {
    return {
      success: true,
      statusCode: 200,
      code: 'success',
      title,
      message,
      data,
    };
  }

  // /**
  //  * Part de marché du trafic par opérateur
  //  * part = volumeOperateur / volumeTotal
  //  */
  // async getPartDeMarcheTrafic(params?: {
  //   annee?: number;
  //   typeTrafic?: string;
  // }) {
  //   const { annee, typeTrafic } = params || {};

  //   /* 1️⃣ Volume total */
  //   const totalVolumeResult = await this.prisma.trafic.aggregate({
  //     _sum: { volume: true },
  //     where: {
  //       ...(annee && { annee }),
  //       ...(typeTrafic && { typeTrafic }),
  //     },
  //   });

  //   const totalVolume = totalVolumeResult._sum.volume ?? new Decimal(0);

  //   /* 2️⃣ Volume par opérateur */
  //   const volumesParOperateur = await this.prisma.trafic.groupBy({
  //     by: ['operateurId'],
  //     _sum: { volume: true },
  //     where: {
  //       ...(annee && { annee }),
  //       ...(typeTrafic && { typeTrafic }),
  //     },
  //   });

  //   if (totalVolume.equals(0)) {
  //     return {
  //       traficStats: {
  //         totalVolume: 0,
  //         ihh: 0,
  //         trafic: [],
  //       },
  //     };
  //   }

  //   /* 3️⃣ Infos opérateurs */
  //   const operateurs = await this.prisma.operateur.findMany({
  //     where: {
  //       id: { in: volumesParOperateur.map(v => v.operateurId) },
  //     },
  //     select: {
  //       id: true,
  //       nom: true,
  //       code: true,
  //     },
  //   });

  //   /* 4️⃣ Calcul trafic + IHH */
  //   let ihh = 0;

  //   const trafic = volumesParOperateur.map(v => {
  //     const operateur = operateurs.find(o => o.id === v.operateurId);
  //     const volume = v._sum.volume ?? new Decimal(0);

  //     const partDeMarche = volume.div(totalVolume).mul(100);
  //     const part = Number(partDeMarche.toFixed(2));

  //     // IHH = somme des carrés des parts
  //     ihh += part * part;

  //     return {
  //       operateurId: v.operateurId,
  //       operateurNom: operateur?.nom,
  //       operateurCode: operateur?.code,
  //       volume: volume.toNumber(),
  //       partDeMarche: part,
  //     };
  //   });

  //   /* 5️⃣ Retour structuré */
  //   return {
  //     traficStats: {
  //       totalVolume: totalVolume.toNumber(),
  //       ihh: Number(ihh.toFixed(2)),
  //       trafic,
  //     },
  //   };
  // }

  // Méthode complète : trafic + abonnements
  async getMarketStats(params?: {
    annee?: number;
    typeTrafic?: string;
    typeAbonnement?: string;
  }) {
    const traficStats = await this.getTraficStats(params);
    const abonnementStats = await this.getAbonnementStats(params);
    const chiffreAffaireStats = await this.getChiffreAffaireStats(params);

    return {
      ...traficStats,
      ...abonnementStats,
      ...chiffreAffaireStats,
    };
  }



  // Bloc TraficStats
  private async getTraficStats(params?: {
    annee?: number;
    typeTrafic?: string;
  }) {
    const { annee, typeTrafic } = params || {};

    const totalVolumeResult = await this.prisma.trafic.aggregate({
      _sum: { volume: true },
      where: {
        ...(annee && { annee }),
        ...(typeTrafic && { typeTrafic }),
      },
    });

    const totalVolume = totalVolumeResult._sum.volume ?? new Decimal(0);

    const volumesParOperateur = await this.prisma.trafic.groupBy({
      by: ['operateurId'],
      _sum: { volume: true },
      where: {
        ...(annee && { annee }),
        ...(typeTrafic && { typeTrafic }),
      },
    });

    if (totalVolume.equals(0)) {
      return {
        traficStats: {
          totalVolume: 0,
          ihh: 0,
          trafic: [],
        },
      };
    }

    const operateurs = await this.prisma.operateur.findMany({
      where: { id: { in: volumesParOperateur.map(v => v.operateurId) } },
      select: { id: true, nom: true, code: true },
    });

    let ihh = 0;

    const trafic = volumesParOperateur.map(v => {
      const operateur = operateurs.find(o => o.id === v.operateurId);
      const volume = v._sum.volume ?? new Decimal(0);

      const part = Number(volume.div(totalVolume).mul(100).toFixed(2));
      ihh += part * part;

      return {
        operateurId: v.operateurId,
        operateurNom: operateur?.nom,
        operateurCode: operateur?.code,
        volume: volume.toNumber(),
        partDeMarche: part,
      };
    });

    return {
      traficStats: {
        totalVolume: totalVolume.toNumber(),
        ihh: Number(ihh.toFixed(2)),
        trafic,
      },
    };
  }

  // Bloc AbonnementStats
  private async getAbonnementStats(params?: {
    annee?: number;
    typeAbonnement?: string;
  }) {
    const { annee, typeAbonnement } = params || {};

    /* 1️⃣ Total abonnés */
    const totalResult = await this.prisma.abonnement.aggregate({
      _sum: { nombreAbonnes: true },
      where: {
        ...(annee && { annee }),
        ...(typeAbonnement && { typeAbonnement }),
      },
    });

    const totalAbonnes = totalResult._sum.nombreAbonnes ?? 0;

    /* 2️⃣ Abonnés par opérateur */
    const abonnementsParOperateur = await this.prisma.abonnement.groupBy({
      by: ['operateurId'],
      _sum: { nombreAbonnes: true },
      where: {
        ...(annee && { annee }),
        ...(typeAbonnement && { typeAbonnement }),
      },
    });

    if (totalAbonnes === 0) {
      return {
        abonnementStats: {
          totalAbonnes: 0,
          ihh: 0,
          abonnements: [],
        },
      };
    }

    /* 3️⃣ Infos opérateurs */
    const operateurs = await this.prisma.operateur.findMany({
      where: { id: { in: abonnementsParOperateur.map(a => a.operateurId) } },
      select: { id: true, nom: true, code: true },
    });

    /* 4️⃣ Calcul abonnements + IHH */
    let ihh = 0;

    const abonnements = abonnementsParOperateur.map(a => {
      const operateur = operateurs.find(o => o.id === a.operateurId);
      const nombre = a._sum.nombreAbonnes ?? 0;

      const part = Number(((nombre / totalAbonnes) * 100).toFixed(2));
      ihh += part * part;

      return {
        operateurId: a.operateurId,
        operateurNom: operateur?.nom,
        operateurCode: operateur?.code,
        nombreAbonnes: nombre,
        partDeMarche: part,
      };
    });

    return {
      abonnementStats: {
        totalAbonnes,
        ihh: Number(ihh.toFixed(2)),
        abonnements,
      },
    };
  }

  // Bloc chiffreAffaireStats
  private async getChiffreAffaireStats(params?: { annee?: number }) {
    const { annee } = params || {};

    /* 1️⃣ Total CA */
    const totalResult = await this.prisma.chiffreAffaire.aggregate({
      _sum: { chiffreAffaire: true },
      where: {
        ...(annee && { annee }),
      },
    });

    const totalCA = totalResult._sum.chiffreAffaire ?? new Decimal(0);

    /* 2️⃣ CA par opérateur */
    const caParOperateur = await this.prisma.chiffreAffaire.groupBy({
      by: ['operateurId'],
      _sum: { chiffreAffaire: true },
      where: {
        ...(annee && { annee }),
      },
    });

    if (totalCA.equals(0)) {
      return {
        chiffreAffaireStats: {
          totalCA: 0,
          ihh: 0,
          chiffresAffaire: [],
        },
      };
    }

    /* 3️⃣ Infos opérateurs */
    const operateurs = await this.prisma.operateur.findMany({
      where: { id: { in: caParOperateur.map(c => c.operateurId) } },
      select: { id: true, nom: true, code: true },
    });

    /* 4️⃣ Calcul part de marché + IHH */
    let ihh = 0;

    const chiffresAffaire = caParOperateur.map(c => {
      const operateur = operateurs.find(o => o.id === c.operateurId);
      const ca = c._sum.chiffreAffaire ?? new Decimal(0);

      const part = Number(ca.div(totalCA).mul(100).toFixed(2));
      ihh += part * part;

      return {
        operateurId: c.operateurId,
        operateurNom: operateur?.nom,
        operateurCode: operateur?.code,
        chiffreAffaire: ca.toNumber(),
        partDeMarche: part,
      };
    });

    return {
      chiffreAffaireStats: {
        totalCA: totalCA.toNumber(),
        ihh: Number(ihh.toFixed(2)),
        chiffresAffaire,
      },
    };
  }

















  /**
   * Récupère les statistiques générales du dashboard pour une année donnée
   * @param year - Année pour les statistiques (optionnel, par défaut année courante)
   */
  async getDashboardStats(year?: number): Promise<any> {
    const currentYear = year || new Date().getFullYear();

    try {
      // 1. Récupérer tous les opérateurs
      const operateurs = await this.prisma.operateur.findMany({
        where: { statut: 'Actif' },
        orderBy: { nom: 'asc' }
      });

      if (operateurs.length === 0) {
        return this.formatResponse(
          {
            year: currentYear,
            totalRevenue: 0,
            totalSubscribers: 0,
            totalMinutes: 0,
            operatorStats: []
          },
          'Statistiques dashboard',
          'Aucun opérateur actif trouvé'
        );
      }

      // 2. Récupérer les chiffres d'affaires par opérateur pour l'année
      const chiffresAffaire = await this.prisma.chiffreAffaire.findMany({
        where: { 
          annee: currentYear,
          operateur: { statut: 'Actif' }
        },
        include: {
          operateur: {
            select: { id: true, nom: true }
          }
        }
      });

      // 3. Récupérer les abonnements par opérateur pour l'année
      const abonnements = await this.prisma.abonnement.groupBy({
        by: ['operateurId'],
        where: { 
          annee: currentYear,
          operateur: { statut: 'Actif' }
        },
        _sum: {
          nombreAbonnes: true,
        },
        _count: {
          operateurId: true,
        }
      });

      // 4. Récupérer le trafic par opérateur pour l'année (en supposant que le volume est en minutes)
      const trafics = await this.prisma.trafic.groupBy({
        by: ['operateurId'],
        where: { 
          annee: currentYear,
          operateur: { statut: 'Actif' }
        },
        _sum: {
          volume: true,
        },
        _count: {
          operateurId: true,
        }
      });

      // 5. Construire les statistiques par opérateur
      const operatorStats: OperatorStatsDto[] = [];
      let totalRevenue = 0;
      let totalSubscribers = 0;
      let totalMinutes = 0;

      operateurs.forEach((operateur, index) => {
        // Chiffre d'affaires
        const ca = chiffresAffaire.find(c => c.operateurId === operateur.id);
        const revenue = ca ? Number(ca.chiffreAffaire) : 0;

        // Abonnés
        const abo = abonnements.find(a => a.operateurId === operateur.id);
        const subscribers = abo?._sum.nombreAbonnes || 0;

        // Trafic (volume en minutes)
        const traf = trafics.find(t => t.operateurId === operateur.id);
        const minutes = traf?._sum.volume ? Number(traf._sum.volume) : 0;

        // Couleur pour l'opérateur
        const color = this.getOperatorColor(index);

        operatorStats.push({
          operatorId: operateur.id,
          name: operateur.nom,
          revenue,
          subscribers,
          minutes,
          color
        });

        // Cumul des totaux
        totalRevenue += revenue;
        totalSubscribers += subscribers;
        totalMinutes += minutes;
      });

      // 6. Construire la réponse finale
      const dashboardStats: DashboardStatsDto = {
        year: currentYear,
        totalRevenue,
        totalSubscribers,
        totalMinutes,
        operatorStats: operatorStats.sort((a, b) => b.revenue - a.revenue) // Tri par chiffre d'affaires décroissant
      };

      return this.formatResponse(
        dashboardStats,
        'Statistiques dashboard',
        `Statistiques ${currentYear} récupérées avec succès`
      );

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques dashboard:', error);
      throw new Error('Impossible de récupérer les statistiques du dashboard');
    }
  }

  /**
   * Récupère la liste des années disponibles dans les données
   */
  async getAvailableYears(): Promise<any> {
    try {
      // 1. Récupérer les années disponibles dans les chiffres d'affaires
      const anneesCA = await this.prisma.chiffreAffaire.findMany({
        select: { annee: true },
        distinct: ['annee'],
        orderBy: { annee: 'asc' }
      });

      // 2. Récupérer les années disponibles dans les abonnements
      const anneesAbo = await this.prisma.abonnement.findMany({
        select: { annee: true },
        distinct: ['annee'],
        orderBy: { annee: 'asc' }
      });

      // 3. Récupérer les années disponibles dans le trafic
      const anneesTrafic = await this.prisma.trafic.findMany({
        select: { annee: true },
        distinct: ['annee'],
        orderBy: { annee: 'asc' }
      });

      // 4. Fusionner et dédoublonner toutes les années
      const allYears = [
        ...anneesCA.map(item => item.annee),
        ...anneesAbo.map(item => item.annee),
        ...anneesTrafic.map(item => item.annee)
      ];

      const uniqueYears = [...new Set(allYears)].sort((a, b) => a - b);
      const currentYear = new Date().getFullYear();

      const availableYearsData: AvailableYearsDto = {
        availableYears: uniqueYears,
        currentYear
      };

      return this.formatResponse(
        availableYearsData,
        'Années disponibles',
        `${uniqueYears.length} années disponibles récupérées avec succès`
      );

    } catch (error) {
      console.error('Erreur lors de la récupération des années disponibles:', error);
      throw new Error('Impossible de récupérer les années disponibles');
    }
  }
}
