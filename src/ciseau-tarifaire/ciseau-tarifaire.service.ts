import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { EffetClubQueryDto } from './dto/effet-club-query.dto';
import { EffetClubService } from '../effet-club/effet-club.service';

interface PaginatedEffetClubResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CiseauTarifaireService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EffetClubService))
    private readonly effetClubService: EffetClubService
  ) {}

  /**
   * Calculer et créer/mettre à jour automatiquement le ciseau tarifaire pour un opérateur et une année
   */
  async calculateCiseauTarifaire(operateurId: number, annee: number) {
    // Récupérer les tarifs de l'opérateur pour cette année (Base et Interconnexion)
    const tarifs = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId,
        annee
      }
    });

    const tarifBase = tarifs.find(t => t.typeTarif === 'Base');
    const tarifInterconnexion = tarifs.find(t => t.typeTarif === 'Interconnexion');

    // Utiliser 0 par défaut si les tarifs sont manquants
    const tarifBaseOffNetHC = tarifBase?.tarifOffNetHeureCreuse ?? 0;
    const tarifBaseOffNetHP = tarifBase?.tarifOffNetHeurePleine ?? 0;
    const tarifBaseOnNetHC = tarifBase?.tarifOnNetHeureCreuse ?? 0;
    const tarifBaseOnNetHP = tarifBase?.tarifOnNetHeurePleine ?? 0;

    const tarifIntercoOffNetHC = tarifInterconnexion?.tarifOffNetHeureCreuse ?? 0;
    const tarifIntercoOffNetHP = tarifInterconnexion?.tarifOffNetHeurePleine ?? 0;
    const tarifIntercoOnNetHC = tarifInterconnexion?.tarifOnNetHeureCreuse ?? 0;
    const tarifIntercoOnNetHP = tarifInterconnexion?.tarifOnNetHeurePleine ?? 0;

    // Calculer les différences
    const differenceOffnetHC = new Decimal(tarifBaseOffNetHC).minus(new Decimal(tarifIntercoOffNetHC));
    const differenceOffnetHP = new Decimal(tarifBaseOffNetHP).minus(new Decimal(tarifIntercoOffNetHP));
    const differenceOnnetHC = new Decimal(tarifBaseOnNetHC).minus(new Decimal(tarifIntercoOnNetHC));
    const differenceOnnetHP = new Decimal(tarifBaseOnNetHP).minus(new Decimal(tarifIntercoOnNetHP));

    // Récupérer le coût depuis la table Parametre pour cette année
    const parametre = await this.prisma.parametre.findUnique({
      where: { annee }
    });

    // Utiliser 0 par défaut si le paramètre est manquant
    const cout = parametre?.cout ?? new Decimal(0);

    // Déterminer si c'est un ciseau tarifaire pour chaque différence OffNet
    // Si differenceOffnetHC >= 0, alors isCiseauOffHC = false, sinon true
    const isCiseauOffHC = differenceOffnetHC.lessThan(0);
    
    // Si differenceOffnetHP >= 0, alors isCiseauOffHP = false, sinon true
    const isCiseauOffHP = differenceOffnetHP.lessThan(0);

    // Vérifier si un ciseau tarifaire existe déjà pour cette année
    const existingCiseau = await this.prisma.ciseauTarifaire.findUnique({
      where: { annee }
    });

    if (existingCiseau) {
      // Mettre à jour
      const updated = await this.prisma.ciseauTarifaire.update({
        where: { annee },
        data: {
          cout,
          differenceOffnetHC,
          differenceOffnetHP,
          differenceOnnetHC,
          differenceOnnetHP,
          isCiseauOffHC,
          isCiseauOffHP
        }
      });
      return this.mapToResponseDto(updated);
    } else {
      // Créer
      const created = await this.prisma.ciseauTarifaire.create({
        data: {
          annee,
          cout,
          differenceOffnetHC,
          differenceOffnetHP,
          differenceOnnetHC,
          differenceOnnetHP,
          isCiseauOffHC,
          isCiseauOffHP
        }
      });
      return this.mapToResponseDto(created);
    }
  }

  /**
   * Calculer le ciseau tarifaire selon le tarif facial (prix de l'offre)
   * tariffacialOffnet = TF OffNet calculé à partir des structures tarifaires des options
   * DiffTariffacialOffnetHC = tariffacialOffnet - Tarif Interconnexion OffNet HC
   * DiffTariffacialOffnetHP = tariffacialOffnet - Tarif Interconnexion OffNet HP
   */
  async calculateCiseauTarifaireAvecTarifFacial(offreId: number) {
    // Récupérer l'offre avec son opérateur
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: {
        id: true,
        nom: true,
        operateurId: true,
        dateDebutValidite: true,
        ciseauTarifaireId: true,
        operateur: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
    }

    // Calculer le tarif facial OffNet en utilisant calculateTF du service effet-club
    const tfOffnet = await this.effetClubService.calculateTF(
      offre.operateurId,
      offreId,
      'OFFNET'
    );

    // Utiliser 0 par défaut si le TF ne peut pas être calculé
    const tariffacialOffnet = new Decimal(tfOffnet || 0);

    // Extraire l'année depuis la date de validité de l'offre
    const annee = offre.dateDebutValidite.getFullYear();

    // Récupérer le tarif d'interconnexion de l'opérateur pour cette année
    const tarifInterconnexion = await this.prisma.tarifInterconnexion.findFirst({
      where: {
        operateurId: offre.operateurId,
        annee,
        typeTarif: 'Interconnexion'
      }
    });

    // Utiliser 0 par défaut si le tarif d'interconnexion n'existe pas
    const tarifIntercoOffNetHC = tarifInterconnexion?.tarifOffNetHeureCreuse ?? 0;
    const tarifIntercoOffNetHP = tarifInterconnexion?.tarifOffNetHeurePleine ?? 0;

    // Calculer les différences avec le tarif facial
    const DiffTariffacialOffnetHC = tariffacialOffnet.minus(new Decimal(tarifIntercoOffNetHC));
    const DiffTariffacialOffnetHP = tariffacialOffnet.minus(new Decimal(tarifIntercoOffNetHP));

    // Récupérer le coût depuis la table Parametre pour cette année
    const parametre = await this.prisma.parametre.findUnique({
      where: { annee }
    });

    // Utiliser 0 par défaut si le paramètre est manquant
    const cout = parametre?.cout ?? new Decimal(0);

    // Déterminer si c'est un ciseau tarifaire pour chaque différence
    // Si DiffTariffacialOffnetHC >= 0, alors isCiseauOffTarifHC = false, sinon true
    const isCiseauOffTarifHC = DiffTariffacialOffnetHC.lessThan(0);
    
    // Si DiffTariffacialOffnetHP >= 0, alors isCiseauOffTarifHP = false, sinon true
    const isCiseauOffTarifHP = DiffTariffacialOffnetHP.lessThan(0);

    // Vérifier si un ciseau tarifaire existe déjà pour cette année
    const existingCiseau = await this.prisma.ciseauTarifaire.findUnique({
      where: { annee }
    });

    let ciseauTarifaire;
    if (existingCiseau) {
      // Mettre à jour avec les valeurs du tarif facial
      ciseauTarifaire = await this.prisma.ciseauTarifaire.update({
        where: { annee },
        data: {
          cout,
          tariffacialOffnet,
          DiffTariffacialOffnetHC,
          DiffTariffacialOffnetHP,
          isCiseauOffTarifHC,
          isCiseauOffTarifHP
        }
      });
    } else {
      // Créer un nouveau ciseau tarifaire avec les valeurs du tarif facial
      ciseauTarifaire = await this.prisma.ciseauTarifaire.create({
        data: {
          annee,
          cout,
          tariffacialOffnet,
          DiffTariffacialOffnetHC,
          DiffTariffacialOffnetHP,
          isCiseauOffTarifHC,
          isCiseauOffTarifHP
        }
      });
    }

    // Lier le ciseau tarifaire à l'offre si ce n'est pas déjà fait
    if (offre.ciseauTarifaireId !== ciseauTarifaire.id) {
      await this.prisma.offre.update({
        where: { id: offreId },
        data: {
          ciseauTarifaireId: ciseauTarifaire.id
        }
      });
    }

    return {
      offre: {
        id: offre.id,
        nom: offre.nom,
        operateur: {
          id: offre.operateur.id,
          nom: offre.operateur.nom
        }
      },
      ciseauTarifaire: this.mapToResponseDtoTarifFacial(ciseauTarifaire),
      resultats: {
        isCiseauOffTarifHC: ciseauTarifaire.isCiseauOffTarifHC,
        isCiseauOffTarifHP: ciseauTarifaire.isCiseauOffTarifHP,
        messageOffTarifHC: ciseauTarifaire.isCiseauOffTarifHC 
          ? 'Ciseau tarifaire détecté pour OffNet HC (tarif facial)' 
          : 'Pas de ciseau tarifaire pour OffNet HC (tarif facial)',
        messageOffTarifHP: ciseauTarifaire.isCiseauOffTarifHP 
          ? 'Ciseau tarifaire détecté pour OffNet HP (tarif facial)' 
          : 'Pas de ciseau tarifaire pour OffNet HP (tarif facial)'
      }
    };
  }

  /**
   * Calculer le ciseau tarifaire selon le revenu moyen OffNet
   * RevenusMoyen = calculé via calculerRevenuMoyen() du service effet-club
   * DiffRevenuOffHC = RevenusMoyen - Tarif Interconnexion OffNet HC
   * DiffRevenuOffHP = RevenusMoyen - Tarif Interconnexion OffNet HP
   */
  async calculateCiseauTarifaireAvecRevenuMoyen(offreId: number) {
    // Récupérer l'offre avec son opérateur et les champs nécessaires pour le calcul
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: {
        id: true,
        nom: true,
        operateurId: true,
        dateDebutValidite: true,
        ciseauTarifaireId: true,
        tp: true,
        tnc: true,
        ep: true,
        operateur: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
    }

    // Extraire les valeurs de l'offre
    const tp = Number(offre.tp || 0);
    const tnc = Number(offre.tnc || 0);
    const ep = Number(offre.ep || 0);

    // Calculer TF OffNet
    const tfOffnet = await this.effetClubService.calculateTF(
      offre.operateurId,
      offreId,
      'OFFNET'
    );

    // Calculer le revenu moyen OffNet en utilisant calculerRevenuMoyen du service effet-club
    const revenuMoyen = await this.effetClubService.calculerRevenuMoyen(
      offre.operateurId,
      offreId,
      'OFFNET'
    );

    // Utiliser 0 par défaut si le revenu moyen ne peut pas être calculé
    const RevenusMoyen = new Decimal(revenuMoyen || 0);

    // Extraire l'année depuis la date de validité de l'offre
    const annee = offre.dateDebutValidite.getFullYear();

    // Récupérer le tarif d'interconnexion de l'opérateur pour cette année
    const tarifInterconnexion = await this.prisma.tarifInterconnexion.findFirst({
      where: {
        operateurId: offre.operateurId,
        annee,
        typeTarif: 'Interconnexion'
      }
    });

    // Utiliser 0 par défaut si le tarif d'interconnexion n'existe pas
    const tarifIntercoOffNetHC = tarifInterconnexion?.tarifOffNetHeureCreuse ?? 0;
    const tarifIntercoOffNetHP = tarifInterconnexion?.tarifOffNetHeurePleine ?? 0;

    // Calculer les différences avec le revenu moyen
    const DiffRevenuOffHC = RevenusMoyen.minus(new Decimal(tarifIntercoOffNetHC));
    const DiffRevenuOffHP = RevenusMoyen.minus(new Decimal(tarifIntercoOffNetHP));

    // Récupérer le coût depuis la table Parametre pour cette année
    const parametre = await this.prisma.parametre.findUnique({
      where: { annee }
    });

    // Utiliser 0 par défaut si le paramètre est manquant
    const cout = parametre?.cout ?? new Decimal(0);

    // Déterminer si c'est un ciseau tarifaire pour chaque différence
    // Si DiffRevenuOffHC >= 0, alors isRevenuOffHC = false, sinon true
    const isRevenuOffHC = DiffRevenuOffHC.lessThan(0);
    
    // Si DiffRevenuOffHP >= 0, alors isRevenuOffHP = false, sinon true
    const isRevenuOffHP = DiffRevenuOffHP.lessThan(0);

    // Récupérer les composantes du calcul du revenu moyen
    // Calculer les sommes nécessaires pour afficher les détails
    const options = await this.prisma.option.findMany({
      where: { offreId },
      include: {
        avantages: {
          include: {
            avantage: {
              select: {
                isGratuit: true
              }
            }
          }
        }
      }
    });

    // Calculer la somme des frais
    const sommeFrais = options.reduce((sum, option) => {
      const frais = Number(option.fraisSouscription || 0);
      const nombre = option.nombreSouscriptions || 0;
      return sum + (frais * nombre);
    }, 0);

    // Calculer la somme des avantages gratuits
    let sommeAvantages = 0;
    for (const option of options) {
      for (const optionAvantage of option.avantages) {
        if (optionAvantage.avantage.isGratuit) {
          sommeAvantages += Number(optionAvantage.valeur || 0);
        }
      }
    }

    // Calculer la somme du trafic option
    const sommeTrafic = options.reduce((sum, option) => {
      return sum + Number(option.traficOption || 0);
    }, 0);

    // Vérifier si un ciseau tarifaire existe déjà pour cette année
    const existingCiseau = await this.prisma.ciseauTarifaire.findUnique({
      where: { annee }
    });

    let ciseauTarifaire;
    if (existingCiseau) {
      // Mettre à jour avec les valeurs du revenu moyen
      ciseauTarifaire = await this.prisma.ciseauTarifaire.update({
        where: { annee },
        data: {
          cout,
          RevenusMoyen,
          DiffRevenuOffHC,
          DiffRevenuOffHP,
          isRevenuOffHC,
          isRevenuOffHP
        }
      });
    } else {
      // Créer un nouveau ciseau tarifaire avec les valeurs du revenu moyen
      ciseauTarifaire = await this.prisma.ciseauTarifaire.create({
        data: {
          annee,
          cout,
          RevenusMoyen,
          DiffRevenuOffHC,
          DiffRevenuOffHP,
          isRevenuOffHC,
          isRevenuOffHP
        }
      });
    }

    // Lier le ciseau tarifaire à l'offre si ce n'est pas déjà fait
    if (offre.ciseauTarifaireId !== ciseauTarifaire.id) {
      await this.prisma.offre.update({
        where: { id: offreId },
        data: {
          ciseauTarifaireId: ciseauTarifaire.id
        }
      });
    }

    return {
      offre: {
        id: offre.id,
        nom: offre.nom,
        operateur: {
          id: offre.operateur.id,
          nom: offre.operateur.nom
        }
      },
      parametresCalcul: {
        tp: Math.round(tp * 100) / 100,
        tnc: Math.round(tnc * 100) / 100,
        ep: Math.round(ep * 100) / 100,
        tfOffnet: Math.round(tfOffnet * 100) / 100,
        sommeFrais: Math.round(sommeFrais * 100) / 100,
        sommeAvantages: Math.round(sommeAvantages * 100) / 100,
        sommeTrafic: Math.round(sommeTrafic * 100) / 100
      },
      ciseauTarifaire: this.mapToResponseDtoRevenuMoyen(ciseauTarifaire),
      resultats: {
        isRevenuOffHC: ciseauTarifaire.isRevenuOffHC,
        isRevenuOffHP: ciseauTarifaire.isRevenuOffHP,
        messageRevenuOffHC: ciseauTarifaire.isRevenuOffHC 
          ? 'Ciseau tarifaire détecté pour OffNet HC (revenu moyen)' 
          : 'Pas de ciseau tarifaire pour OffNet HC (revenu moyen)',
        messageRevenuOffHP: ciseauTarifaire.isRevenuOffHP 
          ? 'Ciseau tarifaire détecté pour OffNet HP (revenu moyen)' 
          : 'Pas de ciseau tarifaire pour OffNet HP (revenu moyen)'
      }
    };
  }

  /**
   * Calculer le ciseau tarifaire pour une offre spécifique
   * Récupère l'opérateur de l'offre et calcule le ciseau tarifaire
   */
  async calculateCiseauTarifaireForOffre(offreId: number) {
    // Récupérer l'offre avec son opérateur
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      include: {
        operateur: true
      }
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
    }

    // Extraire l'année depuis les dates de validité de l'offre
    const annee = offre.dateDebutValidite.getFullYear();

    // Calculer le ciseau tarifaire pour cet opérateur et cette année
    const ciseauTarifaire = await this.calculateCiseauTarifaire(offre.operateurId, annee);

    // Lier le ciseau tarifaire à l'offre si ce n'est pas déjà fait
    if (offre.ciseauTarifaireId !== ciseauTarifaire.id) {
      await this.prisma.offre.update({
        where: { id: offreId },
        data: {
          ciseauTarifaireId: ciseauTarifaire.id
        }
      });
    }

    return {
      offre: {
        id: offre.id,
        nom: offre.nom,
        operateur: {
          id: offre.operateur.id,
          nom: offre.operateur.nom
        }
      },
      ciseauTarifaire,
      resultats: {
        isCiseauOffHC: ciseauTarifaire.isCiseauOffHC,
        isCiseauOffHP: ciseauTarifaire.isCiseauOffHP,
        messageOffHC: ciseauTarifaire.isCiseauOffHC 
          ? 'Ciseau tarifaire détecté pour OffNet HC' 
          : 'Pas de ciseau tarifaire pour OffNet HC',
        messageOffHP: ciseauTarifaire.isCiseauOffHP 
          ? 'Ciseau tarifaire détecté pour OffNet HP' 
          : 'Pas de ciseau tarifaire pour OffNet HP'
      }
    };
  }

  async findAll(query: EffetClubQueryDto): Promise<PaginatedEffetClubResponse> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construction du tri
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    if (limit === 0) {
      // Retourner tous les résultats sans pagination
      const effetsClub = await this.prisma.ciseauTarifaire.findMany({
        orderBy,
        include: {
          offres: {
            select: {
              id: true,
              nom: true,
              operateurId: true
            }
          }
        }
      });

      return {
        data: effetsClub.map(item => this.mapToResponseDto(item)),
        meta: {
          total: effetsClub.length,
          page: 1,
          limit: 0,
          totalPages: 1
        }
      };
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const [effetsClub, total] = await Promise.all([
      this.prisma.ciseauTarifaire.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          offres: {
            select: {
              id: true,
              nom: true,
              operateurId: true
            }
          }
        }
      }),
      this.prisma.ciseauTarifaire.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: effetsClub.map(item => this.mapToResponseDto(item)),
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async findOne(id: number) {
    const ciseauTarifaire = await this.prisma.ciseauTarifaire.findUnique({
      where: { id },
      include: {
        offres: {
          select: {
            id: true,
            nom: true,
            operateurId: true
          }
        }
      }
    });

    if (!ciseauTarifaire) {
      throw new NotFoundException(`Ciseau tarifaire avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(ciseauTarifaire);
  }



  private mapToResponseDto(effetClub: any) {
    const cout = effetClub.cout?.toString() || '0';
    const differenceOffnetHC = effetClub.differenceOffnetHC?.toString() || '0';
    const differenceOffnetHP = effetClub.differenceOffnetHP?.toString() || '0';
    const differenceOnnetHC = effetClub.differenceOnnetHC?.toString() || '0';
    const differenceOnnetHP = effetClub.differenceOnnetHP?.toString() || '0';

    return {
      id: effetClub.id,
      annee: effetClub.annee,
      cout,
      differenceOffnetHC,
      differenceOffnetHP,
      differenceOnnetHC,
      differenceOnnetHP,
      isCiseauOffHC: effetClub.isCiseauOffHC,
      isCiseauOffHP: effetClub.isCiseauOffHP,
      resultats: {
        offnetHC: {
          difference: differenceOffnetHC,
          cout,
          isCiseau: effetClub.isCiseauOffHC,
          resultat: effetClub.isCiseauOffHC 
            ? `Ciseau tarifaire (${differenceOffnetHC} <= ${cout})` 
            : `Pas de ciseau tarifaire (${differenceOffnetHC} > ${cout})`
        },
        offnetHP: {
          difference: differenceOffnetHP,
          cout,
          isCiseau: effetClub.isCiseauOffHP,
          resultat: effetClub.isCiseauOffHP 
            ? `Ciseau tarifaire (${differenceOffnetHP} <= ${cout})` 
            : `Pas de ciseau tarifaire (${differenceOffnetHP} > ${cout})`
        }
      },
      formules: {
        differenceOffnetHC: `Tarif Base OffNet HC - Tarif Interconnexion OffNet HC = ${differenceOffnetHC}`,
        differenceOffnetHP: `Tarif Base OffNet HP - Tarif Interconnexion OffNet HP = ${differenceOffnetHP}`,
        differenceOnnetHC: `Tarif Base OnNet HC - Tarif Interconnexion OnNet HC = ${differenceOnnetHC}`,
        differenceOnnetHP: `Tarif Base OnNet HP - Tarif Interconnexion OnNet HP = ${differenceOnnetHP}`
      },
      offres: effetClub.offres || [],
      createdAt: effetClub.createdAt,
      updatedAt: effetClub.updatedAt
    };
  }

  /**
   * Mapper pour le ciseau tarifaire avec tarif facial
   */
  private mapToResponseDtoTarifFacial(effetClub: any) {
    const cout = effetClub.cout?.toString() || '0';
    const tariffacialOffnet = effetClub.tariffacialOffnet?.toString() || '0';
    const DiffTariffacialOffnetHC = effetClub.DiffTariffacialOffnetHC?.toString() || '0';
    const DiffTariffacialOffnetHP = effetClub.DiffTariffacialOffnetHP?.toString() || '0';

    return {
      id: effetClub.id,
      annee: effetClub.annee,
      cout,
      tariffacialOffnet,
      DiffTariffacialOffnetHC,
      DiffTariffacialOffnetHP,
      isCiseauOffTarifHC: effetClub.isCiseauOffTarifHC,
      isCiseauOffTarifHP: effetClub.isCiseauOffTarifHP,
      resultats: {
        offnetTarifHC: {
          tariffacial: tariffacialOffnet,
          difference: DiffTariffacialOffnetHC,
          cout,
          isCiseau: effetClub.isCiseauOffTarifHC,
          resultat: effetClub.isCiseauOffTarifHC 
            ? `Ciseau tarifaire (${DiffTariffacialOffnetHC} <= ${cout})` 
            : `Pas de ciseau tarifaire (${DiffTariffacialOffnetHC} > ${cout})`
        },
        offnetTarifHP: {
          tariffacial: tariffacialOffnet,
          difference: DiffTariffacialOffnetHP,
          cout,
          isCiseau: effetClub.isCiseauOffTarifHP,
          resultat: effetClub.isCiseauOffTarifHP 
            ? `Ciseau tarifaire (${DiffTariffacialOffnetHP} <= ${cout})` 
            : `Pas de ciseau tarifaire (${DiffTariffacialOffnetHP} > ${cout})`
        }
      },
      formules: {
        tariffacialOffnet: `TF OffNet (moyenne des valeurs tarifaires des options) = ${tariffacialOffnet}`,
        DiffTariffacialOffnetHC: `Tarif Facial OffNet - Tarif Interconnexion OffNet HC = ${DiffTariffacialOffnetHC}`,
        DiffTariffacialOffnetHP: `Tarif Facial OffNet - Tarif Interconnexion OffNet HP = ${DiffTariffacialOffnetHP}`
      },
      offres: effetClub.offres || [],
      createdAt: effetClub.createdAt,
      updatedAt: effetClub.updatedAt
    };
  }

  /**
   * Mapper pour le ciseau tarifaire avec revenu moyen
   */
  private mapToResponseDtoRevenuMoyen(effetClub: any) {
    const cout = effetClub.cout?.toString() || '0';
    const RevenusMoyen = effetClub.RevenusMoyen?.toString() || '0';
    const DiffRevenuOffHC = effetClub.DiffRevenuOffHC?.toString() || '0';
    const DiffRevenuOffHP = effetClub.DiffRevenuOffHP?.toString() || '0';

    return {
      id: effetClub.id,
      annee: effetClub.annee,
      cout,
      RevenusMoyen,
      DiffRevenuOffHC,
      DiffRevenuOffHP,
      isRevenuOffHC: effetClub.isRevenuOffHC,
      isRevenuOffHP: effetClub.isRevenuOffHP,
      resultats: {
        offnetHC: {
          revenusmoyen: RevenusMoyen,
          difference: DiffRevenuOffHC,
          cout,
          isCiseau: effetClub.isRevenuOffHC,
          resultat: effetClub.isRevenuOffHC 
            ? `Ciseau tarifaire (${DiffRevenuOffHC} <= ${cout})` 
            : `Pas de ciseau tarifaire (${DiffRevenuOffHC} > ${cout})`
        },
        offnetHP: {
          revenusmoyen: RevenusMoyen,
          difference: DiffRevenuOffHP,
          cout,
          isCiseau: effetClub.isRevenuOffHP,
          resultat: effetClub.isRevenuOffHP 
            ? `Ciseau tarifaire (${DiffRevenuOffHP} <= ${cout})` 
            : `Pas de ciseau tarifaire (${DiffRevenuOffHP} > ${cout})`
        }
      },
      formules: {
        RevenusMoyen: `Revenu Moyen OffNet = (TP*TF*(1+TNC)*(1+EP) + Σ(frais)) / (TP + sommeAvantages + sommeTrafic) = ${RevenusMoyen}`,
        DiffRevenuOffHC: `Revenu Moyen - Tarif Interconnexion OffNet HC = ${DiffRevenuOffHC}`,
        DiffRevenuOffHP: `Revenu Moyen - Tarif Interconnexion OffNet HP = ${DiffRevenuOffHP}`
      },
      offres: effetClub.offres || [],
      createdAt: effetClub.createdAt,
      updatedAt: effetClub.updatedAt
    };
  }
}
